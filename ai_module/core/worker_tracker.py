"""
OptiVision AI - Worker Tracker
==============================

Handles worker detection persistence and re-identification.
Workers are tracked across frames with tolerance for temporary disappearance.
"""

import time
import math
import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional
from config import get_settings


@dataclass
class WorkerState:
    """State information for a single tracked worker."""
    track_id: int
    last_position: Tuple[float, float]  # (center_x, bottom_y)
    last_seen_time: float
    first_seen_time: float
    position_history: List[Tuple[float, float, float]] = field(default_factory=list)  # (time, x, y)
    is_idle: bool = False
    idle_start_time: Optional[float] = None
    is_active: bool = True  # False if disappeared but within tolerance
    ppe_status: Dict[str, bool] = field(default_factory=dict)  # {helmet: True, vest: False}
    current_zone: Optional[str] = None  # Zone name if in a zone
    

class WorkerTracker:
    """
    Tracks workers across video frames with re-identification support.
    
    Features:
    - Maintains worker state across frames
    - Handles temporary disappearance (occlusion, frame boundary)
    - Provides idle/active status based on movement
    - Supports worker re-identification by position matching
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.workers: Dict[int, WorkerState] = {}
        self._pending_reappearance: Dict[int, WorkerState] = {}  # Workers that disappeared recently
    
    def update(self, detections: List[Dict]) -> List[WorkerState]:
        """
        Update worker states with new detections.
        
        Args:
            detections: List of detection dicts with keys:
                - track_id: int
                - box: [x1, y1, x2, y2]
                - confidence: float
                
        Returns:
            List of updated WorkerState objects
        """
        current_time = time.time()
        seen_ids = set()
        
        for det in detections:
            track_id = det.get('track_id')
            if track_id is None:
                continue
                
            seen_ids.add(track_id)
            box = det.get('box', [0, 0, 0, 0])
            
            # Calculate feet position (bottom center of box)
            center_x = (box[0] + box[2]) / 2
            bottom_y = box[3]
            
            if track_id in self.workers:
                # Update existing worker
                self._update_existing_worker(track_id, center_x, bottom_y, current_time)
            elif track_id in self._pending_reappearance:
                # Worker reappeared from pending
                self._restore_worker(track_id, center_x, bottom_y, current_time)
            else:
                # New worker detected - check if it matches a disappeared worker
                matched_id = self._try_match_disappeared_worker(center_x, bottom_y, current_time)
                if matched_id is not None:
                    # Match found - restore with new track_id mapping
                    self._remap_worker(matched_id, track_id, center_x, bottom_y, current_time)
                else:
                    # Completely new worker
                    self._create_new_worker(track_id, center_x, bottom_y, current_time)
        
        # Handle workers that disappeared this frame
        self._process_disappeared_workers(seen_ids, current_time)
        
        # Return active workers
        return [w for w in self.workers.values() if w.is_active]
    
    def _update_existing_worker(self, track_id: int, x: float, y: float, current_time: float):
        """Update an existing tracked worker with new position."""
        worker = self.workers[track_id]
        worker.is_active = True
        
        # Calculate movement
        last_x, last_y = worker.last_position
        distance = math.sqrt((x - last_x)**2 + (y - last_y)**2)
        
        # Update position
        worker.last_position = (x, y)
        worker.last_seen_time = current_time
        
        # Add to history (keep last 3 seconds)
        worker.position_history.append((current_time, x, y))
        worker.position_history = [
            p for p in worker.position_history 
            if current_time - p[0] <= 3.0
        ]
        
        # Update idle status
        self._update_idle_status(worker, distance, current_time)
    
    def _update_idle_status(self, worker: WorkerState, distance: float, current_time: float):
        """Update worker's idle/active status based on movement."""
        settings = self.settings
        
        if distance > settings.idle_movement_threshold_pixels:
            # Worker moved significantly - reset idle
            worker.is_idle = False
            worker.idle_start_time = None
        else:
            # Worker stationary
            if worker.idle_start_time is None:
                worker.idle_start_time = current_time
            else:
                idle_duration = current_time - worker.idle_start_time
                if idle_duration >= settings.idle_time_threshold_seconds:
                    worker.is_idle = True
    
    def _create_new_worker(self, track_id: int, x: float, y: float, current_time: float):
        """Create a new worker state."""
        self.workers[track_id] = WorkerState(
            track_id=track_id,
            last_position=(x, y),
            last_seen_time=current_time,
            first_seen_time=current_time,
            position_history=[(current_time, x, y)],
            is_idle=False,
            is_active=True
        )
        print(f"👷 New worker detected: ID {track_id}")
    
    def _restore_worker(self, track_id: int, x: float, y: float, current_time: float):
        """Restore a worker from pending reappearance."""
        worker = self._pending_reappearance.pop(track_id)
        worker.last_position = (x, y)
        worker.last_seen_time = current_time
        worker.is_active = True
        worker.position_history.append((current_time, x, y))
        self.workers[track_id] = worker
        print(f"👷 Worker {track_id} reappeared")
    
    def _try_match_disappeared_worker(self, x: float, y: float, current_time: float) -> Optional[int]:
        """
        Try to match a new detection to a recently disappeared worker.
        Returns the matched track_id or None.
        """
        best_match = None
        best_distance = float('inf')
        threshold = self.settings.position_match_threshold_pixels
        
        for track_id, worker in self._pending_reappearance.items():
            last_x, last_y = worker.last_position
            distance = math.sqrt((x - last_x)**2 + (y - last_y)**2)
            
            if distance < threshold and distance < best_distance:
                best_match = track_id
                best_distance = distance
        
        return best_match
    
    def _remap_worker(self, old_id: int, new_id: int, x: float, y: float, current_time: float):
        """Remap a disappeared worker to a new track ID."""
        worker = self._pending_reappearance.pop(old_id)
        worker.track_id = new_id
        worker.last_position = (x, y)
        worker.last_seen_time = current_time
        worker.is_active = True
        worker.position_history.append((current_time, x, y))
        self.workers[new_id] = worker
        print(f"👷 Worker remapped: {old_id} -> {new_id}")
    
    def _process_disappeared_workers(self, seen_ids: set, current_time: float):
        """Handle workers that were not detected in this frame."""
        tolerance = self.settings.disappearance_tolerance_seconds
        
        # Move absent workers to pending
        for track_id in list(self.workers.keys()):
            if track_id not in seen_ids:
                worker = self.workers[track_id]
                time_absent = current_time - worker.last_seen_time
                
                if time_absent > tolerance:
                    # Worker gone too long - remove completely
                    del self.workers[track_id]
                    if track_id in self._pending_reappearance:
                        del self._pending_reappearance[track_id]
                    print(f"👷 Worker {track_id} removed (absent > {tolerance}s)")
                else:
                    # Worker temporarily absent - move to pending
                    worker.is_active = False
                    self._pending_reappearance[track_id] = worker
                    del self.workers[track_id]
        
        # Clean up old pending workers
        for track_id in list(self._pending_reappearance.keys()):
            worker = self._pending_reappearance[track_id]
            if current_time - worker.last_seen_time > tolerance:
                del self._pending_reappearance[track_id]
    
    def get_worker(self, track_id: int) -> Optional[WorkerState]:
        """Get a worker by ID."""
        return self.workers.get(track_id) or self._pending_reappearance.get(track_id)
    
    def update_ppe_status(self, track_id: int, ppe_status: Dict[str, bool]):
        """Update PPE compliance status for a worker."""
        worker = self.get_worker(track_id)
        if worker:
            worker.ppe_status = ppe_status
    
    def update_zone(self, track_id: int, zone_name: Optional[str]):
        """Update current zone for a worker."""
        worker = self.get_worker(track_id)
        if worker:
            worker.current_zone = zone_name
    
    def get_all_workers(self) -> List[WorkerState]:
        """Get all active workers."""
        return [w for w in self.workers.values() if w.is_active]
    
    def get_worker_count(self) -> Tuple[int, int]:
        """Get count of (active, idle) workers."""
        active = sum(1 for w in self.workers.values() if w.is_active and not w.is_idle)
        idle = sum(1 for w in self.workers.values() if w.is_active and w.is_idle)
        return active, idle
    
    def clear(self):
        """Clear all tracked workers."""
        self.workers.clear()
        self._pending_reappearance.clear()
