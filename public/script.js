'use strict';

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
const state = { cart: new Map(), cartCount: 0, toastTimer: null, wishlist: new Map() };

function showToast(message) {
  const toast = $('#toast');
  const toastMsg = $('#toastMsg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
}

function formatCurrency(value) {
  return `â‚¹${value.toLocaleString('en-IN')}`;
}

function parsePrice(priceText) {
  return Number(priceText.replace(/[^\d]/g, '')) || 0;
}

function addCartItem(item) {
  const existing = state.cart.get(item.name);
  if (existing) {
    showToast(`${item.name} is already in your cart`);
    openCart();
    return;
  } else {
    state.cart.set(item.name, { ...item, qty: 1, amount: parsePrice(item.price) });
  }
  updateCartView();
  showToast(`${item.name} added to cart`);
}

function updateCartView() {
  state.cartCount = Array.from(state.cart.values()).reduce((sum, item) => sum + item.qty, 0);
  const cartCount = $('#cartCount');
  if (cartCount) cartCount.textContent = String(state.cartCount);

  const list = $('#cartItems');
  const empty = $('#cartEmpty');
  const summary = $('#cartSummary');
  const subtotal = $('#cartSubtotal');
  const checkout = $('.cart-checkout');
  if (!list || !empty || !summary || !subtotal) return;

  const items = Array.from(state.cart.values());
  empty.classList.toggle('hidden', items.length > 0);
  summary.classList.toggle('hidden', items.length === 0);
  checkout?.classList.toggle('hidden', items.length === 0);
  subtotal.textContent = formatCurrency(items.reduce((sum, item) => sum + item.amount * item.qty, 0));
  list.innerHTML = items.map((item) => `
    <article class="cart-item" data-product="${item.name}">
      <img src="${item.image}" alt="${item.alt}" />
      <div>
        <p>${item.category}</p>
        <h3>${item.name}</h3>
        <strong>${item.price}</strong>
        <span class="cart-qty">Qty: ${item.qty}</span>
      </div>
      <button class="cart-remove" type="button" aria-label="Remove ${item.name} from cart"><i class="fa-solid fa-trash-can"></i></button>
    </article>
  `).join('');
}

function getProductData(card) {
  return {
    name: $('.product-info h3', card)?.textContent?.trim() || 'Item',
    category: $('.product-info p', card)?.textContent?.trim() || 'Jewellery',
    price: $('.price strong', card)?.textContent?.trim() || '',
    image: $('.product-img', card)?.getAttribute('src') || '',
    alt: $('.product-img', card)?.getAttribute('alt') || 'Wishlist item',
  };
}

window.BelleruStore = {
  addCartItemFromCard(card) {
    if (card) addCartItem(getProductData(card));
  },
  toggleWishlistFromCard(card) {
    if (!card) return;
    const item = getProductData(card);
    const isLiked = state.wishlist.has(item.name);
    if (isLiked) {
      state.wishlist.delete(item.name);
    } else {
      state.wishlist.set(item.name, item);
    }
    setProductWishlistState(item.name, !isLiked);
    updateWishlistView();
    showToast(!isLiked ? `${item.name} added to wishlist` : `${item.name} removed from wishlist`);
  }
};

function updateWishlistView() {
  const count = $('#wishlistCount');
  const list = $('#wishlistItems');
  const empty = $('#wishlistEmpty');

  if (count) {
    count.textContent = String(state.wishlist.size);
    count.classList.toggle('visible', state.wishlist.size > 0);
  }

  if (!list || !empty) return;
  empty.classList.toggle('hidden', state.wishlist.size > 0);
  list.innerHTML = Array.from(state.wishlist.values()).map((item) => `
    <article class="wishlist-item" data-product="${item.name}">
      <img src="${item.image}" alt="${item.alt}" />
      <div>
        <p>${item.category}</p>
        <h3>${item.name}</h3>
        <strong>${item.price}</strong>
      </div>
      <div class="wishlist-actions">
        <button class="wishlist-remove" type="button" aria-label="Remove ${item.name} from wishlist"><i class="fa-solid fa-trash-can"></i></button>
        <button class="wishlist-add-cart" type="button" aria-label="Add ${item.name} to cart"><i class="fa-solid fa-cart-plus"></i><span>Add</span></button>
      </div>
    </article>
  `).join('');
}

function setProductWishlistState(productName, isLiked) {
  $$('.product-card').forEach((card) => {
    const name = $('.product-info h3', card)?.textContent?.trim();
    if (name !== productName) return;
    const button = $('.wishlist-btn', card);
    const icon = $('.wishlist-btn i', card);
    button?.classList.toggle('is-liked', isLiked);
    button?.setAttribute('aria-pressed', String(isLiked));
    icon?.classList.toggle('fa-solid', isLiked);
    icon?.classList.toggle('fa-regular', !isLiked);
  });
}

function openWishlist() {
  const drawer = $('#wishlistDrawer');
  if (!drawer) return;
  updateWishlistView();
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeWishlist() {
  const drawer = $('#wishlistDrawer');
  if (!drawer) return;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function openCart() {
  const drawer = $('#cartDrawer');
  if (!drawer) return;
  updateCartView();
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  const drawer = $('#cartDrawer');
  if (!drawer) return;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function closeMobileNav() {
  const hamburger = $('#hamburger');
  const nav = $('#nav');
  const overlay = $('#navOverlay');
  nav?.classList.remove('open');
  overlay?.classList.remove('open');
  hamburger?.classList.remove('open');
  hamburger?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

(function initHeaderState() {
  const header = $('#header');
  if (!header) return;
  const update = () => header.classList.toggle('scrolled', window.scrollY > 24);
  update();
  window.addEventListener('scroll', update, { passive: true });
})();

(function initFeatureBadges() {
  $$('.product-info').forEach((info) => {
    if ($('.feature-badges', info)) return;
    const badges = document.createElement('div');
    badges.className = 'feature-badges';
    badges.innerHTML = '<span>Anti Tarnish</span><span>Skin Friendly</span><span>Lightweight</span><span>Waterproof</span>';
    const price = $('.price', info);
    if (price) price.insertAdjacentElement('afterend', badges);
  });
})();

(function initFaqAccordion() {
  $$('.faq-item').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      $$('.faq-item').forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
})();

(function initMobileNav() {
  const hamburger = $('#hamburger');
  const nav = $('#nav');
  const overlay = $('#navOverlay');
  if (!hamburger || !nav || !overlay) return;
  hamburger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    overlay.classList.toggle('open', isOpen);
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  overlay.addEventListener('click', closeMobileNav);
  $$('#nav a').forEach((link) => link.addEventListener('click', closeMobileNav));
})();

(function initSearch() {
  const toggle = $('#searchToggle');
  const bar = $('#searchBar');
  const close = $('#searchClose');
  const input = $('#searchInput');
  if (!toggle || !bar || !close || !input) return;
  toggle.addEventListener('click', () => {
    bar.classList.toggle('open');
    if (bar.classList.contains('open')) window.setTimeout(() => input.focus(), 80);
  });
  close.addEventListener('click', () => bar.classList.remove('open'));
  bar.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    showToast(query ? `Searching for ${query}` : 'Type a product to search');
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') bar.classList.remove('open');
  });
})();

(function initProductFilters() {
  const tabs = $$('.filter-tab');
  const cards = $$('.product-card');
  if (!tabs.length || !cards.length) return;

  function applyFilter(filter = 'all') {
    tabs.forEach((item) => item.classList.toggle('active', item.dataset.filter === filter));
    cards.forEach((card) => {
      const tags = (card.dataset.tags || '').split(/\s+/);
      const show = filter === 'all' || card.dataset.category === filter || tags.includes(filter);
      card.classList.toggle('hidden', !show);
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter || 'all';
      applyFilter(filter);
    });
  });

  $$('[data-category-link], [data-filter-link]').forEach((link) => {
    link.addEventListener('click', () => {
      const filter = link.dataset.categoryLink || link.dataset.filterLink || 'all';
      window.setTimeout(() => applyFilter(filter), 120);
    });
  });
})();

(function initPageContent() {
  const page = document.body.dataset.page || 'home';
  const main = $('main');
  if (!main || page === 'home') return;

  const pageData = {
    'new-arrival': {
      eyebrow: 'New arrival',
      title: 'Fresh jewellery drops for modern styling.',
      text: 'Explore the latest Belleru pieces selected for everyday shine, gifting and festive plans.',
      image: 'first-image2.jpg',
      productEyebrow: 'Latest drops',
      productTitle: 'New arrival jewellery.'
    },
    'best-seller': {
      eyebrow: 'Best seller',
      title: 'Customer-loved jewellery with proven polish.',
      text: 'Shop Belleru favourites chosen for finish, comfort and easy outfit pairing.',
      image: 'first-image3.jpg',
      productEyebrow: 'Most loved',
      productTitle: 'Best selling pieces.'
    },
    collections: {
      eyebrow: 'Collections',
      title: 'Curated edits for every occasion.',
      text: 'Browse category stories, occasion edits and premium jewellery collections in one place.',
      image: 'first-image4.jpg'
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Personal shopping support, whenever you need it.',
      text: 'Message Belleru for orders, styling help, delivery questions and after-sale support.',
      image: 'first-image1.jpg'
    }
  };

  const data = pageData[page];
  if (!data) return;

  const banner = document.createElement('section');
  banner.className = 'page-banner reveal-now';
  banner.style.setProperty('--page-banner-image', `url("${data.image}")`);
  banner.innerHTML = `
    <div class="page-banner__inner">
      <p class="eyebrow">${data.eyebrow}</p>
      <h1>${data.title}</h1>
      <p>${data.text}</p>
    </div>
  `;
  main.insertBefore(banner, main.firstElementChild);

  if (data.productTitle) {
    const productsHeading = $('.bestsellers .section-heading');
    const eyebrow = $('.bestsellers .section-heading .eyebrow');
    const title = $('.bestsellers .section-heading h2');
    if (productsHeading) productsHeading.classList.remove('split');
    if (eyebrow) eyebrow.textContent = data.productEyebrow;
    if (title) title.textContent = data.productTitle;
  }

  if (page === 'contact') {
    const contact = document.createElement('section');
    contact.className = 'page-contact-section';
    contact.innerHTML = `
      <div class="container contact-page-grid">
        <article class="contact-panel reveal-now">
          <p class="eyebrow">Reach us</p>
          <h2>We are here for your orders and styling questions.</h2>
          <div class="contact-list">
            <p><i class="fa-brands fa-whatsapp"></i><span>WhatsApp: +91 98765 43210</span></p>
            <p><i class="fa-solid fa-envelope"></i><span>Email: hello@belleru.com</span></p>
            <p><i class="fa-solid fa-phone"></i><span>Phone: +91 98765 43210</span></p>
            <p><i class="fa-solid fa-location-dot"></i><span>Jodhpur, Rajasthan, India</span></p>
          </div>
          <a class="btn btn-primary" href="https://wa.me/919876543210">Chat on WhatsApp</a>
          <div class="contact-socials">
            <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
            <a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="#" aria-label="Pinterest"><i class="fa-brands fa-pinterest-p"></i></a>
          </div>
        </article>
        <article class="contact-form-card reveal-now">
          <p class="eyebrow">Send a message</p>
          <h2>Tell us what you are looking for.</h2>
          <form class="contact-form" id="contactForm">
            <input type="text" name="name" placeholder="Your name" required />
            <input type="email" name="email" placeholder="Email address" required />
            <input type="tel" name="phone" placeholder="Phone number" />
            <textarea name="message" rows="6" placeholder="How can we help?" required></textarea>
            <button class="btn btn-primary" type="submit">Send Message</button>
          </form>
        </article>
      </div>
    `;
    main.appendChild(contact);
    $('#contactForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      event.currentTarget.reset();
      showToast('Message ready for Belleru support');
    });
  }

  $$('.primary-nav a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    link.classList.toggle('is-current', href.includes(`${page}.html`) || (page === 'home' && href === 'index.html'));
  });
})();

