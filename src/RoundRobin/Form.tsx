import React, { useState, useEffect } from "react";
import { Process } from "../App";
import { ProcessNode, ProcessQueue } from "./RoundRobin";

type Props = {
  processes: Array<Process>;
  setProcesses: Function;
  processesQueue: ProcessQueue;
  addProcessToQueue: (process: Process) => void;
};

const Form: React.FC<Props> = ({
  processes,
  setProcesses,
  addProcessToQueue,
  processesQueue,
}) => {
  const [currentName, setCurrentName] = useState("");
  const [currentArriveTime, setCurrentArriveTime] = useState("0");
  const [currentBurstTIme, setCurrentBurstTime] = useState("0");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [randomIndex, setRandomIndex] = useState(0);

  useEffect(() => {
    setRandomIndex(randomIndex + 1);
  }, [processesQueue]);

  const addProcess = (queue: Array<Process>): Array<Process> => {
    queue.sort((a, b) => {
      if (a.arriveTime === b.arriveTime) {
        return a.burstTime - b.burstTime;
      }

      return a.arriveTime - b.arriveTime;
    });

    return fillProcessesData(queue);
  };

  //Organize and fill data table
  const fillProcessesData = (
    queue: Array<Process>,
    time: number = 0
  ): Array<Process> => {
    if (!queue.length) return [];

    //Search process that could be executed in that moment
    const processesReady = queue.filter(
      (process) => process.arriveTime <= time
    );

    //If is a time window with no process ready find in next time moment
    if (!processesReady?.length) return fillProcessesData(queue, time + 1);

    //Current process: ready and with the shortest burst time (if are equal search what arrive first)
    const selected = processesReady.reduce((sel, process) => {
      if (!sel) return process;

      if (process.arriveTime < sel.arriveTime) return process;
      if (process.arriveTime > sel.arriveTime) return sel;
      if (process.arriveTime === sel.arriveTime) {
        return process.index < sel.index ? process : sel;
      }
    }, null);

    const finishTime = time + selected.burstTime;
    const returnTime = finishTime - selected.arriveTime;
    const waitTime = returnTime - selected.burstTime;

    const finalProcess: Process = {
      ...selected,
      startTime: time,
      finishTime,
      returnTime,
      waitTime,
    };

    const newQueue = queue.filter(
      (process) => process.index !== selected.index
    );

    return [finalProcess, ...fillProcessesData(newQueue, finishTime)];
  };

  const handleNewProcess = () => {
    addProcessToQueue({
      index: currentIndex,
      name: currentName,
      arriveTime: +currentArriveTime,
      burstTime: +currentBurstTIme,
      remainingTime: +currentBurstTIme,
    });

    setProcesses(
      addProcess([
        ...processes,
        {
          index: currentIndex,
          name: currentName,
          arriveTime: +currentArriveTime,
          burstTime: +currentBurstTIme,
          remainingTime: +currentBurstTIme,
        },
      ])
    );

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
        <React.Fragment key={randomIndex}>
          {processes
            ?.sort((a, b) => a.index - b.index)
            .map((process: Process) => {
              const realValue =
                processesQueue?.find((p) => p.index === process.index)
                  ?.realValues || null;

              return (
                <tr>
                  <td>{process.name}</td>
                  <td>{process.arriveTime}</td>
                  <td>{process.burstTime}</td>
                  <td>{realValue?.startTime || process.startTime}</td>
                  <td>{realValue?.finishTime || process.finishTime}</td>
                  <td>{realValue?.returnTime || process.returnTime}</td>
                  <td>{realValue?.waitTime || process.waitTime}</td>
                </tr>
              );
            })}

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
                onChange={({ target: { value } }) =>
                  setCurrentArriveTime(value)
                }
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
        </React.Fragment>
      </table>
      <button className="the-button" onClick={() => handleNewProcess()}>
        + Agregar proceso
      </button>
    </>
  );
};

export default Form;
