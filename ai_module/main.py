import cv2
import base64
import socketio
import time
import numpy as np
import os
import sys
from ultralytics import YOLO
import requests
from dotenv import load_dotenv
from utils.api_manager import APIManager

# Load environment variables
load_dotenv()

# Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3000')
VIDEO_SOURCE = os.getenv('VIDEO_SOURCE', '0')
try:
    VIDEO_SOURCE = int(VIDEO_SOURCE) # Try to convert to int for webcam index
except ValueError:
    pass # Keep as string for file path

AI_DEVICE = os.getenv('AI_DEVICE', 'cpu')
import torch
if torch.cuda.is_available() and AI_DEVICE != 'cpu':
    print(f"🚀 Acceleration Enabled: {torch.cuda.get_device_name(0)}")
else:
    print(f"⚠️ GPU not detected or not requested. Device: {AI_DEVICE}")

# Initialize Socket.IO Client
sio = socketio.Client()

# State Management
worker_states = {} # { track_id: { last_pos: (x,y), last_active_time: timestamp, is_idle: bool } }
zones = [] # List of polygons from backend: [{id, coordinates: [[x,y]...], type}]
alert_cooldowns = {} # { track_id: timestamp }
ALERT_COOLDOWN_SECONDS = 10

api_manager = APIManager()

# Idle Constants
IDLE_THRESHOLD_PIXELS = 20 # Minimum movement to be considered "active"
IDLE_TIME_SECONDS = 30 # Time before marking as idle

# Global Flags
privacy_mode = False

# Initialize YOLO Model
print("⏳ Loading YOLO Model (this may take a moment)...")
try:
    model = YOLO('yolo11n.pt') # Will download automatically if not present
    print("✅ YOLO Model Loaded")
except Exception as e:
    print(f"⚠️ Failed to load yolo11n.pt, falling back to yolov8n.pt: {e}")
    model = YOLO('yolov8n.pt')

# --- Zone Parsing Helper ---
def parse_zones(data):
    parsed_zones = []
    print(f"🔄 Processing {len(data)} zones...")
    for z in data:
        try:
            # Assuming coordinates come as stringified JSON or direct array
            coords = z.get('coordinates')
            if isinstance(coords, str):
                import json
                try:
                    coords = json.loads(coords)
                except json.JSONDecodeError:
                    # Fallback for "0 0 0" or space separated format
                    # If it's just "0 0 0", it's likely invalid for a polygon.
                    # We'll try to split and see if we have pairs, but "0 0 0" is 3 items -> invalid.
                    print(f"⚠️ JSON parse failed for zone {z.get('id')}. Raw: '{coords}'")
                    coords = [] # Treat as empty/invalid to avoid crash
            
            # Ensure coords is a numpy array of points (int32) for OpenCV
            if coords:
                pts = np.array(coords, np.int32)
                pts = pts.reshape((-1, 1, 2))
                parsed_zones.append({
                    "id": z.get('id'),
                    "type": z.get('type', 'DANGER'),
                    "poly": pts
                })
        except Exception as e:
            print(f"⚠️ Failed to parse zone {z.get('id')}: {e}")
            print(f"Propblematic Coords: {z.get('coordinates')} (Type: {type(z.get('coordinates'))})")
    return parsed_zones

# --- Initial Zone Fetch ---
try:
    initial_zones = api_manager.fetch_zones()
    zones = parse_zones(initial_zones)
except Exception as e:
    print(f"⚠️ Initial zone fetch failed: {e}")

# --- Socket Events ---
@sio.event
def connect():
    print(f"✅ Connected to Backend at {BACKEND_URL}")

@sio.event
def disconnect():
    print("❌ Disconnected from Backend")

@sio.on('zone_update')
def on_zone_update(data):
    """
    Receive updated zones from backend.
    """
    global zones
    zones = parse_zones(data)

