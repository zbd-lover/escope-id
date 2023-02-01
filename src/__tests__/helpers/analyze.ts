import type { Program } from 'estree'
import { parse as parseAST, type Options } from 'acorn'
import { analyze } from '../../../src'

const options1: Options = {
  ecmaVersion: 'latest',
  sourceType: 'script',
  allowImportExportEverywhere: false
}

const options2: Options = {
  ecmaVersion: 'latest',
  sourceType: 'module',
  allowImportExportEverywhere: false
}

export function getProgram (script: string, options?: Options) {
  return parseAST(script, options || options1) as unknown as Program
}

export function analyzeScript (script: string) {
  return analyze(getProgram(script, options1))
}

export function analyzeModule (script: string) {
  return analyze(getProgram(script, options2))
}

export function wrapScriptWithVarDeclarations (script: string) {
  return `const a = 1;${script};const b = 1;`
}