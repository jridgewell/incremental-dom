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
import { getContext } from './context';

// For https://github.com/esperantojs/esperanto/issues/187
var dummy;


if (process.env.NODE_ENV !== 'production') {
  /**
  * Makes sure that keyed Element matches the tag name provided.
  */
  var assertKeyedTagMatches = function(node: Element, tag: string, key: ?string) {
    var nodeName = getData(node).nodeName;
    if (nodeName !== tag) {
      throw new Error('Was expecting node with key "' + key + '" to be a ' +
          tag + ', not a ' + nodeName + '.');
    }
  };
}


/**
 * Checks whether or not a given node matches the specified nodeName and key.
 */
var matches = function(node: Node, nodeName: string, key: ?string): boolean {
  var data = getData(node);

  // Key check is done using double equals as we want to treat a null key the
  // same as undefined. This should be okay as the only values allowed are
  // strings, null and undefined so the == semantics are not too weird.
  return key == data.key && nodeName === data.nodeName;
};


/**
 * Aligns the virtual Element definition with the actual DOM, moving the
 * corresponding DOM node to the correct location or creating it if necessary.
 */
var alignWithDOM = function(nodeName: string, key: ?string, statics: ?Array<any>): Node {
  var context = getContext();
  var walker = context.walker;
  var currentNode = walker.currentNode;
  var parent = walker.getCurrentParent();
  var matchingNode;

  // Check to see if we have a node to reuse
  if (currentNode && matches(currentNode, nodeName, key)) {
    matchingNode = currentNode;
  } else {
    var existingNode;
    if (key) {
      existingNode = getChild(parent, key);
    }

    // Check to see if the node has moved within the parent or if a new one
    // should be created
    if (existingNode) {
      if (process.env.NODE_ENV !== 'production') {
        assertKeyedTagMatches(existingNode, nodeName, key);
      }

      matchingNode = existingNode;
    } else {
      matchingNode = createNode(context.doc, nodeName, key, statics);

      if (key) {
        registerChild(parent, key, matchingNode);
      }

      context.markCreated(matchingNode);
    }

    // If the node has a key, remove it from the DOM to prevent a large number
    // of re-orders in the case that it moved far or was completely removed.
    // Since we hold on to a reference through the keyMap, we can always add it
    // back.
    if (currentNode && getData(currentNode).key) {
      parent.replaceChild(matchingNode, currentNode);
      getData(parent).keyMapValid = false;
    } else {
      parent.insertBefore(matchingNode, currentNode);
    }

    walker.currentNode = matchingNode;
  }

  return matchingNode;
};


/**
 * Clears out any unvisited Nodes, as the corresponding virtual element
 * functions were never called for them.
 */
var clearUnvisitedDOM = function(node: Node) {
  var context = getContext();
  var data = getData(node);
  var keyMap = data.keyMap;
  var keyMapValid = data.keyMapValid;
  var lastVisitedChild = data.lastVisitedChild;
  var child = node.lastChild;
  var key;

  data.lastVisitedChild = null;

  if (child === lastVisitedChild && keyMapValid) {
    return;
  }

  while (child !== lastVisitedChild) {
    node.removeChild(child);
    context.markDeleted(child);

    key = getData(child).key;
    if (key) {
      delete keyMap[key];
    }
    child = node.lastChild;
  }

  // Clean the keyMap, removing any unusued keys.
  for (key in keyMap) {
    child = keyMap[key];
    if (!child.parentNode) {
      context.markDeleted(child);
      delete keyMap[key];
    }
  }

  data.keyMapValid = true;
};


/** */
export {
  alignWithDOM,
  clearUnvisitedDOM
};
