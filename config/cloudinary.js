require("dotenv").config();

const cloudinary = require("cloudinary").v2;

const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
};

const isConfigured = Boolean(
    cloudinaryConfig.cloud_name &&
    cloudinaryConfig.api_key &&
    cloudinaryConfig.api_secret
);

cloudinary.config(cloudinaryConfig);

module.exports = { cloudinary, isConfigured };
