import { ClassDefiniton, Scope, type IdentifierInScope } from '../../src'
import { analyzeModule, analyzeScript, wrapScriptWithVarDeclarations } from '../helpers/analyze'

describe('函数', () => {
  describe('生成的作用域应正确闭合，且不影响上下文', () => {
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

    test('具名函数声明', () => {
      const script = 'function fn1(a, { b = c }, d) { const e = 10 }'
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(script))
      const fnScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(topScope.identifiers).toContainEqual(expectIdA)
      expect(topScope.identifiers).toContainEqual(expectIdB)
      expect(fnScope.identifiers).toEqual(
        [
          {
            name: 'a',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'b',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'c',
            type: 'unknown',
            hoisted: false,
            local: false,
          },
          {
            name: 'd',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'e',
            type: 'variable',
            hoisted: false,
            local: true,
          },
        ] as IdentifierInScope[]
      )
    })

    test('匿名函数声明', () => {
      const script = 'export default function (a, { b = c }, d) { const e = 10 }'
      const topScope = analyzeModule(wrapScriptWithVarDeclarations(script))
      const fnScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(topScope.identifiers).toContainEqual(expectIdA)
      expect(topScope.identifiers).toContainEqual(expectIdB)
      expect(fnScope.identifiers).toEqual(
        [
          {
            name: 'a',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'b',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'c',
            type: 'unknown',
            hoisted: false,
            local: false,
          },
          {
            name: 'd',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'e',
            type: 'variable',
            hoisted: false,
            local: true,
          },
        ] as IdentifierInScope[]
      )
    })

    test('具名函数表达式', () => {
      const script = 'const fn1 = function fn1(a, { b = c }, d) { const e = 10 }'
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(script))
      const fnScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(topScope.identifiers).toContainEqual(expectIdA)
      expect(topScope.identifiers).toContainEqual(expectIdB)
      expect(fnScope.identifiers).toEqual(
        [
          {
            name: 'a',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'b',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'c',
            type: 'unknown',
            hoisted: false,
            local: false,
          },
          {
            name: 'd',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'e',
            type: 'variable',
            hoisted: false,
            local: true,
          }
        ] as IdentifierInScope[]
      )
    })

    test('匿名函数表达式', () => {
      const script = 'const fn1 = function (a, { b = c }, d) { const e = 10 }'
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(script))
      const fnScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(topScope.identifiers).toContainEqual(expectIdA)
      expect(topScope.identifiers).toContainEqual(expectIdB)
      expect(fnScope.identifiers).toEqual(
        [
          {
            name: 'a',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'b',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'c',
            type: 'unknown',
            hoisted: false,
            local: false,
          },
          {
            name: 'd',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'e',
            type: 'variable',
            hoisted: false,
            local: true,
          }
        ] as IdentifierInScope[]
      )
    })

    test('箭头函数表达式（携带语句块）', () => {
      const script = 'const fn1 = (a, { b = c }, d) => { const e = 10 }'
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(script))
      const fnScope = topScope.children[0] as Scope
      expect(topScope.children.length).toBe(1)
      expect(topScope.identifiers).toContainEqual(expectIdA)
      expect(topScope.identifiers).toContainEqual(expectIdB)
      expect(fnScope.identifiers).toEqual(
        [
          {
            name: 'a',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'b',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'c',
            type: 'unknown',
            hoisted: false,
            local: false,
          },
          {
            name: 'd',
            type: 'argument',
            hoisted: false,
            local: true,
          },
          {
            name: 'e',
            type: 'variable',
            hoisted: false,
            local: true,
          }
        ] as IdentifierInScope[]
      )
    })

    test('箭头函数表达式（直接返回表达式）', () => {
      const script = 'const fn1 = (a, { b = c }, d) => null'
      const topScope = analyzeScript(wrapScriptWithVarDeclarations(script))
      expect(topScope.children.length).toBe(1)
      expect(topScope.identifiers).toContainEqual(expectIdA)
      expect(topScope.identifiers).toContainEqual(expectIdB)
    })
  })

  describe('允许嵌套其它语句或表达式生成的作用域', () => {
    describe('具名函数声明', () => {
      test('嵌套块语句', () => {
        const topScope = analyzeScript('function fn() { {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('BlockStatement')
      })

      test('嵌套switch语句', () => {
        const topScope = analyzeScript('function fn() { switch(a) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('SwitchStatement')
      })

      test('嵌套for语句', () => {
        const topScope = analyzeScript('function fn() { for(;;) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForStatement')
      })

      test('嵌套for-in语句', () => {
        const topScope = analyzeScript('function fn() { for(const key in keys) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForInStatement')
      })

      test('嵌套for-of语句', () => {
        const topScope = analyzeScript('function fn() { for(const key of keys) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForOfStatement')
      })

      test('嵌套函数声明', () => {
        const topScope = analyzeScript('function fn() { function fn(){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionDeclaration')
      })

      test('嵌套具名函数表达式', () => {
        const topScope = analyzeScript('function fn() { const fn = function fn(){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionExpression')
      })

      test('嵌套匿名函数表达式', () => {
        const topScope = analyzeScript('function fn() { const fn = function (){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionExpression')
      })

      test('嵌套箭头函数表达式（携带语句块）', () => {
        const topScope = analyzeScript('function fn() { const fn = () => {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
      })

      test('嵌套箭头函数表达式（直接返回表达式）', () => {
        const topScope = analyzeScript('function fn() { const fn = () => null }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
      })

      test('嵌套try-catch语句', () => {
        const topScope = analyzeScript('function fn() { try {} catch(e) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(2)
        expect(blockScope.children[1].node.type).toBe('CatchClause')
      })

      test('嵌套类声明', () => {
        const topScope = analyzeScript('function fn() { class A {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      test('嵌套具名类表达式', () => {
        const topScope = analyzeScript('function fn() { const A = class A {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      test('嵌套匿名类表达式', () => {
        const topScope = analyzeScript('function fn() { const A = class {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      test('嵌套with语句', () => {
        const topScope = analyzeScript('function fn() { with(window){} }')
        const blockScope = topScope.children[0] as Scope
        const withScope = blockScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(withScope.node.type).toBe('WithStatement')
      })
    })

    describe('匿名函数声明', () => {
      test('嵌套块语句', () => {
        const topScope = analyzeModule('export default function() { {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('BlockStatement')
      })

      test('嵌套switch语句', () => {
        const topScope = analyzeModule('export default function() { switch(a) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('SwitchStatement')
      })

      test('嵌套for语句', () => {
        const topScope = analyzeModule('export default function() { for(;;) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForStatement')
      })

      test('嵌套for-in语句', () => {
        const topScope = analyzeModule('export default function() { for(const key in keys) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForInStatement')
      })

      test('嵌套for-of语句', () => {
        const topScope = analyzeModule('export default function() { for(const key of keys) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForOfStatement')
      })

      test('嵌套函数声明', () => {
        const topScope = analyzeModule('export default function() { function fn(){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionDeclaration')
      })

      test('嵌套具名函数表达式', () => {
        const topScope = analyzeModule('export default function() { const fn = function fn(){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionExpression')
      })

      test('嵌套匿名函数表达式', () => {
        const topScope = analyzeModule('export default function() { const fn = function (){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionExpression')
      })

      test('嵌套箭头函数表达式（携带语句块）', () => {
        const topScope = analyzeModule('export default function() { const fn = () => {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
      })

      test('嵌套箭头函数表达式（直接返回表达式）', () => {
        const topScope = analyzeModule('export default function() { const fn = () => null }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
      })

      test('嵌套try-catch语句', () => {
        const topScope = analyzeModule('export default function() { try {} catch(e) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(2)
        expect(blockScope.children[1].node.type).toBe('CatchClause')
      })

      test('嵌套类声明', () => {
        const topScope = analyzeModule('export default function() { class A {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      test('嵌套具名类表达式', () => {
        const topScope = analyzeModule('export default function() { const A = class A {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      test('嵌套匿名类表达式', () => {
        const topScope = analyzeModule('export default function() { const A = class {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      // 解析module，默认使用了严格模式，不允许出现with语句
      // test('嵌套with语句', () => {
      //   const topScope = analyzeScript('function fn() { with(window){} }')
      //   const blockScope = topScope.children[0] as Scope
      //   const withScope = blockScope.children[0] as Scope
      //   expect(blockScope.children.length).toBe(1)
      //   expect(withScope.node.type).toBe('WithStatement')
      // })
    })

    describe('具名函数表达式', () => {
      test('嵌套块语句', () => {
        const topScope = analyzeScript('const fn = function fn() { {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('BlockStatement')
      })

      test('嵌套switch语句', () => {
        const topScope = analyzeScript('const fn = function fn() { switch(a) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('SwitchStatement')
      })

      test('嵌套for语句', () => {
        const topScope = analyzeScript('const fn = function fn() { for(;;) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForStatement')
      })

      test('嵌套for-in语句', () => {
        const topScope = analyzeScript('const fn = function fn() { for(const key in keys) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForInStatement')
      })

      test('嵌套for-of语句', () => {
        const topScope = analyzeScript('const fn = function fn() { for(const key of keys) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForOfStatement')
      })

      test('嵌套函数声明', () => {
        const topScope = analyzeScript('const fn = function fn() { function fn(){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionDeclaration')
      })

      test('嵌套具名函数表达式', () => {
        const topScope = analyzeScript('const fn = function fn() { const fn = function fn(){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionExpression')
      })

      test('嵌套匿名函数表达式', () => {
        const topScope = analyzeScript('const fn = function fn() { const fn = function (){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionExpression')
      })

      test('嵌套箭头函数表达式（携带语句块）', () => {
        const topScope = analyzeScript('const fn = function fn() { const fn = () => {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
      })

      test('嵌套箭头函数表达式（直接返回表达式）', () => {
        const topScope = analyzeScript('const fn = function fn() { const fn = () => null }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
      })

      test('嵌套try-catch语句', () => {
        const topScope = analyzeScript('const fn = function fn() { try {} catch(e) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(2)
        expect(blockScope.children[1].node.type).toBe('CatchClause')
      })

      test('嵌套类声明', () => {
        const topScope = analyzeScript('const fn = function fn() { class A {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      test('嵌套具名类表达式', () => {
        const topScope = analyzeScript('const fn = function fn() { const A = class A {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      test('嵌套匿名类表达式', () => {
        const topScope = analyzeScript('const fn = function fn() { const A = class {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      test('嵌套with语句', () => {
        const topScope = analyzeScript('const fn = function fn() { with(window){} }')
        const blockScope = topScope.children[0] as Scope
        const withScope = blockScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(withScope.node.type).toBe('WithStatement')
      })
    })

    describe('匿名函数表达式', () => {
      test('嵌套块语句', () => {
        const topScope = analyzeScript('const fn = function() { {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('BlockStatement')
      })

      test('嵌套switch语句', () => {
        const topScope = analyzeScript('const fn = function() { switch(a) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('SwitchStatement')
      })

      test('嵌套for语句', () => {
        const topScope = analyzeScript('const fn = function() { for(;;) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForStatement')
      })

      test('嵌套for-in语句', () => {
        const topScope = analyzeScript('const fn = function() { for(const key in keys) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForInStatement')
      })

      test('嵌套for-of语句', () => {
        const topScope = analyzeScript('const fn = function() { for(const key of keys) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForOfStatement')
      })

      test('嵌套函数声明', () => {
        const topScope = analyzeScript('const fn = function() { function fn(){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionDeclaration')
      })

      test('嵌套具名函数表达式', () => {
        const topScope = analyzeScript('const fn = function() { const fn = function(){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionExpression')
      })

      test('嵌套匿名函数表达式', () => {
        const topScope = analyzeScript('const fn = function() { const fn = function (){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionExpression')
      })

      test('嵌套箭头函数表达式（携带语句块）', () => {
        const topScope = analyzeScript('const fn = function() { const fn = () => {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
      })

      test('嵌套箭头函数表达式（直接返回表达式）', () => {
        const topScope = analyzeScript('const fn = function() { const fn = () => null }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
      })

      test('嵌套try-catch语句', () => {
        const topScope = analyzeScript('const fn = function() { try {} catch(e) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(2)
        expect(blockScope.children[1].node.type).toBe('CatchClause')
      })

      test('嵌套类声明', () => {
        const topScope = analyzeScript('const fn = function() { class A {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      test('嵌套具名类表达式', () => {
        const topScope = analyzeScript('const fn = function() { const A = class A {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      test('嵌套匿名类表达式', () => {
        const topScope = analyzeScript('const fn = function() { const A = class {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      test('嵌套with语句', () => {
        const topScope = analyzeScript('const fn = function() { with(window){} }')
        const blockScope = topScope.children[0] as Scope
        const withScope = blockScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(withScope.node.type).toBe('WithStatement')
      })
    })

    describe('箭头函数表达式', () => {
      test('嵌套块语句', () => {
        const topScope = analyzeScript('const fn = () => { {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('BlockStatement')
      })

      test('嵌套switch语句', () => {
        const topScope = analyzeScript('const fn = () => { switch(a) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('SwitchStatement')
      })

      test('嵌套for语句', () => {
        const topScope = analyzeScript('const fn = () => { for(;;) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForStatement')
      })

      test('嵌套for-in语句', () => {
        const topScope = analyzeScript('const fn = () => { for(const key in keys) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForInStatement')
      })

      test('嵌套for-of语句', () => {
        const topScope = analyzeScript('const fn = () => { for(const key of keys) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ForOfStatement')
      })

      test('嵌套函数声明', () => {
        const topScope = analyzeScript('const fn = () => { function fn(){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionDeclaration')
      })

      test('嵌套函数表达式', () => {
        const topScope = analyzeScript('const fn = () => { const fn = function fn(){} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('FunctionExpression')
      })

      test('嵌套箭头函数表达式（携带语句块）', () => {
        const topScope = analyzeScript('const fn = () => { const fn = () => {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
      })

      test('嵌套箭头函数表达式（直接返回表达式）', () => {
        const topScope = analyzeScript('const fn = () => { const fn = () => null }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(blockScope.children[0].node.type).toBe('ArrowFunctionExpression')
      })

      test('嵌套try-catch语句', () => {
        const topScope = analyzeScript('const fn = () => { try {} catch(e) {} }')
        const blockScope = topScope.children[0] as Scope
        expect(blockScope.children.length).toBe(2)
        expect(blockScope.children[1].node.type).toBe('CatchClause')
      })

      test('嵌套类声明', () => {
        const topScope = analyzeScript('const fn = () => { class A {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      test('嵌套类表达式', () => {
        const topScope = analyzeScript('const fn = () => { const A = class A {} }')
        const blockScope = topScope.children[0] as Scope
        const classDef = blockScope.children[0] as ClassDefiniton
        expect(blockScope.children.length).toBe(1)
        expect(classDef instanceof ClassDefiniton).toBe(true)
      })

      test('嵌套with语句', () => {
        const topScope = analyzeScript('const fn = () => { with(window){} }')
        const blockScope = topScope.children[0] as Scope
        const withScope = blockScope.children[0] as Scope
        expect(blockScope.children.length).toBe(1)
        expect(withScope.node.type).toBe('WithStatement')
      })
    })
  })
})
