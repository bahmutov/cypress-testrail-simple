const fs = require('fs')
const { getTestNames, filterByEffectiveTags } = require('find-test-names')

/**
 * Returns the TestRail case id number (if any) from the given full test title
 * @param {string} testTitle
 */
function getTestCases(testTitle) {
  const re = /\bC(?<caseId>\d+)\b/g
  const matches = [...testTitle.matchAll(re)]
  const ids = matches.map((m) => Number(m.groups.caseId))
  return uniqueSorted(ids)
}

/**
 * Gives an array, removes duplicates and sorts it
 */
function uniqueSorted(list) {
  return Array.from(new Set(list)).sort()
}

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

  const ids = testNames
    .map(getTestCases)
    .reduce((a, b) => a.concat(b), [])
    .filter((id) => !isNaN(id))

  // make sure the test ids are unique
  return uniqueSorted(ids)
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

module.exports = { findCases, getTestCases, findCasesInSpec }
