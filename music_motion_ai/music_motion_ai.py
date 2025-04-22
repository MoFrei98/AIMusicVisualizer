import librosa

class MusicMotionAI:
    def __init__(self):
        # Initialisierung
        self.cap = None
        self.playing = False
        self.audio_file = None
        self.tempo = None
        self.beats = None

    def set_file(self, file_path):
        y, sr = librosa.load(file_path, sr=None)
        self.tempo, self.beats = librosa.beat.beat_track(y=y, sr=sr)
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)


