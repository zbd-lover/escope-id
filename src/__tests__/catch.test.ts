import { type IdentifierInScope } from '../../src'
import { analyzeScript, wrapScriptWithVarDeclarations } from './helpers/analyze'

describe('catch语句', () => {
  test('生成的作用域应正确闭合，且不影响上下文', () => {
    const expectIdA: IdentifierInScope = {
      name: 'a',
      hoisted: false,
      local: true,
      type: 'variable',
    }
    const expectIdB: IdentifierInScope = {
      name: 'b',
      hoisted: false,
      local: true,
      type: 'variable',
    }

    function test1 () {
      const topScope = analyzeScript(wrapScriptWithVarDeclarations('try {} catch(e) { const a = 10 }'))
      const catchScope = topScope.children[1]
      expect(topScope.children.length).toBe(2)
      expect(topScope.identifiers).toEqual([expectIdA, expectIdB])
      expect(catchScope.identifiers).toEqual([
        {
          name: 'e',
          type: 'argument',
          hoisted: false,
          local: true
        },
        {
          name: 'a',
          type: 'variable',
          hoisted: false,
          local: true
        },
      ] as IdentifierInScope[])
    }

    function test2 () {
      const topScope = analyzeScript(wrapScriptWithVarDeclarations('try {} catch({ a, b = c, d: { e, f } }) { const g = 1; }'))
      const catchScope = topScope.children[1]
      expect(topScope.children.length).toBe(2)
      expect(topScope.identifiers).toEqual([expectIdA, expectIdB])
      expect(catchScope.identifiers).toEqual([
        {
          name: 'a',
          type: 'argument',
          hoisted: false,
          local: true
        },
        {
          name: 'b',
          type: 'argument',
          hoisted: false,
          local: true
        },
        {
          name: 'c',
          type: 'unknown',
          hoisted: false,
          local: false
        },
        {
          name: 'e',
          type: 'argument',
          hoisted: false,
          local: true
        },
        {
          name: 'f',
          type: 'argument',
          hoisted: false,
          local: true
        },
        {
          name: 'g',
          type: 'variable',
          hoisted: false,
          local: true
        },
      ] as IdentifierInScope[])
    }

    test1()
    test2()
  })

  describe('允许嵌套其它语句或表达式生成的作用域', () => {
    test('嵌套块语句', () => {
      const topScope = analyzeScript('try {} catch(e) { { } }')
      const catchScope = topScope.children[1]
      expect(catchScope.children.length).toBe(1)
      expect(catchScope.children[0].node.type).toBe('BlockStatement')
    })

    test('嵌套switch语句', () => {
      const topScope = analyzeScript('try {} catch(e) { switch(a) {} }')
      const catchScope = topScope.children[1]
      expect(catchScope.children.length).toBe(1)
      expect(catchScope.children[0].node.type).toBe('SwitchStatement')
    })

    test('嵌套for语句', () => {
      const topScope = analyzeScript('try {} catch(e) { for(;;) {} }')
      const catchScope = topScope.children[1]
      expect(catchScope.children.length).toBe(1)
      expect(catchScope.children[0].node.type).toBe('ForStatement')
    })

    test('嵌套for-in语句', () => {
      const topScope = analyzeScript('try {} catch(e) { for(const key in keys) {} }')
      const catchScope = topScope.children[1]
      expect(catchScope.children.length).toBe(1)
      expect(catchScope.children[0].node.type).toBe('ForInStatement')
    })

    test('嵌套for-of语句', () => {
      const topScope = analyzeScript('try {} catch(e) { for(const key of keys) {} }')
      const catchScope = topScope.children[1]
      expect(catchScope.children.length).toBe(1)
      expect(catchScope.children[0].node.type).toBe('ForOfStatement')
    })

    test('嵌套函数声明', () => {
      const topScope = analyzeScript('try {} catch(e) { function fn(){} }')
      const catchScope = topScope.children[1]
      expect(catchScope.children.length).toBe(1)
      expect(catchScope.children[0].node.type).toBe('FunctionDeclaration')
    })

    test('嵌套具名函数表达式', () => {
      const topScope = analyzeScript('try {} catch(e) { const fn = function fn(){} }')
      const catchScope = topScope.children[1]
      expect(catchScope.children.length).toBe(1)
      expect(catchScope.children[0].node.type).toBe('FunctionExpression')
    })

    test('嵌套匿名函数表达式', () => {
      const topScope = analyzeScript('try {} catch(e) { const fn = function (){} }')
      const catchScope = topScope.children[1]
      expect(catchScope.children.length).toBe(1)
      expect(catchScope.children[0].node.type).toBe('FunctionExpression')
    })

    test('嵌套箭头函数表达式（携带语句块）', () => {
      const topScope = analyzeScript('try {} catch(e) { const fn = () => {} }')
      const catchScope = topScope.children[1]
      expect(catchScope.children.length).toBe(1)
      expect(catchScope.children[0].node.type).toBe('ArrowFunctionExpression')
    })

    test('嵌套箭头函数表达式（直接返回表达式）', () => {
      const topScope = analyzeScript('try {} catch(e) { const fn = () => null }')
      const catchScope = topScope.children[1]
      expect(catchScope.children.length).toBe(1)
      expect(catchScope.children[0].node.type).toBe('ArrowFunctionExpression')
    })

    test('嵌套try-catch语句', () => {
      const topScope = analyzeScript('try {} catch(e) {  try {} catch(e) {} }')
      const catchScope = topScope.children[1]
      expect(catchScope.children.length).toBe(2)
      expect(catchScope.children[1].node.type).toBe('CatchClause')
    })

    test('嵌套类声明', () => {
      const topScope = analyzeScript('try {} catch(e) {  class A {} }')
      const catchScope = topScope.children[1]
      const classScope = catchScope.children[0]
      expect(catchScope.children.length).toBe(1)
      expect(classScope.node.type).toBe('ClassDeclaration')
    })

    test('嵌套具名类表达式', () => {
      const topScope = analyzeScript('try {} catch(e) {  const A = class A {} }')
      const catchScope = topScope.children[1]
      const classScope = catchScope.children[0]
      expect(catchScope.children.length).toBe(1)
      expect(classScope.node.type).toBe('ClassExpression')
    })

    test('嵌套匿名类表达式', () => {
      const topScope = analyzeScript('try {} catch(e) {  const A = class {} }')
      const catchScope = topScope.children[1]
      const classScope = catchScope.children[0]
      expect(catchScope.children.length).toBe(1)
      expect(classScope.node.type).toBe('ClassExpression')
    })

    test('嵌套with语句', () => {
      const topScope = analyzeScript('try {} catch(e) {  with(window){} }')
      const catchScope = topScope.children[1]
      const withScope = catchScope.children[0]
      expect(catchScope.children.length).toBe(1)
      expect(withScope.node.type).toBe('WithStatement')
    })
  })
})
