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


/**
 * Keeps track of information needed to perform diffs for a given DOM node.
 * @param {!string} nodeName
 * @param {?string=} key
 * @constructor
 */
class NodeData {
  attrs: {[key: string]: any};
  attrsArr: Array<any>;
  newAttrs: {[key: string]: any};
  key: ?string;
  keyMap: ?{[key: string]: Element};
  keyMapValid: boolean;
  lastVisitedChild: ?Node;
  nodeName: string;
  text: ?string;

  constructor(nodeName: string, key: ?string) {
    /**
     * The attributes and their values.
     */
    this.attrs = {};

    /**
     * An array of attribute name/value pairs, used for quickly diffing the
     * incomming attributes to see if the DOM node's attributes need to be
     * updated.
     */
    this.attrsArr = [];

    /**
     * The incoming attributes for this Node, before they are updated.
     */
    this.newAttrs = {};

    /**
     * The key used to identify this node, used to preserve DOM nodes when they
     * move within their parent.
     */
    this.key = key;

    /**
     * Keeps track of children within this node by their key.
     */
    this.keyMap = null;

    /**
     * Whether or not the keyMap is currently valid.
     */
    this.keyMapValid = true;

    /**
     * The last child to have been visited within the current pass.
     */
    this.lastVisitedChild = null;

    /**
     * The node name for this node.
     */
    this.nodeName = nodeName;

    this.text = null;
  }
}


/**
 * Initializes a NodeData object for a Node.
 */
var initData = function(node: Node, nodeName: string, key: ?key): NodeData {
  var data = new NodeData(nodeName, key);
  node['__incrementalDOMData'] = data;
  return data;
};


/**
 * Retrieves the NodeData object for a Node, creating it if necessary.
 */
var getData = function(node: Node): NodeData {
  var data = node['__incrementalDOMData'];

  if (!data) {
    var nodeName = node.nodeName.toLowerCase();
    var key = null;

    if (node instanceof Element) {
      key = node.getAttribute('key');
    }

    data = initData(node, nodeName, key);
  }

  return data;
};


/** */
export {
  getData,
  initData
};
