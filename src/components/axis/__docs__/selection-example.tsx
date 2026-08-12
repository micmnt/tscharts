import type { FC } from "react";
import Bar from "../../bar/bar";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Tooltip from "../../tooltip/tooltip";
import XAxis from "../xAxis";
import YAxis from "../yAxis";

const elements = [
	{
		name: "vendite",
		type: "bar",
		uom: "€",
		data: [
			{ date: "13/03", value: 120 },
			{ date: "14/03", value: 180 },
			{ date: "15/03", value: 90 },
			{ date: "16/03", value: 210 },
		],
	},
];

const dataPoints = ["13/03", "14/03", "15/03", "16/03"];

type SelectionExampleProps = {
	selectedValue?: string;
	selectedColor?: string;
};

const SelectionExample: FC<SelectionExampleProps> = ({
	selectedValue = "15/03",
	selectedColor = "#6366f1",
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
			<Chart width={480} height={400} elements={elements} barWidth={28}>
				<YAxis name="vendite" showLine showName />
				<Bar name="vendite" />
				<XAxis
					name="giorno"
					dataPoints={dataPoints}
					showLine
					showName
					selectedValue={selectedValue}
					selectedColor={selectedColor}
					onLabelClick={(label, index) =>
						console.log("[onLabelClick]", label, index)
					}
				/>
				<Tooltip />
				<Legend legendType="horizontal" height={60} showDots />
			</Chart>
		</div>
	);
};

export default SelectionExample;
