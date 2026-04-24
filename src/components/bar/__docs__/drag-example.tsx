import React, { type FC, useState } from "react";
import Axis from "../../axis/axis";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Bar, { type BarDragPayload } from "../bar";

type DragExampleProps = {
	name?: string;
	showLabels?: boolean;
	barWidth?: number;
	dragValueDecimals?: number;
};

const initialSerie = {
	name: "tempi migliori",
	type: "bar",
	axisName: "tempi migliori",
	uom: "s",
	data: [
		{ date: "2024-03-13T14:33:16.796Z", value: 1.5 },
		{ date: "2024-03-14T14:33:16.796Z", value: 2.4 },
		{ date: "2024-03-15T14:33:16.796Z", value: 1.9 },
		{ date: "2024-03-16T14:33:16.796Z", value: 2.6 },
		{ date: "2024-03-17T14:33:16.796Z", value: 1.5 },
		{ date: "2024-03-18T14:33:16.796Z", value: 2.7 },
		{ date: "2024-03-19T14:33:16.796Z", value: 8.5 },
		{ date: "2024-03-20T14:33:16.796Z", value: 4.3 },
		{ date: "2024-03-21T14:33:16.796Z", value: 3.1 },
		{ date: "2024-03-22T14:33:16.796Z", value: 6.7 },
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
];

const DragExample: FC<DragExampleProps> = ({
	name = "tempi migliori",
	showLabels = true,
	barWidth = 28,
	dragValueDecimals = 3,
}) => {
	const [serie, setSerie] = useState(initialSerie);
	const [dragInfo, setDragInfo] = useState<BarDragPayload | null>(null);

	const elements = [serie];

	const handleDrag = (payload: BarDragPayload) => {
		setDragInfo(payload);

		setSerie((prev) => ({
			...prev,
			data: prev.data.map((el, index) =>
				index === payload.index ? { ...el, value: payload.value } : el,
			),
		}));
	};

	return (
		<div
			style={{
				display: "flex",
				width: '100%',
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<div
				style={{
					fontFamily: "monospace",
					fontSize: 12,
					marginBottom: 8,
				}}
			>
				{dragInfo
					? `dragging index ${dragInfo.index}: ${dragInfo.value.toFixed(dragValueDecimals)} ${serie.uom}`
					: "Drag a bar to update its value in real time"}
			</div>
			<Chart width={460} height={360} elements={elements}>
				<Axis type="yAxis" name="tempi migliori" showLine showName />
				<Bar
					name={name}
					showLabels={showLabels}
					config={{
						barWidth,
						dragValueDecimals,
						barDragAction: handleDrag,
					}}
				/>
				<Axis
					type="xAxis"
					dataPoints={dataPoints}
					showLine
					showName
					name="Data di riferimento per i valori"
				/>
				<Legend legendType="horizontal" height={90} />
			</Chart>
		</div>
	);
};

export default DragExample;
