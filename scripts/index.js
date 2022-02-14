const map = L.map('map', { zoomControl: false }).setView([46.803870426959264, -71.2422810190949], 7);
const apiKey = 'AAPK975a26147ed749f1af06d675f6973a9eKV7teihaNZb-1FzKv6CkXVCHntaZAr4O6v0k96WAn2kE_ae23NFNsyGQJIfw-TT6';

map.attributionControl.addAttribution('Simon Gravel &copy; 2022');
L.control.scale({ maxWidth: 250, imperial: false }).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

const url = (layer) => `https://servicescarto.mern.gouv.qc.ca/pes/rest/services/Territoire/TRQ_WMS/MapServer/${layer}`;

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

searchControl.on('results', (data) => {
	results.clearLayers();
	for (let i = data.results.length - 1; i >= 0; i--) {
		const lngLatString = `${Math.round(data.results[i].latlng.lng * 100000) / 100000}, ${
			Math.round(data.results[i].latlng.lat * 100000) / 100000
		}`;
		const marker = L.marker(data.results[i].latlng);
		marker.bindPopup(`<b>${lngLatString}</b><p>${data.results[i].properties.LongLabel}</p>`);
		results.addLayer(marker);
		marker.openPopup();
	}
});
