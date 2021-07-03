build:
	yarn
	yarn build
	yarn test

prepublish: build
	cat package.json | jq 'del(.devDependencies, .scripts)' > dist/package.json