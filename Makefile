build:
	yarn
	yarn build

prepublish: build
	cat package.json | jq 'del(.devDependencies, .scripts)' > dist/package.json