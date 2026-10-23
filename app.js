require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressErrors.js");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const { Strategy: LocalStrategy } = require("passport-local");
const User = require("./models/user.js");

const listings = require("./routes/listing.js");
const reviews = require("./routes/reviews.js");
const users = require("./routes/users.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;


async function main() {
    await mongoose.connect(dbUrl);
    console.log("connected to DB");

    app.listen(8080, () => {
        console.log("Server is running on port 8080");
    });
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));
app.use(
    "/vendor/mapbox-gl",
    express.static(path.join(__dirname, "node_modules", "mapbox-gl", "dist"))
);

const store = MongoStore.create({ 
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 60 * 60,
});

store.on("error", (error) => {
    console.error("ERROR in MONGO SESSION STORE", error);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

//Passport configuration
// Session middleware - stores session data for each user.
app.use(session(sessionOptions));
// Passport initialization - enables Passport authentication.
app.use(passport.initialize());
// Passport session middleware - restores the logged-in user from the session.
app.use(passport.session());
// Flash middleware - makes one-time messages available to routes.
app.use(flash());
// Local strategy - checks submitted credentials against the User model.
passport.use(new LocalStrategy(User.authenticate()));
// Serialize user - stores the user's ID in the session after login.
passport.serializeUser(User.serializeUser());
// Deserialize user - retrieves the user from the session on later requests.
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.successMessages = req.flash("success");
    res.locals.errorMessages = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.get("/demouser", async (req, res, next) => {
    let fakeUser = await User.findOne({ email: "demouser@gmail.com" });
    if (!fakeUser) {
        try {
            fakeUser = await User.create({
                username: "demouser",
                email: "demouser@gmail.com",
            });
        } catch (error) {
            if (error.code !== 11000) {
                throw error;
            }
            fakeUser = await User.findOne({ email: "demouser@gmail.com" });
            if (!fakeUser) {
                throw error;
            }
        }
    }

    req.login(fakeUser, (error) => {
        if (error) {
            return next(error);
        }
        res.redirect("/listings");
    });
});

app.use("/", users);
app.use("/listings", listings);
app.use("/listings/:id/reviews", reviews);

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    const stack = app.get("env") === "development" ? err.stack : null;
    res.status(statusCode).render("error.ejs", { message, stack });
});

main().catch(err => {
    console.error("Failed to start server:", err);
    process.exitCode = 1;
});