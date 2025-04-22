from flask import Flask, request, send_file, render_template
from flask_cors import CORS
from moviepy import *
import librosa
import numpy as np
import json
from music_motion.music_motion import MusicMotion

app = Flask(__name__, template_folder="templates")
CORS(app)

ai = MusicMotion()

# frontend
@app.route('/')
def index():
    return render_template("index.html")

# backend
@app.route('/generate-video', methods=['POST'])
def generate_video_route():
    audio_file = request.files['audio']
    settings_raw = request.form.get('settings', '{}')
    settings = json.loads(settings_raw)

    audio_path = "temp_audio.mp3"
    output_path = "gen/generated_video.mp4"

    audio_file.save(audio_path)
    ai.generate_video(audio_path, output_path, settings)

    return send_file(output_path, mimetype="video/mp4")

if __name__ == '__main__':
    app.run(debug=True)