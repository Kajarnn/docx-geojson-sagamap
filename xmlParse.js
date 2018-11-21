const fs = require('fs');
const _ = require('underscore');
var xml2js = require('xml2js');
var request = require('request');
var levenshtein = require('fast-levenshtein');

if (process.argv.length < 4) {
	console.log('node xmlParse.js [input file] [output file] [place tag style name]');

	return;
}

var parser = new xml2js.Parser();

var argv = require('minimist')(process.argv.slice(2));

const PLACE_STYLES = {
	// Víga-Glúms saga
	style1: [
		'T8',
		'T9',
		'T2'
	],
	
	// Eyrbyggja saga
	// Gunnlaugs saga ormstungu
	// Hrafnkels saga
	// Kjalnesinga saga
	// Laxdæla saga
	// Njáls saga
	style2: [
		'T4'
	],

	// Flóamanna saga
	// Fóstbræðra saga
	// Harðar saga og Hólmverja
	// Hænsna Þóris saga
	// Vinlands saga
	style3: [
		'T5'
	],
	
	// Gísla saga
	style4: [
		'T10'
	],
	
	// Kormaks saga
	style5: [
		'T7'
	],
	
	// Króka Refs saga
	style6: [
		'T3'
	],

	// Reykdæla saga
	style7: [
		'T9',
		'T10'
	]
}

var PLACE_STYLE = PLACE_STYLES[process.argv[4]];

request('http://sagamap.hi.is/api/places', function(error, response, body) {
	var formatPlaceObj = function(asMentioned) {
		var placeObj = {
			as_mentioned: asMentioned
		};

		var foundPlaces = [];

		for (var i = 0; i<places.length; i++) {
			var place = places[i];

			var distance = levenshtein.get(asMentioned, place.name);
			if (distance < 4) {
				var clone = JSON.parse(JSON.stringify(place));
				clone.distance = distance;
				foundPlaces.push(clone);
			}
		}

		if (foundPlaces.length > 0) {
			foundPlaces.sort(function(a, b) {
				return b.distance-a.distance;
			})

			placeObj.sm_entry = foundPlaces[foundPlaces.length-1];
		}

		return placeObj;
	}

	var places = JSON.parse(body).data;

	console.log('Loaded places, length: '+places.length);

	fs.readFile(process.argv[2], function(err, fileData) {
		if (err) {
			console.log(err);
		}

		parser.parseString(fileData, function (err, result) {
			var doc = result['w:wordDocument'];
			var body = doc['w:body'];

			console.log(body[0]['w:p'][0]['w:r'][0]['w:t'][0])
			console.log(body[0]['w:p'].length)

			var processed = [];

			var currentChapter;

			_.each(doc['w:body'][0]['w:p'], function(p) {
				if (
					p['w:r'] && 
					p['w:r'].length == 1 && 
					p['w:r'][0]['w:t'] && 
					(
						p['w:r'][0]['w:t'][0].toLowerCase().indexOf('chapter') > -1 ||
						p['w:r'][0]['w:t'][0].toLowerCase().indexOf('kafli') > -1
					)
				) {
					currentChapter = p['w:r'][0]['w:t'][0];
					console.log(currentChapter);
				}
				else if (p['w:r']) {
					var pText = [];
					var places = [];
					var concepts = [];

					_.each(p['w:r'], function(r) {
						if (r['w:t']) {
							pText.push(r['w:t'][0]);

							if (
								r['w:rPr'] && 
								r['w:rPr'][0] && 
								r['w:rPr'][0]['w:rStyle'] && 
								PLACE_STYLE.indexOf(r['w:rPr'][0]['w:rStyle'][0].$['w:val']) > -1
							) {
								var placeObj = formatPlaceObj(r['w:t'][0]);

								places.push(placeObj);
							}
						}


						if (r['aml:annotation']) {
							_.each(r['aml:annotation'], function(a) {
								if (a['aml:content'] && a['aml:content'][0]) {
									var annotationText = _.filter(r['aml:annotation'][0]['aml:content'][0]['w:p'], function(ap) {
										return ap['w:r'] && ap['w:r'][0] && ap['w:r'][0]['w:t'];
									});

									if (annotationText.length > 0) {
										concepts.push(annotationText[0]['w:r'][0]['w:t'][0]);
									}
								}
							});
						}
					});

					if (concepts.length > 0) {
						if (pText.length > 0) {
							console.log(pText.join(' '));
						}
						if (places.length > 0) {
							console.log(places);
						}
						if (concepts.length > 0) {
							console.log(concepts);
						}

						processed.push({
							chapter: currentChapter,
							concepts: concepts,
							places: places,
							text: pText.join(' ')
						});

						console.log('---------------');
					}
				}
			});

			fs.writeFile(process.argv[3], JSON.stringify(processed, null, 4), function() {
				console.log(process.argv[2]+' parsed and written to '+process.argv[3]);
				console.log('Entries: '+processed.length);
			});
		});
	});
})
