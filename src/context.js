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

import { TreeWalker } from './tree_walker';
import { notifications } from './notifications';


/**
 * Keeps track of the state of a patch.
 * @param {!Element|!DocumentFragment} node The root Node of the subtree the
 *     is for.
 * @param {?Context} prevContext The previous context.
 * @constructor
 */
function Context(node, prevContext) {
  /**
   * @const {TreeWalker}
   */
  this.walker = new TreeWalker(node);

  /**
   * @const {Document}
   */
  this.doc = node.ownerDocument;

  /**
   * @const {?Context}
   */
  this.prevContext = prevContext;

  /**
   * @type {?Array<{node: !Node, parent: !Node, tag: !string, key: ?string}>}
   */
  this.created = notifications.nodesCreated && [];

  /**
   * @type {?Array<{node: !Node, parent: !Node}>}
   */
  this.deleted = notifications.nodesDeleted && [];
}


/**
 * @param {!Node} node
 * @param {!Node} parent
 * @param {!string} tag
 * @param {?string=} key
 */
Context.prototype.markCreated = function(node, parent, tag, key) {
  if (this.created) {
    this.created.push({
      node: node,
      parent: parent,
      tag: tag,
      key: key
    });
  }
};


/**
 * @param {!Node} node
 * @param {!Node} parent
 */
Context.prototype.markDeleted = function(node, parent) {
  if (this.deleted) {
    this.deleted.push({
      node: node,
      parent: parent
    });
  }
};


/**
 * Notifies about nodes that were created during the patch opearation.
 */
Context.prototype.notifyChanges = function() {
  if (this.created && this.created.length > 0) {
    notifications.nodesCreated(this.created);
  }

  if (this.deleted && this.deleted.length > 0) {
    notifications.nodesDeleted(this.deleted);
  }
};


/**
 * The current context.
 * @type {?Context}
 */
var context;


/**
 * Enters a new patch context.
 * @param {!Element|!DocumentFragment} node
 */
var enterContext = function(node) {
  context = new Context(node, context);
};


/**
 * Restores the previous patch context.
 */
var restoreContext = function() {
  context = context.prevContext;
};


/**
 * Gets the current patch context.
 * @return {?Context}
 */
var getContext = function() {
  return context;
};


/** */
export {
  enterContext,
  restoreContext,
  getContext
};
