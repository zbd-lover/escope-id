import parse from './parse'
import Scope, { type ScopeNode, IdScope, IdType, IdentifierInScope, IdentifierMatcher } from './scope'

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