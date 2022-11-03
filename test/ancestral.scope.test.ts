import { IdentifierInScope } from 'src/index'
import { parseModule, parseScript } from './helpers/parse'

type PartialIdentifierInScope1 = Omit<IdentifierInScope, 'imported' | 'exported'>

const filter = (id: IdentifierInScope) => id.scope === 'ancestral'
const map = ({ name, scope, type }: IdentifierInScope) => {
  return {
    name,
    scope,
    type
  }
}

describe('ancestral identifier test', () => {
  test('identifer', () => {
    const script = 'g_var1'
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'g_var1',
      scope: 'ancestral',
      type: 'unknown'
    }
    expect(res.identifiers.filter(filter).map(map)).toEqual([target])
  })

  test('object expression', () => {
    const script = `
      const key1 = 10
      const obj = {
        key1: key1,
        key0: g_var1,
        name: 1,
        age: 1,
        innerObj: {
          key1: key1,
          key0: g_var2,
          name: 1,
          age: 1,
        }
      }
    `
    const res = parseScript(script)
    const target: PartialIdentifierInScope1[] = [
      {
        name: 'g_var1',
        scope: 'ancestral',
        type: 'unknown'
      },
      {
        name: 'g_var2',
        scope: 'ancestral',
        type: 'unknown'
      },
    ]
    expect(res.identifiers.filter(filter).map(map)).toEqual(target)
  })

  test('array expression', () => {
    const script = `
      const var1 = 10
      const arr = [1, var1, g_var1, g_var2]
    `
    const res = parseScript(script)
    const target: PartialIdentifierInScope1[] = [
      {
        name: 'g_var1',
        scope: 'ancestral',
        type: 'unknown'
      },
      {
        name: 'g_var2',
        scope: 'ancestral',
        type: 'unknown'
      },
    ]
    expect(res.identifiers.filter(filter).map(map)).toEqual(target)
  })

  test('assignment expression', () => {
    const script = 'g_var1 = 10'
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'g_var1',
      scope: 'ancestral',
      type: 'unknown'
    }
    expect(res.identifiers.filter(filter).map(map)).toEqual([target])
  })

  test('binary expression', () => {
    const script = `
      const var1 = "", var2 = ""
      var1 && g_var1 && var2 && g_var2
    `
    const res = parseScript(script)
    const target: PartialIdentifierInScope1[] = [
      {
        name: 'g_var1',
        scope: 'ancestral',
        type: 'unknown'
      },
      {
        name: 'g_var2',
        scope: 'ancestral',
        type: 'unknown'
      }
    ]
    expect(res.identifiers.filter(filter).map(map)).toEqual(target)
  })

  test('unary expression', () => {
    const script = '+g_var1'
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'g_var1',
      scope: 'ancestral',
      type: 'unknown'
    }
    expect(res.identifiers.filter(filter).map(map)).toEqual([target])
  })

  test('update expression', () => {
    const script = 'g_var1++'
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'g_var1',
      scope: 'ancestral',
      type: 'unknown'
    }
    expect(res.identifiers.filter(filter).map(map)).toEqual([target])
  })

  test('conditional expression', () => {
    const script = `
      const var1 = ""
      var1 ? 0 : g_var1
    `
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'g_var1',
      scope: 'ancestral',
      type: 'unknown'
    }
    expect(res.identifiers.filter(filter).map(map)).toEqual([target])
  })

  test('logical expression', () => {
    const script = 'const var1 = "" || g_var1'
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'g_var1',
      scope: 'ancestral',
      type: 'unknown'
    }
    expect(res.identifiers.filter(filter).map(map)).toEqual([target])
  })

  test('member expression and computed key', () => {
    const script = `
      const user = {}
      user.name
      user[g_var1]
      user[0]
      class A {
        [g_var2]() {}
      }
      const obj = {
        [g_var3]: 10
      }
    `
    const res = parseScript(script)
    const target1: PartialIdentifierInScope1[] = [
      {
        name: 'g_var1',
        scope: 'ancestral',
        type: 'unknown'
      },
      {
        name: 'g_var3',
        scope: 'ancestral',
        type: 'unknown'
      }
    ]
    const target2: PartialIdentifierInScope1 = {
      name: 'g_var2',
      scope: 'ancestral',
      type: 'unknown'
    }
    expect(res.identifiers.filter(filter).map(map)).toEqual(target1)
    expect(res.children[0].identifiers.filter(filter).map(map)).toEqual([target2])
  })

  test('new expression', () => {
    const script = 'new GClass()'
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'GClass',
      scope: 'ancestral',
      type: 'unknown'
    }
    expect(res.identifiers.filter(filter).map(map)).toEqual([target])
  })

  test('spread element', () => {
    const script = `
      const var1 = []
      const arr1 = [...var1, ...g_var1]
    `
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'g_var1',
      scope: 'ancestral',
      type: 'unknown'
    }
    expect(res.identifiers.filter(filter).map(map)).toEqual([target])
  })

  test('rest element', () => {
    const script = `
      let var1 = [], var2 
      [var2, ...g_var1] = var1
    `
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'g_var1',
      scope: 'ancestral',
      type: 'unknown'
    }
    expect(res.identifiers.filter(filter).map(map)).toEqual([target])
  })

  test('array pattern', () => {
    const script = `
      let var1 = [], var2 
      [var2, g_var1] = var1
    `
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'g_var1',
      scope: 'ancestral',
      type: 'unknown'
    }
    expect(res.identifiers.filter(filter).map(map)).toEqual([target])
  })

  test('assignment pattern', () => {
    const script = `
      let var1 = [], var2 
      [var2 = g_var1] = var1
      const user = {}
      const { name = g_var2 } = user
    `
    const res = parseScript(script)
    const target: PartialIdentifierInScope1[] = [
      {
        name: 'g_var1',
        scope: 'ancestral',
        type: 'unknown'
      },
      {
        name: 'g_var2',
        scope: 'ancestral',
        type: 'unknown'
      }
    ]
    expect(res.identifiers.filter(filter).map(map)).toEqual(target)
  })

  test('super class', () => {
    const script = 'class A extends B {}'
    const target: IdentifierInScope = {
      name: 'B',
      type: 'unknown',
      scope: 'ancestral',
      imported: false,
      exported: false
    }
    const res = parseScript(script)
    expect(res.identifiers.filter(filter)).toEqual([target])
  })

  test('export default A 1', () => {
    const script = 'export default A'
    const target: IdentifierInScope = {
      name: 'A',
      scope: 'ancestral',
      type: 'unknown',
      imported: false,
      exported: true
    }
    const res = parseModule(script)
    expect(res.identifiers.filter(filter)).toEqual([target])
  })

  test('export default A 2', () => {
    const script = 'A; export default A'
    const target: IdentifierInScope = {
      name: 'A',
      scope: 'ancestral',
      type: 'unknown',
      imported: false,
      exported: true
    }
    const res = parseModule(script)
    expect(res.identifiers.filter(filter)).toEqual([target])
  })
})