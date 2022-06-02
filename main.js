// Wettervorhersage Beispiel

// Hintergrundlayer Satellitenbild
let startLayer = L.tileLayer.provider("Esri.WorldImagery")

// Blick auf Innsbruck
const map = L.map("map", {
    center: [47.267222, 11.392778],
    zoom: 5,
    layers: [
        startLayer
    ]
});

// Overlays für Wind- und Wettervorhersage
const overlays = {
    "wind": L.featureGroup().addTo(map),
    "weather": L.featureGroup().addTo(map),
};

// Layer control mit Satellitenbild
const layerControl = L.control.layers({
    "Satellitenbild": startLayer
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false
}).addTo(map);

// Datum formatieren
let formatDate = function (date) {
    return date.toLocaleDateString("de-AT", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
        //woher weiß ich das? > s. HowTo - Mozilla.org
    }) + "Uhr";
};

// Windvorhersage
async function loadWind(url) {
    const response = await fetch(url);
    const jsondata = await response.json();
    //console.log("geoJsonData:", jsondata);
    //console.log("Zeitpunkt Erstellung:", jsondata[0].header.refTime); // erstes Array [0] im header Attribut=refTime reftime aus Datenelement holen
    //console.log("Zeitpunkt Gültigkeit:", jsondata[0].header.forecastTime);

    let forecastDate = new Date(jsondata[0].header.refTime);
    //console.log("Echtes Datum Erstellung:", forecastDate);
    forecastDate.setHours(forecastDate.getHours() + jsondata[0].header.forecastTime); // falls über Mitternacht --> nächster Tag > Anpassung, sodass es stimmt
    //console.log("Echtes Datum Gültigkeit:", forecastDate);
    //console.log("Vorhersagezeitpunkt", formatDate(forecastDate));

    let forecastLabel = formatDate(forecastDate);
    layerControl.addOverlay(overlays.wind, `ECMWF Windvorhersage für ${forecastLabel}`)

    // Daten aufrufen aus dist-Ordner
    L.velocityLayer({
        data: jsondata,
        lineWidth: 3,
        displayOptions: {
            velocityType: "",
            directionString: "Windrichtung",
            speedString: "Windgeschwindigkeit",
            speedUnit: "k/h",
            emptyString: "keine Daten vorhanden",
            position: "bottomright",
        }
    }).addTo(overlays.wind);
};
loadWind("https://geographie.uibk.ac.at/webmapping/ecmwf/data/wind-10u-10v-europe.json");

// Wettervorhersage
layerControl.addOverlay(overlays.weather, "Wettervorhersage met. no");
let marker = L.circleMarker([
    47.267222, 11.392778 // s. URL loadWeather
]).bindPopup("Wettervorhersage").addTo(overlays.weather);

async function loadWeather(url) {
    const response = await fetch(url);
    const jsondata = await response.json();
    // console.log("geoJsonData:", jsondata);

    // Marker positionieren
    marker.setLatLng([
        jsondata.geometry.coordinates[1],
        jsondata.geometry.coordinates[0]
    ]);

    let details = jsondata.properties.timeseries[0].data.instant.details;
    // s. json-File Wetterdaten timeseries - 0 bedeutet erster Wert aufgerufen wird = aktuellster, da die letzten überschrieben werden
    //console.log("Aktuelle Wetterdaten", details);
    
    let forecastDate = new Date(jsondata.properties.timeseries[0].time);
    console.log(forecastDate);
    let forecastLabel = formatDate(forecastDate);
    console.log("aktuelle Werte", forecastLabel);

    let popup = `
    <strong>Wettervorhersage für ${forecastLabel}</strong>
    <ul>
    <li> Luftdruck: ${details.air_pressure_at_sea_level} (hPa), </li>
    <li> Lufttemperatur: ${details.air_temperature} (°C), </li>
    <li> Bewölkung: ${details.cloud_area_fraction} (%), </li>
    <li> Niederschlag: ${details.precipitation_amount} (mm), </li>
    <li> rel. Luftfeuchtigkeit: ${details.relative_humidity} (%), </li>
    <li> Windrichtung: ${details.wind_from_direction} (°), </li>
    <li> Windgeschwindigkeit: ${details.wind_speed * 3.6} (km/h) </li>
    </ul>
    `;

    marker.setPopupContent(popup).openPopup();


};
loadWeather("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=47.267222&lon=11.392778");