(() => {
  const PAGE_SIZE = 8;
  const form = document.querySelector('[data-filter-form]');
  const grid = document.querySelector('[data-product-grid]');
  const resultLabel = document.querySelector('[data-results]');
  const totalLabel = document.querySelector('[data-total]');
  const emptyState = document.querySelector('[data-empty-state]');
  const errorBox = document.querySelector('[data-catalog-error]');
  const previousButton = document.querySelector('[data-previous]');
  const nextButton = document.querySelector('[data-next]');
  const pageLabel = document.querySelector('[data-page-label]');
  let offset = 0;

  function makeCard(product) {
    const article = document.createElement('article');
    article.className = 'product-card';

    const link = document.createElement('a');
    link.className = 'product-card-link';
    link.href = `/product.html?id=${encodeURIComponent(product.id)}`;
    link.setAttribute('aria-label', `View ${product.name} details`);
    const media = document.createElement('div');
    StoreUI.renderMedia(media, product);
    const description = document.createElement('div');
    description.className = 'product-card-copy';
    const meta = document.createElement('span');
    meta.className = 'product-maker';
    meta.textContent = `${product.manufacturer} / ${product.part_number}`;
    const name = document.createElement('h2');
    name.textContent = product.name;
    const blurb = document.createElement('p');
    blurb.textContent = product.description;
    const price = document.createElement('strong');
    price.className = 'product-price';
    price.textContent = StoreUI.formatMoney(product.price);
    description.append(meta, name, blurb, price);
    link.append(media, description);

    const actions = document.createElement('div');
    actions.className = 'product-card-actions';
    const stock = document.createElement('span');
    stock.className = `stock-label${product.stock < 5 ? ' stock-low' : ''}`;
    stock.textContent = product.stock < 5 ? `Only ${product.stock} left` : 'In stock';
    const add = document.createElement('button');
    add.className = 'button button-small button-dark';
    add.type = 'button';
    add.textContent = 'Add to cart';
    add.disabled = product.stock < 1;
    add.addEventListener('click', () => {
      if (!StoreUI.cart.add(product)) {
        add.textContent = 'Stock limit';
        return;
      }
      StoreUI.updateCartCount();
      add.textContent = 'Added';
      window.setTimeout(() => { add.textContent = 'Add to cart'; }, 1100);
    });
    actions.append(stock, add);
    article.append(link, actions);
    return article;
  }

  async function loadParts() {
    errorBox.hidden = true;
    resultLabel.textContent = 'Loading parts...';
    const values = new FormData(form);
    const params = new URLSearchParams({ offset: String(offset), limit: String(PAGE_SIZE) });
    for (const field of ['q', 'minPrice', 'maxPrice']) {
      const value = String(values.get(field) || '').trim();
      if (value) params.set(field, value);
    }

    try {
      const response = await fetch(`/api/parts?${params}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load parts.');
      grid.replaceChildren(...result.items.map(makeCard));
      totalLabel.textContent = result.total;
      emptyState.hidden = result.total !== 0;
      const first = result.total === 0 ? 0 : offset + 1;
      const last = Math.min(offset + result.items.length, result.total);
      resultLabel.textContent = result.total ? `Showing ${first}–${last} of ${result.total} parts` : 'No matching parts';
      pageLabel.textContent = `PAGE ${Math.floor(offset / PAGE_SIZE) + 1}`;
      previousButton.disabled = offset === 0;
      nextButton.disabled = offset + result.items.length >= result.total;
    } catch (error) {
      grid.replaceChildren();
      resultLabel.textContent = 'Catalog unavailable';
      errorBox.textContent = error.message;
      errorBox.hidden = false;
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    offset = 0;
    loadParts();
  });
  document.querySelector('[data-clear-filters]').addEventListener('click', () => {
    form.reset();
    offset = 0;
    loadParts();
  });
  previousButton.addEventListener('click', () => {
    offset = Math.max(0, offset - PAGE_SIZE);
    loadParts();
  });
  nextButton.addEventListener('click', () => {
    offset += PAGE_SIZE;
    loadParts();
  });
  loadParts();
})();