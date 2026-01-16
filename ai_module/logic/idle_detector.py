import time
import math
import numpy as np

class IdleDetector:
    def __init__(self, movement_threshold: int = 20, time_threshold: int = 30):
        """
        :param movement_threshold: Pixels moved to be considered 'active'
        :param time_threshold: Seconds of inactivity to trigger 'IDLE' status
        """
        self.movement_threshold = movement_threshold
        self.time_threshold = time_threshold
        
        # State: { track_id: { 'history': [(timestamp, x, y)], 'status': 'active', 'idle_start': None } }
        self.worker_states: dict[int, dict] = {}

    def update(self, track_id: int, box: list[float] | np.ndarray) -> str:
        """
        Updates the state for a worker.
        :param track_id: Unique ID from YOLO
        :param box: [x1, y1, x2, y2]
        :return: status ('active' or 'idle')
        """
        now = time.time()
        
        # Calculate Centroid
        cx = (box[0] + box[2]) / 2
        cy = (box[1] + box[3]) / 2
        
        if track_id not in self.worker_states:
            self.worker_states[track_id] = {
                'history': [],
                'status': 'active',
                'idle_start': None,
                'last_seen': now
            }
        
        state = self.worker_states[track_id]
        state['last_seen'] = now
        
        # Add current position to history
        # Prune old history (> 3 seconds ago)
        state['history'].append((now, cx, cy))
        state['history'] = [p for p in state['history'] if now - p[0] <= 3.0]
        
        # Calculate displacement over the last ~3 seconds (or max available)
        if len(state['history']) < 2:
            return state['status']
            
        start_pos = state['history'][0]
        end_pos = state['history'][-1]
        
        dx = end_pos[1] - start_pos[1]
        dy = end_pos[2] - start_pos[2]
        distance = math.sqrt(dx*dx + dy*dy)
        
        # Check if moving
        if distance < self.movement_threshold:
            # Not moving much
            if state['idle_start'] is None:
                state['idle_start'] = now
            
            # Check duration
            idle_duration = now - state['idle_start']
            if idle_duration >= self.time_threshold:
                state['status'] = 'idle'
        else:
            # Moving
            state['idle_start'] = None
            state['status'] = 'active'
            
        return state['status']

    def prune_stale_ids(self, active_ids: list[int]):
        """Remove IDs that are no longer tracked"""
        current_ids = list(self.worker_states.keys())
        for tid in current_ids:
            if tid not in active_ids:
                del self.worker_states[tid]
