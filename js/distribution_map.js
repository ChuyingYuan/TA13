// Reference: 
// https://developers.google.com/maps/documentation/javascript/examples/circle-simple
// https://developers.google.com/maps/documentation/javascript/shapes#circles
// https://developers.google.com/chart/interactive/docs/gallery/barchart

let map;
let roadAccidentData = {};
let activeCircle = null;

// Fetch GeoJSON data
async function fetchGeoJson() {
    try {
        const response = await fetch('https://hm5wnvn96b.execute-api.ap-southeast-2.amazonaws.com/accident_data_access');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const geoJsonData = await response.json();
        console.log("Fetched GeoJSON Data:", geoJsonData);
        return geoJsonData;
    } catch (error) {
        console.error('Error fetching the GeoJSON data:', error);
        return null;
    }
}


// Group accidents by road name and type
function groupAccidentsByRoad(geoJsonData) {
    if (!geoJsonData?.features) {
        console.error('Invalid GeoJSON data:', geoJsonData);
        return;
    }

    geoJsonData.features.forEach((feature) => {
        const roadName = feature.properties.ROAD_NAME;
        const roadType = feature.properties.ROAD_TYPE;
        const roadKey = `${roadName}_${roadType}`;

        if (!roadAccidentData[roadKey]) {
            roadAccidentData[roadKey] = {
                accidents: [],
                coordinates: feature.geometry.coordinates
            };
        }
        roadAccidentData[roadKey].accidents.push(feature);
    });
}

// Initialize the map and display the accidents
async function initMap() {
    const geoJsonData = await fetchGeoJson();
    if (geoJsonData) {
        groupAccidentsByRoad(geoJsonData);
        console.log("Grouped Road Accident Data:", roadAccidentData); // Debugging log

        await google.maps.importLibrary("maps");

        // Center the map on Melbourne CBD
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: -37.8136, lng: 144.9631 },
            zoom: 15,
            mapTypeControl: false,
            mapId: "a56f2a79b03a2c89",
        });

        // Display the accident severity on the map as circles
        for (let roadKey in roadAccidentData) {
            const roadData = roadAccidentData[roadKey];
            const accidentCount = roadData.accidents.length;

            let circleColor;
            let selectedColor = "#fdc500";
            let selectedBorder = "#000";

            if (accidentCount < 10) {
                circleColor = "#2280ff";
            } else {
                circleColor = "#e63946";
            }

            const circle = new google.maps.Circle({
                strokeColor: circleColor,
                strokeOpacity: 1,
                strokeWeight: 1,
                fillColor: circleColor,
                fillOpacity: 0.8,
                map,
                center: { lat: roadData.coordinates[1], lng: roadData.coordinates[0] },
                radius: 30,
            });

            // Change circle color on mouse hover
            circle.addListener('mouseover', () => {
                if (circle !== activeCircle) {
                    circle.setOptions({
                        fillColor: selectedColor,
                        strokeColor: selectedBorder
                    });
                }
            });

            // Reset circle color on mouse out
            circle.addListener('mouseout', () => {
                if (circle !== activeCircle) {
                    circle.setOptions({
                        fillColor: circleColor,
                        strokeColor: circleColor
                    });
                }
            });

            // Emphasize selected circle
            circle.addListener('click', () => {
                if (activeCircle) {
                    activeCircle.setOptions({
                        fillColor: circleColor,
                        strokeColor: circleColor
                    });
                }
                circle.setOptions({
                    fillColor: selectedColor,
                    strokeColor: selectedBorder
                });
                activeCircle = circle;

                displaySeverityChart(roadKey);
                displayWeekdayChart(roadKey);
            });
        }
    } else {
        console.error('Failed to load GeoJSON data.');
    }
}

// Display the accident severity chart
async function displaySeverityChart(roadKey) {
    const roadData = roadAccidentData[roadKey];
    const severityData = roadData.accidents;

    const data = google.visualization.arrayToDataTable([
        ["Severity", "Case(s)", { role: "style" }],
        ["Other", severityData.filter(row => row.properties.SEVERITY === 'Other injury accident').length, "color: #2280ff"],
        ["Serious", severityData.filter(row => row.properties.SEVERITY === 'Serious injury accident').length, "color: #e63946"]
    ]);

    const options = {
        title: `Accident Severity Distribution on ${roadKey.replace('_', ' ')}`,
        height: 250,
        bar: { groupWidth: "30%" },
        legend: { position: "none" },
        backgroundColor: { fill: '#f4f4f4' },
        hAxis: { title: 'Case(s)' },
        vAxis: { title: 'Severity' }
    };

    const chart = new google.visualization.BarChart(document.getElementById('severityChart'));
    chart.draw(data, options);
}

// Display the accident occurrences by day of week chart
async function displayWeekdayChart(roadKey) {
    const roadData = roadAccidentData[roadKey];
    const severityData = roadData.accidents;

    const data = google.visualization.arrayToDataTable([
        ["Day of Week", "Case(s)", { role: "style" }],
        ["Monday", severityData.filter(row => row.properties.DAY_OF_WEEK === 'Monday').length, "color: #83d0cb"],
        ["Tuesday", severityData.filter(row => row.properties.DAY_OF_WEEK === 'Tuesday').length, "color: #71bbbd"],
        ["Wednesday", severityData.filter(row => row.properties.DAY_OF_WEEK === 'Wednesday').length, "color: #5ea6af"],
        ["Thursday", severityData.filter(row => row.properties.DAY_OF_WEEK === 'Thursday').length, "color: #4c91a1"],
        ["Friday", severityData.filter(row => row.properties.DAY_OF_WEEK === 'Friday').length, "color: #397c93"],
        ["Saturday", severityData.filter(row => row.properties.DAY_OF_WEEK === 'Saturday').length, "color: #266785"],
        ["Sunday", severityData.filter(row => row.properties.DAY_OF_WEEK === 'Sunday').length, "color: #145277"]
    ]);

    const options = {
        title: `Accident Occurrences by Day of Week on ${roadKey.replace('_', ' ')}`,
        height: 300,
        bar: { groupWidth: "50%" },
        legend: { position: "none" },
        backgroundColor: { fill: '#f4f4f4' },
        hAxis: { title: 'Case(s)' },
        vAxis: { title: 'Day of Week' }
    };

    const chart = new google.visualization.BarChart(document.getElementById('weekdayChart'));
    chart.draw(data, options);
}

google.charts.load("current", { packages: ['corechart'] });
google.charts.setOnLoadCallback(initMap);