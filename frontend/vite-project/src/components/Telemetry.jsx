export default function Telemetry({ drone }) {
  const getColor = (b) =>
    b > 50 ? "bg-green-500" : b > 20 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="w-64 bg-slate-800 p-4">
      <h2 className="font-bold mb-4">Telemetry</h2>

      <div className="mb-4">
        <p>Battery</p>
        <div>{(drone.battery ?? 0).toFixed(1)}%</div>
        <div className="bg-slate-600 h-2 mt-1">
          <div
            className={`${getColor(drone.battery)} h-2`}
            style={{ width: `${drone.battery}%` }}
          />
        </div>
      </div>

      <p>Speed: {(drone.speed ?? 0).toFixed(2)}</p>
      <p>Altitude: {(drone.altitude ?? 0).toFixed(2)}</p>
    </div>
  );
}