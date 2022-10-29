import { parse as parseAST, type Options } from "acorn"
import { Program } from "estree";
import parse, { type VariableInScope } from "../src";

const options1: Options = {
  ecmaVersion: 'latest',
  sourceType: 'script'
}

const options2: Options = {
  ecmaVersion: 'latest',
  sourceType: 'module'
}

function getProgram(script: string, options: Options) {
  return parseAST(script, options) as unknown as Program
}

describe('test', () => {
  test('a pure block', () => {
    const script = `
      let a, b, c
      console.log(d)
    `
    const res = parse(getProgram(script, options1))
    const target: VariableInScope[] = [
      {
        name: 'a',
        place: 'local'
      },
      {
        name: 'b',
        place: 'local'
      },
      {
        name: 'c',
        place: 'local'
      },
      {
        name: 'd',
        place: 'ancestral'
      },
    ]
    expect(res.variables).toEqual(target)
  })
})