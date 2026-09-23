const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

const output = ts.transpileModule(fs.readFileSync(`${__dirname}/prediction.ts`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText
function load(storage) {
  const context = { exports: {}, sessionStorage: storage }
  vm.runInNewContext(output, context)
  return context.exports
}

test('pending intake restores the original body and key after navigation', () => {
  const body = JSON.stringify({ model: 'AQUA NHP10', make_year: 2013, damage_zone: 'Front' })
  const saved = JSON.stringify({ body, key: 'original-retry-key' })
  const api = load({ getItem: key => key === 'account-a' ? saved : null })
  assert.equal(api.readPendingIntake('account-a').body, body)
  assert.equal(api.readPendingIntake('account-a').key, 'original-retry-key')
  assert.equal(api.readPendingIntake('account-b'), null)
})

test('corrupt or unavailable browser storage does not crash the queue', () => {
  for (const saved of ['{', 'null', '{"body":"invalid","key":"k"}', '{"body":"{}","key":"k"}']) {
    assert.equal(load({ getItem: () => saved }).readPendingIntake('a'), null)
  }
  assert.equal(load({ getItem() { throw new Error('Storage blocked') } }).readPendingIntake('a'), null)
})

test('zero predictions has no score; reviewing parts changes the remaining average', () => {
  const api = load({ getItem: () => null })
  assert.equal(api.averageScore({ parts: [] }), null)
  assert.equal(api.averageScore({ parts: [{ confidence_pct: 90 }, { confidence_pct: 40 }] }), 65)
  assert.equal(api.averageScore({ parts: [{ confidence_pct: 40 }] }), 40)
})