@sio.on('toggle_settings')
def on_toggle_settings(data):
    global privacy_mode
    if 'privacyMode' in data:
        privacy_mode = data['privacyMode']
        print(f"🔒 Privacy Mode: {'ON' if privacy_mode else 'OFF'}")

# --- Helper Functions ---
def check_zone_intrusion(x, y):
    """
    Check if a point (feet position) is inside any defined zone.
    Returns: zone_type if inside, else None
    """
    for zone in zones:
        # pointPolygonTest returns >0 if inside, 0 on edge, <0 outside
        dist = cv2.pointPolygonTest(zone['poly'], (x, y), False)
        if dist >= 0:
            return zone['type']
    return None

def update_worker_state(track_id, x, y):
    """
    Update worker movement history and determine IDLE state.
    """
    current_time = time.time()
    
    if track_id not in worker_states:
        worker_states[track_id] = {
            'last_pos': (x, y),
            'last_active_time': current_time,
            'is_idle': False
        }
        return False
    
    state = worker_states[track_id]
    last_x, last_y = state['last_pos']
    
    # Calculate distance moved
    dist = np.sqrt((x - last_x)**2 + (y - last_y)**2)
    
    if dist > IDLE_THRESHOLD_PIXELS:
        # Worker moved significantly, reset idle timer
        state['last_pos'] = (x, y)
        state['last_active_time'] = current_time
        state['is_idle'] = False
    else:
        # Worker stationary
        time_stationary = current_time - state['last_active_time']
        if time_stationary > IDLE_TIME_SECONDS:
            state['is_idle'] = True
            
    return state['is_idle']

