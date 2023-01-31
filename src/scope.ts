import type {
  ForInStatement,
  ForOfStatement,
  ForStatement,
  BlockStatement,
  Function as ESTFunction,
  Program,
  CatchClause,
  WithStatement,
  SwitchStatement,
} from 'estree'
import type { ClassDefiniton } from './class-def'

export type IdType = 'variable' | 'function' | 'class' | 'argument' | 'import' | 'unknown'

export type ScopeNode = Program |
  ESTFunction |
  BlockStatement |
  ForStatement |
  ForInStatement |
  ForOfStatement |
  CatchClause |
  WithStatement |
  SwitchStatement

export interface IdentifierInScope {
  name: string,
  type: IdType,
  local: boolean,
  hoisted: boolean
}

export class Scope {
  public readonly node: ScopeNode
  public readonly parent: Scope | ClassDefiniton |  null
  public readonly children: (Scope | ClassDefiniton)[]
  /** @readonly */
  public identifiers: IdentifierInScope[]

  constructor(parent: Scope | ClassDefiniton | null, node: ScopeNode) {
    this.node = node
    this.parent = parent
    if (parent) {
      parent.children.push(this)
    }
    this.children = []
    this.identifiers = []
  }

  /** @internal */
  public finalize() {
    // 移除引用当前作用域变量但类型暂为unknown的标识符
    // const a = 10; console.log(a) ;
    const localIds = this.identifiers.filter((id) => id.local)
    const deletedIndex: number[] = []
    for (let i = 0, id: IdentifierInScope, l = this.identifiers.length; i < l; i++) {
      id = this.identifiers[i]
      if (localIds.some((_id) => _id.name === id.name) && id.type === 'unknown') {
        deletedIndex.push(i)
      }
    }
    // console.log(localIds, deletedIndex)
    this.identifiers = this.identifiers.filter((_, index) => !deletedIndex.includes(index))

    // 计算所有暂时为unknown类型的变量的真正类型
    // 如果这个变量在某一祖先作用域中而非全局作用域被声明，则将类型和该祖先作用域中相应的变量类型保持一致
    // 否则，类型确实为unknown
    const unknownIds = this.identifiers.filter((id) => id.type === 'unknown')
    let baseScope = this.parent
    while (baseScope) {
      if (baseScope instanceof Scope) {
        unknownIds.forEach((id) => {
          if (id.type === 'unknown')  {
            const target = (baseScope as Scope).find(id.name)
            if (target) {
              id.type = target.type
            }
          }
        })
      }
      baseScope = baseScope.parent
    }

    // 边界情况1：
    // const a = function A() { console.log(A) }
    // 函数名为A的函数表达式在全局作用域中并不存在
    // 但它的类型我们可以确定为：'function'

    // 边界情况2 （与1很像）

    // if (this.node.type === 'FunctionExpression') {

    // }

    for (const childScope of this.children) {
      childScope.finalize()
    }
  }

  public where(name: string) {
    const id = this.find(name)
    if (!id) return 'unknown'
    return id.local ? 'local' : id.type !== 'unknown' ? 'ancestral' : 'global'
  }

  public find(name: string) {
    return this.identifiers.find((id) => id.name === name) || null
  }
}