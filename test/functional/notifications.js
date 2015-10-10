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

import {
    patch,
    text,
    elementVoid,
    symbols,
    attributes,
    notifications
} from '../../index';


describe('notification hooks', () => {
  var sandbox = sinon.sandbox.create();
  var container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    sandbox.restore();
  });

  describe('for when nodes are created and added to DOM', () => {
    beforeEach(() => {
      notifications.nodesCreated = sandbox.spy((nodes)=> {
        expect(nodes[0].node.parentNode).to.not.equal(null);
      });
    });

    afterEach(() => {
      notifications.nodesCreated = null;
    });

    it('should be called for elements', () => {
      patch(container, function render() {
        elementVoid('div', 'key', ['staticName', 'staticValue']);
      });
      var el = container.childNodes[0];

      expect(notifications.nodesCreated).to.have.been.calledOnce;
      expect(notifications.nodesCreated).calledWith([{
        node: el,
        parent: container,
        key: 'key',
        tag: 'div'
      }]);
    });

    it('should be called for text', () => {
      patch(container, function render() {
        text('hello');
      });
      var el = container.childNodes[0];

      expect(notifications.nodesCreated).to.have.been.calledOnce;
      expect(notifications.nodesCreated).calledWith([{
        node: el,
        parent: container,
        key: null,
        tag: '#text'
      }]);
    });
  });

  describe('for when nodes are deleted from the DOM', () => {
    var txtEl;
    var divEl;

    function render(withTxt) {
      if (withTxt) {
        txtEl = text('hello');
      } else {
        divEl = elementVoid('div', 'key2', ['staticName', 'staticValue']);
      }
    }

    function empty() {}

    beforeEach(() => {
      notifications.nodesDeleted = sandbox.spy((nodes)=> {
        expect(nodes[0].node.parentNode).to.equal(null);
      });
    });

    afterEach(() => {
      notifications.nodesDeleted = null;
    });

    it('should be called for detached element', () => {
      patch(container, render, false);
      var el = container.childNodes[0];
      patch(container, empty);

      expect(notifications.nodesDeleted).to.have.been.calledOnce;
      expect(notifications.nodesDeleted).calledWith([{
        node: el,
        parent: container
      }]);
    });

    it('should be called for detached text', () => {
      patch(container, render, true);
      var el = container.childNodes[0];
      patch(container, empty);

      expect(notifications.nodesDeleted).to.have.been.calledOnce;
      expect(notifications.nodesDeleted).calledWith([{
        node: el,
        parent: container
      }]);
    });

    it('should be called for replaced element', () => {
      patch(container, render, false);
      var el = container.childNodes[0];
      patch(container, render, true);

      expect(notifications.nodesDeleted).to.have.been.calledOnce;
      expect(notifications.nodesDeleted).calledWith([{
        node: el,
        parent: container
      }]);
    });

    it('should be called for removed text', () => {
      patch(container, render, true);
      var el = container.childNodes[0];
      patch(container, render, false);

      expect(notifications.nodesDeleted).to.have.been.calledOnce;
      expect(notifications.nodesDeleted).calledWith([{
        node: el,
        parent: container
      }]);
    });

  });

  describe('for when Elements are reordered', () => {

    function render(first) {
      if (first) {
        elementVoid('div', 'keyA', ['staticName', 'staticValue']);
      }
      elementVoid('div', 'keyB')
      if (!first) {
        elementVoid('div', 'keyA', ['staticName', 'staticValue']);
      }
    }

    beforeEach(() => {
      notifications.nodesCreated = sandbox.spy();
      notifications.nodesDeleted = sandbox.spy();
    });

    afterEach(() => {
      notifications.nodesCreated = null;
      notifications.nodesDeleted = null;
    });

    it('should not call the nodesCreated callback', () => {
      patch(container, render, true);
      var el = container.childNodes[0];
      notifications.nodesCreated.reset();

      patch(container, render, false);

      expect(notifications.nodesCreated).not.to.be.called;
    });

    it('should not call the nodesDeleted callback', () => {
      patch(container, render, true);
      var el = container.childNodes[0];
      patch(container, render, false);

      expect(notifications.nodesDeleted).not.to.be.called;
    });
  });
});
