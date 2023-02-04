/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as ESTree from 'estree'
import { traverse, type VisitorKeys } from 'estraverse'
import { Scope, type IdType } from './scope'

function isFunctionNode (node: ESTree.Node): node is ESTree.Function {
  return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression'
}

const keys: Partial<VisitorKeys> = {
  MetaProperty: [],
  BreakStatement: [],
  ContinueStatement: [],
  LabeledStatement: ['body'],
  ImportExpression: [],
  ImportDeclaration: ['specifiers'],
  ImportSpecifier: ['local'],
  ExportNamedDeclaration: ['declaration'],
  ExportAllDeclaration: [],
  TemplateLiteral: ['expressions']
}

export default function analyze (node: ESTree.Program) {
  /** 是否在解构声明上下文中 */
  let inPatternCtx = false
  let currentVarKind: 'let' | 'var' | 'const' | null = null

  let currentIdType: IdType = 'unknown'
  function setCurrentIdType (type: IdType) {
    currentIdType = type
  }
  function consumeCurrentIdType () {
    const ret = currentIdType
    currentIdType = 'unknown'
    return ret
  }

  const rootScope = new Scope(null, node)
  let currentScope = rootScope

  traverse(node, {
    keys,

    enter (node, parent) {
      // node is Program
      if (parent === null) return

      if (node.type === 'VariableDeclaration') {
        currentVarKind = node.kind
      }

      if (
        node.type === 'BlockStatement' ||
        node.type === 'ClassBody' ||
        node.type === 'SwitchCase' ||
        (node.type === 'ArrowFunctionExpression' && node.expression)
      ) {
        inPatternCtx = false
      }

      if (
        node.type === 'ForInStatement' ||
        node.type === 'ForOfStatement' ||
        node.type === 'ForStatement' ||
        node.type === 'CatchClause' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression' ||
        (node.type === 'BlockStatement' && (
          parent.type === 'Program' ||
          parent.type === 'BlockStatement' ||
          parent.type === 'IfStatement' ||
          parent.type === 'WhileStatement' ||
          parent.type === 'DoWhileStatement' ||
          parent.type === 'TryStatement' ||
          parent.type === 'SwitchCase'
        ))
      ) {
        currentScope = new Scope(currentScope, node)
      } else if (node.type === 'ClassBody') {
        currentScope = new Scope(currentScope as Scope, parent as ESTree.Class)
      } else if (node.type == 'BlockStatement' && parent.type === 'WithStatement') {
        currentScope = new Scope(currentScope, parent)
        this.skip()
        return
      }

      if (
        node.type === 'ImportDefaultSpecifier' ||
        node.type === 'ImportSpecifier' ||
        node.type === 'ImportNamespaceSpecifier'
      ) {
        setCurrentIdType('import')
      } else if (node.type === 'FunctionDeclaration') {
        if (node.id) {
          setCurrentIdType('function')
        } else {
          inPatternCtx = true
          currentScope = new Scope(currentScope, node)
        }
      } else if (node.type === 'ClassDeclaration' && node.id) {
        setCurrentIdType('class')
      } else if (
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression' ||
        node.type === 'VariableDeclarator' ||
        node.type === 'CatchClause'
      ) {
        inPatternCtx = true
      } else if (node.type === 'Identifier' && parent) {
        const shouldSkip = (
          (parent.type === 'Property' && parent.key === node && !parent.computed) ||
          (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) ||
          (parent.type === 'FunctionExpression' && parent.id === node) ||
          (parent.type === 'ClassExpression' && (parent.id === node)) ||
          (parent.type === 'MethodDefinition' && parent.key === node && !parent.computed) ||
          (parent.type === 'PropertyDefinition' && parent.key === node && !parent.computed)
        )
        if (shouldSkip) return

        let type: IdType = 'unknown'
        if (inPatternCtx) {
          if (
            (isFunctionNode(parent) && parent.params.some((param) => param === node)) ||
            (parent.type === 'ArrayPattern' && parent.elements.some((element) => element === node)) ||
            (parent.type === 'CatchClause' && parent.param === node) ||
            (parent.type === 'VariableDeclarator' && parent.id === node) ||
            (parent.type === 'RestElement') ||
            (parent.type === 'AssignmentPattern' && parent.left === node) ||
            (parent.type === 'Property' && parent.value === node)
          ) {
            const parents = this.parents()
            let i = parents.length
            while (--i > 0) {
              if (parents[i].type === 'VariableDeclarator') {
                setCurrentIdType('variable')
                break
              } else if (isFunctionNode(parents[i]) || parents[i].type === 'CatchClause') {
                setCurrentIdType('argument')
                break
              }
            }
          }
        }

        type = consumeCurrentIdType()
        const local = type !== 'unknown'
        const hoisted = type === 'function' || (type === 'variable' && currentVarKind === 'var')
        currentScope.identifiers.push({
          type,
          name: node.name,
          local,
          hoisted
        })
      }
    },

    leave (node, parent) {
      if (parent === null) return
      if (
        node.type === 'BlockStatement' ||
        node.type === 'SwitchStatement' ||
        node.type === 'ClassBody' ||
        (node.type === 'ArrowFunctionExpression' && node.expression)
      ) {
        inPatternCtx = false
        currentScope = currentScope!.parent!
      }

      if (parent.type === 'SwitchStatement' && parent.discriminant === node) {
        inPatternCtx = false
        currentScope = new Scope(currentScope, parent)
      }

      if (node.type === 'VariableDeclaration') {
        currentVarKind = null
      } else if (node.type === 'Identifier') {
        if (parent.type === 'FunctionDeclaration' && parent.id === node) {
          inPatternCtx = true
          currentScope = new Scope(currentScope, parent)
        } else if (parent.type === 'VariableDeclarator' && parent.id === node) {
          inPatternCtx = false
        }
      }
    }
  })

  rootScope.finalize()
  return rootScope
}
