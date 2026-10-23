const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressErrors.js");
const { accessToken, geocodingClient } = require("../config/mapbox.js");

const fallbackOwnerNames = [
    "Aarav Mehta",
    "Isha Kapoor",
    "Rohan Sharma",
    "Ananya Patel",
    "Kabir Rao",
    "Mira Nair",
];

async function geocodeListingLocation(location, country) {
    if (!geocodingClient) {
        throw new ExpressError(503, "Location maps are not configured. Set MAP_TOKEN.");
    }

    let response;
    try {
        response = await geocodingClient.forwardGeocode({
            query: `${location}, ${country}`,
            mode: "mapbox.places-permanent",
            limit: 1,
            autocomplete: false,
        }).send();
    } catch (error) {
        throw new ExpressError(502, `Mapbox could not geocode this listing: ${error.message}`);
    }

    const geometry = response.body.features?.[0]?.geometry;
    const coordinates = geometry?.coordinates;
    if (
        geometry?.type !== "Point" ||
        !Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        !coordinates.every(Number.isFinite) ||
        coordinates[0] < -180 ||
        coordinates[0] > 180 ||
        coordinates[1] < -90 ||
        coordinates[1] > 90
    ) {
        throw new ExpressError(422, "Mapbox could not find the listing location. Check the location and country.");
    }

    return geometry;
}

function hasValidGeometry(geometry) {
    return geometry?.type === "Point" &&
        Array.isArray(geometry.coordinates) &&
        geometry.coordinates.length === 2 &&
        geometry.coordinates.every(Number.isFinite) &&
        geometry.coordinates[0] >= -180 &&
        geometry.coordinates[0] <= 180 &&
        geometry.coordinates[1] >= -90 &&
        geometry.coordinates[1] <= 90;
}

