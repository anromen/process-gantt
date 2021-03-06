import React, { useEffect, useState } from "react";
import { Process } from "../App";
import Clock from "./Clock";
import Form from "./Form";
import "./RoundRobin.css";
import _ from "lodash";

type ProcessNodeType = {
  process: Process;
  next: ProcessQueue;
};

export class ProcessNode {
  process: Process;
  next: ProcessNode;

  constructor(data) {
    this.process = data;
    this.next = null;
  }
}

export class ProcessQueue {
  head: ProcessNode;
  length: number;

  constructor() {
    this.head = null;
    this.length = 0;
  }

  push(process: Process) {
    const node = new ProcessNode(process);

    if (!this.head) {
      this.head = node;
      this.length += 1;
      return this.head;
    }

    let tail = this.head;

    while (tail.next) {
      tail = tail.next;
    }

    tail.next = node;

    this.length += 1;
    return this.head;
  }

  map(method: (p: Process) => any): Array<any> {
    let tail = this.head;

    if (!tail) return [];

    method(tail.process);
    const results = [];

    while (tail) {
      results.push(method(tail.process));
      tail = tail.next;
    }

    return results;
  }

  find(method: (p: Process) => boolean): Process {
    let tail = this.head;

    if (!tail) return null;

    while (tail) {
      if (method(tail.process)) {
        return tail.process;
      }
      tail = tail.next;
    }
  }

  peek() {
    return this.head;
  }

  remove() {
    this.length -= 1;
    this.head = this.head.next;
  }
}

