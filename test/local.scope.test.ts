
import { IdentifierInScope } from "../src";
import { parseModule, parseScript } from "./helpers/parse";

type IdentifierInScopeWithoutNode1 = Omit<IdentifierInScope, 'imported' | 'exported'>

const map1 = ({ name, scope, type }: IdentifierInScope) => {
  return {
    name,
    scope,
    type
  }
}

describe('local identifier test', () => {
  test('import variable', () => {
    const script = `
      import { var1, var2, var3 as var4 } from 'moduleA'
      import * as moduleC from 'moduleC'
      import moduleD from 'moduleD'
    `
    const res = parseModule(script)
    const target: IdentifierInScope[] = ['var1', 'var2', 'var4', 'moduleC', 'moduleD']
      .map((item) => {
        return {
          name: item,
          scope: 'local',
          type: 'variable',
          imported: true,
          exported: false
        }
      })
    expect(res.identifiers.filter((id) => id.imported)).toEqual(target)
  })

  test('variable declarataion by let/const', () => {
    const script = `
      let a, b, c;
      const d = 1, e = 2, f = 3;
    `
    const res = parseScript(script)
    const target: IdentifierInScopeWithoutNode1[] = ['a', 'b', 'c', 'd', 'e', 'f']
      .map((item) => {
        return {
          name: item,
          scope: 'local',
          type: 'variable'
        }
      })
    const identifiers = res.identifiers.map(map1)
    expect(identifiers).toEqual(target)
  })

  test('deconstruction declarataion base on object pattern', () => {
    const script = `
      const user = {}
      const {
        key1,
        _key2: key2,
        key3 = key2,
        key4 = globalValue1,
        
        innerObj1: {
          key5,
          _key6: key6,
          key7 = key6,
          key8 = globalValue2,
          innerObj2: {
            key9,
            _key10: key10,
            key11 = key10,
            key12 = globalValue3,
            ...rest1
          },
          ...rest2
        },

        ...rest3
      } = user

      // object-expressoin and object-patten have 'Property', a child node,
      // the parser should distinguish them.
      const obj = {
        key1: key1,
        key0: globalValue4,
        name: 1,
        age: 1,
        innerObj: {
          key1: key1,
          key0: globalValue4,
          name: 1,
          age: 1,
        }
      }
    `
    const res = parseScript(script)
    const target: IdentifierInScopeWithoutNode1[] = [
      'user', 'key1', 'key2', 'key3', 'key4',
      'key5', 'key6', 'key7', 'key8', 'key9',
      'key10', 'key11', 'key12', 'rest1', 'rest2',
      'rest3', 'obj'
    ]
      .map((item) => {
        return {
          name: item,
          scope: 'local',
          type: 'variable'
        }
      })
    // 4 is the number of ancestral variables('globalValue1', 'globalValue2', 'globalValue3', 'globalValue4')
    expect(res.identifiers.length).toBe(target.length + 4)
    expect(res.identifiers.map(map1).filter((id) => id.scope === 'local')).toEqual(target)
  })

  test('function declarataion, function expression, arrow function expression', () => {
    const script = `
      function a() {}
      const b = function b() {}
      const c = () => {}
    `
    const res = parseScript(script)
    const target: IdentifierInScopeWithoutNode1[] = [
      {
        name: 'a',
        scope: 'local',
        type: 'function',
      },
      {
        name: 'b',
        scope: 'local',
        type: 'variable',
      },
      {
        name: 'c',
        scope: 'local',
        type: 'variable',
      },
    ]
    expect(res.identifiers.map(map1)).toEqual(target)
  })

  test('for statement, simple declaration', () => {
    const script = `for (let i = 0, j = 10, k = j;;) {}`
    const res = parseScript(script)
    const target: IdentifierInScopeWithoutNode1[] = [
      {
        name: 'i',
        type: 'variable',
        scope: 'local',
      },
      {
        name: 'j',
        type: 'variable',
        scope: 'local',
      },
      {
        name: 'k',
        type: 'variable',
        scope: 'local',
      },
    ]
    expect(res.children[0].identifiers.map(map1)).toEqual(target)
  })

  test('for statement, desconstructing declaration', () => {
    const script = `for (
      const user = {}, {
        key1,
        _key2: key2,
        key3 = key2,
        key4 = globalValue1,
        
        innerObj1: {
          key5,
          _key6: key6,
          key7 = key6,
          key8 = globalValue2,
          innerObj2: {
            key9,
            _key10: key10,
            key11 = key10,
            key12 = globalValue3,
            ...rest1
          },
          ...rest2
        },

        ...rest3
      } = user, obj = {
        key1: key1,
        key0: globalValue4,
        name: 1,
        age: 1,
        innerObj: {
          key1: key1,
          key0: globalValue4,
          name: 1,
          age: 1,
        }
      }
      ;;
      ) {}`
    const res = parseScript(script)
    const target: IdentifierInScopeWithoutNode1[] = [
      'user', 'key1', 'key2', 'key3', 'key4',
      'key5', 'key6', 'key7', 'key8', 'key9',
      'key10', 'key11', 'key12', 'rest1', 'rest2',
      'rest3', 'obj'
    ]
      .map((item) => {
        return {
          name: item,
          scope: 'local',
          type: 'variable'
        }
      })
    // 4 is the number of ancestral variables('globalValue1', 'globalValue2', 'globalValue3', 'globalValue4')
    expect(res.children[0].identifiers.length).toBe(target.length + 4)
    expect(res.children[0].identifiers.map(map1).filter((id) => id.scope === 'local')).toEqual(target)
  })

  test('for in statement, simple declaration', () => {
    const script = `for (let key in obj) {}`
    const res = parseScript(script)
    const target: IdentifierInScopeWithoutNode1[] = [
      {
        name: 'key',
        type: 'variable',
        scope: 'local',
      },
      {
        name: 'obj',
        type: 'unknown',
        scope: 'ancestral',
      },
    ]
    expect(res.children[0].identifiers.map(map1)).toEqual(target)
  })

  test('for in statement, desconstructing declaration', () => {
    const script = `for (let {
      key1,
      _key2: key2,
      key3 = key2,
      key4 = globalValue1,
      
      innerObj1: {
        key5,
        _key6: key6,
        key7 = key6,
        key8 = globalValue2,
        innerObj2: {
          key9,
          _key10: key10,
          key11 = key10,
          key12 = globalValue3,
          ...rest1
        },
        ...rest2
      },
      ...rest3
    } in obj) {}`
    const res = parseScript(script)
    const target: IdentifierInScopeWithoutNode1[] = [
      'key1', 'key2', 'key3', 'key4',
      'key5', 'key6', 'key7', 'key8', 'key9',
      'key10', 'key11', 'key12', 'rest1', 'rest2',
      'rest3'
    ].map((item) => {
      return {
        name: item,
        scope: 'local',
        type: 'variable'
      }
    })
    // 4 is the number of ancestral variables('globalValue1', 'globalValue2', 'globalValue3', 'obj')
    expect(res.children[0].identifiers.length).toBe(target.length + 4)
    expect(res.children[0].identifiers.map(map1).filter((id) => id.scope === 'local')).toEqual(target)
  })

  test('for of statement, simple declaration', () => {
    const script = `for (let key of obj) {}`
    const res = parseScript(script)
    const target: IdentifierInScopeWithoutNode1[] = [
      {
        name: 'key',
        type: 'variable',
        scope: 'local',
      },
      {
        name: 'obj',
        type: 'unknown',
        scope: 'ancestral',
      },
    ]
    expect(res.children[0].identifiers.map(map1)).toEqual(target)
  })

  test('for of statement, desconstructing declaration', () => {
    const script = `for (let {
      key1,
      _key2: key2,
      key3 = key2,
      key4 = globalValue1,
      
      innerObj1: {
        key5,
        _key6: key6,
        key7 = key6,
        key8 = globalValue2,
        innerObj2: {
          key9,
          _key10: key10,
          key11 = key10,
          key12 = globalValue3,
          ...rest1
        },
        ...rest2
      },
      ...rest3
    } of obj) {}`
    const res = parseScript(script)
    const target: IdentifierInScopeWithoutNode1[] = [
      'key1', 'key2', 'key3', 'key4',
      'key5', 'key6', 'key7', 'key8', 'key9',
      'key10', 'key11', 'key12', 'rest1', 'rest2',
      'rest3'
    ].map((item) => {
      return {
        name: item,
        scope: 'local',
        type: 'variable'
      }
    })
    // 4 is the number of ancestral variables('globalValue1', 'globalValue2', 'globalValue3', 'obj')
    expect(res.children[0].identifiers.length).toBe(target.length + 4)
    expect(res.children[0].identifiers.map(map1).filter((id) => id.scope === 'local')).toEqual(target)
  })

  test('export named identifier', () => {
    const script = `
      let var1, var2, var3
      export {
        var2,
        var3 as id3
      }
    `
    const res = parseModule(script)
    const target: IdentifierInScope[] = [
      {
        name: 'var1',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'var2',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'var3',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'var2',
        scope: 'unreachable',
        type: 'variable',
        imported: false,
        exported: true
      },
      {
        name: 'id3',
        scope: 'unreachable',
        type: 'variable',
        imported: false,
        exported: true
      },
    ]
    expect(res.identifiers).toEqual(target)
  })

  // estraverse don't support " export * as Test from 'moduleA' "
  // test('export all declaration', () => {})

  test('export variable declarataion directly', () => {
    const script = `
      export let var1 = 10
      let var2, var3
      export let var4 = 10
    `
    const res = parseModule(script)
    const target: IdentifierInScope[] = [
      {
        name: 'var1',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: true
      },
      {
        name: 'var2',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'var3',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'var4',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: true
      },
    ]
    expect(res.identifiers).toEqual(target)
  })

  test('default exports of variable, after its declaration', () => {
    const script = `
      let var1, var2
      export default var1
    `
    const res = parseModule(script)
    const target: IdentifierInScope[] = [
      {
        name: 'var1',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: true
      },
      {
        name: 'var2',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      }
    ]
    expect(res.identifiers).toEqual(target)
  })

  test('default exports of variable, before its declaration', () => {
    const script = `
      export default var2
      let var1, var2
    `
    const res = parseModule(script)
    const target: IdentifierInScope[] = [
      {
        name: 'var1',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'var2',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: true
      }
    ]
    expect(res.identifiers).toEqual(target)
  })

  test('export function declaration directly', () => {
    const script = `
      export function fn1() {}
      export function fn2() {}
    `
    const res = parseModule(script)
    const target: IdentifierInScope[] = [
      {
        name: 'fn1',
        type: 'function',
        scope: 'local',
        exported: true,
        imported: false
      },
      {
        name: 'fn2',
        type: 'function',
        scope: 'local',
        exported: true,
        imported: false
      }
    ]
    expect(res.identifiers).toEqual(target)
  })

  test('default function declaration exports, directly', () => {
    const script = `export default function fn1() {}`
    const res = parseModule(script)
    const ids: IdentifierInScope[] = [
      {
        name: 'fn1',
        scope: 'local',
        type: 'function',
        imported: false,
        exported: true
      }
    ]
    expect(res.identifiers).toEqual(ids)
  })

  test('default exports of function, before its declaration', () => {
    const script = `
      function fn1() {}
      export default fn1
    `
    const res = parseModule(script)
    const target: IdentifierInScope[] = [
      {
        name: 'fn1',
        type: 'function',
        scope: 'local',
        imported: false,
        exported: true
      }
    ]
    expect(res.identifiers).toEqual(target)
  })

  test('default exports of variable, after its declaration', () => {
    const script = `
      export default fn1
      function fn1() {}
    `
    const res = parseModule(script)
    const target: IdentifierInScope[] = [
      {
        name: 'fn1',
        type: 'function',
        scope: 'local',
        imported: false,
        exported: true
      }
    ]
    expect(res.identifiers).toEqual(target)
  })

  test('default anonymous function declaration exports', () => {
    const script = `export default function () {}`
    const res = parseModule(script)
    expect(res.identifiers).toEqual([])
  })

  test('default arrow function expression exports', () => {
    const script = `export default () => {}`
    const res = parseModule(script)
    expect(res.identifiers).toEqual([])
  })

  test('mixed declartion without module', () => {
    const script = `
      function fn1() {}
      let var1, var2;
      const var3 = 1, var4 = 3;
      function fn2() {}
      var var5, var6
      function fn3() {}
      const fn4 = function fn4() {}
      const fn5 = () => {}
    `
    const res = parseScript(script)
    const target: IdentifierInScopeWithoutNode1[] = [
      {
        name: 'fn1',
        scope: 'local',
        type: 'function'
      },
      {
        name: 'var1',
        scope: 'local',
        type: 'variable'
      },
      {
        name: 'var2',
        scope: 'local',
        type: 'variable'
      },
      {
        name: 'var3',
        scope: 'local',
        type: 'variable'
      },
      {
        name: 'var4',
        scope: 'local',
        type: 'variable'
      },
      {
        name: 'fn2',
        scope: 'local',
        type: 'function'
      },
      {
        name: 'var5',
        scope: 'local',
        type: 'variable'
      },
      {
        name: 'var6',
        scope: 'local',
        type: 'variable'
      },
      {
        name: 'fn3',
        scope: 'local',
        type: 'function'
      },
      {
        name: 'fn4',
        scope: 'local',
        type: 'variable'
      },
      {
        name: 'fn5',
        scope: 'local',
        type: 'variable'
      },
    ]
    expect(res.identifiers.map(map1)).toEqual(target)
  })

  test('mixed declartion within module', () => {
    const script = `
      export { a_var1, a_var2, a_var3 as var0 } from 'moduleA'
      import { b_var1, b_var2, var3 as b_var3 } from 'moduleB'
      import * as moduleC from 'moduleC'
      import moduleD from 'moduleD'
      function fn1() {}
      let var1, var2;
      const var3 = 1, var4 = 3;
      function fn2() {}
      var var5, var6
      export function fn3() {}
      const fn4 = function fn4() {}
      const fn5 = () => {}
      export {
        fn1,
        var1 as exportedVar1,
      }
      export default fn1
    `
    const res = parseModule(script)
    const target: IdentifierInScope[] = [
      {
        name: 'a_var1',
        scope: 'unreachable',
        type: 'variable',
        imported: false,
        exported: true
      },
      {
        name: 'a_var2',
        scope: 'unreachable',
        type: 'variable',
        imported: false,
        exported: true
      },
      {
        name: 'var0',
        scope: 'unreachable',
        type: 'variable',
        imported: false,
        exported: true
      },
      {
        name: 'b_var1',
        scope: 'local',
        type: 'variable',
        imported: true,
        exported: false
      },
      {
        name: 'b_var2',
        scope: 'local',
        type: 'variable',
        imported: true,
        exported: false
      },
      {
        name: 'b_var3',
        scope: 'local',
        type: 'variable',
        imported: true,
        exported: false
      },
      {
        name: 'moduleC',
        scope: 'local',
        type: 'variable',
        imported: true,
        exported: false
      },
      {
        name: 'moduleD',
        scope: 'local',
        type: 'variable',
        imported: true,
        exported: false
      },
      {
        name: 'fn1',
        scope: 'local',
        type: 'function',
        imported: false,
        exported: true
      },
      {
        name: 'var1',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'var2',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'var3',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'var4',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'fn2',
        scope: 'local',
        type: 'function',
        imported: false,
        exported: false
      },
      {
        name: 'var5',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'var6',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'fn3',
        scope: 'local',
        type: 'function',
        imported: false,
        exported: true
      },
      {
        name: 'fn4',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'fn5',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'fn1',
        scope: 'unreachable',
        type: 'variable',
        imported: false,
        exported: true
      },
      {
        name: 'exportedVar1',
        scope: 'unreachable',
        type: 'variable',
        imported: false,
        exported: true
      },
    ]
    expect(res.identifiers).toEqual(target)
  })

})