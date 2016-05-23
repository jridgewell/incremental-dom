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

import { initData } from './node_data';


/**
 * Gets the namespace to create an element (of a given tag) in.
 * @param {string} tag The tag to get the namespace for.
 * @param {?NodeData} parentData
 * @return {?string} The namespace to create the tag in.
 */
const getNamespaceForTag = function(tag, parentData) {
  if (tag === 'svg') {
    return 'http://www.w3.org/2000/svg';
  }

  if (parentData.nodeName === 'foreignObject') {
    return null;
  }

  return parentData.namespace;
};


/**
 * Creates an Element.
 * @param {Document} doc The document with which to create the Element.
 * @param {?NodeData} parentData
 * @param {string} tag The tag for the Element.
 * @param {?string=} key A key to identify the Element.
 * @return {!NodeData}
 */
const createElement = function(doc, parentData, tag, key) {
  const namespace = getNamespaceForTag(tag, parentData);
  let el;

  if (namespace) {
    el = doc.createElementNS(namespace, tag);
  } else {
    el = doc.createElement(tag);
  }

  return initData(el, tag, key, namespace);
};


/**
 * Creates a Text Node.
 * @param {Document} doc The document with which to create the Element.
 * @return {!NodeData}
 */
const createText = function(doc) {
  const node = doc.createTextNode('');
  return initData(node, '#text', null, null);
};


/** */
export {
  createElement,
  createText
};
