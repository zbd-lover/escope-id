import {
  VisitorKeys,
  VisitorOption,
  Syntax,
  Controller,
  NodeType,
  attachComments,
  cloneEnvironment
} from 'estraverse'

import analyze from './analyze'
import { traverse, replace, type Visitor } from './iterate'

export {
  analyze,
  traverse,
  replace,
  attachComments,
  cloneEnvironment
}

export type {
  Visitor,
  VisitorKeys,
  VisitorOption,
  Syntax,
  Controller,
  NodeType
}