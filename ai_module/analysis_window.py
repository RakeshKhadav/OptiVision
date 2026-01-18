"""
OptiVision AI - Standalone Analysis Window
==========================================

A self-contained testing interface for the AI detection system.
No backend/frontend dependencies required.

Usage:
    python analysis_window.py --source warehouse_footage.mp4
    python analysis_window.py --source 0  # webcam
    python analysis_window.py --source warehouse_footage.mp4 --zones zones.json

Controls:
    Q = Quit
    SPACE = Pause/Resume
    Z = Toggle zone overlay
    P = Toggle PPE detection
    D = Toggle debug info
    R = Reset tracking
    S = Save screenshot
    1-4 = Move zones to different preset positions
"""

import cv2
import json
import argparse
import time
import sys
import os
import numpy as np
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import get_settings
from core import Detector, WorkerTracker, PPEDetector, ZoneMonitor
from core.ppe_detector import PPEResult
from core.zone_monitor import ZoneEvent


class AnalysisWindow:
    """
    Standalone GUI for testing the OptiVision AI detection system.
    
    Features:
    - Video playback with detection overlays
    - Zone visualization
    - PPE status badges
    - Worker tracking visualization
    - Real-time statistics
    - Keyboard controls
    - Zone position presets for testing
    """
    
    def __init__(self, source, zones_file=None):
        """
        Initialize the analysis window.
        
        Args:
            source: Video file path or webcam index
            zones_file: Optional JSON file with zone definitions
        """
        self.settings = get_settings()
        self.source = source
        self.zones_file = zones_file
        
        # Initialize detector
        self.detector = Detector(on_zone_event=self._on_zone_event)
        
        # State flags
        self.paused = False
        self.show_zones = True
        self.show_ppe = True
        self.show_debug = False
        self.running = True
        
        # Video dimensions (set in run())
        self.video_width = 640
        self.video_height = 360
        
        # Store last detection result for drawing
        self.last_result = None
        
        # Event log (last 10 events)
        self.event_log: list[str] = []
        self.max_events = 10
        
        # Colors
        self.colors = {
            'active': (0, 255, 0),      # Green
            'idle': (0, 165, 255),       # Orange (BGR)
            'danger': (0, 0, 255),       # Red
            'compliant': (0, 200, 0),    # Green
            'violation': (0, 0, 255),    # Red
            'text_bg': (0, 0, 0),        # Black
            'ppe_ok': (0, 200, 0),       # Green
            'ppe_bad': (0, 0, 200),      # Red
        }
        
        # Fonts
        self.font = cv2.FONT_HERSHEY_SIMPLEX
        self.font_scale = 0.5
        self.font_thickness = 1
        
    def _on_zone_event(self, event: ZoneEvent):
        """Handle zone events."""
        # More detailed event logging
        emoji = {'ENTER': '🚧', 'EXIT': '🚪', 'VIOLATION': '🚨'}.get(event.event_type, '📍')
        msg = f"[{time.strftime('%H:%M:%S')}] {emoji} {event.event_type}: Worker {event.worker_id} -> {event.zone_name} ({event.zone_type})"
        self.event_log.append(msg)
        print(msg)  # Also print to console
        if len(self.event_log) > self.max_events:
            self.event_log.pop(0)
    
    def load_zones(self):
        """Load zones from file if specified."""
        if self.zones_file and os.path.exists(self.zones_file):
            try:
                with open(self.zones_file, 'r') as f:
                    zones_data = json.load(f)
                self.detector.update_zones(zones_data)
                print(f"✅ Loaded zones from {self.zones_file}")
            except Exception as e:
                print(f"⚠️ Failed to load zones: {e}")
        else:
            # Create demo zones for testing - positioned where workers are
            self._create_demo_zones(preset=1)
    
    def _create_demo_zones(self, preset=1):
        """Create demo zones for testing at various positions."""
        w = self.video_width
        h = self.video_height
        
        if preset == 1:
            # Preset 1: Center of the frame (where workers usually are)
            demo_zones = [
                {
                    'id': 'demo_danger_1',
                    'name': 'Danger Zone',
                    'type': 'DANGER',
                    'coordinates': [
                        [w * 0.35, h * 0.4],
                        [w * 0.65, h * 0.4],
                        [w * 0.65, h * 0.75],
                        [w * 0.35, h * 0.75]
                    ]
                },
                {
                    'id': 'demo_safe_1',
                    'name': 'Safe Zone',
                    'type': 'SAFE',
                    'coordinates': [
                        [w * 0.05, h * 0.05],
                        [w * 0.25, h * 0.05],
                        [w * 0.25, h * 0.2],
                        [w * 0.05, h * 0.2]
                    ]
                }
            ]
        elif preset == 2:
            # Preset 2: Left side where the worker table is
            demo_zones = [
                {
                    'id': 'demo_danger_1',
                    'name': 'Work Table Zone',
                    'type': 'DANGER',
                    'coordinates': [
                        [w * 0.2, h * 0.35],
                        [w * 0.5, h * 0.35],
                        [w * 0.5, h * 0.7],
                        [w * 0.2, h * 0.7]
                    ]
                }
            ]
        elif preset == 3:
            # Preset 3: Bottom right corner
            demo_zones = [
                {
                    'id': 'demo_danger_1',
                    'name': 'Restricted Area',
                    'type': 'RESTRICTED',
                    'coordinates': [
                        [w * 0.6, h * 0.6],
                        [w * 0.95, h * 0.6],
                        [w * 0.95, h * 0.9],
                        [w * 0.6, h * 0.9]
                    ]
                }
            ]
        elif preset == 4:
            # Preset 4: Full walkway across frame
            demo_zones = [
                {
                    'id': 'demo_danger_1',
                    'name': 'Walkway Zone',
                    'type': 'DANGER',
                    'coordinates': [
                        [w * 0.1, h * 0.5],
                        [w * 0.9, h * 0.5],
                        [w * 0.9, h * 0.75],
                        [w * 0.1, h * 0.75]
                    ]
                }
            ]
        
        self.detector.update_zones(demo_zones)
        print(f"📍 Zone Preset {preset} loaded. Press 1-4 to change zone positions.")
    
    def run(self):
        """Main run loop."""
        print("=" * 60)
        print("🎥 OptiVision AI - Analysis Window")
        print("=" * 60)
        
        # Open video source first to get dimensions
        cap = cv2.VideoCapture(self.source)
        if not cap.isOpened():
            print(f"❌ Could not open video source: {self.source}")
            return
        
        # Get video properties
        self.video_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1280)
        self.video_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 720)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        
        print(f"📐 Video: {self.video_width}x{self.video_height} @ {fps:.1f} FPS")
        
        # Load models
        try:
            self.detector.load_models()
        except Exception as e:
            print(f"❌ Failed to load models: {e}")
            cap.release()
            return
        
        # Load zones (now with correct dimensions)
        self.load_zones()
        
        print()
        print("🎮 Controls:")
        print("   Q = Quit | SPACE = Pause | Z = Zones | P = PPE | D = Debug | R = Reset | S = Screenshot")
        print("   1-4 = Change zone position presets")
        print()
        
        # Create window
        window_name = "OptiVision AI Analysis"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window_name, 
                         self.settings.analysis_window_width, 
                         self.settings.analysis_window_height)
        
        frame_count = 0
        frame_delay = int(1000 / fps)
        current_frame = None
        
        try:
            while self.running:
                if not self.paused:
                    ret, frame = cap.read()
                    
                    if not ret:
                        # Loop video
                        if isinstance(self.source, str):
                            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                            continue
                        else:
                            break
                    
                    frame_count += 1
                    current_frame = frame.copy()
                    
                    # Run detection
                    self.last_result = self.detector.detect(frame, self.video_width, self.video_height)
                    
                    # Draw overlays
                    output_frame = self._draw_overlays(frame, self.last_result)
                    
                    # Show frame
                    cv2.imshow(window_name, output_frame)
                
                # Handle keyboard input
                key = cv2.waitKey(frame_delay if not self.paused else 100) & 0xFF
                self._handle_key(key, current_frame)
                
                # Check if window was closed
                if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
                    break
                    
        except KeyboardInterrupt:
            print("\n🛑 Interrupted by user")
        finally:
            cap.release()
            cv2.destroyAllWindows()
            print("👋 Analysis window closed")
    
    def _draw_overlays(self, frame, result) -> np.ndarray:
        """Draw all detection overlays on the frame."""
        output = frame.copy()
        
        # Draw zones (bottom layer)
        if self.show_zones:
            self._draw_zones(output)
        
        # Draw worker detections using ACTUAL YOLO boxes
        for det in result.raw_detections:
            track_id = det['track_id']
            worker = self.detector.worker_tracker.get_worker(track_id)
            ppe = result.ppe_results.get(track_id, PPEResult(worker_id=track_id))
            self._draw_worker(output, det, worker, ppe)
        
        # Draw status bar
        self._draw_status_bar(output, result)
        
        # Draw event log
        self._draw_event_log(output)
        
        # Draw PPE legend
        if self.show_ppe:
            self._draw_ppe_legend(output, result)
        
        # Draw debug info
        if self.show_debug:
            self._draw_debug(output, result)
        
        # Draw pause indicator
        if self.paused:
            self._draw_pause_indicator(output)
        
        return output
    
    def _draw_zones(self, frame):
        """Draw zone overlays."""
        for zone in self.detector.get_zones():
            pts = np.array(zone.coordinates, np.int32).reshape((-1, 1, 2))
            
            # Draw filled polygon with transparency
            overlay = frame.copy()
            cv2.fillPoly(overlay, [pts], zone.color)
            cv2.addWeighted(overlay, 0.3, frame, 0.7, 0, frame)
            
            # Draw border
            cv2.polylines(frame, [pts], True, zone.color, 2)
            
            # Draw label
            center = np.mean(zone.coordinates, axis=0).astype(int)
            cv2.putText(frame, f"{zone.name} ({zone.zone_type})", tuple(center), 
                       self.font, 0.5, (255, 255, 255), 2)
    
    def _draw_worker(self, frame, detection: dict, worker, ppe: PPEResult):
        """Draw a single worker detection using actual YOLO bounding box."""
        # Use actual YOLO bounding box
        box = detection['box']
        x1, y1, x2, y2 = [int(v) for v in box]
        track_id = detection['track_id']
        confidence = detection['confidence']
        
        # Determine color based on state
        color = self.colors['active']
        if worker:
            if worker.current_zone and 'DANGER' in (worker.current_zone.upper() or ''):
                color = self.colors['danger']
            elif worker.is_idle:
                color = self.colors['idle']
        
        # Draw bounding box
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        
        # Draw ID label with confidence
        label = f"ID:{track_id} ({confidence:.0%})"
        if worker and worker.is_idle:
            label += " IDLE"
        
        # Draw label background
        label_size = cv2.getTextSize(label, self.font, self.font_scale, self.font_thickness)[0]
        cv2.rectangle(frame, (x1, y1 - label_size[1] - 8), 
                     (x1 + label_size[0] + 4, y1), color, -1)
        cv2.putText(frame, label, (x1 + 2, y1 - 4), 
                   self.font, self.font_scale, (255, 255, 255), self.font_thickness)
        
        # Draw PPE status badges (larger and more visible)
        if self.show_ppe:
            self._draw_ppe_badges(frame, x1, x2, y2, ppe)
        
        # Draw zone indicator if in a zone
        if worker and worker.current_zone:
            zone_label = f"[{worker.current_zone}]"
            cv2.putText(frame, zone_label, (x1, y2 + 35), 
                       self.font, self.font_scale, color, self.font_thickness)
    
    def _draw_ppe_badges(self, frame, x1, x2, y2, ppe: PPEResult):
        """Draw PPE compliance badges - larger and more visible."""
        badge_y = y2 + 5
        badge_height = 22
        badge_width = 35
        
        # Helmet badge
        helmet_color = self.colors['ppe_ok'] if ppe.has_helmet else self.colors['ppe_bad']
        helmet_text = "H:OK" if ppe.has_helmet else "H:NO"
        cv2.rectangle(frame, (x1, badge_y), (x1 + badge_width, badge_y + badge_height), helmet_color, -1)
        cv2.putText(frame, helmet_text, (x1 + 2, badge_y + 16), 
                   self.font, 0.4, (255, 255, 255), 1)
        
        # Vest badge
        vest_color = self.colors['ppe_ok'] if ppe.has_vest else self.colors['ppe_bad']
        vest_text = "V:OK" if ppe.has_vest else "V:NO"
        cv2.rectangle(frame, (x1 + badge_width + 3, badge_y), (x1 + badge_width * 2 + 3, badge_y + badge_height), vest_color, -1)
        cv2.putText(frame, vest_text, (x1 + badge_width + 5, badge_y + 16), 
                   self.font, 0.4, (255, 255, 255), 1)
        
        # Compliance indicator
        if ppe.is_compliant:
            cv2.putText(frame, "✓", (x1 + badge_width * 2 + 10, badge_y + 16), 
                       self.font, 0.6, (0, 255, 0), 2)
        else:
            cv2.putText(frame, "X", (x1 + badge_width * 2 + 10, badge_y + 16), 
                       self.font, 0.6, (0, 0, 255), 2)
    
    def _draw_ppe_legend(self, frame, result):
        """Draw PPE detection legend in top right corner."""
        h, w = frame.shape[:2]
        
        # Count stats
        total = len(result.ppe_results)
        if total == 0:
            return
            
        with_helmet = sum(1 for p in result.ppe_results.values() if p.has_helmet)
        with_vest = sum(1 for p in result.ppe_results.values() if p.has_vest)
        compliant = sum(1 for p in result.ppe_results.values() if p.is_compliant)
        
        # Draw legend box
        legend_x = w - 180
        legend_y = 10
        cv2.rectangle(frame, (legend_x, legend_y), (w - 10, legend_y + 80), (40, 40, 40), -1)
        cv2.rectangle(frame, (legend_x, legend_y), (w - 10, legend_y + 80), (100, 100, 100), 1)
        
        # Draw legend text
        cv2.putText(frame, "PPE Status", (legend_x + 10, legend_y + 18), 
                   self.font, 0.5, (255, 255, 255), 1)
        cv2.putText(frame, f"Helmet: {with_helmet}/{total}", (legend_x + 10, legend_y + 38), 
                   self.font, 0.45, (200, 200, 200), 1)
        cv2.putText(frame, f"Vest: {with_vest}/{total}", (legend_x + 10, legend_y + 55), 
                   self.font, 0.45, (200, 200, 200), 1)
        cv2.putText(frame, f"Compliant: {compliant}/{total}", (legend_x + 10, legend_y + 72), 
                   self.font, 0.45, (0, 255, 0) if compliant == total else (0, 200, 255), 1)
    
    def _draw_status_bar(self, frame, result):
        """Draw the bottom status bar."""
        h, w = frame.shape[:2]
        bar_height = 35
        
        # Draw background
        cv2.rectangle(frame, (0, h - bar_height), (w, h), (30, 30, 30), -1)
        
        # Get stats
        stats = self.detector.get_stats()
        
        # Build status text
        fps = 1000/max(result.processing_time_ms, 1)
        status_parts = [
            f"Workers: {stats['total_workers']}",
            f"Active: {stats['active_workers']}",
            f"Idle: {stats['idle_workers']}",
            f"Zones: {stats['zones_defined']}",
            f"FPS: {fps:.1f}",
        ]
        
        if self.show_ppe and stats['ppe_compliance']:
            compliance_rate = stats['ppe_compliance'].get('compliance_rate', 100)
            status_parts.append(f"PPE: {compliance_rate:.0f}%")
        
        status_text = " | ".join(status_parts)
        
        cv2.putText(frame, status_text, (10, h - 10), 
                   self.font, 0.55, (200, 200, 200), 1)
        
        # Draw toggle indicators
        toggles = []
        if self.show_zones:
            toggles.append("Z:ON")
        if self.show_ppe:
            toggles.append("P:ON")
        if self.show_debug:
            toggles.append("D:ON")
        
        toggle_text = " | ".join(toggles)
        toggle_size = cv2.getTextSize(toggle_text, self.font, 0.45, 1)[0]
        cv2.putText(frame, toggle_text, (w - toggle_size[0] - 10, h - 10), 
                   self.font, 0.45, (150, 150, 150), 1)
    
    def _draw_event_log(self, frame):
        """Draw the event log in top left."""
        log_y = 20
        
        # Draw header
        cv2.putText(frame, "Zone Events:", (10, log_y), 
                   self.font, 0.5, (255, 255, 0), 1)
        
        for i, msg in enumerate(self.event_log[-7:]):
            y = log_y + 18 + (i * 16)
            # Determine color based on event type
            if 'VIOLATION' in msg or '🚨' in msg:
                color = (0, 0, 255)
            elif 'ENTER' in msg or '🚧' in msg:
                color = (0, 200, 255)
            elif 'EXIT' in msg or '🚪' in msg:
                color = (150, 255, 150)
            else:
                color = (150, 150, 150)
            
            # Truncate long messages
            display_msg = msg[:60] + "..." if len(msg) > 60 else msg
            cv2.putText(frame, display_msg, (10, y), 
                       self.font, 0.4, color, 1)
    
    def _draw_debug(self, frame, result):
        """Draw debug information."""
        h = frame.shape[0]
        debug_info = [
            f"Frame: {result.frame_number}",
            f"Processing: {result.processing_time_ms:.1f}ms",
            f"Raw Detections: {len(result.raw_detections)}",
            f"Tracked Workers: {len(result.workers)}",
            f"Conf Threshold: {self.settings.detection_confidence_threshold}",
            f"PPE Enabled: {self.settings.ppe_enabled}",
            f"Device: {self.settings.ai_device}",
        ]
        
        for i, info in enumerate(debug_info):
            cv2.putText(frame, info, (10, h - 50 - (len(debug_info) - i) * 18), 
                       self.font, 0.45, (0, 255, 255), 1)
    
    def _draw_pause_indicator(self, frame):
        """Draw pause indicator."""
        h, w = frame.shape[:2]
        cv2.putText(frame, "PAUSED", (w // 2 - 50, h // 2), 
                   self.font, 1.5, (0, 0, 255), 3)
    
    def _handle_key(self, key, frame):
        """Handle keyboard input."""
        if key == ord('q') or key == 27:  # Q or ESC
            self.running = False
        
        elif key == ord(' '):  # Space
            self.paused = not self.paused
            print("⏸️ Paused" if self.paused else "▶️ Resumed")
        
        elif key == ord('z'):  # Toggle zones
            self.show_zones = not self.show_zones
            print(f"🔲 Zones: {'ON' if self.show_zones else 'OFF'}")
        
        elif key == ord('p'):  # Toggle PPE
            self.show_ppe = not self.show_ppe
            print(f"🪖 PPE: {'ON' if self.show_ppe else 'OFF'}")
        
        elif key == ord('d'):  # Toggle debug
            self.show_debug = not self.show_debug
            print(f"🔧 Debug: {'ON' if self.show_debug else 'OFF'}")
        
        elif key == ord('r'):  # Reset tracking
            self.detector.reset()
            self.event_log.clear()
            print("🔄 Tracking reset")
        
        elif key == ord('s') and frame is not None:  # Screenshot
            filename = f"screenshot_{int(time.time())}.png"
            cv2.imwrite(filename, frame)
            print(f"📸 Saved: {filename}")
        
        # Zone preset keys (1-4)
        elif key == ord('1'):
            self._create_demo_zones(preset=1)
            print("📍 Zone Preset 1: Center frame")
        elif key == ord('2'):
            self._create_demo_zones(preset=2)
            print("📍 Zone Preset 2: Work table area")
        elif key == ord('3'):
            self._create_demo_zones(preset=3)
            print("📍 Zone Preset 3: Bottom right (Restricted)")
        elif key == ord('4'):
            self._create_demo_zones(preset=4)
            print("📍 Zone Preset 4: Walkway across frame")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="OptiVision AI Analysis Window - Standalone testing interface",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python analysis_window.py --source warehouse_footage.mp4
  python analysis_window.py --source 0  # webcam
  python analysis_window.py --source video.mp4 --zones zones.json
        """
    )
    
    parser.add_argument(
        '--source', '-s',
        default='warehouse_footage.mp4',
        help='Video file path or webcam index (default: warehouse_footage.mp4)'
    )
    
    parser.add_argument(
        '--zones', '-z',
        default=None,
        help='JSON file with zone definitions'
    )
    
    parser.add_argument(
        '--device',
        default=None,
        help='Device for inference (cpu, cuda:0, etc.)'
    )
    
    args = parser.parse_args()
    
    # Parse source (convert to int if webcam index)
    source = args.source
    try:
        source = int(source)
    except ValueError:
        pass  # Keep as string (file path)
    
    # Override device if specified
    if args.device:
        os.environ['AI_DEVICE'] = args.device
    
    # Run analysis window
    window = AnalysisWindow(source=source, zones_file=args.zones)
    window.run()


if __name__ == "__main__":
    main()
