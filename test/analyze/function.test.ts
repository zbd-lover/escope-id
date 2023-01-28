import type { IdentifierInScope } from '../../src'
import { analyzeScript } from '../helpers/analyze'

describe('测试函数是否被正确分析', () => {
  test('函数声明', () => {
    const script = 'function fn1(a, { b = c }, d) {}'
    const topScope = analyzeScript(script)
    expect(topScope.children.length).toBe(1)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'fn1',
          type: 'function',
          hoisted: true,
          static: false,
          local: true
        }
      ] as IdentifierInScope[]
    )
    const fnScope = topScope.children[0]
    expect(fnScope.node.type === 'FunctionDeclaration').toBe(true)
    expect(fnScope.children.length).toBe(0)
    expect(fnScope.identifiers).toEqual(
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
          type: 'argument',
          hoisted: false,
          local: true,
          static: false
        },
        {
          name: 'c',
          type: 'unknown',
          hoisted: false,
          local: false,
          static: false
        },
        {
          name: 'd',
          type: 'argument',
          hoisted: false,
          local: true,
          static: false
        },
      ] as IdentifierInScope[]
    )
  })

  test('函数表达式', () => {
    const script = 'const fn1 = function fn1(a, { b = c }, d) {}'
    const topScope = analyzeScript(script)
    expect(topScope.children.length).toBe(1)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'fn1',
          type: 'variable',
          hoisted: false,
          static: false,
          local: true
        }
      ] as IdentifierInScope[]
    )
    const fnScope = topScope.children[0]
    expect(fnScope.node.type === 'FunctionExpression').toBe(true)
    expect(fnScope.children.length).toBe(0)
    expect(fnScope.identifiers).toEqual(
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
          type: 'argument',
          hoisted: false,
          local: true,
          static: false
        },
        {
          name: 'c',
          type: 'unknown',
          hoisted: false,
          local: false,
          static: false
        },
        {
          name: 'd',
          type: 'argument',
          hoisted: false,
          local: true,
          static: false
        },
      ] as IdentifierInScope[]
    )
  })

  test('箭头函数表达式（携带语句块）', () => {
    const script = 'const fn1 = (a, { b = c }, d) => {}'
    const topScope = analyzeScript(script)
    expect(topScope.children.length).toBe(1)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'fn1',
          type: 'variable',
          hoisted: false,
          static: false,
          local: true
        }
      ] as IdentifierInScope[]
    )
    const fnScope = topScope.children[0]
    expect(fnScope.node.type === 'ArrowFunctionExpression').toBe(true)
    expect(fnScope.children.length).toBe(0)
    expect(fnScope.identifiers).toEqual(
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
          type: 'argument',
          hoisted: false,
          local: true,
          static: false
        },
        {
          name: 'c',
          type: 'unknown',
          hoisted: false,
          local: false,
          static: false
        },
        {
          name: 'd',
          type: 'argument',
          hoisted: false,
          local: true,
          static: false
        },
      ] as IdentifierInScope[]
    )
  })

  test('箭头函数表达式（不携带语句块）', () => {
    const script = 'const fn1 = (a, { b = c }, d) => null'
    const topScope = analyzeScript(script)
    expect(topScope.children.length).toBe(1)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'fn1',
          type: 'variable',
          hoisted: false,
          static: false,
          local: true
        }
      ] as IdentifierInScope[]
    )
    const fnScope = topScope.children[0]
    expect(fnScope.node.type === 'ArrowFunctionExpression').toBe(true)
    expect(fnScope.children.length).toBe(0)
    expect(fnScope.identifiers).toEqual(
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
          type: 'argument',
          hoisted: false,
          local: true,
          static: false
        },
        {
          name: 'c',
          type: 'unknown',
          hoisted: false,
          local: false,
          static: false
        },
        {
          name: 'd',
          type: 'argument',
          hoisted: false,
          local: true,
          static: false
        },
      ] as IdentifierInScope[]
    )
  })
})
