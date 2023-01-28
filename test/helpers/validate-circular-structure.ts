import { Scope } from '../../src/index'

export function validate(scope: Scope) {
  for (let i = 0; i < scope.children.length; i++) {
    if (scope.children[i].parent !== scope) return false
    if (!validate(scope.children[i])) return false
  }
  return true
}