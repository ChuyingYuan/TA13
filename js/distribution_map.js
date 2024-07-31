// Reference: 
// https://developers.google.com/maps/documentation/javascript/examples/boundaries-choropleth
// https://developers.google.com/maps/documentation/javascript/examples/boundaries-click
// https://developers.google.com/chart/interactive/docs/gallery/columnchart

let map;
let featureLayer;
let lastInteractedFeatureIds = [];
let lastClickedFeatureIds = [];

function handleClick(/* MouseEvent */ e) {
    lastClickedFeatureIds = e.features.map((f) => f.placeId);
    lastInteractedFeatureIds = [];
    featureLayer.style = applyStyle;
    displayChart(e);
}

function handleMouseMove(/* MouseEvent */ e) {
    lastInteractedFeatureIds = e.features.map((f) => f.placeId);
    featureLayer.style = applyStyle;
}

async function initMap() {
    // Request needed libraries.
    const { Map } = await google.maps.importLibrary("maps");

    map = new Map(document.getElementById("map"), {
        center: { lat: 39.23, lng: -105.73 },
        zoom: 8,
        // In the cloud console, configure your Map ID with a style that enables the
        // 'Administrative Area Level 2' Data Driven Styling type.
        mapId: "a3efe1c035bad51b", // Substitute your own map ID.
        mapTypeControl: false,
    });

    // TODO: Add a feature layer to the map that displays the "Geospatial Distribution" feature type.   
    // Add the feature layer
    //@ts-ignore
    featureLayer = map.getFeatureLayer(google.maps.FeatureType.ADMINISTRATIVE_AREA_LEVEL_2);

    // Add the event listeners for the feature layer
    featureLayer.addListener("click", handleClick);
    featureLayer.addListener("mousemove", handleMouseMove);

    // Map event listener
    map.addListener("mousemove", () => {
        // If the map gets a mousemove, that means there are no feature layers
        // with listeners registered under the mouse, so we clear the last
        // interacted feature ids.
        if (lastInteractedFeatureIds?.length) {
            lastInteractedFeatureIds = [];
            featureLayer.style = applyStyle;
        }
    });
    // Apply style on load, to enable clicking.
    featureLayer.style = applyStyle;
}

// Helper function for displaying distribution column chart
async function displayChart(event) {
    let feature = event.features[0];

    if (!feature.placeId) return;

    google.charts.load("current", { packages: ['corechart'] });
    google.charts.setOnLoadCallback(drawChart);
}

// Define styles.
// Stroke and fill with minimum opacity value.
const styleDefault = {
    strokeColor: "#810FCB",
    strokeOpacity: 1.0,
    strokeWeight: 2.0,
    fillColor: "white",
    fillOpacity: 0.1, // Polygons must be visible to receive events.
};
// Style for the clicked polygon.
const styleClicked = {
    ...styleDefault,
    fillColor: "#810FCB",
    fillOpacity: 0.5,
};
// Style for polygon on mouse move.
const styleMouseMove = {
    ...styleDefault,
    strokeWeight: 4.0,
};

// Apply styles using a feature style function.
function applyStyle(/* FeatureStyleFunctionOptions */ params) {
    const placeId = params.feature.placeId;

    //@ts-ignore
    if (lastClickedFeatureIds.includes(placeId)) {
        return styleClicked;
    }

    //@ts-ignore
    if (lastInteractedFeatureIds.includes(placeId)) {
        return styleMouseMove;
    }
    return styleDefault;
}

// google.charts.load("current", { packages: ['corechart'] });
// google.charts.setOnLoadCallback(drawChart);

function drawChart() {
    // TODO: fetch data from backend
    var data = google.visualization.arrayToDataTable([
        ["Accidents", "Case", { role: "style" }],
        ["Mild", 65, "color: #2280ff"],
        ["Severe", 16, "color: #20BFF7"],
        ["Fatal", 18, "color: #FFBC99"]
    ]);

    var options = {
        height: 500,
        bar: { groupWidth: "90%" },
        legend: { position: "none" },
        backgroundColor: { fill: '#f4f4f4' },
    };

    var chart = new google.visualization.ColumnChart(document.getElementById("chart"));
    chart.draw(data, options);
}

initMap();