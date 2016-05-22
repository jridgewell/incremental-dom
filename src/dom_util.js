/**
 * Copyright 2016 The Incremental DOM Authors. All Rights Reserved.
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


import { getData } from "./node_data";

/**
 * @param {!Node} node
 * @return {boolean} True if the node the root of a document, false otherwise.
 */
const isDocumentRoot = function(node) {
  // For ShadowRoots, check if they are a DocumentFragment instead of if they
  // are a ShadowRoot so that this can work in 'use strict' if ShadowRoots are
  // not supported.
  return node instanceof Document || node instanceof DocumentFragment;
};


/**
 * @param {!NodeData} startData The node to start at, inclusive.
 * @param {!NodeData} rootData The root ancestor to get until, exclusive.
 * @return {!Array<!NodeData>} The ancestry of DOM nodes.
 */
const getAncestry = function(startData, rootData) {
  const ancestry = [];
  let cur = startData;

  while (cur !== rootData) {
    ancestry.push(cur);
    cur = cur.parentData;
  }

  return ancestry;
};


/**
 * @param {!Node} node
 * @return {!Node} The root node of the DOM tree that contains node.
 */
const getRoot = function(node) {
  let cur = node;
  let prev = cur;

  while (cur) {
    prev = cur;
    cur = cur.parentNode;
  }

  return prev;
};


/**
 * @param {!Node} node The node to get the activeElement for.
 * @return {?Element} The activeElement in the Document or ShadowRoot
 *     corresponding to node, if present.
 */
const getActiveElement = function(node) {
  const root = getRoot(node);
  return isDocumentRoot(root) ? root.activeElement : null;
};


/**
 * Gets the path of nodes that contain the focused node in the same document as
 * a reference node, up until the root.
 * @param {!NodeData} nodeData The root node to get the activeElement for.
 * @return {!Array<Node>}
 */
const getFocusedPath = function(nodeData) {
  const node = nodeData.node;
  const activeElement = getActiveElement(node);

  if (!activeElement || !node.contains(activeElement)) {
    return [];
  }

  return getAncestry(getData(activeElement), nodeData);
};


/**
 * Like insertBefore, but instead instead of moving the desired node, instead
 * moves all the other nodes after.
 * @param {?NodeData} parentData
 * @param {!NodeData} nodeData
 * @param {?NodeData} referenceNodeData
 */
const moveBefore = function(parentData, nodeData, referenceNodeData) {
  const insertReferenceData = nodeData.nextData;
  let cur = referenceNodeData;

  while (cur !== nodeData) {
    const next = cur.nextData;
    parentData.insertBefore(cur, insertReferenceData);
    cur = next;
  }
};


/** */
export {
  getFocusedPath,
  moveBefore
};

