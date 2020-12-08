import React, { useState } from "react";
import "./App.css";
import Form from "./Form";
import GanttGraph from "./GanttGraph";

export type Process = {
  index: number;
  name: string;
  arriveTime: number;
  burstTime: number;
  startTime: number;
  finishTime: number;
  returnTime: number;
  waitTime: number;
};

function App() {
  const [processes, setProcesses] = useState<Array<Process>>([]);

  return (
    <div className="App">
      <Form processes={processes} setProcesses={setProcesses} />
      <GanttGraph processes={processes} />
    </div>
  );
}

export default App;
