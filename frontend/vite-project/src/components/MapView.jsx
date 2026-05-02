import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

function Follow({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position && position.length === 2) {
      map.flyTo([position[0], position[1]], map.getZoom(), {
        duration: 0.5
      });
    }
  }, [position]);

  return null;
}

const droneIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/4243/4243207.png",
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

function ClickHandler({ setWaypoints }) {
  useMapEvents({
    click(e) {
      setWaypoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
    }
  });
  return null;
}

function Follow({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, map.getZoom());
  }, [pos, map]);
  return null;
}

export default function MapView({ drone, waypoints, setWaypoints, trail }) {
  console.log("Drone position:", drone.position);
  return (
    <div className="flex-1 p-4">
      <MapContainer center={[17.385, 78.4867]} zoom={6} className="h-full rounded-lg">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <ClickHandler setWaypoints={setWaypoints} />

        <Polyline positions={waypoints} color="red" />
        <Polyline positions={trail} color="cyan" />

        {waypoints.map((w, i) => <Marker key={i} position={w} />)}

        {drone.position && (
  <Marker
    key={drone.position[0] + "-" + drone.position[1]}   // 🔥 force re-render
    position={[drone.position[0], drone.position[1]]}   // 🔥 new array
    icon={droneIcon}
  />
)}
      </MapContainer>
    </div>
  );
}