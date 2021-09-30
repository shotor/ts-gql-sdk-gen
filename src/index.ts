#!/usr/bin/env node

// eslint-disable-next-line
const { version } = require('../package.json')
import { buildSchema, printSchema, parse, GraphQLSchema } from 'graphql'
import { codegen } from '@graphql-codegen/core'
import { execSync } from 'child_process'
import { Command } from 'commander'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import * as typescriptPlugin from '@graphql-codegen/typescript'
import * as typescriptOperationsPlugin from '@graphql-codegen/typescript-operations'
import * as typescriptGraphQLRequestPlugin from '@graphql-codegen/typescript-graphql-request'
import { loadDocumentsSync } from '@graphql-tools/load'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'

const program = new Command()

program
  .version(version)
  .description('Generate full typescript sdk from graphql schema')

program
  .command('*')
  .argument('<schema>', 'path to schema file')
  .argument('[destination', 'destination directory')
  .option('-d --dry', 'dry run')
  .action(
    async (
      schemaFile: string,
      destination: string,
      { dry }: { dry: boolean }
    ) => {
      if (!existsSync(schemaFile)) {
        console.error(`Schema not found at ${schemaFile}`)
        process.exit(1)
      }

      mkdirSync(destination, {
        recursive: true,
      })

      // run operations generator
      const operationsGenerator = resolve(
        __dirname,
        '..',
        'node_modules',
        '.bin',
        'gqlg'
      )

      execSync(
        `${operationsGenerator} --schemaFilePath ${schemaFile} --destDirPath ${destination} --depthLimit 5 --includeDeprecatedFields`
      )

      // clean up js files
      const resolveDestination = (...paths: string[]) =>
        resolve(destination, ...paths)

      ;[
        resolveDestination('index.js'),
        resolveDestination('queries', 'index.js'),
        resolveDestination('mutations', 'index.js'),
        resolveDestination('subscriptions', 'index.js'),
      ].forEach((f) => {
        if (existsSync(f)) {
          rmSync(f)
        }
      })

      // generate sdk

      const schema: GraphQLSchema = buildSchema(
        readFileSync(schemaFile, 'utf8')
      )

      const outputFile = resolveDestination('gql-sdk.ts')

      const documents = []

      if (existsSync(resolveDestination('queries'))) {
        const queryDocs = loadDocumentsSync(`${destination}/queries/*.gql`, {
          // load from multiple files using glob
          loaders: [new GraphQLFileLoader()],
        })
        documents.push(...queryDocs)
      }

      if (existsSync(resolveDestination('mutations'))) {
        const mutationDocs = loadDocumentsSync(
          `${destination}/mutations/*.gql`,
          {
            // load from multiple files using glob
            loaders: [new GraphQLFileLoader()],
          }
        )
        documents.push(...mutationDocs)
      }

      if (existsSync(resolveDestination('subscriptions'))) {
        const subscriptionDocs = loadDocumentsSync(
          `${destination}/subscriptions/*.gql`,
          {
            // load from multiple files using glob
            loaders: [new GraphQLFileLoader()],
          }
        )
        documents.push(...subscriptionDocs)
      }

      const output = await codegen({
        // used by a plugin internally, although the 'typescript' plugin currently
        // returns the string output, rather than writing to a file
        filename: outputFile,
        schema: parse(printSchema(schema)),

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
        documents,
        config: {
          rawRequest: true,
          onlyOperationTypes: true,
          preResolveTypes: true,
        },
      })

      if (dry) {
        console.log(output)
      } else {
        writeFileSync(outputFile, output)
      }
    }
  )

program.parse(process.argv)
