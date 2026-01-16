import os
import requests
import time
from dotenv import load_dotenv

load_dotenv()

class APIManager:
    def __init__(self):
        self.backend_url = os.getenv('BACKEND_URL', 'http://localhost:3000')
        self.api_key = os.getenv('AI_API_KEY')
        self.headers = {
            'x-api-key': self.api_key,
            'Content-Type': 'application/json'
        }
        
    def fetch_zones(self):
        """Fetch zones from backend API."""
        try:
            url = f"{self.backend_url}/api/v1/zones"
            response = requests.get(url, headers=self.headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ [API] Fetched {len(data['data'])} zones")
                return data['data']
            else:
                print(f"⚠️ [API] Failed to fetch zones: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            print(f"❌ [API] Error fetching zones: {e}")
            return []

    def send_alert(self, type, severity, message, camera_id=1, snapshot=None):
        """Send alert to backend API."""
        try:
            url = f"{self.backend_url}/api/v1/alerts"
            payload = {
                "type": type,
                "severity": severity,
                "message": message,
                "cameraId": camera_id,
                "snapshot": snapshot # Optional base64 image
            }
            response = requests.post(url, json=payload, headers=self.headers, timeout=5)
            if response.status_code == 201:
                print(f"✅ [API] Alert sent: {type}")
                return True
            else:
                print(f"⚠️ [API] Failed to send alert: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ [API] Error sending alert: {e}")
            return False

    def send_activity(self, worker_id, action, duration, camera_id=1):
        """Send activity log to backend API."""
        try:
            url = f"{self.backend_url}/api/v1/activity"
            current_time = time.time()
            # Start time is roughly now - duration
            start_time = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(current_time - duration))
            end_time = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(current_time))
            
            payload = {
                "workerId": str(worker_id),
                "action": action,
                "startTime": start_time,
                "endTime": end_time,
                "duration": int(duration),
                "cameraId": camera_id
            }
            response = requests.post(url, json=payload, headers=self.headers, timeout=5)
            if response.status_code == 201:
                print(f"✅ [API] Activity log sent: {action}")
                return True
            else:
                print(f"⚠️ [API] Failed to send activity: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ [API] Error sending activity: {e}")
            return False
