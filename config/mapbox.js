require("dotenv").config();

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding.js");

const accessToken = process.env.MAP_TOKEN;
const geocodingClient = accessToken
    ? mbxGeocoding({ accessToken })
    : null;

module.exports = {
    accessToken,
    geocodingClient,
};
