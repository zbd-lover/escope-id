# 简介
基于estree，分析作用域中标识符的定义。

# 安装
`npm i escope-id`

# 导出函数
```javascript
import { analyze, createAreaMap } from 'escope-id';
```
## analyze
接收一个类型为'Program'的ast结点，构造作用域并分析其中的标识符，或者构造类定义。

### 类型
```typescript
import type {
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

interface IdentifierInScope {
  name: string,
  /**
   * variable类型对应使用const、let或var声明的变量
   * function类型对应函数声明
   * class类型对应类声明
   * argument类型对应函数的参数，或者catch语句的参数
   * import类型对应使用导入语句声明的变量
   * unknown类型对应那些即不在当前作用域声明也不在某个祖先作用域声明的变量
   */
  type: 'variable' | 'function' | 'class' | 'argument' | 'import' | 'unknown',
  /** 是否在当前作用域中声明的 */
  local: boolean,
  /** 该标识符的声明是否会被提升 */
  hoisted: boolean
}

type ScopeNode = Program |
  ESTFunction |
  BlockStatement |
  ForStatement |
  ForInStatement |
  ForOfStatement |
  CatchClause |
  WithStatement |
  SwitchStatement

class Scope {
  public readonly node: ScopeNode
  public readonly parent: Scope | ClassDefinition | null; // 只有根级别的作用域的parent为null
  public readonly children: (Scope | ClassDefinition)[];
  /** @readonly */
  public identifiers: IdentifierInScope

  /** 根据名称查询一个标识符 */
  public find(name: string): IdentifierInScope // 标识符的name在当前作用域中是唯一的
  /**
   * 根据名称来判断对应标识符在何处声明
   * 如果目标标识符在当前作用域中不存在，返回'unknown'；
   * 如果存在且它的'local'属性值为true，返回'local'；
   * 如果存在且它的'local'属性值为false，type属性值为'unknown'时返回'global否则返回'ancestral'。
   * */
  public where(name: string): 'unknown' | 'local' | 'ancestral' | 'glboal'

  /** 根据一个ast结点来查询相应的作用域或者类定义 */
  public acquire(node: ScopeNode | Class): Scope | ClassDefintion | null
}

interface ClassMetaDefiniton {
  name: string,
  static: boolean,
  type: 'property' | 'method' | 'get' | 'set' | 'constructor'
}

class ClassDefinition {
  public readonly node: Class
  public readonly parent: Scope | null;
  public readonly children: Scope[];
  public definitions: ClassMetaDefiniton[]

  public find(name: string, type?: string, _static?: boolean): ClassMetaDefiniton | null
  public acquire(node: ScopeNode | Class): Scope | ClassDefintion | null
}
```
### 使用
```javascript
import { parse } from 'acorn';
import { analyze } from 'escope-id';
const script = 'const a = 10; console.log(a)';
const topScope = analyze(parse(script))
console.log(topScope.identifiers)
// [
//   { name: 'a', type: 'variable', hoisted: false, local: true },
//   { name: 'console', type: 'unknown', hoisted: false, local: false }
// ]
console.log(topScope.where('console')) // 'global'
```
## createAreaMap
Scope类的方法acquire和ClassDefintion类的方法acquire的替代品，这两个类的方法是通过遍历子结点来获取目标值的，
而createAreaMap函数会创建一个映射到目标值的WeakMap，并返回一个函数用于查询，查询速度较快。
### 使用
```javascript
import { parse } from 'acorn';
import { createAreaMap } from 'escope-id';
const script = 'const a = 10; console.log(a)';
const topScope = analyze(parse(script))
const program = topScope.node
const acquire = createAreaMap(topScope)
console.log(acquire(program) === topScope) // true
```