function RoundRobin() {
  //Status
  const [clock, setClock] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [cuantum, setCuantum] = useState(4);
  const [currentProcess, setCurrentProcess] = useState(null);

  //Queues
  const [processes, setProcesses] = useState<Array<Process>>([]);
  const [noChangeQueue, setNoChangeQueue] = useState<ProcessQueue>(null);
  const [processesQueue, setProcessesQueue] = useState<ProcessQueue>(null);
  const [blockedProcesses, setBlockedProcesses] = useState<ProcessQueue>(null);

  useEffect(() => {
    let tic: any;

    if (isRunning) {
      const updatedQueue = _.cloneDeep(noChangeQueue);

      let tail = processesQueue?.peek() || null;
      let blockedTail = blockedProcesses?.peek() || null;
      let available = isAvailable;

      let isStarting =
        tail &&
        ((available && clock >= tail?.process?.arriveTime) ||
          !!(
            !available &&
            currentProcess !== null &&
            tail?.process?.index !== currentProcess
          ));

      let isExecuting =
        tail && !available && clock >= tail?.process?.arriveTime;

      if (!isStarting && !isExecuting && blockedProcesses.length) {
        const blocked = _.cloneDeep(blockedProcesses);
        const tempHead = blocked.peek();

        blocked.remove();

        const processHead = processesQueue.head;
        const tempProcessHead = tempHead;
        tempHead.next = processHead;

        processesQueue.head = tempProcessHead;
        setBlockedProcesses(blocked);

        tail = processesQueue.peek();
        blockedTail = blocked.peek();
        isStarting = true;
        available = true;
      }

      if (tail) {
        let process = updatedQueue.find(
          (process) => process.index === tail.process.index
        );

        //Check if critical section is available
        if (isStarting) {
          if (tail.process.remainingTime === tail.process.burstTime)
            process.realValues = { startTime: clock };

          setCurrentProcess(tail.process.index);
          tail.process.isOnCriticalSection = true;
          tail.process.remainingTime -= 1;
          tail.process.roundTime = cuantum - 1;

          process.history = { ...process.history, [clock]: "running" };

          if (tail.process.remainingTime === 0) {
            processesQueue.remove();

            const finishTime = clock + 1;
            const returnTime = finishTime - process.arriveTime;
            const waitTime = returnTime - process.burstTime;

            process.realValues = {
              ...process.realValues,
              finishTime,
              returnTime,
              waitTime,
            };

            available = true;
            setCurrentProcess(null);
          } else if (tail.process.roundTime <= 0) {
            blockCurrentProcess();
          } else {
            available = false;
          }
        } else if (isExecuting) {
          if (tail.process.remainingTime === tail.process.burstTime)
            process.realValues = { startTime: clock };

          tail.process.remainingTime -= 1;
          tail.process.roundTime = isNaN(tail.process.roundTime)
            ? cuantum - 1
            : tail.process.roundTime - 1;
          process.history = { ...process.history, [clock]: "running" };

          if (tail.process.remainingTime === 0) {
            processesQueue.remove();

            const finishTime = clock + 1;
            const returnTime = finishTime - process.arriveTime;
            const waitTime = returnTime - process.burstTime;

            process.realValues = {
              ...process.realValues,
              finishTime,
              returnTime,
              waitTime,
            };

            available = true;
            setCurrentProcess(null);
          } else if (tail.process.roundTime <= 0) {
            blockCurrentProcess();
          }
        }

        while (tail.next) {
          tail = tail.next;
          process = updatedQueue.find(
            (process) => process.index === tail.process.index
          );

          process.history = {
            ...process.history,
            [clock]: clock >= process.arriveTime ? "waiting" : "normal",
          };
        }
      }

      while (blockedTail) {
        const processFounded = updatedQueue.find(
          (process) => process.index === blockedTail.process.index
        );

        processFounded.history = {
          ...processFounded.history,
          [clock]: "blocked",
        };

        blockedTail = blockedTail.next;
      }

      setNoChangeQueue(updatedQueue);

      setIsAvailable(available);
      tic = setTimeout(() => {
        setClock(clock + 1);
      }, 1000);
    }

    return () => {
      clearTimeout(tic);
    };
  }, [isRunning, clock]);

  const blockCurrentProcess = () => {
    const head = _.cloneDeep(processesQueue.peek());

    if (head && head.process.isOnCriticalSection) {
      setIsAvailable(true);

      const blocked = blockedProcesses
        ? _.cloneDeep(blockedProcesses)
        : new ProcessQueue();

      processesQueue.remove();

      blocked.push(head.process);

      setBlockedProcesses(blocked);
    }
  };

  const sortBySJF = (
    queue: Array<Process>,
    time: number = 0
  ): Array<Process> => {
    if (!queue.length) return [];

    //Search process that could be executed in that moment
    const processesReady = queue.filter(
      (process) => process.arriveTime <= time
    );

    //If is a time window with no process ready find in next time moment
    if (!processesReady?.length) return sortBySJF(queue, time + 1);

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

    return [finalProcess, ...sortBySJF(newQueue, finishTime)];
  };

  const sortQueue = async (queue: ProcessQueue): Promise<ProcessQueue> => {
    const sorted = new ProcessQueue();
    const asArray: Array<Process> = queue.map((process) => process);

    Promise.all(sortBySJF(asArray, 0)).then((result) =>
      result.map((process) => sorted.push(process))
    );

    return sorted;
  };
  const updateProcessQueue = (process: Process) => {
    let newQueue = !!processesQueue
      ? _.cloneDeep(processesQueue)
      : new ProcessQueue();
    newQueue.push(process);
    sortQueue(newQueue).then((result) => setProcessesQueue(result));
  };
  const updateStaticQueue = (process: Process) => {
    let newStaticQueue = !!processesQueue
      ? _.cloneDeep(noChangeQueue)
      : new ProcessQueue();
    newStaticQueue.push(process);
    sortQueue(newStaticQueue).then((result) =>
      setNoChangeQueue(newStaticQueue)
    );
  };
  const updateQueues = (process: Process) => {
    updateProcessQueue(process);
    updateStaticQueue(process);
  };

  return (
    <div className="sjf">
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Clock
          isAvailable={isAvailable}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          clock={clock}
        />
        <div
          style={{
            position: "absolute",
            right: "8px",
            top: "8px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span style={{ fontWeight: 700 }}>Cuantum</span>
          <input
            value={cuantum}
            onChange={({ target: { value } }) => setCuantum(+value)}
            type="number"
            disabled={isRunning || clock > 0}
            style={{ fontSize: "15px", padding: "8px", width: "100px" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginLeft: "32px",
          }}
        >
          <Form
            processes={processes}
            setProcesses={setProcesses}
            processesQueue={noChangeQueue}
            addProcessToQueue={updateQueues}
          />
          {/*GRAPH START */}
          {!!noChangeQueue?.length ? (
            <div className="chart-wrapper">
              <table className="chart">
                <tr>
                  <th>Proceso</th>
                  {new Array(clock + 1).fill(null).map((_, index) => (
                    <th>
                      <div className="chart-number-header">{index}</div>
                    </th>
                  ))}
                </tr>
                {noChangeQueue?.map((process) => {
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
          ) : (
            <></>
          )}

          {/*GRAPH END */}
          {isRunning && (
            <button
              className="block-button"
              onClick={() => blockCurrentProcess()}
            >
              Bloquear
            </button>
          )}
          {/**QUEUE */}
          <div className="queue">
            {processesQueue?.map((process) => (
              <span
                className={`item ${
                  process.isOnCriticalSection
                    ? "running current-item"
                    : "waiting"
                }`}
              >
                {process.name}
              </span>
            ))}
            {blockedProcesses?.map((process) => (
              <span className={`item blocked`}>{process.name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoundRobin;
