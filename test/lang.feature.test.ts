import { WithStatement } from "estree";
import parse, { IdentifierInScope } from "../src";
import { parseScript } from "./helpers/parse";

describe('test of lang feature', () => {
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

  test('can\'t support \'with statement\'', () => {
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
})