# --- Main Application Loop ---
def main():
    # Connect to Socket
    try:
        sio.connect(BACKEND_URL)
    except Exception as e:
        print(f"⚠️ Could not connect to backend: {e}")
        print("Running in offline mode (no streaming)")

    # Open Video Source
    cap = cv2.VideoCapture(VIDEO_SOURCE)
    
    if not cap.isOpened():
        print(f"❌ Error: Could not open video source {VIDEO_SOURCE}")
        return

    print("🎥 Starting Video Loop... Press Ctrl+C to stop.")

    try:
        while True:
            success, frame = cap.read()
            if not success:
                # If file, loop it; if stream, break
                if isinstance(VIDEO_SOURCE, str):
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    break

            # Resize for performance if needed (optional)
            # frame = cv2.resize(frame, (1280, 720))

            # --- AI INFERENCE ---
            # Run YOLO with Tracking
            # classes=0 (Person), classes=[0, ...] for more.
            # For Forklift, we might need a custom model or map 'truck'/'car' (classes 2, 7) to 'Forklift'
            results = model.track(frame, persist=True, verbose=False, classes=[0, 2, 7], device=AI_DEVICE) 

            detection_metadata = []
            
            # Annotate Frame manually to control look/feel or use overlay
            # For now, let YOLO plot, but we can customize
            annotated_frame = frame.copy() 
            
            if hasattr(results[0].boxes, 'id') and results[0].boxes.id is not None:
                boxes = results[0].boxes.xyxy.cpu().numpy()
                track_ids = results[0].boxes.id.int().cpu().tolist()
                classes = results[0].boxes.cls.int().cpu().tolist()
                confs = results[0].boxes.conf.cpu().tolist()

                for box, track_id, cls, conf in zip(boxes, track_ids, classes, confs):
                    x1, y1, x2, y2 = box
                    center_x = int((x1 + x2) / 2)
                    bottom_y = int(y2) # Feet position
                    
                    label = model.names[cls]
                    if label in ['car', 'truck', 'bus']:
                        label = 'Forklift' # Crude mapping for hackathon
                    
                    # --- IDLE LOGIC ---
                    is_idle = False
                    if label == 'person':
                        is_idle = update_worker_state(track_id, center_x, bottom_y)
                    
                    # --- ZONE LOGIC ---
                    zone_type = check_zone_intrusion(center_x, bottom_y)

                    # --- ALERT LOGIC ---
                    if zone_type == 'DANGER':
                        current_time = time.time()
                        last_alert = alert_cooldowns.get(track_id, 0)
                        
                        if current_time - last_alert > ALERT_COOLDOWN_SECONDS:
                            print(f"🚨 TRIGGERING ALERT: Worker {track_id} in DANGER ZONE")
                            # Send snapshot? (Optional optimization: catch frame)
                            # For now just send message
                            api_manager.send_alert(
                                type="ZONE_INTRUSION",
                                severity="HIGH",
                                message=f"Worker {track_id} entered a DANGER zone.",
                                camera_id=1
                            )
                            alert_cooldowns[track_id] = current_time
                    
                    # --- METADATA ---
                    detection_metadata.append({
                        "id": track_id,
                        "x": float(x1),
                        "y": float(y1),
                        "width": float(x2 - x1),
                        "height": float(y2 - y1),
                        "label": label,
                        "confidence": float(conf),
                        "workerId": str(track_id), # Map track ID to worker ID
                        "isIdle": is_idle,
                        "zone": zone_type
                    })

                    # Custom Drawing (Overlay)
                    color = (0, 255, 0) # Green
                    if is_idle: color = (255, 0, 0) # Blue for Idle
                    if zone_type == 'DANGER': color = (0, 0, 255) # Red for Danger
                    if label == 'Forklift': color = (0, 165, 255) # Orange

                    # Draw Box
                    cv2.rectangle(annotated_frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                    
                    # Draw Label
                    text = f"ID:{track_id} {label}"
                    if is_idle: text += " (IDLE)"
                    if zone_type: text += f" [{zone_type}]"
                    
                    cv2.putText(annotated_frame, text, (int(x1), int(y1)-5), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                    
            # --- ACTIVITY LOGGING (HEARTBEAT) ---
            current_time = time.time()
            if 'last_activity_log_time' not in locals():
                last_activity_log_time = current_time

            if current_time - last_activity_log_time > 5: # Log every 5 seconds
                print(f"⏱️ Syncing Activity Logs for {len(worker_states)} workers...")
                for t_id, state in worker_states.items():
                    # We assume if they are in worker_states, they are currently tracked or recently tracked.
                    # Ideally we should filter by recent visibility, but for now log all valid states.
                    # Simple heuristic: Only log if we saw them recently (e.g. < 5s ago)
                    # For this MVP, we log whatever state is current.
                    
                    action = "IDLE" if state['is_idle'] else "WORKING"
                    # Send 5 seconds worth of duration
                    api_manager.send_activity(
                        worker_id=t_id,
                        action=action,
                        duration=5,
                        camera_id=1
                    )
                last_activity_log_time = current_time

            # --- PRIVACY MODE ---
            if privacy_mode:
                annotated_frame = cv2.GaussianBlur(annotated_frame, (99, 99), 30)
                cv2.putText(annotated_frame, "PRIVACY MODE ACTIVE", (50, 50), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            # --- STREAMING ---
            # Compress to JPEG
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 60]
            _, buffer = cv2.imencode('.jpg', annotated_frame, encode_param)
            jpg_as_text = base64.b64encode(buffer).decode('utf-8')

            # Emit to Backend
            if sio.connected:
                sio.emit('stream_data', {
                    'image': jpg_as_text,
                    'boxes': detection_metadata
                })

            # Show local window (optional, good for debug)
            # cv2.imshow('OptiVision AI', annotated_frame)
            # if cv2.waitKey(1) & 0xFF == ord('q'):
            #     break

            # Rate Limit (approx 30 FPS)
            time.sleep(0.033)

    except KeyboardInterrupt:
        print("🛑 Stopping...")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        sio.disconnect()
        print("👋 AI Module Stopped")

if __name__ == "__main__":
    main()
