const map = L.map('map', { zoomControl: false });
const apiKey = 'AAPK975a26147ed749f1af06d675f6973a9eKV7teihaNZb-1FzKv6CkXVCHntaZAr4O6v0k96WAn2kE_ae23NFNsyGQJIfw-TT6';

map.attributionControl.addAttribution('Simon Gravel &copy; 2022');

L.control.scale({ maxWidth: 250, imperial: false }).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Get météo
const urlMeteo = (lat, lon) =>
	`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=71120fe8a00794d729e3665fde5601b5`;

const asyncMeteo = async (lat, lon) => await (await fetch(urlMeteo(lat, lon))).json();

// Géolocalisation
map.locate({ setView: true, maxZoom: 16 });
map.on('locationfound', (e) => {
	asyncMeteo(e.latlng.lat, e.latlng.lng).then((dataMeteo) => {
		L.marker(e.latlng)
			.addTo(map)
			.bindPopup(
				`
				<p>Vous êtes ici.</p>
				<p>${e.latlng.lat}, ${e.latlng.lng}</p>
				<div class='meteo'>
					<h3>Météo</h3>							
    				<img src=http://openweathermap.org/img/w/${dataMeteo.weather[0].icon}.png>
					<p>${dataMeteo.weather[0].description}</p>
					<p>${dataMeteo.main.temp} C&deg;</p>
					<p>Ressentie : ${dataMeteo.main.feels_like} C&deg;</p>
				</div>						
				`
			)
			.openPopup();
	});
});

const urlParcs = (layer) =>
	`https://servicescarto.mern.gouv.qc.ca/pes/rest/services/Territoire/TRQ_WMS/MapServer/${layer}`;

const urlRegions = 'https://servicescarto.mern.gouv.qc.ca/pes/rest/services/Territoire/SDA_WMS/MapServer/0';

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
	'<span class="legende black">Régions administratives</span>': L.esri
		.featureLayer({
			url: urlRegions,
			style: () => ({
				weight: 2,
				color: 'black',
				opacity: 0.25,
				fillColor: 'transparent',
			}),
		})
		.addTo(map),
	'<span class="legende darkgreen">Parc national du Québec</span>': L.esri
		.featureLayer({
			url: urlParcs(5),
			style: () => featureStyle('darkgreen'),
		})
		.addTo(map),
	'<span class="legende red">Parc national du Canada</span>': L.esri
		.featureLayer({
			url: urlParcs(4),
			style: () => featureStyle('red'),
		})
		.addTo(map),
	'<span class="legende darkblue">Parc marin</span>': L.esri
		.featureLayer({
			url: urlParcs(3),
			style: () => featureStyle('darkblue'),
		})
		.addTo(map),
	'<span class="legende orange">Parc régional</span>': L.esri
		.featureLayer({
			url: urlParcs(6),
			style: () => featureStyle('orange'),
		})
		.addTo(map),
	'<span class="legende turquoise">Réserve faunique</span>': L.esri
		.featureLayer({
			url: urlParcs(11),
			style: () => featureStyle('turquoise'),
		})
		.addTo(map),
};
L.control.layers(basemaps, overlays, { collapsed: true }).addTo(map);

// "Tooltip"
// J'ai eu du trouble avec getLatLng() pour trouver le centre... Solution alternative
function gererTooltip() {
	const tooltip = document.querySelector('#tooltip');

	if (tooltip.innerHTML === '') {
		tooltip.style.display = 'none';
	}

	Object.values(overlays).map((overlay) => {
		overlay.on('mouseover', (e) => {
			const props = e.layer.feature.properties;

			if (props.RES_NM_REG) {
				tooltip.style.display = 'block';
				tooltip.innerHTML = props.RES_NM_REG;
			}

			if (props.TRQ_NM_TER) {
				tooltip.style.display = 'block';
				tooltip.innerHTML = props.TRQ_NM_TER;
			}
		});
	});
}
gererTooltip();

const results = L.layerGroup().addTo(map);
let clickMarker = {};
map.on('click', (e) => {
	if (clickMarker != undefined) {
		results.clearLayers();
		map.removeLayer(clickMarker);
	}

	const lat = e.latlng.lat;
	const lng = e.latlng.lng;
	const emplacement = document.querySelector('#tooltip').innerHTML;

	console.log(emplacement);

	clickMarker = new L.marker(e.latlng).addTo(map);

	asyncMeteo(lat, lng).then((data) => {
		console.log(data);
		clickMarker
			.bindPopup(
				`
				<p>${emplacement}</p>
				<div class='meteo'>
					<h3>Météo</h3>							
					<img src=http://openweathermap.org/img/w/${data.weather[0].icon}.png>
					<p>${data.weather[0].description}</p>
					<p>${data.main.temp} C&deg;</p>
					<p>Ressentie : ${data.main.feels_like} C&deg;</p>
				</div>
				`
			)
			.openPopup();
	});
});

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
			marker.bindPopup(
				`
				<p>${data.results[i].properties.LongLabel}</p>
				<div class='meteo'>
					<h3>Météo</h3>							
    				<img src=http://openweathermap.org/img/w/${dataMeteo.weather[0].icon}.png>
					<p>${dataMeteo.weather[0].description}</p>
					<p>${dataMeteo.main.temp} C&deg;</p>
					<p>Ressentie : ${dataMeteo.main.feels_like} C&deg;</p>
				</div>						
				`
			);
			results.addLayer(marker);
			marker.openPopup();
		});
	}
});
