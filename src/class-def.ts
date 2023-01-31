import type { Class } from 'estree'
import { Scope } from './scope'

export type ClassMetaDefinitonType = 'property' | 'method' | 'get' | 'set' | 'constructor'  

export interface ClassMetaDefiniton {
  name: string,
  static: boolean,
  type: ClassMetaDefinitonType
}

export class ClassDefiniton {
  public readonly node: Class
  public readonly parent: Scope | null
  public readonly children: Scope[]
  public definitions: ClassMetaDefiniton[]

  constructor (parent: Scope | null, node: Class) {
    this.node = node
    this.parent = parent
    this.children = []
    this.definitions = []
    if (parent) {
      parent.children.push(this)
    }
  }

  public finalize() {
    for (const scope of this.children) {
      scope.finalize()
    }
  }

  public find(name: string, type: ClassMetaDefinitonType) {
    return this.definitions.find((def) => def.name === name && def.type === type) || null
  }
}