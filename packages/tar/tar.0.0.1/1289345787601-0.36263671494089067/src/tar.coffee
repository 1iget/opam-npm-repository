# Require Node.js core modules.
events = require("events")

# Require `node-packet`.
packet = require(__dirname + "/../../node-packet/lib/packet")

module.exports.Writer = class Writer extends events.EventEmitter
  constructor: ->

ustar = new Buffer("ustar", "utf8")

magical = (magic) ->
  for b, i in ustar
    if magic[i] isnt b
      return false
  true

module.exports.Reader = class Reader extends events.EventEmitter
  constructor: ->
    @parser = new packet.Parser()
    @parser.packet("basic", [
      "b8[100]z|utf8()"           # The file name.
      "b8[8]z|utf8()|atoi(8)"     # The file mode as a zero padded octal.
      "b8[8]z|utf8()|atoi(8)"     # The owner uid.
      "b8[8]z|utf8()|atoi(8)"     # The owner gid.
      "b8[12]|utf8()|atoi(8)"     # The size.
      "b8[12]|utf8()|atoi(8)"     # The modified time.
      "b8[8]z|utf8()|atoi(8)"     # The checksum.
      "b8"                        # The type flag.
      "b8[100]z|utf8()"           # The link name.
      "b8[6]"                     # The USTAR magic message.
    ].join(""), @basic)
    @parser.packet("ustar", [
      "b8[2]z|utf8()"             # The USTAR version.
      "b8[32]z|utf8()"            # The user name.
      "b8[32]z|utf8()"            # The group name.
      "b8[8]z|utf8()|atoi(8)"     # The device major number.
      "b8[8]z|utf8()|atoi(8)"     # The device minor number.
      "b8[155]z|utf8()"           # The prefix for the name.
      "x8[12]"                    # Nothing.
    ].join(""),  @ustar)
    @parser.packet("skip", [
      "x8[249]"                   # The remaining bytes if not ustar.
    ].join(""), @skip)
    @reset()

  reset: ->
    @mode     = "start"
    @end      = 0

  basic: (name, mode, uid, gid, size, mtime, checksum, type, linkname, magic, parser) =>
    @header = { name, mode, uid, gid, size, mtime, checksum, type, linkname, magic }

    if magical magic
      @parser.parse("ustar")
    else
      @parser.parse("skip")

  ustar: (version, user, group, devmajor, devminor, prefix) =>
    for k, v of  { version, user, group, devmajor, devminor, prefix }
      @header[k] = v

    @header.ustar     = true
    @header.filename  = @header.prefix + @header.name

    @skip()

  skip: =>
    @header.filename  or= @header.name
    @header.ustar     or= false
    @emit("header", @header)
    if @header.size
      @mode     = "data"
      @size     = @header.size
      @blocks   = Math.floor(((@header.size) + 511) /  512)
      @offset   = 0
    else
      @mode     = "start"

  read: (buffer, offset, length) ->
    offset or= 0
    length or= buffer.length
    read = 0
    while @end < 2 and read < length
      switch @mode
        when "start"
          if buffer[offset + read] is 0
            @mode = "data"
            @size = 0
            @blocks = 1
            @offset = 0
            ending = true
          else
            @mode = "header"
            @parser.parse("basic")
            ending = false
        when "header"
          read += @parser.read(buffer, offset + read, length - read)
          console.log read
        when "data"
          data = Math.min(@size - @offset, length - read)
          if data > 0
            @emit "data", @header, buffer, offset + read, data
            @offset += data
            read  += data
          blocks = Math.min(@blocks * 512 - @offset, length - read)
          @offset += blocks
          read  += blocks
          if @blocks * 512 == @offset
            @mode = "start"
            if ending
              if ++@end == 2
                @emit "end"
            else
              @emit "footer", @header
    read
