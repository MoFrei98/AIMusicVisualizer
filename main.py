import tkinter as tk
from tkinter import filedialog
import cv2
from PIL import Image, ImageTk
import pygame

class VideoPlayerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Media Player")
        self.root.geometry("800x600")  # Standardgröße des Fensters

        # Haupt-Frame
        self.main_frame = tk.Frame(root, bg="gray")  # Hintergrund auf Grau setzen
        self.main_frame.pack(fill=tk.BOTH, expand=True)

        # Songtitel-Label (oben links)
        self.song_title_label = tk.Label(self.main_frame, text="No file selected", bg="white", fg="black", anchor="w")
        self.song_title_label.place(relx=0.0, rely=0.0, anchor="nw")  # Oben links

        # Videoplayer-Rahmen mit fester Größe
        self.video_frame = tk.Frame(self.main_frame, bg="black", width=850, height=650)  # Rahmen 10px größer
        self.video_frame.place(relx=0.5, rely=0.5, anchor="center")  # Zentriert im Haupt-Frame

        # Videoanzeige innerhalb des Rahmens
        self.video_canvas = tk.Label(self.video_frame, bg="green", width=800, height=600)  # Canvas 300x200
        self.video_canvas.place(relx=0.5, rely=0.5, anchor="center")  # Zentriert im Rahmen

        # Buttons
        self.select_button = tk.Button(root, text="Select File", command=self.select_file)
        self.select_button.place(relx=1.0, rely=0.0, anchor="ne")  # Oben rechts

        self.play_pause_button = tk.Button(root, text="Play", command=self.play_pause)
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

if __name__ == "__main__":
    root = tk.Tk()
    app = VideoPlayerApp(root)
    root.mainloop()