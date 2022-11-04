import { traverse } from 'estraverse'
import { ClassExpression, ObjectExpression, ObjectPattern } from 'estree'
import Scope, { ScopeNode, IdType, IdentifierInScope } from './scope'

function hasLocalId (scope: Scope, name: string) {
  return scope.hasId((id) => id.name === name && id.scope === 'local')
}

function hasUnreachableId (scope: Scope, name: string) {
  return scope.hasId((id) => id.name === name && id.scope === 'unreachable')
}

export default function parse (block: ScopeNode) {
  const top = new Scope(block)
  /** scope stack */
  const stack = [top]

  let varKind: 'var' | 'let' | 'const' | null
  let idTypeContext: IdType = 'unknown'
  let inFunctionExpContext = false, inFunctionExpBlock = false
  let inClassExpContext = false, inClassExpBlock = false
  let inExportContext = false, inImportContext = false

  function currentScope (): Scope | undefined {
    return stack[stack.length - 1]
  }

  /** push and bind relation */
  function push (scope: Scope) {
    const parent = stack[stack.length - 1]
    stack.push(scope)
    scope.setParent(parent)
  }

  function addIdIntoCurrentScope (id: IdentifierInScope) {
    const hoisted = (id.type === 'variable' && varKind === 'var') || id.type === 'function' || id.type === 'class'
    currentScope()?.addId(id, hoisted)
  }

  function tryAddAncestralId (name: string) {
    const cs = currentScope()
    if (!cs || hasLocalId(cs, name)) return
    addIdIntoCurrentScope({
      name,
      scope: 'ancestral',
      type: 'unknown',
      exported: false,
      imported: false
    })
  }

  traverse(block, {
    enter (node, parent) {
      // 'with' is deprecated.
      if (node.type === 'WithStatement') {
        if (node.object.type === 'Identifier') {
          tryAddAncestralId(node.object.name)
        }
        this.skip()
        return
      }

      // can't support
      if (node.type === 'MetaProperty') {
        this.skip()
        return
      }
      
      if (!parent) return

      if (parent.type === 'VariableDeclarator' && parent.init === node) {
        idTypeContext = 'unknown'
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
          varKind = node.kind
          break
        case 'VariableDeclarator':
          idTypeContext = 'variable'
          break
        case 'FunctionDeclaration':
          idTypeContext = 'function'
          break
        case 'ClassDeclaration':
          idTypeContext = 'class'
          break
        case 'ClassExpression':
          inClassExpContext = true
          break
        case 'CatchClause':
        case 'ArrowFunctionExpression':
          idTypeContext = 'argument'
          break
        case 'FunctionExpression':
          inFunctionExpContext = true
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
        case 'ClassDeclaration':
          const className = node.id?.name
          if (className) {
            addIdIntoCurrentScope({
              name: className,
              scope: 'local',
              type: 'class',
              exported: inExportContext,
              imported: inImportContext
            })
          }
          idTypeContext = 'unknown'
          break
        // Although a fn-exp can have a name, it only can be called inside itself.
        // Thus, its name will be added in the concomitant block scope, if one.
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
        case 'ForStatement':
        case 'ForInStatement':
        case 'ForOfStatement':
        case 'CatchClause':
        case 'ClassBody':
          push(new Scope(node))
          break
        case 'BlockStatement':
          inFunctionExpBlock = inFunctionExpContext
          inClassExpBlock = inClassExpContext
          idTypeContext = 'unknown'
          const type = parent.type
          if (
            type !== 'FunctionDeclaration' &&
            type !== 'FunctionExpression' &&
            type !== 'ArrowFunctionExpression' &&
            type !== 'CatchClause' &&
            type !== 'ClassBody'
          ) {
            push(new Scope(node))
          }
          break
        case 'Identifier':
          // judge about 'unreachable' identifier
          const cs = currentScope()
          if (cs && idTypeContext === 'unknown') {
            if (inClassExpBlock) {
              const parents = this.parents().reverse()
              const classExp = parents.find((parent) => parent.type === 'ClassExpression') as (ClassExpression | undefined)
              if (classExp && classExp.id) {
                const { name } = classExp.id
                if (name === node.name) {
                  addIdIntoCurrentScope({
                    name: node.name,
                    scope: 'unreachable',
                    type: 'class',
                    imported: false,
                    exported: inExportContext
                  })
                  break
                }
              }
            } else if (inFunctionExpBlock && cs.node.type === 'FunctionExpression' && cs.node.id) {
              const { name } = cs.node.id
              if (name === node.name) {
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
              if (parent.declaration === node) {
                addIdIntoCurrentScope({
                  name: node.name,
                  scope: 'ancestral',
                  type: 'unknown',
                  exported: true,
                  imported: false
                })
              }
              break
            case 'ExportSpecifier':
              if (parent.exported === node) {
                if (node.name !== 'default') {
                  addIdIntoCurrentScope({
                    name: node.name,
                    scope: 'unreachable',
                    type: 'variable',
                    exported: true,
                    imported: false
                  })
                } else {
                  addIdIntoCurrentScope({
                    name: parent.local.name,
                    scope: 'ancestral',
                    type: 'unknown',
                    exported: true,
                    imported: false
                  })
                }
              }
              break
            // case 'ExportAllDeclaration':
            //   if (parent.exported === node) {
            //     addIdIntoCurrentScope({
            //       name: node.name,
            //       scope: 'local',
            //       type: 'variable',
            //       exported: true,
            //       imported: false
            //     })
            //   }
            //   break
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
              break
            case 'SwitchStatement':
              tryAddAncestralId(node.name)
              push(new Scope(parent))
              break
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
              break
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
            case 'MemberExpression':
              if (parent.object === node) {
                tryAddAncestralId(node.name)
              } else if (parent.computed && parent.property === node) {
                tryAddAncestralId(node.name)
              }
              break
            case 'MethodDefinition':
              if (parent.key === node) {
                if (parent.computed) {
                  tryAddAncestralId(node.name)
                } else {
                  addIdIntoCurrentScope({
                    name: node.name,
                    type: 'member',
                    scope: 'local',
                    imported: false,
                    exported: false
                  })
                }
              }
              break
            case 'Property':
              if (parent.computed && parent.key === node) {
                tryAddAncestralId(node.name)
                break
              }
              const parents = this.parents().reverse()
              const contextNode = parents.find((id) => id.type === 'ObjectExpression' || id.type === 'ObjectPattern') as (ObjectPattern | ObjectExpression | undefined)
              if (contextNode?.type === 'ObjectExpression' && parent.value === node) {
                tryAddAncestralId(node.name)
                break
              }
              if (
                contextNode?.type === 'ObjectPattern' &&
                parent.value === node &&
                (idTypeContext === 'argument' || idTypeContext === 'variable')
              ) {
                addIdIntoCurrentScope({
                  name: node.name,
                  scope: 'local',
                  type: idTypeContext,
                  exported: false,
                  imported: false
                })
              }
              break
            default:
              if (cs && !hasUnreachableId(cs, node.name)) {
                tryAddAncestralId(node.name)
              }
              break
          }
          break
      }
    },
    leave (node) {
      // console
      switch (node.type) {
        case 'ForStatement':
        case 'ForInStatement':
        case 'ForOfStatement':
        case 'ClassBody':
          stack.pop()
          break
        case 'BlockStatement':
          inFunctionExpBlock = false
          inClassExpBlock = false
          stack.pop()
          break
        case 'FunctionExpression':
          inFunctionExpContext = false
          break
        case 'ClassExpression':
          inClassExpContext = false
          break
        case 'VariableDeclarator':
          idTypeContext = 'unknown'
          break
        case 'VariableDeclaration':
          varKind = null
          break
        case 'ImportDeclaration':
          inImportContext = false
          break
        case 'ExportNamedDeclaration':
          idTypeContext = 'unknown'
          inExportContext = false
          break
        case 'ExportDefaultDeclaration':
          inExportContext = false
          break
      }
    }
  })

  return top
}