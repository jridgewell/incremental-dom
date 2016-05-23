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

import { createMap } from './util';


/**
 * The property name where we store Incremental DOM data.
 */
const DATA_PROP = '__incrementalDOMData';


/**
 * Keeps track of information needed to perform diffs for a given DOM node.
 * @param {!Node} node The Node to import.
 * @param {!string} nodeName
 * @param {?string=} key
 * @param {?string=} namespace
 * @constructor
 */
function NodeData(node, nodeName, key, namespace) {
  this.node = node;

  this.nextData = null;
  this.previousData = null;
  this.firstData = null;
  this.lastData = null;
  this.parentData = null;

  /**
   * The attributes and their values.
   * @const {!Object<string, *>}
   */
  this.attrs = createMap();

  /**
   * An array of attribute name/value pairs, used for quickly diffing the
   * incomming attributes to see if the DOM node's attributes need to be
   * updated.
   * @const {Array<*>}
   */
  this.attrsArr = [];

  /**
   * The incoming attributes for this Node, before they are updated.
   * @const {!Object<string, *>}
   */
  this.newAttrs = createMap();

  /**
   * Whether or not the statics have been applied for the node yet.
   * {boolean}
   */
  this.staticsApplied = false;

  /**
   * The key used to identify this node, used to preserve DOM nodes when they
   * move within their parent.
   * @const
   */
  this.key = key;

  /**
   * Keeps track of children within this node by their key.
   * {!Object<string, !NodeData>}
   */
  this.keyMap = createMap();

  /**
   * Whether or not the keyMap is currently valid.
   * @type {boolean}
   */
  this.keyMapValid = true;

  /**
   * Whether or the associated node is, or contains, a focused Element.
   * @type {boolean}
   */
  this.focused = false;

  /**
   * The node name for this node.
   * @const {string}
   */
  this.nodeName = nodeName;
  this.namespace = namespace;

  /**
   * @type {?string}
   */
  this.text = null;
}

NodeData.prototype.insertBefore = function(newNodeData, referenceNodeData) {
  this.node.insertBefore(newNodeData.node, referenceNodeData ? referenceNodeData.node : null);

  const oldParentData = newNodeData.parentData;
  if (oldParentData) {
    oldParentData._removeChild(newNodeData);
  }

  newNodeData.parentData = this;
  if (referenceNodeData) {
    const previousData = referenceNodeData.previousData;
    newNodeData.nextData = referenceNodeData;
    referenceNodeData.previousData = newNodeData;
    if (previousData) {
      previousData.nextData = newNodeData;
      newNodeData.previousData = previousData;
    }
  } else {
    const lastData = this.lastData;
    this.lastData = newNodeData;
    if (lastData) {
      lastData.nextData = newNodeData;
      newNodeData.previousData = lastData;
    }
  }
  if (this.firstData === referenceNodeData) {
    this.firstData = newNodeData;
  }
}

NodeData.prototype.replaceChild = function(newChildData, referenceChildData) {
  this.node.replaceChild(newChildData.node, referenceChildData.node);

  const oldParentData = newChildData.parentData;
  if (oldParentData) {
    oldParentData._removeChild(newChildData);
  }

  const previousData = referenceChildData.previousData;
  const nextData = referenceChildData.nextData;

  referenceChildData.parentData = null;
  referenceChildData.nextData = null;
  referenceChildData.previousData = null;

  newChildData.parentData = this;
  newChildData.nextData = nextData;
  newChildData.previousData = previousData;
  if (nextData) {
    nextData.previousData = newChildData;
  } else {
    this.lastData = newChildData;
  }
  if (previousData) {
    previousData.nextData = newChildData;
  } else {
    this.firstData = newChildData;
  }
}

NodeData.prototype.removeChild = function(childData) {
  this.node.removeChild(childData.node);
  this._removeChild(childData);
}

NodeData.prototype._removeChild = function(childData) {
  const nextData = childData.nextData;
  const previousData = childData.previousData;

  childData.parentData = null;
  childData.nextData = null;
  childData.previousData = null;

  if (nextData) {
    nextData.previousData = previousData;
  } else {
    this.lastData = previousData;
  }
  if (previousData) {
    previousData.nextData = nextData;
  } else {
    this.firstData = nextData;
  }
}


/**
 * Initializes a NodeData object for a Node.
 *
 * @param {Node} node The node to initialize data for.
 * @param {string} nodeName The node name of node.
 * @param {?string=} key The key that identifies the node.
 * @param {?string=} namespace
 * @return {!NodeData} The newly initialized data object
 */
const initData = function(node, nodeName, key, namespace) {
  const data = new NodeData(node, nodeName, key, namespace);
  node[DATA_PROP] = data;
  return data;
};


/**
 * Retrieves the NodeData object for a Node, creating it if necessary.
 *
 * @param {?Node} node The Node to retrieve the data for.
 * @return {?NodeData} The NodeData for this Node.
 */
const getData = function(node) {
  if (node) {
    importNode(node);
    return node[DATA_PROP];
  }

  return null;
};


/**
 * Imports node and its subtree, initializing caches.
 *
 * @param {?Node} node The Node to import.
 * @param {?NodeData} parentData
 */
const importNode = function(node, parentData) {
  if (node[DATA_PROP]) {
    return;
  }

  const nodeName = node.nodeName.toLowerCase();
  const isElement = node instanceof Element;
  const key = isElement ? node.getAttribute('key') : null;
  const namespace = isElement ? node.namespaceURI : '';
  const data = initData(node, nodeName, key, namespace);
  data.parentData = parentData;

  if (key && parentData) {
    parentData.keyMap[key] = data;
  }

  let prevData = null;
  let child = node.firstChild;
  for (; child; child = child.nextSibling) {
    importNode(child, data);
    const childData = getData(child);
    if (prevData) {
      prevData.nextData = childData;
    }
    childData.previousData = prevData;
    prevData = childData;
  }

  if (isElement) {
    data.firstData = getData(node.firstChild);
    data.lastData = getData(node.lastChild);

    const attributes = node.attributes;
    const attrs = data.attrs;
    const newAttrs = data.newAttrs;
    const attrsArr = data.attrsArr;

    for (let i = 0; i < attributes.length; i += 1) {
      const attr = attributes[i];
      const name = attr.name;
      const value = attr.value;

      attrs[name] = value;
      newAttrs[name] = undefined;
      attrsArr.push(name);
      attrsArr.push(value);
    }
  }
};


/** */
export {
  getData,
  initData,
  importNode
};
