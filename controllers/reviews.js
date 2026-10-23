const ExpressError = require("../utils/ExpressErrors.js");
const Reviews = require("../models/reviews.js");
const Listing = require("../models/listing.js");

module.exports.create = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    const review = new Reviews({
        ...req.body.review,
        author: req.user._id,
    });
    await review.save();
    listing.reviews.push(review);
    await listing.save();
    req.flash("success", "Review has been added.");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.destroy = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    const reviewIsOnListing = listing.reviews.some((reviewId) =>
        reviewId.equals(req.params.reviewId)
    );
    if (!reviewIsOnListing) {
        throw new ExpressError(404, "Review not found");
    }

    listing.reviews.pull(req.params.reviewId);
    await listing.save();
    await Reviews.findByIdAndDelete(req.params.reviewId);
    req.flash("success", "Review has been deleted.");
    res.redirect(`/listings/${listing._id}`);
};
