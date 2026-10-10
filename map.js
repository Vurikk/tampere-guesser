const map = L.map("map").setView([61.498, 23.761], 13);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const previousGuesses = L.layerGroup().addTo(map);
const hintLayers = L.layerGroup().addTo(map);
let guessMarker = null;

function updateGuessMarker(position) {
    if (guessMarker === null) {
        guessMarker = L.marker(position).addTo(map);
    } else {
        guessMarker.setLatLng(position);
    }
}

function saveGuessMarker(guessNumber, distance, won) {
    // lost or won color
    const color = won ? "#238636" : "#d1392e";

    guessMarker.setIcon(createMarkerIcon(color, guessNumber));
    guessMarker.bindPopup(`Guess ${guessNumber}: ${Math.ceil(distance)} m from the target`);

    previousGuesses.addLayer(guessMarker);
    guessMarker.openPopup();
    guessMarker = null;
}

// after a guess we create a marker to show previous guesses
function createMarkerIcon(color, label) {
    return L.divIcon({
        className: "",
        html: `<div class="guess-marker" style="background-color: ${color};">${label}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
}

function showAnswerMarker(place) {
    const answerPosition = [place.lat, place.lng];

    L.marker(answerPosition, {
        icon: createMarkerIcon("#238636", "★")
    }).addTo(hintLayers).bindPopup(`Answer: ${place.name}`).openPopup();

    map.setView(answerPosition, 19);
}


function showSearchCircle(place, radius, circleColor) {
    const angle = Math.random() * Math.PI * 2;
    const offset = Math.random() * radius * 0.5;

    // add randomness to the circle so its not on top of the location
    const latOffset = Math.sin(angle) * offset / 111320;
    const lngOffset = Math.cos(angle) * offset / (111320 * Math.cos(place.lat * Math.PI / 180));
    const center = [place.lat + latOffset, place.lng + lngOffset];

    hintLayers.clearLayers();
    
    const circle = L.circle(center, {
        radius: radius,
        color: "#d97706",
        fillColor: circleColor,
        fillOpacity: 0.12,
        interactive: false
    }).addTo(hintLayers);

    map.fitBounds(circle.getBounds(), { padding: [20, 20] });
}
