import React, { useEffect, useState } from "react";
import RoundRobin from "../RoundRobin/RoundRobin";
import { Process, useFifo, useRoundRobinHook, useSjf } from "./hooks";
import "./MultiQueue.css";

const ABC = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

export default function MultiQueue() {
  const [processInput, setProcessInput] = useState({
    arriveTime: 0,
    burstTime: 0,
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [clock, setClock] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCriticalSectionAvailable, setIsCriticalSectionAvailable] = useState(
    true
  );
  const [cuantum, setCuantum] = useState(4);
  const [oldMax, setOldMax] = useState(10);

  const {
    processes: roundRobinProcesses,
    infoQueue: roundRobinInfoQueue,
    processesQueue: roundRobinProcessesQueue,
    blockedQueue: roundRobinBlockedProcesses,
    addProcess: roundRobinAddProcess,
    blockCurrentProcess: roundRobinBlockCurrentProcess,
    unblockProcess: roundRobinUnblockProcess,
  } = useRoundRobinHook();
  const {
    processes: sjfProcesses,
    infoQueue: sjfInfoQueue,
    processesQueue: sjfProcessesQueue,
    blockedQueue: sjfBlockedProcesses,
    addProcess: sjfAddProcess,
    blockCurrentProcess: sjfBlockCurrentProcess,
    unblockProcess: sjfUnblockProcess,
  } = useSjf();
  const {
    processes: fifoProcesses,
    infoQueue: fifoInfoQueue,
    processesQueue: fifoProcessesQueue,
    blockedQueue: fifoBlockedProcesses,
    addProcess: fifoAddProcess,
    blockCurrentProcess: fifoBlockCurrentProcess,
    unblockProcess: fifoUnblockProcess,
  } = useFifo();

  {
    /*TIC BEGINS */
  }
  useEffect(() => {
    let tic: any;

    if (isRunning) {
      /* TAILS */
      let roundTail = roundRobinProcessesQueue?.peek() || null;
      let sjfTail = sjfProcessesQueue?.peek() || null;
      let fifoTail = fifoProcessesQueue?.peek() || null;

      let roundBlockedTail = roundRobinBlockedProcesses?.peek() || null;
      let sjfBlockedTail = sjfBlockedProcesses?.peek() || null;
      let fifoBlockedTail = fifoBlockedProcesses?.peek() || null;

      let available = isCriticalSectionAvailable;
      let check = false;

      /* ROUND ROBIN BEGIN */
      if (
        (!roundTail || roundTail.process?.arriveTime > clock) &&
        roundBlockedTail?.process
      ) {
        roundTail = roundBlockedTail;
        roundBlockedTail = roundBlockedTail.next;
        roundRobinUnblockProcess();
      }

      if (roundTail?.process?.arriveTime <= clock) {
        const sjfProcess = sjfInfoQueue?.find(
          (p) => p.index === sjfTail?.process?.index
        );
        const fifoProcess = fifoInfoQueue?.find(
          (p) => p.index === fifoTail?.process?.index
        );

        if (sjfProcess?.isOnCriticalSection) {
          sjfBlockCurrentProcess();
          sjfProcess.isOnCriticalSection = false;
          sjfProcess.history[clock] = "blocked";
        }

        if (fifoProcess?.isOnCriticalSection) {
          fifoBlockCurrentProcess();
          fifoProcess.isOnCriticalSection = false;
          fifoProcess.history[clock] = "blocked";
        }

        const sjfWaitingTime = Object.values(sjfProcess?.history || {}).filter(
          (s) => s === "waiting"
        ).length;
        const fifoWaitingTime = Object.values(
          fifoProcess?.history || {}
        ).filter((s) => s === "waiting").length;

        if (sjfWaitingTime >= oldMax) {
          const newProcess: Process = {
            ...sjfTail.process,
            arriveTime: clock + 1,
          };

          roundRobinAddProcess(newProcess);
          sjfProcessesQueue.remove();
        }
        if (fifoWaitingTime >= oldMax) {
          const newProcess: Process = {
            ...fifoTail.process,
            arriveTime: clock + 1,
          };

          sjfAddProcess(newProcess);
          fifoProcessesQueue.remove();
        }

        const infoProcess = roundRobinInfoQueue.find(
          (p) => p.index === roundTail.process.index
        );

        // Si ya se estaba ejecutando el proceso...
        if (
          infoProcess?.history?.[clock - 1] === "running" &&
          infoProcess?.remainingTime > 0
        ) {
          if (infoProcess.remainingTime === infoProcess.burstTime)
            infoProcess.realValues = { startTime: clock };

          roundTail.process.isOnCriticalSection = true;
          infoProcess.remainingTime -= 1;
          infoProcess.roundTime = isNaN(infoProcess.roundTime)
            ? cuantum - 1
            : infoProcess.roundTime - 1;

          infoProcess.history = { ...infoProcess.history, [clock]: "running" };
          available = false;
          if (infoProcess.remainingTime === 0) {
            roundRobinProcessesQueue.remove();

            const finishTime = clock + 1;
            const returnTime = finishTime - infoProcess.arriveTime;
            const waitTime = returnTime - infoProcess.burstTime;

            infoProcess.realValues = {
              ...infoProcess.realValues,
              finishTime,
              returnTime,
              waitTime,
            };

            available = true;
          } else if (infoProcess.roundTime <= 0) {
            infoProcess.roundTime = cuantum;
            roundRobinBlockCurrentProcess();
            available = true;
          }
          //Si no se estaba ejecutando
        } else if (infoProcess?.remainingTime > 0) {
          if (infoProcess.remainingTime === infoProcess.burstTime)
            infoProcess.realValues = { startTime: clock };

          infoProcess.isOnCriticalSection = true;
          infoProcess.remainingTime -= 1;
          infoProcess.roundTime = cuantum - 1;

          infoProcess.history = { ...infoProcess.history, [clock]: "running" };

          available = false;

          if (infoProcess.remainingTime === 0) {
            roundRobinProcessesQueue.remove();

            const finishTime = clock + 1;
            const returnTime = finishTime - infoProcess.arriveTime;
            const waitTime = returnTime - infoProcess.burstTime;

            infoProcess.realValues = {
              ...infoProcess.realValues,
              finishTime,
              returnTime,
              waitTime,
            };

            available = true;
          } else if (infoProcess.roundTime <= 0) {
            infoProcess.roundTime = cuantum;
            roundRobinBlockCurrentProcess();
            available = true;
          }
        }

        while (roundTail.next) {
          roundTail = roundTail.next;
          const process = roundRobinInfoQueue.find(
            (process) => process.index === roundTail.process.index
          );

          process.history = {
            ...process.history,
            [clock]: clock >= process.arriveTime ? "waiting" : "normal",
          };
        }
        while (sjfTail) {
          const process = sjfInfoQueue.find(
            (process) => process.index === sjfTail.process.index
          );

          process.history = {
            ...process.history,
            [clock]: process.history?.[clock]
              ? process.history[clock]
              : clock >= process.arriveTime
              ? "waiting"
              : "normal",
          };

          sjfTail = sjfTail.next;
        }
        while (fifoTail) {
          const process = fifoInfoQueue.find(
            (process) => process.index === fifoTail.process.index
          );

          process.history = {
            ...process.history,
            [clock]: process.history?.[clock]
              ? process.history[clock]
              : clock >= process.arriveTime
              ? "waiting"
              : "normal",
          };

          fifoTail = fifoTail.next;
        }

        while (roundBlockedTail) {
          const processFounded = roundRobinInfoQueue.find(
            (process) => process.index === roundBlockedTail.process.index
          );

          processFounded.history = {
            ...processFounded.history,
            [clock]: "blocked",
          };

          roundBlockedTail = roundBlockedTail.next;
        }
        while (sjfBlockedTail) {
          const processFounded = sjfInfoQueue.find(
            (process) => process.index === sjfBlockedTail.process.index
          );

          processFounded.history = {
            ...processFounded.history,
            [clock]: "blocked",
          };

          sjfBlockedTail = sjfBlockedTail.next;
        }
        while (fifoBlockedTail) {
          const processFounded = fifoInfoQueue.find(
            (process) => process.index === fifoBlockedTail.process.index
          );

          processFounded.history = {
            ...processFounded.history,
            [clock]: "blocked",
          };

          fifoBlockedTail = fifoBlockedTail.next;
        }

        check = true;
      }
      /* ROUND ROBIN ENDS */

      /* SJF BEGIN */
      if (!check) {
        if (
          (!sjfTail || sjfTail.process?.arriveTime > clock) &&
          sjfBlockedTail?.process
        ) {
          sjfTail = sjfBlockedTail;
          sjfBlockedTail = sjfBlockedTail.next;
          sjfUnblockProcess();
        }

        if (sjfTail?.process?.arriveTime <= clock) {
          const fifoProcess = fifoInfoQueue?.find(
            (p) => p.index === fifoTail?.process?.index
          );
          if (fifoProcess?.isOnCriticalSection) {
            fifoBlockCurrentProcess();
            fifoProcess.isOnCriticalSection = false;
            fifoProcess.history[clock] = "blocked";
          }

          const fifoWaitingTime = Object.values(
            fifoProcess?.history || {}
          ).filter((s) => s === "waiting").length;
          if (fifoWaitingTime >= oldMax) {
            const newProcess: Process = {
              ...fifoTail.process,
              arriveTime: clock + 1,
            };

            sjfAddProcess(newProcess);
            fifoProcessesQueue.remove();
          }

          const infoProcess = sjfInfoQueue.find(
            (p) => p.index === sjfTail.process.index
          );

          // Si ya se estaba ejecutando el proceso...
          if (
            infoProcess?.history?.[clock - 1] === "running" &&
            infoProcess?.remainingTime > 0
          ) {
            if (infoProcess.remainingTime === infoProcess.burstTime)
              infoProcess.realValues = { startTime: clock };

            sjfTail.process.isOnCriticalSection = true;
            infoProcess.remainingTime -= 1;

            infoProcess.history = {
              ...infoProcess.history,
              [clock]: "running",
            };
            available = false;

            if (infoProcess.remainingTime === 0) {
              sjfProcessesQueue.remove();

              const finishTime = clock + 1;
              const returnTime = finishTime - infoProcess.arriveTime;
              const waitTime = returnTime - infoProcess.burstTime;

              infoProcess.realValues = {
                ...infoProcess.realValues,
                finishTime,
                returnTime,
                waitTime,
              };

              available = true;
            }
            //Si no se estaba ejecutando
          } else if (infoProcess?.remainingTime > 0) {
            if (infoProcess.remainingTime === infoProcess.burstTime)
              infoProcess.realValues = { startTime: clock };

            infoProcess.isOnCriticalSection = true;
            infoProcess.remainingTime -= 1;

            infoProcess.history = {
              ...infoProcess.history,
              [clock]: "running",
            };

            available = false;

            if (infoProcess.remainingTime === 0) {
              sjfProcessesQueue.remove();

              const finishTime = clock + 1;
              const returnTime = finishTime - infoProcess.arriveTime;
              const waitTime = returnTime - infoProcess.burstTime;

              infoProcess.realValues = {
                ...infoProcess.realValues,
                finishTime,
                returnTime,
                waitTime,
              };

              available = true;
            } else {
              available = false;
            }
          }

          while (sjfTail.next) {
            sjfTail = sjfTail.next;
            const process = sjfInfoQueue.find(
              (process) => process.index === sjfTail.process.index
            );

            process.history = {
              ...process.history,
              [clock]: clock >= process.arriveTime ? "waiting" : "normal",
            };
          }
          while (roundTail) {
            const process = roundRobinInfoQueue.find(
              (process) => process.index === roundTail.process.index
            );

            process.history = {
              ...process.history,
              [clock]: clock >= process.arriveTime ? "waiting" : "normal",
            };

            roundTail = roundTail.next;
          }
          while (fifoTail) {
            const process = fifoInfoQueue.find(
              (process) => process.index === fifoTail.process.index
            );

            process.history = {
              ...process.history,
              [clock]: process.history?.[clock]
                ? process.history[clock]
                : clock >= process.arriveTime
                ? "waiting"
                : "normal",
            };

            fifoTail = fifoTail.next;
          }

          while (sjfBlockedTail) {
            const processFounded = sjfInfoQueue.find(
              (process) => process.index === sjfBlockedTail.process.index
            );

            processFounded.history = {
              ...processFounded.history,
              [clock]: "blocked",
            };

            sjfBlockedTail = sjfBlockedTail.next;
          }
          while (roundBlockedTail) {
            const processFounded = roundRobinInfoQueue.find(
              (process) => process.index === roundBlockedTail.process.index
            );

            processFounded.history = {
              ...processFounded.history,
              [clock]: "blocked",
            };

            roundBlockedTail = roundBlockedTail.next;
          }
          while (fifoBlockedTail) {
            const processFounded = fifoInfoQueue.find(
              (process) => process.index === fifoBlockedTail.process.index
            );

            processFounded.history = {
              ...processFounded.history,
              [clock]: "blocked",
            };

            fifoBlockedTail = fifoBlockedTail.next;
          }

          check = true;
        }
      }
      /* SJF ENDS */

      /* FIFO BEGIN */
      if (!check) {
        if (
          (!fifoTail || fifoTail.process?.arriveTime > clock) &&
          fifoBlockedTail?.process
        ) {
          fifoTail = fifoBlockedTail;
          fifoBlockedTail = fifoBlockedTail.next;
          fifoUnblockProcess();
        }

        if (fifoTail?.process?.arriveTime <= clock) {
          const infoProcess = fifoInfoQueue.find(
            (p) => p.index === fifoTail.process.index
          );

          // Si ya se estaba ejecutando el proceso...
          if (
            infoProcess?.history?.[clock - 1] === "running" &&
            infoProcess?.remainingTime > 0
          ) {
            if (infoProcess.remainingTime === infoProcess.burstTime)
              infoProcess.realValues = { startTime: clock };

            fifoTail.process.isOnCriticalSection = true;
            infoProcess.remainingTime -= 1;

            infoProcess.history = {
              ...infoProcess.history,
              [clock]: "running",
            };

            available = false;

            if (infoProcess.remainingTime <= 0) {
              fifoProcessesQueue.remove();

              const finishTime = clock + 1;
              const returnTime = finishTime - infoProcess.arriveTime;
              const waitTime = returnTime - infoProcess.burstTime;

              infoProcess.realValues = {
                ...infoProcess.realValues,
                finishTime,
                returnTime,
                waitTime,
              };

              available = true;
            }
            //Si no se estaba ejecutando
          } else if (infoProcess?.remainingTime > 0) {
            if (infoProcess.remainingTime === infoProcess.burstTime)
              infoProcess.realValues = { startTime: clock };

            infoProcess.isOnCriticalSection = true;
            infoProcess.remainingTime -= 1;

            infoProcess.history = {
              ...infoProcess.history,
              [clock]: "running",
            };

            available = false;

            if (infoProcess.remainingTime <= 0) {
              fifoProcessesQueue.remove();

              const finishTime = clock + 1;
              const returnTime = finishTime - infoProcess.arriveTime;
              const waitTime = returnTime - infoProcess.burstTime;

              infoProcess.realValues = {
                ...infoProcess.realValues,
                finishTime,
                returnTime,
                waitTime,
              };

              available = true;
            } else {
              available = false;
            }
          }

          while (fifoTail.next) {
            fifoTail = fifoTail.next;
            const process = fifoInfoQueue.find(
              (process) => process.index === fifoTail.process.index
            );

            process.history = {
              ...process.history,
              [clock]: clock >= process.arriveTime ? "waiting" : "normal",
            };
          }
          while (sjfTail) {
            const process = sjfInfoQueue.find(
              (process) => process.index === sjfTail.process.index
            );

            process.history = {
              ...process.history,
              [clock]: clock >= process.arriveTime ? "waiting" : "normal",
            };

            sjfTail = sjfTail.next;
          }
          while (roundTail) {
            const process = roundRobinInfoQueue.find(
              (process) => process.index === roundTail.process.index
            );

            process.history = {
              ...process.history,
              [clock]: clock >= process.arriveTime ? "waiting" : "normal",
            };

            roundTail = roundTail.next;
          }

          while (fifoBlockedTail) {
            const processFounded = fifoInfoQueue.find(
              (process) => process.index === fifoBlockedTail.process.index
            );

            processFounded.history = {
              ...processFounded.history,
              [clock]: "blocked",
            };

            fifoBlockedTail = fifoBlockedTail.next;
          }
          while (roundBlockedTail) {
            const processFounded = roundRobinInfoQueue.find(
              (process) => process.index === roundBlockedTail.process.index
            );

            processFounded.history = {
              ...processFounded.history,
              [clock]: "blocked",
            };

            roundBlockedTail = roundBlockedTail.next;
          }
          while (sjfBlockedTail) {
            const processFounded = sjfInfoQueue.find(
              (process) => process.index === sjfBlockedTail.process.index
            );

            processFounded.history = {
              ...processFounded.history,
              [clock]: "blocked",
            };

            sjfBlockedTail = sjfBlockedTail.next;
          }
        }
      }
      /* FIFO ENDS */

      console.log("#av", available);

      /* CONFIG */
      setIsCriticalSectionAvailable(available);
      tic = setTimeout(() => {
        setClock(clock + 1);
      }, 1000);
    }

    return () => {
      clearTimeout(tic);
    };
  }, [clock, isRunning]);
  {
    /**TIC ENDS */
  }

  const handleBlockProcess = () => {
    let roundTail = roundRobinProcessesQueue?.peek() || null;
    let sjfTail = sjfProcessesQueue?.peek() || null;
    let fifoTail = fifoProcessesQueue?.peek() || null;

    if (roundTail?.process?.isOnCriticalSection)
      roundRobinBlockCurrentProcess();
    if (sjfTail?.process?.isOnCriticalSection) sjfBlockCurrentProcess();
    if (fifoTail?.process?.isOnCriticalSection) fifoBlockCurrentProcess();
  };
  const handleAddProcess = (queue: "round" | "sjf" | "fifo") => {
    const process: Process = {
      index: currentIndex,
      name: ABC[currentIndex],
      arriveTime: +processInput.arriveTime,
      burstTime: +processInput.burstTime,
      remainingTime: +processInput.burstTime,
    };

    if (queue === "round") roundRobinAddProcess(process);
    if (queue === "sjf") sjfAddProcess(process);
    if (queue === "fifo") fifoAddProcess(process);

    setCurrentIndex(currentIndex + 1);
  };

  return (
    <div className="multi-queue">
      <div className="tables">
        <div className="clock">
          {clock}
          <button onClick={() => setIsRunning(!isRunning)}>
            {isRunning && "Pausar"}
            {!isRunning && "Iniciar"}
          </button>
          {isCriticalSectionAvailable ? "disponible" : "ocupada"}
          <button onClick={() => handleBlockProcess()}>Bloquear</button>
        </div>
        <form className="add-process-form">
          <label>
            Llegada
            <input
              type="number"
              value={processInput.arriveTime}
              onChange={({ target: { value } }) =>
                setProcessInput({ ...processInput, arriveTime: +value })
              }
            />
          </label>
          <label>
            Rafaga
            <input
              type="number"
              value={processInput.burstTime}
              onChange={({ target: { value } }) =>
                setProcessInput({ ...processInput, burstTime: +value })
              }
            />
          </label>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleAddProcess("round");
            }}
          >
            Agregar a round robin
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleAddProcess("sjf");
            }}
          >
            Agregar a SJF
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleAddProcess("fifo");
            }}
          >
            Agregar a FIFO
          </button>
        </form>

        {/*TABLES START */}
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
          <tr>
            <td colSpan={7} className="table-header">
              Round Robin
            </td>
          </tr>
          {roundRobinProcesses
            ?.sort((a, b) => a.index - b.index)
            .map((process: Process) => {
              const realValue =
                roundRobinInfoQueue?.find((p) => p.index === process.index)
                  ?.realValues || null;

              return (
                <tr>
                  <td className="data-table__row">{process.name}</td>
                  <td className="data-table__row">{process.arriveTime}</td>
                  <td className="data-table__row">{process.burstTime}</td>
                  <td className="data-table__row">
                    {realValue?.startTime || process.startTime || "0"}
                  </td>
                  <td className="data-table__row">
                    {realValue?.finishTime || process.finishTime || "0"}
                  </td>
                  <td className="data-table__row">
                    {realValue?.returnTime || process.returnTime || "0"}
                  </td>
                  <td className="data-table__row">
                    {realValue?.waitTime || process.waitTime || "0"}
                  </td>
                </tr>
              );
            })}
          <tr>
            <td colSpan={7} className="table-header">
              SJF
            </td>
          </tr>
          {sjfProcesses
            ?.sort((a, b) => a.index - b.index)
            .filter(
              (p) => !roundRobinProcesses.map((p) => p.index).includes(p.index)
            )
            .map((process: Process) => {
              const realValue =
                sjfInfoQueue?.find((p) => p.index === process.index)
                  ?.realValues || null;

              return (
                <tr>
                  <td className="data-table__row">{process.name}</td>
                  <td className="data-table__row">{process.arriveTime}</td>
                  <td className="data-table__row">{process.burstTime}</td>
                  <td className="data-table__row">
                    {realValue?.startTime || process.startTime || "0"}
                  </td>
                  <td className="data-table__row">
                    {realValue?.finishTime || process.finishTime || "0"}
                  </td>
                  <td className="data-table__row">
                    {realValue?.returnTime || process.returnTime || "0"}
                  </td>
                  <td className="data-table__row">
                    {realValue?.waitTime || process.waitTime || "0"}
                  </td>
                </tr>
              );
            })}
          <tr>
            <td colSpan={7} className="table-header">
              FIFO
            </td>
          </tr>
          {fifoProcesses
            ?.sort((a, b) => a.index - b.index)
            .filter(
              (p) =>
                !roundRobinProcesses.map((p) => p.index).includes(p.index) &&
                !sjfProcesses.map((p) => p.index).includes(p.index)
            )
            .map((process: Process) => {
              const realValue =
                fifoInfoQueue?.find((p) => p.index === process.index)
                  ?.realValues || null;

              return (
                <tr>
                  <td className="data-table__row">{process.name}</td>
                  <td className="data-table__row">{process.arriveTime}</td>
                  <td className="data-table__row">{process.burstTime}</td>
                  <td className="data-table__row">
                    {realValue?.startTime || process.startTime || "0"}
                  </td>
                  <td className="data-table__row">
                    {realValue?.finishTime || process.finishTime || "0"}
                  </td>
                  <td className="data-table__row">
                    {realValue?.returnTime || process.returnTime || "0"}
                  </td>
                  <td className="data-table__row">
                    {realValue?.waitTime || process.waitTime || "0"}
                  </td>
                </tr>
              );
            })}
        </table>
        {/*TABLES END */}

        {/*GRAPH START */}
        <div className="chart-wrapper">
          <table className="chart">
            <tr>
              <th>Round</th>
              {new Array(clock + 1).fill(null).map((_, index) => (
                <th>
                  <div className="chart-number-header">{index}</div>
                </th>
              ))}
            </tr>
            {roundRobinInfoQueue?.map((process) => {
              return (
                <tr key={process.index}>
                  <td>{process.name}</td>
                  {new Array(clock).fill(null).map((_, time) => (
                    <td
                      key={`${process.index}-${time}`}
                      className={process?.history?.[time] || "normal"}
                    />
                  ))}
                </tr>
              );
            })}
            <tr>
              <th>SJF</th>
              {new Array(clock + 1).fill(null).map((_, index) => (
                <th>
                  <div className="chart-number-header">{index}</div>
                </th>
              ))}
            </tr>
            {sjfInfoQueue?.map((process) => {
              return (
                <tr key={process.index}>
                  <td>{process.name}</td>
                  {new Array(clock).fill(null).map((_, time) => (
                    <td
                      key={`${process.index}-${time}`}
                      className={process?.history?.[time] || "normal"}
                    />
                  ))}
                </tr>
              );
            })}
            <tr>
              <th>FIFO</th>
              {new Array(clock + 1).fill(null).map((_, index) => (
                <th>
                  <div className="chart-number-header">{index}</div>
                </th>
              ))}
            </tr>
            {fifoInfoQueue?.map((process) => {
              return (
                <tr key={process.index}>
                  <td>{process.name}</td>
                  {new Array(clock + 1).fill(null).map((_, time) => (
                    <td
                      key={`${process.index}-${time}`}
                      className={process?.history?.[time] || "normal"}
                    />
                  ))}
                </tr>
              );
            })}
          </table>
        </div>
        {/*GRAPH END */}
      </div>
    </div>
  );
}
