import React, { useEffect, useState } from "react";
import "./App.css";
import FirstMethod from "./FirstMethod/FirstMethod";
import Form from "./FirstMethod/Form";
import GanttGraph from "./FirstMethod/GanttGraph";
import SJF from "./SJF/SJF";

export type Process = {
  index: number;
  name: string;
  arriveTime: number;
  burstTime: number;
  isOnCriticalSection?: boolean;
  remainingTime?: number;
  startTime?: number;
  finishTime?: number;
  returnTime?: number;
  waitTime?: number;
  history?: { [time: number]: "waiting" | "running" | "blocked" | "normal" };
};

function App() {
  const [processes, setProcesses] = useState<Array<Process>>([]);

  // return <FirstMethod />;

  return <SJF />;
}

export default App;
