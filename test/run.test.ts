import { execSync } from 'child_process'
import { existsSync, rmdirSync } from 'fs'
import { resolve } from 'path'

describe('run test', () => {
  beforeAll(() => {
    if (existsSync('./output')) {
      rmdirSync('./output')
    }
  })

  it('gets desired output', () => {
    const result = execSync('yarn dev ./test/schema.graphql ./test/output -d', {
      cwd: resolve(__dirname, '..'),
    })

    const asString = result.toString('utf8')

    expect(asString).toMatchSnapshot()
  })
})
