import cv2
import os
import time

class VideoStream:
    def __init__(self):
        self.source = os.getenv('VIDEO_SOURCE', 'warehouse_footage.mp4')
        self.is_production = os.getenv('PRODUCTION_MODE', 'false').lower() == 'true'
        self.cap = None
        self.reconnect_delay = 5

    def start(self):
        """Initializes the video capture."""
        print(f"🎥 Connecting to Video Source: {self.source}")
        
        # Check if source is an integer (Camera Index)
        if self.source.isdigit():
            self.cap = cv2.VideoCapture(int(self.source))
        else:
            self.cap = cv2.VideoCapture(self.source)
            
        if not self.cap.isOpened():
            print(f"❌ Failed to open video source: {self.source}")
            return False
        return True

    def read(self):
        """
        Reads a frame.
        In DEV mode: Loops video file automatically.
        In PROD mode: Returns False on end (to allow service restart).
        """
        if not self.cap or not self.cap.isOpened():
            print("⚠️ Capture not open. Attempting reconnect...")
            time.sleep(self.reconnect_delay)
            if not self.start():
                return False, None

        success, frame = self.cap.read()
        
        if not success:
            if not self.is_production and not self.source.isdigit():
                # Loop video in Dev/Demo mode
                print("🔁 Video ended, restarting (Demo Mode)...")
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                return self.cap.read()
            else:
                print("⏹️ Stream ended.")
                return False, None
                
        return True, frame

    def release(self):
        if self.cap:
            self.cap.release()
