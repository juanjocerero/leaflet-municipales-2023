const GEOCODE_API_KEY = 'AAPK00ab8e61ca7445d792d6ef5b8b02a968KoQR7hVu5sS7TSjrnVp9lFsHTSXNOYwWEngR1a8Nd0mKRKJh8HwaPcQM3IzYEuqS'

const geocodeAddress = colegio => {
  return new Promise((resolve, reject) => {
    L.esri.Geocoding.geocode({apikey: GEOCODE_API_KEY})
    .address(colegio.direccion).city('Granada, Spain').postal(colegio.cp)
    .run((error, results, response) => {
      
      if (error) {
        reject(error)
      }
      
      if (results) {
        resolve(_.first(results.results))
      }
      
      resolve(null)
    })
  })
}

const setLatLngs = async (colegios) => {
  return new Promise((resolve, reject) => {
    try {
      let result = colegios.map(async colegio => {
        colegio.geo = await geocodeAddress(colegio)

        return colegio
      })
      resolve(Promise.all(result))
    }
    catch (error) {
      reject(error)
    }
  })
}
