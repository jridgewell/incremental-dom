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

import { updateAttribute } from './attributes';
import {
    getData,
    initData
} from './node_data';
import { getNamespaceForTag } from './namespace';


// For https://github.com/esperantojs/esperanto/issues/187
var dummy;


/**
 * Creates an Element.
 */
var createElement = function(doc: Document, tag: string, key: ?string, statics: Array<any>): Element {
  var namespace = getNamespaceForTag(tag);
  var el;

  if (namespace) {
    el = doc.createElementNS(namespace, tag);
  } else {
    el = doc.createElement(tag);
  }

  initData(el, tag, key);

  if (statics) {
    for (var i = 0; i < statics.length; i += 2) {
      updateAttribute(el, /** @type {!string}*/(statics[i]), statics[i + 1]);
    }
  }

  return el;
};


/**
 * Creates a Node, either a Text or an Element depending on the node name
 * provided.
 */
var createNode = function(doc: Document, nodeName: string, key: ?string, statics: Array<any>): Node {
  if (nodeName === '#text') {
    return doc.createTextNode('');
  }

  return createElement(doc, nodeName, key, statics);
};


/**
 * Creates a mapping that can be used to look up children using a key.
 */
var createKeyMap = function(node: Node): {[key: string]: Element} {
  var map = {};
  var children = node.children;
  var count = children.length;

  for (var i = 0; i < count; i += 1) {
    var child = children[i];
    var key = getData(child).key;

    if (key) {
      map[key] = child;
    }
  }

  return map;
};


/**
 * Retrieves the mapping of key to child node for a given Element, creating it
 * if necessary.
 */
var getKeyMap = function(node: Node): {[key: string]: Element} {
  var data = getData(node);

  if (!data.keyMap) {
    data.keyMap = createKeyMap(node);
  }

  return data.keyMap;
};


/**
 * Retrieves a child from the parent with the given key.
 */
var getChild = function(parent: Node, key: string): ?Element {
  return getKeyMap(parent)[key];
};


/**
 * Registers an element as being a child. The parent will keep track of the
 * child using the key. The child can be retrieved using the same key using
 * getKeyMap. The provided key should be unique within the parent Element.
 */
var registerChild = function(parent: Node, key: string, child: Element) {
  getKeyMap(parent)[key] = child;
};


/** */
export {
  createNode,
  getChild,
  registerChild
};
