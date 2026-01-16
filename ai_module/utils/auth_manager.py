import requests
import time
import os

class AuthManager:
    def __init__(self, backend_url: str):
        self.backend_url = backend_url
        self.email = os.getenv('AI_EMAIL')
        self.password = os.getenv('AI_PASSWORD')
        self.token = None
        self.token_expiry = 0

    def login(self) -> bool:
        """Attempts to log in to the backend and retrieve a Bearer token."""
        try:
            url = f"{self.backend_url}/api/v1/users/login"
            payload = {"email": self.email, "password": self.password}
            
            print(f"🔐 Attempting login to {self.backend_url}...")
            response = requests.post(url, json=payload, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                # Extract token safely
                self.token = data.get('data', {}).get('accessToken') or \
                             data.get('accessToken') or \
                             data.get('token')
                
                if self.token:
                    print("✅ Authentication Successful.")
                    # Assume 1 hour expiry if not provided, refresh 5 mins early
                    self.token_expiry = time.time() + 3600 - 300 
                    return True
                else:
                    print(f"❌ Login failed: Token missing in response.")
            else:
                # Sanitized Log
                print(f"❌ Login failed: Status {response.status_code}")
                
        except Exception as e:
            print(f"❌ Login Connection Error: {str(e)}")
        
        return False

    def get_token(self) -> str | None:
        """Returns valid token, refreshing if necessary."""
        if not self.token or time.time() > self.token_expiry:
            print("🔄 Token expired or missing. Refreshing...")
            if not self.login():
                return None
        return self.token

    def get_headers(self) -> dict | None:
        """Returns auth headers or None if auth fails."""
        token = self.get_token()
        return {"Authorization": f"Bearer {token}"} if token else None

    # Wrapper for requests to handle 401 updates automatically
    def post(self, endpoint: str, json_data: dict) -> requests.Response | None:
        """
        Authenticated POST request with auto-retry on 401.
        :param endpoint: e.g. '/api/v1/alerts'
        """
        url = f"{self.backend_url}{endpoint}"
        headers = self.get_headers()
        if not headers: return None

        try:
            res = requests.post(url, json=json_data, headers=headers, timeout=5)
            
            # If 401 Unauthorized, try one refresh
            if res.status_code == 401:
                print("⚠️ Received 401. Forcing re-login...")
                self.token = None # Force refresh
                headers = self.get_headers() # Get new token
                if headers:
                    res = requests.post(url, json=json_data, headers=headers, timeout=5)
            
            return res
        except Exception as e:
            print(f"⚠️ Request failed to {endpoint}: {e}")
            return None
    
    def get(self, endpoint: str) -> requests.Response | None:
        """Authenticated GET request with auto-retry on 401."""
        url = f"{self.backend_url}{endpoint}"
        headers = self.get_headers()
        if not headers: return None

        try:
            res = requests.get(url, headers=headers, timeout=5)
            if res.status_code == 401:
                print("⚠️ Received 401. Forcing re-login...")
                self.token = None
                headers = self.get_headers()
                if headers:
                    res = requests.get(url, headers=headers, timeout=5)
            return res
        except Exception as e:
            print(f"⚠️ Request failed to {endpoint}: {e}")
            return None
