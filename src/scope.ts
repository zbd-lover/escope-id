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
  SwitchStatement

export interface IdentifierInScope {
  name: string,
  type: IdType,
  local: boolean,
  hoisted: boolean
}

export type ClassMetaDefinitonType = 'property' | 'method' | 'get' | 'set' | 'constructor'

export interface ClassMetaDefiniton {
  name: string,
  static: boolean,
  type: ClassMetaDefinitonType
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class Area<N, P extends Area<any, any, any>, C extends Area<any, any, any>> {
  public readonly node: N
  public readonly parent: P | null
  public readonly children: C[]

  constructor (parent: P | null, node: N) {
    this.node = node
    this.parent = parent
    if (parent) {
      parent.children.push(this)
    }
    this.children = []
  }

  /** @internal */
  public finalize () {
    for (const childScope of this.children) {
      childScope.finalize()
    }
  }

  public acquire (node: Node): Area<N, P, C> | null {
    if (this.node === node) return this
    for (const child of this.children) {
      const ret = child.acquire(node)
      if (ret) {
        return ret
      }
    }
    return null
  }
}

export class Scope extends Area<ScopeNode, Scope | ClassDefiniton, Scope | ClassDefiniton> {
  /** @readonly */
  public identifiers: IdentifierInScope[]

  constructor (parent: (Scope | ClassDefiniton | null), node: ScopeNode) {
    super(parent, node)
    this.identifiers = []
  }

  /** @internal */
  public finalize () {
    // 移除引用当前作用域变量但类型暂为unknown的标识符
    // const a = 10; console.log(a) ; 
    // 第二个'a'也会被写入identifiers，但类型为unknown
    const localIds = this.identifiers.filter((id) => id.local)
    const deletedIndex: number[] = []
    for (let i = 0, id: IdentifierInScope, l = this.identifiers.length; i < l; i++) {
      id = this.identifiers[i]
      if (localIds.some((_id) => _id.name === id.name) && id.type === 'unknown') {
        deletedIndex.push(i)
      }
    }
    this.identifiers = this.identifiers.filter((_, index) => !deletedIndex.includes(index))

    // 计算所有暂时为unknown类型的标识符的真正类型
    // 如果这个标识符在祖先级作用域中被定义，则将类型与之保持一致
    const unknownIds = this.identifiers.filter((id) => id.type === 'unknown')
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
      let baseScope: Scope | ClassDefiniton | null = this
      while (baseScope) {
        const node = baseScope.node
        if (node.type === 'FunctionExpression') {
          /**
           * 类的成员方法或者set和get也会形成作用域，且相应node的类型为FunctionExpression
           * 这种情况下，和边界情况1很相似，但并不一样，应进行忽略
           * const a = class A {
           *  method() {
           *    method(); // 它应该在当前以及祖先作用域中寻找被定义的method变量，而不是相当于'this.method()'
           *  }
           * }
           */
          const parentScope = baseScope.parent
          if (!(parentScope &&
            parentScope instanceof ClassDefiniton &&
            parentScope.find(id.name))
          ) {
            if (node.id?.name === id.name) {
              id.type = 'function'
              break
            }
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

    super.finalize()
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

export class ClassDefiniton extends Area<Class, Scope, Scope> {
  public definitions: ClassMetaDefiniton[]

  constructor (parent: Scope | null, node: Class) {
    super(parent, node)
    this.definitions = []
  }

  public find (name: string, type?: ClassMetaDefinitonType, _static?: boolean) {
    _static = !!_static
    return this.definitions.find((def) => {
      return def.name === name &&
        (type ? def.type === type : true) &&
        (def.static === _static)
    }) || null
  }
}

export function createAreaMap (area: Scope | ClassDefiniton) {
  const map = new WeakMap<Node, Scope | ClassDefiniton>()

  function record (area: Scope | ClassDefiniton) {
    map.set(area.node, area)
    for (const child of area.children) {
      record(child)
    }
  }
  record(area)

  return function acquire (node: Node) {
    return map.get(node) || null
  }
}
