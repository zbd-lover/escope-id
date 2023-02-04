import { Scope, type IdentifierInScope } from '../../src'
import { analyzeModule, analyzeScript, wrapScriptWithVarDeclarations } from './helpers/analyze'

describe('类', () => {
  const baseClassScript = (named: boolean) => `class ${named ? 'A' : ''} extends B {
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

    static get [value1]() { return b }
    static set [value1](a) { } 

    static [value2]() {}
    [value2]() {}
  }
`
  const ids: IdentifierInScope[] = [
    {
      name: 'prop2',
      type: 'unknown',
      local: false,
      hoisted: false
    },
    {
      name: 'prop4',
      type: 'unknown',
      local: false,
      hoisted: false
    },
    {
      name: 'value1',
      type: 'unknown',
      local: false,
      hoisted: false
    },
    {
      name: 'value2',
      type: 'unknown',
      local: false,
      hoisted: false
    },
  ]

  describe('形成的类的定义域应正确闭合，且不影响上下文', () => {
    const expectIdA: IdentifierInScope = {
      name: 'a',
      type: 'variable',
      local: true,
      hoisted: false
    }
    const expectIdB: IdentifierInScope = {
      name: 'a',
      type: 'variable',
      local: true,
      hoisted: false
    }

    test('具名类声明', () => {
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(baseClassScript(true)))
      const classScope = topScope.children[0]
      expect(topScope.children.length).toBe(1)
      expect(topScope.identifiers).toContainEqual(expectIdA)
      expect(topScope.identifiers).toContainEqual(expectIdB)
      expect(classScope.node.type).toBe('ClassDeclaration')
    })

    test('匿名类声明', () => {
      const topScope = analyzeModule(wrapScriptWithVarDeclarations(`export default ${baseClassScript(false)}`))
      const classScope = topScope.children[0]
      expect(topScope.children.length).toBe(1)
      expect(topScope.identifiers).toContainEqual(expectIdA)
      expect(topScope.identifiers).toContainEqual(expectIdB)
      expect(classScope.node.type).toBe('ClassDeclaration')
    })

    test('具名类表达式', () => {
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(`const A = ${baseClassScript(true)}`))
      const classScope = topScope.children[0]
      expect(topScope.children.length).toBe(1)
      expect(topScope.identifiers).toContainEqual(expectIdA)
      expect(topScope.identifiers).toContainEqual(expectIdB)
      expect(classScope.node.type).toBe('ClassExpression')
    })

    test('匿名类表达式', () => {
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(`const A = ${baseClassScript(false)}`))
      const classScope = topScope.children[0]
      expect(topScope.children.length).toBe(1)
      expect(topScope.identifiers).toContainEqual(expectIdA)
      expect(topScope.identifiers).toContainEqual(expectIdB)
      expect(classScope.node.type).toBe('ClassExpression')
    })
  })

  describe('应正确分析出类的结构', () => {
    test('具名类声明', () => {
      const topScope = analyzeScript(baseClassScript(true))
      const classScope = topScope.children[0]
      expect(classScope.node.type).toBe('ClassDeclaration')
      expect(classScope.identifiers).toEqual(ids)
      const [a, b, c, d, e] = classScope.children
      expect(classScope.children.length).toBe(9)
      expect(a instanceof Scope).toBe(true)
      expect(b instanceof Scope).toBe(true)
      expect(c instanceof Scope).toBe(true)
      expect(d instanceof Scope).toBe(true)
      expect(e instanceof Scope).toBe(true)
    })

    test('匿名类声明', () => {
      const topScope = analyzeModule(`export default ${baseClassScript(false)}`)
      const classScope = topScope.children[0]
      expect(classScope.node.type).toBe('ClassDeclaration')
      expect(classScope.identifiers).toEqual(ids)
      const [a, b, c, d, e] = classScope.children
      expect(classScope.children.length).toBe(9)
      expect(a instanceof Scope).toBe(true)
      expect(b instanceof Scope).toBe(true)
      expect(c instanceof Scope).toBe(true)
      expect(d instanceof Scope).toBe(true)
      expect(e instanceof Scope).toBe(true)
    })

    test('具名类表达式', () => {
      const topScope = analyzeScript(`const A = ${baseClassScript(true)}`)
      const classScope = topScope.children[0]
      expect(classScope.node.type).toBe('ClassExpression')
      expect(classScope.identifiers).toEqual(ids)
      const [a, b, c, d, e] = classScope.children
      expect(classScope.children.length).toBe(9)
      expect(a instanceof Scope).toBe(true)
      expect(b instanceof Scope).toBe(true)
      expect(c instanceof Scope).toBe(true)
      expect(d instanceof Scope).toBe(true)
      expect(e instanceof Scope).toBe(true)
    })

    test('匿名类表达式', () => {
      const topScope = analyzeScript(`const A = ${baseClassScript(false)}`)
      const classScope = topScope.children[0]
      expect(classScope.node.type).toBe('ClassExpression')
      expect(classScope.identifiers).toEqual(ids)
      const [a, b, c, d, e] = classScope.children
      expect(classScope.children.length).toBe(9)
      expect(a instanceof Scope).toBe(true)
      expect(b instanceof Scope).toBe(true)
      expect(c instanceof Scope).toBe(true)
      expect(d instanceof Scope).toBe(true)
      expect(e instanceof Scope).toBe(true)
    })
  })
})
