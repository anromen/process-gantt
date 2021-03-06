import React, { useEffect, useState } from "react";
import { Process } from "../App";

type Props = {
  processes: Array<Process>;
};

const GanttGraph: React.FC<Props> = ({ processes }) => {
  const [maxValue, setMaxValue] = useState(0);

  useEffect(() => {
    setMaxValue(
      processes.reduce(
        (max, process) =>
          process.finishTime
            ? process.finishTime > max
              ? process.finishTime
              : max
            : max,
        maxValue
      )
    );
  }, [processes]);

  return !!processes?.length ? (
    <div className="chart-wrapper">
      <table className="chart">
        <tr>
          <th>Proceso</th>
          {new Array(maxValue).fill(null).map((_, index) => (
            <th>
              <div className="chart-number-header">{index}</div>
            </th>
          ))}
        </tr>
        {processes.map((process) => (
          <tr key={process.index}>
            <td>{process.name}</td>
            {new Array(maxValue).fill(null).map((_, index) => (
              <td
                key={`${process.index}-${index}`}
                className={
                  index >= process.arriveTime &&
                  index < (process.startTime || 0)
                    ? "waiting"
                    : index >= (process.startTime || 0) &&
                      index < (process.finishTime || 0)
                    ? "running"
                    : "normal"
                }
              />
            ))}
          </tr>
        ))}
      </table>
    </div>
  ) : (
    <></>
  );
};

export default GanttGraph;
