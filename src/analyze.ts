/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as ESTree from 'estree'
import { traverse, Syntax } from 'estraverse'
import Scope, { type IdentifierInScope, ScopeNode, IdType } from './scope'

function isScopeEdge(node: ESTree.Node, parent: ESTree.Node | null): node is (ESTree.ArrowFunctionExpression | ESTree.BlockStatement) {
  return (node.type === 'ArrowFunctionExpression' && node.expression) ||
    (node.type === 'BlockStatement' && !!parent && (parent.type !== 'ClassBody' && parent.type !== 'WithStatement')) // 不支持对with的解析
}

function isFunctionNode(node: ESTree.Node): node is ESTree.Function {
  return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression'
}

// function isBindingPattern(node: ESTree.Node): node is ESTree.ObjectPattern | ESTree.ArrayPattern {
//   return node.type === 'ObjectPattern' || node.type === 'ArrayPattern'
// }

export default function analyze(node: ScopeNode) {
  // 是否在解构上下文中
  let inPatternCtx = false
  // let inVariableDeclaratorNode = false
  // let inFunctionParamsNode = false
  let currentVarKind: 'let' | 'var' | 'const' | null = null

  let lastIdType: IdType = 'unknown'
  let currentIdType: IdType = 'unknown'
  function setCurrentIdType(type: IdType | 'before') {
    lastIdType = currentIdType
    currentIdType = type === 'before' ? lastIdType : type
  }
  function consumeCurrentIdType() {
    const ret = currentIdType
    currentIdType = 'unknown'
    return ret
  }

  let currentScope: Scope | null = new Scope(null, node)
  const rootScope = currentScope
  function pushIdToCurrentScope(id: IdentifierInScope) {
    if (currentScope) {
      currentScope.identifiers.push(id as IdentifierInScope)
    }
  }

  traverse(node, {
    keys: {
      [Syntax['BreakStatement']]: [],
      [Syntax['ContinueStatement']]: [],
      [Syntax['LabeledStatement']]: ['body'],

      [Syntax['ExportNamedDeclaration']]: ['declaration'],
      // [Syntax['ExportSpecifier']]: [],
      [Syntax['ExportAllDeclaration']]: [],

      // test
      [Syntax['MethodDefinition']]: ['value'],
      [Syntax['TemplateLiteral']]: ['expressions']
    },

    enter(node, parent) {
      if (node.type === 'VariableDeclaration') {
        currentVarKind = node.kind
      }

      // 作用域更新
      if (
        node.type === 'ForInStatement' ||
        node.type === 'ForOfStatement' ||
        node.type === 'ForStatement' ||
        node.type === 'CatchClause' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression' ||
        node.type === 'BlockStatement' && parent && (parent.type === 'Program' || parent.type === 'BlockStatement')
      ) {
        currentScope = new Scope(currentScope, node)
      }

      if (node.type === 'BlockStatement') {
        inPatternCtx = false
      }

      if (node.type === 'FunctionDeclaration') {
        setCurrentIdType('function')
      } else if (node.type === 'ClassDeclaration') {
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
          parent.type === 'Property' && parent.key === node && !parent.computed ||
          parent.type === 'MemberExpression' && parent.property === node && !parent.computed ||
          parent.type === 'FunctionExpression' && parent.id === node ||
          parent.type === 'ClassExpression' && (parent.id === node || parent.superClass === node)
        )
        if (shouldSkip) return

        let type: IdType = 'unknown'
        // 判断是否是解构声明的变量或者函数参数
        if (inPatternCtx) {
          if (
            (isFunctionNode(parent) && parent.params.some((param) => param === node)) ||
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
              } else if (isFunctionNode(parents[i])) {
                setCurrentIdType('argument')
                break
              }
            }
          }
        }

        type = consumeCurrentIdType()
        const local = type !== 'unknown'
        const hoisted = type === 'function' || (type === 'variable' && currentVarKind === 'var')
        pushIdToCurrentScope({
          name: node.name,
          hoisted,
          type,
          local
        })
      }
    },

    leave(node, parent) {
      if (isScopeEdge(node, parent)) {
        inPatternCtx = false
        currentScope = currentScope?.parent || null
      } else if (node.type === 'VariableDeclaration') {
        currentVarKind = null
      } else if (node.type === 'Identifier' && parent) {
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