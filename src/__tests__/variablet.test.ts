import type { IdentifierInScope } from '../../src'
import { analyzeScript } from './helpers/analyze'

describe('测试变量声明的标识符是否被正确分析', () => {
  test('使用var声明的变量', () => {
    const script = 'var a = 10'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'variable',
          hoisted: true,
          local: true,
        }
      ] as IdentifierInScope[]
    )
  })

  test('使用let或const声明的变量', () => {
    const script = 'let a = 10; const b = 10'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'b',
          type: 'variable',
          hoisted: false,
          local: true,
        }
      ] as IdentifierInScope[]
    )
  })

  test('使用对象解构声明的变量', () => {
    const script = 'const { a, b: c, d = globalVar1, e: { f, g }, ...rest } = obj'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'c',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'd',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'globalVar1',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
        {
          name: 'f',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'g',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'rest',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'obj',
          type: 'unknown',
          hoisted: false,
          local: false,
        }
      ] as IdentifierInScope[]
    )
  })

  test('使用数组解构声明的变量', () => {
    const script = 'const [a, c, d = globalVar1, [f, g], ...rest] = obj'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'c',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'd',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'globalVar1',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
        {
          name: 'f',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'g',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'rest',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'obj',
          type: 'unknown',
          hoisted: false,
          local: false,
        }
      ] as IdentifierInScope[]
    )
  })
})
