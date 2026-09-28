const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const express = require('express');

const DEFAULT_CATALOG_FILE = path.resolve(__dirname, '../../challenges/eshop/automobileParts.json');
const MAX_PAGE_SIZE = 100;

function parseInteger(value, fallback, minimum) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum ? parsed : null;
}

function parsePrice(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return null;
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function createEshopServer({ catalogFile = DEFAULT_CATALOG_FILE } = {}) {
  const app = express();
  const httpServer = http.createServer(app);
  const parts = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));

  if (!Array.isArray(parts)) {
    throw new TypeError('The automobile parts catalog must be a JSON array.');
  }

  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/parts', (request, response) => {
    const requestedOffset = parseInteger(request.query.offset, 0, 0);
    const requestedLimit = parseInteger(request.query.limit, 12, 1);
    const minPrice = parsePrice(request.query.minPrice);
    const maxPrice = parsePrice(request.query.maxPrice);

    if (requestedOffset === null || requestedLimit === null || minPrice === null || maxPrice === null
      || (request.query.q !== undefined && typeof request.query.q !== 'string')) {
      response.status(400).json({ error: 'Invalid pagination or price filter.' });
      return;
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      response.status(400).json({ error: 'minPrice must not exceed maxPrice.' });
      return;
    }

    const offset = requestedOffset;
    const limit = Math.min(requestedLimit, MAX_PAGE_SIZE);
    const query = typeof request.query.q === 'string' ? request.query.q.trim().toLocaleLowerCase() : '';
    const filteredParts = parts.filter((part) => {
      const matchesQuery = !query || [
        part.name,
        part.description,
        part.manufacturer,
        part.part_number,
        String(part.price),
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query));
      return matchesQuery
        && (minPrice === undefined || part.price >= minPrice)
        && (maxPrice === undefined || part.price <= maxPrice);
    });

    response.json({
      items: filteredParts.slice(offset, offset + limit),
      offset,
      limit,
      total: filteredParts.length,
    });
  });

  app.get('/api/parts/:id', (request, response) => {
    const id = parseInteger(request.params.id, null, 1);
    const part = id === null ? undefined : parts.find((candidate) => candidate.id === id);
    if (!part) {
      response.status(404).json({ error: 'Part not found.' });
      return;
    }
    response.json(part);
  });

  return { app, httpServer };
}

if (require.main === module) {
  const { httpServer } = createEshopServer();
  const port = Number(process.env.PORT || 3000);
  httpServer.listen(port, () => {
    console.log(`E-shop is ready at http://localhost:${port}`);
  });
}

module.exports = { createEshopServer };
