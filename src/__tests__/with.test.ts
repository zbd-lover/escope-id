import { type IdentifierInScope } from '../../src'
import { analyzeScript } from './helpers/analyze'

describe('with语句', () => {
  test('生成的作用域应正确闭合，且不影响上下文', () => {
    const topScope = analyzeScript('const a = 10; with(a) { }; const b = 10;')
    expect(topScope.children.length).toBe(1)
    expect(topScope.identifiers).toEqual([
      {
        name: 'a',
        type: 'variable',
        hoisted: false,
        local: true
      },
      {
        name: 'b',
        type: 'variable',
        hoisted: false,
        local: true
      }
    ] as IdentifierInScope[])
  })

  test('不分析with语句中的标识符以及作用域', () => {
    const topScope = analyzeScript('with(a) { const var1 = 10; function fn1() {} };')
    const withScope = topScope.children[0]
    expect(withScope.children.length).toBe(0)
    expect(withScope.identifiers.length).toBe(0)
  })
})
