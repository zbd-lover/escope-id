/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as ESTree from 'estree'
import { traverse, Syntax } from 'estraverse'
import { Scope, type IdentifierInScope, ScopeNode, IdType } from './scope'

function isFunctionNode(node: ESTree.Node): node is ESTree.Function {
  return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression'
}

export default function analyze(node: ScopeNode) {
  /** 是否在解构上下文中 */
  let inPatternCtx = false
  let currentVarKind: 'let' | 'var' | 'const' | null = null

  let currentIdType: IdType = 'unknown'
  function setCurrentIdType(type: IdType) {
    currentIdType = type
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
      [Syntax['MetaProperty']]: [],
      [Syntax['BreakStatement']]: [],
      [Syntax['ContinueStatement']]: [],
      [Syntax['LabeledStatement']]: ['body'],
      [Syntax['ImportExpression']]: [],
      [Syntax['ImportDeclaration']]: ['specifiers'],
      [Syntax['ImportSpecifier']]: ['local'],
      [Syntax['ExportNamedDeclaration']]: ['declaration'],
      [Syntax['ExportAllDeclaration']]: [],
      [Syntax['TemplateLiteral']]: ['expressions'],
      [Syntax['WithStatement']]: ['object']
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

      if (
        node.type === 'ImportDefaultSpecifier' ||
        node.type === 'ImportSpecifier' ||
        node.type === 'ImportNamespaceSpecifier'
      ) {
        setCurrentIdType('import')
      } else if (node.type === 'PropertyDefinition') {
        if (!node.computed) {
          setCurrentIdType('property')
        }
      } else if (node.type === 'MethodDefinition') {
        setCurrentIdType(node.kind)
      } else if (node.type === 'FunctionDeclaration') {
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
          (parent.type === 'Property' && parent.key === node && !parent.computed) ||
          (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) ||
          (parent.type === 'FunctionExpression' && parent.id === node) ||
          (parent.type === 'ClassExpression' && (parent.id === node)) ||
          (parent.type === 'PropertyDefinition' && parent.key === node && parent.computed)
        )
        if (shouldSkip) return

        let type: IdType = 'unknown'
        // 判断是否是解构声明的变量或者函数参数
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
              } else if (isFunctionNode(parents[i])) {
                setCurrentIdType('argument')
                break
              }
            }
          }
        }

        type = consumeCurrentIdType()
        const local = type !== 'unknown' && type !== 'get' && type !== 'set' && type !== 'constructor' && type !== 'method' && type !== 'property'
        const hoisted = type === 'function' || (type === 'variable' && currentVarKind === 'var')
        const isStatic = (parent.type === 'PropertyDefinition' || parent.type === 'MethodDefinition') && parent.static && parent.key === node
        pushIdToCurrentScope({
          name: node.name,
          hoisted,
          type,
          local,
          static: isStatic
        })
      }
    },

    leave(node, parent) {
      if (!parent) return
      if (
        (node.type === 'ArrowFunctionExpression' && node.expression) ||
        (node.type === 'BlockStatement')
      ) {
        inPatternCtx = false
        currentScope = currentScope?.parent || null
      } else if (node.type === 'VariableDeclaration') {
        currentVarKind = null
      } else if (node.type === 'Identifier') {
        if (parent.type === 'FunctionDeclaration' && parent.id === node) {
          inPatternCtx = true
          currentScope = new Scope(currentScope, parent)
        } else if (parent.type === 'VariableDeclarator' && parent.id === node) {
          inPatternCtx = false
        } else if (parent.type === 'ClassDeclaration' || parent.type === 'ClassExpression') {
          if (parent.superClass) {
            if (parent.superClass === node) {
              currentScope = new Scope(currentScope, parent)
            }
          } else if (parent.id === node) {
            currentScope = new Scope(currentScope, parent)
          }
        }
      }
    }
  })

  rootScope.finalize()
  return rootScope
}