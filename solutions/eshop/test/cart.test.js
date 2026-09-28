const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createCart } = require('../public/cart');

function createStorage() {
  let value = null;
  return {
    getItem() {
      return value;
    },
    setItem(_key, nextValue) {
      value = nextValue;
    },
  };
}

const brakePads = { id: 1, name: 'Brake Pad Set', price: 45.99, stock: 2 };
const oilFilter = { id: 2, name: 'Oil Filter', price: 10.99, stock: 5 };

test('adds lines, increments quantities, and totals price in cents', () => {
  const cart = createCart(createStorage());

  assert.equal(cart.add(brakePads), true);
  assert.equal(cart.add(brakePads), true);
  assert.equal(cart.add(oilFilter), true);
  assert.equal(cart.count(), 3);
  assert.equal(cart.total(), 102.97);
  assert.deepEqual(cart.getItems().map(({ product, quantity }) => [product.id, quantity]), [[1, 2], [2, 1]]);
});

test('refuses additions above stock and clamps quantity updates to available stock', () => {
  const cart = createCart(createStorage());

  cart.add(brakePads);
  cart.add(brakePads);
  assert.equal(cart.add(brakePads), false);
  assert.equal(cart.setQuantity(brakePads.id, 20), true);
  assert.equal(cart.getItems()[0].quantity, 2);
});

test('decrements quantity, removes empty lines, and persists across cart instances', () => {
  const storage = createStorage();
  const cart = createCart(storage);

  cart.add(oilFilter);
  cart.add(oilFilter);
  cart.setQuantity(oilFilter.id, 1);
  const restoredCart = createCart(storage);
  assert.equal(restoredCart.count(), 1);
  assert.equal(restoredCart.remove(oilFilter.id), true);
  assert.deepEqual(restoredCart.getItems(), []);
  assert.equal(restoredCart.total(), 0);
});
