# OptiVision Systems
### Deterministic Video Analytics & Industrial Observability Platform

**OptiVision Systems** is a high-performance, industrial-grade video analytics platform designed for complex environments. It leverages advanced Computer Vision (YOLOv8) and real-time processing to extract structured event data from chaotic visual streams with sub-100ms latency.

![System Status](https://img.shields.io/badge/System-Nominal-success) ![Version](https://img.shields.io/badge/Version-2.4.0-blue) ![License](https://img.shields.io/badge/License-MIT-lightgrey)

## 🚀 About The Project

OptiVision is built to replace passive monitoring with active, deterministic intelligence. Unlike standard surveillance systems that merely record footage, OptiVision "watches" video feeds to detect incidents, monitor worker safety, and analyze productivity in real-time.

It features a **"High-Credibility, Interaction-Rich"** dashboard that prioritizes data density, immediate status visibility, and precision controls, adhering to a strict industrial aesthetic.

### Key Capabilities
*   **Real-time Video Ingestion**: Handles RTSP and raw MJPEG streams via a low-latency WebSocket pipeline.
*   **Spatial Logic Engine**: Define precise polygonal inclusion/exclusion zones to filter noise and focus on critical areas.
*   **YOLOv8 Integration**: utilized for high-speed object detection (PPE compliance, person detection, etc.).
*   **Incident Timeline**: A "True Time Engine" for scrubbing through events with density-based visualization.
*   **Immutable Audit Logs**: Cryptographically signed logs for every detection and system state change.
*   **Live Metrics**: Instant visibility into system uptime, false positive rates, and global event counts.

## 🛠 Tech Stack

### Frontend
*   **Framework**: Next.js 16.1 (React 19)
*   **Styling**: Tailwind CSS v4, Framer Motion (animations), Lucide React (icons)
*   **State Management**: Zustand
*   **Visualization**: Recharts, Custom Canvas Video overlays
*   **Real-time**: Socket.io-client

### Backend
*   **Runtime**: Node.js (Express)
*   **Language**: TypeScript
*   **Database**: PostgreSQL with Prisma ORM
*   **Real-time**: Socket.io Server
*   **Authentication**: JWT (JSON Web Tokens) with Bcrypt
*   **File Handling**: Multer, Cloudinary

### AI / Computer Vision
*   **Core**: Python
*   **Models**: YOLOv8 (Ultralytics)
*   **Libraries**: OpenCV, NumPy

## 📦 Getting Started

Follow these steps to set up the development environment.

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL
*   Python 3.8+ (for CV modules)

### 1. Database Setup
Ensure your PostgreSQL server is running and create a database for the project. Update your `.env` files with the connection string.

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Environment Configuration
# Create a .env file based on .env.example (or define DB_URL, JWT_SECRET, PORT, etc.)

# Database Migration & Seeding
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Start Development Server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Development Server
npm run dev
# The app should now be running at http://localhost:3000
```

### 4. AI/CV Engine
```bash
cd CV

# Install Python dependencies (create a virtual environment recommended)
pip install opencv-python ultralytics numpy

# Run the detection script
python object_detection.py
```

## 🖥 Usage

1.  **Log In**: Access the platform using the credentials set in the seed file (or register a new admin account).
2.  **Dashboard**: View live streams and system health metrics.
3.  **Zone Editor**: Navigate to the camera settings to draw detection zones (polygons) on the video feed.
4.  **Timeline**: Use the scrubber to review past incidents and verify alerts.

## 🤝 Contribution

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
