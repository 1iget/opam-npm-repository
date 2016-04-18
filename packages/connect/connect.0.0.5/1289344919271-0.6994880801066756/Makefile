
NODE = node
TEST = support/expresso/bin/expresso
TESTS ?= test/*.test.js
PREFIX = /usr/local
DOCS = docs/index.md \
	   docs/method-override.md \
	   docs/conditional-get.md \
	   docs/response-time.md \
	   docs/body-decoder.md \
	   docs/redirect.md \
	   docs/session.md \
	   docs/flash.md \
	   docs/static.md \
	   docs/cookie.md \
	   docs/lint.md \
	   docs/rest.md \
	   docs/sass.md \
	   docs/less.md \
	   docs/log.md

MANPAGES = $(DOCS:.md=.1)
HTMLDOCS = $(DOCS:.md=.html)

test:
	@CONNECT_ENV=test ./$(TEST) -I lib -I support/sass/lib -I support/less/lib $(TEST_FLAGS) $(TESTS)

test-cov:
	@$(MAKE) test TEST_FLAGS="--cov"

install: install-docs
	cp -f bin/connect $(PREFIX)/bin/connect

uninstall:
	rm -f $(PREFIX)/share/man/man1/connect.1
	rm -f $(PREFIX)/bin/connect

install-docs:
	cp -f docs/index.1 $(PREFIX)/share/man/man1/connect.1
	cp -f docs/body-decoder.1 $(PREFIX)/share/man/man1/connect-body-decoder.1
	cp -f docs/conditional-get.1 $(PREFIX)/share/man/man1/connect-conditional-get.1
	cp -f docs/method-override.1 $(PREFIX)/share/man/man1/connect-method-override.1
	cp -f docs/response-time.1 $(PREFIX)/share/man/man1/connect-response-time.1
	cp -f docs/redirect.1 $(PREFIX)/share/man/man1/connect-redirect.1
	cp -f docs/lint.1 $(PREFIX)/share/man/man1/connect-lint.1
	cp -f docs/static.1 $(PREFIX)/share/man/man1/connect-static.1
	cp -f docs/log.1 $(PREFIX)/share/man/man1/connect-log.1
	cp -f docs/rest.1 $(PREFIX)/share/man/man1/connect-rest.1
	cp -f docs/sass.1 $(PREFIX)/share/man/man1/connect-sass.1
	cp -f docs/cookie.1 $(PREFIX)/share/man/man1/connect-cookie.1
	cp -f docs/flash.1 $(PREFIX)/share/man/man1/connect-flash.1
	cp -f docs/session.1 $(PREFIX)/share/man/man1/connect-session.1
	cp -f docs/less.1 $(PREFIX)/share/man/man1/connect-less.1

benchmark: benchmarks/run
	@./benchmarks/run

graphs: benchmarks/graph
	@./benchmarks/graph

docs: $(MANPAGES) $(HTMLDOCS)

%.1: %.md
	@echo "... $< -> $@"
	@ronn -r --pipe $< > $@

%.html: %.md
	@echo "... $< -> $@"
	@ronn -5 --pipe --fragment $< \
	  | cat docs/layout/api.head.html - docs/layout/api.foot.html \
	  | sed 's/NAME/Connect/g' \
	  > $@

docclean:
	rm -f docs/*.{1,html}

.PHONY: install uninstall docs test test-cov benchmark graphs install-docs docclean