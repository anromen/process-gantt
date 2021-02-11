import React from "react";

type Props = {
  clock: number;
  isAvailable: boolean;
  isRunning: boolean;
  setIsRunning: Function;
};

function Clock({ clock, isAvailable, isRunning, setIsRunning }: Props) {
  return (
    <div className="clock-wrapper">
      <span>Reloj</span>

      <div className="clock">
        {clock < 0 ? 0 : clock}
        <div
          className={`status-clock ${
            isAvailable !== null
              ? isAvailable
                ? "status-clock__available"
                : "status-clock__occupied"
              : "status-clock__available"
          }`}
        />
      </div>
      <button className="start" onClick={() => setIsRunning(!isRunning)}>
        {isRunning ? "Pausar" : "Iniciar"}
      </button>
    </div>
  );
}

export default Clock;
