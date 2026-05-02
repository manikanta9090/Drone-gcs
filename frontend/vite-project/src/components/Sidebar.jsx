export default function Sidebar({ drone, startMission, pauseMission, abortMission }) {
  return (
    <div className="w-64 bg-slate-800 p-4 flex flex-col">
      <h2 className="font-bold mb-4">Mission Control</h2>

      <button onClick={startMission} className="bg-green-600 p-2 mb-2 rounded">
        Start
      </button>

      <button onClick={pauseMission} className="bg-yellow-500 p-2 mb-2 rounded text-black">
        {drone.status === "running" ? "Pause" : "Resume"}
      </button>

      <button onClick={abortMission} className="bg-red-600 p-2 rounded">
        Abort
      </button>

      <div className="mt-auto text-center mt-4">
        Status: {drone.status}
      </div>
    </div>
  );
}