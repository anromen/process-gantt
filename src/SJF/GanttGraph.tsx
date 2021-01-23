import React, { useEffect, useState } from "react";
import { Process } from "../App";
import { ProcessQueue } from "./SJF";

type Props = {
  processes: ProcessQueue;
  realQueue: ProcessQueue;
  time: number;
};

const GanttGraph: React.FC<Props> = ({ processes, realQueue, time }) => {
  useEffect(() => {
    console.log("#change_real", realQueue);
  }, [realQueue]);

  return !!time && !!processes?.length ? (
    <div className="chart-wrapper">
      <table className="chart">
        <tr>
          <th>Proceso</th>
          {new Array(time).fill(null).map((_, index) => (
            <th>
              <div className="chart-number-header">{index}</div>
            </th>
          ))}
        </tr>
        {processes?.map((process) => {
          const current = realQueue.find(
            ({ index }) => process.index === index
          );

          return (
            <tr key={process.index}>
              <td>{process.name}</td>
              {new Array(time).fill(null).map((_, time) => (
                <td
                  key={`${process.index}-${time}`}
                  className={current?.history?.[time] || "normal"}
                />
              ))}
            </tr>
          );
        })}
      </table>
    </div>
  ) : (
    <></>
  );
};

export default GanttGraph;
