
var Q = require("q");
var FS = require("q-fs");
var Root = require("q-fs/root").Fs;
var Mock = require("q-fs/mock").Fs;
var ASSERT = require("assert");

exports['test root mock'] = function (ASSERT, done) {
    var mock = Mock({
        "a/b/1": 10,
        "a/b/2": 20,
        "a/b/3": 30
    });
    var root = Root(mock, "a/b");
    Q.when(root, function (_root) {
        root = _root;
        return Q.when(mock.listTree(), function (tree) {
            ASSERT.deepEqual(tree, [
                ".", 
                "a",
                "a/b",
                "a/b/1",
                "a/b/2",
                "a/b/3"
            ], 'listTree of mock');
            return root;
        });
    }).then(function () {
        return Q.when(root.listTree(), function (tree) {
            ASSERT.deepEqual(tree, [
                ".", 
                "1",
                "2",
                "3"
            ], 'listTree of root');
        });
    }).then(done, function (error) {
        ASSERT.ok(false, 'error');
        done();
    });
};

if (require.main === module) {
    require("test").run(exports);
}

