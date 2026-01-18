"""
OptiVision AI - Main Entry Point
=================================

Real-time worker safety monitoring with:
- Worker detection (persons only, no forklifts)
- Worker re-identification with disappearance tolerance
- PPE compliance detection (helmet, vest, gloves)
- Zone intrusion monitoring
- Real-time streaming to backend via Socket.IO

Usage:
    python main.py              # Run with default settings
    python main.py --offline    # Run without backend connection

For standalone testing without backend, use:
    python analysis_window.py
"""

import cv2
import base64
import socketio
import time
import os
import sys
from dotenv import load_dotenv

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import get_settings
from core import Detector
from core.zone_monitor import ZoneEvent
from utils.api_manager import APIManager

# Load environment variables
load_dotenv()


class OptiVisionAI:
    """
    Main OptiVision AI application.
    
    Coordinates video capture, AI detection, and backend communication.
    """
    
    def __init__(self, offline_mode: bool = False):
        """
        Initialize the AI module.
        
        Args:
            offline_mode: If True, skip backend connection
        """
        self.settings = get_settings()
        self.offline_mode = offline_mode
        
        # Initialize Socket.IO client
        self.sio = socketio.Client()
        self._setup_socket_events()
        
        # Initialize API manager (for REST calls)
        self.api_manager = APIManager()
        
        # Initialize core detector
        self.detector = Detector(on_zone_event=self._on_zone_event)
        
        # Alert cooldowns
        self.alert_cooldowns = {}
        
        # Privacy mode flag
        self.privacy_mode = False
        
        # Activity logging
        self.last_activity_log_time = 0
        
        # Running state
        self.running = False
    
    def _setup_socket_events(self):
        """Setup Socket.IO event handlers."""
        
        @self.sio.event
        def connect():
            print(f"✅ Connected to Backend at {self.settings.backend_url}")
        
        @self.sio.event
        def disconnect():
            print("❌ Disconnected from Backend")
        
        @self.sio.on('zone_update')
        def on_zone_update(data):
            """Handle zone updates from backend/frontend."""
            action = data.get('action') if isinstance(data, dict) else None
            zone_data = data.get('zone') if isinstance(data, dict) else None
            
            try:
                if action == 'created' and zone_data:
                    self.detector.add_zone(zone_data)
                elif action == 'deleted' and zone_data:
                    self.detector.remove_zone(str(zone_data.get('id')))
                elif isinstance(data, list):
                    # Full zone list update
                    self.detector.update_zones(data)
                else:
                    print(f"⚠️ Unknown zone_update format: {type(data)}")
            except Exception as e:
                print(f"❌ Error processing zone_update: {e}")
        
        @self.sio.on('toggle_settings')
        def on_toggle_settings(data):
            if 'privacyMode' in data:
                self.privacy_mode = data['privacyMode']
                print(f"🔒 Privacy Mode: {'ON' if self.privacy_mode else 'OFF'}")
    
    def _on_zone_event(self, event: ZoneEvent):
        """Handle zone events from the detector."""
        current_time = time.time()
        
        if event.event_type == 'VIOLATION':
            # Send alert with cooldown
            cooldown_key = f"zone_{event.worker_id}_{event.zone_id}"
            last_alert = self.alert_cooldowns.get(cooldown_key, 0)
            
            if current_time - last_alert > self.settings.alert_cooldown_seconds:
                print(f"🚨 ZONE VIOLATION: Worker {event.worker_id} in {event.zone_name}")
                
                # We'll capture snapshot in main loop when we have the frame
                self.alert_cooldowns[cooldown_key] = current_time
    
    def _send_zone_alert(self, event: ZoneEvent, snapshot_base64: str = None):
        """Send a zone intrusion alert to the backend."""
        self.api_manager.send_alert(
            type="ZONE_INTRUSION",
            severity="HIGH",
            message=f"Worker {event.worker_id} entered {event.zone_type} zone: {event.zone_name}",
            camera_id=1,
            snapshot=snapshot_base64
        )
    
    def _send_ppe_alert(self, worker_id: int, violations: list, snapshot_base64: str = None):
        """Send a PPE violation alert to the backend."""
        violation_text = ', '.join(v.replace('_', ' ') for v in violations)
        self.api_manager.send_alert(
            type="PPE_VIOLATION",
            severity="MEDIUM",
            message=f"Worker {worker_id}: {violation_text}",
            camera_id=1,
            snapshot=snapshot_base64
        )
    
    def _connect_backend(self):
        """Connect to the backend via Socket.IO."""
        if self.offline_mode:
            print("ℹ️ Running in offline mode (no backend connection)")
            return
        
        try:
            print(f"🔌 Connecting to backend at {self.settings.backend_url}...")
            self.sio.connect(self.settings.backend_url)
        except Exception as e:
            print(f"⚠️ Could not connect to backend: {e}")
            print("   Running in offline mode (no streaming)")
    
    def _fetch_initial_zones(self):
        """Fetch initial zones from backend."""
        if self.offline_mode:
            return
        
        try:
            zones_data = self.api_manager.fetch_zones()
            if zones_data:
                self.detector.update_zones(zones_data)
        except Exception as e:
            print(f"⚠️ Initial zone fetch failed: {e}")
    
    def _log_activity(self):
        """Send activity logs to backend periodically."""
        if self.offline_mode:
            return
        
        current_time = time.time()
        if current_time - self.last_activity_log_time < 5:  # Log every 5 seconds
            return
        
        workers = self.detector.worker_tracker.get_all_workers()
        if workers:
            print(f"⏱️ Syncing Activity Logs for {len(workers)} workers...")
            for worker in workers:
                action = "IDLE" if worker.is_idle else "WORKING"
                self.api_manager.send_activity(
                    worker_id=worker.track_id,
                    action=action,
                    duration=5,
                    camera_id=1
                )
        
        self.last_activity_log_time = current_time
    
    def run(self):
        """Main application loop."""
        print("=" * 60)
        print("🤖 OptiVision AI - Worker Safety Monitoring")
        print("=" * 60)
        
        # Load models
        try:
            self.detector.load_models()
        except Exception as e:
            print(f"❌ Failed to load models: {e}")
            return
        
        # Connect to backend
        self._connect_backend()
        
        # Fetch initial zones
        self._fetch_initial_zones()
        
        # Open video source
        video_source = self.settings.get_video_source()
        cap = cv2.VideoCapture(video_source)
        
        if not cap.isOpened():
            print(f"❌ Error: Could not open video source {video_source}")
            return
        
        # Get video dimensions
        video_width = cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1280
        video_height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 720
        print(f"📐 Video dimensions: {int(video_width)}x{int(video_height)}")
        
        print()
        print("🎥 Starting Video Loop... Press Ctrl+C to stop.")
        print()
        
        self.running = True
        frame_time = 1.0 / self.settings.target_fps
        
        try:
            while self.running:
                loop_start = time.time()
                
                success, frame = cap.read()
                if not success:
                    # Loop video files
                    if isinstance(video_source, str):
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                    else:
                        break
                
                # Run detection pipeline
                result = self.detector.detect(frame, video_width, video_height)
                
                # Process alerts
                self._process_alerts(frame, result)
                
                # Log activity
                self._log_activity()
                
                # Apply privacy mode if enabled
                annotated_frame = frame.copy()
                if self.privacy_mode:
                    annotated_frame = cv2.GaussianBlur(annotated_frame, (99, 99), 30)
                    cv2.putText(annotated_frame, "PRIVACY MODE ACTIVE", (50, 50),
                               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                else:
                    # Draw detection overlays
                    annotated_frame = self._draw_overlays(annotated_frame, result)
                
                # Stream to backend
                if not self.offline_mode and self.sio.connected:
                    self._stream_frame(annotated_frame, result)
                
                # Rate limiting
                elapsed = time.time() - loop_start
                if elapsed < frame_time:
                    time.sleep(frame_time - elapsed)
        
        except KeyboardInterrupt:
            print("\n🛑 Stopping...")
        finally:
            self.running = False
            cap.release()
            if not self.offline_mode:
                self.sio.disconnect()
            print("👋 AI Module Stopped")
    
    def _process_alerts(self, frame, result):
        """Process and send alerts for violations."""
        current_time = time.time()
        
        for worker in result.workers:
            # Zone alerts
            if worker.current_zone and 'DANGER' in (worker.current_zone.upper() or ''):
                cooldown_key = f"zone_{worker.track_id}"
                last_alert = self.alert_cooldowns.get(cooldown_key, 0)
                
                if current_time - last_alert > self.settings.alert_cooldown_seconds:
                    # Capture snapshot
                    _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                    snapshot = base64.b64encode(buffer).decode('utf-8')
                    
                    self.api_manager.send_alert(
                        type="ZONE_INTRUSION",
                        severity="HIGH",
                        message=f"Worker {worker.track_id} in DANGER zone: {worker.current_zone}",
                        camera_id=1,
                        snapshot=snapshot
                    )
                    self.alert_cooldowns[cooldown_key] = current_time
            
            # PPE alerts
            ppe_result = result.ppe_results.get(worker.track_id)
            if ppe_result and ppe_result.violations:
                cooldown_key = f"ppe_{worker.track_id}"
                last_alert = self.alert_cooldowns.get(cooldown_key, 0)
                
                if current_time - last_alert > self.settings.alert_cooldown_seconds:
                    # Capture snapshot
                    _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                    snapshot = base64.b64encode(buffer).decode('utf-8')
                    
                    self._send_ppe_alert(worker.track_id, ppe_result.violations, snapshot)
                    self.alert_cooldowns[cooldown_key] = current_time
    
    def _draw_overlays(self, frame, result):
        """Draw detection overlays on the frame."""
        # Draw workers
        for det in result.raw_detections:
            box = det['box']
            track_id = det['track_id']
            x1, y1, x2, y2 = [int(v) for v in box]
            
            # Get worker state
            worker = self.detector.worker_tracker.get_worker(track_id)
            ppe_result = result.ppe_results.get(track_id)
            
            # Determine color
            color = (0, 255, 0)  # Green - active
            if worker and worker.is_idle:
                color = (255, 165, 0)  # Orange - idle
            if worker and worker.current_zone and 'DANGER' in (worker.current_zone.upper() or ''):
                color = (0, 0, 255)  # Red - danger zone
            
            # Draw box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            # Build label
            label = f"ID:{track_id}"
            if worker and worker.is_idle:
                label += " (IDLE)"
            if worker and worker.current_zone:
                label += f" [{worker.current_zone}]"
            
            cv2.putText(frame, label, (x1, y1 - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        return frame
    
    def _stream_frame(self, frame, result):
        """Stream frame and metadata to backend via Socket.IO."""
        # Compress to JPEG
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), self.settings.stream_jpeg_quality]
        _, buffer = cv2.imencode('.jpg', frame, encode_param)
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        
        # Build metadata
        boxes = []
        for worker in result.workers:
            # Find corresponding raw detection
            raw_det = next((d for d in result.raw_detections 
                           if d['track_id'] == worker.track_id), None)
            if not raw_det:
                continue
            
            ppe = result.ppe_results.get(worker.track_id)
            
            boxes.append({
                'id': worker.track_id,
                'x': raw_det['box'][0],
                'y': raw_det['box'][1],
                'width': raw_det['width'],
                'height': raw_det['height'],
                'label': 'person',
                'confidence': raw_det['confidence'],
                'workerId': str(worker.track_id),
                'isIdle': worker.is_idle,
                'zone': worker.current_zone,
                'minimapX': raw_det['minimap_x'],
                'minimapY': raw_det['minimap_y'],
                'ppeViolation': ppe.violations[0] if ppe and ppe.violations else None
            })
        
        # Emit to backend
        self.sio.emit('stream_data', {
            'image': jpg_as_text,
            'boxes': boxes
        })


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="OptiVision AI Module")
    parser.add_argument('--offline', action='store_true',
                       help='Run without backend connection')
    args = parser.parse_args()
    
    app = OptiVisionAI(offline_mode=args.offline)
    app.run()


if __name__ == "__main__":
    main()
