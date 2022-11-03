import { IdentifierInScope } from '../src/index'
import { parseModule, parseScript } from './helpers/parse'

describe('unreachable identifier test', () => {
  test('export named identifier', () => {
    const script = `
      let var1, var2
      export {
        var1,
        var2 as var3
      }
    `
    const res = parseModule(script)
    const target: IdentifierInScope[] = [
      {
        name: 'var1',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'var2',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'var1',
        scope: 'unreachable',
        type: 'variable',
        imported: false,
        exported: true
      },
      {
        name: 'var3',
        scope: 'unreachable',
        type: 'variable',
        imported: false,
        exported: true
      },
    ]
    expect(res.identifiers).toEqual(target)
  })

  test('named function expression 1', () => {
    const script = `
      const fn1 = function fn1() {
        console.log(fn1)
      }
    `
    const res = parseScript(script)
    const target: IdentifierInScope[] = [
      {
        name: 'console',
        scope: 'ancestral',
        type: 'unknown',
        imported: false,
        exported: false
      },
      {
        name: 'fn1',
        scope: 'unreachable',
        type: 'function',
        imported: false,
        exported: false
      }
    ]
    expect(res.children[0].identifiers).toEqual(target)
  })

  test('named function expression 2', () => {
    const script = `
      const fn1 = function fn1() {
        const fn1 = () => {}
        console.log(fn1)
      }
    `
    const res = parseScript(script)
    const target: IdentifierInScope[] = [
      {
        name: 'fn1',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'console',
        scope: 'ancestral',
        type: 'unknown',
        imported: false,
        exported: false
      },
    ]
    expect(res.children[0].identifiers).toEqual(target)
  })

  test('named function expression 3', () => {
    const script = `
      const fn1 = function fn1() {
        console.log(fn1)
        var fn1 = () => {}
      }
    `
    const res = parseScript(script)
    const target: IdentifierInScope[] = [
      {
        name: 'console',
        scope: 'ancestral',
        type: 'unknown',
        imported: false,
        exported: false
      },
      {
        name: 'fn1',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
    ]
    expect(res.children[0].identifiers).toEqual(target)
  })

  test('named class expression 1', () => {
    const script = `
      const A = class A {
        method1() {
          const a = new A()
        }
      }
    `
    const res = parseScript(script)
    const target: IdentifierInScope[] = [
      {
        name: 'a',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'A',
        scope: 'unreachable',
        type: 'class',
        imported: false,
        exported: false
      },
    ]
    expect(res.children[0].children[0].identifiers).toEqual(target)
  })

  test('named class expression 2', () => {
    const script = `
      const A = class A {
        method1() {
          class A {}
          const a = new A()
        }
      }
    `
    const res = parseScript(script)
    const target: IdentifierInScope[] = [
      {
        name: 'A',
        scope: 'local',
        type: 'class',
        imported: false,
        exported: false
      },
      {
        name: 'a',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
    ]
    expect(res.children[0].children[0].identifiers).toEqual(target)
  })

  test('named class expression 3', () => {
    const script = `
      const A = class A {
        method1() {
          const a = new A()
          class A {}
        }
      }
    `
    const res = parseScript(script)
    const target: IdentifierInScope[] = [
      {
        name: 'a',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'A',
        scope: 'local',
        type: 'class',
        imported: false,
        exported: false
      },
    ]
    expect(res.children[0].children[0].identifiers).toEqual(target)
  })
})