.PHONY: dist clean

webpack = ./node_modules/webpack/bin/webpack.js
babel = ./node_modules/babel-cli/bin/babel.js
uglifyjs = node ./node_modules/uglifyjs/bin/uglifyjs

define PREAMBLE
/**
 * Pure JavaScript implementation of zoom.js.
 *
 * This fork extends the zoom.js script to work on divs as well.
 * The divs can also have hidden text that will transition into view.
 * Available at: https://github.com/alexbonine/zoom.js
 *
 * Original preamble:
 * zoom.js - It's the best way to zoom an image
 * @version v0.0.2
 * @link https://github.com/fat/zoom.js
 * @license MIT
 *
 * Needs a related CSS file to work. See the README at
 * https://github.com/nishanths/zoom.js for more info.
 *
 * This is a fork of the original zoom.js implementation by @fat.
 * Copyrights for the original project are held by @fat. All other copyright
 * for changes in the fork are held by Nishanth Shanmugham.
 *
 * Copyright (c) 2013 @fat
 * The MIT License. Copyright © 2016 Nishanth Shanmugham.
 * The MIT License. Copyright © 2017 Alex Bonine.
 */
endef

export PREAMBLE

OPTS = --screw-ie8 --preamble="$$PREAMBLE"

dist: clean
	mkdir dist

	# make single script file
	$(webpack) script/init.js dist/zoom.js

	# transpile down to ES5, wrap in IIFE
	$(babel) dist/zoom.js --presets=es2015-script --plugins=iife-wrap --out-file=dist/zoom.js

	# dist
	$(uglifyjs) dist/zoom.js $(OPTS) --beautify -o dist/zoom.js
	$(uglifyjs) dist/zoom.js $(OPTS) --compress --mangle -o dist/zoom.min.js

clean:
	rm -rf dist
