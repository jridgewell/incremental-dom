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

import { notifications } from './notifications';
import { getData } from './node_data';


/**
 * The current context.
 * @type {?Context}
 */
var context;

var doc;
var currentNode;
var currentParent;
var previousNode;

/**
 * Changes to the first child of the current node.
 */
var firstChild = function() {
  previousNode = null;
  currentParent = currentNode;
  currentNode = currentNode.firstChild;
};


/**
 * Changes to the next sibling of the current node.
 */
var nextSibling = function() {
  previousNode = currentNode;
  currentNode = currentNode.nextSibling;
};


/**
 * Changes to the parent of the current node, removing any unvisited children.
 */
var parentNode = function() {
  getData(currentParent).lastVisitedChild = previousNode;
  previousNode = currentParent;
  currentNode = currentParent;
  currentParent = currentParent.parentNode;
};

var getCurrentNode = function() {
  return currentNode;
}

var getDoc = function() {
  return doc;
}

var getCurrentParent = function() {
  return currentParent;
}

var setCurrentNode = function(node) {
  currentNode = node;
}

/**
 * Enters a new patch context.
 * @param {!Element|!DocumentFragment} node
 */
var enterContext = function(node) {
  var old = {
    previousNode: previousNode,
    currentParent: currentParent,
    currentNode: currentNode,
    doc: doc
  };

  previousNode = null;
  currentParent = null;
  currentNode = node;
  doc = node.ownerDocument;

  return old;
};


/**
 * Restores the previous patch context.
 */
var restoreContext = function(old) {
  previousNode = old.previousNode;
  currentParent = old.currentParent;
  currentNode = old.currentNode;
  doc = old.doc;
};


/** */
export {
  enterContext,
  restoreContext,
  firstChild,
  nextSibling,
  parentNode,
  getCurrentNode,
  getDoc,
  getCurrentParent,
  setCurrentNode
};
