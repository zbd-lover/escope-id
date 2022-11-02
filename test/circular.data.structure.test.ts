import { parseScript } from "./helpers/parse"
import validate from "./helpers/validate-circular-structure"

describe('test scope\'s circular data structure', () => {
  test('empty program', () => {
    const script = ``
    const res = parseScript(script)
    expect(validate(res)).toBe(true)
    expect(res.children.length).toBe(0)
  })

  test('block without context', () => {
    const script = `
      {
        let block1
      }
      {
        let block2
        {
          let block3
        }
      }
    `
    const res = parseScript(script)
    expect(validate(res)).toBe(true)
    expect(res.children.length).toBe(2)
    expect(res.children[1].children.length).toBe(1)
  })

  test('for statement', () => {
    const script = `for (;;) {}`
    const res = parseScript(script)
    expect(validate(res)).toBe(true)
    expect(res.children.length).toBe(1)
    expect(res.children[0].children.length).toBe(1)
  })

  test('for in statement', () => {
    const script = `for (let key in obj) {}`
    const res = parseScript(script)
    expect(validate(res)).toBe(true)
    expect(res.children.length).toBe(1)
    expect(res.children[0].children.length).toBe(1)
  })

  test('for of statement', () => {
    const script = `for (let key of obj) {}`
    const res = parseScript(script)
    expect(validate(res)).toBe(true)
    expect(res.children.length).toBe(1)
    expect(res.children[0].children.length).toBe(1)
  })

  test('while statement', () => {
    const script = `while(false){}`
    const res = parseScript(script)
    expect(validate(res)).toBe(true)
    expect(res.children.length).toBe(1)
  })

  test('do while statement', () => {
    const script = `do {} while(false)`
    const res = parseScript(script)
    expect(validate(res)).toBe(true)
    expect(res.children.length).toBe(1)
  })

  test('try statement', () => {
    const script = `try {} catch(err) {} finally {}`
    const res = parseScript(script)
    expect(validate(res)).toBe(true)
    expect(res.children.length).toBe(3)
  })

  test('function body1', () => {
    const script = `function fn1(arg1) {}`
    const res = parseScript(script)
    expect(validate(res)).toBe(true)
    expect(res.children.length).toBe(1)
  })

  test('function body2', () => {
    const script = `const fn1 = () => null`
    const res = parseScript(script)
    expect(validate(res)).toBe(true)
    expect(res.children.length).toBe(1)
  })

  test('if statement', () => {
    const script = `if(1) {} else if (2) {} else {} `
    const res = parseScript(script)
    expect(validate(res)).toBe(true)
    expect(res.children.length).toBe(3)
  })

  test('switch statement', () => {
    const script = `switch(var1) { case 1: case 2: case 3: break } `
    const res = parseScript(script)
    expect(validate(res)).toBe(true)
    expect(res.children.length).toBe(1)
  })

  test('class declaration', () => {
    const script = `
      class A {
        method1() {}
        method2() {}
      }
    `
    const res = parseScript(script)
    expect(validate(res)).toBe(true)
    expect(res.children.length).toBe(1)
    expect(res.children[0].children.length).toBe(2)
  })
})