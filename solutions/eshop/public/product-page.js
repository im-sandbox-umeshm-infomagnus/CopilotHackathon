(() => {
  const detail = document.querySelector('[data-product-detail]');
  const status = document.querySelector('[data-detail-status]');
  const id = new URLSearchParams(window.location.search).get('id');

  async function loadProduct() {
    if (!id || !/^\d+$/.test(id)) {
      status.textContent = 'Part not found.';
      return;
    }

    try {
      const response = await fetch(`/api/parts/${encodeURIComponent(id)}`);
      const product = await response.json();
      if (!response.ok) throw new Error(product.error || 'Part not found.');
      document.title = `${product.name} | Auto Supply`;
      StoreUI.renderMedia(document.querySelector('[data-product-visual]'), product);

      const content = document.querySelector('[data-product-content]');
      const maker = document.createElement('div');
      maker.className = 'detail-maker';
      maker.textContent = `${product.manufacturer}  /  ${product.part_number}`;
      const name = document.createElement('h1');
      name.textContent = product.name;
      const price = document.createElement('div');
      price.className = 'detail-price';
      price.textContent = StoreUI.formatMoney(product.price);
      const description = document.createElement('p');
      description.className = 'detail-description';
      description.textContent = product.description;
      const stock = document.createElement('p');
      stock.className = `detail-stock${product.stock < 5 ? ' stock-low' : ''}`;
      stock.textContent = product.stock > 0 ? `${product.stock} available` : 'Out of stock';
      const add = document.createElement('button');
      add.className = 'button button-green detail-add';
      add.type = 'button';
      add.textContent = 'Add to cart';
      add.disabled = product.stock < 1;
      const feedback = document.createElement('p');
      feedback.className = 'action-feedback';
      feedback.setAttribute('aria-live', 'polite');
      add.addEventListener('click', () => {
        if (!StoreUI.cart.add(product)) {
          feedback.textContent = 'You have reached the available stock limit.';
          return;
        }
        StoreUI.updateCartCount();
        feedback.textContent = 'Added to your cart.';
      });

      const compatTitle = document.createElement('h2');
      compatTitle.className = 'detail-section-title';
      compatTitle.textContent = 'Vehicle compatibility';
      const compatibility = document.createElement('p');
      compatibility.className = 'compatibility-list';
      compatibility.textContent = product.model_compatibility.join('  /  ');
      const specTitle = document.createElement('h2');
      specTitle.className = 'detail-section-title';
      specTitle.textContent = 'Specifications';
      const specs = document.createElement('dl');
      specs.className = 'spec-list';
      for (const [label, value] of Object.entries(product.specifications)) {
        const row = document.createElement('div');
        row.className = 'spec-row';
        const term = document.createElement('dt');
        term.textContent = label;
        const definition = document.createElement('dd');
        definition.textContent = value;
        row.append(term, definition);
        specs.append(row);
      }

      content.replaceChildren(maker, name, price, description, stock, add, feedback, compatTitle, compatibility, specTitle, specs);
      status.hidden = true;
      detail.hidden = false;
    } catch (error) {
      status.textContent = error.message;
    }
  }

  loadProduct();
})();