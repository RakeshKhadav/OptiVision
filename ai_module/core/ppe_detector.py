"""
OptiVision AI - PPE Detector
============================

Personal Protective Equipment detection using YOLO-World zero-shot inference.
Detects helmet, vest, gloves and compliance violations.
"""

import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from config import get_settings


@dataclass  
class PPEResult:
    """PPE detection result for a single worker."""
    worker_id: int
    has_helmet: bool = False
    has_vest: bool = False
    has_gloves: bool = False
    violations: List[str] = None
    confidence_scores: Dict[str, float] = None
    is_compliant: bool = False
    
    def __post_init__(self):
        if self.violations is None:
            self.violations = []
        if self.confidence_scores is None:
            self.confidence_scores = {}


class PPEDetector:
    """
    PPE compliance detection using YOLO-World for zero-shot detection.
    
    Detects:
    - Helmet/Hardhat (positive detection or 'no helmet' violation)
    - Safety Vest (positive detection or 'no vest' violation)
    - Safety Gloves (optional)
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.model = None
        self._model_loaded = False
        self._frame_counter = 0
        self._cached_results: Dict[int, PPEResult] = {}
        
        # Class name mappings for detection
        self.helmet_positive = {'hard hat', 'helmet', 'hardhat', 'safety helmet'}
        self.helmet_negative = {'no helmet', 'no hard hat', 'no hardhat'}
        self.vest_positive = {'safety vest', 'high visibility vest', 'hi-vis vest', 'reflective vest'}
        self.vest_negative = {'no vest', 'no safety vest'}
        self.gloves_positive = {'safety gloves', 'work gloves', 'protective gloves'}
        
    def load_model(self, device: str = 'cpu'):
        """Load the YOLO-World model for PPE detection."""
        if self._model_loaded:
            return True
            
        try:
            from ultralytics import YOLOWorld
            
            print("⏳ Loading PPE Detection Model (YOLO-World)...")
            self.model = YOLOWorld('yolov8s-worldv2.pt')
            self.model.set_classes(self.settings.ppe_classes)
            self._model_loaded = True
            print("✅ PPE Model Loaded")
            return True
            
        except ImportError as e:
            print(f"⚠️ YOLOWorld import failed: {e}")
            print("   Install with: pip install ultralytics")
            return False
        except Exception as e:
            print(f"⚠️ PPE model load failed: {e}")
            return False
    
    def detect(
        self,
        frame: np.ndarray,
        worker_boxes: List[Tuple[int, List[float]]],  # [(track_id, [x1,y1,x2,y2]), ...]
        device: str = 'cpu'
    ) -> Dict[int, PPEResult]:
        """
        Detect PPE compliance for each worker in the frame.
        
        Args:
            frame: BGR image (numpy array)
            worker_boxes: List of (track_id, bounding_box) tuples
            device: 'cpu' or 'cuda:0' etc.
            
        Returns:
            Dict mapping track_id -> PPEResult
        """
        if not self.settings.ppe_enabled:
            return {}
            
        if not self._model_loaded:
            if not self.load_model(device):
                return {}
        
        # Frame skipping for performance
        self._frame_counter += 1
        if self._frame_counter % self.settings.ppe_frame_skip != 0:
            return self._cached_results
        
        results: Dict[int, PPEResult] = {}
        
        for track_id, box in worker_boxes:
            try:
                result = self._detect_single_worker(frame, track_id, box, device)
                results[track_id] = result
            except Exception as e:
                # Silently skip on error, return default
                results[track_id] = PPEResult(worker_id=track_id)
        
        self._cached_results = results
        return results
    
    def _detect_single_worker(
        self,
        frame: np.ndarray,
        track_id: int,
        box: List[float],
        device: str
    ) -> PPEResult:
        """Detect PPE for a single worker crop."""
        x1, y1, x2, y2 = [int(v) for v in box]
        
        # Ensure valid crop
        h, w = frame.shape[:2]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        
        if x2 <= x1 or y2 <= y1:
            return PPEResult(worker_id=track_id)
        
        # Crop worker region
        person_crop = frame[y1:y2, x1:x2]
        
        if person_crop.size == 0:
            return PPEResult(worker_id=track_id)
        
        # Run YOLO-World inference
        ppe_results = self.model.predict(
            person_crop,
            verbose=False,
            device=device,
            conf=self.settings.ppe_confidence_threshold,
            half=self.settings.use_half_precision
        )
        
        # Parse detections
        has_helmet = False
        has_vest = False
        has_gloves = False
        helmet_violation = False
        vest_violation = False
        confidence_scores = {}
        
        if ppe_results and len(ppe_results[0].boxes) > 0:
            for ppe_box in ppe_results[0].boxes:
                cls_id = int(ppe_box.cls[0])
                conf = float(ppe_box.conf[0])
                label = self.model.names[cls_id].lower()
                
                # Track confidence scores
                confidence_scores[label] = max(confidence_scores.get(label, 0), conf)
                
                # Classify detection
                if label in self.helmet_positive:
                    has_helmet = True
                elif label in self.helmet_negative:
                    helmet_violation = True
                elif label in self.vest_positive:
                    has_vest = True
                elif label in self.vest_negative:
                    vest_violation = True
                elif label in self.gloves_positive:
                    has_gloves = True
        
        # Build violations list
        violations = []
        if helmet_violation or (not has_helmet and 'helmet' in self.settings.required_ppe):
            violations.append('NO_HELMET')
        if vest_violation or (not has_vest and 'vest' in self.settings.required_ppe):
            violations.append('NO_VEST')
        if not has_gloves and 'gloves' in self.settings.required_ppe:
            violations.append('NO_GLOVES')
        
        # Check compliance
        is_compliant = len(violations) == 0
        
        return PPEResult(
            worker_id=track_id,
            has_helmet=has_helmet,
            has_vest=has_vest,
            has_gloves=has_gloves,
            violations=violations,
            confidence_scores=confidence_scores,
            is_compliant=is_compliant
        )
    
    def get_compliance_summary(self, results: Dict[int, PPEResult]) -> Dict[str, int]:
        """Get a summary of PPE compliance across all workers."""
        total = len(results)
        compliant = sum(1 for r in results.values() if r.is_compliant)
        no_helmet = sum(1 for r in results.values() if 'NO_HELMET' in r.violations)
        no_vest = sum(1 for r in results.values() if 'NO_VEST' in r.violations)
        no_gloves = sum(1 for r in results.values() if 'NO_GLOVES' in r.violations)
        
        return {
            'total_workers': total,
            'compliant': compliant,
            'non_compliant': total - compliant,
            'no_helmet': no_helmet,
            'no_vest': no_vest,
            'no_gloves': no_gloves,
            'compliance_rate': (compliant / total * 100) if total > 0 else 100.0
        }
    
    def is_loaded(self) -> bool:
        """Check if the model is loaded."""
        return self._model_loaded
