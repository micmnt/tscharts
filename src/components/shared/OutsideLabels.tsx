import { resolveOutsideLabelCollisions } from "../../lib/core";

type OutsideLabelLayout = {
	p1: { x: number; y: number };
	p2: { x: number; y: number };
	p3: { x: number; y: number };
	textX: number;
	textY: number;
	anchor: "start" | "end";
};

// Rende le label esterne (fuori dall'anello/torta) con la loro leader line, a
// partire dal layout geometrico calcolato dai generatori (pie.ts). Applica
// l'anti-collisione sulle sole label effettivamente renderizzate. Condiviso da
// <Donut> e <Pie>.
export const OutsideLabels = ({
	labels,
	layout,
	color,
	keyPrefix,
}: {
	labels: { name: string; value?: string }[];
	layout: Map<string, OutsideLabelLayout>;
	color: string;
	keyPrefix: string;
}) => {
	const rendered = labels
		.map((label) => {
			const l = layout.get(label.name);
			return l ? { ...l, name: label.name, value: label.value } : null;
		})
		.filter((item): item is NonNullable<typeof item> => item !== null);

	const adjusted = resolveOutsideLabelCollisions(rendered);

	return adjusted.flatMap((item) => [
		<polyline
			key={`${keyPrefix}-leader-${item.name}`}
			points={`${item.p1.x},${item.p1.y} ${item.p2.x},${item.p2.y} ${item.p3.x},${item.p3.y}`}
			fill="none"
			stroke={color}
			strokeWidth={1}
		/>,
		<text
			key={`${keyPrefix}-text-${item.name}`}
			x={item.textX}
			y={item.textY}
			textAnchor={item.anchor}
			dominantBaseline="middle"
			fontSize={12}
			fill={color}
		>
			{item.value}
		</text>,
	]);
};
