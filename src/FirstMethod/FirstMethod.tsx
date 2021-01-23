import React, { useState } from "react";
import { Process } from "../App";
import Form from "./Form";
import GanttGraph from "./GanttGraph";
import "./FirstMethod.css";

function FirstMethod() {
  const [processes, setProcesses] = useState<Array<Process>>([]);

  return (
    <div className="app">
      <Form processes={processes} setProcesses={setProcesses} />
      <GanttGraph processes={processes} />
    </div>
  );
}

export default FirstMethod;
