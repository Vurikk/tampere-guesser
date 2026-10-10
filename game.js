// Game state
const maxGuesses = 4;

let places = [];
let currentPlaceIndex = 0;
let currentPlace = null;
let selectedGuess = null;
let guessCount = 0;
let roundFinished = false;
let previousDistance = null;
let bestDistance = Infinity;
let resultDialogTimer = null;

// Load all locations, then start the first round.
async function loadPlaces() {
    const response = await fetch("./places.json");

    if (!response.ok) {
        throw new Error(`Loading failed: ${response.status}`);
    }

    places = await response.json();

    if (!Array.isArray(places) || places.length === 0) {
        throw new Error("places.json must contain at least one location.");
    }

    startRound();
}

// Clear the previous round and display the current location.
function startRound() {
    clearTimeout(resultDialogTimer);
    resultDialogTimer = null;
    closeLocationInfo();

    currentPlace = places[currentPlaceIndex];
    selectedGuess = null;
    guessCount = 0;
    roundFinished = false;
    previousDistance = null;
    bestDistance = Infinity;

    // Remove any unconfirmed marker and all previous map objects.
    if (guessMarker !== null) {
        map.removeLayer(guessMarker);
        guessMarker = null;
    }

    map.closePopup();
    previousGuesses.clearLayers();
    hintLayers.clearLayers();
    map.setView([61.498, 23.761], 13);

    // Reset the photo, credits, hints, and controls.
    document.querySelector("#place-image").src = currentPlace.image;

    const photoSource = document.querySelector("#photo-source");
    photoSource.href = currentPlace.imageSource || currentPlace.image;
    photoSource.textContent = currentPlace.imageCredit || "Original photo";

    document.querySelector("#hints").textContent = "";
    document.querySelector("#attempts").textContent = `Guesses: 0 / ${maxGuesses}`;
    document.querySelector("#feedback").textContent = "Click the map to choose your location.";
    document.querySelector("#guess-button").disabled = false;
    document.querySelector("#next-round-button").disabled = true;
}

// Move to the next location, returning to the first after the last.
function nextRound() {
    if (!roundFinished || places.length === 0) {
        return;
    }

    currentPlaceIndex = (currentPlaceIndex + 1) % places.length;
    startRound();
}

// Select a position without spending an attempt.
function onMapClick(event) {
    if (roundFinished || currentPlace === null) {
        return;
    }

    selectedGuess = event.latlng;
    updateGuessMarker(selectedGuess);
}

// Compare the new distance with the previous guess.
function getPreviousDistanceComparision(distance) {
    if (previousDistance === null) {
        return "";
    }

    const improvement = Math.round(previousDistance - distance);

    if (improvement > 0) {
        return `Warmer! ${improvement} m closer than before.`;
    } else if (improvement < 0) {
        return `Colder! ${Math.abs(improvement)} m farther than before.`;
    }

    return "About the same distance as before.";
}

function checkGuess() {
    if (roundFinished) {
        return;
    }

    const feedback = document.querySelector("#feedback");

    if (currentPlace === null) {
        feedback.textContent = "The location is still loading.";
        return;
    }

    if (selectedGuess === null) {
        feedback.textContent = "Choose a point on the map first.";
        return;
    }

    const target = [currentPlace.lat, currentPlace.lng];
    const distance = map.distance(selectedGuess, target);
    const comparison = getPreviousDistanceComparision(distance);
    const won = distance <= 100;

    bestDistance = Math.min(bestDistance, distance);
    previousDistance = distance;
    guessCount += 1;

    document.querySelector("#attempts").textContent = `Guesses: ${guessCount} / ${maxGuesses}`;

    // A correct fourth guess still wins.
    if (won) {
        feedback.textContent = `Found it! ${currentPlace.name} — ${Math.ceil(distance)} m away. Guesses used: ${guessCount}/${maxGuesses}.`;
    } else if (guessCount >= maxGuesses) {
        feedback.textContent = `Out of guesses! It was ${currentPlace.name}. Your last guess was ${Math.ceil(distance)} m away.`;
        feedback.textContent += ` Your closest guess was ${Math.ceil(bestDistance)} m away.`;
    } else {
        const guessesLeft = maxGuesses - guessCount;
        feedback.textContent = `${Math.ceil(distance)} m away. ${comparison}`;
        feedback.textContent += ` ${guessesLeft} ${guessesLeft === 1 ? "guess" : "guesses"} remaining.`;
    }

    saveGuessMarker(guessCount, distance, won);
    selectedGuess = null;

    if (won || guessCount >= maxGuesses) {
        finishRound(won);
    } else {
        revealHint();
    }
}

function finishRound(won) {
    roundFinished = true;
    document.querySelector("#guess-button").disabled = true;
    document.querySelector("#next-round-button").disabled = false;

    showAnswerMarker(currentPlace);

    // Let the player see the answer marker before opening the dialog.
    resultDialogTimer = setTimeout(() => {
        showLocationInfo(won);
    }, 2000);
}

function revealHint() {
    const hintItem = document.createElement("li");

    if (guessCount === 1) {
        showSearchCircle(currentPlace, 1200, "#f59e0b");
        hintItem.textContent = "Search inside the orange circle: 1,200 m radius.";
    } else if (guessCount === 2) {
        hintItem.textContent = `District: ${currentPlace.region}`;
    } else if (guessCount === 3) {
        showSearchCircle(currentPlace, 300, "#d1392e");
        hintItem.textContent = `Search narrowed to a 300 m radius! ${currentPlace.hint}`;
    }

    document.querySelector("#hints").appendChild(hintItem);
}

// Event listeners
map.on("click", onMapClick);
document.querySelector("#guess-button").addEventListener("click", checkGuess);
document.querySelector("#next-round-button").addEventListener("click", nextRound);
document.querySelector("#how-to-play-button").addEventListener("click", showTutorial);
document.querySelector("#close-tutorial-button").addEventListener("click", closeTutorial);
document.querySelector("#close-location-button").addEventListener("click", closeLocationInfo);

// Startup
document.querySelector("#guess-button").disabled = true;
document.querySelector("#next-round-button").disabled = true;

loadPlaces().catch(error => {
    console.error(error);
    document.querySelector("#feedback").textContent = "Could not load locations. Check places.json and refresh.";
});

showTutorial();