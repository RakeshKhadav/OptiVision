import cv2
import numpy as np

class HomographyMapper:
    def __init__(self):
        self.matrix: np.ndarray | None = None

    def update_calibration(self, calibration_data: list | dict | None):
        """
        Updates the homography matrix from calibration data.
        :param calibration_data: Can be a raw 3x3 matrix (list of lists) 
                                 OR source/dst points {'src': [[x,y]...], 'dst': [[x,y]...]}
        """
        try:
            if not calibration_data:
                self.matrix = None
                return

            # Case 1: Pre-computed Matrix (3x3)
            # Check if it's a list and looks like 3x3 or flat 9
            if isinstance(calibration_data, list):
                matrix = np.array(calibration_data)
                if matrix.shape == (3, 3):
                    self.matrix = matrix
                elif matrix.size == 9:
                    self.matrix = matrix.reshape(3, 3)
            
            # Case 2: Source/Dst Points (Compute H on the fly)
            elif isinstance(calibration_data, dict) and 'src' in calibration_data and 'dst' in calibration_data:
                src_pts = np.float32(calibration_data['src'])
                dst_pts = np.float32(calibration_data['dst'])
                
                if len(src_pts) >= 4 and len(dst_pts) >= 4:
                    self.matrix, _ = cv2.findHomography(src_pts, dst_pts)
            
            if self.matrix is not None:
                print("✅ Homography Matrix Updated")
            else:
                 print("⚠️ Invalid calibration data format")

        except Exception as e:
            print(f"❌ Failed to update homography: {e}")
            self.matrix = None

    def transform_point(self, x: float, y: float) -> list[float] | None:
        """
        Transforms a single point (x, y) using the homography matrix.
        Returns: (x_mapped, y_mapped) or None if no matrix.
        """
        if self.matrix is None:
            return None
        
        # Homogeneous coordinates [x, y, 1]
        point = np.array([[[x, y]]], dtype=np.float32)
        transformed_point = cv2.perspectiveTransform(point, self.matrix)
        
        return transformed_point[0][0].tolist()
