let selectedFile = null; // Globale Variable für die ausgewählte Datei
let audio = null; // Globale Variable für das Audio-Objekt

function getSettings() {
    return {
        background: document.getElementById("background").value || null,
        shapes: document.getElementById("shapes").value || null,
        onMouseClick: document.getElementById("onMouseClick").value || null,
    };
}

function selectFile() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".mp3, .wav, .flac"; // Erlaubte Dateitypen

    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            selectedFile = file; // Datei speichern
            document.querySelector(".file-title").textContent = file.name; // Dateiname anzeigen
        }
    };

    fileInput.click();
}

function playPause() {
    if (!selectedFile) {
        console.error("Keine Datei ausgewählt!");
        return;
    }
    const formData = new FormData();
    formData.append("audio", selectedFile);

    if (!audio) {
        // Neues Audio-Objekt erstellen und die Datei laden
        audio = new Audio(URL.createObjectURL(selectedFile));
    }

    const playPauseButton = document.querySelector(".play-pause");
    if (audio.paused) {
        playPauseButton.textContent = "Generating video..."
        playPauseButton.enabled = false
        const settings = getSettings();
        formData.append("settings", JSON.stringify(settings));
        displayVideo(settings).then(() => {
            console.log("Video generiert");
            audio.play().then(() => {
                playPauseButton.textContent = "Pause"; // Button-Beschriftung ändern
                playPauseButton.enabled = true
                console.log("Wiedergabe gestartet");
            }).catch((error) => {
                console.error("Fehler beim Starten der Wiedergabe:", error);
            });
        });
    } else {
        audio.pause();
        const video = document.querySelector(".video-frame video");
        if (video) {
            video.pause();
        }
        playPauseButton.textContent = "Play"; // Button-Beschriftung ändern
        console.log("Wiedergabe pausiert");
    }
}

async function displayVideo() {
    try {
        const formData = new FormData();
        formData.append("audio", selectedFile);

        const response = await fetch("http://localhost:5000/generate-video", {
            method: "POST",
            body: formData
        });

        const videoBlob= await response.blob();
        const videoURL= URL.createObjectURL(videoBlob);

        const videoFrame = document.querySelector(".video-frame");
        videoFrame.innerHTML = `
            <video autoplay muted width="640" height="480">
                <source src="${videoURL}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
    } catch (error) {
        console.error("Fehler beim Generieren:", error);
    }
}