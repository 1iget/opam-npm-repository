# Formidable

## Purpose

A node.js module for dealing with web forms.

## Features

* Fast (~500mb/sec), non-buffering multipart parser
* Automatically writing file uploads to disk
* Low memory footprint
* Graceful error handling
* Very high test coverage

### Todo

* Implement QuerystringParser the same way as MultipartParser

## Installation

Via [npm](http://github.com/isaacs/npm):

    npm install formidable@latest

Manually:

    git clone git://github.com/felixge/node-formidable.git formidable
    vim my.js
    # var formidable = require('./formidable');

Note: Formidable requires [gently](http://github.com/felixge/node-gently) to run the unit tests, but you won't need it for just using the library.

## Example

Parse an incoming file upload.

    var formidable = require('formidable')
      , http = require('http')
      , sys = require('sys');

    http.createServer(function(req, res) {
      if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
        // parse a file upload
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
          res.writeHead(200, {'content-type': 'text/plain'});
          res.write('received upload:\n\n');
          res.end(sys.inspect({fields: fields, files: files}));
        });
        return;
      }

      // show a file upload form
      res.writeHead(200, {'content-type': 'text/html'});
      res.end
        ( '<form action="/upload" enctype="multipart/form-data" method="post">'
        + '<input type="text" name="title"><br>'
        + '<input type="file" name="upload" multiple="multiple"><br>'
        + '<input type="submit" value="Upload">'
        + '</form>'
        );
    });

## API

### formdiable.IncomingForm

#### new formdiable.IncomingForm()

Creates a new incoming form.

#### incomingForm.encoding = 'utf-8'

The encoding to use for incoming form fields.

#### incomingForm.uploadDir = '/tmp'

The directory for placing file uploads in. You can later on move them using `fs.rename()`.

#### incomingForm.keepExtensions = false

If you want the files written to `incomingForm.uploadDir` to include the extensions of the original files, set this property to `true`.

#### incomingForm.type

Either 'multipart' or 'urlencoded' depending on the incoming request.

#### incomingForm.maxFieldSize = 2 * 1024 * 1024

Limits the amount of memory a field (not file) can allocate in bytes.
I this value is exceeded, an `'error'` event is emitted. The default
size is 2MB.

#### incomingForm.bytesReceived

The amount of bytes received for this form so far.

#### incomingForm.bytesExpected

The expected number of bytes in this form.

#### incomingForm.parse(request, [cb])

Parses an incoming node.js `request` containing form data. If `cb` is provided, all fields an files are collected and passed to the callback:

    incomingForm.parse(req, function(err, fields, files) {
      // ...
    });

#### incomingForm.onPart(part)

You may overwrite this method if you are interested in directly accessing the multipart stream. Doing so will disable any `'field'` / `'file'` events  processing which would occur otherwise, making you fully responsible for handling the processing.

    incomingForm.onPart = function(part) {
      part.addListener('data', function() {
        // ...
      });
    }

If you want to use formidable to only handle certain parts for you, you can do so:

    incomingForm.onPart = function(part) {
      if (!part.filename) {
        // let formidable handle all non-file parts
        incomingForm.handlePart(part);
      }
    }

Check the code in this method for further inspiration.

#### Event: 'progress' (bytesReceived, bytesExpected)

Emitted after each incoming chunk of data that has been parsed. Can be used to roll your own progress bar.

#### Event: 'field' (name, value)

Emitted whenever a field / value pair has been received.

#### Event: 'file' (name, file)

Emitted whenever a field / file pair has been received. `file` is a JS object with the following properties:

    { path: 'the path in the uploadDir this file was written to'
    , filename: 'the name this file had on the computer of the uploader'
    , mime: 'the mime type specified by the user agent of the uploader'
    }

#### Event: 'error' (err)

Emitted when there is an error processing the incoming form. A request that experiences an error is automatically paused, you will have to manually call `request.resume()` if you want the request to continue firing `'data'` events.

#### Event: 'end' ()

Emitted when the entire request has been received, and all contained files have finished flushing to disk. This is a great place for you to send your response.

## License

Formidable is licensed under the MIT license.

## Credits

* [Ryan Dahl](http://twitter.com/ryah) for his work on [http-parser](http://github.com/ry/http-parser) which heavily inspired multipart_parser.js
