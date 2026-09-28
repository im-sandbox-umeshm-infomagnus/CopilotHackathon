(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ShopCart = api;
})(globalThis, function () {
  const STORAGE_KEY = 'autosupply-cart';

  function createCart(storage = globalThis.localStorage) {
    function readItems() {
      try {
        const saved = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
        if (!Array.isArray(saved)) return [];
        return saved.filter((line) => line
          && Number.isSafeInteger(line.product?.id)
          && Number.isSafeInteger(line.product?.stock)
          && line.product.stock > 0
          && Number.isFinite(line.product?.price)
          && line.product.price >= 0
          && Number.isInteger(line.quantity)
          && line.quantity > 0)
          .map((line) => ({ ...line, quantity: Math.min(line.quantity, line.product.stock) }));
      } catch {
        return [];
      }
    }

    function writeItems(items) {
      storage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    return {
      getItems: readItems,
      add(product) {
        if (!product || !Number.isSafeInteger(product.id) || !Number.isSafeInteger(product.stock)
          || product.stock < 1 || !Number.isFinite(product.price) || product.price < 0) return false;
        const items = readItems();
        const existing = items.find((line) => line.product.id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock) return false;
          existing.quantity += 1;
          existing.product = product;
        } else {
          items.push({ product, quantity: 1 });
        }
        writeItems(items);
        return true;
      },
      setQuantity(id, quantity) {
        const items = readItems();
        const line = items.find((item) => item.product.id === Number(id));
        if (!line || !Number.isFinite(Number(quantity))) return false;
        const nextQuantity = Math.trunc(Number(quantity));
        if (nextQuantity <= 0) {
          writeItems(items.filter((item) => item.product.id !== Number(id)));
          return true;
        }
        line.quantity = Math.min(nextQuantity, line.product.stock);
        writeItems(items);
        return true;
      },
      remove(id) {
        const items = readItems();
        const remaining = items.filter((item) => item.product.id !== Number(id));
        if (remaining.length === items.length) return false;
        writeItems(remaining);
        return true;
      },
      count() {
        return readItems().reduce((total, line) => total + line.quantity, 0);
      },
      total() {
        const cents = readItems().reduce((sum, line) => (
          sum + Math.round(line.product.price * 100) * line.quantity
        ), 0);
        return cents / 100;
      },
    };
  }

  return { createCart };
});