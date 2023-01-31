import type { IdentifierInScope } from '../../src'
import { analyzeModule } from '../helpers/analyze'

test('应正确分析导入的标识符', () => {
  const script = `
    import A from 'moduleA'
    import * as B from 'moduleA';
    import { C1, _C2 as C2 } from 'moduleC'
  `
  const topScope = analyzeModule(script)
  expect(topScope.identifiers).toEqual([
    {
      name: 'A',
      type: 'import',
      local: true,
      hoisted: false
    },
    {
      name: 'B',
      type: 'import',
      local: true,
      hoisted: false
    },
    {
      name: 'C1',
      type: 'import',
      local: true,
      hoisted: false
    },
    {
      name: 'C2',
      type: 'import',
      local: true,
      hoisted: false
    }
  ] as IdentifierInScope[])
})