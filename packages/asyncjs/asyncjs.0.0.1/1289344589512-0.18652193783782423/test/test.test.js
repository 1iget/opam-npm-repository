var async = require("../lib/async")
var atest = require("../lib/async/test")
var assert = require("assert")

var Test = {
    name: "test",
    
    "test teardown is called even if test doesn't respond": function(next) {
        var called = false
        var Test = {
            tearDown: function() { called = true
                console.log("tear down")
            },
            test1: function() {
                //console.log("test2")
                throw new Error("JUHU")
            }
        }
        
        atest.testcase(Test, 10).run().end(function() {
            assert.ok(called);
            next();
        })
    }
}

module.exports = atest.testcase(Test)

if (module === require.main)
    module.exports.exec()