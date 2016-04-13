(function() {
  var XMLBuilder, XMLFragment;
  var __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  XMLFragment = require('./XMLFragment');
  XMLBuilder = function() {
    XMLBuilder.__super__.constructor.call(this, null, '', {}, '');
    return this;
  };
  __extends(XMLBuilder, XMLFragment);
  XMLBuilder.prototype.begin = function(name, xmldec, doctype) {
    var _ref, att, child, root;
    if (!name) {
      throw new Error("Root element needs a name");
    }
    this.children = [];
    if ((typeof xmldec !== "undefined" && xmldec !== null) && !(typeof (_ref = xmldec.version) !== "undefined" && _ref !== null)) {
      throw new Error("Version number is required");
    }
    if ((typeof doctype !== "undefined" && doctype !== null) && !(typeof (_ref = doctype.name) !== "undefined" && _ref !== null)) {
      throw new Error("Document name is required");
    }
    if (typeof xmldec !== "undefined" && xmldec !== null) {
      if (!String(xmldec.version).match("^" + this.val.VersionNum + "$")) {
        throw new Error("Invalid version number: " + xmldec.version);
      }
      att = {
        version: xmldec.version
      };
      if (typeof (_ref = xmldec.encoding) !== "undefined" && _ref !== null) {
        if (!String(xmldec.encoding).match("^" + this.val.EncName + "$")) {
          throw new Error("Invalid encoding: " + xmldec.encoding);
        }
        att.encoding = xmldec.encoding;
      }
      if (xmldec.standalone) {
        att.standalone = xmldec.standalone ? "yes" : "no";
      }
      child = new XMLFragment(this, '?xml', att);
      this.children.push(child);
    }
    if (typeof doctype !== "undefined" && doctype !== null) {
      if (!String(doctype.name).match("^" + this.val.Name + "$")) {
        throw new Error("Invalid document name: " + doctype.name);
      }
      att = {
        name: doctype.name
      };
      if (typeof (_ref = doctype.ext) !== "undefined" && _ref !== null) {
        if (!String(doctype.ext).match("^" + this.val.ExternalID + "$")) {
          throw new Error("Invalid external ID: " + doctype.ext);
        }
        att.ext = doctype.ext;
      }
      child = new XMLFragment(this, '!DOCTYPE', att);
      this.children.push(child);
    }
    root = new XMLFragment(this, name, {});
    this.children.push(root);
    return root;
  };
  XMLBuilder.prototype.toString = function(options) {
    var _i, _len, _ref, child, r;
    r = '';
    _ref = this.children;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      r += child.toString(options);
    }
    return r;
  };
  module.exports = XMLBuilder;
}).call(this);
