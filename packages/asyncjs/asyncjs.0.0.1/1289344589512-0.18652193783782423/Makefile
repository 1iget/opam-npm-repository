cov:
	rm -rf cov
	mkdir cov
	jscoverage lib cov/lib
	jscoverage test cov/test
	node cov/test/all.js
