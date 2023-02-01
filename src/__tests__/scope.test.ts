import { ClassDefiniton, createAreaMap, Scope } from '../scope'
import { analyzeScript } from './helpers/analyze'

describe('测试核心类：Scope', () => {
  const script = 'const a = 10; function A(arg) { a }; console.log(a)'
  const topScope = analyzeScript(script)

  test('测试方法：find', () => {
    expect(topScope.find('b')).toBeNull()
    expect(topScope.find('a')).not.toBeNull()
  })

  test('测试方法：where', () => {
    expect(topScope.where('b')).toBe('unknown')
    expect(topScope.where('a')).toBe('local')
    expect(topScope.where('A')).toBe('local')
    expect(topScope.where('console')).toBe('global')
    const fnScope = topScope.children[0] as Scope
    expect(fnScope.where('arg')).toBe('local')
    expect(fnScope.where('a')).toBe('ancestral')
  })

  test('测试方法acquire', () => {
    const node1 = topScope.node
    const node2 = topScope.children[0].node
    expect(topScope.acquire(node1)).toBe(topScope)
    expect(topScope.acquire(node2)).toBe(topScope.children[0])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(topScope.acquire({ ...node1 } as any)).toBe(null)
  })
})

describe('测试核心类：ClassDefintion', () => {
  test('测试方法：find', () => {
    const script = `
      class A {
        constructor() {}
        static prop1 = 10;
        prop1 = 10;
        get value() { return 1 }
        set value(v) {}
        method() {}
        static method() {}
      }
    `
    const topScope = analyzeScript(script)
    const classDef = topScope.children[0] as ClassDefiniton
    expect(classDef.find('constructor', 'constructor')).not.toBeNull()
    expect(classDef.find('prop1', 'property')).not.toBeNull()
    expect(classDef.find('prop1', 'property', true)).not.toBeNull()
    expect(classDef.find('method', 'method')).not.toBeNull()
    expect(classDef.find('method', 'method', true)).not.toBeNull()
    expect(classDef.find('value', 'get')).not.toBeNull()
    expect(classDef.find('value', 'set')).not.toBeNull()
    expect(classDef.find('test')).toBeNull()
  })
})

test('测试工具函数：createAreaMap', () => {
  const script = 'const a = 10; function A(arg) { a }; console.log(a)'
  const topScope = analyzeScript(script)
  const node1 = topScope.node
  const node2 = topScope.children[0].node
  const acquire = createAreaMap(topScope)
  expect(acquire(node1)).toBe(topScope)
  expect(acquire(node2)).toBe(topScope.children[0])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect(acquire({ ...node1 } as any)).toBe(null)
})