(function initHeroCarousel() {
  const slider = $('#heroSlider');
  const upload = $('#heroUpload');
  const slides = $$('.hero-slide');
  const dots = $$('#heroDots button');
  if (!slider || !slides.length || !dots.length) return;

  let activeIndex = 0;
  let timer = null;

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === activeIndex));
    dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === activeIndex));
  }

  function startCarousel() {
    window.clearInterval(timer);
    timer = window.setInterval(() => showSlide(activeIndex + 1), 3600);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      startCarousel();
    });
  });

  slider.addEventListener('click', () => upload?.click());
  slider.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      upload?.click();
    }
  });

  upload?.addEventListener('change', () => {
    const files = Array.from(upload.files || []).slice(0, 4);
    files.forEach((file, index) => {
      if (!slides[index]) return;
      slides[index].src = URL.createObjectURL(file);
      slides[index].alt = `Uploaded hero photo ${index + 1}`;
    });
    showSlide(0);
    startCarousel();
    if (files.length) showToast(`${files.length} hero photo${files.length > 1 ? 's' : ''} loaded`);
  });

  showSlide(0);
  startCarousel();
})();

(function initProductActions() {
  $$('.add-cart').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      addCartItem(getProductData(card));
    });
  });

  $$('.quick-add').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      addCartItem(getProductData(card));
    });
  });
  $$('.wishlist-btn').forEach((button) => {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      const item = getProductData(card);
      const isLiked = state.wishlist.has(item.name);

      if (isLiked) {
        state.wishlist.delete(item.name);
      } else {
        state.wishlist.set(item.name, item);
      }

      const nextLiked = !isLiked;
      setProductWishlistState(item.name, nextLiked);
      updateWishlistView();

      showToast(nextLiked ? `${item.name} added to wishlist` : `${item.name} removed from wishlist`);
    });
  });
})();

