# Represents a fragment of an XMl document
class XMLFragment


  # Regular expressions to validate tokens
  # See: http://www.w3.org/TR/xml/ 
  # Supplementary Unicode code points not supported
  val: {}
    

  # Initializes a new instance of `XMLFragment`
  #
  # `parent` the parnt node
  # `name` element name
  # `attributes` an object containing name/value pairs of attributes
  # `text` element text
  constructor: (parent, name, attributes, text) ->
    @parent = parent
    @name = name or ''
    @attributes = attributes or {}
    @value = text or ''
    @children = []


  # Creates an XML prolog with one or both of the following options
  #
  # `xmldec.version` A version number string, e.g. 1.0
  # `xmldec.encoding` Encoding declaration, e.g. UTF-8
  # `xmldec.standalone` standalone document declaration: true or false
  #
  # `doctype.name` name of the root element
  # `doctype.ext` the external subset containing markup declarations
  prolog: (xmldec, doctype) ->
    if @value
      throw new Error "Text nodes cannot have child nodes"
    if not xmldec? and not doctype?
      throw new Error "Either xmldec or doctype is required"
    if xmldec? and not xmldec.version?
      throw new Error "Version number is required"
    if doctype? and not doctype.name?
      throw new Error "Dcument name is required"

    if xmldec?
      if not xmldec.version.match "^" + @val.VersionNum + "$"
        throw new Error "Invalid version number: " + xmldec.version
      att = { version: xmldec.version }

      if xmldec.encoding?
        if not xmldec.encosing.match "^" + @val.EncName + "$"
          throw new Error "Invalid encoding: " + xmldec.encoding
        att.encoding = xmldec.encoding

      if xmldec.standalone
        att.standalone = if xmldec.standalone then "yes" else "no"

      child = new XMLFragment @, '?xml', att
      @children.push child

    if doctype?
      if not doctype.name.match "^" + @val.Name + "$"
        throw new Error "Invalid document name: " + doctype.name
      att = { name: doctype.name }

      if doctype.ext?
        if not doctype.ext.match "^" + @val.ExternalID + "$"
          throw new Error "Invalid external ID: " + doctype.ext
        att.ext = doctype.ext

      child = new XMLFragment @, '!DOCTYPE', att
      @children.push child

    return child


  # Creates a child element node
  #
  # `name` name of the node
  # `attributes` an object containing name/value pairs of attributes
  element: (name, attributes) ->
    if @value
      throw new Error "Text nodes cannot have child nodes"
    if not name?
      throw new Error "Missing element name"
    if not name.match "^" + @val.Name + "$"
      throw new Error "Invalid element name: " + name

    child = new XMLFragment @, name, attributes
    @children.push child
    return child


  # Creates a text node
  #
  # `value` element text
  text: (value) ->
    if @value
      throw new Error "Text nodes cannot have child nodes"
    if not value?
      throw new Error "Missing element text"
    if not value.match "^" + @val.EntityValue + "$"
      throw new Error "Invalid element text: " + value

    child = new XMLFragment @, '', {}, value
    @children.push child
    return child


  # Gets the parent node
  up: () ->
    if not @parent?
      throw new Error "This node has no parent"
    return @parent;


  # Adds or modifies an attribute
  #
  # `name` attribute name
  # `value` attribute value
  attribute: (name, value) ->
    if @value
      throw new Error "Text nodes cannot have attributes"
    if not name?
      throw new Error "Missing attribute name"
    if not name.match "^" + @val.Name + "$"
      throw new Error "Invalid attribute name: " + name
    if not value?
      throw new Error "Missing attribute value"
    if not value.match "^" + @val.AttValue + "$"
      throw new Error "Invalid attribute value: " + value

    @attributes[name] = value

    return @


  # Converts the XML fragment to string
  #
  # `options.pretty` pretty prints the result
  # `options.indent` indentation for pretty print
  # `options.newline` newline sequence for pretty print
  toString: (options, level) ->
    pretty = options? and options.pretty or false
    indent = options? and options.indent or '  '
    newline = options? and options.newline or '\n'
    level or= 0

    space = new Array(level + 1).join(indent)

    r = ''
    # open tag
    if pretty
      r += space
    if not @value
      r += '<' + @name
    else
      r += @value

    # attributes
    for attName, attValue of @attributes
      if @name == '!DOCTYPE'
        r += ' ' + attValue
      else
        r += ' ' + attName + '="' + attValue + '"'

    if @children.length == 0
      # empty element
      if not @value
        r += if @name == '?xml' then '?>' else if @name == '!DOCTYPE' then '>' else '/>'
      if pretty
        r += newline
    else
      r += '>'
      if pretty
        r += newline
      # inner tags
      for child in @children
        r += child.toString options, level + 1
      # close tag
      if pretty
        r += space
      r += '</' + @name + '>'
      if pretty
        r += newline

    return r


  # aliases
  pro: (xmldec, doctype) -> @prolog xmldec, doctype
  ele: (name, attributes) -> @element name, attributes
  txt: (value) -> @text value
  att: (name, value) -> @attribute name, value
  p: (xmldec, doctype) -> @prolog xmldec, doctype
  e: (name, attributes) -> @element name, attributes
  t: (value) -> @text value
  a: (name, value) -> @attribute name, value
  u: () -> @up

