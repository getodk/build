all:	build/app.nw

clean:
	rm -f build/app.nw

build:
	mkdir -p build

TEMPDIR := $(shell mktemp -d -t odkbuild)

build/app.nw: build
	@echo "building contents..."
	cp package.json $(TEMPDIR)
	cp -r public $(TEMPDIR)
	cp -r node_modules $(TEMPDIR)
	@echo "modifying content..."
	find $(TEMPDIR) -name '*.css' | xargs perl -pi -e 's/url\(\//url\(/g'
	cp -r $(TEMPDIR)/public/images $(TEMPDIR)/public/stylesheets
	@echo "zipping contents to app package..."
	cd $(TEMPDIR); zip -r app.nw * > /dev/null
	cp $(TEMPDIR)/app.nw build
	@echo "done"

run:
	killall  node-webkit || true
	sleep 1
	open build/app.nw

go:	clean all run

