const crypto = require("crypto");
const multer = require("multer");
const { Readable } = require("stream");
const ExpressError = require("./ExpressErrors.js");
const { cloudinary, isConfigured } = require("../config/cloudinary.js");

const supportedImageTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);

const uploadImage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!supportedImageTypes.has(file.mimetype)) {
            return callback(new ExpressError(400, "Upload a JPEG, PNG, WebP, or GIF image."));
        }
        callback(null, true);
    },
}).single("image");

module.exports = (req, res, next) => {
    if (!isConfigured) {
        return next(new ExpressError(
            503,
            "Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
        ));
    }

    uploadImage(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return next(new ExpressError(400, "Image must be 5 MB or smaller."));
            }
            return next(new ExpressError(400, error.message));
        }
        if (error) {
            return next(error);
        }

        if (!req.file) {
            return next();
        }

        const cloudinaryStream = cloudinary.uploader.upload_stream({
            folder: "majorproject_listings",
            public_id: `listing-${crypto.randomUUID()}`,
            resource_type: "image",
        }, (uploadError, result) => {
            if (uploadError) {
                return next(new ExpressError(502, `Cloudinary upload failed: ${uploadError.message}`));
            }
            if (!result) {
                return next(new ExpressError(502, "Cloudinary returned no image details."));
            }

            req.uploadedImage = {
                filename: result.public_id,
                url: result.secure_url,
            };
            next();
        });

        Readable.from([req.file.buffer]).pipe(cloudinaryStream);
    });
};
