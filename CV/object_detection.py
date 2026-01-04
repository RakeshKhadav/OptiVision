from ultralytics import YOLO
import math
from collections import defaultdict, deque
import cv2


model = YOLO("yolov8s.pt")             
pose_model = YOLO("yolov8s-pose.pt")   # pose estimation for idle tracking
print("model load ho gaya haiiiiiiii")


track_results = model.track("warehouse.mp4", conf=0.1, persist=True, classes=[0], show=True) #object detection
pose_results = pose_model("warehouse.mp4", conf=0.1, imgsz=640, show=True) #pose estimation

# to increase efficiency inceease fps



#idle and active tracking
prev_history = defaultdict(lambda: deque(maxlen=5))  # store last 5 centroids per ID
idle_counters = defaultdict(int)                     # frames idle per ID

SPEED_THRESHOLD = 2                
IDLE_FRAMES_THRESHOLD = 150    

cap = cv2.VideoCapture("warehouse.mp4")   # third video 

fps = cap.get(cv2.CAP_PROP_FPS) or 30
wait_time = int(1000 / fps)
frame_idx = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # --- TRACKING INFO ---
    if frame_idx < len(track_results):
        t_frame = track_results[frame_idx]
        boxes = t_frame.boxes
        ids = boxes.id if boxes.id is not None else []

        for i, box in enumerate(boxes.xyxy):
            x1, y1, x2, y2 = [int(v) for v in box]
            ID = int(ids[i])

            # --- COMPUTE CENTROID USING POSE KEYPOINTS ---
            centroid = None
            if frame_idx < len(pose_results):
                p_frame = pose_results[frame_idx]
                if i < len(p_frame.keypoints.xy):
                    person_kp = p_frame.keypoints.xy[i]
                    x_coords = [pt[0] for pt in person_kp if len(pt) >= 2]
                    y_coords = [pt[1] for pt in person_kp if len(pt) >= 2]
                    if x_coords and y_coords:
                        centroid = (sum(x_coords)//len(x_coords), sum(y_coords)//len(y_coords))
            if centroid is None:
                # fallback to box centroid
                centroid = ((x1 + x2)//2, (y1 + y2)//2)

            # --- SMOOTH MOTION OVER LAST 5 FRAMES ---
            prev_history[ID].append(centroid)
            if len(prev_history[ID]) > 1:
                avg_prev = (
                    sum(c[0] for c in prev_history[ID])/len(prev_history[ID]),
                    sum(c[1] for c in prev_history[ID])/len(prev_history[ID])
                )
                dx = centroid[0] - avg_prev[0]
                dy = centroid[1] - avg_prev[1]
                speed = math.sqrt(dx**2 + dy**2)
            else:
                speed = 0

            # --- IDLE STATUS ---
            if speed < SPEED_THRESHOLD:
                idle_counters[ID] += 1
            else:
                idle_counters[ID] = 0
            status = "Idle" if idle_counters[ID] >= IDLE_FRAMES_THRESHOLD else "Active"

            # --- DRAW ON FRAME ---
            color = (0, 0, 255) if status == "Idle" else (0, 255, 0)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"ID {ID}: {status}", (x1, y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    # --- DRAW POSE SKELETON ---
    if frame_idx < len(pose_results):
        p_frame = pose_results[frame_idx]
        for person_kp in p_frame.keypoints.xy:
            for point in person_kp:
                if len(point) == 3:
                    x, y, conf = point
                    if conf > 0.3:
                        cv2.circle(frame, (int(x), int(y)), 3, (255, 0, 0), -1)
                elif len(point) == 2:
                    x, y = point
                    cv2.circle(frame, (int(x), int(y)), 3, (255, 0, 0), -1)

    # --- SHOW FRAME AT REAL SPEED ---
    cv2.imshow("Warehouse Monitoring", frame)
    if cv2.waitKey(wait_time) & 0xFF == 27:  
        break

    frame_idx += 1

cap.release()
cv2.destroyAllWindows()
print("Idle / Motion tracking complete!")
