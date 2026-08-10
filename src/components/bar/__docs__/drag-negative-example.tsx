import React, { type FC, useState } from "react";
import XAxis from "../../axis/xAxis";
import YAxis from "../../axis/yAxis";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Tooltip from "../../tooltip/tooltip";
import Bar, { type BarDragPayload } from "../bar";

const initialSerie = {
	name: "variazione",
	type: "bar",
	uom: "%",
	data: [
		{ date: "a", value: -30 },
		{ date: "b", value: 20 },
		{ date: "c", value: -10 },
	],
};

const dataPoints = ["a", "b", "c"];

const DragNegativeExample: FC = () => {
	const [serie, setSerie] = useState(initialSerie);
	const [dragInfo, setDragInfo] = useState<BarDragPayload | null>(null);

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
				width: "100%",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<div style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 8 }}>
				{dragInfo
					? `dragging index ${dragInfo.index}: ${dragInfo.value}`
					: "Trascina la barra 'a' (parte da -30) verso il basso"}
			</div>
			<Chart width={400} height={400} elements={[serie]}>
				<YAxis name="variazione" showLine showGrid showName />
				<Bar name="variazione" showLabels onBarDrag={handleDrag} />
				<XAxis dataPoints={dataPoints} showLine />
				<Tooltip />
				<Legend legendType="horizontal" height={40} showDots />
			</Chart>
		</div>
	);
};

export default DragNegativeExample;
