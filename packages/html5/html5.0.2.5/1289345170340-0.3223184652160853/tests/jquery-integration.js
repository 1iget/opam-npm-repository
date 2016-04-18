	var  HTML5 = require('html5'),
	    Script = process.binding('evals').Script,
	       sys = require('sys'),
		fs = require('fs'),
	     jsdom = require('jsdom');

exports.testjQueryIntegration = function(test) {
	var window = jsdom.createWindow(null, null, {parser: HTML5});

	test.expect(1);

	var parser = new HTML5.Parser({document: window.document});

	var inputfile = fs.readFileSync('doc/jquery-example.html');
	parser.parse(inputfile);

	jsdom.jQueryify(window, 'deps/jquery/dist/jquery.js', function(window, jquery) {
		Script.runInNewContext('jQuery("p").append("<b>Hi!</b>")', window);

		test.equals(window.document.innerHTML, "<html><head><title></title></head><body></body></html><html><head></head><body><p>Hello, World!<b>Hi!</b></p>\n</body></html>");

		test.done();
	});
}
