import React, { FC } from "react";
import Line, { LineProps } from "../line";
import Chart from "../../chart/chart";
import Axis from "../../axis/axis";

const elements = {
  name: "tempi migliori",
  uom: "s",
  data: [
    {
      date: "2024-03-13T14:33:16.796Z",
      value: 1.5,
    },
    {
      date: "2024-03-14T14:33:16.796Z",
      value: 2.4,
    },
    {
      date: "2024-03-15T14:33:16.796Z",
      value: 1.9,
    },
    {
      date: "2024-03-16T14:33:16.796Z",
      value: 2.6,
    },
    {
      date: "2024-03-17T14:33:16.796Z",
      value: 1.5,
    },
    {
      date: "2024-03-18T14:33:16.796Z",
      value: 2.7,
    },
    {
      date: "2024-03-19T14:33:16.796Z",
      value: 8.5,
    },
    {
      date: "2024-03-20T14:33:16.796Z",
      value: 4.3,
    },
    {
      date: "2024-03-21T14:33:16.796Z",
      value: 3.1,
    },
    {
      date: "2024-03-22T14:33:16.796Z",
      value: 6.7,
    },
    {
      date: "2024-03-23T14:33:16.796Z",
      value: 9.5,
    },
    {
      date: "2024-03-24T14:33:16.796Z",
      value: 4.3,
    },
    {
      date: "2024-03-25T14:33:16.796Z",
      value: 5.1,
    },
    {
      date: "2024-03-26T14:33:16.796Z",
      value: 3.5,
    },
  ],
};

const dataPoints = [
  "13/03",
  "14/03",
  "15/03",
  "16/03",
  "17/03",
  "18/03",
  "19/03",
  "20/03",
  "21/03",
  "22/03",
  "23/03",
  "24/03",
  "25/03",
  "26/03",
];

const Example: FC<LineProps> = ({
  name = "tempi migliori",
  showDots = false,
  showLabels = false,
  hideLine = false,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <Chart width={400} height={400} elements={[elements]}>
        <Axis type="yAxis" name="tempi migliori" showLine />
        <Line
          name={name}
          showDots={showDots}
          showLabels={showLabels}
          hideLine={hideLine}
        />
        <Axis type="xAxis" dataPoints={dataPoints} showLine />
      </Chart>
    </div>
  );
};

export default Example;
