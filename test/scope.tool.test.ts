import { IdentifierInScope } from '../src/index'
import { parseScript } from './helpers/parse'

const script = `
  console.log(g_var1)  
  function fn1() {}
  const var1 = 10, var2 = 20
  console.log(g_var2)  
`

const res = parseScript(script)

describe('test tools provided by scope class', () => {
  test('hasId api', () => {
    const names = ['var1', 'random1', 'fn1']
    expect(res.hasId('var2')).toBe(true)
    expect(res.hasId((id) => names.includes(id.name) && id.scope === 'local')).toBe(true)
  })

  test('hasGlobalId api', () => {
    expect(res.hasGlobalId('console')).toBe(true)
  })

  test('getIds api', () => {
    const target: IdentifierInScope[] = [
      {
        name: 'fn1',
        scope: 'local',
        type: 'function',
        exported: false,
        imported: false
      },
      {
        name: 'var1',
        scope: 'local',
        type: 'variable',
        exported: false,
        imported: false
      },
      {
        name: 'var2',
        scope: 'local',
        type: 'variable',
        exported: false,
        imported: false
      },
    ]
    expect(res.getIds((id) => id.type !== 'unknown')).toEqual(target)
  })

  test('getAllGlobalIds api', () => {
    const target: IdentifierInScope[] = [
      {
        name: 'console',
        scope: 'ancestral',
        type: 'unknown',
        exported: false,
        imported: false
      },
      {
        name: 'g_var1',
        scope: 'ancestral',
        type: 'unknown',
        exported: false,
        imported: false
      },
      {
        name: 'g_var2',
        scope: 'ancestral',
        type: 'unknown',
        exported: false,
        imported: false
      },
    ]
    expect(res.getAllGlobalIds()).toEqual(target)
  })
})