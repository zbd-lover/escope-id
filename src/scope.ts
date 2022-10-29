import {
  ForInStatement,
  ForOfStatement,
  ForStatement,
  BlockStatement,
  Function,
  DoWhileStatement,
  WhileStatement,
  Program,
  SwitchStatement,
  IfStatement,
  CatchClause,
} from 'estree'

export type Place = 'local' | 'ancestral' | null

export interface VariableInScope {
  name: string,
  place: Place
}

/**
 * The Node that can form a variable scope.
 * */
export type NodeWithScope = ForStatement |
  ForInStatement |
  ForOfStatement |
  Function |
  WhileStatement |
  DoWhileStatement |
  BlockStatement |
  SwitchStatement |
  IfStatement |
  CatchClause |
  Program

export default class Scope {
  public node: NodeWithScope
  public parent: Scope | null
  public children: Scope[]
  public variables: VariableInScope[]

  constructor(node: NodeWithScope) {
    this.node = node
  }

  public has(name: string) {
    return !!this.variables.find((variable) => variable.name === name)
  }

  public hasLocalVar(name: string) {
    return !!this.variables.find((variable) => variable.place === 'local' && variable.name === name)
  }

  public hasAncestralVar(name: string) {
    return !!this.variables.find((variable) => variable.place === 'ancestral' && variable.name === name)
  }

  public hasGlobalVar(name: string) {
    let base: Scope | null = this;
    while (base && base.hasAncestralVar(name)) {
      base = base.parent
    }
    return base === null
  }

  public getAllLocalVars() {
    return this.variables.filter((variable) => variable.place === 'local')
  }

  public getAllAncestralVars() {
    return this.variables.filter((variable) => variable.place === 'ancestral')
  }

  public getAllGlobalVars() {
    return this.variables.filter((_var) => this.hasGlobalVar(_var.name))
  }

  public setParent(parent: Scope | null) {
    this.parent = parent
    if (parent) {
      this.parent?.children.push(this)
    }
  }

  public addVar(name: string | undefined, place: Place) {
    if (!name) return
    if (this.variables.some((variable) => variable.name === name)) return
    this.variables.push({
      place,
      name
    })
  }
}