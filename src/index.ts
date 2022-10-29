import {
  ForInStatement,
  ForOfStatement,
  ForStatement,
  BlockStatement,
  Function,
  DoWhileStatement,
  WhileStatement,
  Identifier,
  MemberExpression,
  FunctionDeclaration,
  SwitchStatement,
  IfStatement,
  CatchClause,
} from 'estree'
import { walk } from 'estree-walker'
import Scope, { type NodeWithScope, VariableInScope, Place } from './scope'

export {
  Scope
}

export type {
  NodeWithScope,
  VariableInScope,
  Place
}

export default function parse(block: NodeWithScope) {
  const top = new Scope(block)
  /** scope stack */
  const stack = [top]

  /** push and bind relation */
  function push(scope: Scope) {
    const parent = stack[stack.length - 1]
    stack.push(scope)
    scope.setParent(parent)
  }

  function addVarToCurrent(name: string | undefined, place: Place) {
    stack[stack.length - 1]?.addVar(name, place)
  }

  walk(block, {
    enter(node, parent, key) {
      if (node.type === 'WithStatement') {
        this.skip()
        return
      }
      switch (node.type) {
        case 'FunctionDeclaration':
          const fnName = (node as FunctionDeclaration).id?.name
          if (fnName) {
            addVarToCurrent(fnName, 'local')
          }
          push(new Scope(node as Function))
          break
          // Although a fn-exp can have a name, it only can be called inside itself.
          // Thus, its name will be added in the concomitant block scope, if one.
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
        case 'ForStatement':
        case 'ForInStatement':
        case 'ForOfStatement':
        case 'WhileStatement':
        case 'DoWhileStatement':
        case 'IfStatement':
        case 'SwitchStatement':
        case 'CatchClause':
          push(new Scope(
            node as Function |
              ForStatement |
              ForInStatement |
              ForOfStatement |
              WhileStatement |
              DoWhileStatement |
              IfStatement | 
              SwitchStatement |
              CatchClause
            )
          );
          break
        case 'BlockStatement':
          const type = parent.type
          if (
            type !== 'FunctionDeclaration' &&
            type !== 'FunctionExpression' &&
            type !== 'ArrowFunctionExpression' &&
            type !== 'WhileStatement' &&
            type !== 'DoWhileStatement' &&
            type !== 'IfStatement' &&
            type !== 'SwitchStatement' &&
            type !== 'CatchClause'
          ) {
            push(new Scope(node as BlockStatement))
          }
          break
        case 'Identifier':
          const idName = (node as Identifier).name
          const currentScope = stack[stack.length - 1]
          // const abc = function test() { console.log(test) }
          if (currentScope && currentScope.node.type === 'FunctionExpression') {
            if (currentScope.node.id) {
              const { name } = currentScope.node.id
              if (!currentScope.hasLocalVar(name) && name === idName) {
                addVarToCurrent(idName, null)
                break
              }
            }
          }
          switch (parent.type) {
            case 'VariableDeclarator':
              addVarToCurrent(idName, 'local')
            case 'MemberExpression':
              if (key === 'object' || (key === 'property' && (parent as MemberExpression).computed)) {
                addVarToCurrent(idName, 'ancestral')
              }
              break
            case 'ImportNamespaceSpecifier':
            case 'ImportSpecifier':
              if (key === 'local') {
                addVarToCurrent(idName, 'ancestral')
              }
              break
            case 'Property':
              if (key === 'value') {
                addVarToCurrent(idName, 'ancestral')
              }
              break
            case 'FunctionDeclaration':
            case 'FunctionExpression':
              if (key === 'params') {
                addVarToCurrent(idName, 'ancestral')
              }
              break
            default:
              addVarToCurrent(idName, 'ancestral')
          }
      }
    },
    leave(node) {
      // console
      switch (node.type) {
        case 'ForStatement':
        case 'ForInStatement':
        case 'ForOfStatement':
        case 'BlockStatement':
          stack.pop()
          break
      }
    }
  })

  return top
}