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
    elementOpen,
    elementClose,
    skip,
    text
} from '../../index';

describe('skip', () => {
  var container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should keep any DOM nodes in the subtree', () => {
    function render(data) {
      elementOpen('div');
        if (data.skip) {
          skip();
        } else {
          text('some ');
          text('text');
        }
      elementClose('div');
    }
    patch(container, render, { skip: false });
    patch(container, render, { skip: true });

    expect(container.textContent).to.equal('some text');
  });

  it('should allow updating DOM nodes', () => {
    function render(data) {
      elementOpen('div');
        if (data.skip) {
          text('one ');
          text('more');
          skip();
        } else {
          text('some ');
          text('text');
        }
      elementClose('div');
    }
    patch(container, render, { skip: false });
    patch(container, render, { skip: true });

    expect(container.textContent).to.equal('one more');
  });

  it('should allow a call in any order', () => {
    function render(data) {
      elementOpen('div');
        if (data.skip) {
          skip();
          text('some ');
        } else {
          text('some ');
          text('text');
        }
      elementClose('div');
    }
    patch(container, render, { skip: false });
    patch(container, render, { skip: true });

    expect(container.textContent).to.equal('some text');
  });

});

