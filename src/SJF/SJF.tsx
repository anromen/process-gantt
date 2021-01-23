import React, { useEffect, useState } from "react";
import { isAccessor } from "typescript";
import { Process } from "../App";
import Clock from "./Clock";
import Form from "./Form";
import GanttGraph from "./GanttGraph";
import "./SJF.css";
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

function SJF() {
  //Status
  const [clock, setClock] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  //Queues
  const [processes, setProcesses] = useState<Array<Process>>([]);
  const [noChangeQueue, setNoChangeQueue] = useState<ProcessQueue>(null);
  const [processesQueue, setProcessesQueue] = useState<ProcessQueue>(null);
  const [blockedProcesses, setBlockedProcesses] = useState<ProcessQueue>(null);

  useEffect(() => {
    let tic: any;

    if (isRunning) {
      const updatedQueue = _.cloneDeep(noChangeQueue);

      let tail = processesQueue?.head;
      let blockedTail = blockedProcesses?.head;
      let available = isAvailable;

      if (tail) {
        let process = updatedQueue.find(
          (process) => process.index === tail.process.index
        );

        //Check if critical section is available
        if (available && clock >= tail.process.arriveTime) {
          tail.process.isOnCriticalSection = true;
          tail.process.remainingTime -= 1;

          process.history = { ...process.history, [clock]: "running" };

          if (tail.process.remainingTime === 0) {
            processesQueue.remove();
            available = true;
          } else {
            available = false;
          }
        } else if (!isAvailable && clock >= tail.process.arriveTime) {
          tail.process.remainingTime -= 1;
          process.history = { ...process.history, [clock]: "running" };

          if (tail.process.remainingTime === 0) {
            processesQueue.remove();
            available = true;
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
      } else if (blockedProcesses) {
        const blocked = _.cloneDeep(blockedProcesses);

        setBlockedProcesses(null);
        setProcessesQueue(blocked);
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

      tic = setTimeout(() => {
        setIsAvailable(available);
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

      if (process.burstTime < sel.burstTime) return process;
      if (process.burstTime > sel.burstTime) return sel;
      if (process.burstTime === sel.burstTime) {
        if (process.arriveTime < sel.arriveTime) return process;
        if (process.arriveTime > sel.arriveTime) return sel;
        if (process.arriveTime === sel.arriveTime) {
          return process.index < sel.index ? process : sel;
        }
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
  const updateQueues = (process: Process) => {
    let newQueue = !!processesQueue
      ? _.cloneDeep(processesQueue)
      : new ProcessQueue();
    let newStaticQueue = !!processesQueue
      ? _.cloneDeep(_.cloneDeep(noChangeQueue))
      : new ProcessQueue();

    newQueue.push(process);
    newStaticQueue.push(process);

    sortQueue(newQueue).then((result) => setProcessesQueue(result));
    sortQueue(newStaticQueue).then((result) =>
      setNoChangeQueue(newStaticQueue)
    );
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
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginLeft: "32px",
          }}
        >
          <Form
            processes={processes}
            setProcesses={setProcesses}
            processesQueue={processesQueue}
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

export default SJF;
