from ultralytics import YOLO
import cv2
import math
from collections import defaultdict, deque

# ===============================
# LOAD MODELS
# ===============================
det_model = YOLO("yolov8s.pt")          # detection + tracking
pose_model = YOLO("yolov8s-pose.pt")    # pose estimation

print("Models loaded ✅")

# ===============================
# PARAMETERS
# ===============================
VIDEO_PATH = "warehouse.mp4"

CONF = 0.2
HISTORY_LEN = 5
IDLE_DISPLACEMENT_THRESH = 2.0     # px/frame
IDLE_FRAMES_THRESH = 150           # ~5 sec @ 30 FPS

# ===============================
# DATA STORAGE
# ===============================
pose_history = defaultdict(lambda: deque(maxlen=HISTORY_LEN))
idle_counter = defaultdict(int)

# ===============================
# SKELETON (YOLOv8-POSE FORMAT)
# ===============================
SKELETON = [
    (0,1),(0,2),
    (1,3),(2,4),
    (5,6),
    (5,7),(7,9),
    (6,8),(8,10),
    (5,11),(6,12),
    (11,12),
    (11,13),(13,15),
    (12,14),(14,16)
]

# ===============================
# HELPER FUNCTIONS
# ===============================
def avg_joint_displacement(prev_kp, curr_kp):
    dists = []
    for p, c in zip(prev_kp, curr_kp):
        if p is not None and c is not None:
            dx = c[0] - p[0]
            dy = c[1] - p[1]
            dists.append(math.sqrt(dx*dx + dy*dy))
    return sum(dists) / len(dists) if dists else 0


def unsafe_posture(kp):
    """
    Simple ergonomic rules
    """
    try:
        head_y = kp[0][1]
        shoulder_y = (kp[5][1] + kp[6][1]) / 2
        hip_y = (kp[11][1] + kp[12][1]) / 2

        # Slouching
        if head_y - shoulder_y > 25:
            return True

        # Arms hanging idle
        if kp[9][1] > hip_y + 10 and kp[10][1] > hip_y + 10:
            return True

    except:
        return False

    return False

# ===============================
# VIDEO LOOP
# ===============================
cap = cv2.VideoCapture(VIDEO_PATH)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
wait = int(1000 / fps)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # ---------- TRACKING ----------
    results = det_model.track(
        frame,
        persist=True,
        conf=CONF,
        classes=[0]
    )

    if not results or results[0].boxes.id is None:
        cv2.imshow("Warehouse Worker Monitoring", frame)
        if cv2.waitKey(wait) == 27:
            break
        continue

    boxes = results[0].boxes.xyxy
    ids = results[0].boxes.id

    # ---------- PROCESS EACH PERSON ----------
    for i, box in enumerate(boxes):
        track_id = int(ids[i])
        x1, y1, x2, y2 = map(int, box)

        crop = frame[y1:y2, x1:x2]
        if crop.size == 0:
            continue

        # ---------- POSE ----------
        pose_out = pose_model(crop, conf=CONF)

        # ✅ CRITICAL SAFETY CHECK (FIXES YOUR ERROR)
        if (
            not pose_out or
            pose_out[0].keypoints is None or
            pose_out[0].keypoints.xy is None or
            len(pose_out[0].keypoints.xy) == 0
        ):
            continue

        kp_raw = pose_out[0].keypoints.xy[0]

        # Convert pose to full-frame coordinates
        keypoints = []
        for p in kp_raw:
            if len(p) >= 2:
                keypoints.append((int(p[0] + x1), int(p[1] + y1)))
            else:
                keypoints.append(None)

        # ---------- STORE HISTORY ----------
        pose_history[track_id].append(keypoints)

        # ---------- ACTIVITY METRICS ----------
        displacement = 0
        if len(pose_history[track_id]) > 1:
            displacement = avg_joint_displacement(
                pose_history[track_id][-2],
                pose_history[track_id][-1]
            )

        unsafe = unsafe_posture(keypoints)

        if displacement < IDLE_DISPLACEMENT_THRESH:
            idle_counter[track_id] += 1
        else:
            idle_counter[track_id] = 0

        # ---------- STATUS ----------
        if unsafe:
            status = "ATTENTION"
            color = (0, 0, 255)       # Red
        elif idle_counter[track_id] >= IDLE_FRAMES_THRESH:
            status = "IDLE"
            color = (0, 255, 255)     # Yellow
        else:
            status = "ACTIVE"
            color = (0, 255, 0)       # Green

        # ---------- DRAW ----------
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, f"ID {track_id}: {status}",
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        # Skeleton
        for a, b in SKELETON:
            if a < len(keypoints) and b < len(keypoints):
                if keypoints[a] and keypoints[b]:
                    cv2.line(frame, keypoints[a], keypoints[b], color, 2)

        for p in keypoints:
            if p:
                cv2.circle(frame, p, 3, color, -1)

    # ---------- SHOW ----------
    cv2.imshow("Warehouse Worker Monitoring", frame)
    if cv2.waitKey(wait) == 27:
        break

cap.release()
cv2.destroyAllWindows()
print("Task completed successfully ✅")
