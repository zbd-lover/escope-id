import type { IdentifierInScope, Scope } from '../../src'
import { analyzeScript, analyzeModule } from '../helpers/analyze'

describe('测试表达式中的标识符是否被正确分析', () => {
  test('数组表达式', () => {
    const script = 'const arr = [a, b, ...c]'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'arr',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'a',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
        {
          name: 'b',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
        {
          name: 'c',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
      ] as IdentifierInScope[]
    )
  })

  test('箭头函数表达式', () => {
    const script = 'const arr = (a, b, c) => {}'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'arr',
          type: 'variable',
          hoisted: false,
          local: true,
        }
      ] as IdentifierInScope[]
    )
  })

  test('赋值表达式（不使用数组解构赋值）', () => {
    const script = 'const arr = []; arr = [a, b]'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'arr',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'a',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
        {
          name: 'b',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
      ] as IdentifierInScope[]
    )
  })

  test('赋值表达式（使用数组解构赋值）', () => {
    const script = 'const arr = []; [arr] = [a]'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'arr',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'a',
          type: 'unknown',
          hoisted: false,
          local: false,
        }
      ] as IdentifierInScope[]
    )
  })

  test('await表达式', () => {
    const script = 'async function fn1() { await promise0; }'
    const topScope = analyzeScript(script)
    const targetScope = topScope.children[0] as Scope
    expect(targetScope.identifiers).toEqual(
      [
        {
          name: 'promise0',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
      ] as IdentifierInScope[]
    )
  })

  test('二元运算表达式', () => {
    const script = 'const a = 10, b = a + c + 1;'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'b',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'c',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
      ] as IdentifierInScope[]
    )
  })

  test('函数调用表达式（不使用可选链操作符）', () => {
    const script = 'function fn1() {}; fn1(a, b, ...c)'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'fn1',
          type: 'function',
          hoisted: true,
          local: true,
        },
        {
          name: 'a',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
        {
          name: 'b',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
        {
          name: 'c',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
      ] as IdentifierInScope[]
    )
  })

  test('函数调用表达式（使用可选链操作符）', () => {
    const script = 'function fn1() {}; fn1?.(a, b, ...c)'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'fn1',
          type: 'function',
          hoisted: true,
          local: true,
        },
        {
          name: 'a',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
        {
          name: 'b',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
        {
          name: 'c',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
      ] as IdentifierInScope[]
    )
  })

  test('类表达式', () => {
    const script = 'const A = class A extends B {}'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'A',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'B',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
      ] as IdentifierInScope[]
    )
  })

  test('三目运算表达式', () => {
    const script = 'const a = 1, b = a === c ? d : 0;'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'b',
          type: 'variable',
          hoisted: false,
          local: true,
        },
        {
          name: 'c',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
        {
          name: 'd',
          type: 'unknown',
          hoisted: false,
          local: false,
        },
      ] as IdentifierInScope[]
    )
  })

  test('函数表达式', () => {
    const script = 'const fn1 = function fn1(a, b, c){}'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'fn1',
          type: 'variable',
          hoisted: false,
          local: true,
        }
      ] as IdentifierInScope[]
    )
  })

  test('变量表达式', () => {
    const script = 'a;'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'unknown',
          hoisted: false,
          local: false
        }
      ] as IdentifierInScope[]
    )
  })

  test('动态导入表达式', () => {
    const script = 'import(\'./pkg\');'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers.length).toBe(0)
  })

  test('字面量表达式', () => {
    const script = '1'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers.length).toBe(0)
  })

  test('逻辑运算表达式', () => {
    const script = 'const a = true; a && b || c'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'variable',
          hoisted: false,
          local: true
        },
        {
          name: 'b',
          type: 'unknown',
          hoisted: false,
          local: false
        },
        {
          name: 'c',
          type: 'unknown',
          hoisted: false,
          local: false
        }
      ] as IdentifierInScope[]
    )
  })

  test('对象成员访问表达式（不使用可选链操作符，且property为静态）', () => {
    const script = 'const obj = {}; obj.name'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'obj',
          type: 'variable',
          hoisted: false,
          local: true
        }
      ] as IdentifierInScope[]
    )
  })

  test('对象成员访问表达式（不使用可选链操作符，且property为动态）', () => {
    const script = 'const obj = {}; obj[name]'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'obj',
          type: 'variable',
          hoisted: false,
          local: true
        },
        {
          name: 'name',
          type: 'unknown',
          hoisted: false,
          local: false
        }
      ] as IdentifierInScope[]
    )
  })

  test('对象成员访问表达式（使用可选链操作符，且property为静态）', () => {
    const script = 'const obj = {}; obj?.name'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'obj',
          type: 'variable',
          hoisted: false,
          local: true
        }
      ] as IdentifierInScope[]
    )
  })

  test('对象成员访问表达式（使用可选链操作符，且property为动态）', () => {
    const script = 'const obj = {}; obj?.[name]'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'obj',
          type: 'variable',
          hoisted: false,
          local: true
        },
        {
          name: 'name',
          type: 'unknown',
          hoisted: false,
          local: false
        }
      ] as IdentifierInScope[]
    )
  })

  test('元属性表达式', () => {
    const script = 'import.meta'
    const topScope = analyzeModule(script)
    expect(topScope.identifiers.length).toBe(0)
  })

  test('new表达式', () => {
    const script = 'const a = new A(b, c, ...d);'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'variable',
          hoisted: false,
          local: true
        },
        {
          name: 'A',
          type: 'unknown',
          hoisted: false,
          local: false
        },
        {
          name: 'b',
          type: 'unknown',
          hoisted: false,
          local: false
        },
        {
          name: 'c',
          type: 'unknown',
          hoisted: false,
          local: false
        },
        {
          name: 'd',
          type: 'unknown',
          hoisted: false,
          local: false
        },
      ] as IdentifierInScope[]
    )
  })

  test('对象表达式', () => {
    const script = `
      const obj1 = {};
      const obj2 = {
        foo: 1,
        [bar]: 2,
        method1() {},
        test: function() {},
        get value() {},
        set value2(v) {} 
      }
    `
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'obj1',
          type: 'variable',
          hoisted: false,
          local: true
        },
        {
          name: 'obj2',
          type: 'variable',
          hoisted: false,
          local: true
        },
        {
          name: 'bar',
          type: 'unknown',
          hoisted: false,
          local: false
        },
      ] as IdentifierInScope[]
    )
  })

  test('连续求值表达式', () => {
    const script = 'let a = 10, b = (a,c+1,1)'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'variable',
          hoisted: false,
          local: true
        },
        {
          name: 'b',
          type: 'variable',
          hoisted: false,
          local: true
        },
        {
          name: 'c',
          type: 'unknown',
          hoisted: false,
          local: false
        },
      ] as IdentifierInScope[]
    )
  })

  test('模板字符串表达式', () => {
    const script = 'const a = `---${b}---`'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'variable',
          hoisted: false,
          local: true
        },
        {
          name: 'b',
          type: 'unknown',
          hoisted: false,
          local: false
        }
      ] as IdentifierInScope[]
    )
  })

  test('this表达式', () => {
    const script = 'this.name'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual([])
  })

  test('一元运算表达式', () => {
    const script = 'typeof obj'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'obj',
          type: 'unknown',
          hoisted: false,
          local: false
        }
      ] as IdentifierInScope[]
    )
  })

  test('自更新操作表达式', () => {
    const script = 'a++'
    const topScope = analyzeScript(script)
    expect(topScope.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'unknown',
          hoisted: false,
          local: false
        }
      ] as IdentifierInScope[]
    )
  })

  test('yield表达式', () => {
    const script = 'function* gen() { yield a }'
    const topScope = analyzeScript(script)
    const targetScope = topScope.children[0] as Scope
    expect(targetScope.identifiers).toEqual(
      [
        {
          name: 'a',
          type: 'unknown',
          hoisted: false,
          local: false
        }
      ]
    )
  })
})
