import { parse as parseAST, Options } from "acorn"
import { Program } from "estree";
import parseId from "../../src";

const options1: Options = {
  ecmaVersion: 2021,
  sourceType: 'script',
}

const options2: Options = {
  ecmaVersion: 2021,
  sourceType: 'module',
}

function getProgram(script: string, options: Options) {
  return parseAST(script, options) as unknown as Program
}

export function parseScript(script: string) {
  return parseId(getProgram(script, options1))
}

export function parseModule(script: string) {
  return parseId(getProgram(script, options2))
}