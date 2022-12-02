
import type {
  ForInStatement,
  ForOfStatement,
  ForStatement,
  BlockStatement,
  Function as ESTFunction,
  Program,
  CatchClause,
  WithStatement,
  SwitchStatement,
  ClassBody
} from 'estree'

export type IdScope = 'local' | 'ancestral' | 'unreachable'
export type IdType = 'variable' | 'function' | 'argument' | 'class' | 'unknown' | 'member'

interface BaseIdentifierInScope {
  name: string,
  type: IdType,
  scope: IdScope,
  imported: boolean,
  exported: boolean
}

interface AncestralId extends BaseIdentifierInScope {
  scope: 'ancestral',
  type: 'unknown'
}

interface UnreachableId extends BaseIdentifierInScope {
  scope: 'unreachable'
  type: 'function' | 'variable' | 'class'
}

export interface LocalId extends BaseIdentifierInScope {
  scope: 'local',
  type: 'variable' | 'function' | 'argument' | 'class' | 'member',
}

export type IdentifierInScope = LocalId | AncestralId | UnreachableId

export type IdentifierMatcher = (identifier: IdentifierInScope) => boolean

export type ScopeNode = Program |
  ESTFunction |
  BlockStatement |
  ForStatement |
  ForInStatement |
  ForOfStatement |
  CatchClause |
  WithStatement |
  SwitchStatement |
  ClassBody

export default class Scope {
  public node: ScopeNode
  public parent: Scope | null
  public children: Scope[]
  public identifiers: IdentifierInScope[]

  constructor (node: ScopeNode) {
    this.node = node
    this.parent = null
    this.children = []
    this.identifiers = []
  }

  public setParent (parent: Scope | null) {
    this.parent = parent
    if (parent) {
      this.parent?.children.push(this)
    }
  }

  public addId (id: IdentifierInScope, hoisted?: boolean) {
    const { name, type, scope, imported, exported } = id
    if (this.identifiers.some((id) => {
      return id.type === type &&
        id.name === name &&
        id.scope === scope &&
        id.imported === imported &&
        id.exported === exported
    })) return
    if (scope === 'unreachable' && (type === 'function' || type === 'class')) {
      const index = this.identifiers.findIndex((id) => id.scope === 'local' && id.name === name)
      if (index === -1) {
        this.identifiers.push(id)
      }
    } else if (exported && type === 'unknown' && scope === 'ancestral') {
      const index = this.identifiers.findIndex((id) => {
        return (
          id.name === name &&
          (id.scope === 'local' || id.scope === 'ancestral') &&
          !id.exported
        )
      })
      if (index >= 0) {
        this.identifiers[index].exported = true
      } else {
        this.identifiers.push(id)
      }
    } else if (scope === 'local' && (type === 'variable' || type === 'function' || type === 'class')) {
      const index = this.identifiers.findIndex((id) =>
        id.name === name &&
        (
          (id.scope === 'ancestral' && id.type === 'unknown') ||
          (id.scope === 'unreachable' && id.type === 'function') ||
          (id.scope === 'unreachable' && id.type === 'class')
        )
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

  public hasId (finder: string | IdentifierMatcher) {
    if (typeof finder === 'string') {
      return !!this.identifiers.find((id) => id.name === finder)
    }
    return !!this.identifiers.find(finder)
  }

  public hasGlobalId (name: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let base: Scope | null = this
    while (base && base.hasId((id) => id.name === name && id.scope === 'ancestral')) {
      base = base.parent
    }
    return base === null
  }

  public getIds (matcher: IdentifierMatcher) {
    return this.identifiers.filter(matcher)
  }

  public getAllGlobalIds () {
    return this.identifiers.filter((id) => this.hasGlobalId(id.name))
  }
}