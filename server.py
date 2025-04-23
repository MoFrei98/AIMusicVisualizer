from flask import Flask, request, Response, send_file, render_template
from flask_cors import CORS
import numpy as np
import json
import time
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

@app.route('/visualisation-stream')
def visualisation_stream():
    audio_file = request.args.get('audio')
    settings_raw = request.args.get('settings', '{}')
    settings = json.loads(settings_raw)

    def generate():
        visualizer = LiveVisualizer(audio_file, settings)
        visualizer.analyze_audio()
        start_time = time.time()

        while visualizer.running:
            current_time = time.time() - start_time
            data = {
                "time": current_time,
                "graphics": []
            }

            if any(abs(current_time - bt) < 0.05 for bt in visualizer.beat_times):
                data["graphics"].append({
                    "type": "circle",
                    "color": [255, 0, 0],
                    "position": [400, 300],
                    "radius": np.random.randint(30, 100)
                })

            yield f"data: {json.dumps(data)}\n\n"
            time.sleep(0.05)

    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True)