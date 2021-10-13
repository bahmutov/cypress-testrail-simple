const fs = require('fs')

function findCasesInSpec(spec) {
  const source = fs.readFileSync(spec, 'utf8')
  const matches = source.match(/C\d+/g)
  return matches.map((m) => m.slice(1)).map(Number)
}

function findCases(specs) {
  // find case Ids in each spec and flatten into a single array
  return specs.map(findCasesInSpec).reduce((a, b) => a.concat(b), [])
}

module.exports = { findCases }
