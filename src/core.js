/**
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  createElement,
  createText
} from './nodes';
import { getData } from './node_data';
import { Context } from './context';
import {
  assertInPatch,
  assertNoUnclosedTags,
  assertNotInAttributes,
  assertVirtualAttributesClosed,
  assertNoChildrenDeclaredYet,
  assertPatchElementNoExtras,
  setInAttributes,
  setInSkip
} from './assertions';
import {
  getFocusedPath,
  moveBefore
} from './dom_util';


/** @type {?Context} */
let context = null;

/** @type {?NodeData} */
let currentNodeData = null;

/** @type {?NodeData} */
let currentParentData = null;

/** @type {?Document} */
let doc = null;


/**
 * @param {!Array<!NodeData>} focusPath The nodeDatas to mark.
 * @param {boolean} focused Whether or not they are focused.
 */
const markFocused = function(focusPath, focused) {
  for (let i = 0; i < focusPath.length; i += 1) {
    focusPath[i].focused = focused;
  }
};


/**
 * Returns a patcher function that sets up and restores a patch context,
 * running the run function with the provided data.
 * @param {function((!Element|!DocumentFragment),!function(T),T=): ?Node} run
 * @return {function((!Element|!DocumentFragment),!function(T),T=): ?Node}
 * @template T
 */
const patchFactory = function(run) {
  /**
   * TODO(moz): These annotations won't be necessary once we switch to Closure
   * Compiler's new type inference. Remove these once the switch is done.
   *
   * @param {(!Element|!DocumentFragment)} node
   * @param {!function(T)} fn
   * @param {T=} data
   * @return {?Node} node
   * @template T
   */
  const f = function(node, fn, data) {
    const prevContext = context;
    const prevDoc = doc;
    const prevCurrentNode = currentNodeData;
    const prevCurrentParent = currentParentData;
    let previousInAttributes = false;
    let previousInSkip = false;

    context = new Context();
    doc = node.ownerDocument;
    currentParentData = getData(node.parentNode);

    const nodeData = getData(node);

    if (process.env.NODE_ENV !== 'production') {
      previousInAttributes = setInAttributes(false);
      previousInSkip = setInSkip(false);
    }

    const focusPath = getFocusedPath(nodeData);
    markFocused(focusPath, true);
    const retVal = run(node, fn, data);
    markFocused(focusPath, false);

    if (process.env.NODE_ENV !== 'production') {
      assertVirtualAttributesClosed();
      setInAttributes(previousInAttributes);
      setInSkip(previousInSkip);
    }

    context.notifyChanges();

    context = prevContext;
    doc = prevDoc;
    currentNodeData = prevCurrentNode;
    currentParentData = prevCurrentParent;

    return retVal;
  };
  return f;
};


/**
 * Patches the document starting at node with the provided function. This
 * function may be called during an existing patch operation.
 * @param {!Element|!DocumentFragment} node The Element or Document
 *     to patch.
 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
 *     calls that describe the DOM.
 * @param {T=} data An argument passed to fn to represent DOM state.
 * @return {!Node} The patched node.
 * @template T
 */
const patchInner = patchFactory(function(node, fn, data) {
  currentNodeData = getData(node);

  enterNode();
  fn(data);
  exitNode();

  if (process.env.NODE_ENV !== 'production') {
    assertNoUnclosedTags(currentNodeData.node, node);
  }

  return node;
});


/**
 * Patches an Element with the the provided function. Exactly one top level
 * element call should be made corresponding to `node`.
 * @param {!Element} node The Element where the patch should start.
 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
 *     calls that describe the DOM. This should have at most one top level
 *     element call.
 * @param {T=} data An argument passed to fn to represent DOM state.
 * @return {?Node} The node if it was updated, its replacedment or null if it
 *     was removed.
 * @template T
 */
const patchOuter = patchFactory(function(node, fn, data) {
  let startNode = /** @type {!NodeData} */({ nextData: getData(node) });
  let expectedNext = null;
  let expectedPrev = null;

  if (process.env.NODE_ENV !== 'production') {
    expectedNext = getData(node).nextData;
    expectedPrev = getData(node).previousData;
  }

  currentNodeData = startNode;
  fn(data);

  if (process.env.NODE_ENV !== 'production') {
    assertPatchElementNoExtras(startNode, currentNodeData, expectedNext, expectedPrev);
  }

  if (node !== currentNodeData.node) {
    removeChild(currentParentData, getData(node));
  }

  return (startNode === currentNodeData) ? null : currentNodeData.node;
});


/**
 * Checks whether or not the current node matches the specified nodeName and
 * key.
 *
 * @param {!NodeData} nodeData A node to match the data to.
 * @param {?string} nodeName The nodeName for this node.
 * @param {?string=} key An optional key that identifies a node.
 * @return {boolean} True if the node matches, false otherwise.
 */
const matches = function(nodeData, nodeName, key) {
  // Key check is done using double equals as we want to treat a null key the
  // same as undefined. This should be okay as the only values allowed are
  // strings, null and undefined so the == semantics are not too weird.
  return nodeName === nodeData.nodeName && key == nodeData.key;
};


/**
 * Aligns the virtual Element definition with the actual DOM, moving the
 * corresponding DOM node to the correct location or creating it if necessary.
 * @param {string} nodeName For an Element, this should be a valid tag string.
 *     For a Text, this should be #text.
 * @param {?string=} key The key used to identify this element.
 */
