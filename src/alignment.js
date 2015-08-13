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
    createNode,
    getChild,
    registerChild
} from './nodes';
import { getData } from './node_data';
import { getWalker } from './walker';


// For https://github.com/esperantojs/esperanto/issues/187
var dummy;


/**
 * Checks whether or not a given node matches the specified nodeName and key.
 *
 * @param {!Node} node An HTML node, typically an HTMLElement or Text.
 * @param {?string} nodeName The nodeName for this node.
 * @param {?string} key An optional key that identifies a node.
 * @param {?boolen} loose Whether to loosely match nodes based only on the key.
 * @return {boolean} True if the node matches, false otherwise.
 */
var matches = function(node, nodeName, key, loose) {
  var data = getData(node);

  if (loose && key == data.key) {
    return true;
  }

  // Key check is done using double equals as we want to treat a null key the
  // same as undefined. This should be okay as the only values allowed are
  // strings, null and undefined so the == semantics are not too weird.
  return key == data.key && nodeName === data.nodeName;
};


/**
 * Aligns the virtual Element definition with the actual DOM, moving the
 * corresponding DOM node to the correct location or creating it if necessary.
 * @param {?string} nodeName For an Element, this should be a valid tag string.
 *     For a Text, this should be #text.
 * @param {?string} key The key used to identify this element.
 * @param {?Array<*>} statics For an Element, this should be an array of
 *     name-value pairs.
 * @param {?boolean} loose For an placeholder Element, signifies to loosely
 *     match nodes.
 * @return {!Node} The matching node.
 */
var alignWithDOM = function(nodeName, key, statics, loose) {
  var walker = getWalker();
  var currentNode = walker.currentNode;
  var parent = walker.getCurrentParent();
  var matchingNode;

  // Check to see if we have a node to reuse
  if (currentNode && matches(currentNode, nodeName, key, loose)) {
    matchingNode = currentNode;
  } else {
    var existingNode = key && getChild(parent, key);

    // Check to see if the node has moved within the parent or if a new one
    // should be created
    if (existingNode && matches(existingNode, nodeName, key)) {
      matchingNode = existingNode;
    } else {
      matchingNode = createNode(walker.doc, nodeName, key, statics);
      if (key) {
        registerChild(parent, key, matchingNode);
      }
    }

    parent.insertBefore(matchingNode, currentNode);
    walker.currentNode = matchingNode;
  }

  return matchingNode;
};


/**
 * Clears out any unvisited Nodes, as the corresponding virtual element
 * functions were never called for them.
 * @param {!Element} node
 */
var clearUnvisitedDOM = function(node) {
  var data = getData(node);
  var length = node.childNodes.length;
  var lastVisited = data.lastVisited;
  data.lastVisited = 0;

  if (length === lastVisited) {
    return;
  }

  while (length > lastVisited) {
    node.removeChild(node.lastChild);
    length -= 1;
  }

  // Invalidate the key map since we removed children. It will get recreated
  // next time we need it.
  data.keyMap = null;
};


/** */
export {
  alignWithDOM,
  clearUnvisitedDOM
};

