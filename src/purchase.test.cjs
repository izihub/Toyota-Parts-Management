const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const context = { exports: {} }
vm.runInNewContext(ts.transpileModule(fs.readFileSync(`${__dirname}/purchase.ts`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, context)
const { draftError, getCompanionBundle } = context.exports
const rules = JSON.parse(fs.readFileSync(`${__dirname}/real_warehouse_synergy_rules.json`, 'utf8'))
const line = { id: '1', supplier: 'Toyota', vehicle: 'AQUA NHP10 2013', part: 'FRONT BUMPER', qty: 2, unitPrice: 100, source: { kind: 'manual' } }

test('bundle suggestions round up and sort consistently; invalid quantities produce no bundle', () => {
  const bundle = getCompanionBundle(rules, ' lh fog lamp ', 2)
  assert.equal(bundle.find(item => item.companionPart === 'RH FOG LAMP').suggestedOrderQty, 2)
  assert.equal(bundle.find(item => item.companionPart === 'RH FOG LAMP').confidencePct, 61)
  assert.ok(bundle.every((item, index) => index === 0 || bundle[index - 1].lift >= item.lift))
  for (const qty of [0, -1, 1.5, NaN]) assert.equal(getCompanionBundle(rules, 'FRONT BUMPER', qty).length, 0)
  assert.equal(getCompanionBundle(rules, 'NO MATCH', 20).length, 0)
})

test('missing commercial details cannot silently become a priced order', () => {
  for (const change of [{supplier: ''}, {vehicle: ''}, {unitPrice: null}, {unitPrice: NaN}, {qty: 0}, {qty: 1.5}]) {
    assert.ok(draftError([{...line, ...change}], 0))
  }
  assert.equal(draftError([{...line, unitPrice: 0}], 0), null)
  assert.ok(draftError([line], -1))
})

test('same part with different supplier or fitment is rejected instead of merged', () => {
  assert.ok(draftError([line, {...line, id: '2', part: ' front bumper ', vehicle: 'RAV4', supplier: 'Other'}], 0))
  assert.equal(draftError([line, {...line, id: '2', part: 'BONNET'}], 0), null)
})

test('catalog variants stay distinct and bundles require verified fitment', () => {
  const catalogLine = {...line, sku: 'BUMPER-A', vehicle_model: 'AQUA NHP10', make_year: 2013}
  assert.equal(draftError([catalogLine, {...catalogLine, id: '2', sku: 'BUMPER-B', vehicle_model: 'RAV4 XA50', make_year: 2024}], 0), null)
  assert.ok(draftError([catalogLine, {...catalogLine, id: '2'}], 0))
  assert.ok(draftError([{...line, source: {kind: 'bundle'}}], 0))
  assert.ok(draftError([{...catalogLine, vehicle_model: undefined}], 0))
})
