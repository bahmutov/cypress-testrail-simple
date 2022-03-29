const fs = require('fs')

/**
 * Finds the test case IDs in the test titles.
 * @example "C101: Test case title" => "101"
 */
function findCasesInSpec(spec, readSpec = fs.readFileSync) {
  const source = readSpec(spec, 'utf8')
  // the test case ID has to be by itself or next to a quote
  const matches = source.match(/['"` ]C\d+['"` ]/g)
  if (!matches) {
    // no case Ids found
    return []
  }
  const cleaned = matches.map((m) => m.replace(/['`\'"C']/g, ''))
  return cleaned.map(Number)
}

function findCases(specs, readSpec = fs.readFileSync) {
  // find case Ids in each spec and flatten into a single array
  return specs
    .map((spec) => findCasesInSpec(spec, readSpec))
    .reduce((a, b) => a.concat(b), [])
}

module.exports = { findCases, findCasesInSpec }
