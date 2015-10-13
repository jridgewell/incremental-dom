(function(scope) {
  var currentParent = null;
  var currentNode = null;
  var previousNode = null;

  var NO_DATA = {
    key: null,
    keyMap: null,
    nodeName: '#invalid'
  };

  function patch(el, fn, data) {
    currentParent = el;
    currentNode = el.firstChild;
    previousNode = null;
    initializeData(el);

    fn(data);
    clearUnvisitedDom();
  }

  var hooks = {
    elementCreated: function(el, initializationData) {}
  };

  function initializeData(node, nodeName, key) {
    if (nodeName === '#text') {
      node['__icData'] = node['__icData'] || {
        nodeName: '#text'
      };
    } else {
      node['__icData'] = node['__icData'] || {
        nodeName: nodeName,
        key: key,
        keyMap: null,
        attrs: Object.create(null)
      };
    }
  }

  function alignWithDom(nodeName, key, initializationData) {
    var data = (currentNode && currentNode['__icData']) || NO_DATA;
    var matchingNode;

    if (nodeName === data.nodeName && key == data.key) {
      matchingNode = currentNode;
    } else {
      var parentData = currentParent['__icData'];
      var keyMap = parentData.keyMap;

      if (keyMap) {
        matchingNode = keyMap[key];
      }

      if (!matchingNode) {
        if (nodeName === '#text') {
          matchingNode = document.createTextNode('');
        } else {
          matchingNode = document.createElement(nodeName);
          hooks.elementCreated(matchingNode, initializationData);
        }

        initializeData(matchingNode, nodeName, key);
      }

      if (data.key) {
        currentParent.replaceChild(matchingNode, currentNode);
      } else {
        currentParent.insertBefore(matchingNode, currentNode);
      }
    }

    return currentNode = matchingNode;
  }

  function clearUnvisitedDom() {
    var lastChild = currentParent.lastChild || previousNode;

    while(lastChild !== previousNode) {
      currentParent.removeChild(lastChild);
      lastChild = currentParent.lastChild;
    }
  }

  function enterElement() {
    currentParent = currentNode;
    currentNode = currentNode.firstChild;
  }

  function exitElement() {
    previousNode = currentParent;
    currentNode = currentParent.nextSibling;
    currentParent = currentParent.parentNode;
  }

  function skipNode() {
    previousNode = currentNode;
    currentNode = currentNode.nextSibling;
  }























  hooks.elementCreated = function(el, statics) {
    for (var attr in statics) {
      applyAttr(el, attr, statics[attr]);
    }
  };

  function applyAttr(el, name, value) {
    var type = typeof value;
    if (type === 'object' || type === 'function') {
      el[name] = value;
    } else if (value !== undefined) {
      el.setAttribute(name, value);
    } else {
      el.removeAttribute(name);
    }
  }

  var EMPTY_ATTRS = Object.create(null);
  function elementOpen(tagName, key, statics, attributes) {
    var node = alignWithDom(tagName, key, statics);
    enterElement();

    var attrs = node['__icData'].attrs;
    var attr, value;
    attributes = attributes || EMPTY_ATTRS;

    for (attr in attrs) {
      value = attrs[attr]

      if (value !== undefined && !(attr in attributes)) {
        applyAttr(node, attr);
      }
    }

    for (attr in attributes) {
      value = attributes[attr];

      if (attrs[attr] !== value) {
        applyAttr(node, attr, value);
        attrs[attr] = value;
      }
    }
  }

  function elementClose(tagName) {
    clearUnvisitedDom();
    exitElement();
  }

  function elementVoid(tagName, key, statics) {
    elementOpen.apply(null, arguments);
    elementClose.apply(null, arguments);
  }

  function text(value) {
    var node = alignWithDom('#text', null, null);
    skipNode();

    if (node.data !== value) {
      node.data = value;
    }
  }

  scope.Exploration = {
    patch: patch,
    elementOpen: elementOpen,
    elementClose: elementClose,
    elementVoid: elementVoid,
    text: text
  };
})(window);
