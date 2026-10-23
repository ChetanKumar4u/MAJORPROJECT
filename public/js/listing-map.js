(() => {
  const mapElement = document.getElementById('listing-map')
  const statusElement = document.getElementById('listing-map-status')

  if (!mapElement || !statusElement || !window.mapboxgl) {
    return
  }

  const accessToken = mapElement.dataset.mapToken
  const longitude = Number(mapElement.dataset.mapLongitude)
  const latitude = Number(mapElement.dataset.mapLatitude)
  const title = mapElement.dataset.mapTitle
  const location = mapElement.dataset.mapLocation
  const price = mapElement.dataset.mapPrice

  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    statusElement.textContent = 'The saved map coordinates are invalid.'
    return
  }

  const coordinates = [longitude, latitude]
  const map = new mapboxgl.Map({
    accessToken,
    container: 'listing-map',
    center: coordinates,
    zoom: 12
  })

  new mapboxgl.Marker({ color: '#dc3545' })
    .setLngLat(coordinates)
    .setPopup(
      new mapboxgl.Popup().setText(
        `${title}\n${location}\n₹${price} / night`
      )
    )
    .addTo(map)

  map.on('error', event => {
    statusElement.textContent = `The map could not load: ${event.error.message}`
  })
})()
