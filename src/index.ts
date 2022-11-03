import parse from './parse'
import Scope, { ScopeNode, IdScope, IdType, IdentifierInScope, IdentifierMatcher } from './scope'

export {
  parse,
  Scope
}

export type {
  ScopeNode,
  IdentifierMatcher,
  IdType as IdentifierType,
  IdScope as IdentifierScope,
  IdentifierInScope
}