import cv2
import numpy as np
from shapely.geometry import Point, Polygon

class ZoneMonitor:
    def __init__(self):
        # Zones structure: { zone_id: { 'poly': ShapelyPolygon, 'type': 'danger', 'name': '...' } }
        self.zones: dict[int, dict] = {}

    def update_zones(self, zones_data: list[dict]):
        """
        Updates the local zone definitions.
        Expected data from backend: 
        [{ 'id': 1, 'type': 'danger', 'coordinates': [[x,y],...] }, ...]
        """
        self.zones = {}
        for z in zones_data:
            try:
                # Backend sends coordinates as stringified JSON or direct array?
                # Assuming parsed list of lists: [[x,y], [x,y]]
                coords = z.get('coordinates')
                if isinstance(coords, str):
                    import json
                    coords = json.loads(coords)
                
                if len(coords) >= 3:
                     self.zones[z['id']] = {
                        'poly': Polygon(coords),
                        'type': z.get('type', 'danger'),
                        'name': z.get('name', 'Zone ' + str(z['id']))
                    }
            except Exception as e:
                print(f"❌ Failed to parse zone {z.get('id')}: {e}")

    def check_intrusion(self, box: list[float] | np.ndarray) -> list[dict]:
        """
        Checks if a worker's feet are inside any danger zone.
        :param box: [x1, y1, x2, y2]
        :return: List of zone violations [{ 'zone_id': 1, 'name': '...' }]
        """
        violations = []
        
        # Feet coordinates (bottom center of box)
        feet_x = (box[0] + box[2]) / 2
        feet_y = box[3]
        point = Point(feet_x, feet_y)
        
        for zid, zone in self.zones.items():
            if zone['poly'].contains(point):
                violations.append({
                    'zone_id': zid,
                    'name': zone['name'],
                    'type': zone['type']
                })
        
        return violations
