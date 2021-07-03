build:
	yarn
	yarn build

publish: build
	cat package.json | jq 'del(.devDependencies, .scripts)' > dist/package.json
	echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" dist/.npmrc
	(cd dist; yarn; npm publish --access public)