import { Scope, ClassDefiniton, type IdentifierInScope, ClassMetaDefiniton } from '../../src'
import { analyzeScript, wrapScriptWithVarDeclarations } from '../helpers/analyze'

describe('类', () => {
  const baseClassScript = `class A extends B {
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

    test('类声明', () => {
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(baseClassScript))
      const classDef = topScope.children[0] as ClassDefiniton
      expect(topScope.children.length).toBe(1)
      expect(topScope.identifiers).toContainEqual(expectIdA)
      expect(topScope.identifiers).toContainEqual(expectIdB)
      expect(classDef instanceof ClassDefiniton).toBe(true)
    })

    test('类表达式', () => {
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(`const A = ${baseClassScript}`))
      const classDef = topScope.children[0] as ClassDefiniton
      expect(topScope.children.length).toBe(1)
      expect(topScope.identifiers).toContainEqual(expectIdA)
      expect(topScope.identifiers).toContainEqual(expectIdB)
      expect(classDef instanceof ClassDefiniton).toBe(true)
    })
  })


  describe('应正确分析出类的结构', () => {
    test('类声明', () => {
      const topScope = analyzeScript(baseClassScript)
      expect(topScope.identifiers).toEqual(
        [
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
        ] as IdentifierInScope[]
      )
  
      const classDef = topScope.children[0] as ClassDefiniton
      expect(classDef instanceof ClassDefiniton).toBe(true)
      expect(classDef.definitions).toEqual(
        [
          {
            name: 'constructor',
            type: 'constructor',
            static: false,
          },
          {
            name: 'prop1',
            type: 'property',
            static: true,
          },
          {
            name: 'prop3',
            type: 'property',
            static: false,
          },
          {
            name: 'value1',
            type: 'get',
            static: true,
          },
          {
            name: 'value1',
            type: 'set',
            static: true,
          },
          {
            name: 'method1',
            type: 'method',
            static: true,
          },
          {
            name: 'method1',
            type: 'method',
            static: false,
          },
        ] as ClassMetaDefiniton[]
      )
  
      const [a, b, c, d, e] = classDef.children
      expect(classDef.children.length).toBe(5)
      expect(a instanceof Scope).toBe(true)
      expect(b instanceof Scope).toBe(true)
      expect(c instanceof Scope).toBe(true)
      expect(d instanceof Scope).toBe(true)
      expect(e instanceof Scope).toBe(true)
    })
  
    test('类表达式', () => {
      const topScope = analyzeScript(`const A = ${baseClassScript}`)
      expect(topScope.identifiers).toEqual(
        [
          {
            name: 'A',
            type: 'variable',
            hoisted: false,
            local: true
          },
          {
            name: 'B',
            type: 'unknown',
            hoisted: false,
            local: false
          }
        ] as IdentifierInScope[]
      )
  
      const classDef = topScope.children[0] as ClassDefiniton
      expect(classDef instanceof ClassDefiniton).toBe(true)
      expect(classDef.definitions).toEqual(
        [
          {
            name: 'constructor',
            type: 'constructor',
            static: false,
          },
          {
            name: 'prop1',
            type: 'property',
            static: true,
          },
          {
            name: 'prop3',
            type: 'property',
            static: false,
          },
          {
            name: 'value1',
            type: 'get',
            static: true,
          },
          {
            name: 'value1',
            type: 'set',
            static: true,
          },
          {
            name: 'method1',
            type: 'method',
            static: true,
          },
          {
            name: 'method1',
            type: 'method',
            static: false,
          },
        ] as ClassMetaDefiniton[]
      )
  
      const [a, b, c, d, e] = classDef.children
      expect(classDef.children.length).toBe(5)
      expect(a instanceof Scope).toBe(true)
      expect(b instanceof Scope).toBe(true)
      expect(c instanceof Scope).toBe(true)
      expect(d instanceof Scope).toBe(true)
      expect(e instanceof Scope).toBe(true)
    })
  })
})
