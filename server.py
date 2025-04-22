from flask import Flask, request, send_file
from moviepy import *
import librosa
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/generate-video', methods=['POST'])
def generate_video(settings):
    audio_file = request.files['audio']
    path = "temp_audio.mp3"
    audio_file.save(path)

    # Analyze audio
    y, sr = librosa.load(path, sr=None)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    duration = librosa.get_duration(y=y, sr=sr)

    # Generate video frame-by-frame
    def make_frame(t):
        img = np.zeros((480, 640, 3), dtype=np.uint8)
        if int(t * tempo / 60) % 2 == 0:
            img[:, :] = [255, 255, 255]
        else:
            img[:, :] = [0, 0, 0]
        return img

    audio_clip = AudioFileClip(path)
    video = VideoClip(make_frame, duration=audio_clip.duration).with_audio(audio_clip)

    output_path = "static/generated_video.mp4"
    video.write_videofile(output_path, fps=30, codec='libx264')

    return send_file(output_path, mimetype='video/mp4')

if __name__ == '__main__':
    app.run(debug=True)