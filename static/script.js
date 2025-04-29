let selectedFile = null;
let audio = document.getElementById("audioPlayer");

const canvas = document.getElementById("visualizerCanvas");
const ctx = canvas.getContext("2d");
let settings = null;


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
        numberOfShapes: document.getElementById("numberOfShapes").value || null,
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
        }
    };
    fileInput.click();
}

let isPlaying = false;
async function playPause() {
    if (!selectedFile) {
        console.error("Keine Datei ausgewählt!");
        return;
    }

    const playPauseButton = document.querySelector(".play-pause");

    if (!isPlaying) {
        isPlaying = true;
        playPauseButton.textContent = "Generating...";
        playPauseButton.disabled = true;

        // Einstellungen nur einmal laden
        settings = getSettings();
        console.log('Settings:', settings);

        // Audio-Element vorbereiten
        const url = URL.createObjectURL(selectedFile);
        audio.src = url;
        audio.load();
        setupAudioProcessing();

        // Audio starten
        audio.play().then(() => {
            draw(); // Starte Visualisierung
            playPauseButton.textContent = "Pause";
            playPauseButton.disabled = false;
        });
    } else {
        isPlaying = false;
        // Pausieren
        audio.pause();
        playPauseButton.textContent = "Play";

        shapes = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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

function changeShapes(value) {
    const numberContainer = document.querySelector('.number-container');
    if (value === "bars") {
        numberContainer.style.display = "none";
    } else {
        numberContainer.style.display = "flex";
    }
}

function draw() {
    if (!isPlaying)
        return;

    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Hintergrundfarbe setzen
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

    // Formen zeichnen
    switch (settings.shapes) {
        case "bars":
            drawBars();
            break;
        case "squares":
            drawSquares(settings.numberOfShapes);
            break;
        case "circles":
            drawCircles(settings.numberOfShapes);
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

let shapes = [];

function drawSquares(numberOfShapes) {
    if (shapes.length === 0) {
        for (let i = 0; i < numberOfShapes; i++) {
            const size = Math.random() * 50 + 10;
            const x = numberOfShapes === 1 ? (canvas.width - size) / 2 : Math.random() * (canvas.width - size);
            const y = numberOfShapes === 1 ? (canvas.height - size) / 2 : Math.random() * (canvas.height - size);
            shapes.push({ x, y, size });
            console.log(`Square ${i}: x=${x}, y=${y}, size=${size}`);
        }
    }

    shapes.forEach(shape => {
        const height = dataArray[Math.floor(Math.random() * bufferLength)];
        const wobble = height / 10;
        ctx.fillStyle = `rgb(${height + 100}, 50, 150)`;
        ctx.fillRect(shape.x - wobble, shape.y - wobble, shape.size + wobble * 2, shape.size + wobble * 2);
    });
}

function drawCircles(numberOfShapes) {
    if (shapes.length === 0) {
        for (let i = 0; i < numberOfShapes; i++) {
            const radius = Math.random() * 30 + 10;
            const x = numberOfShapes === 1 ? canvas.width / 2 : Math.random() * canvas.width;
            const y = numberOfShapes === 1 ? canvas.height / 2 : Math.random() * canvas.height;
            shapes.push({ x, y, radius });
            console.log(`Circle ${i}: x=${x}, y=${y}, radius=${radius}`);
        }
    }

    shapes.forEach(shape => {
        const radius = dataArray[Math.floor(Math.random() * bufferLength)];
        const wobble = radius / 20;
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.radius + wobble, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${radius + 100}, 50, 150)`;
        ctx.fill();
    });
}