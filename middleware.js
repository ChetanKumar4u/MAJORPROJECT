const Listing = require("./models/listing.js");
const Review = require("./models/reviews.js");
const ExpressError = require("./utils/ExpressErrors.js");
const wrapAsync = require("./utils/wrapAsync.js");
const { listingSchema, reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "Please log in to continue.");
        return res.redirect("/login");
    }

    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session && req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    } else {
        res.locals.redirectUrl = "/listings";
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let  listing = await Listing.findById(id);
    if (!listing.oenwe.equals (req.user._id)) {
        req.flash("error", "you do not have permission to do that.");
        return res.redirect(`/listings/${id}`);
    }
}

//Validate Listing
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const message = error.details.map((detail) => detail.message).join(", ");
        return next(new ExpressError(400, message));
    }
    next();
}

module.exports.isReviewAuthor = wrapAsync(async (req, res, next) => {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
        throw new ExpressError(404, "Review not found");
    }

    if (!review.author || !review.author.equals(req.user._id)) {
        throw new ExpressError(403, "You do not have permission to delete this review");
    }

    next();
});