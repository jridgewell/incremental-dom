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
    elementVoid,
    mutators
} from '../../index';


describe('library hooks', () => {
  var container;
  var sandbox = sinon.sandbox.create();
  var stub;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    sandbox.restore();
  });

  describe('for deciding how attributes are set', () => {
    function render(dynamicValue) {
      elementVoid('div', null, ['staticName', 'staticValue'],
          'dynamicName', dynamicValue);
    }

    beforeEach(() => {
      stub = sinon.stub();
    });

    describe('for static attributes', () => {
      it('should call specific setter', () => {
        mutators.attributes.staticName = stub;
        patch(container, render, 'dynamicValue');
        var el = container.childNodes[0];

        expect(stub).calledWith(el, 'staticName', 'staticValue');
        mutators.attributes.staticName = null;
      });

      it('should call generic setter', () => {
        mutators.attributes.__all__ = stub;
        patch(container, render, 'dynamicValue');
        var el = container.childNodes[0];

        expect(stub).calledWith(el, 'staticName', 'staticValue');
        mutators.attributes.__all__ = null;
      });

      it('should prioritize specific setter over generic', () => {
        var allStub = sinon.stub();
        mutators.attributes.__all__ = allStub;
        mutators.attributes.staticName = stub;

        patch(container, render, 'dynamicValue');

        expect(stub).calledOnce;
        expect(allStub).notCalled;

        mutators.attributes.__all__ = null;
        mutators.attributes.staticName = null;
      });
    });

    describe('for specific dynamic attributes', () => {
      beforeEach(() => {
        stub = sinon.stub();
        mutators.attributes.dynamicName = stub;
      });

      afterEach(() => {
        mutators.attributes.dynamicName = null;
      });

      it('should be called for dynamic attributes', () => {
        patch(container, render, 'dynamicValue');
        var el = container.childNodes[0];

        expect(stub).calledWith(el, 'dynamicName', 'dynamicValue');
      });

      it('should be called on attribute update', () => {
        patch(container, render, 'dynamicValueOne');
        patch(container, render, 'dynamicValueTwo');
        var el = container.childNodes[0];

        expect(stub).calledTwice;
        expect(stub).calledWith(el, 'dynamicName', 'dynamicValueTwo');
      });

      it('should allow only be called when attributes change', () => {
        patch(container, render, 'dynamicValue');
        patch(container, render, 'dynamicValue');
        var el = container.childNodes[0];

        expect(stub).calledOnce;
        expect(stub).calledWith(el, 'dynamicName', 'dynamicValue');
      });

      it('should prioritize specific setter over generic', () => {
        var allStub = sinon.stub();
        mutators.attributes.__all__ = allStub;
        mutators.attributes.dynamicValue = stub;

        patch(container, render, 'dynamicValue');

        expect(stub).calledOnce;
        expect(allStub).notCalled;

        mutators.attributes.__all__ = null;
        mutators.attributes.dynamicValue = null;
      });
    });

    describe('for generic dynamic attributes', () => {
      var allStub;
      beforeEach(() => {
        stub = sinon.stub();
        mutators.attributes.__all__ = stub;
      });

      afterEach(() => {
        mutators.attributes.__all__ = null;
      });

      it('should be called for dynamic attributes', () => {
        patch(container, render, 'dynamicValue');
        var el = container.childNodes[0];

        expect(stub).calledWith(el, 'dynamicName', 'dynamicValue');
      });

      it('should be called on attribute update', () => {
        patch(container, render, 'dynamicValueOne');
        patch(container, render, 'dynamicValueTwo');
        var el = container.childNodes[0];

        expect(stub).calledWith(el, 'dynamicName', 'dynamicValueTwo');
      });

      it('should allow only be called when attributes change', () => {
        patch(container, render, 'dynamicValue');
        patch(container, render, 'dynamicValue');
        var el = container.childNodes[0];

        expect(stub).calledWith(el, 'dynamicName', 'dynamicValue');
      });
    });
  });
});

