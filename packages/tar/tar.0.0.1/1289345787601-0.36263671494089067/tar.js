var tar = require("./lib/tar"),
    fs  = require("fs");


function cat(tarfile, filename) {
  var body,
      bodyOffset  = 0,
      count       = 0,
      reader      = new tar.Reader();
  reader.on("header", function (header) {
    count++;
    console.log(header);
    if (header.filename == filename) {
      body = new Buffer(header.size);
    }
  });
  reader.on("data", function (header, chunk, offset, length) {
    if (header.filename == filename) {
      chunk.copy(body, bodyOffset, offset, offset + length);
    }
  });
  reader.on("footer", function (header) {
    if (header.filename == filename) {
      console.log(body.toString());
    }
  });
  reader.on("end", function () {
    console.log("Read " + count + " entries.");
  });
  fs.readFile(tarfile, function (error, buffer) {
    reader.read(buffer, 0, buffer.length);
  });
}

cat("hello.tar", "hello/hello.txt");
