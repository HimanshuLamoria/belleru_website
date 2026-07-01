const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuid } = require('uuid');
const config = require('../config/env');
const s3Client = require('../config/aws');

function sanitizeFileName(fileName) {
  return String(fileName || 'image')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();
}

function buildPublicUrl(key) {
  if (config.aws.publicBaseUrl) {
    return `${config.aws.publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }

  return `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
}

async function uploadImage(file, folder = 'products') {
  const extension = file.originalname.includes('.') ? file.originalname.split('.').pop() : 'jpg';
  const key = `${folder}/${Date.now()}-${uuid()}-${sanitizeFileName(file.originalname)}.${extension}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: config.aws.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: 'public, max-age=31536000, immutable'
  }));

  return {
    key,
    url: buildPublicUrl(key),
    contentType: file.mimetype,
    size: file.size
  };
}

async function uploadImages(files, folder) {
  return Promise.all(files.map((file) => uploadImage(file, folder)));
}

module.exports = { uploadImage, uploadImages };
