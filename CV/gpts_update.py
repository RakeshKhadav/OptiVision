from ultralytics import YOLO
import math
from collections import defaultdict, deque
import cv2

# ---------- LOAD MODELS ----------
det_model = YOLO("yolov8s.pt")           # Detection + tracking
pose_model = YOLO("yolov8s-pose.pt")     # Pose estimation

print("Models loaded successfully!")

# ---------- PARAMETERS ----------
VIDEO_PATH = "warehouse.mp4"
CONF_THRESHOLD = 0.1
SPEED_THRESHOLD = 2               # pixels/frame for centroid
HAND_SPEED_THRESHOLD = 1.5        # pixels/frame for hands
IDLE_FRAMES_THRESHOLD = 150       # ~5 sec at 30 FPS
HISTORY_LEN = 5                    # Frames for smoothing
HAND_INDICES = [9, 10]            # Example: wrist keypoints (depends on pose model)

# ---------- TRACK HISTORY ----------
centroid_history = defaultdict(lambda: deque(maxlen=HISTORY_LEN))
hand_history = defaultdict(lambda: deque(maxlen=HISTORY_LEN))
idle_counters = defaultdict(int)

# ---------- VIDEO CAPTURE ----------
cap = cv2.VideoCapture(VIDEO_PATH)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
wait_time = int(1000 / fps)
frame_idx = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # --- YOLO DETECTION + TRACKING ---
    track_results = det_model.track(frame, conf=CONF_THRESHOLD, persist=True, classes=[0])
    if not track_results:
        frame_idx += 1
        continue
    t_frame = track_results[0]  # Single frame output

    # --- PROCESS EACH TRACKED PERSON ---
    for box_idx, box in enumerate(t_frame.boxes.xyxy):
        track_id = int(t_frame.boxes.id[box_idx])
        x1, y1, x2, y2 = [int(v) for v in box]

        # --- CROP FOR POSE ESTIMATION ---
        person_crop = frame[y1:y2, x1:x2]
        pose_out = pose_model(person_crop, conf=CONF_THRESHOLD)
        keypoints = []
        if pose_out and len(pose_out[0].keypoints.xy) > 0:
            # Use first person detected in crop (should be only one)
            kp_raw = pose_out[0].keypoints.xy[0]
            # Adjust coordinates relative to full frame
            keypoints = [(int(x + x1), int(y + y1), c) if len(kp) == 3 else (int(x + x1), int(y + y1))
                         for kp in kp_raw for x, y, *c in [kp]]

        # --- CENTROID FROM KEYPOINTS (fallback to box centroid) ---
        if keypoints:
            x_coords = [pt[0] for pt in keypoints if len(pt) >= 2]
            y_coords = [pt[1] for pt in keypoints if len(pt) >= 2]
            centroid = (sum(x_coords)//len(x_coords), sum(y_coords)//len(y_coords))
        else:
            centroid = ((x1+x2)//2, (y1+y2)//2)

        centroid_history[track_id].append(centroid)

        # --- HAND MOTION ---
        hand_points = []
        for h_idx in HAND_INDICES:
            if keypoints and h_idx < len(keypoints):
                hand_points.append(keypoints[h_idx][:2])
        hand_history[track_id].append(hand_points)

        # --- SPEED CALCULATION ---
        # Centroid speed
        if len(centroid_history[track_id]) > 1:
            avg_c = (
                sum(c[0] for c in centroid_history[track_id])/len(centroid_history[track_id]),
                sum(c[1] for c in centroid_history[track_id])/len(centroid_history[track_id])
            )
            dx, dy = centroid[0]-avg_c[0], centroid[1]-avg_c[1]
            centroid_speed = math.sqrt(dx**2 + dy**2)
        else:
            centroid_speed = 0

        # Hand speed
        hand_speed = 0
        if len(hand_history[track_id]) > 1:
            prev_hands = hand_history[track_id][-2]
            cur_hands = hand_history[track_id][-1]
            speeds = []
            for p, c in zip(prev_hands, cur_hands):
                dx, dy = c[0]-p[0], c[1]-p[1]
                speeds.append(math.sqrt(dx**2 + dy**2))
            hand_speed = sum(speeds)/len(speeds) if speeds else 0

        # --- ENGAGEMENT SCORE & IDLE STATUS ---
        engagement = 0.7*hand_speed + 0.3*centroid_speed
        if engagement < HAND_SPEED_THRESHOLD:
            idle_counters[track_id] += 1
        else:
            idle_counters[track_id] = 0

        status = "Idle" if idle_counters[track_id] >= IDLE_FRAMES_THRESHOLD else "Active"

        # --- DRAW BOX + STATUS ---
        color = (0,0,255) if status=="Idle" else (0,255,0)
        cv2.rectangle(frame, (x1,y1), (x2,y2), color, 2)
        cv2.putText(frame, f"ID {track_id}: {status}", (x1, y1-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        # --- DRAW POSE SKELETON ---
        for pt in keypoints:
            if len(pt) == 3:
                x, y, conf = pt
                if conf > 0.3:
                    cv2.circle(frame, (int(x), int(y)), 3, (255,0,0), -1)
            else:
                x, y = pt
                cv2.circle(frame, (int(x), int(y)), 3, (255,0,0), -1)

    # --- SHOW FRAME ---
    cv2.imshow("Warehouse Monitoring", frame)
    if cv2.waitKey(wait_time) & 0xFF == 27:  # Esc to quit
        break

    frame_idx += 1

cap.release()
cv2.destroyAllWindows()
print("Tracking + Pose + Idle/Engagement analysis complete!")
