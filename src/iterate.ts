import ESTraverse from 'estraverse';
// import { ScopeNode } from './scope';

export interface Visitor extends ESTraverse.Visitor {
  enterScope: () => void
}

export function traverse() {
  // ESTraverse.traverse()
}
export function replace() {
  // ESTraverse.traverse()
}
