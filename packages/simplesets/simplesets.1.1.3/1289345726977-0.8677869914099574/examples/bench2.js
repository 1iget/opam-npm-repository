// Benchmark of some set operations
var sets = require('../lib/simplesets');

var keys1 = []; var keys2 = [];

var reps = 1000;

function benchmark_set() {
    var start_time = new Date().getTime();

    for (var i = 0; i < reps; i++)
	var s1 = new sets.Set(keys1);
    
    var s2 = new sets.Set(keys2);
    
    var r_int, r_diff, r_union, r_equal;
    
    for (var i = 0; i < reps; i++) {
	r_int = s1.intersection(s2);
	r_diff = s1.difference(s2);
	r_union = s1.union(s2);
    }

    for (var i = 0; i < reps; i++) {
	var x = s1.pick();
	if (x !== null) s1.remove(x);
    }

    for (var i = 0; i < reps; i++)
	r_equal = s2.equals(s2);

    var end_time = new Date().getTime();
    return end_time - start_time;
}

function benchmark_stringset() {
    var start_time = new Date().getTime();

    for (var i = 0; i < reps; i++)
	var s1 = new sets.StringSet(keys1);
    
    var s2 = new sets.StringSet(keys2);
    
    var result;
    
    for (var i = 0; i < reps; i++) {
	r_int = s1.intersection(s2);
	r_diff = s1.difference(s2);
	r_union = s1.union(s2);
    }

    for (var i = 0; i < reps; i++) {
	var x = s1.pick();
	if (x !== null) s1.remove(x);
    }

    for (var i = 0; i < reps; i++)
	r_equal = s2.equals(s2);

    var end_time = new Date().getTime();
    return end_time - start_time;
}

function benchmark(set_size) {
    // Create two random arrays
    keys1 = []; keys2 = [];
    for (var i = 0; i < set_size; i++) {
	keys1.push(Math.floor(Math.random() * 100000));
	keys2.push(Math.floor(Math.random() * 100000));
    }
    
    // Repeat several times to let the GC warm up.
    var set_time = 0, stringset_time = 0;
    set_time += benchmark_set();
    stringset_time += benchmark_stringset();
    set_time += benchmark_set();
    stringset_time += benchmark_stringset();
    set_time += benchmark_set();
    stringset_time += benchmark_stringset();
    set_time += benchmark_set();
    stringset_time += benchmark_stringset();
    set_time += benchmark_set();
    stringset_time += benchmark_stringset();
    set_time += benchmark_set();
    stringset_time += benchmark_stringset();
    console.log(set_size + ', ' + set_time + ', ' + stringset_time);
}

for (var set_size = 0; set_size <= 300; set_size += 5)
    benchmark(set_size);