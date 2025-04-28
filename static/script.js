let selectedFile = null;
let audio = document.getElementById("audioPlayer");

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
        shapes: document.getElementById("shapes").value || null,
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
            const url = URL.createObjectURL(file);
            audio.src = url;
            audio.load();

            audio.onplay = () => {
                if (!window.audioCtx) setupAudioProcessing();
                draw(); // Starte Visualisierung
            };
        }
    };
    fileInput.click();
}

async function playPause() {
    if (!selectedFile) {
        console.error("Keine Datei ausgewählt!");
        return;
    }

    const playPauseButton = document.querySelector(".play-pause");

    if (!audio || audio.paused) {
        playPauseButton.textContent = "Generating...";
        playPauseButton.disabled = true;

        // 1. Einstellungen und Datei vorbereiten
        const audioFile = encodeURIComponent(selectedFile.name);
        const settings = encodeURIComponent(JSON.stringify(getSettings()));
        console.log('Settings:', decodeURIComponent(settings));

        try {
            // 2. An den Server senden und warten
            const eventSource = new EventSource(`http://localhost:5000/visualisation-stream?audio=${audioFile}&settings=${settings}`);
            eventSource.onmessage = function (event) {
                const data = JSON.parse(event.data);

                // Canvas leeren
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Grafiken zeichnen
                data.graphics.forEach(graphic => {
                    if (graphic.type === "circle") {
                        ctx.beginPath();
                        ctx.arc(graphic.position[0], graphic.position[1], graphic.radius, 0, 2 * Math.PI);
                        ctx.fillStyle = `rgb(${graphic.color[0]}, ${graphic.color[1]}, ${graphic.color[2]})`;
                        ctx.fill();
                    }
                });
            };

            eventSource.onerror = function (error) {
                console.error("SSE connection error:", error);
                eventSource.close();
            };

            // 3. Audio-Element vorbereiten
            const url = URL.createObjectURL(selectedFile);
            audio.src = url;
            audio.load();

            // 4. Audio starten
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

function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const settings = getSettings();
    switch (settings.background) {
        case "black":
        case "white":
            ctx.fillStyle = settings.background;
            break;
        case "img":
            // TODO: Implement image background
            break;

        case "chng":
            // TODO: Implement changing background colors (rgb)
            break;
        default:
            ctx.fillStyle = "black";
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    switch (settings.shapes) {
        case "bars":
            drawBars();
            break;
        case "squares":
            drawSquares();
            break;
        case "cicles":
            drawCircles();
            break;
        case "mix":
            // TODO: Implement mixed shapes
            break;
        default:
            console.error("Unrecognized shape type");
    }
}

function drawBars() {
    const barWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i];
        ctx.fillStyle = `rgb(${barHeight + 100}, 50, 150)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth;
    }
}

let frameCounter = 0;
function drawSquares() {
    frameCounter++;
    if (frameCounter % 60 !== 0) return; // Nur bei jedem 4. Frame ausführen

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i];
        const x = Math.random() * (canvas.width - 50); // Zufällige X-Position
        const y = Math.random() * (canvas.height - 50); // Zufällige Y-Position
        const size = Math.random() * 50 + 10; // Zufällige Größe zwischen 10 und 60
        ctx.fillStyle = `rgb(${barHeight + 100}, 50, 150)`;
        ctx.fillRect(x, y, size, size);
    }
}

function drawCircles() {
    for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i];
        const x = Math.random() * canvas.width; // Zufällige X-Position
        const y = Math.random() * canvas.height; // Zufällige Y-Position
        const radius = Math.random() * 30 + 10; // Zufälliger Radius zwischen 10 und 40
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${barHeight + 100}, 50, 150)`;
        ctx.fill();
    }
}