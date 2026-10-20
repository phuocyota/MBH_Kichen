import test from 'node:test'
import assert from 'node:assert/strict'
import { parseRecipeIngredients } from '../src/page/portal/parseRecipeIngredients.js'

const units = [
  { id: 'piece', code: 'piece', name: 'Cái', dimension: 'COUNT' },
  { id: 'g', code: 'g', name: 'Gram', dimension: 'MASS' },
  { id: 'kg', code: 'kg', name: 'Kilogram', dimension: 'MASS' },
  { id: 'ml', code: 'ml', name: 'Mililit', dimension: 'VOLUME' },
]
const products = [
  { id: 'bread', code: 'NL01', name: 'Bánh mì không', baseUnitId: 'piece', productType: 'INGREDIENT' },
  { id: 'meat', name: 'Chả', baseUnitId: 'kg', productType: 'INGREDIENT' },
  { id: 'veg', name: 'Rau', baseUnitId: 'kg', productType: 'INGREDIENT' },
  { id: 'bean', name: 'Đậu', baseUnitId: 'kg', productType: 'INGREDIENT' },
  { id: 'dish', name: 'Bánh mì', baseUnitId: 'piece', productType: 'FINISHED_GOOD' },
]
const parse = (text, ps = products, us = units) => parseRecipeIngredients(text, ps, us)

test('resolves three ingredients with catalog IDs and preserves grams despite kg base units', () => {
  const lines = parse('1 bánh mì không, 60g chả, 20g rau')
  assert.deepEqual(lines.map((line) => line.item), [
    { ingredientProductId: 'bread', quantity: 1, unitId: 'piece' },
    { ingredientProductId: 'meat', quantity: 60, unitId: 'g' },
    { ingredientProductId: 'veg', quantity: 20, unitId: 'g' },
  ])
})

test('handles accents, uppercase D, aliases, codes and decimal commas without delimiter spaces', () => {
  assert.deepEqual(parse('1 NL01,60gram CHA;0,5kg RAU\n20g ĐẬU').map((line) => line.item), [
    { ingredientProductId: 'bread', quantity: 1, unitId: 'piece' },
    { ingredientProductId: 'meat', quantity: 60, unitId: 'g' },
    { ingredientProductId: 'veg', quantity: 0.5, unitId: 'kg' },
    { ingredientProductId: 'bean', quantity: 20, unitId: 'g' },
  ])
  assert.equal(parse('1 cái bánh mì không')[0].item.unitId, 'piece')
})

test('never selects finished goods, missing ingredients or ambiguous names', () => {
  assert.match(parse('1 hamburger')[0].error, /Không tìm thấy/)
  assert.equal(parse('1 Bánh mì', products.filter((p) => p.id !== 'bread'))[0].item, undefined)
  const ambiguous = products.filter((p) => p.id !== 'meat').concat([
    { ...products[1], id: 'pork', name: 'Chả lụa' },
    { ...products[1], id: 'fish', name: 'Chả cá' },
  ])
  assert.match(parse('60g chả', ambiguous)[0].error, /Tên chưa rõ/)
  assert.equal(parse('60g chả cá', ambiguous)[0].item.ingredientProductId, 'fish')
})

test('rejects wrong dimensions, missing base units and duplicate ingredients', () => {
  assert.match(parse('20ml rau')[0].error, /không tương thích/)
  assert.match(parse('1 bánh mì không', [{ ...products[0], baseUnitId: null }])[0].error, /đơn vị tồn chuẩn/)
  assert.match(parse('20g rau, 30g rau')[1].error, /bị lặp/)
})

test('rejects invalid quantities and incomplete lines', () => {
  for (const text of ['0g rau', '-1g rau', 'rau', '0.00001g rau', '1']) {
    assert.ok(parse(text)[0].error, text)
  }
  assert.deepEqual(parse(''), [])
})

test('exact unit codes win over aliases; inactive units and products cannot be selected', () => {
  const alternative = { id: 'gr', code: 'gr', name: 'Gram khác', dimension: 'MASS' }
  assert.equal(parse('20g rau', products, [...units, alternative])[0].item.unitId, 'g')
  assert.match(parse('20g rau', products.map((p) => ({ ...p, isActive: false })))[0].error, /Không tìm thấy/)
  assert.ok(parse('20g rau', products, units.map((u) => ({ ...u, isActive: false })))[0].error)
})
