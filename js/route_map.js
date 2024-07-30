// Reference: 
// https://developers.google.com/maps/documentation/javascript/examples/layer-bicycling

let map;

async function initMap() {
    const position = { lat: -37.8136, lng: 144.9631 };
    // Request needed libraries.
    const { Map } = await google.maps.importLibrary("maps");

    map = new Map(document.getElementById("map"), {
        zoom: 15,
        center: position,
    });

    const bikeLayer = new google.maps.BicyclingLayer();

    bikeLayer.setMap(map);
}

initMap();