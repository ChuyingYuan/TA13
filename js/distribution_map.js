// Reference: 
// https://developers.google.com/maps/documentation/javascript/examples/boundaries-choropleth
// https://developers.google.com/maps/documentation/javascript/examples/boundaries-click
// https://developers.google.com/chart/interactive/docs/gallery/columnchart

let map;

async function initMap() {
    const position = { lat: -37.8136, lng: 144.9631 };
    // Request needed libraries.
    const { Map } = await google.maps.importLibrary("maps");

    map = new Map(document.getElementById("map"), {
        zoom: 15,
        center: position,
        mapId: "DEMO_MAP_ID",
    });
}

initMap();

// // TODO: Add a feature layer to the map that displays the "Geospatial Distribution" feature type.   
// async function initMap() {
//     // Request needed libraries.
//     const { Map } = await google.maps.importLibrary("maps");
//     const map = new Map(document.getElementById("map"), {
//         center: { lat: -37.8136, lng: 144.9631 },
//         zoom: 15,
//         // In the cloud console, configure this Map ID with a style that enables the
//         // "Geospatial Distribution" feature layer.
//         mapId: "MAP_ID",
//     });
//     const featureLayer = map.getFeatureLayer(
//         google.maps.FeatureType.Geospatial_Distribution,
//     );

//     featureLayer.style = (featureStyleFunctionOptions) => {
//         const placeFeature = featureStyleFunctionOptions.feature;
//         const accident = regions[placeFeature.placeId];
//         let fillColor;

//         // Specify colors using any of the following:
//         // * Named ('green')
//         // * Hexadecimal ('#FF0000')
//         // * RGB ('rgb(0, 0, 255)')
//         // * HSL ('hsl(60, 100%, 50%)')
//         if (accident < 2000000) {
//             fillColor = "green";
//         } else if (accident < 5000000) {
//             fillColor = "red";
//         } else if (accident < 10000000) {
//             fillColor = "blue";
//         } else if (accident < 40000000) {
//             fillColor = "yellow";
//         }
//         return {
//             fillColor,
//             fillOpacity: 0.5,
//         };
//     };

//     // TODO: Number of Accidents in each region
//     const regions = {
//         "ChIJdf5LHzR_hogR6czIUzU0VV4": 5039877, // Alabama
//         "ChIJG8CuwJzfAFQRNduKqSde27w": 732673, // Alaska
//         "ChIJaxhMy-sIK4cRcc3Bf7EnOUI": 7276316, // Arizona
//         "ChIJYSc_dD-e0ocR0NLf_z5pBaQ": 3025891, // Arkansas
//         "ChIJPV4oX_65j4ARVW8IJ6IJUYs": 39237836, // California
//         "ChIJt1YYm3QUQIcR_6eQSTGDVMc": 5812069, // Colorado
//     };
// }

// initMap();