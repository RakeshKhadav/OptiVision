"""
OptiVision AI - Centralized Configuration
==========================================

All configurable parameters for the AI detection system.
Values can be overridden via environment variables.
"""

import os
from dataclasses import dataclass, field
from typing import List
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    """Centralized configuration for OptiVision AI Module."""
    
    # =========================
    # Backend Connection
    # =========================
    backend_url: str = field(default_factory=lambda: os.getenv('BACKEND_URL', 'http://localhost:3000'))
    ai_api_key: str = field(default_factory=lambda: os.getenv('AI_API_KEY', ''))
    
    # =========================
    # Video Source
    # =========================
    video_source: str = field(default_factory=lambda: os.getenv('VIDEO_SOURCE', '0'))
    
    # =========================
    # Hardware Acceleration
    # =========================
    ai_device: str = field(default_factory=lambda: os.getenv('AI_DEVICE', 'cpu'))
    
    # =========================
    # Worker Detection (YOLO)
    # =========================
    # Class 0 = Person in COCO dataset
    worker_classes: List[int] = field(default_factory=lambda: [0])
    detection_confidence_threshold: float = 0.15  # Low threshold for partial/distant workers
    nms_threshold: float = 0.45
    # Input image size for YOLO (larger = better small object detection, slower)
    detection_imgsz: int = 640  # Can be 320, 480, 640, 960, 1280
    
    # =========================
    # Worker Re-Identification
    # =========================
    # Time (seconds) to keep tracking a worker after they disappear
    disappearance_tolerance_seconds: float = 5.0
    # Max pixel distance to match a reappearing worker to their last position
    position_match_threshold_pixels: float = 100.0
    
    # =========================
    # Idle Detection
    # =========================
    # Minimum movement (pixels) to be considered "active"
    idle_movement_threshold_pixels: float = 20.0
    # Seconds of inactivity before marking as IDLE
    idle_time_threshold_seconds: float = 30.0
    
    # =========================
    # PPE Detection (YOLO-World)
    # =========================
    ppe_enabled: bool = True
    ppe_confidence_threshold: float = 0.3
    # Zero-shot detection classes for YOLO-World
    # Multiple phrasings improve detection accuracy
    ppe_classes: List[str] = field(default_factory=lambda: [
        # Helmet/Hardhat detection
        'hard hat', 'helmet', 'hardhat', 'safety helmet',
        # Vest detection
        'safety vest', 'high visibility vest', 'hi-vis vest', 'reflective vest',
        # Gloves detection
        'safety gloves', 'work gloves', 'protective gloves',
        # Violation indicators (negative classes)
        'no helmet', 'no hard hat', 'no hardhat',
        'no vest', 'no safety vest',
    ])
    # PPE items to check for compliance
    required_ppe: List[str] = field(default_factory=lambda: ['helmet', 'vest'])
    
    # =========================
    # Zone Monitoring
    # =========================
    # Zone types that can be configured from frontend
    zone_types: List[str] = field(default_factory=lambda: ['DANGER', 'RESTRICTED', 'REQUIRED_PPE', 'SAFE'])
    
    # =========================
    # Alerts
    # =========================
    alert_cooldown_seconds: float = 10.0
    
    # =========================
    # Performance Optimization
    # =========================
    # Target FPS (actual may be lower depending on hardware)
    target_fps: int = 30
    
    # Detection frame skip: process every Nth frame for YOLO detection
    # Set to 1 for every frame, 2 for every other frame, etc.
    # Higher = faster but less responsive
    detection_frame_skip: int = 1
    
    # Process every Nth frame for PPE (reduces GPU load significantly)
    ppe_frame_skip: int = 3
    
    # Use half-precision (FP16) for faster inference on GPU
    # Set to True if you have a modern NVIDIA GPU
    use_half_precision: bool = True
    
    # JPEG quality for streaming (0-100, lower = faster encoding)
    stream_jpeg_quality: int = 50
    
    # Max workers to track simultaneously (limits memory/CPU usage)
    max_tracked_workers: int = 20
    
    # =========================
    # Analysis Window
    # =========================
    analysis_window_width: int = 1280
    analysis_window_height: int = 720
    show_debug_info: bool = False
    
    def get_video_source(self):
        """Parse video source - returns int for webcam, str for file path."""
        try:
            return int(self.video_source)
        except ValueError:
            return self.video_source


# Singleton instance
_settings_instance: Settings | None = None


def get_settings() -> Settings:
    """Get the global settings instance (singleton pattern)."""
    global _settings_instance
    if _settings_instance is None:
        _settings_instance = Settings()
    return _settings_instance


def reload_settings() -> Settings:
    """Force reload settings (useful for testing)."""
    global _settings_instance
    _settings_instance = Settings()
    return _settings_instance
