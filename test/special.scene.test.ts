import { WithStatement } from 'estree'
import { parse, IdentifierInScope } from '../src/index'
import { parseScript, parseModule } from './helpers/parse'

describe('test special scene', () => {
  test('delay determining identifier type', () => {
    const script = `
      console.log(a)
      var a = 10
      fn1(fn2)
      function fn1() {}
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
        name: 'a',
        scope: 'local',
        type: 'variable',
        imported: false,
        exported: false
      },
      {
        name: 'fn2',
        scope: 'ancestral',
        type: 'unknown',
        imported: false,
        exported: false
      },
      {
        name: 'fn1',
        scope: 'local',
        type: 'function',
        imported: false,
        exported: false
      }
    ]
    expect(res.identifiers).toEqual(target)
  })

  test('shouldn\'t support \'with statement\'', () => {
    const ws: WithStatement = {
      type: 'WithStatement',
      object: {
        type: 'Identifier',
        name: 'window'
      },
      body: {
        type: 'BlockStatement',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'Identifier',
              name: 'obj1'
            }
          }
        ]
      }
    }
    const res = parse(ws)
    const _window: IdentifierInScope = {
      name: 'window',
      scope: 'ancestral',
      type: 'unknown',
      exported: false,
      imported: false
    }
    expect(res.identifiers).toEqual([_window])
  })

  test('default variable exports1, after declaration', () => {
    const script = `
      let var1
      export default var1
    `
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'var1',
      scope: 'local',
      type: 'variable',
      imported: false,
      exported: true
    }
    expect(res.identifiers[0]).toEqual(target)
  })

  test('default variable exports2, after declaration', () => {
    const script = `
      let var1
      export {
        var1 as default
      }
    `
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'var1',
      scope: 'local',
      type: 'variable',
      imported: false,
      exported: true
    }
    expect(res.identifiers[0]).toEqual(target)
  })

  test('default variable exports1, before declaration', () => {
    const script = `
      export default var1
      let var1
    `
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'var1',
      scope: 'local',
      type: 'variable',
      imported: false,
      exported: true
    }
    expect(res.identifiers[0]).toEqual(target)
  })

  test('default variable exports2, before declaration', () => {
    const script = `
      export {
        var1 as default
      }
      let var1
    `
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'var1',
      scope: 'local',
      type: 'variable',
      imported: false,
      exported: true
    }
    expect(res.identifiers[0]).toEqual(target)
  })

  test('default function declaration exports1, after declaration', () => {
    const script = `
      function fn1() {}
      export default fn1
    `
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'fn1',
      type: 'function',
      scope: 'local',
      imported: false,
      exported: true
    }
    expect(res.identifiers[0]).toEqual(target)
  })

  test('default function declaration exports2, after declaration', () => {
    const script = `
      function fn1() {}
      export {
        fn1 as default
      }
    `
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'fn1',
      type: 'function',
      scope: 'local',
      imported: false,
      exported: true
    }
    expect(res.identifiers[0]).toEqual(target)
  })

  test('default function declaration exports1, before declaration', () => {
    const script = `
      export default fn1
      function fn1() {}
    `
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'fn1',
      type: 'function',
      scope: 'local',
      imported: false,
      exported: true
    }
    expect(res.identifiers[0]).toEqual(target)
  })

  test('default function declaration exports2, before declaration', () => {
    const script = `
      export {
        fn1 as default
      }
      function fn1() {}
    `
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'fn1',
      type: 'function',
      scope: 'local',
      imported: false,
      exported: true
    }
    expect(res.identifiers[0]).toEqual(target)
  })

  test('default class declaration exports1, after declaration', () => {
    const script = `
      class A {}
      export default A
    `
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'A',
      type: 'class',
      scope: 'local',
      imported: false,
      exported: true
    }
    expect(res.identifiers[0]).toEqual(target)
  })

  test('default class declaration exports2, after declaration', () => {
    const script = `
      class A {}
      export {
        A as default
      }
    `
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'A',
      type: 'class',
      scope: 'local',
      imported: false,
      exported: true
    }
    expect(res.identifiers[0]).toEqual(target)
  })

  test('default class declaration exports1, before declaration', () => {
    const script = `
      export default A
      class A {}
    `
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'A',
      type: 'class',
      scope: 'local',
      imported: false,
      exported: true
    }
    expect(res.identifiers[0]).toEqual(target)
  })

  test('default class declaration exports2, before declaration', () => {
    const script = `
      export {
        A as default
      }
      class A {}
    `
    const res = parseModule(script)
    const target: IdentifierInScope = {
      name: 'A',
      type: 'class',
      scope: 'local',
      imported: false,
      exported: true
    }
    expect(res.identifiers[0]).toEqual(target)
  })

  test('template str', () => {
    const script = 'const var1 = 10;const str = `${var1}_${g_var1}`'
    const res = parseScript(script)
    const target: IdentifierInScope[] = [
      {
        name: 'var1',
        type: 'variable',
        scope: 'local',
        imported: false,
        exported: false
      },
      {
        name: 'str',
        type: 'variable',
        scope: 'local',
        imported: false,
        exported: false
      },
      {
        name: 'g_var1',
        type: 'unknown',
        scope: 'ancestral',
        imported: false,
        exported: false
      },
    ]
    expect(res.identifiers).toEqual(target)
  })

  test('import.meta', () => {
    const script = 'import.meta'
    const res = parseModule(script)
    expect(res.identifiers).toEqual([])
  })

  test('new.target', () => {
    const script = 'function Person() { if (new.target) {} }'
    const res = parseScript(script)
    expect(res.children[0].identifiers).toEqual([])
  })
})