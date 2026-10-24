# WanderLust

WanderLust is a full-stack travel accommodation and experiences marketplace built with Node.js, Express, MongoDB, and EJS. Users can explore listings, search by destination and availability, filter by price and rating, and manage their own listings.

**Live demo:** [wanderlust-3p74.onrender.com/listings](https://wanderlust-3p74.onrender.com/listings)

**Repository:** [ChetanKumar4u/MAJORPROJECT](https://github.com/ChetanKumar4u/MAJORPROJECT)

## Features

- Browse listing cards with owner names and review ratings.
- Search listings by destination, dates, guest capacity, and listing type.
- Filter by price, country, and minimum review rating.
- Create, edit, and delete listings with owner-only authorization.
- Upload listing photos to Cloudinary.
- Register and log in with Passport Local authentication.
- Add reviews and ratings; review authors can delete their own reviews.
- View listing locations on Mapbox maps.
- Seed the database with 29 sample listings.
- Responsive listing search that collapses into the navbar as the page scrolls.

## Tech stack

- Node.js and Express 5
- MongoDB Atlas and Mongoose
- EJS and EJS-Mate
- Passport Local and Express Session
- Cloudinary and Multer
- Mapbox GL JS and Mapbox Geocoding
- Bootstrap

## Requirements

- Node.js 24 (the project currently declares Node.js 24.20.0)
- npm
- A MongoDB connection string
- Cloudinary credentials for image uploads
- A Mapbox access token for maps and listing geocoding

## Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/ChetanKumar4u/MAJORPROJECT.git
   cd MAJORPROJECT
   npm install
   ```

2. Create a local `.env` file from the example:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Set the following values in `.env`:

   | Variable | Purpose |
   | --- | --- |
   | `ATLASDB_URL` | MongoDB connection string for the application database |
   | `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
   | `CLOUDINARY_API_KEY` | Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | Cloudinary API secret |
   | `MAP_TOKEN` | Mapbox access token used for maps and geocoding |

   Keep `.env` private. Do not commit real credentials or put secret tokens in client-side code.

4. Start the application:

   ```bash
   node app.js
   ```

   Open [http://localhost:8080/listings](http://localhost:8080/listings).

## Sample listings

To add the 29 included sample listings to the MongoDB database specified by `ATLASDB_URL`, run:

```bash
node init/index.js --confirm
```

The seeder is additive: it does not delete existing listings and avoids re-adding the same sample listing on subsequent runs. Run it only when `ATLASDB_URL` points to the database you intend to populate.

## Resume description

**WanderLust — Full-Stack Travel Marketplace**

Built a responsive travel listing platform using Node.js, Express, MongoDB, and EJS, implementing Passport-based authentication, owner-authorized listing CRUD, Cloudinary image uploads, Mapbox geocoding and interactive maps, reviews and ratings, and destination/date/guest search with filters.

### Short version

Developed a full-stack travel marketplace with secure authentication, listing management, Cloudinary uploads, Mapbox maps, reviews, and responsive search/filtering using Express, MongoDB, and EJS.
