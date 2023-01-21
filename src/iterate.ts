import ESTraverse from 'estraverse';
import { ScopeNode } from './scope';

export interface Visitor extends ESTraverse.Visitor {
  enterScope: () => void
}

export function traverse(scope: ScopeNode, visitor: Visitor) {
  // ESTraverse.traverse()
}

export function replace(scope: ScopeNode, visitor: Visitor) {
  // ESTraverse.traverse()
}
