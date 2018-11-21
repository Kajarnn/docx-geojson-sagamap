# Docx (xml) parser for The Icelandic Saga map
This utility converts annotated xml document exported from Microsoft Word to geojson file.

In this example we are using LibreOffice Writer 6.0.2.1. The processing scripts are written in JavaScript and require Node.js to run.

To set up all dependencies run `npm install`.

## Exporting .docx as .xml
First we need to open the Word documents in Writer and save them in different format. The format we select is "Microsoft Word 2003 XML". This will export tagged places as well as annotations used to tag paragraphs with concepts in the documents.

## Converting .xml to .json
Next step is to convert the xml files to json. This is done using the following command: `node xmlParse [input.xml] [output.json] [place tag style]`

One problem here is that the style name used for the place names in the exported xml files can differ although the same style appears to be using when working with the files in Microsoft Word. In the `xmlParse.js` file I have mapped style names for all the sagas and grouped them under a style ID. In the example below we see that Víga-Glúms saga uses T2, T8 and T9 as style names.

```javascript
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
  [...]
}
```

When converting each xml file, the right style name has to be indicated as the last parameter of `xmlParse.js`.

### Fetching geo data
The `xmlParse.js` file also fetches geo data for each place entry by looking up place names in the Saga map database using the http://sagamap.hi.is/api/places API endpoint. Due to different inflectional forms of the place names in the texts, each place name in the text is determined by looking for similar place name in the database with levenshtein distance between the two place names is lower than 4. This of course can give us wrong results but in majority of cases it's the results is right. A better method would be to add the place ID's to the Word documents in the beginning.
