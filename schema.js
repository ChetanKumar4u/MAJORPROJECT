const Joi = require("joi");

const listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        category: Joi.string().valid("homes", "experiences", "services").required(),
        availableFrom: Joi.date().iso().allow("", null),
        availableTo: Joi.date().iso().allow("", null),
        maxGuests: Joi.number().integer().min(1).max(50).required(),
        image: Joi.object({
            url: Joi.string().allow("", null),
        }).optional(),
        price: Joi.number().min(0).required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
    }).required().custom((listing, helpers) => {
        const hasStart = Boolean(listing.availableFrom);
        const hasEnd = Boolean(listing.availableTo);
        if (hasStart !== hasEnd) {
            return helpers.error("object.availabilityPair");
        }
        if (hasStart && listing.availableTo <= listing.availableFrom) {
            return helpers.error("object.availabilityOrder");
        }
        return listing;
    }),
}).messages({
    "object.availabilityPair": "Set both availability dates, or leave both empty.",
    "object.availabilityOrder": "Availability end date must be after its start date.",
});

const reviewSchema = Joi.object({
    review: Joi.object({
        username: Joi.string().trim().required(),
        comment: Joi.string().required(),
        rating: Joi.number().integer().min(1).max(5).required(),
    }).required(),
});

const userSchema = Joi.object({
    user: Joi.object({
        username: Joi.string().trim().min(3).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
    }).required(),
});

module.exports = { listingSchema, reviewSchema, userSchema };