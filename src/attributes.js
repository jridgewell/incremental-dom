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

import { getData } from './node_data';
import { symbols } from './symbols';


/**
 * Applies an attribute or property to a given Element. If the value is null
 * or undefined, it is removed from the Element. Otherwise, the value is set
 * as an attribute.
 */
var applyAttr = function(el: Element, name: string, value: ?(boolean|number|string)) {
  if (value == null) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, value);
  }
};

/**
 * Applies a property to a given Element.
 */
var applyProp = function(el: Element, name: string, value: any) {
  el[name] = value;
};


/**
 * Applies a style to an Element. No vendor prefix expansion is done for
 * property names/values.
 */
var applyStyle = function(el: Element, name: string, style: ?(string|{[key: string]: string})) {
  if (typeof style === 'string') {
    el.style.cssText = style;
  } else {
    el.style.cssText = '';

    for (var prop in style) {
      el.style[prop] = style[prop];
    }
  }
};


/**
 * Updates a single attribute on an Element.
 */
var applyAttributeTyped = function(el: Element, name: string, value: any) {
  var type = typeof value;

  if (type === 'object' || type === 'function') {
    applyProp(el, name, value);
  } else {
    applyAttr(el, name, value);
  }
};


/**
 * Calls the appropriate attribute mutator for this attribute.
 */
var updateAttribute = function(el: Element, name: string, value: any) {
  var data = getData(el);
  var attrs = data.attrs;

  if (attrs[name] === value) {
    return;
  }

  var mutator = mutators[name] || mutators[symbols.all];
  mutator(el, name, value);

  attrs[name] = value;
};


/**
 * Exposes our default attribute mutators publicly, so they may be used in
 * custom mutators.
 */
var defaults: {[key: string]: Function(el: Element, name: string, value: any)} = {
  applyAttr: applyAttr,
  applyProp: applyProp,
  applyStyle: applyStyle
};


/**
 * A publicly mutable object to provide custom mutators for attributes.
 */
var mutators: {[key: string]: Function(el: Element, name: string, value: any)} = {
  // Special generic mutator that's called for any attribute that does not
  // have a specific mutator.
  [symbols.all]: applyAttributeTyped,

  // Special case the style attribute
  style: applyStyle
};


/** */
export {
  updateAttribute,
  attributes
};
