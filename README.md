# ts-gql-sdk-gen

Generate a complete GraphQL SDK from schema, generating all queries/mutations/subscriptions along the way.

Basically hacks the following two great packages together:

- [GraphQL Code Generator](https://www.graphql-code-generator.com/)
- [GQL Generator](https://github.com/timqian/gql-generator)

## Usage

### Install

```sh
yarn global add @shotor/tsgqlsdk

# or install locally
yarn add -D @shotor/tsgqlsdk
```

### Run

Given schema file

```graphql
# Sample schema
type Query {
  user(id: Int!): User!
}

type User {
  id: Int!
  username: String!
  email: String!
  createdAt: String!
}
```

Run the program

```sh
tsgqlsdk /path/to/schema.graphql /path/to/destination
```

In the destination folder you will find the following folder structure

```
- /queries
- /mutations
- /subscriptions
- gql-sdk.ts
```

Make sure `graphql-request` is installed in your project.

```sh
yarn add graphql-request
```

Then import and use the `gql-sdk.ts` and use fully typed API:

```ts
import { GraphQLClient } from 'graphql-request'
import { getSdk } from '/path/to/destination/gql-sdk.ts'

const sdk = getSdk(new GraphQLClient('http://example.org/graphql'))

desribe('test user', () => {
  it('gets user', async () => {
    const ID = 300
    const result = await sdk.user({
      id: ID,
    })

    expect(result.id).toBe(ID)
  })
})
```

## License

MIT