(function initCartDrawer() {
  const toggle = $('#cartToggle');
  const close = $('#cartClose');
  const drawer = $('#cartDrawer');
  const list = $('#cartItems');
  const shop = $('.cart-shop');
  if (!toggle || !close || !drawer || !list) return;

  toggle.addEventListener('click', openCart);
  close.addEventListener('click', closeCart);
  drawer.addEventListener('click', (event) => {
    if (event.target === drawer) closeCart();
  });
  shop?.addEventListener('click', closeCart);
  list.addEventListener('click', (event) => {
    const removeButton = event.target.closest('.cart-remove');
    if (!removeButton) return;
    const item = removeButton.closest('.cart-item');
    const productName = item?.dataset.product;
    if (!productName) return;
    state.cart.delete(productName);
    updateCartView();
    showToast(`${productName} removed from cart`);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCart();
  });
  updateCartView();
})();

(function initWishlistDrawer() {
  const toggle = $('#wishlistToggle');
  const close = $('#wishlistClose');
  const drawer = $('#wishlistDrawer');
  const list = $('#wishlistItems');
  const shop = $('.wishlist-shop');
  if (!toggle || !close || !drawer || !list) return;

  toggle.addEventListener('click', openWishlist);
  close.addEventListener('click', closeWishlist);
  drawer.addEventListener('click', (event) => {
    if (event.target === drawer) closeWishlist();
  });
  shop?.addEventListener('click', closeWishlist);
  list.addEventListener('click', (event) => {
    const addButton = event.target.closest('.wishlist-add-cart');
    if (addButton) {
      const item = addButton.closest('.wishlist-item');
      const productName = item?.dataset.product;
      const product = productName ? state.wishlist.get(productName) : null;
      if (!product) return;
      addCartItem(product);
      state.wishlist.delete(productName);
      setProductWishlistState(productName, false);
      updateWishlistView();
      return;
    }

    const removeButton = event.target.closest('.wishlist-remove');
    if (!removeButton) return;
    const item = removeButton.closest('.wishlist-item');
    const productName = item?.dataset.product;
    if (!productName) return;
    state.wishlist.delete(productName);
    setProductWishlistState(productName, false);
    updateWishlistView();
    showToast(`${productName} removed from wishlist`);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeWishlist();
  });
  updateWishlistView();
})();

