const mongoose = require("mongoose");
const { Schema } = mongoose;

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    category: {
        type: String,
        enum: ["homes", "experiences", "services"],
        default: "homes",
        required: true,
    },
    availableFrom: Date,
    availableTo: Date,
    maxGuests: {
        type: Number,
        min: 1,
        required: true,
    },
    image: {
        filename: String,
        url: String,
    },
    price: Number,
    location: String,
    country: String,
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Reviews",
        },
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
});

module.exports = mongoose.model("Listing", listingSchema);
