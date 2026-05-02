import { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icons
const droneIcon = L.divIcon({
  html: '🚁',
  className: 'drone-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const waypointIcon = (num) => L.divIcon({
  html: `<div class="waypoint-number">${num}</div>`,
  className: 'waypoint-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const socket = io("http://localhost:5000");

function MapClickHandler({ setWaypoints }) {
  useMapEvents({
    click(e) {
      setWaypoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    }
  });
  return null;
}

export default function App() {
  const [drone, setDrone] = useState({});
  const [waypoints, setWaypoints] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handler = (data) => {
      console.log("RECEIVED:", data);
      setDrone(data);
    };

    socket.on("telemetry", handler);

    return () => {
      socket.off("telemetry", handler);
    };
  }, []);

  const startMission = async () => {
    await axios.post("http://localhost:5000/mission/start", {
      waypoints
    });
    setMessage("Mission Started");
    setTimeout(() => setMessage(""), 3000);
  };

  const pauseMission = async () => {
    await axios.post("http://localhost:5000/mission/pause");
    setMessage("Mission Paused");
    setTimeout(() => setMessage(""), 3000);
  };

  const abortMission = async () => {
    await axios.post("http://localhost:5000/mission/abort");
    setWaypoints([]);
    setMessage("Mission Aborted");
    setTimeout(() => setMessage(""), 3000);
  };

  const clearWaypoints = () => {
    setWaypoints([]);
    setMessage("Waypoints Cleared");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="fixed top-0 right-0 bg-black text-white p-2 text-xs z-50 max-w-xs overflow-hidden">
        {JSON.stringify(drone)}
      </div>
      {/* LEFT SIDEBAR */}
      <div className="w-64 bg-gray-800 p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-center">Mission Controls</h2>
        <div className="space-y-4">
          <button
            onClick={startMission}
            disabled={drone.status === "running"}
            className={`w-full font-bold py-3 px-4 rounded-lg shadow-md transition duration-200 ${
              drone.status === "running"
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } text-white`}
          >
            Start Mission
          </button>
          <button
            onClick={pauseMission}
            disabled={drone.status === "idle"}
            className={`w-full font-bold py-3 px-4 rounded-lg shadow-md transition duration-200 ${
              drone.status === "idle"
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-yellow-600 hover:bg-yellow-700"
            } text-white`}
          >
            Pause Mission
          </button>
          <button
            onClick={abortMission}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-200"
          >
            Abort Mission
          </button>
          <button
            onClick={clearWaypoints}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-200"
          >
            Clear Waypoints
          </button>
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Status</h3>
          <p className="text-gray-300 capitalize">{drone.status ?? "Idle"}</p>
          {message && <p className="text-green-400 mt-2 text-sm">{message}</p>}
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1">
        <MapContainer center={[17.385, 78.4867]} zoom={5} className="h-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler setWaypoints={setWaypoints} />

          {waypoints.length > 0 && <Polyline positions={waypoints} color="#dc2626" weight={4} opacity={0.8} />}

          {waypoints.map((pos, index) => (
            <Marker key={`waypoint-${index}`} position={pos} icon={waypointIcon(index + 1)} />
          ))}

          {drone.position && <Marker position={drone.position} icon={droneIcon} />}
        </MapContainer>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-64 bg-gray-800 p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-center">Telemetry</h2>
        <div className="space-y-6">
          {/* Battery Card */}
          <div className="bg-gray-700 rounded-lg shadow-md p-4">
            <h4 className="font-semibold mb-2">Battery</h4>
            <div className="text-2xl font-bold mb-2">{(drone.battery ?? 0).toFixed(1)}%</div>
            <div className="w-full bg-gray-600 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${drone.battery ?? 0}%` }}
              ></div>
            </div>
          </div>

          {/* Speed Card */}
          <div className="bg-gray-700 rounded-lg shadow-md p-4">
            <h4 className="font-semibold mb-2">Speed</h4>
            <div className="text-2xl font-bold">{(drone.speed ?? 0).toFixed(1)} <span className="text-sm">m/s</span></div>
          </div>

          {/* Altitude Card */}
          <div className="bg-gray-700 rounded-lg shadow-md p-4">
            <h4 className="font-semibold mb-2">Altitude</h4>
            <div className="text-2xl font-bold">{(drone.altitude ?? 0).toFixed(1)} <span className="text-sm">m</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}