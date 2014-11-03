
DUO := ../node_modules/.bin/duo
PIN := ../pin.js
JS = $(wildcard *.js)

build/build.js: $(JS)
	@mkdir -p $(dir $@)
	$(DUO) < index.js > $@

component.json: components/duo.json
	$(PIN)

clean:
	rm -rf build components

.PHONY: clean
