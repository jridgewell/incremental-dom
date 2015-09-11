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
class Context {
  walker: TreeWalker;
  doc: Document;
  nsStack_: Array<?string>;
  prevContext: Context;
  created: ?Array<Node>;
  deleted: ?Array<Node>;

  constructor(node: Element|DocumentFragment, prevContext: Context) {
    this.walker = new TreeWalker(node);
    this.doc = node.ownerDocument;
    this.nsStack_ = [];
    this.prevContext = prevContext;
    this.created = notifications.nodesCreated ? [] : null;
    this.deleted = notifications.nodesDeleted ? [] : null;
  }

  /**
   * The current namespace to create Elements in.
   */
  getCurrentNamespace(): ?string {
    return this.nsStack_[this.nsStack_.length - 1];
  }


  /**
   * Enters an Element namespace, so descending Elements are created
   * in the same namespace.
   */
  enterNamespace(namespace: ?string) {
    this.nsStack_.push(namespace);
  }


  /**
   * Exits the current namespace
   */
  exitNamespace() {
    this.nsStack_.pop();
  }


  /**
   * Records the Node as being created for later notifications.
   */
  markCreated(node: Node) {
    if (this.created) {
      this.created.push(node);
    }
  }


  /**
   * Records the Node as being deleted for later notifications.
   */
  markDeleted(node: Node) {
    if (this.deleted) {
      this.deleted.push(node);
    }
  }


  /**
   * Notifies about nodes that were created or deleted during the patch
   * operation.
   */
  notifyChanges() {
    if (this.created && this.created.length > 0) {
      notifications.nodesCreated(this.created);
    }

    if (this.deleted && this.deleted.length > 0) {
      notifications.nodesDeleted(this.deleted);
    }
  }
}


/**
 * The current context.
 */
var context: Context;


/**
 * Enters a new patch context.
 */
var enterContext = function(node: Element|DocumentFragment) {
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
var getContext = function(): Context {
  return context;
};


/** */
export {
  enterContext,
  restoreContext,
  getContext
};
