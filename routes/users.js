const express = require("express");
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressErrors.js");
const { userSchema } = require("../schema.js");
const router = express.Router();
const { saveRedirectUrl } = require("../middleware.js");
const usersController = require("../controllers/users.js");

function validateUser(req, res, next) {
    const { error } = userSchema.validate(req.body);
    if (error) {
        const message = error.details.map((detail) => detail.message).join(", ");
        return next(new ExpressError(400, message));
    }
    next();
}

router.route("/signup")
    .get(usersController.renderSignupForm)
    .post(validateUser, wrapAsync(usersController.signup));

router.route("/login")
    .get(usersController.renderLoginForm)
    .post(
        saveRedirectUrl,
        passport.authenticate("local", {
            failureFlash: true,
            failureRedirect: "/login",
        }),
        usersController.login
    );

// Logout User Route
router.post("/logout", usersController.logout);

module.exports = router;
