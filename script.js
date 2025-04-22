let selectedFile = null; // Globale Variable für die ausgewählte Datei
let audio = null; // Globale Variable für das Audio-Objekt

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

    if (!audio) {
        // Neues Audio-Objekt erstellen und die Datei laden
        audio = new Audio(URL.createObjectURL(selectedFile));
    }

    const playPauseButton = document.querySelector(".play-pause");
    if (audio.paused) {
        playPauseButton.textContent = "Generating video..."
        const settings = {

        }
        displayVideo(settings).then(() => {
            console.log("Video generiert");
            audio.play().then(() => {
                playPauseButton.textContent = "Pause"; // Button-Beschriftung ändern
                console.log("Wiedergabe gestartet");
            }).catch((error) => {
                console.error("Fehler beim Starten der Wiedergabe:", error);
            });
        });
    } else {
        audio.pause();
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
            <video controls autoplay width="640" height="480">
                <source src="${videoURL}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
    } catch (error) {
        console.error("Fehler beim Generieren:", error);
    }
}