const fs = require('fs')
function findCases(spec) {
  const source = fs.readFileSync(spec, 'utf8')
  const matches = source.match(/C\d+/g)
  return matches.map((m) => m.slice(1)).map(Number)
}

module.exports = { findCases }
