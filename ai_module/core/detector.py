"""
OptiVision AI - Central Detector
=================================

Unified detection engine that coordinates YOLO inference with worker tracking,
PPE detection, and zone monitoring.
"""

import time
import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from config import get_settings

# Import core modules
from .worker_tracker import WorkerTracker, WorkerState
from .ppe_detector import PPEDetector, PPEResult
from .zone_monitor import ZoneMonitor, Zone, ZoneEvent


@dataclass
class DetectionResult:
    """Complete detection result for a single frame."""
    timestamp: float
    frame_number: int
    workers: List[WorkerState]
    ppe_results: Dict[int, PPEResult]
    zone_events: List[ZoneEvent]
    raw_detections: List[dict]
    processing_time_ms: float = 0.0
    
    def get_worker_metadata(self) -> List[dict]:
        """Get metadata for all workers (for streaming/API)."""
        metadata = []
        for worker in self.workers:
            ppe = self.ppe_results.get(worker.track_id, PPEResult(worker_id=worker.track_id))
            metadata.append({
                'id': worker.track_id,
                'workerId': str(worker.track_id),
                'x': worker.last_position[0],
                'y': worker.last_position[1],
                'isIdle': worker.is_idle,
                'zone': worker.current_zone,
                'ppeCompliant': ppe.is_compliant,
                'ppeViolations': ppe.violations,
                'hasHelmet': ppe.has_helmet,
                'hasVest': ppe.has_vest,
                'hasGloves': ppe.has_gloves,
            })
        return metadata


