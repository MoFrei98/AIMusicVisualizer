from flask import Flask, request, Response, send_file, render_template, jsonify
from flask_cors import CORS
import json
import time
import os
from music_motion.live_visualizer import LiveVisualizer
from music_motion.music_motion import MusicMotion

app = Flask(__name__, template_folder="templates")
CORS(app, resources={r"/*": {"origins": "*"}})

ai = MusicMotion()
progress = 0
def progress_callback(current, total):
    global progress
    progress = int((current / total) * 100)

# frontend
@app.route('/')
def index():
    return render_template("index.html")

# backend
@app.route('/progress')
def progress_route():
    def generate():
        global progress
        while progress <= 100:
            yield f"data: {progress}\n\n"
            time.sleep(0.5)
    return Response(generate(), mimetype='text/event-stream')


@app.route('/generate-video', methods=['POST'])
def generate_video_route():
    global progress
    progress = 0
    audio_file = request.files['audio']
    settings_raw = request.form.get('settings', '{}')
    settings = json.loads(settings_raw)

    audio_path = "tmp_audio.mp3"
    output_path = "gen/generated_video.mp4"

    audio_file.save(audio_path)
    ai.generate_video(audio_path, output_path, settings, progress_callback)

    progress = 100

    return send_file(output_path, mimetype="video/mp4")

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Keine Datei'}), 400

    file = request.files['file']
    filename = file.filename
    filepath = os.path.join('./uploads', filename)
    file.save(filepath)

    return jsonify({'filename': filename})

@app.route('/visualisation-stream')
def visualisation_stream():
    audio_file = request.args.get('audio')
    settings_raw = request.args.get('settings')

    # settings_raw ist ein JSON-String → Umwandeln in Dict
    try:
        settings = json.loads(settings_raw)
    except json.JSONDecodeError:
        # Im Fehlerfall Default-Werte verwenden
        settings = {
            "background": "black",
            "shapes": "bars",
            "onMouseClick": None
        }

    visualizer = LiveVisualizer(audio_file, settings)
    try:
        return Response(visualizer.stream_frames(), mimetype='text/event-stream')
    except Exception as e:
        # Fehler abfangen und loggen
        print(f"Error in visualisation stream: {e}")
        return jsonify({"error": "An error occurred while processing the stream"}), 500

if __name__ == '__main__':
    app.run(debug=True)