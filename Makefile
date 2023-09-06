JEKYLL_VERSION=4
PORT=4000
serve: clean
	docker run --rm -p ${PORT}:${PORT} --volume="${PWD}:/srv/jekyll:Z" -it jekyll/jekyll:${JEKYLL_VERSION} jekyll serve --incremental

build: clean
	docker run --rm -p ${PORT}:${PORT} -e JEKYLL_ENV=production --volume="${PWD}:/srv/jekyll:Z" -it jekyll/jekyll:${JEKYLL_VERSION} jekyll build --incremental
	cp -r _site/* ../adriangalera.github.io/

clean:
	rm -rf .jekyll-metadata
	rm -rf .jekyll-cache