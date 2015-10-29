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
import {
  createMap,
  KeySet
} from './util';
import { assertUniqueKey } from './assertions';


/**
 * Creates an Element.
 * @param {Document} doc The document with which to create the Element.
 * @param {string} tag The tag for the Element.
 * @param {?string=} key A key to identify the Element.
 * @return {!Element}
 */
var createElement = function(doc, tag, key) {
  var namespace = getNamespaceForTag(tag);
  var el;

  if (namespace) {
    el = doc.createElementNS(namespace, tag);
  } else {
    el = doc.createElement(tag);
  }

  return el;
};


/**
 * Creates a Node, either a Text or an Element depending on the node name
 * provided.
 * @param {Document} doc The document with which to create the Node.
 * @param {string} nodeName The tag if creating an element or #text to create
 *     a Text.
 * @param {?string=} key A key to identify the Element.
 * @param {?Array<*>=} statics The static data to initialize the Node
 *     with. For an Element, an array of attribute name/value pairs of
 *     the static attributes for the Element.
 * @return {!Node}
 */
var createNode = function(doc, nodeName, key, statics) {
  var node;
  if (nodeName === '#text') {
    node = doc.createTextNode('');
  } else {
    node = createElement(doc, nodeName, key);
  }

  initData(node, nodeName, key);

  if (statics) {
    for (var i = 0; i < statics.length; i += 2) {
      updateAttribute(/** @type {!Element}*/(node),
                      /** @type {!string}*/(statics[i]),
                      statics[i + 1]);
    }
  }

  return node;
};


/**
 * Creates a mapping that can be used to look up children using a key.
 * @param {!Node} el
 * @return {!Object<string, !Element>} A mapping of keys to the children of the
 *     Element.
 */
var createKeyMap = function(el) {
  var map = createMap();
  var children = el.children;
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
 * @param {!Node} el
 * @return {!Object<string, !Node>} A mapping of keys to child Elements
 */
var getKeyMap = function(el) {
  var data = getData(el);

  if (!data.keyMap) {
    data.keyMap = createKeyMap(el);
  }

  return data.keyMap;
};


/**
 * Retrieves a child from the parent with the given key.
 * @param {!Node} parent
 * @param {?string=} key
 * @return {?Element} The child corresponding to the key.
 */
var getChild = function(parent, key) {
  return /** @type {?Element} */(key && getKeyMap(parent)[key]);
};


/**
 * Registers an element as being a child. The parent will keep track of the
 * child using the key. The child can be retrieved using the same key using
 * getKeyMap. The provided key should be unique within the parent Element.
 * @param {!Node} parent The parent of child.
 * @param {string} key A key to identify the child with.
 * @param {!Node} child The child to register.
 */
var registerChild = function(parent, key, child) {
  getKeyMap(parent)[key] = child;
};


/**
 * Asserts that the key has not yet been used for this parent in this patch.
 * @param {!Node} parent the parent node which contains the keyed element.
 * @param {string} key the key to use.
 */
var useKey = function(parent, key) {
  var data = getData(parent);
  if (!data.usedKeys) {
    data.usedKeys = createMap();
  }
  var usedKeys = data.usedKeys;

  assertUniqueKey(key, usedKeys);
  usedKeys[key] = true;
};


/**
 * Resets the currently used keys for the next patch.
 * @param {!Node} parent the parent to clear keys from.
 */
var clearUsedKeys = function(parent) {
  var usedKeys = getData(parent).usedKeys;
  for (var key in usedKeys) {
    delete usedKeys[key];
  }
};


/** */
export {
  createNode,
  getChild,
  registerChild,
  useKey,
  clearUsedKeys
};
