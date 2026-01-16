import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Detection, Alert } from "@/types";

interface StreamPayload {
  image: string;
  boxes: Detection[];
}

export const useSocket = (activeCameraId: number | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [frame, setFrame] = useState<string>(""); // Base64 image
  const [detections, setDetections] = useState<Detection[]>([]);

  const addAlert = useDashboardStore((state) => state.addAlert);
  const isPrivacyMode = useDashboardStore((state) => state.isPrivacyMode);

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => setIsConnected(true));

    // 1. Hot Path: Real-time AI feed
    socket.on("stream_feed", (data: StreamPayload) => {
      setFrame(data.image);
      setDetections(data.boxes);
    });

    // 2. Cold Path: New Incident Alerts
    socket.on("alert", (data: Alert) => {
      addAlert(data);
    });

    socket.on("disconnect", () => setIsConnected(false));

    return () => {
      socket.off("connect");
      socket.off("stream_feed");
      socket.off("alert");
      socket.disconnect();
    };
  }, [addAlert, activeCameraId]);

  // 3. Control Signal: Sync Privacy Mode with AI Engine
  useEffect(() => {
    if (isConnected) {
      socket.emit("toggle_settings", { privacyMode: isPrivacyMode });
    }
  }, [isPrivacyMode, isConnected]);

  return { isConnected, frame, detections };
};
