import { IdentifierInScope, Scope } from '../../src'
import { analyzeScript } from '../helpers/analyze'

const PLACEHOLDER = 'PLACEHOLDER'

const ProgramScriptTemp = PLACEHOLDER
const ForScriptTemp = `for (;;) {${PLACEHOLDER}}`
const ForOfScriptTemp = `for (const el of elements) {${PLACEHOLDER}}`
const ForInScriptTemp = `for (const key in object) {${PLACEHOLDER}}`
const BlockScriptTemp = `{${PLACEHOLDER}}`
const BaseClassScriptTemp = `class A {${PLACEHOLDER}}`
const ClassDecScriptTemp = BaseClassScriptTemp
const ClassExpScriptTemp = `const A = ${BaseClassScriptTemp}`
const BaseFunScriptTemp = `function fn() {${PLACEHOLDER}}`
const FunDecScriptTemp = BaseFunScriptTemp
const FunExpScriptTemp = `const fn = ${BaseFunScriptTemp}`
const ArrowFnScriptTemp = `() => {${PLACEHOLDER}}`
const MoreLamdaArrowFnScriptTemp = `() => ${PLACEHOLDER}`
const TryCatchScriptTemp = `try {} catch(error) {${PLACEHOLDER}}`

const ProgramScript = ProgramScriptTemp.replace(PLACEHOLDER, ';')
const ForScript = ForScriptTemp.replace(PLACEHOLDER, ';')
const ForOfScript = ForOfScriptTemp.replace(PLACEHOLDER, ';')
const ForInScript = ForInScriptTemp.replace(PLACEHOLDER, ';')
const BlockScript = BlockScriptTemp.replace(PLACEHOLDER, ';')
const BaseClassScript = BaseClassScriptTemp.replace(PLACEHOLDER, ';')
const ClassDecScript = BaseClassScript
const ClassExpScript = `const A = ${BaseClassScript}`
const BaseFunScript = BaseFunScriptTemp.replace(PLACEHOLDER, ';')
const FunDecScript = BaseFunScript
const FunExpScript = `const fn = ${BaseFunScript}`
const ArrowFnScript = ArrowFnScriptTemp.replace(PLACEHOLDER, ';')
const MoreLamdaArrowFnScript = '() => null'
const TryCatchScript = TryCatchScriptTemp.replace(PLACEHOLDER, ';')

const WithScript = 'const a = 1; with(a) {}; const b = 1'

const NodeTypeMap: Record<string, string> = {
  [ProgramScript]: 'Program',
  [ProgramScriptTemp]: 'Program',
  [ForScript]: 'ForStatement',
  [ForScriptTemp]: 'ForStatement',
  [ForInScript]: 'ForInStatement',
  [ForInScriptTemp]: 'ForInStatement',
  [ForOfScript]: 'ForOfStatement',
  [ForOfScriptTemp]: 'ForOfStatement',
  [BlockScript]: 'BlockStatement',
  [BlockScriptTemp]: 'BlockStatement',
  [ClassDecScript]: 'ClassDeclaration',
  [ClassDecScriptTemp]: 'ClassDeclaration',
  [ClassExpScript]: 'ClassExpression',
  [ClassExpScriptTemp]: 'ClassExpression',
  [FunDecScript]: 'FunctionDeclaration',
  [FunDecScriptTemp]: 'FunctionDeclaration',
  [FunExpScript]: 'FunctionExpression',
  [FunExpScriptTemp]: 'FunctionExpression',
  [ArrowFnScript]: 'ArrowFunctionExpression',
  [ArrowFnScriptTemp]: 'ArrowFunctionExpression',
  [MoreLamdaArrowFnScript]: 'ArrowFunctionExpression',
  [MoreLamdaArrowFnScriptTemp]: 'ArrowFunctionExpression',
  [TryCatchScript]: 'CatchClause',
  [TryCatchScriptTemp]: 'CatchClause'
}

test('应忽略对with语句的处理作用域', () => {
  const topScope = analyzeScript(WithScript)
  expect(topScope.children.length).toBe(0)
  expect(topScope.identifiers).toEqual([
    {
      name: 'a',
      type: 'variable',
      hoisted: false,
      static: false,
      local: true
    },
    {
      name: 'b',
      type: 'variable',
      hoisted: false,
      static: false,
      local: true
    }
  ] as IdentifierInScope[])
})

