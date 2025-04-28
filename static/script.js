let selectedFile = null;
let audio = document.getElementById("audioPlayer");
audio.addEventListener('ended', () => {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
    document.querySelector(".play-pause").textContent = "Play";
});


const canvas = document.getElementById("visualizerCanvas");
const ctx = canvas.getContext("2d");

/*
const progressBar = document.getElementById("progress-bar");
const eventSource = new EventSource("http://localhost:5000/progress");
eventSource.onmessage = function (event) {
    const progress = parseInt(event.data);
    progressBar.value = progress;
    if (progress === 0 || progress === 100) {
        progressBar.classList.add("hidden");
    } else {
        progressBar.classList.remove("hidden");
    }
};
eventSource.onerror = function (error) {
    console.error("SSE connection error:", error);
    eventSource.close();
};
 */

function getSettings() {
    return {
        background: document.getElementById("background").value || null,
        shape: document.getElementById("shapes").value || null,
        onMouseClick: document.getElementById("onMouseClick").value || null,
    };
}

function selectFile() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".mp3, .wav, .flac";

    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            selectedFile = file;
            document.querySelector(".file-title").textContent = file.name;

            const audio = document.getElementById("audioPlayer");
            audio.src = URL.createObjectURL(file);
            audio.load();

            audio.onplay = () => {
                if (!window.audioCtx)
                    setupAudioProcessing();
            };
        }
    };
    fileInput.click();
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Upload fehlgeschlagen!');
    }

    const result = await response.json();
    console.log('Upload result:', result);
    return result.filename; // Server gibt dir den neuen Dateinamen zurück
}


let eventSource = null;
async function playPause() {
    if (!selectedFile) {
        console.error("Keine Datei ausgewählt!");
        return;
    }

    const playPauseButton = document.querySelector(".play-pause");

    if (!audio || audio.paused) {
        playPauseButton.textContent = "Generating...";
        playPauseButton.disabled = true;

        const audioFile = encodeURIComponent(await uploadFile(selectedFile));
        const settings = encodeURIComponent(JSON.stringify(getSettings()));

        console.log('Settings:', decodeURIComponent(settings));

        try {
            eventSource = new EventSource(`http://localhost:5000/visualisation-stream?audio=${audioFile}&settings=${settings}`);
            eventSource.onopen = () => console.log("EventSource connection opened");
            eventSource.onmessage = function (event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.error) {
                        console.error("Error from server:", data.error);
                    } else {
                        drawGraphics(data.graphics);
                    }
                } catch (err) {
                    console.error("Error processing data:", err);
                }
            };
            eventSource.onerror = function (error) {
                console.error("SSE connection error:", error);
                eventSource.close();
            };

            const url = URL.createObjectURL(selectedFile);
            audio.src = url;
            audio.load();

            audio.play().then(() => {
                playPauseButton.textContent = "Pause";
                playPauseButton.disabled = false;
            });

        } catch (err) {
            console.error("Fehler bei Anfrage:", err);
            playPauseButton.textContent = "Play";
            playPauseButton.disabled = false;
        }
    } else {
        // Pausieren
        audio.pause();
        playPauseButton.textContent = "Play";

        // Beende auch den Stream!
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
    }
}

let audioCtx;
let analyser;
let dataArray;
let bufferLength;

function setupAudioProcessing() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (!audio.source) {
        const source = audioCtx.createMediaElementSource(audio);
        source.connect(audioCtx.destination);
        analyser = audioCtx.createAnalyser();
        source.connect(analyser);
        analyser.fftSize = 256;

        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // Speichere die Quelle, um doppelte Verbindungen zu vermeiden
        audio.source = source;
    }
}

function changeBackground(value) {
    if (value === "black" || value === "white") {
        ctx.fillStyle = value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawGraphics(graphics) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    console.log("Zeichne Grafiken:", graphics);  // Debugging-Ausgabe

    const settings = getSettings();
    switch (settings.background) {
        case "black":
        case "white":
            ctx.fillStyle = settings.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
        default:
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    graphics.forEach(graphic => {
        if (graphic.type === "circle") {
            ctx.beginPath();
            ctx.arc(graphic.position[0], graphic.position[1], graphic.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgb(${graphic.color[0]}, ${graphic.color[1]}, ${graphic.color[2]})`;
            ctx.fill();
        } else if (graphic.type === "bar") {
            ctx.fillStyle = `rgb(${graphic.color[0]}, ${graphic.color[1]}, ${graphic.color[2]})`;
            ctx.fillRect(graphic.position[0], graphic.position[1], graphic.size[0], graphic.size[1]);
        }
        // Weitere Formen könnten hier hinzugefügt werden
    });
}