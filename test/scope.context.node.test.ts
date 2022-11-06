import { ScopeNode } from '../src/index'
import { parseModule, parseScript } from './helpers/parse'
import withoutPos from './helpers/withoutPos'

describe('test scope\'s context node', () => {
  test('script program', () => {
    const script = ''
    const target: ScopeNode = {
      type: 'Program',
      body: [],
      sourceType: 'script'
    }
    const res = parseScript(script)
    expect(withoutPos(res.node)).toEqual(target)
  })

  test('module program', () => {
    const script = 'import a from \'moduleA\''
    const target: ScopeNode = {
      type: 'Program',
      body: [
        {
          type: 'ImportDeclaration',
          specifiers: [
            {
              type: 'ImportDefaultSpecifier',
              local: {
                type: 'Identifier',
                name: 'a'
              }
            }
          ],
          source: {
            type: 'Literal',
            value: 'moduleA',
            raw: '\'moduleA\''
          }
        }
      ],
      sourceType: 'module'
    }
    const res = parseModule(script)
    expect(withoutPos(res.node)).toEqual(target)
  })

  test('block without context', () => {
    const script = '{}'
    const res = parseScript(script)
    const target: ScopeNode = {
      type: 'BlockStatement',
      body: []
    }
    expect(withoutPos(res.children[0].node)).toEqual(target)
  })

  test('for statement', () => {
    const script = 'for (;;) {}'
    const res = parseScript(script)
    const target: ScopeNode = {
      type: 'ForStatement',
      init: null,
      test: null,
      update: null,
      body: {
        type: 'BlockStatement',
        body: []
      }
    }
    expect(withoutPos(res.children[0].node)).toEqual(target)
  })

  test('for in statement', () => {
    const script = 'for (let key in obj) {}'
    const res = parseScript(script)
    const target: ScopeNode = {
      type: 'ForInStatement',
      left: {
        type: 'VariableDeclaration',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: 'key'
            },
            init: null
          }
        ],
        kind: 'let',
      },
      right: {
        type: 'Identifier',
        name: 'obj'
      },
      body: {
        type: 'BlockStatement',
        body: []
      }
    }
    expect(withoutPos(res.children[0].node)).toEqual(target)
  })

  test('for of statement', () => {
    const script = 'for (let key of obj) {}'
    const res = parseScript(script)
    const target: ScopeNode = {
      await: false,
      type: 'ForOfStatement',
      left: {
        type: 'VariableDeclaration',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: 'key'
            },
            init: null
          }
        ],
        kind: 'let',
      },
      right: {
        type: 'Identifier',
        name: 'obj'
      },
      body: {
        type: 'BlockStatement',
        body: []
      }
    }
    expect(withoutPos(res.children[0].node)).toEqual(target)
  })

  test('function declaration', () => {
    const script = 'function fn1() {}'
    const res = parseScript(script)
    const target: ScopeNode = {
      type: 'FunctionDeclaration',
      async: false,
      generator: false,
      params: [],
      /**
       * Compatibility of libraries
       * 
       * @ts-expect-error */
      expression: false,
      id: {
        type: 'Identifier',
        name: 'fn1'
      },
      body: {
        type: 'BlockStatement',
        body: []
      }
    }
    expect(withoutPos(res.children[0].node)).toEqual(target)
  })

  test('function expression', () => {
    const script = 'const fn1 = function fn1() {}'
    const res = parseScript(script)
    const target: ScopeNode = {
      type: 'FunctionExpression',
      async: false,
      generator: false,
      /**
       * Compatibility of libraries
       * 
       * @ts-expect-error */
      expression: false,
      params: [],
      id: {
        type: 'Identifier',
        name: 'fn1'
      },
      body: {
        type: 'BlockStatement',
        body: []
      }
    }
    expect(withoutPos(res.children[0].node)).toEqual(target)
  })

  test('arrow function expression', () => {
    const script = 'const fn1 = () => {}; const fn2 = () => null'
    const res = parseScript(script)
    const target: ScopeNode[] = [
      {
        type: 'ArrowFunctionExpression',
        /**
         * Compatibility of libraries
         * 
         * @ts-expect-error */
        id: null,
        async: false,
        generator: false,
        expression: false,
        params: [],
        body: {
          type: 'BlockStatement',
          body: []
        }
      },
      {
        async: false,
        generator: false,
        type: 'ArrowFunctionExpression',
        expression: true,
        params: [],
        /**
         * Compatibility of libraries
         * 
         * @ts-expect-error */
        id: null,
        body: {
          type: 'Literal',
          value: null,
          raw: 'null'
        }
      }
    ]
    expect(res.children.map((scope) => withoutPos(scope.node))).toEqual(target)
  })

  test('try statement', () => {
    const script = 'try {} catch(err) {} finally {}'
    const res = parseScript(script)
    const target: ScopeNode = {
      type: 'CatchClause',
      param: {
        type: 'Identifier',
        name: 'err'
      },
      body: {
        type: 'BlockStatement',
        body: []
      }
    }
    expect(withoutPos(res.children[1].node)).toEqual(target)
  })

  test('switch statement', () => {
    const script = 'switch(var1) { case 1: case 2: case 3: break } '
    const res = parseScript(script)
    const target: ScopeNode = {
      type: 'SwitchStatement',
      cases: [
        {
          type: 'SwitchCase',
          test: {
            type: 'Literal',
            value: 1,
            raw: '1'
          },
          consequent: []
        },
        {
          type: 'SwitchCase',
          test: {
            type: 'Literal',
            value: 2,
            raw: '2'
          },
          consequent: []
        },
        {
          type: 'SwitchCase',
          test: {
            type: 'Literal',
            value: 3,
            raw: '3'
          },
          consequent: [
            {
              type: 'BreakStatement',
              label: null
            }
          ]
        },
      ],
      discriminant: {
        type: 'Identifier',
        name: 'var1'
      }
    }
    expect(withoutPos(res.children[0].node)).toEqual(target)
  })

  test('class declaration', () => {
    const script = `
      class A {
        method1() {}
        method2() {}
      }
    `
    const target: ScopeNode = {
      type: 'ClassBody',
      body: [
        {
          type: 'MethodDefinition',
          key: {
            type: 'Identifier',
            name: 'method1'
          },
          value: {
            type: 'FunctionExpression',
            id: null,
            params: [],
            body: {
              type: 'BlockStatement',
              body: []
            },
            async: false,
            generator: false,
            /**
             * Compatibility of libraries
             * 
             * @ts-expect-error */
            expression: false
          },
          kind: 'method',
          computed: false,
          static: false,
        },
        {
          type: 'MethodDefinition',
          key: {
            type: 'Identifier',
            name: 'method2'
          },
          value: {
            type: 'FunctionExpression',
            id: null,
            params: [],
            body: {
              type: 'BlockStatement',
              body: []
            },
            async: false,
            generator: false,
            /**
             * Compatibility of libraries
             * 
             * @ts-expect-error */
            expression: false
          },
          kind: 'method',
          computed: false,
          static: false,
        }
      ]
    }
    const res = parseScript(script)
    expect(withoutPos(res.children[0].node)).toEqual(target)
  })
})