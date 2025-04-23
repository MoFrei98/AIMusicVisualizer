import pygame
import numpy as np
from pydub import AudioSegment
from pydub.playback import play
import threading
import librosa

class LiveVisualizer:
    def __init__(self, audio_file, settings):
        self.audio_file = audio_file
        self.settings = settings
        self.running = True
        self.beat_times = []

    def analyze_audio(self):
        y, sr = librosa.load(self.audio_file, sr=None)
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        self.beat_times = librosa.frames_to_time(beats, sr=sr)

    def start_audio(self):
        audio = AudioSegment.from_file(self.audio_file)
        threading.Thread(target=play, args=(audio,), daemon=True).start()

    def run(self):
        pygame.init()
        screen = pygame.display.set_mode((800, 600))
        clock = pygame.time.Clock()

        self.analyze_audio()
        self.start_audio()

        start_time = pygame.time.get_ticks() / 1000

        while self.running:
            current_time = pygame.time.get_ticks() / 1000 - start_time
            screen.fill((0, 0, 0))

            # Beispiel: Beat visualisieren
            if any(abs(current_time - bt) < 0.05 for bt in self.beat_times):
                radius = np.random.randint(30, 100)
                pygame.draw.circle(screen, (255, 0, 0), (400, 300), radius)

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False

            pygame.display.flip()
            clock.tick(60)

        pygame.quit()
