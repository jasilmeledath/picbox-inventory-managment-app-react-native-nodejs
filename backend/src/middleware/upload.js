const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Custom storage engine for Cloudinary
const cloudinaryStorage = (options) => {
  return {
    _handleFile: (req, file, cb) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          resource_type: options.resource_type || 'auto',
          allowed_formats: options.allowed_formats
        },
        (error, result) => {
          if (error) return cb(error);
          cb(null, {
            path: result.secure_url,
            filename: result.public_id,
            size: result.bytes
          });
        }
      );
      
      file.stream.pipe(uploadStream);
    },
    _removeFile: (req, file, cb) => {
      cloudinary.uploader.destroy(file.filename, cb);
    }
  };
};

// Create multer upload middleware
const uploadImage = multer({
  storage: cloudinaryStorage({
    folder: 'picbox/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const uploadPdf = multer({
  storage: cloudinaryStorage({
    folder: 'picbox/pdfs',
    resource_type: 'raw',
    allowed_formats: ['pdf']
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadPdf,
  deleteFromCloudinary
};
