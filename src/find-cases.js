const fs = require('fs')
const { getTestNames, filterByEffectiveTags } = require('find-test-names')

/**
 * Finds the test case IDs in the test titles.
 * @example "C101: Test case title" => "101"
 */
function findCasesInSpec(spec, readSpec = fs.readFileSync, tagged) {
  const source = readSpec(spec, 'utf8')

  let testNames
  if (Array.isArray(tagged) && tagged.length > 0) {
    const filteredTests = filterByEffectiveTags(source, tagged)
    testNames = filteredTests.map((t) => t.name)
  } else {
    const found = getTestNames(source)
    testNames = found.testNames
  }

  // a single test case ID per test title for now
  const ids = testNames
    .map((testName) => {
      const matches = testName.match(/\bC(?<caseId>\d+)\b/)
      if (!matches) {
        return
      }
      return Number(matches.groups.caseId)
    })
    .filter((id) => !isNaN(id))

  // make sure the test ids are unique
  return Array.from(new Set(ids)).sort()
}

function findCases(specs, readSpec = fs.readFileSync, tagged) {
  // find case Ids in each spec and flatten into a single array
  const allCaseIds = specs
    .map((spec) => findCasesInSpec(spec, readSpec, tagged))
    .reduce((a, b) => a.concat(b), [])
    .filter((id) => !isNaN(id))
  const uniqueCaseIds = Array.from(new Set(allCaseIds)).sort()
  return uniqueCaseIds
}

module.exports = { findCases, findCasesInSpec }
