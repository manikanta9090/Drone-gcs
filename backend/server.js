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

const HOME = [17.385, 78.4867];

// ================= DRONE STATE =================
let drone = {
    position: [...HOME],
    battery: 100,
    speed: 10,
    altitude: 100,
    status: "idle", // idle | running | paused | returning
    waypoints: [],
    currentIndex: 0
};

// ================= API ROUTES =================

// START
app.post("/mission/start", (req, res) => {
    const wp = req.body.waypoints;

    // ✅ fallback if no waypoints
    if (!wp || wp.length === 0) {
        drone.waypoints = [
            [17.4, 78.5]
        ];
        console.log("⚠ No waypoints received → using fallback");
    } else {
        drone.waypoints = wp;
    }

    drone.status = "running";
    drone.currentIndex = 0;

    console.log("START:", drone.waypoints);
    res.send("started");
});

// PAUSE / RESUME
app.post("/mission/pause", (req, res) => {
    if (drone.status === "paused") {
        drone.status = "running";
    } else if (drone.status === "running") {
        drone.status = "paused";
    }
    res.send("toggled pause");
});

// ABORT → RETURN HOME
app.post("/mission/abort", (req, res) => {
    drone.status = "returning";
    drone.waypoints = [HOME];
    drone.currentIndex = 0;

    console.log("RETURNING HOME");

    res.send("returning");
});

// ================= SIMULATION LOOP =================

setInterval(() => {

    // RUN ONLY WHEN ACTIVE
    if (drone.status === "running" || drone.status === "returning") {

        // ✅ BATTERY ALWAYS DRAINS
        if (drone.status === "running") {
            drone.battery -= 0.04;
        } else {
            drone.battery -= 0.02;
        }

        if (drone.battery <= 0) {
            drone.battery = 0;
            drone.status = "idle";
        }

        // MOVE ONLY IF WAYPOINT EXISTS
        if (drone.waypoints.length > 0) {

            let [lat, lng] = drone.position;
            let [tLat, tLng] = drone.waypoints[drone.currentIndex];

            // movement
            const speedFactor = drone.status === "returning" ? 0.08 : 0.1;

            let newLat = lat + (tLat - lat) * speedFactor;
            let newLng = lng + (tLng - lng) * speedFactor;

            drone.position = [newLat, newLng];

            // distance check
            let dist = Math.abs(newLat - tLat) + Math.abs(newLng - tLng);

            if (dist < 0.0005) {

                if (drone.status === "running") {
                    drone.currentIndex++;

                    if (drone.currentIndex >= drone.waypoints.length) {
                        drone.status = "idle";
                        drone.waypoints = [];
                    }
                }

                if (drone.status === "returning") {
                    drone.status = "idle";
                    drone.waypoints = [];
                    drone.currentIndex = 0;
                }
            }
        }

        // telemetry changes
        drone.speed = 10 + Math.random() * 3;
        drone.altitude = 100 + Math.random() * 10;
    }

    // EMIT TO FRONTEND
    io.emit("telemetry", drone);

    console.log(
        "STATUS:", drone.status,
        "POS:", drone.position,
        "BAT:", drone.battery.toFixed(2)
    );

}, 1000);

// ================= START SERVER =================

server.listen(5000, () => {
    console.log("🚀 Backend running on http://localhost:5000");
});