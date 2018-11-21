const fs = require('fs');
const _ = require('underscore');

if (process.argv.length < 4) {
	console.log('node createGeoJson.js [input file] [output file] --saga_name=[saga name] --saga_id=[saga id]');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

var sagaName = argv.saga_name;
var sagaId = argv.saga_id;

var actionRange = argv.action ? argv.action.split('-') : '';
var compositionRange = argv.composition ? argv.composition.split('-') : '';
var manuscriptRange = argv.manuscript_time ? argv.manuscript_time.split('-') : '';
var oldestManuscript = argv.oldest_manuscript;
var oldestManuscriptRange = argv.oldest_manuscript_time ? argv.oldest_manuscript_time.split('-') : '';
var manuscriptLink = argv.manuscript_link;

fs.readFile(process.argv[2], function(err, fileData) {
	if (err) {
		console.log(err);
	}

	var data = JSON.parse(fileData);

	var geoJson = {
		type: 'FeatureCollection',
		features: []
	};

	_.each(data, function(item) {
		if (item.places && item.places.length > 0) {
			_.each(item.concepts, function(concept) {
				_.each(item.places, function(place) {
					if (place.sm_entry) {
						var feature = {
							type: 'Feature',
							properties: {
								id: place.sm_entry.id,
								name: place.sm_entry.name,
								sagaid: sagaId,
								saganame: sagaName,
								type: place.type,
								chapter: item.chapter,
								concept: concept,
								text: item.text,
		
								action_start: actionRange[0],
								action_end: actionRange[1],
								composition_start: compositionRange[0],
								composition_end: compositionRange[1],
								oldest_manuscript: oldestManuscript,
								oldest_manuscript_start: oldestManuscriptRange[0],
								oldest_manuscript_end: oldestManuscriptRange[1],
								manuscript_link: manuscriptLink
							},
							geometry: {
								type: 'Point',
								coordinates: [
									Number(place.sm_entry.lng),
									Number(place.sm_entry.lat)
								]
							}
						};

						geoJson.features.push(feature);
					}
				});
			});
		}
	});


	fs.writeFile(process.argv[3], JSON.stringify(geoJson, null, 4), function() {
		console.log(process.argv[2]+' converted to GeoJSON and written to '+process.argv[3]);
		console.log('Entries: '+geoJson.features.length);
	});
});