class Detector:
    """
    Central detection engine for OptiVision.
    
    Coordinates:
    - YOLO object detection (persons only, no forklifts)
    - Worker tracking with re-identification
    - PPE compliance detection
    - Zone intrusion monitoring
    """
    
    def __init__(self, on_zone_event: Optional[callable] = None):
        """
        Initialize the detector.
        
        Args:
            on_zone_event: Optional callback for zone events
        """
        self.settings = get_settings()
        
        # Core components
        self.worker_tracker = WorkerTracker()
        self.ppe_detector = PPEDetector()
        self.zone_monitor = ZoneMonitor(on_event=on_zone_event)
        
        # YOLO model
        self.model = None
        self._model_loaded = False
        self._frame_counter = 0
        
        # Zone events buffer for current frame
        self._current_zone_events: List[ZoneEvent] = []
        
        # Performance tracking
        self._last_inference_time = 0
        
    def load_models(self, device: str = None):
        """
        Load all required models.
        
        Args:
            device: 'cpu', 'cuda:0', or None for auto-detect
        """
        if device is None:
            device = self.settings.ai_device
            
        print("=" * 50)
        print("🤖 OptiVision AI - Loading Models")
        print("=" * 50)
        
        # Load YOLO for person detection
        self._load_yolo_model(device)
        
        # Load PPE model
        if self.settings.ppe_enabled:
            self.ppe_detector.load_model(device)
        
        print("=" * 50)
        print("✅ All models loaded")
        print("=" * 50)
    
    def _load_yolo_model(self, device: str):
        """Load the main YOLO detection model."""
        try:
            from ultralytics import YOLO
            
            print("⏳ Loading YOLO Detection Model...")
            
            # Try yolo11n first, fallback to yolov8n
            try:
                self.model = YOLO('yolo11n.pt')
                print("✅ YOLO11n Model Loaded")
            except Exception:
                print("⚠️ yolo11n.pt not found, trying yolov8n.pt...")
                self.model = YOLO('yolov8n.pt')
                print("✅ YOLOv8n Model Loaded")
            
            self._model_loaded = True
            
        except Exception as e:
            print(f"❌ Failed to load YOLO model: {e}")
            raise
    
    def detect(
        self,
        frame: np.ndarray,
        video_width: float = None,
        video_height: float = None
    ) -> DetectionResult:
        """
        Run full detection pipeline on a frame.
        
        Args:
            frame: BGR image (numpy array)
            video_width: Video width for minimap normalization
            video_height: Video height for minimap normalization
            
        Returns:
            DetectionResult with all detection information
        """
        start_time = time.time()
        self._frame_counter += 1
        self._current_zone_events = []
        
        if not self._model_loaded:
            raise RuntimeError("Models not loaded. Call load_models() first.")
        
        # Get frame dimensions
        h, w = frame.shape[:2]
        video_width = video_width or w
        video_height = video_height or h
        
        # Run YOLO detection - PERSONS ONLY (class 0)
        # Using imgsz for better detection of small/distant workers
        results = self.model.track(
            frame,
            persist=True,
            verbose=False,
            classes=self.settings.worker_classes,  # [0] = person only
            device=self.settings.ai_device,
            conf=self.settings.detection_confidence_threshold,
            imgsz=self.settings.detection_imgsz,  # Larger size = better small object detection
            iou=self.settings.nms_threshold,
            half=self.settings.use_half_precision  # FP16 optimization
        )
        
        # Parse detections
        raw_detections = self._parse_yolo_results(results, video_width, video_height)
        
        # Update worker tracker
        workers = self.worker_tracker.update(raw_detections)
        
        # Run PPE detection
        worker_boxes = [(d['track_id'], d['box']) for d in raw_detections if d.get('track_id')]
        ppe_results = self.ppe_detector.detect(frame, worker_boxes, self.settings.ai_device)
        
        # Update worker PPE status
        for track_id, ppe_result in ppe_results.items():
            self.worker_tracker.update_ppe_status(track_id, {
                'helmet': ppe_result.has_helmet,
                'vest': ppe_result.has_vest,
                'gloves': ppe_result.has_gloves
            })
        
        # Check zone intrusions
        for worker in workers:
            zones = self.zone_monitor.check_worker(
                worker.track_id,
                worker.last_position
            )
            if zones:
                # Set primary zone (highest priority)
                worker.current_zone = zones[0].name
                self.worker_tracker.update_zone(worker.track_id, zones[0].name)
            else:
                self.worker_tracker.update_zone(worker.track_id, None)
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000
        self._last_inference_time = processing_time
        
        return DetectionResult(
            timestamp=time.time(),
            frame_number=self._frame_counter,
            workers=workers,
            ppe_results=ppe_results,
            zone_events=self._current_zone_events.copy(),
            raw_detections=raw_detections,
            processing_time_ms=processing_time
        )
    
    def _parse_yolo_results(
        self,
        results,
        video_width: float,
        video_height: float
    ) -> List[dict]:
        """Parse YOLO tracking results into detection dicts."""
        detections = []
        
        if not hasattr(results[0].boxes, 'id') or results[0].boxes.id is None:
            return detections
        
        boxes = results[0].boxes.xyxy.cpu().numpy()
        track_ids = results[0].boxes.id.int().cpu().tolist()
        classes = results[0].boxes.cls.int().cpu().tolist()
        confs = results[0].boxes.conf.cpu().tolist()
        
        for box, track_id, cls, conf in zip(boxes, track_ids, classes, confs):
            x1, y1, x2, y2 = box
            center_x = (x1 + x2) / 2
            bottom_y = y2  # Feet position
            
            # Normalize for minimap (0-100 range)
            minimap_x = round((center_x / video_width) * 100, 2)
            minimap_y = round((bottom_y / video_height) * 100, 2)
            
            label = self.model.names[cls]
            
            detections.append({
                'track_id': track_id,
                'box': [float(x1), float(y1), float(x2), float(y2)],
                'label': label,
                'confidence': float(conf),
                'center_x': float(center_x),
                'bottom_y': float(bottom_y),
                'minimap_x': minimap_x,
                'minimap_y': minimap_y,
                'width': float(x2 - x1),
                'height': float(y2 - y1)
            })
        
        return detections
    
    def update_zones(self, zones_data: List[dict]):
        """Update zone definitions from frontend/backend."""
        self.zone_monitor.update_zones(zones_data)
    
    def add_zone(self, zone_data: dict):
        """Add a single zone."""
        self.zone_monitor.add_zone(zone_data)
    
    def remove_zone(self, zone_id: str):
        """Remove a zone by ID."""
        self.zone_monitor.remove_zone(zone_id)
    
    def get_zones(self) -> List[Zone]:
        """Get all defined zones."""
        return self.zone_monitor.get_all_zones()
    
    def get_stats(self) -> dict:
        """Get current detection statistics."""
        active, idle = self.worker_tracker.get_worker_count()
        ppe_summary = self.ppe_detector.get_compliance_summary(
            {w.track_id: self.ppe_detector._cached_results.get(w.track_id, PPEResult(worker_id=w.track_id))
             for w in self.worker_tracker.get_all_workers()}
        )
        
        return {
            'total_workers': active + idle,
            'active_workers': active,
            'idle_workers': idle,
            'zones_defined': len(self.zone_monitor.zones),
            'ppe_compliance': ppe_summary,
            'last_inference_ms': self._last_inference_time,
            'frame_count': self._frame_counter
        }
    
    def reset(self):
        """Reset all tracking state."""
        self.worker_tracker.clear()
        self.zone_monitor.worker_zones.clear()
        self._frame_counter = 0
        self._current_zone_events.clear()
    
    def is_loaded(self) -> bool:
        """Check if models are loaded."""
        return self._model_loaded