# assign validation strings to the prototype
XMLFragment::val.Space = "(?:\u0020|\u0009|\u000D|\u000A)+"
XMLFragment::val.Char = "\u0009|\u000A|\u000D|[\u0020-\uD7FF]|[\uE000-\uFFFD]"
XMLFragment::val.NameStartChar =
  ":|[A-Z]|_|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|" + 
  "[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|" +
  "[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]"
XMLFragment::val.NameChar =
  ":|[A-Z]|_|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|" +
  "[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|" + 
  "[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]" +
  "-|\.|[0-9]|\u00B7|[\u0300-\u036F]|[\u203F-\u2040]"
XMLFragment::val.CharRef = "&#[0-9]+;|&#x[0-9a-fA-F]+;"
XMLFragment::val.CharData = "(?![^<&]*]]>[^<&]*)[^<&]*"
XMLFragment::val.Name = XMLFragment::val.NameStartChar + '(?:' + XMLFragment::val.NameChar + ')*'
XMLFragment::val.NMToken = '(?:' + XMLFragment::val.NameChar + ')+'
XMLFragment::val.EntityRef = '&' + XMLFragment::val.Name + ';'
XMLFragment::val.Reference = '&' + XMLFragment::val.Name + ';' + '|' + XMLFragment::val.CharRef
XMLFragment::val.PEReference = '%' + XMLFragment::val.Name + ';'
XMLFragment::val.EntityValue =
    '(?:[^%&"]|%' + XMLFragment::val.Name + ';|&' + XMLFragment::val.Name + ';)*'
XMLFragment::val.AttValue =
    '(?:[^<&"]|' + XMLFragment::val.Reference + ')*'
XMLFragment::val.SystemLiteral = '[^"]*'
XMLFragment::val.PubIDChar = "\u0020|\u000D|\u000A|[a-zA-Z0-9]|[-'()+,./:=?;!*#@$_%]"
XMLFragment::val.PubIDLiteral = '(?:' + XMLFragment::val.PubIDChar + ')*'
XMLFragment::val.CommentChar = '(?!-)' + '(?:' + XMLFragment::val.Char + ')'
XMLFragment::val.Comment =
  '<!--' + '(?:' + XMLFragment::val.CommentChar + '|' + 
  '-' + XMLFragment::val.CommentChar + ')*'  + '-->'
XMLFragment::val.VersionNum = '1\.[0-9]+'
XMLFragment::val.EncName = '[A-Za-z](?:[A-Za-z0-9\._]|-)*'
XMLFragment::val.ExternalID = 
  '(?:' + 'SYSTEM' + XMLFragment::val.Space + XMLFragment::val.SystemLiteral + ')|'
  '(?:' + 'PUBLIC' + XMLFragment::val.Space + XMLFragment::val.PubIDLateral +
  XMLFragment::val.Space + XMLFragment::val.SystemLiteral


module.exports = XMLFragment
