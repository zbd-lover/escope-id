
import { IdentifierInScope } from "../src";
import { parseModule, parseScript } from "./helpers/parse";

type PartialIdentifierInScope1 = Omit<IdentifierInScope, 'imported' | 'exported'>

const map = ({ name, scope, type }: IdentifierInScope) => {
  return {
    name,
    scope,
    type
  }
}

describe('local varialbe test', () => {
  test('import variable', () => {
    const script = `
      import { var1, var3 as var4 } from 'moduleA'
      import * as moduleC from 'moduleC'
      import moduleD from 'moduleD'
    `
    const res = parseModule(script)
    const target: IdentifierInScope[] = [
      {
        name: 'var1',
        scope: 'local',
        type: 'variable',
        imported: true,
        exported: false
      },
      {
        name: 'var4',
        scope: 'local',
        type: 'variable',
        imported: true,
        exported: false
      },
      {
        name: 'moduleC',
        scope: 'local',
        type: 'variable',
        imported: true,
        exported: false
      },
      {
        name: 'moduleD',
        scope: 'local',
        type: 'variable',
        imported: true,
        exported: false
      },
    ]
    expect(res.identifiers.filter((id) => id.imported)).toEqual(target)
  })

  test('variable declarataion by let/const', () => {
    const script = `
      let a, b;
      const d = 1, e = 2;
    `
    const res = parseScript(script)
    const target: PartialIdentifierInScope1[] = [
      {
        name: 'a',
        scope: 'local',
        type: 'variable'
      },
      {
        name: 'b',
        scope: 'local',
        type: 'variable'
      },
      {
        name: 'd',
        scope: 'local',
        type: 'variable'
      },
      {
        name: 'e',
        scope: 'local',
        type: 'variable'
      },
    ]
    const identifiers = res.identifiers.map(map)
    expect(identifiers).toEqual(target)
  })

  test('deconstruction declarataion bases on object pattern', () => {
    const script = `
      const user = {}
      const {
        key1,
        _key2: key2,
        key3 = key2,
        key4 = globalValue1,
        
        innerObj1: {
          key5,
          _key6: key6,
          key7 = key6,
          key8 = globalValue2,
          innerObj2: {
            key9,
            _key10: key10,
            key11 = key10,
            key12 = globalValue3,
            ...rest1
          },
          ...rest2
        },

        ...rest3
      } = user
    `
    const res = parseScript(script)
    const target: PartialIdentifierInScope1[] = [
      'user', 'key1', 'key2', 'key3', 'key4',
      'key5', 'key6', 'key7', 'key8', 'key9',
      'key10', 'key11', 'key12', 'rest1', 'rest2',
      'rest3'
    ]
      .map((item) => {
        return {
          name: item,
          scope: 'local',
          type: 'variable'
        }
      })
    expect(res.identifiers.map(map).filter((id) => id.scope === 'local')).toEqual(target)
  })

  test('deconstruction declarataion bases on array pattern', () => {
    const script = `
      const user = []
      const [
        key1,
        key2 = key1,
        key3 = globalValue1,

        [
          key4,
          key5 = key4,
          key6 = globalValue2,
          
          [
            key7,
            key8 = key7,
            key9 = globalValue3,
            ...rest1
          ],
          ...[
            key10,
            key11
          ]
        ],
        ...rest2
      ] = user
    `
    const res = parseScript(script)
    const target: PartialIdentifierInScope1[] = [
      'user', 'key1', 'key2', 'key3', 'key4',
      'key5', 'key6', 'key7', 'key8', 'key9',
      'rest1', 'key10', 'key11', 'rest2',
    ]
      .map((item) => {
        return {
          name: item,
          scope: 'local',
          type: 'variable'
        }
      })
    expect(res.identifiers.map(map).filter((id) => id.scope === 'local')).toEqual(target)
  })

  test('export variable declarataion directly', () => {
    const script = `export let var4 = 10`
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'var4',
      scope: 'local',
      type: 'variable',
      imported: false,
      exported: true
    }
    expect(res.identifiers).toEqual([target])
  })
})

