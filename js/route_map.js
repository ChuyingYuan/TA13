// Reference: 
// https://developers.google.com/maps/documentation/directions/get-directions#DirectionsResponses
// https://developers.google.com/maps/documentation/geocoding/requests-geocoding
// https://developers.google.com/maps/documentation/javascript/reference/coordinates
// https://developers.google.com/maps/documentation/javascript/reference/geometry#spherical

let map;
let directionsRenderer;
let directionsService;
let geocoder;
let allRoutes = [];
let polylineList = [];
let markerList = [];
let accidentsData = [];

// Fetch GeoJSON data
async function fetchGeoJson() {
    try {
        const response = await fetch('https://hm5wnvn96b.execute-api.ap-southeast-2.amazonaws.com/accident_data_access');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const geoJsonData = await response.json();
        accidentsData = geoJsonData.features;
        console.log("Fetched GeoJSON Data:", accidentsData);
    } catch (error) {
        console.error('Error fetching the GeoJSON data:', error);
    }
}



async function initMap() {
    await google.maps.importLibrary("maps");

    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();
    geocoder = new google.maps.Geocoder();

    // Create a map centered at Melbourne CBD
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -37.8136, lng: 144.9631 },
        zoom: 15,
        mapTypeControl: false,
        mapId: "a56f2a79b03a2c89",
    });

    directionsRenderer.setMap(map);

    await fetchGeoJson();
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

    // Clear previous route and markers
    clearPolylines();
    clearMarkers();

    routes.forEach((route, index) => {
        const path = google.maps.geometry.encoding.decodePath(route.overview_polyline);

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

// Function to display specific route information
window.displayRouteInfo = function displayRouteInfo(routeIndex) {
    const selectedRoute = allRoutes[routeIndex];
    if (!selectedRoute) {
        console.error('Selected route not found');
        return;
    }

    // Clear previous routes and markers
    clearPolylines();
    clearMarkers();

    // Create and add route for the selected route
    const path = google.maps.geometry.encoding.decodePath(selectedRoute.overview_polyline);
    addPolylineToMap(path);

    // Calculate and display accident statistics
    const accidentStats = calculateAccidentStats(path);

    // Display Risk Insights and Route Information
    const routeInfoSection = document.getElementById("route");
    routeInfoSection.innerHTML = `
        <h6><strong>Accident Statistics</strong></h6>
        <p><strong>Total Accidents Occured on the Selected Route:</strong> ${accidentStats.total}</p>
        <p><strong>Accidents Occurred on Weekday:</strong> ${accidentStats.weekdays}</p>
        <p><strong>Accidents Occurred on Weekend:</strong> ${accidentStats.weekends}</p>
        <hr />
        <h6><strong>Route Information</strong></h6>
        <p><strong>Distance:</strong> ${selectedRoute.legs[0].distance.text}</p>
        <p><strong>Duration:</strong> ${selectedRoute.legs[0].duration.text}</p>
        <p><strong>Start Address:</strong> ${selectedRoute.legs[0].start_address}</p>
        <p><strong>End Address:</strong> ${selectedRoute.legs[0].end_address}</p>
        <h6>Steps:</h6>
        <ol id="steps"></ol>
    `;
    displayRouteSteps(selectedRoute.legs[0].steps);
}

// Function to calculate accident statistics for a route
function calculateAccidentStats(routePath) {
    // Maximum distance (in meters) from the route
    const MAX_DISTANCE_METERS = 15;

    // Filter accidents within a certain distance from the route path
    const accidentsInRange = accidentsData.filter(accident => {
        const accidentLocation = new google.maps.LatLng(accident.geometry.coordinates[1], accident.geometry.coordinates[0]);

        // Check if the accident is close to any segment of the route path
        for (let i = 0; i < routePath.length - 1; i++) {
            const segmentStart = routePath[i];
            const segmentEnd = routePath[i + 1];
            const distanceToSegment = calculateDistanceToSegment(accidentLocation, segmentStart, segmentEnd);

            if (distanceToSegment <= MAX_DISTANCE_METERS) {
                return true;
            }
        }
        return false;
    });

    const totalAccidents = accidentsInRange.length;
    let weekdays = 0;
    let weekends = 0;

    accidentsInRange.forEach(accident => {
        const accidentWeekday = accident.properties.DAY_OF_WEEK;
        if (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(accidentWeekday)) {
            weekdays += 1;
        } else {
            weekends += 1;
        }

        // Add markers for accidents on the route
        const accidentLocation = new google.maps.LatLng(accident.geometry.coordinates[1], accident.geometry.coordinates[0]);
        const marker = new google.maps.Marker({
            position: accidentLocation,
            map: map,
        });
        markerList.push(marker);
    });

    return {
        total: totalAccidents,
        weekdays: weekdays,
        weekends: weekends
    };
}

// Function to project a point onto a line segment
function projectPointOntoLineSegment(point, segmentStart, segmentEnd) {
    const lineSegmentLengthSquared = calculateDistance(segmentStart, segmentEnd) ** 2;
    if (lineSegmentLengthSquared === 0) {
        return segmentStart;
    }

    const t = ((point.lat() - segmentStart.lat()) * (segmentEnd.lat() - segmentStart.lat()) +
        (point.lng() - segmentStart.lng()) * (segmentEnd.lng() - segmentStart.lng())) /
        lineSegmentLengthSquared;

    if (t < 0) {
        return segmentStart;
    } else if (t > 1) {
        return segmentEnd;
    }

    return new google.maps.LatLng(
        segmentStart.lat() + t * (segmentEnd.lat() - segmentStart.lat()),
        segmentStart.lng() + t * (segmentEnd.lng() - segmentStart.lng())
    );
}

// Function to calculate the distance between two points
function calculateDistance(latLng1, latLng2) {
    return google.maps.geometry.spherical.computeDistanceBetween(latLng1, latLng2);
}

// Function to calculate the distance from a point to a line segment
function calculateDistanceToSegment(point, segmentStart, segmentEnd) {
    const projection = projectPointOntoLineSegment(point, segmentStart, segmentEnd);
    return calculateDistance(point, projection);
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

// Function to clear all routes from the map
function clearPolylines() {
    polylineList.forEach(polyline => polyline.setMap(null));

    polylineList = [];
}

// Function to clear all accident markers from the map
function clearMarkers() {
    markerList.forEach(marker => marker.setMap(null));
    markerList = [];
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

        // Reset map to default location (Melbourne CBD) and zoom level
        map.setCenter({ lat: -37.8136, lng: 144.9631 });
        map.setZoom(15);

        // Clear routes and markers
        clearPolylines();
        clearMarkers();
    } else {
        console.error('One or more elements not found for startOver function.');
    }
}

initMap();