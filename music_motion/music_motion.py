import librosa
import numpy as np
from moviepy import AudioFileClip, VideoClip
from moviepy.video.io.ffmpeg_writer import FFMPEG_VideoWriter
import random
import cv2

class MusicMotion:
    def __init__(self):
        self.tempo = None
        self.beats = None

    def set_file(self, file_path):
        y, sr = librosa.load(file_path, sr=None)
        self.tempo, self.beats = librosa.beat.beat_track(y=y, sr=sr)
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)

    def generate_video(self, audio_path: str, output_path: str, settings: dict, progress_callback=None):
        self.set_file(audio_path)
        background = settings.get("background", "1")
        shapes = settings.get("shapes", "1")
        mouse_effect = settings.get("onMouseClick", "1")

        def make_frame(t):
            np.random.seed(int(t * 100))  # reproducible randomness per frame

            color_val = int(255 * abs(np.sin(t * self.tempo / 60)))
            bg_color = (0, 0, 0)

            if background == "2":
                bg_color = (0, 0, 0)
            elif background == "3":
                bg_color = (255, 255, 255)
            elif background == "4":
                bg_color = (color_val, color_val, 255 - color_val)

            frame = np.full((480, 640, 3), bg_color, dtype=np.uint8)

            for _ in range(5):  # draw multiple shapes
                x = random.randint(0, 600)
                y = random.randint(0, 440)
                size = random.randint(20, 60)

                if shapes in ["1", "3"]:  # squares
                    cv2.rectangle(frame, (x, y), (x + size, y + size), (255, 0, 0), -1)
                if shapes in ["2", "3"]:  # circles
                    cv2.circle(frame, (x + size//2, y + size//2), size//2, (0, 255, 0), -1)

            return frame

        audio_clip = AudioFileClip(audio_path)
        duration = audio_clip.duration
        video = VideoClip(make_frame, duration=duration).with_audio(audio_clip)

        writer = FFMPEG_VideoWriter(output_path, video.size, fps=30, codec="libx264")
        for t in range(int(duration * 30)):  # 30 FPS
            writer.write_frame(make_frame(t / 30))
            if progress_callback:
                progress_callback(t, duration * 30)
        writer.close()



