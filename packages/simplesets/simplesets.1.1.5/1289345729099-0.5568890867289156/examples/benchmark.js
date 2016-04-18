// Benchmark of some set operations
var sets = require('../lib/simplesets');

var started_time;
function start_time() {
    started_time = new Date().getTime();
}
function end_time(task_name) {
    var now = new Date().getTime();
    console.log('    ' + task_name + ':', now - started_time);
}

var keys1 = []; var keys2 = [];
for (var i = 0; i < 1000; i++) {
    keys1.push(Math.floor(Math.random() * 100000));
    keys2.push(Math.floor(Math.random() * 100000));
}

function benchmark(reps) {
    start_time();
    for (var i = 0; i < reps; i++)
	var s1 = new sets.Set(keys1);
    end_time('Create Set');
    
    start_time();
    for (var i = 0; i < reps; i++)
	var s2 = new sets.StringSet(keys1);
    end_time('Create StringSet');
    
    var s1a = new sets.Set(keys2);
    var s2a = new sets.StringSet(keys2);
    
    var result;
    
    start_time();
    for (var i = 0; i < reps; i++)
	result = s1.intersection(s1a);
    end_time('Set intersection');
    
    start_time();
    for (var i = 0; i < reps; i++)
	result = s2.intersection(s2a);
    end_time('StringSet intersection');
}

console.log("Large sets")
benchmark(1000);

// Now let's try this all over again, with small sets.
var keys1 = []; var keys2 = [];
for (var i = 0; i < 10; i++) {
    keys1.push(Math.floor(Math.random() * 100000));
    keys2.push(Math.floor(Math.random() * 100000));
}

console.log("Small sets")
benchmark(1000000);