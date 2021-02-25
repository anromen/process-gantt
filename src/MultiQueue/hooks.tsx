import { useState } from "react";
import _ from "lodash";
import { sortByFifo, sortBySJF } from "./sort";

export class ProcessNode {
  process: Process;
  next: ProcessNode;

  constructor(data) {
    this.process = data;
    this.next = null;
  }
}

export type Process = {
  index: number;
  name: string;
  arriveTime: number;
  burstTime: number;
  priority?: number;
  isOnCriticalSection?: boolean;
  roundTime?: number;
  remainingTime?: number;
  startTime?: number;
  finishTime?: number;
  returnTime?: number;
  waitTime?: number;
  history?: { [time: number]: "waiting" | "running" | "blocked" | "normal" };
  oldTime?: number;
  realValues?: {
    startTime?: number;
    finishTime?: number;
    returnTime?: number;
    waitTime?: number;
  };
};

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
    this.head = this.head?.next || null;
  }
}

type Queue = {
  processes: Array<Process>;
  infoQueue: ProcessQueue;
  processesQueue: ProcessQueue;
  blockedQueue: ProcessQueue;
  addProcess: (process: Process) => void;
  blockCurrentProcess: Function;
  unblockProcess: Function;
};

const useQueue = (
  sortMethod: (queue: Array<Process>, time: number) => Array<Process>
) => {
  const [processes, setProcesses] = useState<Array<Process>>([]);
  const [infoQueue, setInfoQueue] = useState<ProcessQueue>(null);
  const [processesQueue, setProcessesQueue] = useState<ProcessQueue>(null);
  const [blockedQueue, setBlockedQueue] = useState<ProcessQueue>(null);

  const sort = async (queue: ProcessQueue) => {
    const sorted = new ProcessQueue();
    const asArray: Array<Process> = queue.map((process) => process);

    Promise.all(sortMethod(asArray, 0)).then((result) =>
      result.map((process) => sorted.push(process))
    );

    return sorted;
  };

  const updateProcessQueue = (process: Process) => {
    let newQueue = !!processesQueue
      ? _.cloneDeep(processesQueue)
      : new ProcessQueue();
    newQueue.push(process);

    sort(newQueue).then((result) => setProcessesQueue(result));
  };
  const updateInfoQueue = (process: Process) => {
    let newInfoQueue = !!infoQueue
      ? _.cloneDeep(infoQueue)
      : new ProcessQueue();
    newInfoQueue.push(process);

    sort(newInfoQueue).then((result) => setInfoQueue(result));
  };
  const updateBlockedQueue = (process: Process) => {
    let newBlockedQueue = !!blockedQueue
      ? _.cloneDeep(blockedQueue)
      : new ProcessQueue();
    newBlockedQueue.push(process);

    sort(newBlockedQueue).then((result) => setBlockedQueue(result));
  };

  const addProcess = (process: Process) => {
    updateProcessQueue(process);
    updateInfoQueue(process);

    setProcesses([...processes, process]);
  };
  const moveProcess = (process: Process, infoQueue: ProcessQueue) => {
    updateProcessQueue(process);
  };
  const blockCurrentProcess = () => {
    const head = _.cloneDeep(processesQueue.peek());

    if (head && head.process.isOnCriticalSection) {
      processesQueue.remove();
      updateBlockedQueue(head.process);
    }
  };
  const unblockProcess = () => {
    const blockedTail = blockedQueue.peek();
    blockedQueue.remove();
    updateProcessQueue(blockedTail.process);
  };

  return {
    processes,
    infoQueue,
    processesQueue,
    blockedQueue,
    addProcess,
    blockCurrentProcess,
    unblockProcess,
  };
};

export const useRoundRobinHook = (): Queue => {
  return useQueue(sortByFifo);
};
export const useSjf = (): Queue => {
  return useQueue(sortBySJF);
};
export const useFifo = (): Queue => {
  return useQueue(sortByFifo);
};
