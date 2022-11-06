export default function withoutPos (node: unknown) {
  if (node === null || node === undefined) return node
  const clone = JSON.parse(JSON.stringify(node))
  delete clone.start
  delete clone.end

  const keys = Object.keys(clone)
  for (let i = 0, key: string; i < keys.length; i++) {
    key = keys[i]
    if (typeof clone[key] === 'object') {
      clone[key] = withoutPos(clone[key])
    }
  }

  return clone
}