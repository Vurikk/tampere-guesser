const tutorial = document.querySelector("#tutorial");
const locationDialog = document.querySelector("#location-dialog");

function showTutorial() {
    tutorial.showModal();
}

function closeTutorial() {
    tutorial.close();
}

// Display the current round's result and location information.
function showLocationInfo(won) {
    const result = document.querySelector("#location-result");

    if (won) {
        result.textContent = `You found it! Guesses used: ${guessCount}/${maxGuesses}.`;
    } else {
        result.textContent = `Out of guesses! Your closest attempt was ${Math.ceil(bestDistance)} m away.`;
    }

    document.querySelector("#location-title").textContent = currentPlace.name;
    document.querySelector("#location-info").textContent = currentPlace.info;
    document.querySelector("#location-source").href = currentPlace.infoSource;

    const image = document.querySelector("#location-image");
    image.src = currentPlace.image;
    image.alt = currentPlace.name;

    locationDialog.showModal();
}

function closeLocationInfo() {
    locationDialog.close();
}