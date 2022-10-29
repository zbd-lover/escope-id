import {
  ForInStatement,
  ForOfStatement,
  ForStatement,
  BlockStatement,
  Function,
  DoWhileStatement,
  WhileStatement,
} from 'estree'

export interface Variable {
  name: string,
  local: boolean
}

export interface Scope {
  node: ForStatement | ForInStatement | ForOfStatement | Function | WhileStatement | DoWhileStatement | BlockStatement,
  parent: Scope | null,
  children: Scope[],
  variables: Variable[]
}