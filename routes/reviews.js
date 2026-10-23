const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, validateReview, isReviewAuthor } = require("../middleware.js");
const reviewsController = require("../controllers/reviews.js");

//Post Review Route
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewsController.create));

//Delete Review Route
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewsController.destroy));

module.exports = router;