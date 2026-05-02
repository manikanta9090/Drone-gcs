import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import Telemetry from "./components/Telemetry";

const socket = io("http://localhost:5000");

export default function App() {
  const [drone, setDrone] = useState({});
  const [waypoints, setWaypoints] = useState([]);
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    socket.on("telemetry", (data) => {
      setDrone(data);
      if (data.position) {
        setTrail(prev => [...prev.slice(-50), data.position]);
      }
    });

    return () => socket.off("telemetry");
  }, []);

  const startMission = () =>
    axios.post("http://localhost:5000/mission/start", { waypoints });

  const pauseMission = () =>
    axios.post("http://localhost:5000/mission/pause");

  const abortMission = () => {
    axios.post("http://localhost:5000/mission/abort");
    setWaypoints([]);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">

      <Header />

      <div className="flex flex-1">

        <Sidebar
          drone={drone}
          startMission={startMission}
          pauseMission={pauseMission}
          abortMission={abortMission}
        />

        <MapView
          drone={drone}
          waypoints={waypoints}
          setWaypoints={setWaypoints}
          trail={trail}
        />

        <Telemetry drone={drone} />

      </div>
    </div>
  );
}