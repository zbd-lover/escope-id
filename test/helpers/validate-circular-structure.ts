import { Scope } from 'src'

export default function validate (scope: Scope) {
  for (let i = 0; i < scope.children.length; i++) {
    if (scope.children[i].parent !== scope) return false
    if (!validate(scope.children[i])) return false
  }
  return true
}