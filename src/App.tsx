import React, { useEffect, useState } from "react";
import "./App.css";
import FirstMethod from "./FirstMethod/FirstMethod";
import Prioridad from "./Prioridad/Prioridad";
import SJF from "./SJF/SJF";

export type Process = {
  index: number;
  name: string;
  arriveTime: number;
  burstTime: number;
  priority?: number;
  isOnCriticalSection?: boolean;
  remainingTime?: number;
  startTime?: number;
  finishTime?: number;
  returnTime?: number;
  waitTime?: number;
  history?: { [time: number]: "waiting" | "running" | "blocked" | "normal" };
  realValues?: {
    startTime?: number;
    finishTime?: number;
    returnTime?: number;
    waitTime?: number;
  };
};

function App() {
  // return <FirstMethod />;
  // return <SJF />;
  return <Prioridad />;
}

export default App;
