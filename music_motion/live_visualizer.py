import time
import numpy as np
import librosa
import json

class LiveVisualizer:
    def __init__(self, audio_file, settings):
        self.audio_file = audio_file
        self.settings = settings
        self.running = True
        self.beat_times = []

    def analyze_audio(self):
        y, sr = librosa.load('./uploads/' + self.audio_file, sr=None)
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        self.beat_times = librosa.frames_to_time(beats, sr=sr)

    def generate_circles(self, count=3):
        circles = []
        for _ in range(count):
            circle = {
                "type": "circle",
                "position": [np.random.randint(0, 640), np.random.randint(0, 480)],
                "radius": np.random.randint(10, 50),
                "color": [np.random.randint(0, 255) for _ in range(3)]
            }
            circles.append(circle)
        return circles

    def generate_squares(self, count=3):
        squares = []
        for _ in range(count):
            size = np.random.randint(10, 50)
            square = {
                "type": "square",
                "position": [np.random.randint(0, 640 - size), np.random.randint(0, 480 - size)],
                "size": size,
                "color": [np.random.randint(0, 255) for _ in range(3)]
            }
            squares.append(square)
        return squares

    def generate_bars(self, count=64):
        bars = []
        bar_width = 640 / count
        for i in range(count):
            bar_height = np.random.randint(10, 300)
            bar = {
                "type": "bar",
                "position": [i * bar_width, 480 - bar_height],
                "size": [bar_width - 2, bar_height],  # Breite leicht verkleinert
                "color": [np.random.randint(0, 255) for _ in range(3)]
            }
            bars.append(bar)
        return bars

    def generate_frame(self, current_time):
        graphics = []

        # Hintergrundfarbe setzen
        background = {
            "type": "background",
            "color": self.settings.get("background", "black").lower()
        }
        graphics.append(background)

        # Auf Beat reagieren
        is_beat = any(abs(current_time - bt) < 0.05 for bt in self.beat_times)

        # Je nach ausgewählter Form zeichnen
        shape = self.settings.get("shapes", "bars").lower()
        if shape == "bars":
            graphics.extend(self.generate_bars(count=64 if not is_beat else 128))
        elif shape == "squares":
            graphics.extend(self.generate_squares(count=5 if not is_beat else 10))
        elif shape == "circles":
            graphics.extend(self.generate_circles(count=5 if not is_beat else 10))
        else:
            raise ValueError(f"Unsupported shape: {shape}")

        return graphics

    def stream_frames(self):
        self.analyze_audio()
        start_time = time.time()

        try:
            while self.running:
                current_time = time.time() - start_time
                graphics = self.generate_frame(current_time)

                # Schicke als JSON über SSE
                frame_data = {
                    "graphics": graphics
                }
                yield f"data: {json.dumps(frame_data)}\n\n"

                time.sleep(0.05)  # ~20 FPS

        except Exception as e:
            print(f"Error while streaming frames: {e}")
            yield f"data: {{'error': 'Server error occurred: {str(e)}'}}\n\n"
