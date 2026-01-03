import cv2
import time 

#standard Configurations 
VIDEO_SOURCE = "warehouse.mp4"   
TARGET_FPS = 5
FRAME_SIZE = (640, 640)


cap = cv2.VideoCapture(VIDEO_SOURCE)

if not cap.isOpened():
    raise Exception("❌ Unable to open video source")
else:
    print("video accessed successfully")

#logic for fps
original_fps = cap.get(cv2.CAP_PROP_FPS)
frame_skip = int(original_fps / TARGET_FPS)
frame_skip = max(frame_skip, 1)

frame_id = 0
processed_frame_id = 0

while True:
    ret, frame = cap.read()
    
    if not ret:
        break

    if frame_id % frame_skip != 0:
        frame_id += 1
        continue
    frame = cv2.resize(frame, FRAME_SIZE)
    timestamp = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0

 # timestamp = time.time()   for rstp
    frame_packet = {
        "frame": frame,
        "timestamp": timestamp,
        "frame_id": processed_frame_id
    }
    cv2.imshow("Processed Frame", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
    frame_id += 1
    processed_frame_id += 1


cap.release()
cv2.destroyAllWindows()



