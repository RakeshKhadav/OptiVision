import { useMemo } from "react";
import { Detection } from "@/types";

export interface PPEStats {
  helmet: number;
  vest: number;
}

export const usePPEStats = (detections: Detection[]): PPEStats => {
  return useMemo(() => {
    let helmet = 0;
    let vest = 0;

    detections.forEach((d) => {
      // Check ppeViolation string from AI module
      // Expected formats: 'NO_HELMET', 'NO_VEST'
      if (d.ppeViolation === "NO_HELMET") helmet++;
      if (d.ppeViolation === "NO_VEST") vest++;
    });

    return { helmet, vest };
  }, [detections]);
};
