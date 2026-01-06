const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

console.log("🚀 Mock AI Engine Starting...");

let frameCount = 0;
let intervalsStarted = false;

const startMockAI = () => {
  if (intervalsStarted) return;
  intervalsStarted = true;

  // 1. High-frequency stream (10 FPS)
  setInterval(() => {
    if (!socket.connected) return;
    frameCount++;

    const boxes = [
      {
        workerId: "worker_1",
        label: "Person",
        confidence: 0.98,
        x: 640 + Math.cos(frameCount * 0.1) * 200,
        y: 360 + Math.sin(frameCount * 0.1) * 150,
        width: 50,
        height: 100
      },
      {
        workerId: "worker_2",
        label: "Person",
        confidence: 0.96,
        x: 300 + Math.cos(frameCount * 0.05) * 100,
        y: 200 + Math.sin(frameCount * 0.05) * 80,
        width: 50,
        height: 100
      },
      {
        workerId: "forklift_1",
        label: "Forklift",
        confidence: 0.88,
        x: 800 + Math.cos(frameCount * 0.02) * 300,
        y: 500 + Math.sin(frameCount * 0.02) * 50,
        width: 120,
        height: 100
      }
    ];

    socket.emit("stream_data", {
      image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      boxes
    });

    if (frameCount % 100 === 0) {
      console.log(`📡 Streaming ${boxes.length} entities...`);
    }
  }, 100);

  // 2. Random Alert Generator
  const alertTypes = [
    { type: "ZONE_INTRUSION", msg: "Worker detected in Zone B (Restricted)", severity: "HIGH" },
    { type: "NO_PPE", msg: "Worker missing hard hat in Loading Area", severity: "MEDIUM" },
    { type: "FALL_DETECTED", msg: "Possible fall detected near conveyor", severity: "HIGH" },
    { type: "CLUTTER_DETECTED", msg: "Obstruction in emergency exit path", severity: "NORMAL" },
    { type: "MACHINERY_PROXIMITY", msg: "Worker too close to active forklift", severity: "HIGH" }
  ];

  setInterval(() => {
    if (!socket.connected) return;
    const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    console.log(`⚠️ Sending Mock Alert: ${alert.type}`);
    socket.emit("alert", {
      id: Math.floor(Math.random() * 10000),
      type: alert.type,
      severity: alert.severity,
      message: alert.msg,
      snapshot: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
      isResolved: false,
      cameraId: 1,
      createdAt: new Date().toISOString()
    });
  }, 15000); // Increased to 15s to be less spammy

  // 3. Periodic Activity Stats Generator
  let mockDurations = { "Packing": 120, "Sorting": 85, "Moving": 45, "Idle": 20 };
  setInterval(() => {
    if (!socket.connected) return;
    Object.keys(mockDurations).forEach(action => {
      mockDurations[action] += Math.floor(Math.random() * 5);
    });
    socket.emit("activity_stats", {
      activityStats: Object.entries(mockDurations).map(([action, duration]) => ({
        action,
        _sum: { duration }
      }))
    });
  }, 10000); // Increased to 10s
};

socket.on("connect", () => {
  console.log("✅ Connected to Backend");
  startMockAI();
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected");
});
