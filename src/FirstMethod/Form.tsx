import React, { useState, useEffect } from "react";
import { Process } from "../App";

type Props = {
  processes: Array<Process>;
  setProcesses: Function;
};

const Form: React.FC<Props> = ({ processes, setProcesses }) => {
  const [currentName, setCurrentName] = useState("");
  const [currentArriveTime, setCurrentArriveTime] = useState("0");
  const [currentBurstTIme, setCurrentBurstTime] = useState("0");
  const [currentIndex, setCurrentIndex] = useState(0);

  const getPrevFinishTime = (processIndex: number) => {
    const prev = processes.find(({ index }) => index === processIndex - 1);
    return prev?.finishTime || -1;
  };
  const getStartTime = (process: Process): Process => {
    return {
      ...process,
      startTime: Math.max(process.arriveTime, getPrevFinishTime(process.index)),
    };
  };
  const getFinishTime = (process: Process): Process => {
    return {
      ...process,
      finishTime: (process.startTime || 0) + process.burstTime,
    };
  };
  const getReturnTime = (process: Process): Process => {
    return {
      ...process,
      returnTime: (process.finishTime || 0) - process.arriveTime,
    };
  };
  const getWaitTime = (process: Process): Process => {
    return {
      ...process,
      waitTime: (process.returnTime || 0) - process.burstTime,
    };
  };
  const calculateProcessValues = (process: Process) => {
    return getWaitTime(getReturnTime(getFinishTime(getStartTime(process))));
  };

  const handleNewProcess = () => {
    setProcesses([
      ...processes,
      calculateProcessValues({
        index: currentIndex,
        name: currentName,
        arriveTime: +currentArriveTime,
        burstTime: +currentBurstTIme,
      } as Process),
    ]);

    setCurrentArriveTime("0");
    setCurrentBurstTime("0");
    setCurrentName("");
    setCurrentIndex(currentIndex + 1);
  };

  return (
    <>
      <table className="data-table">
        <tr>
          <th>
            <div className="data-table__row">Proceso</div>
          </th>
          <th>
            <div className="data-table__row">T. llegada</div>
          </th>
          <th>
            <div className="data-table__row">T. rafaga</div>
          </th>
          <th>
            <div className="data-table__row">T. comienzo</div>
          </th>
          <th>
            <div className="data-table__row">T. final</div>
          </th>
          <th>
            <div className="data-table__row">T. retorno</div>
          </th>
          <th>
            <div className="data-table__row">T. espera</div>
          </th>
        </tr>
        {processes?.map((process: Process) => (
          <tr>
            <td>{process.name}</td>
            <td>{process.arriveTime}</td>
            <td>{process.burstTime}</td>
            <td>{process.startTime || ""}</td>
            <td>{process.finishTime || ""}</td>
            <td>{process.returnTime || ""}</td>
            <td>{process.waitTime || ""}</td>
          </tr>
        ))}

        <tr>
          <td className="input-cell">
            <input
              type="text"
              className="table-input"
              value={currentName}
              onChange={({ target: { value } }) => setCurrentName(value)}
            />
          </td>
          <td className="input-cell">
            <input
              type="number"
              className="table-input"
              value={currentArriveTime}
              onChange={({ target: { value } }) => setCurrentArriveTime(value)}
            />
          </td>
          <td className="input-cell">
            <input
              type="number"
              className="table-input"
              value={currentBurstTIme}
              onChange={({ target: { value } }) => setCurrentBurstTime(value)}
            />
          </td>
        </tr>
      </table>
      <button className="the-button" onClick={() => handleNewProcess()}>
        + Agregar proceso
      </button>
    </>
  );
};

export default Form;
