
import {
  ForInStatement,
  ForOfStatement,
  ForStatement,
  BlockStatement,
  Function,
  Program,
  SwitchStatement,
  CatchClause,
  WithStatement
} from 'estree'

export type IdScope = 'local' | 'ancestral' | 'unreachable'
export type IdType = 'variable' | 'function' | 'argument' | 'class' | 'unknown'

interface BaseIdentifierInScope {
  name: string,
  type: IdType,
  scope: IdScope,
  imported: boolean,
  exported: boolean
}

interface BaseLocalId extends BaseIdentifierInScope {
  scope: 'local',
  type: 'variable' | 'function' | 'argument' | 'class',
}

interface AncestralId extends BaseIdentifierInScope {
  scope: 'ancestral',
  type: 'unknown'
}

interface UnreachableId extends BaseIdentifierInScope {
  scope: 'unreachable'
  type: 'function' | 'variable'
}

interface LocalVariableId extends BaseLocalId {
  type: 'variable',
}

interface LocalFunctionId extends BaseLocalId {
  type: 'function',
}

interface LocalArgumentId extends BaseLocalId {
  type: 'argument',
}

interface LocalClassId extends BaseLocalId {
  type: 'class'
}

type LocalId = LocalVariableId | LocalFunctionId | LocalArgumentId | LocalClassId

export type IdentifierInScope = LocalId | AncestralId | UnreachableId

/**
 * The Node that can form a variable scope.
 * */
export type NodeWithScope = ForStatement |
  ForInStatement |
  ForOfStatement |
  Function |
  BlockStatement |
  SwitchStatement |
  CatchClause |
  Program |
  WithStatement

export default class Scope {
  public node: NodeWithScope
  public parent: Scope | null
  public children: Scope[]
  public identifiers: IdentifierInScope[]

  constructor(node: NodeWithScope) {
    this.node = node
    this.parent = null
    this.children = []
    this.identifiers = []
  }

  public setParent(parent: Scope | null) {
    this.parent = parent
    if (parent) {
      this.parent?.children.push(this)
    }
  }

  public addId(id: IdentifierInScope, hoisted?: boolean) {
    const { name, type, scope, imported, exported } = id
    if (this.identifiers.some((id) => {
      return id.type === type &&
        id.name === name &&
        id.scope === scope &&
        id.imported === imported &&
        id.exported === exported
    })) return

    if (exported && type === 'unknown' && scope === 'ancestral') {
      const index = this.identifiers.findIndex((id) => 
        id.name === name && 
        (id.scope === 'local' || id.scope === 'ancestral') &&
        !id.exported
      )
      if (index >= 0) {
        this.identifiers[index].exported = true
      } else {
        this.identifiers.push(id)
      }
    } else if (scope === 'local' && (type === 'variable' || type === 'function')) {
      const index = this.identifiers.findIndex((id) => 
        id.name === name &&
        // id.exported &&
        id.scope === 'ancestral' && id.type === 'unknown'
      )
      if (index >= 0 && (this.identifiers[index].exported || exported || hoisted)) {
        id.exported = this.identifiers[index].exported
        this.identifiers.splice(index, 1)
      }
      this.identifiers.push(id)
    } else {
      this.identifiers.push(id)
    }
  }

  // tools
  public hasId(name: string, type?: IdType) {
    return !!this.identifiers.find((id) => id.name === name && type ? id.type === type : true)
  }

  public hasLocalId(name: string, type?: IdType) {
    return !!this.identifiers.find((id) => {
      return id.scope === 'local' &&
        id.name === name &&
        (type ? id.type === type : true)
    })
  }

  public hasAncestralId(name: string) {
    return !!this.identifiers.find((id) => id.scope === 'ancestral' && id.name === name)
  }

  public hasUnreachableId(name: string) {
    return !!this.identifiers.find((id) => id.scope === 'unreachable' && id.name === name)
  }

  public hasGlobalId(name: string) {
    let base: Scope | null = this;
    while (base && base.hasAncestralId(name)) {
      base = base.parent
    }
    return base === null
  }

  public getAllLocalIds() {
    return this.identifiers.filter((id) => id.scope === 'local')
  }

  public getAllAncestralIds() {
    return this.identifiers.filter((id) => id.scope === 'ancestral')
  }

  public getAllGlobalIds() {
    return this.identifiers.filter((id) => this.hasGlobalId(id.name))
  }

  public getIdsByType(type: IdType) {
    return this.identifiers.filter((id) => id.type === type)
  }
}