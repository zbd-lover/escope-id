# Profile
Analyze the definition of identifier based on estree.
# Api
## parse
### import
``` javascript
// in esmodule
import { parse } from 'estree-identifier-parser'
// in global
const { parse } = window.EstIdParser
```
### signature
(node: ScopeNode) => Scope
### example
``` javascript
import { parse } from 'estree-identifier-parser';
const script = `
  let a = 1, obj = {}
  const { b = globalValue1 } = obj
  console.log(a, b)
`
const target = [
  {
    name: 'a',
    scope: 'local',
    type: 'variable',
    imported: false,
    exported: false,
  },
  {
    name: 'obj',
    scope: 'local',
    type: 'variable',
    imported: false,
    exported: false,
  },
  {
    name: 'b',
    scope: 'local',
    type: 'variable',
    imported: false,
    exported: false,
  },
  {
    name: 'globalValue1',
    scope: 'ancestral',
    type: 'unknown',
    imported: false,
    exported: false,
  },
  {
    name: 'console',
    scope: 'ancestral',
    type: 'unknown',
    imported: false,
    exported: false,
  }
]
const { identifiers } = parse(script)
expect(identifiers).toEqual(target) // true
```
## scope
### import
```javascript
// in esmodule
import { Scope } from 'estree-identifier-parser'
// in window
const { Scope } = window.EstIdParser
```
### example
```javascript
const scope = new Scope()
scope.hasId('myVar1') // false
scope.addId({
  name: 'var1',
  scope: 'local',
  type: 'variable',
  imported: false,
  exported: false,
})
scope.hasId('var1') // true
```
# Types
```typescript
import {
  ForInStatement,
  ForOfStatement,
  ForStatement,
  BlockStatement,
  Function,
  Program,
  CatchClause,
  WithStatement,
  SwitchStatement,
  ClassBody
} from 'estree'

type ScopeNode = Program |
  Function |
  BlockStatement |
  ForStatement |
  ForInStatement |
  ForOfStatement |
  CatchClause |
  WithStatement |
  SwitchStatement |
  ClassBody

class Scope {
  node: ScopeNode
  parent: Scope | null
  children: Scope[]
  identifiers: IdentifierInScope[]

  // tools
  hasId(finder: string | (id: IdentifierInScope) => boolean): boolean
  hasGlobalId(name: string): boolean
  getIds(filter: (id: IdentifierInScope) => boolean): IdentifierInScope[]
  getGlobalIds(): IdentifierInScope[]

  // developer calls, but you can make custom scope by them
  addId(id: IdentifierInScope, hoisted?: boolean): void
  setParent(parent: Scope | null): void
}

type IdentifierScope = 'local' | 'ancestral' | 'unreachable'

type IdentifierType = 'variable' | 'function' | 'argument' | 'class' | 'unknown' | 'member'

interface IdentifierInScope {
  name: string,
  type: IdentifierScope,
  scope: IdentifierType,
  imported: boolean,
  exported: boolean
}
```
# Support
Support analysis of [esma2021](https://github.com/estree/estree), except the following syntaxs:
+ export all declaration (export * as moduleA from 'a')
+ meta property (import.meta, new.target)
+ with statement (cause it's deprecated)