describe('local function test', () => {
  test('function declarataion will as local identifier', () => {
    const script = `function a() {}`
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'a',
      scope: 'local',
      type: 'function',
    }
    expect(res.identifiers.map(map)).toEqual([target])
  })

  test('function expression will not as local identifier', () => {
    const script = `const fn1 = function fn1() {}`
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'fn1',
      scope: 'local',
      type: 'variable',
    }
    expect(res.identifiers.map(map)).toEqual([target])
  })

  test('arrow function expression will not as local identifier', () => {
    const script = `const fn1 =  () => {}`
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'fn1',
      scope: 'local',
      type: 'variable',
    }
    expect(res.identifiers.map(map)).toEqual([target])
  })

  test('export function declaration directly', () => {
    const script = `export function fn1() {}`
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'fn1',
      type: 'function',
      scope: 'local',
      exported: true,
      imported: false
    }
    expect(res.identifiers).toEqual([target])
  })

  test('default function declaration exports, directly', () => {
    const script = `export default function fn1() {}`
    const res = parseModule(script)
    const ids: IdentifierInScope = {
      name: 'fn1',
      scope: 'local',
      type: 'function',
      imported: false,
      exported: true
    }
    expect(res.identifiers).toEqual([ids])
  })
})

describe('local class test', () => {
  test('class declarataion will as local identifier', () => {
    const script = `class A {}`
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'A',
      scope: 'local',
      type: 'class',
    }
    expect(res.identifiers.map(map)).toEqual([target])
  })

  test('class expression will not as local identifier', () => {
    const script = `const B = class B {}`
    const res = parseScript(script)
    const target: PartialIdentifierInScope1 = {
      name: 'B',
      scope: 'local',
      type: 'variable',
    }
    expect(res.identifiers.map(map)).toEqual([target])
  })

  test('class method、set、get、constructor will as local identifier', () => {
    const script = `
      class A {
        constructor() {}
        method1() {}
        set value1(v1) {}
        get value2() {} 
      }
    `
    const res = parseScript(script)
    const target: PartialIdentifierInScope1[] = [
      {
        name: 'constructor',
        scope: 'local',
        type: 'member',
      },
      {
        name: 'method1',
        scope: 'local',
        type: 'member',
      },
      {
        name: 'value1',
        scope: 'local',
        type: 'member',
      },
      {
        name: 'value2',
        scope: 'local',
        type: 'member',
      }
    ]
    expect(res.children[0].identifiers.map(map)).toEqual(target)
  })

  test('super class', () => {
    const script = `class B {} class A extends B {}`
    const target: IdentifierInScope[] = [
      {
        name: 'B',
        type: 'class',
        scope: 'local',
        imported: false,
        exported: false
      },
      {
        name: 'A',
        type: 'class',
        scope: 'local',
        imported: false,
        exported: false
      },
    ]
    const res = parseScript(script)
    expect(res.identifiers).toEqual(target)
  })

  test('export class declaration directly', () => {
    const script = `export class A {}`
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'A',
      type: 'class',
      scope: 'local',
      exported: true,
      imported: false
    }
    expect(res.identifiers).toEqual([target])
  })

  test('default function declaration exports, directly', () => {
    const script = `export default class A {}`
    const res = parseModule(script)
    const ids: IdentifierInScope = {
      name: 'A',
      scope: 'local',
      type: 'class',
      imported: false,
      exported: true
    }
    expect(res.identifiers).toEqual([ids])
  })
})

describe('local argument test', () => {
  test('function argument', () => {
    const script = `function test(a, b, { c }) {}`
    const target: PartialIdentifierInScope1[] = [
      {
        name: 'a',
        type: 'argument',
        scope: 'local'
      },
      {
        name: 'b',
        type: 'argument',
        scope: 'local'
      },
      {
        name: 'c',
        type: 'argument',
        scope: 'local'
      },
    ]
    const res = parseScript(script)
    expect(res.children[0].identifiers.map(map)).toEqual(target)
  })

  test('catch clause argument, 1', () => {
    const script = `try {} catch(err) {} finally {}`
    const target: PartialIdentifierInScope1 = {
      name: 'err',
      type: 'argument',
      scope: 'local'
    }
    const res = parseScript(script)
    expect(res.children[1].identifiers.map(map)).toEqual([target])
  })

  test('catch clause argument, 2', () => {
    const script = `try {} catch({ a }) {} finally {}`
    const target: PartialIdentifierInScope1 = {
      name: 'a',
      type: 'argument',
      scope: 'local'
    }
    const res = parseScript(script)
    expect(res.children[1].identifiers.map(map)).toEqual([target])
  })
})