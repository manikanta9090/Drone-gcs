const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// 🚁 Drone State
const HOME = [17.385, 78.4867];

let drone = {
    position: [17.385, 78.4867], // start (Hyderabad)
    battery: 100,
    speed: 10,
    altitude: 100,
    status: "idle",
    waypoints: [],
    currentIndex: 0
};

// 🎯 APIs

app.post("/mission/start", (req, res) => {
    drone.status = "running";
    drone.waypoints = req.body.waypoints || [];
    drone.currentIndex = 0;
    res.json({ message: "Mission started" });
});

app.post("/mission/pause", (req, res) => {
    drone.status = "paused";
    res.json({ message: "Mission paused" });
});

app.post("/mission/abort", (req, res) => {
    drone.status = "returning";
    drone.waypoints = [HOME];
    drone.currentIndex = 0;
    res.json({ message: "Mission aborted, returning to home" });
});

app.get("/mission/status", (req, res) => {
    res.json(drone);
});

// 🔁 Simulation Engine
setInterval(() => {
  console.log("Simulation tick: status =", drone.status, "waypoints =", drone.waypoints.length);
  if (
    (drone.status === "running" || drone.status === "returning") &&
    drone.waypoints.length > 0
  ) {
    console.log("Moving: target =", drone.waypoints[drone.currentIndex]);
    let target = drone.waypoints[drone.currentIndex];

    let [lat, lng] = drone.position;
    let [tLat, tLng] = target;

    // MOVE DRONE
    drone.position = [
      lat + (tLat - lat) * 0.05,
      lng + (tLng - lng) * 0.05
    ];

    // TARGET REACHED CHECK
    if (Math.abs(lat - tLat) < 0.0005 && Math.abs(lng - tLng) < 0.0005) {

      if (drone.status === "running") {
        drone.currentIndex++;

        if (drone.currentIndex >= drone.waypoints.length) {
          drone.status = "idle";
        }
      }

      if (drone.status === "returning") {
        drone.status = "idle";
        drone.waypoints = [];
        drone.currentIndex = 0;
      }
    }

    // TELEMETRY UPDATE
    drone.battery -= 0.05;
  }

  // Always update speed and altitude
  drone.speed = 10 + Math.random() * 5;
  drone.altitude = 100 + Math.random() * 20;

  io.emit("telemetry", { ...drone });

  console.log("STATUS:", drone.status, "POS:", drone.position, "BAT:", drone.battery);
}, 1000);

// 🔌 Socket connection
io.on("connection", (socket) => {
    console.log("Client connected");
});

server.listen(5000, () => console.log("Server running on port 5000"));