module.exports.addDisplayOwnerName = (listing) => {
    const nameIndex = [...listing._id.toString()].reduce(
        (total, character) => total + character.charCodeAt(0),
        0
    ) % fallbackOwnerNames.length;

    listing.displayOwnerName = listing.owner?.username || fallbackOwnerNames[nameIndex];
    return listing;
};

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({})
        .populate("owner", "username")
        .populate("reviews", "rating");
    allListings.forEach((listing) => {
        module.exports.addDisplayOwnerName(listing);
        const ratings = listing.reviews.map((review) => review.rating);
        listing.averageRating = ratings.length
            ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
            : null;
        listing.reviewCount = ratings.length;
    });

    const countries = [...new Set(allListings.map((listing) => listing.country).filter(Boolean))]
        .sort((first, second) => first.localeCompare(second));
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const categories = ["homes", "experiences", "services"];
    const activeCategory = categories.includes(category) ? category : "";
    const filterError = [];
    let priceRangeValid = true;
    let dateRangeValid = true;
    let guestCountValid = true;
    const parsePrice = (value, label) => {
        if (value === undefined || value === "") {
            return null;
        }
        const price = typeof value === "string" ? Number(value) : NaN;
        if (!Number.isFinite(price) || price < 0) {
            filterError.push(`${label} must be a valid non-negative amount.`);
            priceRangeValid = false;
            return null;
        }
        return price;
    };
    if (category && !activeCategory) {
        filterError.push("Choose a valid listing type.");
    }
    const minPrice = parsePrice(req.query.minPrice, "Minimum price");
    const maxPrice = parsePrice(req.query.maxPrice, "Maximum price");
    const requestedRating = req.query.minRating;
    let minimumRating = null;
    if (requestedRating !== undefined && requestedRating !== "") {
        minimumRating = typeof requestedRating === "string" ? Number(requestedRating) : NaN;
        if (!Number.isInteger(minimumRating) || minimumRating < 1 || minimumRating > 5) {
            filterError.push("Minimum rating must be between 1 and 5.");
            minimumRating = null;
        }
    }
    const requestedCountry = typeof req.query.country === "string" ? req.query.country : "";
    const country = countries.includes(requestedCountry) ? requestedCountry : "";
    if (requestedCountry && !country) {
        filterError.push("Choose a country from the available options.");
    }
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
        filterError.push("Minimum price cannot be greater than maximum price.");
        priceRangeValid = false;
    }

    const queryText = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const parseDate = (value, label) => {
        if (value === undefined || value === "") {
            return null;
        }
        if (
            typeof value !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
            Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
            new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
        ) {
            filterError.push(`${label} must be a valid date.`);
            dateRangeValid = false;
            return null;
        }
        return new Date(`${value}T00:00:00Z`);
    };
    const checkIn = parseDate(req.query.checkIn, "Check-in");
    const checkOut = parseDate(req.query.checkOut, "Check-out");
    if ((checkIn === null) !== (checkOut === null)) {
        filterError.push("Choose both check-in and check-out dates.");
        dateRangeValid = false;
    } else if (checkIn && checkOut && checkOut <= checkIn) {
        filterError.push("Check-out must be after check-in.");
        dateRangeValid = false;
    }
    let guests = null;
    if (req.query.guests !== undefined && req.query.guests !== "") {
        guests = typeof req.query.guests === "string" ? Number(req.query.guests) : NaN;
        if (!Number.isInteger(guests) || guests < 1 || guests > 50) {
            filterError.push("Guest count must be between 1 and 50.");
            guests = null;
            guestCountValid = false;
        }
    }
    const filters = {
        minPrice,
        maxPrice,
        country,
        minRating: minimumRating,
        q: queryText,
        checkIn: typeof req.query.checkIn === "string" ? req.query.checkIn : "",
        checkOut: typeof req.query.checkOut === "string" ? req.query.checkOut : "",
        guests,
    };
    const filteredListings = allListings.filter((listing) => {
        if (activeCategory && (listing.category || "homes") !== activeCategory) {
            return false;
        }
        if (minimumRating && listing.averageRating < minimumRating) {
            return false;
        }
        if (queryText) {
            const searchableText = `${listing.title} ${listing.location} ${listing.country}`.toLocaleLowerCase();
            if (!searchableText.includes(queryText.toLocaleLowerCase())) {
                return false;
            }
        }
        if (country && listing.country !== country) {
            return false;
        }
        if (
            priceRangeValid &&
            ((minPrice !== null && listing.price < minPrice) ||
                (maxPrice !== null && listing.price > maxPrice))
        ) {
            return false;
        }
        if (
            guests !== null &&
            guestCountValid &&
            (!Number.isInteger(listing.maxGuests) || listing.maxGuests < guests)
        ) {
            return false;
        }
        if (
            checkIn &&
            checkOut &&
            dateRangeValid &&
            (!listing.availableFrom ||
                !listing.availableTo ||
                listing.availableFrom > checkIn ||
                listing.availableTo < checkOut)
        ) {
            return false;
        }
        return true;
    });

    res.render("listings/index.ejs", {
        allListings: filteredListings,
        countries,
        filters,
        activeCategory,
        filterError: filterError.join(" "),
        hasActiveFilters: Boolean(
            activeCategory ||
            minPrice !== null ||
            maxPrice !== null ||
            country ||
            minimumRating ||
            queryText ||
            filters.checkIn ||
            filters.checkOut ||
            guests
        ),
    });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.show = async (req, res) => {
    const listing = await Listing.findById(req.params.id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner", "username");
    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    module.exports.addDisplayOwnerName(listing);
    let mapError = null;
    if (!hasValidGeometry(listing.geometry) && geocodingClient) {
        try {
            listing.geometry = await geocodeListingLocation(listing.location, listing.country);
            await listing.save();
        } catch (error) {
            mapError = error.message;
        }
    }

    res.render("listings/show.ejs", {
        listing,
        mapToken: accessToken && accessToken.startsWith("pk.") ? accessToken : null,
        mapError,
    });
};

module.exports.create = async (req, res) => {
    if (!req.uploadedImage) {
        throw new ExpressError(400, "Please upload a listing image.");
    }

    const newListing = new Listing({
        ...req.body.listing,
        availableFrom: req.body.listing.availableFrom || undefined,
        availableTo: req.body.listing.availableTo || undefined,
        image: req.uploadedImage,
        owner: req.user._id,
        geometry: await geocodeListingLocation(
            req.body.listing.location,
            req.body.listing.country
        ),
    });
    await newListing.save();
    req.flash("success", "New listing has been added.");
    res.redirect("/listings");
};

module.exports.renderEditForm = (req, res) => {
    res.render("listings/edit.ejs", { listing: res.locals.listing });
};

module.exports.update = async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body.listing };
    updateData.availableFrom = updateData.availableFrom || undefined;
    updateData.availableTo = updateData.availableTo || undefined;
    const listing = res.locals.listing;
    if (
        !hasValidGeometry(listing.geometry) ||
        listing.location !== updateData.location ||
        listing.country !== updateData.country
    ) {
        updateData.geometry = await geocodeListingLocation(
            updateData.location,
            updateData.country
        );
    }
    if (req.uploadedImage) {
        updateData.image = req.uploadedImage;
    }

    const updatedListing = await Listing.findByIdAndUpdate(id, updateData);
    if (!updatedListing) {
        throw new ExpressError(404, "Listing not found");
    }

    req.flash("success", "Listing has been updated.");
    res.redirect(`/listings/${id}`);
};

module.exports.destroy = async (req, res) => {
    const deletedListing = await Listing.findByIdAndDelete(req.params.id);
    if (!deletedListing) {
        throw new ExpressError(404, "Listing not found");
    }

    req.flash("success", "Listing has been deleted.");
    res.redirect("/listings");
};