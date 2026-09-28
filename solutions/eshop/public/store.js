(() => {
  const cart = ShopCart.createCart();
  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  function renderMedia(container, product) {
    container.classList.add('product-media');
    const image = document.createElement('img');
    image.src = product.image_url;
    image.alt = product.name;
    image.loading = 'lazy';
    image.addEventListener('error', () => {
      const fallback = document.createElement('div');
      fallback.className = 'media-fallback';
      fallback.style.setProperty('--part-tone', `${(product.id * 37) % 360}`);
      const code = document.createElement('strong');
      code.textContent = product.part_number;
      const maker = document.createElement('span');
      maker.textContent = product.manufacturer;
      fallback.append(code, maker);
      container.replaceChildren(fallback);
    }, { once: true });
    container.replaceChildren(image);
  }

  function updateCartCount() {
    document.querySelectorAll('[data-cart-count]').forEach((node) => {
      node.textContent = cart.count();
    });
  }

  updateCartCount();
  window.StoreUI = Object.freeze({
    cart,
    formatMoney: (amount) => currency.format(amount),
    renderMedia,
    updateCartCount,
  });
})();