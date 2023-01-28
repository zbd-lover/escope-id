import type { IdentifierInScope } from '../../src'
import { analyzeScript } from '../helpers/analyze'
const classScript = `class A extends B {
    constructor(a) {b}
    static prop1 = 1;
    static [prop2] = 2;
    prop3 = 10;
    [prop4] = 11;
    
    static get value1() {
      return b
    }
    
    static set value1(a) {
      b
    }

    static method1(a) {
      b
    }
    
    method1(a) {
      b
    }
  }
`
describe('测试类是否被正确分析', () => {
  test('类声明', () => {
    const topScope = analyzeScript(classScript)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'A',
          type: 'class',
          hoisted: false,
          static: false,
          local: true
        },
        {
          name: 'B',
          type: 'unknown',
          hoisted: false,
          static: false,
          local: false
        }
      ] as IdentifierInScope[]
    )

    const classScope = topScope.children[0]
    expect(classScope.identifiers).toEqual(
      [
        {
          name: 'constructor',
          type: 'constructor',
          hoisted: false,
          static: false,
          local: false
        },
        {
          name: 'prop1',
          type: 'property',
          hoisted: false,
          static: true,
          local: false
        },
        {
          name: 'prop3',
          type: 'property',
          hoisted: false,
          static: false,
          local: false
        },
        {
          name: 'value1',
          type: 'get',
          hoisted: false,
          static: true,
          local: false
        },
        {
          name: 'value1',
          type: 'set',
          hoisted: false,
          static: true,
          local: false
        },
        {
          name: 'method1',
          type: 'method',
          hoisted: false,
          static: true,
          local: false
        },
        {
          name: 'method1',
          type: 'method',
          hoisted: false,
          static: false,
          local: false
        },
      ] as IdentifierInScope[]
    )
    expect(classScope.children.length).toBe(5)
    const [a, b, c, d, e] = classScope.children
    expect(a.identifiers).toEqual(c.identifiers)
    expect(a.identifiers).toEqual(d.identifiers)
    expect(a.identifiers).toEqual(e.identifiers)
    expect(a.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'argument',
          hoisted: false,
          local: true,
          static: false
        },
        {
          name: 'b',
          type: 'unknown',
          hoisted: false,
          local: false,
          static: false
        },
      ] as IdentifierInScope[]
    )
    expect(b.identifiers).toEqual(
      [
        {
          name: 'b',
          type: 'unknown',
          hoisted: false,
          local: false,
          static: false
        },
      ] as IdentifierInScope[]
    )
  })

  test('类表达式', () => {
    const script = `const A = ${classScript}`
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'A',
          type: 'variable',
          hoisted: false,
          static: false,
          local: true
        },
        {
          name: 'B',
          type: 'unknown',
          hoisted: false,
          static: false,
          local: false
        }
      ] as IdentifierInScope[]
    )

    const classScope = topScope.children[0]
    expect(classScope.identifiers).toEqual(
      [
        {
          name: 'constructor',
          type: 'constructor',
          hoisted: false,
          static: false,
          local: false
        },
        {
          name: 'prop1',
          type: 'property',
          hoisted: false,
          static: true,
          local: false
        },
        {
          name: 'prop3',
          type: 'property',
          hoisted: false,
          static: false,
          local: false
        },
        {
          name: 'value1',
          type: 'get',
          hoisted: false,
          static: true,
          local: false
        },
        {
          name: 'value1',
          type: 'set',
          hoisted: false,
          static: true,
          local: false
        },
        {
          name: 'method1',
          type: 'method',
          hoisted: false,
          static: true,
          local: false
        },
        {
          name: 'method1',
          type: 'method',
          hoisted: false,
          static: false,
          local: false
        },
      ] as IdentifierInScope[]
    )
    expect(classScope.children.length).toBe(5)
    const [a, b, c, d, e] = classScope.children
    expect(a.identifiers).toEqual(c.identifiers)
    expect(a.identifiers).toEqual(d.identifiers)
    expect(a.identifiers).toEqual(e.identifiers)
    expect(a.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'argument',
          hoisted: false,
          local: true,
          static: false
        },
        {
          name: 'b',
          type: 'unknown',
          hoisted: false,
          local: false,
          static: false
        },
      ] as IdentifierInScope[]
    )
    expect(b.identifiers).toEqual(
      [
        {
          name: 'b',
          type: 'unknown',
          hoisted: false,
          local: false,
          static: false
        },
      ] as IdentifierInScope[]
    )
  })
})
