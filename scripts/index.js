const map = L.map('map', { zoomControl: false });
const apiKey = 'AAPK975a26147ed749f1af06d675f6973a9eKV7teihaNZb-1FzKv6CkXVCHntaZAr4O6v0k96WAn2kE_ae23NFNsyGQJIfw-TT6';

map.attributionControl.addAttribution('Simon Gravel &copy; 2022');

L.control.scale({ maxWidth: 250, imperial: false }).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Géolocalisation
map.locate({ setView: true, maxZoom: 16 });
map.on('locationfound', (e) => L.marker(e.latlng).addTo(map).bindPopup('Vous êtes ici.').openPopup());

const url = (layer) => `https://servicescarto.mern.gouv.qc.ca/pes/rest/services/Territoire/TRQ_WMS/MapServer/${layer}`;

// Style de base des poly
const featureStyle = (color) => ({
	color: color,
	weight: 2,
});

const basemaps = {
	'Charted Territory': L.esri.Vector.vectorBasemapLayer('ArcGIS:ChartedTerritory', { apiKey: apiKey }).addTo(map),
	Imagery: L.esri.Vector.vectorBasemapLayer('ArcGIS:Imagery', { apiKey: apiKey }).addTo(map),
	Navigation: L.esri.Vector.vectorBasemapLayer('ArcGIS:Navigation', { apiKey: apiKey }).addTo(map),
	Topographic: L.esri.Vector.vectorBasemapLayer('ArcGIS:Topographic', { apiKey: apiKey }).addTo(map),
};

const overlays = {
	'<span class="legende darkgreen">Parc national du Québec</span>': L.esri
		.featureLayer({
			url: url(5),
			style: () => featureStyle('darkgreen'),
		})
		.addTo(map),
	'<span class="legende red">Parc national du Canada</span>': L.esri
		.featureLayer({
			url: url(4),
			style: () => featureStyle('red'),
		})
		.addTo(map),
	'<span class="legende darkblue">Parc marin</span>': L.esri
		.featureLayer({
			url: url(3),
			style: () => featureStyle('darkblue'),
		})
		.addTo(map),
	'<span class="legende orange">Parc régional</span>': L.esri
		.featureLayer({
			url: url(6),
			style: () => featureStyle('orange'),
		})
		.addTo(map),
	'<span class="legende turquoise">Réserve faunique</span>': L.esri
		.featureLayer({
			url: url(11),
			style: () => featureStyle('turquoise'),
		})
		.addTo(map),
};
L.control.layers(basemaps, overlays, { collapsed: true }).addTo(map);

// Recherche
const searchControl = L.esri.Geocoding.geosearch({
	position: 'topright',
	placeholder: 'Entrer une adresse ou un endroit',
	useMapBounds: false,
	providers: [
		L.esri.Geocoding.arcgisOnlineProvider({
			apikey: apiKey,
			nearby: {
				lat: 46.8,
				lng: -71.24,
			},
		}),
	],
}).addTo(map);

const results = L.layerGroup().addTo(map);

// Météo
const urlMeteo = (lat, lon) =>
	`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=71120fe8a00794d729e3665fde5601b5`;

searchControl.on('results', (data) => {
	results.clearLayers();
	for (let i = data.results.length - 1; i >= 0; i--) {
		const lngLatString = `${Math.round(data.results[i].latlng.lng * 100000) / 100000}, ${
			Math.round(data.results[i].latlng.lat * 100000) / 100000
		}`;
		const marker = L.marker(data.results[i].latlng);

		const latLonSplit = lngLatString.split(',');

		asyncMeteo(latLonSplit[0], latLonSplit[1].trim()).then((dataMeteo) => {
			console.log(dataMeteo);
			marker.bindPopup(`
						<p>${lngLatString}</p>
						<div class='meteo'>
							<h3>Météo</h3>							
    						<img src=http://openweathermap.org/img/w/${dataMeteo.weather[0].icon}.png>
							<p>${dataMeteo.weather[0].description}</p>
							<p>${dataMeteo.main.temp} C&deg;</p>
							<p>Ressentie : ${dataMeteo.main.feels_like} C&deg;</p>
						</div>						
						<p>${data.results[i].properties.LongLabel}</p>`);
			results.addLayer(marker);
			marker.openPopup();
		});
	}
});

const asyncMeteo = async (lat, lon) => await (await fetch(urlMeteo(lat, lon))).json();

// function afficheMeteo(lat, lon) {
// 	fetch(urlMeteo(lat, lon))
// 		.then((res) => res.json())
// 		.then((data) => console.log(data));
// }

// afficheMeteo(35, 136);
