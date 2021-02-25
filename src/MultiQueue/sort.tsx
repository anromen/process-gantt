import { Process } from "./hooks";

export const sortByFifo = (
  queue: Array<Process>,
  time: number = 0
): Array<Process> => {
  if (!queue.length) return [];

  //Search process that could be executed in that moment
  const processesReady = queue.filter((process) => process.arriveTime <= time);

  //If is a time window with no process ready find in next time moment
  if (!processesReady?.length) return sortByFifo(queue, time + 1);

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

  const newQueue = queue.filter((process) => process.index !== selected.index);

  return [finalProcess, ...sortByFifo(newQueue, finishTime)];
};

export const sortBySJF = (
  queue: Array<Process>,
  time: number = 0
): Array<Process> => {
  if (!queue.length) return [];

  //Search process that could be executed in that moment
  const processesReady = queue.filter((process) => process.arriveTime <= time);

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

  const newQueue = queue.filter((process) => process.index !== selected.index);

  return [finalProcess, ...sortBySJF(newQueue, finishTime)];
};
