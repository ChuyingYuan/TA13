let map;
let directionsRenderer;
let directionsService;
let geocoder;
let allRoutes = [];
let polylineList = [];
let markerList = [];
let accidentsData = [];
let autocompleteStart;
let autocompleteEnd;

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
    await google.maps.importLibrary("places");

    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();
    geocoder = new google.maps.Geocoder();

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -37.8136, lng: 144.9631 },
        zoom: 15,
        mapTypeControl: false,
        mapId: "a56f2a79b03a2c89",
    });

    directionsRenderer.setMap(map);

    const startInput = document.getElementById('start');
    const endInput = document.getElementById('end');
    const options = {
        componentRestrictions: { country: 'au' }
    };
    autocompleteStart = new google.maps.places.Autocomplete(startInput, options);
    autocompleteEnd = new google.maps.places.Autocomplete(endInput, options);

    await fetchGeoJson();
}

function isPlaceInMelbourne(place) {
    const melbourneNeighborhoods = [
        'Carlton', 'Carlton North', 'Docklands', 'East Melbourne', 'Flemington',
        'Hotham Hill', 'Kensington', 'Melbourne', 'Melbourne West', 'North Melbourne',
        'Parkville', 'Port Melbourne', 'South Yarra', 'Southbank'
    ];

    const addressComponents = place.address_components;

    for (let i = 0; i < addressComponents.length; i++) {
        for (let j = 0; j < addressComponents[i].types.length; j++) {
            if (addressComponents[i].types[j] === "locality" || addressComponents[i].types[j] === "sublocality") {
                if (melbourneNeighborhoods.includes(addressComponents[i].long_name)) {
                    return true;
                }
            }
        }
    }

    return false;
}

window.displayRoute = function displayRoute() {
    const startPlace = autocompleteStart.getPlace();
    const endPlace = autocompleteEnd.getPlace();

    const routeInfoSection = document.getElementById("route");
    routeInfoSection.innerHTML = "";

    if (!startPlace || !endPlace || !startPlace.geometry || !endPlace.geometry) {
        alert('Please select valid start and end points from the suggestions.');
        return;
    }

    if (!isPlaceInMelbourne(startPlace) || !isPlaceInMelbourne(endPlace)) {
        routeInfoSection.innerHTML = "<p><strong>Sorry, our platform is focusing on the Melbourne CBD area only.</strong></p>";
        return;
    }

    const startLocation = startPlace.geometry.location;
    const endLocation = endPlace.geometry.location;

    getDirections(startLocation, endLocation);
}

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

function displayAllRoutes(routes) {
    const routeInfoSection = document.getElementById("route");
    routeInfoSection.innerHTML = "<h5>Available Routes</h5>";

    if (routes.length === 0) {
        displayNoRoutesMessage();
        return;
    }

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

window.displayRouteInfo = function displayRouteInfo(routeIndex) {
    const selectedRoute = allRoutes[routeIndex];
    if (!selectedRoute) {
        console.error('Selected route not found');
        return;
    }

    clearPolylines();
    clearMarkers();

    const path = google.maps.geometry.encoding.decodePath(selectedRoute.overview_polyline);
    addPolylineToMap(path);

    const accidentStats = calculateAccidentStats(path);

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

function calculateAccidentStats(routePath) {
    const MAX_DISTANCE_METERS = 15;

    const accidentsInRange = accidentsData.filter(accident => {
        const accidentLocation = new google.maps.LatLng(accident.geometry.coordinates[1], accident.geometry.coordinates[0]);

        for (let i = 1; i < routePath.length; i++) {
            const segmentStart = routePath[i - 1];
            const segmentEnd = routePath[i];

            if (calculateDistanceToSegment(accidentLocation, segmentStart, segmentEnd) <= MAX_DISTANCE_METERS) {
                return true;
            }
        }

        return false;
    });

    let totalAccidents = 0;
    let weekdays = 0;
    let weekends = 0;

    accidentsInRange.forEach(accident => {
        totalAccidents++;
        const accidentDate = new Date(accident.properties.Accident_Date);
        const dayOfWeek = accidentDate.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekends++;
        } else {
            weekdays++;
        }

        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(accident.geometry.coordinates[1], accident.geometry.coordinates[0]),
            map: map,
            title: accident.properties.Accident_Type,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 5,
                fillColor: "#FF0000",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 1
            }
        });
        markerList.push(marker);
    });

    return {
        total: totalAccidents,
        weekdays: weekdays,
        weekends: weekends
    };
}

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

function calculateDistance(latLng1, latLng2) {
    return google.maps.geometry.spherical.computeDistanceBetween(latLng1, latLng2);
}

function calculateDistanceToSegment(point, segmentStart, segmentEnd) {
    const projection = projectPointOntoLineSegment(point, segmentStart, segmentEnd);
    return calculateDistance(point, projection);
}

function displayRouteSteps(steps) {
    const stepsList = document.getElementById("steps");
    stepsList.innerHTML = '';
    steps.forEach((step, index) => {
        const stepItem = document.createElement("li");
        stepItem.innerHTML = step.instructions;
        stepsList.appendChild(stepItem);
    });
}

function displayNoRoutesMessage() {
    const routeInfoSection = document.getElementById("route");
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;
    routeInfoSection.innerHTML = `<p><strong>No available bicycle route from ${start} to ${end}.</strong></p>`;
}

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

function clearPolylines() {
    polylineList.forEach(polyline => polyline.setMap(null));
    polylineList = [];
}

function clearMarkers() {
    markerList.forEach(marker => marker.setMap(null));
    markerList = [];
}

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

        map.setCenter({ lat: -37.8136, lng: 144.9631 });
        map.setZoom(15);

        clearPolylines();
        clearMarkers();
    } else {
        console.error('One or more elements not found for startOver function.');
    }
}

initMap();