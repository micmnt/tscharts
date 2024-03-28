import React, { FC } from "react";
import Pie, { PieProps } from "../pie";
import Chart from "../../chart/chart";

const series = [
  {
    name: "numero utenti",
    type: "pie",
    data: [
      {
        name: "utenti paganti",
        value: 1942,
        label: "68%",
      },
      {
        name: "utenti non paganti",
        value: 456,
        label: "32%",
      },
    ],
    labels: [
      { name: "utenti paganti", value: "68%" },
      { name: "utenti non paganti", value: "32%" },
    ],
  },
];

const Example: FC<PieProps> = ({ name = "numero utenti" }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <Chart width={400} height={400} elements={series}>
        <Pie name={name} />
      </Chart>
    </div>
  );
};

export default Example;
