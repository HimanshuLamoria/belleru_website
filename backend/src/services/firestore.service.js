const db = require('../config/firebase');
const slug = require('../utils/slug');

function withTimestamps(data, isCreate = false) {
  const timestamp = new Date().toISOString();
  return {
    ...data,
    updatedAt: timestamp,
    ...(isCreate ? { createdAt: timestamp } : {})
  };
}

function mapDoc(doc) {
  return { id: doc.id, ...doc.data() };
}

async function createProduct(payload) {
  const product = withTimestamps({
    ...payload,
    categorySlug: payload.categorySlug || slug(payload.category),
    tagSlugs: Array.isArray(payload.tags) ? payload.tags.map(slug) : [],
    image: payload.image || payload.images?.[0] || '',
    status: payload.status || 'active'
  }, true);

  const ref = await db.collection('products').add(product);
  return { id: ref.id, ...product };
}

async function updateProduct(id, payload) {
  const product = withTimestamps({
    ...payload,
    categorySlug: payload.categorySlug || slug(payload.category),
    tagSlugs: Array.isArray(payload.tags) ? payload.tags.map(slug) : [],
    image: payload.image || payload.images?.[0] || ''
  });

  await db.collection('products').doc(id).set(product, { merge: true });
  const updated = await getProductById(id);
  return updated;
}

async function deleteProduct(id) {
  await db.collection('products').doc(id).delete();
  return { id };
}

async function getAllProducts() {
  const snapshot = await db.collection('products').orderBy('updatedAt', 'desc').get();
  return snapshot.docs.map(mapDoc);
}

async function getProductById(id) {
  const doc = await db.collection('products').doc(id).get();
  return doc.exists ? mapDoc(doc) : null;
}

async function createCategory(payload) {
  const category = withTimestamps({
    name: payload.name,
    slug: payload.slug || slug(payload.name),
    image: payload.image || '',
    sortOrder: Number(payload.sortOrder || 0),
    status: payload.status || 'active'
  }, true);
  const ref = await db.collection('categories').add(category);
  return { id: ref.id, ...category };
}

async function updateCategory(id, payload) {
  const category = withTimestamps({
    ...payload,
    slug: payload.slug || slug(payload.name),
    sortOrder: Number(payload.sortOrder || 0)
  });
  await db.collection('categories').doc(id).set(category, { merge: true });
  const doc = await db.collection('categories').doc(id).get();
  return mapDoc(doc);
}

async function deleteCategory(id) {
  await db.collection('categories').doc(id).delete();
  return { id };
}

async function getAllCategories() {
  const snapshot = await db.collection('categories').orderBy('sortOrder', 'asc').get();
  return snapshot.docs.map(mapDoc);
}

async function getCategoryById(id) {
  const doc = await db.collection('categories').doc(id).get();
  return doc.exists ? mapDoc(doc) : null;
}

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById
};
