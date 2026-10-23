const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressErrors.js");
const { listingSchema } = require("../schema.js");
const Listing = require("../models/listing.js");
const { isLoggedIn } = require("../middleware.js");
const listingsController = require("../controllers/listings.js");
const uploadImage = require("../utils/upload.js");

//Validate Listing
function validateListing(req, res, next) {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const message = error.details.map((detail) => detail.message).join(", ");
        return next(new ExpressError(400, message));
    }
    next();
}

const isOwner = wrapAsync(async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
        throw new ExpressError(403, "You do not have permission to modify this listing");
    }

    res.locals.listing = listing;
    next();
});

router.route("/")
    .get(wrapAsync(listingsController.index))
    .post(isLoggedIn, uploadImage, validateListing, wrapAsync(listingsController.create));

router.get("/new", isLoggedIn, listingsController.renderNewForm);

router.get("/:id/edit", isLoggedIn, isOwner, listingsController.renderEditForm);

router.route("/:id")
    .get(wrapAsync(listingsController.show))
    .put(isLoggedIn, isOwner, uploadImage, validateListing, wrapAsync(listingsController.update))
    .delete(isLoggedIn, isOwner, wrapAsync(listingsController.destroy));

module.exports = router;