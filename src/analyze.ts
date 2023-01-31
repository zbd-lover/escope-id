/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as ESTree from 'estree'
import { traverse, Syntax } from 'estraverse'
import { Scope, type IdentifierInScope, ScopeNode, IdType } from './scope'
import { ClassDefiniton, type ClassMetaDefiniton, ClassMetaDefinitonType } from './class-def'

function isFunctionNode(node: ESTree.Node): node is ESTree.Function {
  return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression'
}

export default function analyze(node: ScopeNode) {
  /** 是否在解构上下文中 */
  let inPatternCtx = false
  let currentVarKind: 'let' | 'var' | 'const' | null = null

  let currentType: IdType | ClassMetaDefinitonType = 'unknown'
  function setCurrentType(type: IdType | ClassMetaDefinitonType) {
    currentType = type
  }
  function consumeCurrentType() {
    const ret = currentType
    currentType = 'unknown'
    return ret
  }

  let currentArea: Scope | ClassDefiniton | null = new Scope(null, node)
  const rootArea = currentArea
  function pushElToCurrentArea(el: IdentifierInScope | ClassMetaDefiniton) {
    if (currentArea) {
      if (currentArea instanceof Scope) {
        currentArea.identifiers.push(el as IdentifierInScope)
      } else {
        currentArea.definitions.push(el as ClassMetaDefiniton)
      }
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
    },

    enter(node, parent) {
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

      // 作用域更新
      if (
        node.type === 'ForInStatement' ||
        node.type === 'ForOfStatement' ||
        node.type === 'ForStatement' ||
        node.type === 'CatchClause' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression' ||
        (node.type === 'BlockStatement' && parent && (
          parent.type === 'Program' ||
          parent.type === 'BlockStatement' ||
          parent.type === 'IfStatement' ||
          parent.type === 'WhileStatement' ||
          parent.type === 'DoWhileStatement' ||
          parent.type === 'TryStatement' ||
          parent.type === 'SwitchCase'
        ))
      ) {
        currentArea = new Scope(currentArea, node)
      } else if (node.type === 'ClassBody') {
        currentArea = new ClassDefiniton(currentArea as Scope, parent as ESTree.Class)
      } else if (node.type == 'BlockStatement' && parent?.type === 'WithStatement') {
        currentArea = new Scope(currentArea, parent)
        this.skip()
        return
      }

      if (
        node.type === 'ImportDefaultSpecifier' ||
        node.type === 'ImportSpecifier' ||
        node.type === 'ImportNamespaceSpecifier'
      ) {
        setCurrentType('import')
      } else if (node.type === 'PropertyDefinition') {
        if (!node.computed) {
          setCurrentType('property')
        }
      } else if (node.type === 'MethodDefinition') {
        setCurrentType(node.kind)
      } else if (node.type === 'FunctionDeclaration') {
        if (node.id) {
          setCurrentType('function')
        } else {
          currentArea = new Scope(currentArea, node)
        }
      } else if (node.type === 'ClassDeclaration' && node.id) {
        setCurrentType('class')
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

        let type: IdType | ClassMetaDefinitonType = 'unknown'
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
                setCurrentType('variable')
                break
              } else if (isFunctionNode(parents[i]) || parents[i].type === 'CatchClause') {
                setCurrentType('argument')
                break
              }
            }
          }
        }

        type = consumeCurrentType()
        const inClassCtx = parent.type === 'PropertyDefinition' || parent.type === 'MethodDefinition'
        if (inClassCtx) {
          pushElToCurrentArea({
            name: node.name,
            type,
            static: parent.static,
          } as ClassMetaDefiniton)
        } else {
          const local = type !== 'unknown'
          const hoisted = type === 'function' || (type === 'variable' && currentVarKind === 'var')
          pushElToCurrentArea({
            type,
            name: node.name,
            local,
            hoisted
          } as IdentifierInScope)
        }
      }
    },

    leave(node, parent) {
      if (
        node.type === 'BlockStatement' ||
        node.type === 'SwitchStatement' ||
        node.type === 'ClassBody' ||
        (node.type === 'ArrowFunctionExpression' && node.expression)
      ) {
        inPatternCtx = false
        currentArea = currentArea?.parent || null
      }

      if (parent?.type === 'SwitchStatement' && parent.discriminant === node) {
        inPatternCtx = false
        currentArea = new Scope(currentArea, parent)
      }

      if (node.type === 'VariableDeclaration') {
        currentVarKind = null
      } else if (node.type === 'Identifier') {
        if (parent) {
          if (parent.type === 'FunctionDeclaration' && parent.id === node) {
            inPatternCtx = true
            currentArea = new Scope(currentArea, parent)
          } else if (parent.type === 'VariableDeclarator' && parent.id === node) {
            inPatternCtx = false
          }
        }
      } 
    }
  })

  rootArea.finalize()
  return rootArea
}