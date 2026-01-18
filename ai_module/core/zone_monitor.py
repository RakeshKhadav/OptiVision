"""
OptiVision AI - Zone Monitor
============================

Monitors worker positions against defined zones.
Supports multiple zone types and tracks entry/exit events.
Zones are received from frontend with coordinates and names.
"""

import json
import time
import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Callable
from shapely.geometry import Point, Polygon
from config import get_settings


@dataclass
class Zone:
    """Represents a monitored zone."""
    id: str
    name: str
    zone_type: str  # DANGER, RESTRICTED, REQUIRED_PPE, SAFE
    polygon: Polygon
    coordinates: List[List[float]]  # Original coordinates for drawing
    color: Tuple[int, int, int] = (0, 0, 255)  # BGR default red
    
    @classmethod
    def from_dict(cls, data: dict) -> Optional['Zone']:
        """Create a Zone from backend/frontend data."""
        try:
            coords = data.get('coordinates')
            
            # Parse coordinates if string
            if isinstance(coords, str):
                try:
                    coords = json.loads(coords)
                except json.JSONDecodeError:
                    print(f"⚠️ Invalid JSON for zone {data.get('id')}: {coords}")
                    return None
            
            # Validate coordinates
            if not coords or len(coords) < 3:
                print(f"⚠️ Zone {data.get('id')} has insufficient coordinates")
                return None
            
            # Create shapely polygon
            polygon = Polygon(coords)
            if not polygon.is_valid:
                print(f"⚠️ Zone {data.get('id')} has invalid polygon")
                return None
            
            # Determine color based on type
            zone_type = data.get('type', 'DANGER').upper()
            color = {
                'DANGER': (0, 0, 255),      # Red
                'RESTRICTED': (0, 165, 255), # Orange
                'REQUIRED_PPE': (0, 255, 255), # Yellow
                'SAFE': (0, 255, 0)          # Green
            }.get(zone_type, (0, 0, 255))
            
            return cls(
                id=str(data.get('id')),
                name=data.get('name', f"Zone {data.get('id')}"),
                zone_type=zone_type,
                polygon=polygon,
                coordinates=coords,
                color=color
            )
        except Exception as e:
            print(f"⚠️ Failed to parse zone: {e}")
            return None


@dataclass
class ZoneEvent:
    """Represents a zone entry/exit event."""
    event_type: str  # ENTER, EXIT, VIOLATION
    zone_id: str
    zone_name: str
    zone_type: str
    worker_id: int
    timestamp: float
    position: Tuple[float, float]


