# Auto Supply

A small automobile-parts shop built with Node.js, Express, and browser JavaScript. The catalog is read from `../../challenges/eshop/automobileParts.json`; the cart is stored in the browser.

## Requirements

- Node.js 18 or newer
- npm

## Run

From this directory:

```sh
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Set `PORT` to use another port.

## API

- `GET /api/parts?offset=0&limit=8&q=&minPrice=&maxPrice=` lists and filters parts.
- `GET /api/parts/:id` returns one part.

Search is case-insensitive across name, description, manufacturer, part number, and price. Price bounds are inclusive. List responses contain `items`, `offset`, `limit`, and `total`.

## Test

```sh
npm test
```