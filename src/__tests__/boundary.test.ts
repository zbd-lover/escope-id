import { Scope, type IdentifierInScope } from '../../src'
import { analyzeScript } from './helpers/analyze'

describe('边界情况测试', () => {
  test('函数表达式在其内部被访问', () => {
    const script = `
      const a = function A() {
        A;
      }
    `
    const topScope = analyzeScript(script)
    const fnScope = topScope.children[0] as Scope
    expect(fnScope.identifiers).toEqual([
      {
        name: 'A',
        type: 'function',
        local: false,
        hoisted: false
      }
    ] as IdentifierInScope[])
  })

  test('类表达式在其内部被访问', () => {
    const script = `
      const a = class A {
        method1() {
          A
        }

        method2() {
          method2()
        }
      }
    `
    const topScope = analyzeScript(script)
    const classDef = topScope.children[0]
    const [fnScope0, fnScope1] = classDef.children as Scope[]
    expect(fnScope0.identifiers).toEqual([
      {
        name: 'A',
        type: 'class',
        local: false,
        hoisted: false
      }
    ] as IdentifierInScope[])
    expect(fnScope1.identifiers).toEqual([
      {
        name: 'method2',
        type: 'unknown',
        local: false,
        hoisted: false
      }
    ] as IdentifierInScope[])
  })
})