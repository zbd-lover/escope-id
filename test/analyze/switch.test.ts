import { ClassDefiniton, Scope, type IdentifierInScope } from '../../src'
import { analyzeScript, wrapScriptWithVarDeclarations } from '../helpers/analyze'

describe('switch语句', () => {
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

    const topScope = analyzeScript(wrapScriptWithVarDeclarations('switch(a) { case 1: const b = 10; }'))
    expect(topScope.children.length).toBe(1)
    expect(topScope.identifiers).toEqual([expectIdA, expectIdB])
  })

  describe('允许嵌套其它语句或表达式生成的作用域', () => {
    test('嵌套块语句', () => {
      const topScope = analyzeScript('switch(a) { case 1: {;}}')
      const blockScope = topScope.children[0] as Scope
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('BlockStatement')
    })

    test('嵌套switch语句', () => {
      const topScope = analyzeScript('switch(a) { case 1: switch(a) {} }')
      const blockScope = topScope.children[0] as Scope
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('SwitchStatement')
    })

    test('嵌套for语句', () => {
      const topScope = analyzeScript('switch(a) { case 1: for(;;) {} }')
      const blockScope = topScope.children[0] as Scope
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('ForStatement')
    })

    test('嵌套for-in语句', () => {
      const topScope = analyzeScript('switch(a) { case 1: for(const key in keys) {} }')
      const blockScope = topScope.children[0] as Scope
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('ForInStatement')
    })

    test('嵌套for-of语句', () => {
      const topScope = analyzeScript('switch(a) { case 1: for(const key of keys) {} }')
      const blockScope = topScope.children[0] as Scope
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('ForOfStatement')
    })

    test('嵌套函数声明', () => {
      const topScope = analyzeScript('switch(a) { case 1: function fn(){} }')
      const blockScope = topScope.children[0] as Scope
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('FunctionDeclaration')
    })

    test('嵌套函数表达式', () => {
      const topScope = analyzeScript('switch(a) { case 1: const fn = function fn(){} }')
      const blockScope = topScope.children[0] as Scope
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('FunctionExpression')
    })

    test('嵌套箭头函数表达式（携带语句块）', () => {
      const topScope = analyzeScript('switch(a) { case 1: const fn = () => {} }')
      const blockScope = topScope.children[0] as Scope
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
    })
    
    test('嵌套箭头函数表达式（直接返回表达式）', () => {
      const topScope = analyzeScript('switch(a) { case 1: const fn = () => null }')
      const blockScope = topScope.children[0] as Scope
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
    })

    test('嵌套try-catch语句', () => {
      const topScope = analyzeScript('switch(a) { case 1: try {} catch(e) {} }')
      const blockScope = topScope.children[0] as Scope
      expect(blockScope.children.length).toBe(2)
      expect(blockScope.children[1].node.type).toBe('CatchClause')
    })

    test('嵌套类声明', () => {
      const topScope = analyzeScript('switch(a) { case 1: class A {} }')
      const blockScope = topScope.children[0] as Scope
      const classDef = blockScope.children[0] as ClassDefiniton
      expect(blockScope.children.length).toBe(1)
      expect(classDef instanceof ClassDefiniton).toBe(true)
    })

    test('嵌套类表达式', () => {
      const topScope = analyzeScript('switch(a) { case 1: const A = class A {} }')
      const blockScope = topScope.children[0] as Scope
      const classDef = blockScope.children[0] as ClassDefiniton
      expect(blockScope.children.length).toBe(1)
      expect(classDef instanceof ClassDefiniton).toBe(true)
    })

    test('嵌套with语句', () => {
      const topScope = analyzeScript('switch(a) { case 1: with(window){} }')
      const blockScope = topScope.children[0] as Scope
      const withScope = blockScope.children[0] as Scope
      expect(blockScope.children.length).toBe(1)
      expect(withScope.node.type).toBe('WithStatement')
    })
  })
})