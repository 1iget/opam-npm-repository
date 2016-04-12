(function() {
  var XMLFragment;
  var __hasProp = Object.prototype.hasOwnProperty;
  XMLFragment = function(parent, name, attributes, text) {
    this.parent = parent;
    this.name = name || '';
    this.attributes = attributes || {};
    this.value = text || '';
    this.children = [];
    return this;
  };
  XMLFragment.prototype.element = function(name, attributes) {
    var child;
    if (this.value) {
      throw new Error("Text nodes cannot have child nodes");
    }
    if (!(typeof name !== "undefined" && name !== null)) {
      throw new Error("Missing element name");
    }
    if (!String(name).match("^" + this.val.Name + "$")) {
      throw new Error("Invalid element name: " + name);
    }
    child = new XMLFragment(this, name, attributes);
    this.children.push(child);
    return child;
  };
  XMLFragment.prototype.text = function(value) {
    var child;
    if (this.value) {
      throw new Error("Text nodes cannot have child nodes");
    }
    if (!(typeof value !== "undefined" && value !== null)) {
      throw new Error("Missing element text");
    }
    if (!String(value).match("^" + this.val.EntityValue + "$") && !String(value).match(this.val.CDATA)) {
      throw new Error("Invalid element text: " + value);
    }
    child = new XMLFragment(this, '', {}, value);
    this.children.push(child);
    return child;
  };
  XMLFragment.prototype.up = function() {
    var _ref;
    if (!(typeof (_ref = this.parent) !== "undefined" && _ref !== null)) {
      throw new Error("This node has no parent");
    }
    return this.parent;
  };
  XMLFragment.prototype.attribute = function(name, value) {
    if (this.value) {
      throw new Error("Text nodes cannot have attributes");
    }
    if (!(typeof name !== "undefined" && name !== null)) {
      throw new Error("Missing attribute name");
    }
    if (!String(name).match("^" + this.val.Name + "$")) {
      throw new Error("Invalid attribute name: " + name);
    }
    if (!(typeof value !== "undefined" && value !== null)) {
      throw new Error("Missing attribute value");
    }
    if (!String(value).match("^" + this.val.AttValue + "$")) {
      throw new Error("Invalid attribute value: " + value);
    }
    this.attributes[name] = value;
    return this;
  };
  XMLFragment.prototype.toString = function(options, level) {
    var _i, _len, _ref, attName, attValue, child, indent, newline, pretty, r, space;
    pretty = (typeof options !== "undefined" && options !== null) && options.pretty || false;
    indent = (typeof options !== "undefined" && options !== null) && options.indent || '  ';
    newline = (typeof options !== "undefined" && options !== null) && options.newline || '\n';
    level || (level = 0);
    space = new Array(level + 1).join(indent);
    r = '';
    if (pretty) {
      r += space;
    }
    if (!this.value) {
      r += '<' + this.name;
    } else {
      r += this.value;
    }
    _ref = this.attributes;
    for (attName in _ref) {
      if (!__hasProp.call(_ref, attName)) continue;
      attValue = _ref[attName];
      if (this.name === '!DOCTYPE') {
        r += ' ' + attValue;
      } else {
        r += ' ' + attName + '="' + attValue + '"';
      }
    }
    if (this.children.length === 0) {
      if (!this.value) {
        r += (function() {
          if (this.name === '?xml') {
            return '?>';
          } else if (this.name === '!DOCTYPE') {
            return '>';
          } else {
            return '/>';
          }
        }).call(this);
      }
      if (pretty) {
        r += newline;
      }
    } else {
      r += '>';
      if (pretty) {
        r += newline;
      }
      _ref = this.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        r += child.toString(options, level + 1);
      }
      if (pretty) {
        r += space;
      }
      r += '</' + this.name + '>';
      if (pretty) {
        r += newline;
      }
    }
    return r;
  };
  XMLFragment.prototype.ele = function(name, attributes) {
    return this.element(name, attributes);
  };
  XMLFragment.prototype.txt = function(value) {
    return this.text(value);
  };
  XMLFragment.prototype.att = function(name, value) {
    return this.attribute(name, value);
  };
  XMLFragment.prototype.e = function(name, attributes) {
    return this.element(name, attributes);
  };
  XMLFragment.prototype.t = function(value) {
    return this.text(value);
  };
  XMLFragment.prototype.a = function(name, value) {
    return this.attribute(name, value);
  };
  XMLFragment.prototype.u = function() {
    return this.up;
  };
  XMLFragment.prototype.val = {};
  XMLFragment.prototype.val.Space = "(?:\u0020|\u0009|\u000D|\u000A)+";
  XMLFragment.prototype.val.Char = "\u0009|\u000A|\u000D|[\u0020-\uD7FF]|[\uE000-\uFFFD]";
  XMLFragment.prototype.val.NameStartChar = ":|[A-Z]|_|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|" + "[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|" + "[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]";
  XMLFragment.prototype.val.NameChar = ":|[A-Z]|_|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|" + "[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|" + "[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]" + "-|\.|[0-9]|\u00B7|[\u0300-\u036F]|[\u203F-\u2040]";
  XMLFragment.prototype.val.CharRef = "&#[0-9]+;|&#x[0-9a-fA-F]+;";
  XMLFragment.prototype.val.CharData = "(?![^<&]*]]>[^<&]*)[^<&]*";
  XMLFragment.prototype.val.Name = XMLFragment.prototype.val.NameStartChar + '(?:' + XMLFragment.prototype.val.NameChar + ')*';
  XMLFragment.prototype.val.NMToken = '(?:' + XMLFragment.prototype.val.NameChar + ')+';
  XMLFragment.prototype.val.EntityRef = '&' + XMLFragment.prototype.val.Name + ';';
  XMLFragment.prototype.val.Reference = '&' + XMLFragment.prototype.val.Name + ';' + '|' + XMLFragment.prototype.val.CharRef;
  XMLFragment.prototype.val.PEReference = '%' + XMLFragment.prototype.val.Name + ';';
  XMLFragment.prototype.val.EntityValue = '(?:[^%&"]|%' + XMLFragment.prototype.val.Name + ';|&' + XMLFragment.prototype.val.Name + ';)*';
  XMLFragment.prototype.val.AttValue = '(?:[^<&"]|' + XMLFragment.prototype.val.Reference + ')*';
  XMLFragment.prototype.val.SystemLiteral = '[^"]*';
  XMLFragment.prototype.val.PubIDChar = "\u0020|\u000D|\u000A|[a-zA-Z0-9]|[-'()+,./:=?;!*#@$_%]";
  XMLFragment.prototype.val.PubIDLiteral = '(?:' + XMLFragment.prototype.val.PubIDChar + ')*';
  XMLFragment.prototype.val.CommentChar = '(?!-)' + '(?:' + XMLFragment.prototype.val.Char + ')';
  XMLFragment.prototype.val.Comment = '<!--' + '(?:' + XMLFragment.prototype.val.CommentChar + '|' + '-' + XMLFragment.prototype.val.CommentChar + ')*' + '-->';
  XMLFragment.prototype.val.VersionNum = '1\.[0-9]+';
  XMLFragment.prototype.val.EncName = '[A-Za-z](?:[A-Za-z0-9\._]|-)*';
  XMLFragment.prototype.val.ExternalID = '(?:' + 'SYSTEM' + XMLFragment.prototype.val.Space + XMLFragment.prototype.val.SystemLiteral + ')|';
  '(?:' + 'PUBLIC' + XMLFragment.prototype.val.Space + XMLFragment.prototype.val.PubIDLateral + XMLFragment.prototype.val.Space + XMLFragment.prototype.val.SystemLiteral;
  XMLFragment.prototype.val.CDATA = /^\<!\[CDATA\[.*?\]\]\>$/;
  module.exports = XMLFragment;
}).call(this);
