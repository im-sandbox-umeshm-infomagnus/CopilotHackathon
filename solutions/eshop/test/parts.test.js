const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { createEshopServer } = require('../server');

let httpServer;
let baseUrl;

before(async () => {
  const shop = createEshopServer();
  httpServer = shop.httpServer;
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
});

after(async () => {
  if (httpServer?.listening) {
    await new Promise((resolve, reject) => {
      httpServer.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('lists parts with offset and limit and reports the full result count', async () => {
  const response = await fetch(`${baseUrl}/api/parts?offset=1&limit=2`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    items: [
      { id: 2, name: 'Oil Filter', description: 'Durable oil filter.', image_url: 'https://example.com/images/oil_filter.png', price: 10.99, manufacturer: 'Bosch', model_compatibility: ['Model D', 'Model E', 'Model F'], part_number: 'OF456', stock: 50, specifications: { weight: '0.3kg', dimensions: '7x7x9cm', material: 'Synthetic' } },
      { id: 3, name: 'Spark Plug', description: 'High performance spark plug.', image_url: 'https://example.com/images/spark_plug.png', price: 5.99, manufacturer: 'NGK', model_compatibility: ['Model G', 'Model H', 'Model I'], part_number: 'SP789', stock: 100, specifications: { weight: '0.1kg', dimensions: '2x2x8cm', material: 'Ceramic' } },
    ],
    offset: 1,
    limit: 2,
    total: 20,
  });
});

test('searches manufacturer and applies inclusive price bounds before pagination', async () => {
  const response = await fetch(`${baseUrl}/api/parts?q=bosch&maxPrice=20`);
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.total, 2);
  assert.deepEqual(result.items.map((part) => part.name), ['Oil Filter', 'Fuel Filter']);
});

test('searches descriptions and part numbers without case sensitivity', async () => {
  const descriptionResponse = await fetch(`${baseUrl}/api/parts?q=HIGH%20PERFORMANCE`);
  const descriptionResult = await descriptionResponse.json();
  const partNumberResponse = await fetch(`${baseUrl}/api/parts?q=sp789`);
  const partNumberResult = await partNumberResponse.json();

  assert.deepEqual(descriptionResult.items.map((part) => part.name), [
    'Spark Plug',
    'Timing Belt',
    'Engine Oil',
    'Power Steering Pump',
    'Brake Master Cylinder',
  ]);
  assert.deepEqual(partNumberResult.items.map((part) => part.name), ['Spark Plug']);
});

test('searches by the displayed price', async () => {
  const response = await fetch(`${baseUrl}/api/parts?q=45.99`);
  const result = await response.json();

  assert.equal(result.total, 2);
  assert.deepEqual(result.items.map((part) => part.name), ['Brake Pad Set', 'Brake Rotor']);
});

test('returns a part by ID and reports unknown IDs as not found', async () => {
  const foundResponse = await fetch(`${baseUrl}/api/parts/5`);
  const found = await foundResponse.json();
  const missingResponse = await fetch(`${baseUrl}/api/parts/999`);

  assert.equal(foundResponse.status, 200);
  assert.equal(found.name, 'Alternator');
  assert.equal(missingResponse.status, 404);
});

test('rejects invalid pagination and contradictory price bounds', async () => {
  for (const query of [
    'offset=-1',
    'limit=0',
    'minPrice=40&maxPrice=20',
    'offset=1&offset=2',
    'minPrice=10&minPrice=20',
    'q=brake&q=filter',
  ]) {
    const response = await fetch(`${baseUrl}/api/parts?${query}`);
    assert.equal(response.status, 400, query);
  }
});
