(() => {
  const linesNode = document.querySelector('[data-cart-lines]');

  function render() {
    const items = StoreUI.cart.getItems();
    document.querySelector('[data-cart-total]').textContent = StoreUI.formatMoney(StoreUI.cart.total());
    document.querySelector('[data-cart-count-label]').textContent = `${StoreUI.cart.count()} ${StoreUI.cart.count() === 1 ? 'item' : 'items'} in your cart`;
    StoreUI.updateCartCount();

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'cart-empty';
      const title = document.createElement('h2');
      title.textContent = 'Your cart is clear.';
      const text = document.createElement('p');
      text.textContent = 'The right part is out there. Start with the catalog.';
      const link = document.createElement('a');
      link.className = 'button button-dark';
      link.href = '/';
      link.textContent = 'Browse parts';
      empty.append(title, text, link);
      linesNode.replaceChildren(empty);
      return;
    }

    const rows = items.map(({ product, quantity }) => {
      const row = document.createElement('article');
      row.className = 'cart-line';
      const media = document.createElement('a');
      media.href = `/product.html?id=${encodeURIComponent(product.id)}`;
      StoreUI.renderMedia(media, product);
      const copy = document.createElement('div');
      copy.className = 'cart-line-copy';
      const maker = document.createElement('span');
      maker.className = 'product-maker';
      maker.textContent = `${product.manufacturer} / ${product.part_number}`;
      const name = document.createElement('a');
      name.className = 'cart-product-name';
      name.href = `/product.html?id=${encodeURIComponent(product.id)}`;
      name.textContent = product.name;
      const unitPrice = document.createElement('span');
      unitPrice.className = 'cart-unit-price';
      unitPrice.textContent = `${StoreUI.formatMoney(product.price)} each`;
      copy.append(maker, name, unitPrice);

      const quantityControl = document.createElement('label');
      quantityControl.className = 'quantity-control';
      quantityControl.append(document.createTextNode('Qty'));
      const quantityInput = document.createElement('input');
      quantityInput.type = 'number';
      quantityInput.min = '0';
      quantityInput.max = String(product.stock);
      quantityInput.step = '1';
      quantityInput.value = String(quantity);
      quantityInput.setAttribute('aria-label', `Quantity of ${product.name}`);
      quantityInput.addEventListener('change', () => {
        StoreUI.cart.setQuantity(product.id, quantityInput.value);
        render();
      });
      quantityControl.append(quantityInput);

      const lineEnd = document.createElement('div');
      lineEnd.className = 'cart-line-end';
      const subtotal = document.createElement('strong');
      subtotal.textContent = StoreUI.formatMoney(product.price * quantity);
      const remove = document.createElement('button');
      remove.className = 'remove-button';
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        StoreUI.cart.remove(product.id);
        render();
      });
      lineEnd.append(subtotal, remove);
      row.append(media, copy, quantityControl, lineEnd);
      return row;
    });
    linesNode.replaceChildren(...rows);
  }

  render();
})();