import { ClassDefiniton, Scope } from '../../src'
import { analyzeModule, analyzeScript } from '../helpers/analyze'

describe('Js全局运行环境', () => {
  describe('允许嵌套其它语句或表达式生成的作用域', () => {
    test('嵌套块语句', () => {
      const topScope = analyzeScript('{;}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope.node.type).toBe('BlockStatement')
    })

    test('嵌套switch语句', () => {
      const topScope = analyzeScript('switch(a) {}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope.node.type).toBe('SwitchStatement')
    })

    test('嵌套for语句', () => {
      const topScope = analyzeScript('for(;;) {}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope.node.type).toBe('ForStatement')
    })

    test('嵌套for-in语句', () => {
      const topScope = analyzeScript('for(const key in keys) {}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope.node.type).toBe('ForInStatement')
    })

    test('嵌套for-of语句', () => {
      const topScope = analyzeScript('for(const key of keys) {}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope.node.type).toBe('ForOfStatement')
    })

    test('嵌套具名函数声明', () => {
      const topScope = analyzeScript('function fn(){}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope.node.type).toBe('FunctionDeclaration')
    })

    test('嵌套匿名函数声明', () => {
      const topScope = analyzeModule('export default function (){}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope.node.type).toBe('FunctionDeclaration')
    })

    test('嵌套具名函数表达式', () => {
      const topScope = analyzeScript('const fn = function fn(){}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope.node.type).toBe('FunctionExpression')
    })

    test('嵌套匿名函数表达式', () => {
      const topScope = analyzeScript('const fn = function (){}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope.node.type).toBe('FunctionExpression')
    })

    test('嵌套箭头函数表达式（携带语句块）', () => {
      const topScope = analyzeScript('const fn = () => {}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope.node.type).toBe('ArrowFunctionExpression')
    })

    test('嵌套箭头函数表达式（直接返回表达式）', () => {
      const topScope = analyzeScript('const fn = () => null')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope.node.type).toBe('ArrowFunctionExpression')
    })

    test('嵌套try-catch语句', () => {
      const topScope = analyzeScript('try {} catch(e) {}')
      const targetScope = topScope.children[1] as Scope
      expect(topScope.children.length).toBe(2)
      expect(targetScope.node.type).toBe('CatchClause')
    })

    test('嵌套类声明', () => {
      const topScope = analyzeScript('class A {}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope instanceof ClassDefiniton).toBe(true)
    })

    test('嵌套具名类表达式', () => {
      const topScope = analyzeScript('const A = class A {}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope instanceof ClassDefiniton).toBe(true)
    })

    test('嵌套匿名类表达式', () => {
      const topScope = analyzeScript('const A = class {}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope instanceof ClassDefiniton).toBe(true)
    })

    test('嵌套with语句', () => {
      const topScope = analyzeScript('with(window){}')
      const targetScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(targetScope.node.type).toBe('WithStatement')
    })
  })
})
