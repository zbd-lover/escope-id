import { parse as parseAST, Options } from "acorn"
import { Program, } from "estree";
import parse, { IdentifierInScope } from "../src";

const options1: Options = {
  ecmaVersion: 'latest',
  sourceType: 'script'
}

const options2: Options = {
  ecmaVersion: 'latest',
  sourceType: 'module'
}

function getProgram(script: string, options: Options) {
  return parseAST(script, options) as unknown as Program
}

type IdentifierInScopeWithoutNode1 = Omit<IdentifierInScope, 'imported' | 'exported'>

const map1 = ({ name, scope, type }: IdentifierInScope) => {
  return {
    name,
    scope,
    type
  }
}

describe('local variable', () => {
  test('plain variable declarataion', () => {
    const script = `
      let a, b, c;
      const d = 1, e = 2, f = 3;
      var g, h, i;
      globalValue = 10
    `
    const res = parse(getProgram(script, options1))
    const target0: IdentifierInScopeWithoutNode1[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
      .map((item) => {
        return {
          name: item,
          scope: 'local',
          type: 'variable'
        }
      })
    expect(res.identifiers.map(map1)).toEqual(target0)
  })

  test('variable deconstruction declarataion', () => {
    const script = `
      let a, b, c;
      const user = {}
    `
    const res = parse(getProgram(script, options1))
    const target0: IdentifierInScopeWithoutNode1[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
      .map((item) => {
        return {
          name: item,
          scope: 'local',
          type: 'variable'
        }
      })
    expect(res.identifiers.map(map1)).toEqual(target0)
  })

  test('imported variable declaration', () => {
    const script = `
      import { var1, var2, var3 as var4 } from 'moduleA'
      import * as moduleC from 'moduleC'
      import moduleD from 'moduleD'
    `
    const res = parse(getProgram(script, options2))
    const target0: IdentifierInScope[] = ['var1', 'var2', 'var4', 'moduleC', 'moduleD']
      .map((item) => {
        return {
          name: item,
          scope: 'local',
          type: 'variable',
          imported: true,
          exported: false
        }
      })
    expect(res.identifiers).toEqual(target0)
  })

  test('exported variable declaration', () => {
    const script = `
      let var1, var2, var3

      export let var4 = 10
      export default var1
      export {
        var2,
        var3 as id3
      }
    `
    const res = parse(getProgram(script, options2))
    const target0: IdentifierInScope[] = ['var1', 'var2', 'var4', 'id3']
      .map((item) => {
        return {
          name: item,
          scope: 'local',
          type: 'variable',
          imported: false,
          exported: true
        }
      })
    expect(res.identifiers.filter((id) => id.exported)).toEqual(target0)
  })

  test('function declarataion', () => {
    const script = `
      function a() {}
      
      const b = function b() {}
      const c = () => {}
    `
    const res = parse(getProgram(script, options1))
    const target0: IdentifierInScopeWithoutNode1 = {
      name: 'a',
      scope: 'local',
      type: 'function'
    }
    const ids = res.identifiers.map(map1)
    expect(ids.filter((id) => id.type === 'function').length).toBe(1)
    expect(ids[0]).toEqual(target0)
  })

  test('exported function declaration', () => {
    const script = `
      function fn1() {}
      
      export default function fn2() {}

      function fn3() {}
      
      export {
        fn3,
        fn1 as fn5
      }
    `
    const res = parse(getProgram(script, options2))
    const target0: IdentifierInScope[] = [
      {
        name: 'fn2',
        type: 'function',
        scope: 'local',
        exported: true,
        imported: false
      },
      {
        name: 'fn3',
        type: 'variable',
        scope: 'local',
        exported: true,
        imported: false
      },
      {
        name: 'fn5',
        type: 'variable',
        scope: 'local',
        exported: true,
        imported: false
      },
    ]
    expect(res.identifiers.filter((id) => id.exported)).toEqual(target0)
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
    const res = parse(getProgram(script, options1))
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
    const target: IdentifierInScope[] = [
      {
        name: 'a_var1',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: true
      },
      {
        name: 'a_var2',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: true
      },
      {
        name: 'var0',
        scope: 'local',
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
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: true
      },
      {
        name: 'exportedVar1',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: true
      },
    ]
    const res = parse(getProgram(script, options2))
    console.log(res.identifiers)
    expect(res.identifiers).toEqual(target)
  })
})