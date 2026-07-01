const s3Service = require('../services/awsS3.service');
const ApiError = require('../utils/ApiError');

async function uploadProductImages(req, res) {
  if (!req.files?.length) throw new ApiError(400, 'At least one image is required');

  const uploads = await s3Service.uploadImages(req.files, 'products');

  res.status(201).json({
    success: true,
    data: {
      urls: uploads.map((upload) => upload.url),
      files: uploads
    }
  });
}

async function uploadCategoryImage(req, res) {
  if (!req.file) throw new ApiError(400, 'Image is required');

  const upload = await s3Service.uploadImage(req.file, 'categories');

  res.status(201).json({
    success: true,
    data: {
      url: upload.url,
      file: upload
    }
  });
}

module.exports = { uploadProductImages, uploadCategoryImage };