class ZoneMonitor:
    """
    Monitors worker positions against defined zones.
    
    Features:
    - Supports multiple zone types (DANGER, RESTRICTED, REQUIRED_PPE, SAFE)
    - Tracks zone entry/exit per worker
    - Emits events for zone violations
    - Zones received from frontend via Socket.IO or API
    """
    
    def __init__(self, on_event: Optional[Callable[[ZoneEvent], None]] = None):
        """
        Initialize the zone monitor.
        
        Args:
            on_event: Optional callback for zone events
        """
        self.settings = get_settings()
        self.zones: Dict[str, Zone] = {}
        self.worker_zones: Dict[int, set] = {}  # worker_id -> set of zone_ids
        self.on_event = on_event
        self._last_zone_update = 0
    
    def update_zones(self, zones_data: List[dict]):
        """
        Update zone definitions from frontend/backend.
        
        Args:
            zones_data: List of zone dicts with keys: id, name, type, coordinates
        """
        self.zones.clear()
        print(f"🔄 Processing {len(zones_data)} zones...")
        
        for z_data in zones_data:
            zone = Zone.from_dict(z_data)
            if zone:
                self.zones[zone.id] = zone
                print(f"  ✅ Zone loaded: {zone.name} ({zone.zone_type})")
        
        print(f"✅ {len(self.zones)} zones active")
        self._last_zone_update = time.time()
    
    def add_zone(self, zone_data: dict):
        """Add a single zone (for incremental updates)."""
        zone = Zone.from_dict(zone_data)
        if zone:
            self.zones[zone.id] = zone
            print(f"✅ Zone added: {zone.name} ({zone.zone_type})")
    
    def remove_zone(self, zone_id: str):
        """Remove a zone by ID."""
        if zone_id in self.zones:
            zone_name = self.zones[zone_id].name
            del self.zones[zone_id]
            print(f"🗑️ Zone removed: {zone_name}")
    
    def check_worker(
        self,
        worker_id: int,
        position: Tuple[float, float]
    ) -> List[Zone]:
        """
        Check which zones a worker is in.
        
        Args:
            worker_id: Worker track ID
            position: (x, y) position (typically feet position)
            
        Returns:
            List of zones the worker is currently in
        """
        point = Point(position)
        current_zones = []
        
        for zone in self.zones.values():
            if zone.polygon.contains(point):
                current_zones.append(zone)
        
        # Track entry/exit events
        self._process_zone_changes(worker_id, position, current_zones)
        
        return current_zones
    
    def _process_zone_changes(
        self,
        worker_id: int,
        position: Tuple[float, float],
        current_zones: List[Zone]
    ):
        """Process zone entry/exit events for a worker."""
        current_zone_ids = {z.id for z in current_zones}
        previous_zone_ids = self.worker_zones.get(worker_id, set())
        
        # Detect entries
        entered = current_zone_ids - previous_zone_ids
        for zone_id in entered:
            zone = self.zones[zone_id]
            event = ZoneEvent(
                event_type='ENTER',
                zone_id=zone_id,
                zone_name=zone.name,
                zone_type=zone.zone_type,
                worker_id=worker_id,
                timestamp=time.time(),
                position=position
            )
            self._emit_event(event)
            
            # Immediate violation for DANGER zones
            if zone.zone_type == 'DANGER':
                violation_event = ZoneEvent(
                    event_type='VIOLATION',
                    zone_id=zone_id,
                    zone_name=zone.name,
                    zone_type=zone.zone_type,
                    worker_id=worker_id,
                    timestamp=time.time(),
                    position=position
                )
                self._emit_event(violation_event)
        
        # Detect exits
        exited = previous_zone_ids - current_zone_ids
        for zone_id in exited:
            if zone_id in self.zones:
                zone = self.zones[zone_id]
                event = ZoneEvent(
                    event_type='EXIT',
                    zone_id=zone_id,
                    zone_name=zone.name,
                    zone_type=zone.zone_type,
                    worker_id=worker_id,
                    timestamp=time.time(),
                    position=position
                )
                self._emit_event(event)
        
        # Update tracked zones
        self.worker_zones[worker_id] = current_zone_ids
    
    def _emit_event(self, event: ZoneEvent):
        """Emit a zone event to the callback."""
        event_emoji = {
            'ENTER': '🚧',
            'EXIT': '🚪',
            'VIOLATION': '🚨'
        }.get(event.event_type, '📍')
        
        print(f"{event_emoji} Zone {event.event_type}: Worker {event.worker_id} -> {event.zone_name} ({event.zone_type})")
        
        if self.on_event:
            self.on_event(event)
    
    def get_zone_at_point(self, x: float, y: float) -> Optional[Zone]:
        """Get the highest priority zone at a point."""
        point = Point(x, y)
        priority = {'DANGER': 0, 'RESTRICTED': 1, 'REQUIRED_PPE': 2, 'SAFE': 3}
        
        matching_zones = [z for z in self.zones.values() if z.polygon.contains(point)]
        
        if not matching_zones:
            return None
        
        # Return highest priority zone
        return min(matching_zones, key=lambda z: priority.get(z.zone_type, 99))
    
    def get_all_zones(self) -> List[Zone]:
        """Get all defined zones."""
        return list(self.zones.values())
    
    def get_zone_by_id(self, zone_id: str) -> Optional[Zone]:
        """Get a zone by ID."""
        return self.zones.get(zone_id)
    
    def clear_worker(self, worker_id: int):
        """Clear tracking data for a worker."""
        if worker_id in self.worker_zones:
            del self.worker_zones[worker_id]
    
    def clear_all(self):
        """Clear all zones and worker tracking."""
        self.zones.clear()
        self.worker_zones.clear()
    
    def get_zone_occupancy(self) -> Dict[str, List[int]]:
        """Get current occupancy of each zone."""
        occupancy = {zone_id: [] for zone_id in self.zones.keys()}
        
        for worker_id, zone_ids in self.worker_zones.items():
            for zone_id in zone_ids:
                if zone_id in occupancy:
                    occupancy[zone_id].append(worker_id)
        
        return occupancy
    
    def get_numpy_polygons(self) -> List[Tuple[np.ndarray, Tuple[int, int, int], str]]:
        """
        Get zones as numpy polygons for OpenCV drawing.
        
        Returns:
            List of (points, color, name) tuples
        """
        result = []
        for zone in self.zones.values():
            pts = np.array(zone.coordinates, np.int32).reshape((-1, 1, 2))
            result.append((pts, zone.color, zone.name))
        return result
