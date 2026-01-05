const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

console.log("🚀 Mock AI Engine Starting...");

socket.on("connect", () => {
  console.log("✅ Connected to Backend");

  let x = 100;
  let y = 100;
  let frameCount = 0;

  // Simulate 10 FPS stream
  setInterval(() => {
    frameCount++;
    
    // Move a mock worker in a circle
    x = 640 + Math.cos(frameCount * 0.1) * 200;
    y = 360 + Math.sin(frameCount * 0.1) * 150;

    const mockData = {
      image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", // 1x1 black pixel base64
      boxes: [
        {
          workerId: "mock_worker_1",
          label: "Person",
          confidence: 0.95,
          x: x,
          y: y,
          width: 50,
          height: 100
        },
        {
          workerId: "mock_forklift_1",
          label: "Forklift",
          confidence: 0.88,
          x: 200,
          y: 400,
          width: 150,
          height: 120
        }
      ]
    };

    socket.emit("stream_data", mockData);
  }, 100);

  // Simulate an alert every 10 seconds
  setInterval(() => {
    console.log("⚠️ Sending Mock Alert...");
    socket.emit("alert", {
      id: Math.floor(Math.random() * 1000),
      type: "ZONE_INTRUSION",
      severity: "HIGH",
      message: "Worker detected in restricted zone B",
      snapshot: "",
      isResolved: false,
      cameraId: 1,
      createdAt: new Date().toISOString()
    });
  }, 10000);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected");
});
