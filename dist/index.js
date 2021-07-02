#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line
const { version } = require('../package.json');
const graphql_1 = require("graphql");
const core_1 = require("@graphql-codegen/core");
const child_process_1 = require("child_process");
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = require("path");
const typescriptPlugin = __importStar(require("@graphql-codegen/typescript"));
const typescriptOperationsPlugin = __importStar(require("@graphql-codegen/typescript-operations"));
const typescriptGraphQLRequestPlugin = __importStar(require("@graphql-codegen/typescript-graphql-request"));
const load_1 = require("@graphql-tools/load");
const graphql_file_loader_1 = require("@graphql-tools/graphql-file-loader");
const program = new commander_1.Command();
program
    .version(version)
    .description('Generate full typescript sdk from graphql schema');
program
    .command('*')
    .argument('<schema>', 'path to schema file')
    .argument('<destination>', 'destination directory')
    .action(async (schemaFile, destination) => {
    if (!fs_1.existsSync(schemaFile)) {
        console.error(`Schema not found at ${schemaFile}`);
        process.exit(1);
    }
    fs_1.mkdirSync(destination, {
        recursive: true,
    });
    // run operations generator
    const operationsGenerator = path_1.resolve(__dirname, '..', 'node_modules', '.bin', 'gqlg');
    child_process_1.execSync(`${operationsGenerator} --schemaFilePath ${schemaFile} --destDirPath ${destination} --depthLimit 5`);
    // clean up js files
    const resolveDestination = (...paths) => path_1.resolve(destination, ...paths);
    [
        resolveDestination('index.js'),
        resolveDestination('queries', 'index.js'),
        resolveDestination('mutations', 'index.js'),
        resolveDestination('subscriptions', 'index.js'),
    ].forEach((f) => {
        if (fs_1.existsSync(f)) {
            fs_1.rmSync(f);
        }
    });
    // generate sdk
    const schema = graphql_1.buildSchema(fs_1.readFileSync(schemaFile, 'utf8'));
    const outputFile = resolveDestination('gql-sdk.ts');
    const output = await core_1.codegen({
        // used by a plugin internally, although the 'typescript' plugin currently
        // returns the string output, rather than writing to a file
        filename: outputFile,
        schema: graphql_1.parse(graphql_1.printSchema(schema)),
        plugins: [
            // Each plugin should be an object
            {
                typescript: {
                    addUnderscoreToArgsType: true,
                }, // Here you can pass configuration to the plugin,
            },
            {
                typescriptOperations: {
                    addUnderscoreToArgsType: true,
                    // operationResultSuffix: 'Foo',
                },
            },
            {
                typescriptGraphQLRequest: {},
            },
        ],
        pluginMap: {
            typescript: typescriptPlugin,
            typescriptOperations: typescriptOperationsPlugin,
            typescriptGraphQLRequest: typescriptGraphQLRequestPlugin,
        },
        documents: [
            ...load_1.loadDocumentsSync(`${destination}/queries/*.gql`, {
                // load from multiple files using glob
                loaders: [new graphql_file_loader_1.GraphQLFileLoader()],
            }),
            ...load_1.loadDocumentsSync(`${destination}/mutations/*.gql`, {
                // load from multiple files using glob
                loaders: [new graphql_file_loader_1.GraphQLFileLoader()],
            }),
        ],
        config: {
            rawRequest: true,
            onlyOperationTypes: true,
            preResolveTypes: true,
        },
    });
    fs_1.writeFileSync(outputFile, output);
});
program.parse(process.argv);
//# sourceMappingURL=index.js.map