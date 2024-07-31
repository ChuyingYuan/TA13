// Reference: 
// https://developers.google.com/maps/documentation/javascript/examples/layer-bicycling

let map;
let directionsRenderer
let directionsService;
let geocoder;
let response;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");

    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();
    geocoder = new google.maps.Geocoder();

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -37.8136, lng: 144.9631 },
        zoom: 14,
        mapTypeControl: false,
    });

    directionsRenderer.setMap(map);
}

window.displayRoute = function displayRoute() {
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    if (!start || !end) {
        alert('Please enter both start and end points.');
        return;
    }

    geocodeAddress(start, (startLocation) => {
        geocodeAddress(end, (endLocation) => {
            getDirections(startLocation, endLocation);
        });
    });
}

function geocodeAddress(address, callback) {
    geocoder.geocode({ 'address': address }, (results, status) => {
        if (status === 'OK') {
            const location = results[0].geometry.location;
            callback(location);
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}

function getDirections(startLocation, endLocation) {
    directionsService.route(
        {
            origin: startLocation,
            destination: endLocation,
            travelMode: google.maps.TravelMode.BICYCLING
        },
        (response, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);

                const routeInfo = response.routes[0];
                displayRouteInfo(routeInfo);
            } else {
                alert('Could not display directions due to: ' + status);
            }
        }
    );
}

function displayRouteInfo(route) {
    const routeInfoSection = document.getElementById("route");
    routeInfoSection.innerHTML = `
        <h5>Route Information</h5>
        <p><strong>Distance:</strong> ${route.legs[0].distance.text}</p>
        <p><strong>Duration:</strong> ${route.legs[0].duration.text}</p>
        <p><strong>Start Address:</strong> ${route.legs[0].start_address}</p>
        <p><strong>End Address:</strong> ${route.legs[0].end_address}</p>
    `;
}

initMap();