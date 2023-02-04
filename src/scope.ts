import type {
  Node,
  Class,
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

export type IdType = 'variable' | 'function' | 'class' | 'argument' | 'import' | 'unknown'

export type ScopeNode = Program |
  ESTFunction |
  BlockStatement |
  ForStatement |
  ForInStatement |
  ForOfStatement |
  CatchClause |
  WithStatement |
  SwitchStatement |
  Class

export interface IdentifierInScope {
  name: string,
  type: IdType,
  local: boolean,
  hoisted: boolean
}

export class Scope {
  public readonly node: ScopeNode
  public readonly parent: Scope | null
  public readonly children: Scope[]
  /** @readonly */
  public identifiers: IdentifierInScope[]

  constructor (parent: (Scope | null), node: ScopeNode) {
    this.node = node
    this.parent = parent
    if (parent) {
      parent.children.push(this)
    }
    this.children = []
    this.identifiers = []
  }

  /** @internal */
  public finalize () {
    const deletedIndexs: number[] = []

    const localIds = this.identifiers.filter((id) => id.local)
    const duplicatedIds = new Set<IdentifierInScope>()
    let unknownIds = this.identifiers.filter((id) => id.type === 'unknown')
    unknownIds.forEach((id, index) => {
      const startIndex = unknownIds.findIndex((_id) => _id.name === id.name)
      if (startIndex !== index) {
        duplicatedIds.add(id)
      }
    })

    for (let i = 0, startIndex: number, id: IdentifierInScope, l = this.identifiers.length; i < l; i++) {
      id = this.identifiers[i]
      // 移除引用当前作用域变量但类型暂为unknown的标识符
      // 场景：const a = 10; console.log(a); 
      if (localIds.some((_id) => _id.name === id.name) && id.type === 'unknown') {
        deletedIndexs.push(i)
      } else {
        // 移除重复标识符
        // 场景：console.log(console)
        startIndex = this.identifiers.findIndex((_id) => _id.name === id.name)
        if (duplicatedIds.has(id) && (startIndex !== i)) {
          deletedIndexs.push(i)
        }
      }
    }
    this.identifiers = this.identifiers.filter((_, index) => !deletedIndexs.includes(index))
    duplicatedIds.clear()

    unknownIds = this.identifiers.filter((id) => id.type === 'unknown')
    // 计算所有暂时为unknown类型的标识符的真正类型
    // 如果这个标识符在祖先级作用域中被定义，则将类型与之保持一致
    let baseScope = this.parent
    while (baseScope) {
      if (baseScope instanceof Scope) {
        unknownIds.forEach((id) => {
          if (id.type === 'unknown') {
            const target = (baseScope as Scope).find(id.name)
            if (target) {
              id.type = target.type
            }
          }
        })
      }
      baseScope = baseScope.parent
    }

    // 边界情况1：const a = function A() { console.log(A) }
    // 边界情况2：const a = class A { method1() { console.log(A) } }
    // 函数A和类A没有在某个作用域被定义（在该作用域中无法访问到），但可在其内部被访问到
    // 无法在相应的作用域中访问到，意味在该作用域中标识符的类型为unknown
    // 但实际上我们可以确定这些标识符的类型为'function'或'class'
    unknownIds.forEach((id) => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let baseScope: Scope | null = this
      while (baseScope) {
        const node = baseScope.node
        if (node.type === 'FunctionExpression') {
          if (node.id?.name === id.name) {
            id.type = 'function'
            break
          }
        } else if (node.type === 'ClassExpression') {
          if (node.id?.name === id.name) {
            id.type = 'class'
            break
          }
        }

        baseScope = baseScope.parent
      }
    })

    for (const childScope of this.children) {
      childScope.finalize()
    }
  }

  public acquire (node: Node): Scope | null {
    if (this.node === node) return this
    for (const child of this.children) {
      const ret = child.acquire(node)
      if (ret) {
        return ret
      }
    }
    return null
  }

  public where (name: string) {
    const id = this.find(name)
    if (!id) return 'unknown'
    return id.local ? 'local' : id.type !== 'unknown' ? 'ancestral' : 'global'
  }

  public find (name: string) {
    return this.identifiers.find((id) => id.name === name) || null
  }
}

export function createScopeMap (scope: Scope) {
  const map = new WeakMap<Node, Scope>()

  function record (area: Scope) {
    map.set(area.node, area)
    for (const child of area.children) {
      record(child)
    }
  }
  record(scope)

  return function acquire (node: Node) {
    return map.get(node) || null
  }
}
