'use strict';

const firebaseSetup = getFirebaseSetup();
const cfg = firebaseSetup.config;
const configured = firebaseSetup.configured;
const defaultCategories = ['Necklaces', 'Earrings', 'Rings', 'Bracelets', 'Anklets', 'Mangalsutra', 'Nose Pins', 'Hair Accessories'];
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
const money = (value) => `\u20B9${Number(value || 0).toLocaleString('en-IN')}`;
const slug = (value) => String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

let db;
let auth;
let storage;
let productImageUrls = [];
let categoryImageUrl = '';
let bannerImageUrl = '';
let products = [];
let categories = [];
let orders = [];
let customers = [];
let pendingDelete = null;
let subscriptions = [];
let hasAttemptedProductImport = false;
let hasAttemptedBannerImport = false;

const websiteProductSeed = [
  { name: 'Layered Luna Necklace', category: 'Necklaces', image: 'https://images.pexels.com/photos/5475373/pexels-photo-5475373.jpeg?auto=compress&cs=tinysrgb&w=700', badge: 'New Arrival', rating: 4.7, originalPrice: 1499, discountedPrice: 899, tags: ['New Arrival', 'Best Seller'] },
  { name: 'Pearl Drop Hoops', category: 'Earrings', image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=700&q=80', badge: 'Trending', rating: 4.9, originalPrice: 999, discountedPrice: 649, tags: ['New Arrival'] },
  { name: 'Mira Stack Ring Set', category: 'Rings', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=80', badge: 'Best Seller', rating: 4.4, originalPrice: 799, discountedPrice: 499, tags: ['Best Seller'] },
  { name: 'Charm Bracelet', category: 'Bracelets', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=80', badge: 'Gift pick', rating: 4.6, originalPrice: 1199, discountedPrice: 749, tags: ['Best Seller'] },
  { name: 'Riva Jhumka Set', category: 'Earrings', image: 'https://images.pexels.com/photos/5673960/pexels-photo-5673960.jpeg?auto=compress&cs=tinysrgb&w=700', badge: 'Festive', rating: 4.8, originalPrice: 1899, discountedPrice: 1199, tags: ['Best Seller'] },
  { name: 'Aira Pendant Chain', category: 'Necklaces', image: 'https://images.pexels.com/photos/35759124/pexels-photo-35759124.jpeg?auto=compress&cs=tinysrgb&w=700', badge: 'Minimal', rating: 4.3, originalPrice: 999, discountedPrice: 599, tags: ['New Arrival'] },
  { name: 'Noor Layered Anklet', category: 'Anklets', image: 'https://images.pexels.com/photos/1191536/pexels-photo-1191536.jpeg?auto=compress&cs=tinysrgb&w=700', badge: 'New Arrival', rating: 4.5, originalPrice: 799, discountedPrice: 449, tags: ['New Arrival'] },
  { name: 'Siya Daily Mangalsutra', category: 'Mangalsutra', image: 'https://images.pexels.com/photos/5116272/pexels-photo-5116272.jpeg?auto=compress&cs=tinysrgb&w=700', badge: 'Best Seller', rating: 4.9, originalPrice: 1299, discountedPrice: 799, tags: ['Best Seller'] },
  { name: 'Tiny Bloom Nose Pin', category: 'Nose Pins', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=80', badge: 'New Arrival', rating: 4.2, originalPrice: 499, discountedPrice: 299, tags: ['New Arrival'] }
];

const websiteBannerSeed = [
  { title: 'Hero Banner 1', image: 'first-image1.jpg', sortOrder: 1 },
  { title: 'Hero Banner 2', image: 'first-image2.jpg', sortOrder: 2 },
  { title: 'Hero Banner 3', image: 'first-image3.jpg', sortOrder: 3 },
  { title: 'Hero Banner 4', image: 'first-image4.jpg', sortOrder: 4 }
];

function getFirebaseSetup() {
  const globalConfig = window.BelleruFirebase?.config || window.BELLERU_FIREBASE_CONFIG || (typeof firebaseConfig !== 'undefined' ? firebaseConfig : {});
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const isReady = required.every((key) => {
    const value = String(globalConfig?.[key] || '').trim();
    return value && !value.includes('PASTE_') && !value.includes('YOUR_') && value !== '...';
  });
  return { config: globalConfig || {}, configured: isReady };
}

function toast(message) {
  const el = $('#adminToast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}

function updateProductSyncStatus(message, tone = '') {
  const el = $('#productSyncStatus');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('sync-ready', 'sync-warn', 'sync-error');
  if (tone) el.classList.add(tone);
}

function setButtonLoading(button, isLoading, text = 'Publish Product') {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = text;
}

function setProductFormMode(isEdit) {
  const title = $('#productForm h2');
  const publishBtn = $('#publishProductBtn');
  if (title) title.textContent = isEdit ? 'Edit Product' : 'Add / Edit Product';
  if (publishBtn && !publishBtn.disabled) publishBtn.textContent = isEdit ? 'Update Product' : 'Publish Product';
}

function withTimeout(promise, ms, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function imageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to process image.'));
    img.src = dataUrl;
  });
}

async function optimizeImageFile(file) {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= 700 * 1024) return file;

  const dataUrl = await readFileAsDataUrl(file);
  const img = await imageFromDataUrl(dataUrl);
  const maxDimension = 1800;
  const ratio = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const targetWidth = Math.max(1, Math.round(img.width * ratio));
  const targetHeight = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
  if (!blob) return file;
  if (blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

function friendlyFirebaseError(error) {
  const code = error?.code || '';
  if (code.includes('permission-denied')) return 'Firebase permission denied. Check Firestore/Storage security rules for this admin user.';
  if (code.includes('unauthenticated')) return 'Please log in again before publishing.';
  if (code.includes('storage/unauthorized')) return 'Storage upload denied. Check Firebase Storage rules.';
  if (code.includes('storage/retry-limit-exceeded')) return 'Firebase Storage retry limit exceeded. Check internet connection and Storage rules.';
  if (code.includes('storage/canceled')) return 'Image upload was cancelled.';
  if (code.includes('storage/unknown')) return 'Firebase Storage could not complete the upload. Make sure Storage is enabled in Firebase Console.';
  if (code.includes('auth/')) return error.message;
  return error?.message || 'Something went wrong. Please try again.';
}

function assertConfigured() {
  if (configured && window.firebase) return true;
  toast('Firebase is not configured yet');
  return false;
}

function initFirebase() {
  const status = $('#firebaseStatus');
  const loginButton = $('#loginForm button[type="submit"]');

  if (!configured) {
    if (status) status.innerHTML = 'Add your Firebase web app values in <strong>firebase-config.js</strong> to enable login, database and image uploads.';
    if (loginButton) loginButton.disabled = true;
    return false;
  }

  if (!window.firebase) {
    if (status) status.textContent = 'Firebase SDK failed to load. Check your internet connection or script tags.';
    if (loginButton) loginButton.disabled = true;
    return false;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    if (!auth || !db || !storage) throw new Error('Firebase services did not initialize correctly.');
    if (status) status.textContent = 'Firebase connected. Sign in with your admin account.';
    if (loginButton) loginButton.disabled = false;
    return true;
  } catch (error) {
    if (status) status.textContent = `Firebase setup error: ${error.message}`;
    if (loginButton) loginButton.disabled = true;
    return false;
  }
}

function setPanel(panel) {
  $$('.panel').forEach((item) => item.classList.toggle('active', item.id === `${panel}Panel`));
  $$('.admin-nav button[data-panel]').forEach((button) => button.classList.toggle('active', button.dataset.panel === panel));
  $('#panelTitle').textContent = panel.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function uploadSingleFile(file, folder, index, total) {
  const preparedFile = await optimizeImageFile(file);
  if (preparedFile.size > 10 * 1024 * 1024) {
    return Promise.reject(new Error(`${preparedFile.name} is larger than 10MB. Please upload a smaller image.`));
  }

  const safeName = `${Date.now()}-${preparedFile.name.replace(/[^a-zA-Z0-9. -]/g, '')}`;
  const ref = storage.ref(`${folder}/${safeName}`);
  const uploadTask = ref.put(preparedFile, { contentType: preparedFile.type || 'image/jpeg' });

  return withTimeout(new Promise((resolve, reject) => {
    uploadTask.on('state_changed', (snapshot) => {
      const totalBytes = snapshot.totalBytes || 0;
      const percent = totalBytes ? Math.round((snapshot.bytesTransferred / totalBytes) * 100) : 0;
      const button = $('#publishProductBtn');
      if (button) button.textContent = `Uploading ${index + 1}/${total} (${percent}%)`;
    }, reject, async () => {
      try {
        resolve(await ref.getDownloadURL());
      } catch (error) {
        reject(error);
      }
    });
  }), 120000, 'Image upload timed out after 2 minutes. Enable Firebase Storage, check Storage rules, or try a smaller image.');
}

function uploadFiles(files, folder) {
  const fileList = Array.from(files || []);
  return Promise.all(fileList.map(async (file, index) => {
    try {
      return await uploadSingleFile(file, folder, index, fileList.length);
    } catch (error) {
      toast(`Image upload failed: ${friendlyFirebaseError(error)}`);
      throw error;
    }
  }));
}

function previewFiles(input, target) {
  const box = $(target);
  if (!box) return;
  box.innerHTML = Array.from(input.files || []).map((file) => `<img src="${URL.createObjectURL(file)}" alt="${file.name}" />`).join('');
}

function bindDrop(dropSelector, inputSelector, previewSelector) {
  const drop = $(dropSelector);
  const input = $(inputSelector);
  if (!drop || !input) return;
  ['dragenter', 'dragover'].forEach((eventName) => drop.addEventListener(eventName, (event) => {
    event.preventDefault();
    drop.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach((eventName) => drop.addEventListener(eventName, (event) => {
    event.preventDefault();
    drop.classList.remove('dragover');
  }));
  drop.addEventListener('drop', (event) => {
    input.files = event.dataTransfer.files;
    previewFiles(input, previewSelector);
  });
  input.addEventListener('change', () => previewFiles(input, previewSelector));
}

function renderCategoryOptions() {
  const currentProductCategory = $('#productCategory')?.value || '';
  const currentFilter = $('#productFilter')?.value || '';
  const categoryNames = Array.from(new Set([
    ...categories.map((cat) => cat.name).filter(Boolean),
    ...defaultCategories
  ]));
  const options = categoryNames.map((name) => `<option value="${name}">${name}</option>`).join('');
  $('#productCategory').innerHTML = `<option value="" disabled selected>Select category</option>${options}`;
  $('#productFilter').innerHTML = '<option value="">All categories</option>' + options;
  if (categoryNames.includes(currentProductCategory)) $('#productCategory').value = currentProductCategory;
  if (categoryNames.includes(currentFilter) || currentFilter === '') $('#productFilter').value = currentFilter;
}

function renderProducts() {
  const filter = $('#productFilter')?.value || '';
  const query = ($('#globalSearch')?.value || '').toLowerCase();
  const rows = products
    .filter((product) => !filter || product.category === filter)
    .filter((product) => !query || `${product.name} ${product.category} ${(product.tags || []).join(' ')}`.toLowerCase().includes(query))
    .map((product) => `
      <tr>
        <td><div class="product-cell"><img src="${product.images?.[0] || 'first-image1.jpg'}" alt="" /><strong>${product.name}</strong></div></td>
        <td>${product.category || '-'}</td>
        <td>${money(product.discountedPrice)} <span class="muted">${money(product.originalPrice)}</span></td>
        <td>${(product.tags || []).join(', ')}</td>
        <td>${product.stock || 0}</td>
        <td><div class="row-actions"><button class="icon-action" data-edit-product="${product.id}"><i class="fa-solid fa-pen"></i></button><button class="icon-action" data-delete="products:${product.id}"><i class="fa-solid fa-trash"></i></button></div></td>
      </tr>
    `).join('');
  $('#productsTable').innerHTML = rows || '<tr><td colspan="6">No products found.</td></tr>';
  renderDashboardProducts();
}

function renderDashboardProducts() {
  const tbody = $('#dashboardProductsTable');
  if (!tbody) return;

  const rows = products.slice(0, 12).map((product) => `
    <tr>
      <td><div class="product-cell"><img src="${product.images?.[0] || product.image || 'first-image1.jpg'}" alt="" /><strong>${product.name || 'Untitled Product'}</strong></div></td>
      <td>${product.category || '-'}</td>
      <td>${money(product.discountedPrice)} <span class="muted">${money(product.originalPrice)}</span></td>
      <td>${product.stock || 0}</td>
      <td><div class="row-actions"><button class="icon-action" data-edit-product="${product.id}"><i class="fa-solid fa-pen"></i></button><button class="icon-action" data-delete="products:${product.id}"><i class="fa-solid fa-trash"></i></button></div></td>
    </tr>
  `).join('');

  tbody.innerHTML = rows || '<tr><td colspan="5">No products found. Publish your first product from Products panel.</td></tr>';
}

function renderCategories() {
  $('#categoriesList').innerHTML = categories.map((category) => `
    <article class="cms-item">
      <img src="${category.image || 'Category creative_4.webp'}" alt="" />
      <div><strong>${category.name}</strong><p>Sort: ${category.sortOrder || 0}</p></div>
      <div class="row-actions"><button class="icon-action" data-edit-category="${category.id}"><i class="fa-solid fa-pen"></i></button><button class="icon-action" data-delete="categories:${category.id}"><i class="fa-solid fa-trash"></i></button></div>
    </article>
  `).join('') || '<p>No categories yet.</p>';
  renderCategoryOptions();
}

function renderBanners(snapshotDocs) {
  $('#bannersList').innerHTML = snapshotDocs.map((banner) => `
    <article class="cms-item">
      <img src="${banner.image || 'first-image1.jpg'}" alt="" />
      <div><strong>${banner.title || 'Banner'}</strong><p>Sort: ${banner.sortOrder || 0}</p></div>
      <div class="row-actions"><button class="icon-action" data-edit-banner="${banner.id}"><i class="fa-solid fa-pen"></i></button><button class="icon-action" data-delete="banners:${banner.id}"><i class="fa-solid fa-trash"></i></button></div>
    </article>
  `).join('') || '<p>No banners yet.</p>';
}

function renderOrders() {
  const status = $('#orderStatusFilter')?.value || '';
  const rows = orders.filter((order) => !status || order.orderStatus === status).map((order) => `
    <tr>
      <td><strong>${order.id.slice(0, 8)}</strong></td>
      <td>${order.customer?.name || 'Guest'}<br><span class="muted">${order.customer?.phone || ''}</span></td>
      <td>${money(order.total)}</td>
      <td>${order.paymentStatus || 'Pending'}</td>
      <td><select class="status-select" data-order-status="${order.id}"><option ${order.orderStatus === 'Pending' ? 'selected' : ''}>Pending</option><option ${order.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option><option ${order.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option><option ${order.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option></select></td>
      <td><button class="icon-action" data-delete="orders:${order.id}"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join('');
  $('#ordersTable').innerHTML = rows || '<tr><td colspan="6">No orders yet.</td></tr>';
  $('#recentOrders').innerHTML = orders.slice(0, 5).map((order) => `<tr><td>${order.customer?.name || 'Guest'}</td><td>${money(order.total)}</td><td>${order.orderStatus || 'Pending'}</td></tr>`).join('') || '<tr><td>No recent orders.</td></tr>';
}

function renderCustomers() {
  $('#customersTable').innerHTML = customers.map((customer) => `<tr><td>${customer.name || '-'}</td><td>${customer.email || '-'}</td><td>${customer.phone || '-'}</td><td>${customer.orderCount || 0}</td></tr>`).join('') || '<tr><td colspan="4">No customers yet.</td></tr>';
}

function renderMetrics() {
  $('#totalProducts').textContent = products.length;
  $('#totalOrders').textContent = orders.length;
  $('#totalCustomers').textContent = customers.length;
  $('#totalRevenue').textContent = money(orders.reduce((sum, order) => sum + Number(order.total || 0), 0));
  $('#bestProducts').innerHTML = products.filter((product) => (product.tags || []).includes('Best Seller')).slice(0, 5).map((product) => `
    <article class="mini-item"><img class="thumb" src="${product.images?.[0] || 'first-image1.jpg'}" alt="" /><div><strong>${product.name}</strong><p>${money(product.discountedPrice)}</p></div><span>${product.stock || 0} left</span></article>
  `).join('') || '<p>No best sellers tagged yet.</p>';
}

function parseMoneyValue(text) {
  return Number(String(text || '').replace(/[^\d.]/g, '')) || 0;
}

function normalizeImportedTags(rawTags, badgeText) {
  const source = [...rawTags, badgeText].filter(Boolean).map((value) => slug(value));
  const mapped = source.map((value) => {
    if (value === 'new' || value === 'new-arrival') return 'New Arrival';
    if (value === 'best' || value === 'best-seller') return 'Best Seller';
    if (value === 'trending') return 'Trending';
    if (value === 'featured' || value === 'gift-pick' || value === 'gift' || value === 'minimal' || value === 'festive') return 'Featured';
    return value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  });
  return Array.from(new Set(mapped.filter(Boolean)));
}

function buildProductFromCard(card) {
  const name = $('h3', card)?.textContent?.trim() || '';
  const category = $('p', card)?.textContent?.trim() || 'Jewellery';
  const image = $('.product-img', card)?.getAttribute('src') || '';
  const badgeText = $('.badge', card)?.textContent?.trim() || '';
  const rating = Number($('.rating span', card)?.textContent?.trim() || 0);
  const currentPrice = parseMoneyValue($('.price strong', card)?.textContent);
  const originalPrice = parseMoneyValue($('.price s', card)?.textContent) || currentPrice;
  const rawTags = String(card.dataset.tags || '').split(/\s+/).filter(Boolean);
  const tags = normalizeImportedTags(rawTags, badgeText);
  return {
    id: slug(name) || `product-${Date.now()}`,
    name,
    category,
    categorySlug: slug(category),
    originalPrice,
    discountedPrice: currentPrice,
    rating: Number.isFinite(rating) ? rating : 0,
    stock: 10,
    description: `${name} from the Belleru collection.`,
    tags,
    tagSlugs: tags.map((value) => slug(value)),
    images: image ? [image] : [],
    image,
    status: 'active',
    importedFromWebsite: true,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
}

function buildSeedProduct(seed) {
  const tags = Array.isArray(seed.tags) ? seed.tags : [];
  return {
    id: slug(seed.name) || `product-${Date.now()}`,
    name: seed.name,
    category: seed.category,
    categorySlug: slug(seed.category),
    originalPrice: seed.originalPrice,
    discountedPrice: seed.discountedPrice,
    rating: Number(seed.rating || 0),
    stock: 10,
    description: `${seed.name} from the Belleru collection.`,
    tags,
    tagSlugs: tags.map((value) => slug(value)),
    images: seed.image ? [seed.image] : [],
    image: seed.image || '',
    status: 'active',
    importedFromWebsite: true,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
}

async function loadWebsiteProductCards() {
  const sources = [
    new URL('index.html', window.location.href).toString(),
    new URL('best-seller.html', window.location.href).toString(),
    new URL('new-arrival.html', window.location.href).toString(),
    new URL('collections.html', window.location.href).toString()
  ];
  const cards = [];
  const errors = [];

  for (const source of sources) {
    try {
      const response = await fetch(source, { cache: 'no-store' });
      if (!response.ok) continue;
      const markup = await response.text();
      const doc = new DOMParser().parseFromString(markup, 'text/html');
      const sourceCards = $$('#productsGrid .product-card', doc);
      sourceCards.forEach((card) => cards.push(buildProductFromCard(card)));
      if (cards.length) break;
    } catch (error) {
      errors.push(error);
    }
  }

  if (!cards.length) {
    websiteProductSeed.forEach((seed) => cards.push(buildSeedProduct(seed)));
  }

  return { cards, errors };
}

async function importWebsiteProducts(manual = false) {
  if (!db) throw new Error('Firebase database is not ready yet.');

  updateProductSyncStatus('Reading current Belleru products...', 'sync-warn');
  const { cards, errors } = await loadWebsiteProductCards();
  if (!cards.length) throw new Error('No product data available to import.');

  const batch = db.batch();
  cards.forEach((product) => {
    const ref = db.collection('products').doc(product.id);
    batch.set(ref, {
      ...product,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });

  await batch.commit();
  if (errors.length) {
    updateProductSyncStatus(`Imported ${cards.length} product(s) from the built-in Belleru fallback.`, 'sync-ready');
  } else {
    updateProductSyncStatus(`${cards.length} website product(s) synced to Firebase.`, 'sync-ready');
  }
  if (manual) toast(`${cards.length} product(s) imported`);
}

function buildBannerFromDocument(banner, index) {
  return {
    id: slug(banner.title || `hero-banner-${index + 1}`),
    title: banner.title || `Hero Banner ${index + 1}`,
    image: banner.image || '',
    sortOrder: Number(banner.sortOrder || index + 1),
    status: 'active',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
}

async function loadWebsiteBanners() {
  const source = new URL('index.html', window.location.href).toString();
  const banners = [];
  try {
    const response = await fetch(source, { cache: 'no-store' });
    if (response.ok) {
      const markup = await response.text();
      const doc = new DOMParser().parseFromString(markup, 'text/html');
      const slides = $$('.hero-slide', doc);
      slides.forEach((slide, index) => {
        banners.push(buildBannerFromDocument({
          title: `Hero Banner ${index + 1}`,
          image: slide.getAttribute('src') || '',
          sortOrder: index + 1
        }, index));
      });
    }
  } catch (error) {
    console.warn('Banner import scrape failed:', error);
  }

  if (!banners.length) {
    websiteBannerSeed.forEach((seed, index) => {
      banners.push(buildBannerFromDocument(seed, index));
    });
  }

  return banners;
}

async function importWebsiteBanners(manual = false) {
  if (!db) throw new Error('Firebase database is not ready yet.');
  updateProductSyncStatus('Reading current Belleru banners...', 'sync-warn');
  const banners = await loadWebsiteBanners();
  const batch = db.batch();
  banners.forEach((banner) => {
    const ref = db.collection('banners').doc(banner.id);
    batch.set(ref, {
      ...banner,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
  await batch.commit();
  updateProductSyncStatus(`${banners.length} banner(s) synced to Firebase.`, 'sync-ready');
  if (manual) toast(`${banners.length} banner(s) imported`);
}

function clearSubscriptions() {
  subscriptions.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch (error) {
      console.warn('Unsubscribe failed:', error);
    }
  });
  subscriptions = [];
}

function subscribeData() {
  clearSubscriptions();
  subscriptions.push(db.collection('products').onSnapshot((snapshot) => {
    products = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aTime = a?.updatedAt?.toMillis?.() || a?.createdAt?.toMillis?.() || 0;
        const bTime = b?.updatedAt?.toMillis?.() || b?.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    renderProducts();
    renderMetrics();
    if (products.length) {
      updateProductSyncStatus(`${products.length} product(s) are currently synced from Firebase.`, 'sync-ready');
    } else if (!hasAttemptedProductImport) {
      hasAttemptedProductImport = true;
      updateProductSyncStatus('No Firebase products found. Importing current website products...', 'sync-warn');
      importWebsiteProducts(false).catch((error) => {
        console.error(error);
        updateProductSyncStatus(friendlyFirebaseError(error), 'sync-error');
      });
    } else {
      updateProductSyncStatus('No Firebase products found yet. Use Import Website Products to bring them in.', 'sync-warn');
    }
  }, (error) => {
    toast(friendlyFirebaseError(error));
    updateProductSyncStatus(friendlyFirebaseError(error), 'sync-error');
  }));
  subscriptions.push(db.collection('categories').orderBy('sortOrder', 'asc').onSnapshot((snapshot) => {
    categories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderCategories();
  }, (error) => {
    toast(friendlyFirebaseError(error));
  }));
  subscriptions.push(db.collection('orders').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
    orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderOrders();
    renderMetrics();
  }, (error) => {
    toast(friendlyFirebaseError(error));
  }));
  subscriptions.push(db.collection('customers').onSnapshot((snapshot) => {
    customers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderCustomers();
    renderMetrics();
  }, (error) => {
    toast(friendlyFirebaseError(error));
  }));
  subscriptions.push(db.collection('banners').orderBy('sortOrder', 'asc').onSnapshot((snapshot) => {
    const bannerDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderBanners(bannerDocs);
    if (bannerDocs.length) {
      if (!hasAttemptedBannerImport) updateProductSyncStatus(`${bannerDocs.length} banner(s) are currently synced from Firebase.`, 'sync-ready');
    } else if (!hasAttemptedBannerImport) {
      hasAttemptedBannerImport = true;
      updateProductSyncStatus('No Firebase banners found. Importing current website banners...', 'sync-warn');
      importWebsiteBanners(false).catch((error) => {
        console.error(error);
        updateProductSyncStatus(friendlyFirebaseError(error), 'sync-error');
      });
    }
  }, (error) => {
    toast(friendlyFirebaseError(error));
  }));
  subscriptions.push(db.collection('faqs').orderBy('sortOrder', 'asc').onSnapshot((snapshot) => {
    $('#faqList').innerHTML = snapshot.docs.map((doc) => {
      const faq = doc.data();
      return `<article class="cms-item"><div></div><div><strong>${faq.question}</strong><p>${faq.answer}</p></div><button class="icon-action" data-delete="faqs:${doc.id}"><i class="fa-solid fa-trash"></i></button></article>`;
    }).join('');
  }, (error) => {
    toast(friendlyFirebaseError(error));
  }));
  subscriptions.push(db.collection('siteContent').doc('global').onSnapshot((doc) => {
    if (!doc.exists) return;
    const data = doc.data();
    $('#contentFooter').value = data.footerText || '';
    $('#contentNewsletter').value = data.newsletterText || '';
    $('#contentEmail').value = data.email || '';
    $('#contentPhone').value = data.phone || '';
    $('#contentLocation').value = data.location || '';
    $('#contentInstagram').value = data.instagram || '';
    $('#contentFacebook').value = data.facebook || '';
    $('#contentPinterest').value = data.pinterest || '';
  }, (error) => {
    toast(friendlyFirebaseError(error));
  }));
}

async function seedCategories() {
  try {
    const existing = await db.collection('categories').limit(1).get();
    if (!existing.empty) return;
    await Promise.all(defaultCategories.map((name, index) => db.collection('categories').add({ name, sortOrder: index + 1, image: '', createdAt: firebase.firestore.FieldValue.serverTimestamp() })));
  } catch (error) {
    console.warn('Category seed skipped:', error);
    toast('Default category list is available locally. Firestore category seed was skipped.');
  }
}

function resetProductForm() {
  $('#productForm').reset();
  $('#productId').value = '';
  productImageUrls = [];
  $('#productPreview').innerHTML = '';
  $('#productImages').value = '';
  setProductFormMode(false);
}

function bindForms() {
  bindDrop('#productDrop', '#productImages', '#productPreview');
  bindDrop('#categoryDrop', '#categoryImage', '#categoryPreview');
  bindDrop('#bannerDrop', '#bannerImage', '#bannerPreview');

  $('#productForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = $('#publishProductBtn');
    const productId = $('#productId').value;
    const previousImages = productImageUrls.slice();
    setButtonLoading(button, true, 'Saving...');

    try {
      if (!auth.currentUser) throw new Error('Please log in before publishing products.');

      const name = $('#productName').value.trim();
      const category = $('#productCategory').value;
      const originalPrice = Number($('#productOriginal').value);
      const discountedPrice = Number($('#productDiscount').value);

      if (!name) throw new Error('Product name is required.');
      if (!category) throw new Error('Please select a product category.');
      if (!Number.isFinite(originalPrice) || originalPrice <= 0) throw new Error('Original price must be greater than 0.');
      if (!Number.isFinite(discountedPrice) || discountedPrice <= 0) throw new Error('Discounted price must be greater than 0.');

      const selectedFiles = Array.from($('#productImages').files || []);
      let uploads = previousImages;
      if (selectedFiles.length) {
        setButtonLoading(button, true, 'Uploading images...');
        uploads = await uploadFiles(selectedFiles, 'products');
        productImageUrls = uploads.slice();
      } else if (!previousImages.length) {
        uploads = [];
      }

      setButtonLoading(button, true, productId ? 'Updating product...' : 'Publishing product...');
      const payload = {
        name,
        category,
        categorySlug: slug(category),
        originalPrice,
        discountedPrice,
        rating: Number($('#productRating').value || 0),
        stock: Number($('#productStock').value || 0),
        description: $('#productDescription').value.trim(),
        tags: $$('#productForm .tag-grid input:checked').map((input) => input.value),
        tagSlugs: $$('#productForm .tag-grid input:checked').map((input) => slug(input.value)),
        images: uploads.length ? uploads : previousImages,
        image: (uploads.length ? uploads : previousImages)[0] || '',
        status: 'active',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (productId) {
        await withTimeout(
          db.collection('products').doc(productId).set(payload, { merge: true }),
          30000,
          'Product update timed out. Check Firestore rules and connection.'
        );
        toast('Product updated successfully');
      } else {
        await withTimeout(
          db.collection('products').add({ ...payload, createdAt: firebase.firestore.FieldValue.serverTimestamp() }),
          30000,
          'Product publish timed out. Check Firestore rules and connection.'
        );
        toast('Product published successfully');
      }

      productImageUrls = payload.images.slice();
      resetProductForm();
    } catch (error) {
      console.error(error);
      toast(friendlyFirebaseError(error));
      productImageUrls = previousImages;
    } finally {
      setButtonLoading(button, false, productId ? 'Update Product' : 'Publish Product');
    }
  });

  $('#resetProduct').addEventListener('click', resetProductForm);

  $('#categoryForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = $('#categoryId').value;
    const uploads = $('#categoryImage').files.length ? await uploadFiles($('#categoryImage').files, 'categories') : [];
    const payload = { name: $('#categoryName').value.trim(), sortOrder: Number($('#categorySort').value || 0), image: uploads[0] || categoryImageUrl, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    if (id) await db.collection('categories').doc(id).update(payload);
    else await db.collection('categories').add({ ...payload, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    $('#categoryForm').reset();
    $('#categoryId').value = '';
    $('#categoryPreview').innerHTML = '';
    categoryImageUrl = '';
    toast('Category saved');
  });

  $('#bannerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = $('#bannerId').value;
    const uploads = $('#bannerImage').files.length ? await uploadFiles($('#bannerImage').files, 'banners') : [];
    const payload = { title: $('#bannerTitle').value.trim(), sortOrder: Number($('#bannerSort').value || 0), image: uploads[0] || bannerImageUrl, status: 'active', updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    if (id) await db.collection('banners').doc(id).update(payload);
    else await db.collection('banners').add({ ...payload, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    $('#bannerForm').reset();
    $('#bannerId').value = '';
    $('#bannerPreview').innerHTML = '';
    bannerImageUrl = '';
    toast('Banner saved');
  });

  $('#contentForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    await db.collection('siteContent').doc('global').set({
      footerText: $('#contentFooter').value,
      newsletterText: $('#contentNewsletter').value,
      email: $('#contentEmail').value,
      phone: $('#contentPhone').value,
      location: $('#contentLocation').value,
      instagram: $('#contentInstagram').value,
      facebook: $('#contentFacebook').value,
      pinterest: $('#contentPinterest').value,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    toast('Website content saved');
  });

  $('#faqForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    await db.collection('faqs').add({ question: $('#faqQuestion').value, answer: $('#faqAnswer').value, sortOrder: Number($('#faqSort').value || 0), createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    $('#faqForm').reset();
    toast('FAQ added');
  });
}

function bindTableActions() {
  document.addEventListener('click', async (event) => {
    const productEdit = event.target.closest('[data-edit-product]');
    if (productEdit) {
      const product = products.find((item) => item.id === productEdit.dataset.editProduct);
      if (!product) return;
      $('#productId').value = product.id;
      $('#productName').value = product.name || '';
      $('#productCategory').value = product.category || '';
      $('#productOriginal').value = product.originalPrice || '';
      $('#productDiscount').value = product.discountedPrice || '';
      $('#productRating').value = product.rating || '';
      $('#productStock').value = product.stock || '';
      $('#productDescription').value = product.description || '';
      $$('#productForm .tag-grid input').forEach((input) => { input.checked = (product.tags || []).includes(input.value); });
      productImageUrls = product.images || [];
      $('#productPreview').innerHTML = productImageUrls.map((url) => `<img src="${url}" alt="" />`).join('');
      $('#productImages').value = '';
      setProductFormMode(true);
      setPanel('products');
      return;
    }

    const categoryEdit = event.target.closest('[data-edit-category]');
    if (categoryEdit) {
      const category = categories.find((item) => item.id === categoryEdit.dataset.editCategory);
      if (!category) return;
      $('#categoryId').value = category.id;
      $('#categoryName').value = category.name || '';
      $('#categorySort').value = category.sortOrder || 0;
      categoryImageUrl = category.image || '';
      $('#categoryPreview').innerHTML = categoryImageUrl ? `<img src="${categoryImageUrl}" alt="" />` : '';
      return;
    }

    const bannerEdit = event.target.closest('[data-edit-banner]');
    if (bannerEdit) {
      const doc = await db.collection('banners').doc(bannerEdit.dataset.editBanner).get();
      const banner = { id: doc.id, ...doc.data() };
      $('#bannerId').value = banner.id;
      $('#bannerTitle').value = banner.title || '';
      $('#bannerSort').value = banner.sortOrder || 0;
      bannerImageUrl = banner.image || '';
      $('#bannerPreview').innerHTML = bannerImageUrl ? `<img src="${bannerImageUrl}" alt="" />` : '';
      return;
    }

    const del = event.target.closest('[data-delete]');
    if (del) {
      const [collection, id] = del.dataset.delete.split(':');
      pendingDelete = { collection, id };
      $('#confirmText').textContent = `Delete this ${collection.slice(0, -1)}?`;
      $('#confirmModal').classList.remove('hidden');
    }
  });

  document.addEventListener('change', async (event) => {
    const status = event.target.closest('[data-order-status]');
    if (status) {
      await db.collection('orders').doc(status.dataset.orderStatus).update({ orderStatus: status.value, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      toast('Order status updated');
    }
  });

  $('#confirmYes').addEventListener('click', async () => {
    if (pendingDelete) {
      await db.collection(pendingDelete.collection).doc(pendingDelete.id).delete();
      toast('Deleted');
    }
    pendingDelete = null;
    $('#confirmModal').classList.add('hidden');
  });
  $('#confirmNo').addEventListener('click', () => $('#confirmModal').classList.add('hidden'));
}

function bindNavigation() {
  $$('.admin-nav button[data-panel]').forEach((button) => button.addEventListener('click', () => setPanel(button.dataset.panel)));
  $('#globalSearch').addEventListener('input', renderProducts);
  $('#productFilter').addEventListener('change', renderProducts);
  $('#orderStatusFilter').addEventListener('change', renderOrders);
  $('#logoutBtn').addEventListener('click', () => auth.signOut());
  $('#goProductsPanel')?.addEventListener('click', () => setPanel('products'));
  ['#syncProductsBtn', '#syncProductsBtnSecondary'].forEach((selector) => {
    $(selector)?.addEventListener('click', async () => {
      try {
        updateProductSyncStatus('Importing current website products...', 'sync-warn');
        await importWebsiteProducts(true);
      } catch (error) {
        console.error(error);
        updateProductSyncStatus(friendlyFirebaseError(error), 'sync-error');
        toast(friendlyFirebaseError(error));
      }
    });
  });
  $('#syncBannersBtn')?.addEventListener('click', async () => {
    try {
      updateProductSyncStatus('Importing current website banners...', 'sync-warn');
      await importWebsiteBanners(true);
    } catch (error) {
      console.error(error);
      updateProductSyncStatus(friendlyFirebaseError(error), 'sync-error');
      toast(friendlyFirebaseError(error));
    }
  });
}

function bindAuth() {
  $('#loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!assertConfigured()) return;
    try {
      await auth.signInWithEmailAndPassword($('#loginEmail').value, $('#loginPassword').value);
    } catch (error) {
      toast(error.message);
    }
  });

  auth.onAuthStateChanged(async (user) => {
    const allowed = window.BELLERU_ADMIN_EMAILS || [];
    if (user && (!allowed.length || allowed.includes(user.email))) {
      $('#loginScreen').classList.add('hidden');
      $('#adminShell').classList.remove('hidden');
      subscribeData();
      await seedCategories();
      toast('Welcome to Belleru CMS');
    } else {
      if (user) {
        toast('This email is not allowed as a Belleru admin');
        await auth.signOut();
      }
      clearSubscriptions();
      $('#loginScreen').classList.remove('hidden');
      $('#adminShell').classList.add('hidden');
    }
  });
}

(function initAdmin() {
  if (!initFirebase()) return;
  renderCategoryOptions();
  setProductFormMode(false);
  bindNavigation();
  bindForms();
  bindTableActions();
  bindAuth();
})();

