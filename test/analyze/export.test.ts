import type { IdentifierInScope } from '../../src'
import { analyzeModule } from '../helpers/analyze'

describe('测试导出相关', () => {
  test('应不分析导出全部和命名导出中的标识符', () => {
    const script = `
      export * as A from 'A'
      const a = 10
      export {
        a as b
      }
    `
    const topScope = analyzeModule(script)
    expect(topScope.find('A')).toBeNull()
    expect(topScope.find('b')).toBeNull()
  })

  test('导出已声明的变量', () => {
    const script = 'const a = 10; export default a'
    const topScope = analyzeModule(script)
    expect(topScope.identifiers).toEqual([
      {
        name: 'a',
        type: 'variable',
        hoisted: false,
        local: true
      },
    ] as IdentifierInScope[])
  })

  test('导出未声明的变量', () => {
    const script = 'export default a + c'
    const topScope = analyzeModule(script)
    expect(topScope.identifiers).toEqual([
      {
        name: 'a',
        type: 'unknown',
        hoisted: false,
        local: false
      },
      {
        name: 'c',
        type: 'unknown',
        hoisted: false,
        local: false
      }
    ] as IdentifierInScope[])
  })

  test('导出具名类声明', () => {
    const script = 'export default class A extends B {}'
    const topScope = analyzeModule(script)
    expect(topScope.children.length).toBe(1)
    expect(topScope.identifiers).toEqual([
      {
        name: 'A',
        type: 'class',
        hoisted: false,
        local: true
      },
      {
        name: 'B',
        type: 'unknown',
        hoisted: false,
        local: false
      }
    ] as IdentifierInScope[])
  })

  test('导出匿名类声明', () => {
    const script = 'export default class extends B {}'
    const topScope = analyzeModule(script)
    expect(topScope.children.length).toBe(1)
    expect(topScope.identifiers).toEqual([
      {
        name: 'B',
        type: 'unknown',
        hoisted: false,
        local: false
      }
    ] as IdentifierInScope[])
  })

  test('导出具名函数声明', () => {
    const script = 'export default function fn() {} '
    const topScope = analyzeModule(script)
    expect(topScope.children.length).toBe(1)
    expect(topScope.identifiers).toEqual([
      {
        name: 'fn',
        type: 'function',
        hoisted: true,
        local: true
      },
    ] as IdentifierInScope[])
  })

  test('导出匿名函数声明', () => {
    const script = 'export default function () {} '
    const topScope = analyzeModule(script)
    expect(topScope.children.length).toBe(1)
    expect(topScope.identifiers).toEqual([])
  })

  test('导出箭头函数表达式', () => {
    const script = 'export default () => {} '
    const topScope = analyzeModule(script)
    expect(topScope.children.length).toBe(1)
    expect(topScope.identifiers).toEqual([])
  })
})