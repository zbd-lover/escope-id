import { traverse } from 'estraverse'
import Scope, { NodeWithScope, IdScope, IdType, IdentifierInScope } from './scope'

export {
  Scope
}

export type {
  NodeWithScope,
  IdType as IdentifierType,
  IdScope as IdentifierScope,
  IdentifierInScope
}

export default function parse(block: NodeWithScope) {
  const top = new Scope(block)
  /** scope stack */
  const stack = [top]

  let varKind: 'var' | 'let' | 'const' | null;
  let idTypeContext: IdType = 'unknown'
  let inExportContext = false, inImportContext = false

  function currentScope(): Scope | undefined {
    return stack[stack.length - 1]
  }

  /** push and bind relation */
  function push(scope: Scope) {
    const parent = stack[stack.length - 1]
    stack.push(scope)
    scope.setParent(parent)
  }

  function addIdIntoCurrentScope(id: IdentifierInScope) {
    const hoisted = (id.type === 'variable' && varKind === 'var') || id.type === 'function'
    currentScope()?.addId(id, hoisted)
  }

  function tryAddAncestralId(name: string) {
    if (!currentScope()?.hasLocalId(name)) {
      addIdIntoCurrentScope({
        name,
        scope: 'ancestral',
        type: 'unknown',
        exported: false,
        imported: false
      })
    }
  }

  traverse(block, {
    enter(node, parent) {
      if (!parent) return

      // with statement is deprecated.
      if (node.type === 'WithStatement') {
        this.skip()
        return
      }

      if (node.type === 'ClassDeclaration') {
        const name = node.id?.name
        if (name) {
          addIdIntoCurrentScope({
            name,
            type: 'class',
            scope: 'local',
            imported: false,
            exported: inExportContext
          })
        }
        // no plan about 'class'
        this.skip()
        return
      }

      switch (node.type) {
        case 'ImportDeclaration':
          inImportContext = true
          break
        case 'ExportDefaultDeclaration':
          inExportContext = true
          break
        case 'ExportNamedDeclaration':
          // all named exports are treated as 'variable'
          idTypeContext = 'variable'
          inExportContext = true
          break
      }

      switch (node.type) {
        case 'VariableDeclaration':
          idTypeContext = 'variable'
          varKind = node.kind
          break
        case 'FunctionDeclaration':
          idTypeContext = 'function'
          break
        case 'CatchClause':
        case 'ArrowFunctionExpression':
        case 'FunctionExpression':
          idTypeContext = 'argument'
          break
      }

      switch (node.type) {
        case 'FunctionDeclaration':
          const fnName = node.id?.name
          if (fnName) {
            addIdIntoCurrentScope({
              name: fnName,
              scope: 'local',
              type: 'function',
              exported: inExportContext,
              imported: inImportContext
            })
          }
          idTypeContext = 'argument'
          push(new Scope(node))
          break
        // Although a fn-exp can have a name, it only can be called inside itself.
        // Thus, its name will be added in the concomitant block scope, if one.
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
        case 'ForStatement':
        case 'ForInStatement':
        case 'ForOfStatement':
        case 'CatchClause':
          push(new Scope(node));
          break
        case 'BlockStatement':
          idTypeContext = 'unknown'
          const type = parent.type
          // a pure block without context
          if (
            type !== 'FunctionDeclaration' &&
            type !== 'FunctionExpression' &&
            type !== 'ArrowFunctionExpression' &&
            type !== 'CatchClause'
          ) {
            push(new Scope(node))
          }
          break
        case 'Identifier':
          // judge about 'unreachable' identifier
          const cs = currentScope()
          if (cs && cs.node.type === 'FunctionExpression') {
            if (cs.node.id) {
              const { name } = cs.node.id
              if (!cs.hasId(name) && !cs.hasLocalId(name) && name === node.name) {
                addIdIntoCurrentScope({
                  name: node.name,
                  scope: 'unreachable',
                  type: 'function',
                  imported: false,
                  exported: inExportContext
                })
                break
              }
            }
          }
          switch (parent.type) {
            case 'ImportSpecifier':
            case 'ImportDefaultSpecifier':
            case 'ImportNamespaceSpecifier':
              if (parent.local === node) {
                addIdIntoCurrentScope({
                  name: node.name,
                  scope: 'local',
                  type: 'variable',
                  exported: false,
                  imported: true
                })
              }
              break
            case 'ExportDefaultDeclaration':
              if (parent.declaration === node && cs) {
                const type: IdType =
                  cs.hasLocalId(node.name, 'function')
                    ? 'function'
                    : cs.hasLocalId(node.name, 'variable')
                      ? 'variable'
                      : 'unknown'
                if (type === 'variable' || type === 'function') {
                  addIdIntoCurrentScope({
                    name: node.name,
                    scope: 'local',
                    type,
                    exported: true,
                    imported: false
                  })
                }
              }
              break
            case 'ExportSpecifier':
            case 'ExportAllDeclaration':
              if (parent.exported === node) {
                if (idTypeContext === 'function' || idTypeContext === 'variable') {
                  addIdIntoCurrentScope({
                    name: node.name,
                    scope: 'local',
                    type: idTypeContext,
                    exported: true,
                    imported: false
                  })
                }
              }
              break
            case 'VariableDeclarator':
              if (parent.id === node) {
                addIdIntoCurrentScope({
                  name: node.name,
                  scope: 'local',
                  type: 'variable',
                  exported: inExportContext,
                  imported: inImportContext
                })
              } else if (parent.init === node) {
                tryAddAncestralId(node.name)
              }
              break;
            case 'CatchClause':
              if (idTypeContext === 'argument') {
                if (parent.param === node) {
                  addIdIntoCurrentScope({
                    name: node.name,
                    scope: 'local',
                    type: 'argument',
                    exported: inExportContext,
                    imported: inImportContext
                  })
                }
              }
              break
            case 'FunctionDeclaration':
            case 'FunctionExpression':
            case 'ArrowFunctionExpression':
              if (idTypeContext === 'argument') {
                if (parent.params.includes(node)) {
                  addIdIntoCurrentScope({
                    name: node.name,
                    scope: 'local',
                    type: 'argument',
                    exported: inExportContext,
                    imported: inImportContext
                  })
                }
              } else {
                tryAddAncestralId(node.name)
              }
              break
            case 'AssignmentPattern':
              if (parent.left === node) {
                if (idTypeContext === 'argument' || idTypeContext == 'variable') {
                  addIdIntoCurrentScope({
                    name: node.name,
                    scope: 'local',
                    type: idTypeContext,
                    exported: false,
                    imported: false
                  })
                }
              } else if (parent.right === node) {
                tryAddAncestralId(node.name)
              }
              break;
            case 'ArrayPattern':
            case 'ObjectPattern':
            case 'RestElement':
              if (idTypeContext === 'argument' || idTypeContext == 'variable') {
                addIdIntoCurrentScope({
                  name: node.name,
                  scope: 'local',
                  type: idTypeContext,
                  exported: false,
                  imported: false
                })
              } else {
                tryAddAncestralId(node.name)
              }
              break
            case 'SpreadElement':
              tryAddAncestralId(node.name)
              break
            case 'MemberExpression':
              if (parent.object === node) {
                tryAddAncestralId(node.name)
              } else if (parent.computed && parent.property === node) {
                tryAddAncestralId(node.name)
              }
              break
            case 'Property':
              if (parent.key === node) {
                const parents = this.parents()
                if (parents[parents.length - 1]?.type === 'ObjectPattern') {
                  if (idTypeContext === 'argument' || idTypeContext === 'variable') {
                    addIdIntoCurrentScope({
                      name: node.name,
                      scope: 'local',
                      type: idTypeContext,
                      exported: false,
                      imported: false
                    })
                  } else if (parent.computed) {
                    tryAddAncestralId(node.name)
                  }
                }
                break
              }
            default:
              if (!cs || !cs.hasUnreachableId(node.name)) {
                tryAddAncestralId(node.name)
              }
              break
          }
          break
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
        case 'VariableDeclaration':
          idTypeContext = 'unknown'
          varKind = null
          break
        case 'ImportDeclaration':
          inImportContext = false;
          break
        case 'ExportNamedDeclaration':
          idTypeContext = 'unknown'
          inExportContext = false;
          break
        case 'ExportDefaultDeclaration':
          inExportContext = false;
          break
      }
    }
  })

  return top
}