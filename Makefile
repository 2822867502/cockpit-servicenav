# Cockpit servicenav plugin - Makefile
PACKAGE_NAME = cockpit-servicenav
PREFIX ?= /usr
DATADIR ?= $(PREFIX)/share/cockpit
DIST_DIR = dist

.PHONY: all watch clean install devel-install devel-uninstall test lint typecheck

all: node_modules $(DIST_DIR)/index.js

node_modules: package.json
	npm install
	@touch node_modules

$(DIST_DIR)/index.js: node_modules build.js $(shell find src -type f) manifest.json
	node build.js

watch:
	node build.js --watch

clean:
	rm -rf dist/ coverage/ test-reports/

install: all
	mkdir -p $(DESTDIR)$(DATADIR)/$(PACKAGE_NAME)
	cp -r $(DIST_DIR)/* $(DESTDIR)$(DATADIR)/$(PACKAGE_NAME)/

devel-install: all
	mkdir -p $(HOME)/.local/share/cockpit
	rm -f $(HOME)/.local/share/cockpit/$(PACKAGE_NAME)
	ln -sfn $(shell pwd)/$(DIST_DIR) $(HOME)/.local/share/cockpit/$(PACKAGE_NAME)

devel-uninstall:
	rm -f $(HOME)/.local/share/cockpit/$(PACKAGE_NAME)

test:
	npm test

lint:
	npm run lint

typecheck:
	npm run typecheck