const alignWithDOM = function(nodeName, key) {
  if (currentNodeData && matches(currentNodeData, nodeName, key)) {
    return;
  }

  const keyMap = currentParentData.keyMap;
  let nodeData;

  // Check to see if the node has moved within the parent.
  if (key) {
    const keyNodeData = keyMap[key];
    if (keyNodeData) {
      if (matches(keyNodeData, nodeName, key)) {
        nodeData = keyNodeData;
      } else if (keyNodeData === currentNodeData) {
        context.markDeleted(keyNodeData.node);
      } else {
        removeChild(currentParentData, keyNodeData);
      }
    }
  }

  // Create the node if it doesn't exist.
  if (!nodeData) {
    if (nodeName === '#text') {
      nodeData = createText(doc, currentParentData);
    } else {
      nodeData = createElement(doc, currentParentData, nodeName, key);
    }

    if (key) {
      keyMap[key] = nodeData;
    }

    context.markCreated(nodeData.node);
  }

  // Re-order the node into the right position, preserving focus if either
  // node or currentNodeData are focused by making sure that they are not detached
  // from the DOM.
  if (nodeData.focused) {
    // Move everything else before the node.
    moveBefore(currentParentData, nodeData, currentNodeData);
  } else if (currentNodeData && currentNodeData.key && !currentNodeData.focused) {
    // Remove the currentNodeData, which can always be added back since we hold a
    // reference through the keyMap. This prevents a large number of moves when
    // a keyed item is removed or moved backwards in the DOM.
    currentParentData.replaceChild(nodeData, currentNodeData);
    currentParentData.keyMapValid = false;
  } else {
    currentParentData.insertBefore(nodeData, currentNodeData);
  }

  currentNodeData = nodeData;
};


/**
 * @param {?NodeData} parentData
 * @param {?NodeData} childData
 */
const removeChild = function(parentData, childData) {
  parentData.removeChild(childData);
  context.markDeleted(/** @type {!Node}*/(childData.node));

  const key = childData.key;
  if (key) {
    delete parentData.keyMap[key];
  }
};


/**
 * Clears out any unvisited Nodes, as the corresponding virtual element
 * functions were never called for them.
 */
const clearUnvisitedDOM = function() {
  const keyMap = currentParentData.keyMap;
  const keyMapValid = currentParentData.keyMapValid;
  let childData = currentParentData.lastData;
  let key;

  if (childData === currentNodeData && keyMapValid) {
    return;
  }

  while (childData !== currentNodeData) {
    removeChild(currentParentData, childData);
    childData = currentParentData.lastData;
  }

  // Clean the keyMap, removing any unusued keys.
  if (!keyMapValid) {
    for (key in keyMap) {
      childData = keyMap[key];
      if (childData.parentData !== currentParentData) {
        context.markDeleted(childData.node);
        delete keyMap[key];
      }
    }

    currentParentData.keyMapValid = true;
  }
};


/**
 * Changes to the first child of the current node.
 */
const enterNode = function() {
  currentParentData = currentNodeData;
  currentNodeData = null;
};


/**
 * @return {?Node} The next Node to be patched.
 */
const getNextNode = function() {
  if (currentNodeData) {
    return currentNodeData.nextData;
  } else {
    return currentParentData.firstData;
  }
};


/**
 * Changes to the next sibling of the current node.
 */
const nextNode = function() {
  currentNodeData = getNextNode();
};


/**
 * Changes to the parent of the current node, removing any unvisited children.
 */
const exitNode = function() {
  clearUnvisitedDOM();

  currentNodeData = currentParentData;
  currentParentData = currentParentData.parentData;
};


/**
 * Makes sure that the current node is an Element with a matching tagName and
 * key.
 *
 * @param {string} tag The element's tag.
 * @param {?string=} key The key used to identify this element. This can be an
 *     empty string, but performance may be better if a unique value is used
 *     when iterating over an array of items.
 * @return {!Element} The corresponding Element.
 */
const elementOpen = function(tag, key) {
  nextNode();
  alignWithDOM(tag, key);
  enterNode();
  return currentParentData;
};


/**
 * Closes the currently open Element, removing any unvisited children if
 * necessary.
 *
 * @return {!Element} The corresponding Element.
 */
const elementClose = function() {
  if (process.env.NODE_ENV !== 'production') {
    setInSkip(false);
  }

  exitNode();
  return currentNodeData;
};


/**
 * Makes sure the current node is a Text node and creates a Text node if it is
 * not.
 *
 * @return {!Text} The corresponding Text Node.
 */
const text = function() {
  nextNode();
  alignWithDOM('#text', null);
  return currentNodeData;
};


/**
 * Gets the current Element being patched.
 * @return {!Element}
 */
const currentElement = function() {
  if (process.env.NODE_ENV !== 'production') {
    assertInPatch('currentElement', context);
    assertNotInAttributes('currentElement');
  }
  return /** @type {!Element} */(currentParentData.node);
};


/**
 * @return {Node} The Node that will be evaluated for the next instruction.
 */
const currentPointer = function() {
  if (process.env.NODE_ENV !== 'production') {
    assertInPatch('currentPointer', context);
    assertNotInAttributes('currentPointer');
  }
  const nextNode = getNextNode();
  return nextNode ? nextNode.node : null;
};


/**
 * Skips the children in a subtree, allowing an Element to be closed without
 * clearing out the children.
 */
const skip = function() {
  if (process.env.NODE_ENV !== 'production') {
    assertNoChildrenDeclaredYet('skip', currentNodeData && currentNodeData.node);
    setInSkip(true);
  }
  currentNodeData = currentParentData.lastData;
};


/**
 * Skips the next Node to be patched, moving the pointer forward to the next
 * sibling of the current pointer.
 */
const skipNode = nextNode;


/** */
export {
  elementOpen,
  elementClose,
  text,
  patchInner,
  patchOuter,
  currentElement,
  currentPointer,
  skip,
  skipNode
};
