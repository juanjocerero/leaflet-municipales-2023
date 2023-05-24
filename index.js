'use strict'

const capitalize = str => {
  return str
  .toLowerCase()
  .replace('(', '')
  .replace(')', '')
  .replace('-', ' ')
  .replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())))
}

const orderResultsByVotes = results => Object.fromEntries(Object.entries(results).sort(([,a],[,b]) => a-b).reverse())

const handleCircleColor = results => {
  let winnerParty = _.first(partidos.filter(p => p.partido === _.first(Object.keys(results))))

  return winnerParty.color
}

const getTooltipContent = colegio => {
  return `
  <div>
  <p class="nombre-colegio">${colegio.colegio}</p>
  <p class="direccion-colegio">${colegio.direccion}</p>
  <p class="mas-informacion">Pinche para ver el reparto de votos</p>
  </div>
  `
}

const getPopupContent = colegio => {

  const resultsContainer = document.createElement('div')
  resultsContainer.classList.add('recuento')

  if (isMobile.any) {
    let colegioNombre = document.createElement('p')
    colegioNombre.classList.add('recuento-colegio')
    colegioNombre.innerHTML = colegio.colegio

    resultsContainer.appendChild(colegioNombre)
  }


  for (let partido in colegio.results) {

    let paragraph = document.createElement('p')
    paragraph.classList.add('recuento-row')

    let partidoSpan = document.createElement('span')
    partidoSpan.classList.add(`recuento-${partido}`, 'recuento-partido')
    partidoSpan.innerText = partido

    let numberOfVotes = document.createElement('span')
    numberOfVotes.classList.add('vote-count')
    numberOfVotes.innerText = colegio.results[partido]

    paragraph.appendChild(partidoSpan)
    paragraph.appendChild(numberOfVotes)

    resultsContainer.appendChild(paragraph)

    let separator = document.createElement('hr');
    resultsContainer.appendChild(separator)
  }

  return resultsContainer.innerHTML
}

const aggregateResults = mesas => {
  if (!mesas.length) { return null }
  
  let results = { PSOE: 0, PP: 0, Vox: 0, Cs: 0, Adelante: 0 }
  
  // TODO: asignar correctamente las etiquetas de partidos e introducir los que faltan (Podemos e IU)
  _.each(mesas, mesa => {
    results.PSOE += mesa['PSOE-A']
    results.PP += mesa['PP']
    results.Vox += mesa['VOX']
    results.Cs += mesa['Cs']
    results.Adelante += mesa['ADELANTE']
  })
  
  return results
}

testData.map(resultadoMesa => {
  let matchingColegio = _.first(mesas.filter(e => 
    e.did === Number(resultadoMesa['Código de mesa'].split('-')[0]) && 
    e.secc === Number(resultadoMesa['Código de mesa'].split('-')[1]) &&
    e.mesa === resultadoMesa['Código de mesa'].split('-')[2]
    ))
    
    resultadoMesa.colegioNombre = matchingColegio?.colegio
  })
  
  const uniqColegios = _.uniqBy(mesas.map(e => {
    let obj = {
      colegio: e.colegio, 
      direccion: e.direccion, 
      distrito: e.dist,
      cp: e.cp,
      ccol: e.ccol
    }
    
    return obj
    
  }), 'colegio')
  
  const map = L.map('map', { maxZoom: 19 })
  
  L.tileLayer.provider('CartoDB.Positron').addTo(map)
  
  const searchControl = L.esri.Geocoding.geosearch({
    position: 'topright',
    placeholder: 'Busque una dirección o lugar',
    expanded: true,
    title: 'Busque su calle',
    providers: [
      L.esri.Geocoding.arcgisOnlineProvider({
        apikey: GEOCODE_API_KEY
      })
    ]
  }).addTo(map)
  
  const colegiosMarkers = []
  const colegiosAlreadyDrawn = []
  
  setLatLngs(uniqColegios).then(colegios => {
    
    _.each(colegios, colegio => {
      
      if (!colegiosAlreadyDrawn.includes(colegio.colegio)) {
        
        colegiosAlreadyDrawn.push(colegio.colegio)
        
        let matchingMesas = testData.filter(e => e.colegioNombre === colegio.colegio)
        let colegioResults = aggregateResults(matchingMesas)
        
        if (colegioResults) {
          colegio.results = orderResultsByVotes(colegioResults)
          colegio.popupContent = getPopupContent(colegio.results)

          // console.log(colegio)
        }
        
        if (colegio.geo) {
          let circle = L.circleMarker([colegio.geo.latlng.lat, colegio.geo.latlng.lng], {
            radius: 5,
            stroke: true,
            weight: 1,
            opacity: 0.7,
            color: colegio.results ? handleCircleColor(colegio.results) : '#969594',
            fillOpacity: 0.3,
            bubblingMouseEvents: false,
            colegio
          })
          circle.bindPopup(getPopupContent(colegio))
          
          // Handles automatic open and closing of popups and tooltips on desktop computers
          if (!isMobile.any) {
            circle.bindTooltip(getTooltipContent(colegio))
            circle.on('click', () => {
              circle.getTooltip().setOpacity(0)
            })
            circle.on('mouseover', () => {
              if (circle.isPopupOpen()) {
                circle.getTooltip().setOpacity(0)
              } else {
                circle.getTooltip().setOpacity(1)
              }
            })
          }
                    
          colegiosMarkers.push(circle)
          circle.addTo(map)
        }
      }
      
    })
    
    const bounds = new L.LatLngBounds(colegios.map(e => [e.geo.latlng.lat, e.geo.latlng.lng]))
    map.fitBounds(bounds)

    if (isMobile.any) {
      map.setView([map.getCenter().lat, map.getCenter().lng - 0.007], map.getZoom() + 1.4)
    } 
  })
  