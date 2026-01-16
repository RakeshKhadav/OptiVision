import { useState, useEffect } from "react";
import { Detection } from "@/types";

interface TrailPoint {
  x: number;
  y: number;
}

export const useTrails = (detections: Detection[]) => {
  const [trails, setTrails] = useState<Record<string, TrailPoint[]>>({});

  useEffect(() => {
    if (!detections || detections.length === 0) return;

    setTrails((prevTrails) => {
      const newTrails = { ...prevTrails };

      detections.forEach((det) => {
        if (!det.workerId) return;

        // Calculate center-bottom of the box for the trail point
        const newPoint = {
          x: det.x + det.width / 2,
          y: det.y + det.height,
        };

        const currentTrail = newTrails[det.workerId] || [];
        // Keep only the last 20 points
        const updatedTrail = [...currentTrail, newPoint].slice(-20);

        newTrails[det.workerId] = updatedTrail;
      });

      // Cleanup: Optionally remove IDs that haven't been seen in a while
      // (This can be more complex, but for now we'll just keep them)

      return newTrails;
    });
  }, [detections]);

  return trails;
};
