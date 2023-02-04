import { type IdentifierInScope } from '../../src'
import { analyzeScript, wrapScriptWithVarDeclarations } from './helpers/analyze'

describe('块语句', () => {
  describe('生成的作用域应正确闭合，且不影响上下文', () => {
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

    test('在Js全局运行环境中', () => {
      const script = '{ const a = 10 }'
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(script))
      const blockScope = topScope.children[0]
      expect(topScope.children.length).toBe(1)
      expect(topScope.identifiers).toEqual([expectIdA, expectIdB])
      expect(blockScope.node.type).toBe('BlockStatement')
      expect(blockScope.identifiers).toEqual([expectIdA])
    })

    test('伴随for语句', () => {
      const script = 'for (;;) {}'
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(script))
      expect(topScope.children[0].node.type).toBe('ForStatement')
      expect(topScope.identifiers).toEqual([expectIdA, expectIdB])
    })

    test('伴随for-in语句', () => {
      const script = 'for (const key in keys) {}'
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(script))
      expect(topScope.children[0].node.type).toBe('ForInStatement')
      expect(topScope.identifiers).toEqual([expectIdA, expectIdB])
    })

    test('伴随for-of语句', () => {
      const script = 'for (const key of keys) {}'
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(script))
      expect(topScope.children[0].node.type).toBe('ForOfStatement')
      expect(topScope.identifiers).toEqual([expectIdA, expectIdB])
    })

    test('伴随if语句', () => {
      const script = 'if (a) { const b = 10; } else if (a) { const b = 10; } else { const b = 10; }'
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(script))
      expect(topScope.children.length).toBe(3)
      expect(topScope.identifiers).toEqual([expectIdA, expectIdB])
      const [a, b, c] = topScope.children
      expect(a.node.type).toBe('BlockStatement')
      expect(b.node.type).toBe('BlockStatement')
      expect(c.node.type).toBe('BlockStatement')
      expect(a.identifiers).toEqual([expectIdB])
      expect(b.identifiers).toEqual([expectIdB])
      expect(c.identifiers).toEqual([expectIdB])
    })

    test('伴随while语句', () => {
      const script = 'while (a) { const b = 10; }'
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(script))
      const [a] = topScope.children
      expect(topScope.children.length).toBe(1)
      expect(topScope.children[0].node.type).toBe('BlockStatement')
      expect(topScope.identifiers).toEqual([expectIdA, expectIdB])
      expect(a.identifiers).toEqual([expectIdB])
    })

    test('伴随do-while语句', () => {
      const script = 'while (a) { const b = 10; }'
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(script))
      const [a] = topScope.children
      expect(topScope.children.length).toBe(1)
      expect(topScope.children[0].node.type).toBe('BlockStatement')
      expect(topScope.identifiers).toEqual([expectIdA, expectIdB])
      expect(a.identifiers).toEqual([expectIdB])

    })

    test('伴随try-catch语句', () => {
      const script = 'try { const b = 10;  } catch(e) {} finally { const b = 10; }'
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(script))
      expect(topScope.children.length).toBe(3)
      expect(topScope.identifiers).toEqual([expectIdA, expectIdB])
      const [a, b, c] = topScope.children
      expect(a.node.type).toBe('BlockStatement')
      expect(b.node.type).toBe('CatchClause')
      expect(c.node.type).toBe('BlockStatement')
      expect(a.identifiers).toEqual([expectIdB])
      expect(c.identifiers).toEqual([expectIdB])
    })
  })

  describe('允许嵌套其它语句或表达式生成的作用域', () => {
    test('嵌套块语句', () => {
      const topScope = analyzeScript('{ { } }')
      const blockScope = topScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('BlockStatement')
    })

    test('嵌套switch语句', () => {
      const topScope = analyzeScript('{ switch(a) {} }')
      const blockScope = topScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('SwitchStatement')
    })

    test('嵌套for语句', () => {
      const topScope = analyzeScript('{ for(;;) {} }')
      const blockScope = topScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('ForStatement')
    })

    test('嵌套for-in语句', () => {
      const topScope = analyzeScript('{ for(const key in keys) {} }')
      const blockScope = topScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('ForInStatement')
    })

    test('嵌套for-of语句', () => {
      const topScope = analyzeScript('{ for(const key of keys) {} }')
      const blockScope = topScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('ForOfStatement')
    })

    test('嵌套函数声明', () => {
      const topScope = analyzeScript('{ function fn(){} }')
      const blockScope = topScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('FunctionDeclaration')
    })

    test('嵌套具名函数表达式', () => {
      const topScope = analyzeScript('{ const fn = function fn(){} }')
      const blockScope = topScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('FunctionExpression')
    })

    test('嵌套匿名函数表达式', () => {
      const topScope = analyzeScript('{ const fn = function (){} }')
      const blockScope = topScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('FunctionExpression')
    })

    test('嵌套箭头函数表达式（携带语句块）', () => {
      const topScope = analyzeScript('{ const fn = () => {} }')
      const blockScope = topScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
    })

    test('嵌套箭头函数表达式（直接返回表达式）', () => {
      const topScope = analyzeScript('{ const fn = () => null }')
      const blockScope = topScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
    })

    test('嵌套try-catch语句', () => {
      const topScope = analyzeScript('{ try {} catch(e) {} }')
      const blockScope = topScope.children[0]
      expect(blockScope.children.length).toBe(2)
      expect(blockScope.children[1].node.type).toBe('CatchClause')
    })

    test('嵌套类声明', () => {
      const topScope = analyzeScript('{ class A {} }')
      const blockScope = topScope.children[0]
      const classScope = blockScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(classScope.node.type).toBe('ClassDeclaration')
    })

    test('嵌套具名类表达式', () => {
      const topScope = analyzeScript('{ const A = class A {} }')
      const blockScope = topScope.children[0]
      const classScope = blockScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(classScope.node.type).toBe('ClassExpression')
    })

    test('嵌套匿名类表达式', () => {
      const topScope = analyzeScript('{ const A = class {} }')
      const blockScope = topScope.children[0]
      const classScope = blockScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(classScope.node.type).toBe('ClassExpression')
    })

    test('嵌套with语句', () => {
      const topScope = analyzeScript('{ with(window){} }')
      const blockScope = topScope.children[0]
      const withScope = blockScope.children[0]
      expect(blockScope.children.length).toBe(1)
      expect(withScope.node.type).toBe('WithStatement')
    })
  })
})
