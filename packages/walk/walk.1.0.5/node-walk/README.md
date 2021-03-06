node-walk
====

nodejs walk implementation.

This is somewhat of a port python's `os.walk`, but using Node.JS conventions.

  * EventEmitter
  * Asynchronous
  * Chronological (optionally)
  * Built-in flow-control

As few file descriptors are opened at a time as possible.
This is particularly well suited for single hard disks which are not flash or solid state.

Installation
----

    npm install walk

Usage
====

    var walk = require('walk').walk,
      options,
      walker;

    options = {
        followLinks: false,
    };

    walker = walk("path/to/dir", options);

    walker.on("names", function (root, nodeNamesArray) {
      nodeNames.sort(function (a, b) {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
      });
    });

    walker.on("directories", function (root, dirStatsArray, next) {
      // dirStatsArray is an array of `stat` objects with the additional attributes
      // * type
      // * error
      // * name
      
      next();
    });

    walker.on("file", function (root, fileStats, next) {
      fs.readFile(file, function () {
        // doStuff
        next();
      });
    });

    walker.on("errors", function (root, nodeStatsArray, next) {
      next();
    });

    walker.on("end", function () {
      console.log("all done");
    });

API
====

Emitted Values

  * `on('XYZ', function(root, stats, next) {})`

  * `root` - the containing the files to be inspected
  * *stats[Array]* - a single `stats` object or an array with some added attributes
    * type - 'file', 'directory', etc
    * error
    * name - the name of the file, dir, etc 
  * next - no more files will be read until this is called

Single Events - fired immediately

  * `end` - No files, dirs, etc left to inspect

  * `directoryError` - Error when `fstat` succeeded, but reading path failed (Probably due to permissions).
  * `nodeError` - Error `fstat` did not succeeded.
  * `node` - a `stats` object for a node of any type
  * `file` - includes links when `followLinks` is `true`
    * Note: This feature is broken in the current version, but works in the previous `walk-recursive` version
  * `directory`
  * `symbolicLink` - always empty when `followLinks` is `true`
  * `blockDevice`
  * `characterDevice`
  * `FIFO`
  * `socket`

Events with Array Arguments - fired after all files in the dir have been `stat`ed

  * `names` - before any `stat` takes place. Useful for sorting and filtering.
    * Note: the array is an array of `string`s, not `stat` objects
    * Note: the `next` argument is a `noop`

  * `errors` - errors encountered by `fs.stat` when reading ndes in a directory
  * `nodes` - an array of `stats` of any type
  * `files`
  * `directories` - modification of this array - sorting, removing, etc - affects traversal
  * `symbolicLinks`
  * `blockDevices`
  * `characterDevices`
  * `FIFOs`
  * `sockets`

**Warning** beware of infinite loops when `followLinks` is true (using `walk-recurse` varient).

Comparisons
====

Tested on my `/System` containing 59,490 (+ self) directories (and lots of files).
The size of the text output was 6mb.

`find`:
    time bash -c "find /System -type d | wc"
    59491   97935 6262916

    real  2m27.114s
    user  0m1.193s
    sys 0m14.859s

`find.js`:

Note that `find.js` omits the start directory

    time bash -c "node examples/find.js /System -type d | wc"
    59490   97934 6262908
   
    # Test 1 
    real  2m52.273s
    user  0m20.374s
    sys 0m27.800s
    
    # Test 2
    real  2m23.725s
    user  0m18.019s
    sys 0m23.202s

    # Test 3
    real  2m50.077s
    user  0m17.661s
    sys 0m24.008s

In conclusion node.js asynchronous walk is much slower than regular "find".