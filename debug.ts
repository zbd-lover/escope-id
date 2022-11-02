// For debugging in idea
import { parse as parseAST } from "acorn"
import { Program } from "estree";
import parse from "./src/index";

const script = `
  const obj = {
    [g_var3]: 10
  }
`
const ast = parseAST(script, {
  ecmaVersion: 2021,
  sourceType: 'module',
}) as unknown as Program
const res = parse(ast)

console.log(res)