(function initQuickView() {
  const overlay = $('#modalOverlay');
  const close = $('#modalClose');
  const modalImage = $('#modalImage');
  const modalName = $('#modalName');
  const modalPrice = $('#modalPrice');
  const modalCart = $('#modalCart');
  let activeProduct = 'Item';
  if (!overlay || !close || !modalImage || !modalName || !modalPrice || !modalCart) return;

  function openModal(card) {
    const img = $('.product-img', card);
    const name = $('.product-info h3', card)?.textContent?.trim() || 'Product';
    const price = $('.price', card)?.innerHTML || '';
    activeProduct = name;
    modalImage.src = img?.src || '';
    modalImage.alt = img?.alt || name;
    modalName.textContent = name;
    modalPrice.innerHTML = price;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    close.focus();
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  $$('.quick-view').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      if (card) openModal(card);
    });
  });
  close.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });
  modalCart.addEventListener('click', () => {
    const item = state.cart.get(activeProduct) || {
      name: activeProduct,
      category: 'Jewellery',
      price: $('#modalPrice strong')?.textContent?.trim() || '',
      image: $('#modalImage')?.getAttribute('src') || '',
      alt: $('#modalImage')?.getAttribute('alt') || activeProduct,
    };
    addCartItem(item);
    closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });
})();

(function initReveal() {
  const reveals = $$('.reveal');
  if (!reveals.length) return;
  if (!('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach((el) => observer.observe(el));
})();

(function initNewsletter() {
  const form = $('#newsletterForm');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.reset();
    showToast('You are on the early access list');
  });
})();

(function initBackToTop() {
  const button = $('#backToTop');
  if (!button) return;
  const update = () => button.classList.toggle('visible', window.scrollY > 500);
  window.addEventListener('scroll', update, { passive: true });
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  update();
})();

(function initActiveNav() {
  const links = $$('.primary-nav a[href^="#"]');
  const sections = links.map((link) => $(link.getAttribute('href'))).filter(Boolean);
  if (!sections.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { threshold: 0.35 });
  sections.forEach((section) => observer.observe(section));
})();

$$('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = $(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    const headerOffset = $('#header')?.offsetHeight || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

