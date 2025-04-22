import tkinter as tk
from tkinter import filedialog
import cv2
from PIL import Image, ImageTk
import pygame
from music_motion_ai import MusicMotionAI

class VideoPlayerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Media Player")
        self.root.geometry("900x700")  # Standardgröße des Fensters
        self.root.state('zoomed') # Fenster maximieren

        # Haupt-Frame
        self.main_frame = tk.Frame(root, bg="white")  # Hintergrund auf Grau setzen
        self.main_frame.pack(fill=tk.BOTH, expand=True)

        # Songtitel-Label (oben links)
        self.song_title_label = tk.Label(self.main_frame, text="No file selected", bg="white", fg="black", anchor="w")
        self.song_title_label.place(relx=0.0, rely=0.0, anchor="nw")  # Oben links

        self.select_button = tk.Button(root, text="Select File", command=self.select_file)
        self.select_button.place(relx=1.0, rely=0.0, anchor="ne")  # Oben rechts

        # rahmen für video
        self.video_frame = tk.Frame(self.main_frame, bg="white", width=850, height=625)  # Rahmen 10px größer
        self.video_frame.pack(expand=True)

        # video canvas
        self.video_canvas = tk.Label(self.video_frame, bg="black", width=800, height=600)
        self.video_canvas.place(relx=0.5, rely=0.5, anchor="center")

        self.extra_canvas = tk.Canvas(self.main_frame, bg="grey", height=40, bd=0, highlightthickness=0)
        self.extra_canvas.place(relx=0.0, rely=1.0, relwidth=1.0, anchor="sw")

        # Video-Presets Label (unten links)
        self.preset_label = tk.Label(self.extra_canvas, text="Background", bg="white", fg="black")
        self.preset_label.place(relx=0.0, rely=1.0, anchor="sw")

        # Dropdown-Menü (OptionMenu) für Video-Presets, näher am Label
        self.presets = ["Preset 1", "Preset 2", "Preset 3"]
        self.selected_preset = tk.StringVar(value=self.presets[0])
        self.preset_dropdown = tk.OptionMenu(self.extra_canvas, self.selected_preset, *self.presets)
        self.preset_dropdown.place(relx=0.10, rely=1.0, anchor="sw")

        self.play_pause_button = tk.Button(self.extra_canvas, text="Play", command=self.play_pause)
        self.play_pause_button.place(relx=1.0, rely=1.0, anchor="se")  # Unten rechts

        # Initialisierung
        self.cap = None
        self.playing = False
        self.audio_file = None

        # Pygame für Audio initialisieren
        pygame.mixer.init()

    def select_file(self):
        file_path = filedialog.askopenfilename(filetypes=[("Media Files", "*.mp4 *.avi *.mkv *.mp3 *.wav *.flac")])
        if file_path:
            self.song_title_label.config(text=file_path.split("/")[-1])  # Dateiname im Label anzeigen
            if file_path.endswith(('.mp3', '.wav', '.flac')):
                self.audio_file = file_path
                self.cap = None
                self.playing = False
                self.play_pause_button.config(text="Play")
            else:
                self.audio_file = None
                self.cap = cv2.VideoCapture(file_path)
                self.playing = False
                self.play_pause_button.config(text="Play")

    def play_pause(self):
        if self.audio_file:
            if not self.playing:
                pygame.mixer.music.load(self.audio_file)
                pygame.mixer.music.play()
                self.playing = True
                self.play_pause_button.config(text="Pause")
            else:
                if pygame.mixer.music.get_busy():
                    pygame.mixer.music.stop()  # Audio vollständig stoppen
                self.playing = False
                self.play_pause_button.config(text="Play")
        elif self.cap:
            self.playing = not self.playing
            if self.playing:
                self.play_pause_button.config(text="Pause")
                self.play_video()
            else:
                self.play_pause_button.config(text="Play")

    def play_video(self):
        if self.cap and self.playing:
            ret, frame = self.cap.read()
            if ret:
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                img = ImageTk.PhotoImage(Image.fromarray(frame))
                self.video_canvas.imgtk = img
                self.video_canvas.configure(image=img)
                self.root.after(10, self.play_video)
            else:
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                self.playing = False
                self.play_pause_button.config(text="Play")

            music_motion = MusicMotionAI(self)
            music_motion.set_file(self.audio_file)




if __name__ == "__main__":
    root = tk.Tk()
    app = VideoPlayerApp(root)
    root.mainloop()