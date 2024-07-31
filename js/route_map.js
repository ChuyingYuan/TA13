// Reference: 
// https://developers.google.com/maps/documentation/directions/get-directions#DirectionsResponses

let map;
let directionsRenderer;
let directionsService;
let geocoder;
let allRoutes = [];
let polylineList = [];

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");

    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();
    geocoder = new google.maps.Geocoder();

    // Create a map centered at Melbourne CBD
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -37.8136, lng: 144.9631 },
        zoom: 15,
        mapTypeControl: false,
    });

    directionsRenderer.setMap(map);
}

// Function to display route between two locations (called from HTML)
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

// Function to geocode an address
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

// Function to get directions between two locations using the DirectionsService
function getDirections(startLocation, endLocation) {
    directionsService.route(
        {
            origin: startLocation,
            destination: endLocation,
            travelMode: google.maps.TravelMode.BICYCLING,
            provideRouteAlternatives: true
        },
        (response, status) => {
            if (status === 'OK') {
                console.log(response);
                allRoutes = response.routes;
                displayAllRoutes(allRoutes);
            } else {
                displayNoRoutesMessage();
            }
        }
    );
}

// Function to display all available routes
function displayAllRoutes(routes) {
    const routeInfoSection = document.getElementById("route");
    routeInfoSection.innerHTML = "<h5>Available Routes</h5>";

    if (routes.length === 0) {
        displayNoRoutesMessage();
        return;
    }

    // Clear previous polylines
    clearPolylines();

    routes.forEach((route, index) => {
        // Extract path from route
        const path = google.maps.geometry.encoding.decodePath(route.overview_polyline);

        // Add polyline to the map
        addPolylineToMap(path);

        const routeDiv = document.createElement("div");
        routeDiv.innerHTML = `
            <h6>Route ${index + 1}</h6>
            <p><strong>Distance:</strong> ${route.legs[0].distance.text}</p>
            <p><strong>Duration:</strong> ${route.legs[0].duration.text}</p>
            <button class="route-button" onclick="displayRouteInfo(${index})">View Details</button>
            <hr />
        `;
        routeInfoSection.appendChild(routeDiv);
    });
}

// Function to add a polyline to the map
function addPolylineToMap(path) {
    const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: "#457b9d",
        strokeOpacity: 0.6,
        strokeWeight: 5
    });

    polyline.setMap(map);
    polylineList.push(polyline);
}

// Function to clear all polylines from the map
function clearPolylines() {
    polylineList.forEach(polyline => polyline.setMap(null));
    polylineList = [];
}


// Function to display specific route information
window.displayRouteInfo = function displayRouteInfo(routeIndex) {
    const selectedRoute = allRoutes[routeIndex];
    if (!selectedRoute) {
        console.error('Selected route not found');
        return;
    }

    // Clear previous polylines
    clearPolylines();

    // Create and add polyline for the selected route
    const path = google.maps.geometry.encoding.decodePath(selectedRoute.overview_polyline);
    addPolylineToMap(path);

    // Update route information display
    const routeInfoSection = document.getElementById("route");
    routeInfoSection.innerHTML = `
        <h5>Route Information</h5>
        <p><strong>Distance:</strong> ${selectedRoute.legs[0].distance.text}</p>
        <p><strong>Duration:</strong> ${selectedRoute.legs[0].duration.text}</p>
        <p><strong>Start Address:</strong> ${selectedRoute.legs[0].start_address}</p>
        <p><strong>End Address:</strong> ${selectedRoute.legs[0].end_address}</p>
        <h6>Steps:</h6>
        <ol id="steps"></ol>
    `;
    displayRouteSteps(selectedRoute.legs[0].steps);
}

// Function to display steps of a route
function displayRouteSteps(steps) {
    const stepsList = document.getElementById("steps");
    stepsList.innerHTML = '';
    steps.forEach((step, index) => {
        const stepItem = document.createElement("li");
        stepItem.innerHTML = step.instructions;
        stepsList.appendChild(stepItem);
    });
}

// Function to display message when no routes are available
function displayNoRoutesMessage() {
    const routeInfoSection = document.getElementById("route");
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;
    routeInfoSection.innerHTML = `<p><strong>No available bicycle route from ${start} to ${end}.</strong></p>`;
}

// Function to start over the route planning
window.startOver = function startOver() {
    const startInput = document.getElementById('start');
    const endInput = document.getElementById('end');
    const routeSection = document.getElementById('route');

    if (startInput && endInput && routeSection) {
        startInput.value = '';
        endInput.value = '';
        routeSection.innerHTML = `
            <h4>Plan Your Journey</h4>
            <p>
                Enter the starting point and destination point to obtain route
                information.
            </p>
        `;

        // Reset map to default location and zoom level
        map.setCenter({ lat: -37.8136, lng: 144.9631 });
        map.setZoom(15);

        // Clear directions
        clearPolylines();
    } else {
        console.error('One or more elements not found for startOver function.');
    }
}

initMap();