describe('生成的作用域应正确闭合，并不会影响上下文', () => {
  const expectedIdA: IdentifierInScope = {
    name: 'a',
    type: 'variable',
    hoisted: false,
    static: false,
    local: true
  }

  const expectedIdB: IdentifierInScope = {
    name: 'b',
    type: 'variable',
    hoisted: false,
    static: false,
    local: true
  }

  function shouldContainExpectedIds(scope: Scope) {
    expect(scope.identifiers).toContainEqual(expectedIdA)
    expect(scope.identifiers).toContainEqual(expectedIdB)
  }

  // test('块语句生成的作用域', () => {})
  function wrap(script: string) {
    return `
      const a = 1;
      ${script};
      const b = 1;
    `
  }

  const topScope = analyzeScript(wrap(ProgramScript))
  expect(topScope).toBeTruthy()
  expect(topScope.node.type).toBe(NodeTypeMap[ProgramScript])
  shouldContainExpectedIds(topScope)

  const scripts = [
    ForScript,
    ForOfScript,
    ForInScript,
    BlockScript,
    ClassDecScript,
    ClassExpScript,
    FunDecScript,
    FunExpScript,
    ArrowFnScript,
    MoreLamdaArrowFnScript,
    TryCatchScript,
  ]

  scripts.forEach((script) => {
    const topScope = analyzeScript(wrap(script))
    shouldContainExpectedIds(topScope)
    expect(topScope.children.length).toBe(script !== TryCatchScript ? 1 : 2)
    const targetScope = topScope.children[script !== TryCatchScript ? 0 : 1]
    expect(targetScope).toBeTruthy()
    expect(targetScope.node.type).toBe(NodeTypeMap[script])
  })
})

describe('作用域之间应正确嵌套', () => {
  test('类', () => {
    const ClassBody = `
    constructor(a) {b}
    static get value1() { return b }
    static set value1(a) {}
    static method1() {}
    method1(a) {}
  `
    const ClassScripts = [
      ClassDecScriptTemp.replace(PLACEHOLDER, ClassBody),
      ClassExpScriptTemp.replace(PLACEHOLDER, ClassBody)
    ]

    ClassScripts.forEach((script, index) => {
      const topScope = analyzeScript(script)
      const classScope = topScope.children[0]
      expect(classScope.node.type).toBe(NodeTypeMap[index === 0 ? ClassDecScript : ClassExpScript])
      expect(classScope.children.length).toBe(5)
      classScope.children.forEach((child) => {
        expect(child.node.type).toBe('FunctionExpression')
      })
    })
  })

  test('箭头函数（直接返回表达式）', () => {
    const MoreLamdaArrowFnScripts = [
      MoreLamdaArrowFnScriptTemp.replace(PLACEHOLDER, ArrowFnScript),
      MoreLamdaArrowFnScriptTemp.replace(PLACEHOLDER, MoreLamdaArrowFnScript)
    ]

    MoreLamdaArrowFnScripts.forEach((script) => {
      const topScope = analyzeScript(script)

      const targetParentScope = topScope.children[0]
      expect(targetParentScope).toBeTruthy()
      expect(targetParentScope.children.length).toBe(1)
      expect(targetParentScope.node.type).toBe(NodeTypeMap[MoreLamdaArrowFnScript])

      const targetChildScope = targetParentScope.children[0]
      expect(targetChildScope).toBeTruthy()
      expect(targetChildScope.children.length).toBe(0)
      expect(targetChildScope.node.type).toBe(NodeTypeMap[MoreLamdaArrowFnScript])
    })
  })

  test('其它情况', () => {
    const templates = [
      ForScriptTemp,
      ForOfScriptTemp,
      ForInScriptTemp,
      BlockScriptTemp,
      ClassDecScriptTemp,
      ClassExpScriptTemp,
      FunDecScriptTemp,
      FunExpScriptTemp,
      ArrowFnScriptTemp,
    ]

    const pureScripts = templates.map((template) => template.replace(PLACEHOLDER, ';'))

    templates.forEach((template, index) => {
      // 库为'类'产生的'作用域'不属于常规意义上的作用域
      // 其它常规意义上的作用域的内部可以在存在类，但反过来不行
      if (template === ClassDecScriptTemp || template === ClassExpScriptTemp) {
        return
      }

      const targetScript = pureScripts[index]
      const restScripts = pureScripts.filter((s) => s !== targetScript)
      restScripts.forEach((script) => {
        const finalScript = template.replace(PLACEHOLDER, script)
        const topScope = analyzeScript(finalScript)

        const targetParentScope = topScope.children[0]
        expect(targetParentScope).toBeTruthy()
        expect(targetParentScope.children.length).toBe(1)
        expect(targetParentScope.node.type).toBe(NodeTypeMap[template])

        const targetChildScope = targetParentScope.children[0]
        expect(targetChildScope).toBeTruthy()
        expect(targetChildScope.children.length).toBe(0)
        expect(targetChildScope.node.type).toBe(NodeTypeMap[script])
      })
    })

    // 嵌套with语句的测试
    templates.forEach((template) => {
      if (template === ClassDecScriptTemp || template === ClassExpScriptTemp) {
        return
      }

      const finalScript = template.replace(PLACEHOLDER, WithScript)
      const topScope = analyzeScript(finalScript)
      const targetParentScope = topScope.children[0]
      expect(targetParentScope).toBeTruthy()
      expect(targetParentScope.node.type).toBe(NodeTypeMap[template])
      expect(targetParentScope.children.length).toBe(0)
    })

  })
})