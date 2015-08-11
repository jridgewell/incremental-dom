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
import { updateAttribute } from './attributes';


// For https://github.com/esperantojs/esperanto/issues/187
var dummy;


/**
 * The offset in the virtual element declaration where the attributes are
 * specified.
 * @const {number}
 */
var ATTRIBUTES_OFFSET_INTERNAL = 3;


/**
 * The offset in the updateAttributes call where the attributes are specified.
 * @const {number}
 */
var ATTRIBUTES_OFFSET_EXTERNAL = 1;


/**
 * Updates the changed attributes for an Element.
 * @param {!Element} node The element to update.
 * @param {Array<*>} attributes Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 */
var alignAttributesWithDOM = function(node, attributes) {
  var newAttrs = getData(node).newAttrs;
  var attr;

  for (attr in newAttrs) {
    newAttrs[attr] = undefined;
  }

  for (var i = 0; i < attributes.length; i += 2) {
    newAttrs[attributes[i]] = attributes[i + 1];
  }

  for (attr in newAttrs) {
    updateAttribute(node, attr, newAttrs[attr]);
  }
};


/**
 * Used by changedAttributes.
 * Exposed privately so that the public updateAttributes may modify the index
 * of the first name/value attribute pair.
 */
var attributesOffset = ATTRIBUTES_OFFSET_INTERNAL;


/**
 * Checks to see if one or more attributes have changed for a given
 * Element. When any have changed, it will return the attributes array.
 *
 * This function is called in the context of the Element and the arguments from
 * elementOpen-like function so that the arguments are not de-optimized.
 *
 * @this {Element} The Element to check for changed attributes.
 * @param {*} unused1
 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 * @return {?Array<*>} The changed attributes, if any.
 */
var changedAttributes = function(unused1, var_args) {
  var attrsArr = getData(this).attrsArr;
  var i = attributesOffset;
  var j = 0;
  var changed;

  for (; i < arguments.length; i += 1, j += 1) {
    if (attrsArr[j] !== arguments[i]) {
      changed = attrsArr;
      break;
    }
  }

  for (; i < arguments.length; i += 1, j += 1) {
    attrsArr[j] = arguments[i];
  }

  if (j < attrsArr.length) {
    changed = attrsArr;
    attrsArr.length = j;
  }

  return changed;
};


/**
 * Sets the static attributes for an Element.
 * @param {!Element} node The element to update.
 * @param {Array<*>} attributes Attribute name/value pairs of the static attributes
 *     for the Element.
 */
var staticAttributes = function(node, statics) {
  for (var i = 0; i < statics.length; i += 2) {
    updateAttribute(node, statics[i], statics[i + 1]);
  }
}


/**
 * Updates the attributes for an Element.
 * @param {!Element} node The element to update.
 * @param {Array<*>} attributes Attribute name/value pairs of the dynamic attributes
 *     for the Element.
 */
var updateAttributes = function(node, var_args) {
  attributesOffset = ATTRIBUTES_OFFSET_EXTERNAL;

  var changed = changedAttributes.apply(node, arguments);
  if (changed) {
    alignAttributesWithDOM(node, changed);
  }

  attributesOffset = ATTRIBUTES_OFFSET_INTERNAL;
};


/** */
export {
  alignAttributesWithDOM,
  changedAttributes,
  staticAttributes,
  updateAttributes
};

