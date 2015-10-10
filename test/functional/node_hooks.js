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
    nodes
} from '../../index';


describe('node hooks', () => {
  var sandbox = sinon.sandbox.create();
  var container;
  var allSpy;
  var stub;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    sandbox.restore();
  });

  function render() {
    elementVoid('div', 'key', ['staticName', 'staticValue']);
  }

  describe('for determining the namespace', () => {
    beforeEach(() => {
      sandbox.stub(nodes, 'namespaceForTag').returns('http://www.w3.org/2000/svg');
    });

    it('should use the returned namespace during creation', () => {
      patch(container, render);
      var el = container.childNodes[0];

      expect(el.namespaceURI).to.equal('http://www.w3.org/2000/svg');
    });
  });

  describe('for creating nodes', () => {
    var p = document.createElement('p');

    beforeEach(() => {
      sandbox.stub(nodes, 'createElement').returns(p);
    });

    it('should use the returned tag as the node', () => {
      patch(container, render);
      var el = container.childNodes[0];

      expect(el).to.equal(p);
    });
  });
});
