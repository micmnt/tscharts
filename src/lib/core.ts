import type { AngleDonutSerieEl, ChartState, PieSerieEl, Serie, TimeSerieEl } from "../types";
import {
	calculateFlatValue,
	getFirstValorizedElementIndex,
	isDefined,
	normalizeBarRadius,
	trimZerosAndNullLinePath,
} from "./utils";

// Funzione che prende in ingresso il valore massimo di una serie, il valore di un elemento della serie e la dimensione effettiva del grafico e ritorna la posizione sul grafico del valore
export const getValuePosition = (
	maxValue: number,
	value: number,
	chartDimension: number,
) => {
	return (chartDimension * value) / maxValue;
};

// Funzione che prende in ingresso un valore e genera una linea verticale nel grafico
export const generateVerticalLine = (x: number, y: number, startY: number) => {
	return `M ${x} ${startY} V ${y}`;
};

// Funzione che genera il valore d di un path svg per una barra verticale
export const generateVerticalBarPath = (
	x: number,
	y: number,
	barWidth: number,
	startY: number,
	radius?: number,
	topLeftRadius?: number,
	topRightRadius?: number,
	bottomRightRadius?: number,
	bottomLeftRadius?: number,
	isNegative?: boolean,
) => {
	if (
		(radius ||
			topLeftRadius ||
			bottomLeftRadius ||
			topRightRadius ||
			bottomRightRadius) &&
		y !== startY
	) {
		const normalizedRadius = normalizeBarRadius(radius, startY - y);
		const normalizedTopLeftRadius = normalizeBarRadius(
			topLeftRadius,
			startY - y,
		);
		const normalizedBottomLeftRadius = normalizeBarRadius(
			bottomLeftRadius,
			startY - y,
		);
		const normalizedTopRightRadius = normalizeBarRadius(
			topRightRadius,
			startY - y,
		);
		const normalizedBottomRightRadius = normalizeBarRadius(
			bottomRightRadius,
			startY - y,
		);

		const topY = isNegative ? startY : y;
		const bottomY = isNegative ? y : startY;

		const topLeftCorner =
			normalizedRadius || normalizedTopLeftRadius
				? `Q${x},${topY} ${x + (normalizedRadius || normalizedTopLeftRadius || 0)},${topY}`
				: "";
		const topRightCorner =
			normalizedRadius || normalizedTopRightRadius
				? `Q${x + barWidth},${topY} ${x + barWidth},${topY + (normalizedRadius || normalizedTopRightRadius || 0)}`
				: "";
		const bottomRightCorner =
			normalizedRadius || normalizedBottomRightRadius
				? `Q${x + barWidth},${bottomY} ${x + barWidth - (normalizedRadius || normalizedBottomRightRadius || 0)},${bottomY}`
				: "";
		const bottomLeftCorner =
			normalizedRadius || normalizedBottomLeftRadius
				? `Q${x},${bottomY} ${x},${bottomY - (normalizedRadius || normalizedBottomLeftRadius || 0)}`
				: "";

		const startPosition = `M ${x} ${bottomY + (normalizedRadius || normalizedTopLeftRadius || 0)}`;
		const topLeftPoint = `V ${topY + (normalizedRadius || normalizedTopLeftRadius || 0)}`;
		const topRightPoint = `H ${x + barWidth - (normalizedRadius || normalizedTopRightRadius || 0)}`;
		const bottomRightPoint = `V ${bottomY - (normalizedRadius || normalizedBottomRightRadius || 0)}`;
		const bottomLeftPoint = `H ${x + (normalizedRadius || normalizedBottomLeftRadius || 0)}`;

		return `${startPosition} ${topLeftPoint} ${topLeftCorner} ${topRightPoint} ${topRightCorner} ${bottomRightPoint} ${bottomRightCorner} ${bottomLeftPoint} ${bottomLeftCorner}`;
	}
	return `M ${x} ${startY} V ${y} H ${x + barWidth} V ${startY} Z`;
};

// Funzione che genera la spezzata dal punto precedente alle coordinate passate come parametro
export const generateLine = (x: number, y: number) => {
	return `L ${x} ${y}`;
};

// Funzione che genera il valore d di un path svg per uno spicchio di grafico a torta
export const generatePieSlice = (
	centerX: number,
	centerY: number,
	radius: number,
	startAngle: number,
	endAngle: number,
) => {
	const startRadius = `M ${centerX} ${centerY} L ${centerX} ${startAngle}`;
	const endRadius = `L ${centerX} ${centerY}`;

	const arc = generateArcBarPath(
		centerX,
		centerY,
		radius,
		undefined,
		startAngle,
		endAngle,
	);

	return `${startRadius} ${arc} ${endRadius}`;
};

// Funzione che genera il valore d di un path svg per uno spicchio di grafico a ciambella
export const generateDonutSlice = (
	centerX: number,
	centerY: number,
	radius: number,
	innerRadius: number,
	startAngle: number,
	endAngle: number,
) => {
	const arc = generateArcBarPath(
		centerX,
		centerY,
		radius,
		innerRadius,
		startAngle,
		endAngle,
	);

	return arc;
};

// Funzione che genera il valore d di un path svg per una barra ad arco
export const generateArcBarPath = (
	centerX: number,
	centerY: number,
	radius: number,
	innerRadius: number | undefined,
	startAngle: number,
	endAngle: number,
) => {
	const startPoint = polarToCartesian(centerX, centerY, radius, startAngle);
	const endPoint = polarToCartesian(centerX, centerY, radius, endAngle);

	const isLargeArc = endAngle - startAngle <= 180 ? 0 : 1;

	if (innerRadius) {
		const startInnerPoint = polarToCartesian(
			centerX,
			centerY,
			innerRadius,
			startAngle,
		);
		const endInnerPoint = polarToCartesian(
			centerX,
			centerY,
			innerRadius,
			endAngle,
		);
		return `M ${startPoint.x} ${startPoint.y}
			A ${radius} ${radius} 0 ${isLargeArc} 1 ${endPoint.x} ${endPoint.y}
			L ${endInnerPoint.x} ${endInnerPoint.y}
			A ${innerRadius} ${innerRadius} 0 ${isLargeArc} 0 ${startInnerPoint.x} ${startInnerPoint.y}
			Z`;
	}

	return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${isLargeArc} 1 ${endPoint.x} ${endPoint.y}`;
};

// Funzione che formatta le labels per l'asse x dei grafici
export const formatLabels = (
	labels: string[],
	formatFn: (l: string) => string,
) => {
	return labels.map((label) => formatFn(label));
};

// Funzione che calcola il valore massimo di una serie
export const getTimeSerieMaxValue = (serie: TimeSerieEl[] = []) => {
	if (serie?.length > 0) {
		return Math.max(
			...serie
				.filter((el) => el !== null)
				.map((serieEl) => Math.abs(serieEl.value)),
		);
	}

	return 0;
};

// Funzione che trasforma un punto globale dello schermo in un punto nel grafico svg
export const convertToSVGPoint = (
	svgContainer: SVGSVGElement | null = null,
	x = 0,
	y = 0,
) => {
	if (svgContainer) {
		const point: SVGPoint = svgContainer.createSVGPoint();
		point.x = x;
		point.y = y;

		const svgPoint: SVGPoint = point.matrixTransform(
			svgContainer.getScreenCTM()?.inverse(),
		);

		return svgPoint;
	}

	return null;
};

// Funzione che converte coordinate polari in coordinate cartesiane
export const polarToCartesian = (
	centerX: number,
	centerY: number,
	radius: number,
	angleInDegrees: number,
) => {
	const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

	return {
		x: centerX + radius * Math.cos(angleInRadians),
		y: centerY + radius * Math.sin(angleInRadians),
	};
};

// Funzione che calcola la posizione del tooltip nell'svg partendo dalla posizione del mouse
export const calculateTooltipPosition = (
	tooltipElement: HTMLElement | null,
	svgPoint: { x: number; y: number },
	chartXStart: number,
	chartXEnd: number,
	chartYEnd: number,
) => {
	if (tooltipElement === null) return undefined;

	const tooltipX =
		svgPoint.x < (chartXEnd - chartXStart) / 2
			? svgPoint.x + 50
			: svgPoint.x - tooltipElement.clientWidth - 50;

	const tooltipY =
		svgPoint.y < (chartYEnd - 10) / 2
			? svgPoint.y + 10
			: svgPoint.y - 20 - tooltipElement.clientHeight / 2;

	return { x: tooltipX < 0 ? 0 : tooltipX, y: tooltipY };
};

//Funzione che dato un array di serie, calcola il numero di assi che devono essere a sinistra e a destra del grafico
export const getAxisCount = (yAxisCount = 0) => {
	const isSeriesCountEven = yAxisCount % 2 === 0;

	// Se il numero di serie da graficare è dispari, voglio avere sempre un asse in più a sinistra del grafico
	const leftAxisCount = isSeriesCountEven
		? yAxisCount / 2
		: Math.floor(yAxisCount / 2) + 1;
	const rightAxisCount = Math.floor(yAxisCount / 2);

	return { leftAxisCount, rightAxisCount };
};

// Funzione che preso in ingresso la larghezza e l'altezza dell'svg,
// il numero di assi a destra e sinistra del grafico e
// lo spazio di padding calcola i punti di inizio e fine in lunghezza e larghezza del grafico
export const getChartDimensions = (
	padding: number,
	svgWidth: number,
	svgHeight: number,
	leftAxisCount: number,
	rightAxisCount: number,
	legendHeight: number,
) => {
	const xPaddingMultiplier = 3;
	const yPaddingMultiplier = 4;
	const chartXStart = xPaddingMultiplier * padding * leftAxisCount;
	const chartXEnd =
		svgWidth -
		padding * xPaddingMultiplier * (rightAxisCount || 1 / xPaddingMultiplier);
	const chartYEnd = svgHeight - yPaddingMultiplier * padding - legendHeight;

	return { chartXStart, chartXEnd, chartYEnd };
};

// Funzione che genera l'asse x
export const generateXAxis = (ctx: ChartState & { padding: number }) => {
	const { chartXStart, chartXEnd, chartYEnd: _chartYEnd, negative } = ctx;
	const chartYEnd = _chartYEnd as number;

	const normalizedChartYEnd = negative ? ctx.chartYMiddle : chartYEnd;

	return {
		path: `M ${chartXStart} ${normalizedChartYEnd} H ${chartXEnd}`,
	};
};

// Funzione che calcola il massimo sommando i massimi delle serie da mostrare come colonne stacked
const calculateStackedSeriesMax = (series: Serie[]) => {
	// Prendo le labels per costruire una serie unificata
	const serieLabels =
		(series?.[0].data as TimeSerieEl[]).map((el) => el.date) ?? [];
	// Creo una serie dove per ogni label c'è la somma dei valori di tutte le serie per quella label
	const unifiedSerie = serieLabels.map((label) => {
		const seriesElements = series.flatMap((serie) =>
			(serie.data as TimeSerieEl[]).find((el) => el.date === label),
		);
		const value = (seriesElements as TimeSerieEl[]).reduce((acc, el) => {
			acc += el.value ?? 0;
			return acc;
		}, 0);

		return { date: label, value };
	});

	return getTimeSerieMaxValue((unifiedSerie as TimeSerieEl[]) ?? []);

	// return series.reduce((acc, stackedSerie) => {
	// 	const serieMaxValue = getTimeSerieMaxValue(
	// 		(stackedSerie.data as TimeSerieEl[]) ?? [],
	// 	);
	// 	acc += serieMaxValue;

	// 	return acc;
	// }, 0);
};

// Funzione che prende in ingresso le serie del grafico e ritorna le serie a linea e a barre presenti associate ad un determinato asse
export const getSeriesByAxisName = (elements: Serie[], axisName: string) => {
	if (!elements || !axisName) return [];
	// Prendo i valori delle serie presenti associate all'asse da graficare
	const axisSeries = elements
		.filter(
			(el) =>
				(el.type === "line" || el.type === "bar") && el.axisName === axisName,
		)
		.map((el) => el.data);
	return axisSeries;
};

// Funzione che prende in ingresso le serie del grafico e ritorna le soglie presenti associate ad un determinato asse
export const getSerieAssociatedThresholds = (
	elements: Serie[],
	axisName: string,
) => {
	if (!elements || !axisName) return [];
	// Prendo i valori delle eventuali soglie presenti associate all'asse della serie da graficare
	const seriesThresholds = elements
		.filter((el) => el.type === "threshold" && el.axisName === axisName)
		.map((el) => ({ date: "null", value: el.data as number }));

	return seriesThresholds;
};

// funzione che genera gli assi di un grafico
export const generateYAxis = (
	serie: Serie,
	ctx: ChartState & { padding: number; yInterval: number },
) => {
	// Prendo i dati della serie da garficare
	// const serieData = serie.data as TimeSerieEl[];

	const isStacked = serie.type === "bar-stacked";
	const isGroupStacked = serie.stackedName;

	if (!ctx.elements) return null;

	const seriesThresholds = getSerieAssociatedThresholds(
		ctx.elements,
		serie.name,
	);

	const axisSeries = getSeriesByAxisName(
		ctx.elements,
		serie.axisName ?? serie.name,
	);

	const flatAxisSeriesData = axisSeries.flat() as TimeSerieEl[];

	let serieMaxValue = 0;
	let negativeSerieMaxValue = 0;
	if (ctx.negative) {
		const negativeSeries = ctx.elements.filter((el) =>
			(el.data as TimeSerieEl[]).some((dataEl) => dataEl.value < 0),
		);
		const positiveSeries = ctx.elements.filter(
			(el) => !(el.data as TimeSerieEl[]).some((dataEl) => dataEl.value < 0),
		);
		serieMaxValue = getTimeSerieMaxValue([
			...positiveSeries.flatMap((el) => el.data as TimeSerieEl[]),
		]);
		negativeSerieMaxValue = getTimeSerieMaxValue([
			...negativeSeries.flatMap((el) => el.data as TimeSerieEl[]),
		]);
	} else if (isStacked) {
		serieMaxValue = calculateStackedSeriesMax(
			ctx.elements.filter((el) => el.type === "bar-stacked"),
		);
	} else if (isGroupStacked) {
		// Listo tutte le serie non stacked
		const nonStackedSeries = ctx.elements.filter(
			(el) => el.type === "group-bar" && !el.stackedName,
		);

		const allStackedSeries = ctx.elements.filter(
			(el) => el.type === "group-bar" && el.stackedName,
		);

		const allStackedNames = allStackedSeries.map((el) => el.stackedName);
		const uniqueStackedNames = Array.from(new Set(allStackedNames));

		const stackedSeriesMaxArray = uniqueStackedNames.map((name) => {
			const involvedSeries = allStackedSeries.filter(
				(serie) => serie.stackedName === name,
			);

			const maxValue = calculateStackedSeriesMax(involvedSeries);
			return maxValue;
		});

		const nonStackedSeriesMaxArray = nonStackedSeries.map((serie) =>
			getTimeSerieMaxValue(serie.data as TimeSerieEl[]),
		);
		const stackedMaxValue = Math.max(
			...stackedSeriesMaxArray,
			...nonStackedSeriesMaxArray,
		);
		serieMaxValue = stackedMaxValue;
	} else {
		serieMaxValue = getTimeSerieMaxValue([
			...flatAxisSeriesData,
			...(seriesThresholds ?? []),
		]);
	}

	const serieIndex = ctx.elements.findIndex((el) => el.name === serie.name);

	if (serieIndex < 0) return null;

	const {
		height: _height,
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		padding,
		yInterval,
	} = ctx;

	const chartXStart = _chartXStart as number;
	const chartXEnd = _chartXEnd as number;
	const chartYEnd = _chartYEnd as number;
	const height = _height as number;

	const yAxisInterval = (chartYEnd - padding) / yInterval;

	const isOppositeAxis = serieIndex % 2 !== 0;

	/* Creazione degli assi */
	const axisX = isOppositeAxis ? chartXEnd : chartXStart + padding / 2;

	const axisPath = generateVerticalLine(axisX, chartYEnd, 0);

	// creazione delle label degli assi e del nome verticale degli assi
	const axisLabelsX = isOppositeAxis
		? axisX + (3 / 2) * padding * (serieIndex - 1) + padding / 2
		: axisX - (3 / 2) * padding * serieIndex - padding / 2;

	const nameLabelX = isOppositeAxis
		? axisLabelsX + 2 * padding
		: axisLabelsX - (5 / 2) * padding;

	const nameLabelAxisPath = generateVerticalLine(
		nameLabelX,
		0,
		height - 3 * padding,
	);

	if (ctx.negative) {
		const negativeAndPositiveSerieMaxValue = Math.max(
			serieMaxValue,
			negativeSerieMaxValue,
		);

		const flatMaxValue = ctx.flatMax
			? calculateFlatValue(negativeAndPositiveSerieMaxValue)
			: negativeAndPositiveSerieMaxValue;

		const firstValue = serie.format
			? serie.format(flatMaxValue * -1)
			: flatMaxValue * -1;

		const lastValue = serie.format ? serie.format(flatMaxValue) : flatMaxValue;

		const yAxisLabels = [
			{
				value: firstValue,
				x: axisLabelsX,
				y: chartYEnd + yAxisInterval,
			},
		];

		for (
			let i = Math.floor(yInterval / 2) * -1;
			i < Math.ceil(yInterval / 2);
			i++
		) {
			const flatInterval = ctx.flatMax
				? calculateFlatValue(flatMaxValue / Math.ceil(yInterval / 2))
				: flatMaxValue / Math.ceil(yInterval / 2);

			const axisIntervalIndex = Math.floor(yInterval / 2) - i;

			const axisValue = flatInterval * i === 0 ? 0 : flatInterval * i * -1;

			const axisY =
				axisValue === 0
					? (ctx.chartYMiddle ?? 0)
					: chartYEnd - yAxisInterval * axisIntervalIndex;

			const serieValue = serie.format ? serie.format(axisValue) : axisValue;

			const element = {
				value: serieValue,
				x: axisLabelsX,
				y: axisY,
			};

			yAxisLabels.push(element);
		}

		yAxisLabels.push({
			value: lastValue,
			x: axisLabelsX,
			y: chartYEnd - yAxisInterval * yInterval,
		});

		return {
			valueLabels: yAxisLabels,
			isOpposite: isOppositeAxis,
			uom: serie.uom,
			name: serie.name,
			path: axisPath,
			nameLabelPath: nameLabelAxisPath,
		};
	}

	const flatMaxValue = ctx.flatMax
		? calculateFlatValue(serieMaxValue)
		: serieMaxValue;

	const lastValue = serie.format ? serie.format(flatMaxValue) : flatMaxValue;

	const yAxisLabels = [...Array(yInterval)]
		.map((_, index) => {
			const flatInterval = flatMaxValue / yInterval;
			const axisValue = flatInterval * index;

			const serieValue = serie.format ? serie.format(axisValue) : axisValue;

			return {
				value: serieValue,
				x: axisLabelsX,
				y: chartYEnd - yAxisInterval * index,
			};
		})
		.concat({
			value: lastValue,
			x: axisLabelsX,
			y: chartYEnd - yAxisInterval * yInterval,
		});

	return {
		valueLabels: yAxisLabels,
		isOpposite: isOppositeAxis,
		uom: serie.uom,
		name: serie.name,
		path: axisPath,
		nameLabelPath: nameLabelAxisPath,
	};
};

// Funzione che genera i path per una serie di un grafico a ciambella aperto con un angolo
export const generateAngleDonutPaths = (
	serie: Serie,
	ctx: ChartState & {
		padding: number;
		innerRadius?: number;
		angle?: number;
		showTrack?: boolean;
		centerElement?: {
			value?: string;
			valueColor?: string;
			valueSize?: number;
			uom?: string;
			uomColor?: string;
			uomSize?: number;
			uomDx?: number;
			label?: string;
			labelColor?: string;
			labelSize?: number;
			labelDy?: number;
		}
	}
) => {
	const serieData = serie.data as AngleDonutSerieEl[]

	const {width, height, padding, centerElement, angle, showTrack = false} = ctx

	const {value: centerValue} = centerElement ?? {}

	const centerX = (width as number) / 2;
	const centerY = (height as number) / 2 - padding;
	const radius = ((height as number) - 2 * padding) / 2;

	const paths = serieData.map((serieEl, serieElIndex) => {
		const maxValue = isDefined(serieEl.maxValue) ? serieEl.maxValue : serieEl.value
		const startAngle = 0

		const normalizedAngle = isDefined(angle) ? Number(angle) : 360
		const valueAngle = (Number(serieEl.value) * normalizedAngle) / maxValue;
		
		const normalizedValueAngle = valueAngle >= 360 ? 359.9 : valueAngle;

		const newRadius = radius - ((ctx.innerRadius ?? radius / 2) + padding / 8) * serieElIndex
		const newInnerRadius = newRadius - (ctx.innerRadius ?? radius / 2)

		let shadowPath = ''

		if(showTrack && isDefined(serieEl.maxValue)) {
			shadowPath = generateDonutSlice(
				centerX,
				centerY,
				newRadius,
				newInnerRadius,
				startAngle,
				normalizedAngle
			)
		}

		const path = generateDonutSlice(
			centerX,
			centerY,
			newRadius,
			newInnerRadius,
			startAngle,
			normalizedValueAngle,
		);
		
		return {shadowPath, path}
	})

	const labelElement = {
		x: centerX - radius - padding / 4,
		y: 0,
		width: radius,
		height: ((ctx.innerRadius ?? radius / 2) + padding / 8) * serieData.length
	}

	if(isDefined(centerValue)) {
		const centerPoint = {x: centerX, y: centerY}

		return {paths, labelElement, centerPoint}
	}
	return { paths, labelElement };
}

// Funzioen che genera i path per una serie di un grafico a ciambella
export const generateDonutPaths = (
	serie: Serie,
	ctx: ChartState & {
		padding: number;
		innerRadius?: number;
		centerElement?: {
			value?: string;
			valueColor?: string;
			valueSize?: number;
			uom?: string;
			uomColor?: string;
			uomSize?: number;
			uomDx?: number;
			label?: string;
			labelColor?: string;
			labelSize?: number;
			labelDy?: number;
		};
	},
) => {
	const MIN_SLICE_VALUE = 31;
	const serieData = serie.data as PieSerieEl[];

	const dataPoints = new Map();

	const donutTotalValue = serieData.reduce(
		(acc, dataEl) => acc + dataEl.value,
		0,
	);

	const { width, height, padding, centerElement } = ctx;

	const { value: centerValue } = centerElement ?? {};

	const centerX = (width as number) / 2;
	const centerY = (height as number) / 2 - padding;
	const radius = ((height as number) - 2 * padding) / 2;
	const innerRadius = radius - (ctx.innerRadius ?? radius / 2);

	const startAngles = serieData.map(
		(serieEl) => (Number(serieEl.value) * 360) / Number(donutTotalValue),
	);

	const paths = serieData.map((serieEl, serieElIndex) => {
		const startAngle =
			serieElIndex > 0
				? startAngles.slice(0, serieElIndex).reduce((acc, el) => acc + el, 0)
				: 0;

		const valueAngle =
			(Number(serieEl.value) * 360) / Number(donutTotalValue) + startAngle;

		const normalizedValueAngle = valueAngle >= 360 ? 359.9 : valueAngle;

		const path = generateDonutSlice(
			centerX,
			centerY,
			radius,
			innerRadius,
			startAngle,
			normalizedValueAngle,
		);

		const sliceValue = valueAngle - startAngle;
		const bisectorAngle = sliceValue / 2 + startAngle;
		const labelRadius = radius / 2;
		const bisectorPoint = polarToCartesian(
			centerX,
			centerY,
			labelRadius,
			bisectorAngle,
		);

		const labelPoint = { x: bisectorPoint.x, y: bisectorPoint.y };

		if (sliceValue >= MIN_SLICE_VALUE) {
			dataPoints.set(serieEl.name, labelPoint);
		}

		return path;
	});

	if (isDefined(centerValue)) {
		const centerPoint = { x: centerX, y: centerY };
		return { paths, dataPoints, centerPoint };
	}

	return { paths, dataPoints };
};

// Funzione che genera i path per una serie di un grafico a torta
export const generatePiePaths = (
	serie: Serie,
	ctx: ChartState & { padding: number },
) => {
	const MIN_SLICE_VALUE = 31;
	const serieData = serie.data as PieSerieEl[];

	const dataPoints = new Map();

	const pieTotalValue = serieData.reduce(
		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		(acc, dataEl) => (acc += dataEl.value),
		0,
	);

	const { width: _width, height: _height, padding } = ctx;

	const width = _width as number;
	const height = _height as number;

	const centerX = width / 2;
	const centerY = height / 2 - 1.5 * padding;
	const radius = (height - 3 * padding) / 2;

	const startAngles = serieData.map(
		(serieEl) => (Number(serieEl.value) * 360) / Number(pieTotalValue),
	);

	const paths = serieData.map((serieEl, serieElIndex) => {
		const startAngle =
			serieElIndex > 0
				? startAngles
						.slice(0, serieElIndex)
						// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
						.reduce((acc, el) => (acc += el), 0)
				: 0;

		const valueAngle =
			(Number(serieEl.value) * 360) / Number(pieTotalValue) + startAngle;

		const normalizedValueAngle = valueAngle >= 360 ? 359.9 : valueAngle;

		const path = generatePieSlice(
			centerX,
			centerY,
			radius,
			startAngle,
			normalizedValueAngle,
		);

		const sliceValue = valueAngle - startAngle;
		const bisectorAngle = sliceValue / 2 + startAngle;
		const labelRadius = radius / 2;
		const bisectorPoint = polarToCartesian(
			centerX,
			centerY,
			labelRadius,
			bisectorAngle,
		);

		const labelPoint = { x: bisectorPoint.x, y: bisectorPoint.y };

		if (sliceValue >= MIN_SLICE_VALUE) {
			dataPoints.set(serieEl.name, labelPoint);
		}

		return path;
	});

	return { paths, dataPoints };
};

// Funzione che calcola i valori di partenza di una colonna stacked
const getStackedBarStartValue = (
	series: Serie[],
	serieIndex: number,
	elementIndex: number,
) => {
	if (serieIndex <= 0) return 0;

	let startValue = 0;

	for (let i = serieIndex - 1; i > -1; i--) {
		const currentSerie = series[i].data as TimeSerieEl[];
		startValue += currentSerie?.[elementIndex]?.value;
	}

	return startValue;
};

// Funzione che genera i dataPaths per le barre stacked
export const generateStackedDataPaths = (
	serie: Serie,
	ctx: ChartState & {
		padding: number;
		barWidth?: number;
		radius?: number;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
	},
) => {
	if (!ctx.elements) return null;
	const dataPoints = new Map();
	dataPoints.set(serie.name, []);

	const topLabelsPoints = new Map();
	topLabelsPoints.set(serie.name, []);

	const timeSerieData = serie.data as TimeSerieEl[];

	const barSeries = ctx.elements.filter((el) => el.type === "bar-stacked");

	const stackedMaxValue = calculateStackedSeriesMax(barSeries);

	const serieIndex = barSeries.findIndex((el) => el.name === serie.name);

	if (serieIndex < 0) return null;

	const {
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
	} = ctx;

	const chartXEnd = _chartXEnd as number;
	const chartXStart = _chartXStart as number;
	const chartYEnd = _chartYEnd as number;

	const xAxisInterval =
		(chartXEnd - chartXStart) / (timeSerieData?.length || 1);

	const flatMaxValue = ctx.flatMax
		? calculateFlatValue(stackedMaxValue)
		: stackedMaxValue;

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const value = getValuePosition(
			flatMaxValue,
			serieEl.value,
			chartYEnd - padding,
		);

		const prevValue = getStackedBarStartValue(
			barSeries,
			serieIndex,
			serieElIndex,
		);
		const prevPosition =
			prevValue > 0
				? getValuePosition(flatMaxValue, prevValue, chartYEnd - padding)
				: 0;

		const serieY = chartYEnd - value - prevPosition;

		const barWidth = ctxBarWidth ?? padding;
		const serieElX = xAxisInterval * serieElIndex + (chartXStart + padding / 2);

		const point =
			value < 14
				? [-1, -1]
				: [serieElX + barWidth / 2, serieY + value / 2 + padding / 4];

		const allDataPoints = dataPoints.get(serie.name);

		dataPoints.set(serie.name, [...allDataPoints, point]);

		const topLabelsPoint = [
			serieElX + barWidth / 2,
			serieY + value + padding / 4,
		];

		const allTopLabelsDataPoints = topLabelsPoints.get(serie.name);

		topLabelsPoints.set(serie.name, [
			...allTopLabelsDataPoints,
			topLabelsPoint,
		]);

		return generateVerticalBarPath(
			serieElX,
			serieY,
			barWidth,
			chartYEnd - prevPosition,
			radius,
			topLeftRadius,
			topRightRadius,
			bottomRightRadius,
			bottomLeftRadius,
		);
	});

	return { paths, dataPoints, topLabelsPoints };
};

// Funzione che genera i dataPaths per grafici che ammettono valori negativi in base al tipo di serie da graficare
export const generateNegativeDataPaths = (
	serie: Serie,
	ctx: ChartState & {
		padding: number;
		barWidth?: number;
		radius?: number;
		trimZeros?: number;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
	},
	type: "line" | "bar",
) => {
	if (!ctx.elements) return null;

	// Preparo la struttura per i dataPoints da mostrare dentro le barre
	const dataPoints = new Map();
	dataPoints.set(serie.name, []);

	// Preparo la struttura per i topLabelPoints da mostrare sopra le barre
	const topLabelsPoints = new Map();
	topLabelsPoints.set(serie.name, []);

	// Converto gli zeri in null per ottenere delle spezzate in caso di ctx.trimZeros === true
	const timeSerieData = ctx.trimZeros
		? (serie.data as TimeSerieEl[]).map((el) => ({
				...el,
				value: el.value === 0 ? null : el.value,
			}))
		: (serie.data as TimeSerieEl[]);

	// raggruppo le serie per asse Y
	const axisSeries = getSeriesByAxisName(
		ctx.elements,
		serie.axisName ?? serie.name,
	);

	// Ottengo un unico array di punti da graficare
	const flatAxisSeriesData = axisSeries.flat() as TimeSerieEl[];

	// Prendo le soglie associate ad una serie
	const seriesThresholds = getSerieAssociatedThresholds(
		ctx.elements,
		serie.name,
	);

	// Calcolo il valore massimo tra serie e soglie associate ad essa
	const serieMaxValue = getTimeSerieMaxValue([
		...(flatAxisSeriesData ?? []),
		...(seriesThresholds ?? []),
	]);

	const serieIndex = ctx.elements.findIndex((el) => el.name === serie.name);

	if (serieIndex < 0) return null;

	const {
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
		globalConfig,
	} = ctx;

	const chartXStart = _chartXStart as number;
	const chartXEnd = _chartXEnd as number;
	const chartYEnd = _chartYEnd as number;

	// Calcolo l'intervallo tra un punto/barra e l'altro sull'asse X
	const xAxisInterval = (chartXEnd - chartXStart) / timeSerieData?.length || 1;

	// Calcolo il valore massimo della serie arrotondato al primo numero dell'ordine di grandezza utile. Ex. (20, 200, 2000)
	const flatMaxValue = ctx.flatMax
		? calculateFlatValue(serieMaxValue)
		: serieMaxValue;

	// Calcolo lo 0 per il grafico a con valori negativi
	const zeroY = ctx.chartYMiddle ?? 0;

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const absValue = Math.abs(serieEl.value ?? 0);
		const isNegative =
			(serieEl.value ?? 0) < 0 ||
			(serieEl.value === 0 &&
				timeSerieData.some((serieEl) => (serieEl.value ?? 0) < 0));
		const value = getValuePosition(
			flatMaxValue,
			absValue,
			// chartYEnd - 4.5 * padding - (ctx?.globalConfig?.legendHeight as number ?? 0),
			chartYEnd - 4.7 * padding,
		);

		const serieY = isDefined(serieEl.value)
			? isNegative
				? zeroY + value
				: zeroY - value
			: null;

		if (type === "bar") {
			const barWidth = ctxBarWidth ?? padding;
			const serieElX =
				xAxisInterval * serieElIndex + (chartXStart + padding / 2);

			const point =
				value < 16
					? [-1, -1]
					: [serieElX + barWidth / 2, chartYEnd - value / 2 + padding / 4];

			const allDataPoints = dataPoints.get(serie.name);

			dataPoints.set(serie.name, [...allDataPoints, point]);

			const topLabelPoint = [
				serieElX + barWidth / 2,
				// chartYEnd - value - padding / 2,
				isNegative ? (serieY ?? 0) + padding / 2 : (serieY ?? 0) - padding / 2,
			];

			const allTopLabelsPoints = topLabelsPoints.get(serie.name);

			topLabelsPoints.set(serie.name, [...allTopLabelsPoints, topLabelPoint]);

			return generateVerticalBarPath(
				serieElX,
				serieY ?? 0,
				barWidth,
				zeroY,
				radius,
				topLeftRadius,
				topRightRadius,
				bottomRightRadius,
				bottomLeftRadius,
				isNegative,
			);
		}
		const xSpacing = globalConfig?.barWidth
			? Number(globalConfig?.barWidth) / 2
			: padding;

		const serieElX =
			xAxisInterval * serieElIndex + xSpacing + (chartXStart + padding / 2);

		const formattedX =
			isDefined(serieElX) && !Number.isNaN(serieElX) ? serieElX : null;
		const formattedY =
			isDefined(serieY) && !Number.isNaN(serieY) ? serieY : null;

		const point =
			isDefined(formattedX) && isDefined(formattedY)
				? [serieElX, formattedY]
				: [0, -10];

		const allDataPoints = dataPoints.get(serie.name);

		dataPoints.set(serie.name, [...allDataPoints, point]);

		if (!isDefined(formattedY)) {
			return "";
		}
		return serieElIndex === getFirstValorizedElementIndex(timeSerieData)
			? `M ${serieElX} ${formattedY}`
			: generateLine(serieElX, formattedY);
	});

	const normalizedPaths = trimZerosAndNullLinePath(paths);

	return { paths: normalizedPaths, dataPoints, topLabelsPoints };
};

// funzione che genera i dataPaths in base al tipo di serie da graficare
export const generateDataPaths = (
	serie: Serie,
	ctx: ChartState & {
		padding: number;
		barWidth?: number;
		radius?: number;
		trimZeros?: boolean;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
	},
	type: "line" | "bar",
) => {
	if (!ctx.elements) return null;

	// Preparo la struttura per i dataPoints da mostrare dentro le barre
	const dataPoints = new Map();
	dataPoints.set(serie.name, []);

	// Preparo la struttura per i topLabelPoints da mostrare sopra le barre
	const topLabelsPoints = new Map();
	topLabelsPoints.set(serie.name, []);

	// Converto gli zeri in null per ottenere delle spezzate in caso di ctx.trimZeros === true
	const timeSerieData = ctx.trimZeros
		? (serie.data as TimeSerieEl[]).map((el) => ({
				...el,
				value: el.value === 0 ? null : el.value,
			}))
		: (serie.data as TimeSerieEl[]);

	// raggruppo le serie per asse Y
	const axisSeries = getSeriesByAxisName(
		ctx.elements,
		serie.axisName ?? serie.name,
	);

	// Ottengo un unico array di punti da graficare
	const flatAxisSeriesData = axisSeries.flat() as TimeSerieEl[];

	// Prendo le soglie associate ad una serie
	const seriesThresholds = getSerieAssociatedThresholds(
		ctx.elements,
		serie.name,
	);

	// Calcolo il valore massimo tra serie e soglie associate ad essa
	const serieMaxValue = getTimeSerieMaxValue([
		...(flatAxisSeriesData ?? []),
		...(seriesThresholds ?? []),
	]);

	const serieIndex = ctx.elements.findIndex((el) => el.name === serie.name);

	if (serieIndex < 0) return null;

	const {
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
		globalConfig,
	} = ctx;

	const chartXStart = _chartXStart as number;
	const chartXEnd = _chartXEnd as number;
	const chartYEnd = _chartYEnd as number;

	// Calcolo l'intervallo tra un punto/barra e l'altro sull'asse X
	const xAxisInterval = (chartXEnd - chartXStart) / timeSerieData?.length || 1;

	// Calcolo il valore massimo della serie arrotondato al primo numero dell'ordine di grandezza utile. Ex. (20, 200, 2000)
	const flatMaxValue = ctx.flatMax
		? calculateFlatValue(serieMaxValue)
		: serieMaxValue;

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const value = getValuePosition(
			flatMaxValue,
			serieEl.value ?? 0,
			chartYEnd - padding,
		);

		const serieY = isDefined(serieEl.value) ? chartYEnd - value : null;

		if (type === "bar") {
			const barWidth = ctxBarWidth ?? padding;
			const serieElX =
				xAxisInterval * serieElIndex + (chartXStart + padding / 2);

			const point =
				value < 16
					? [-1, -1]
					: [serieElX + barWidth / 2, chartYEnd - value / 2 + padding / 4];

			const allDataPoints = dataPoints.get(serie.name);

			dataPoints.set(serie.name, [...allDataPoints, point]);

			const topLabelPoint = [
				serieElX + barWidth / 2,
				chartYEnd - value - padding / 2,
			];

			const allTopLabelsPoints = topLabelsPoints.get(serie.name);

			topLabelsPoints.set(serie.name, [...allTopLabelsPoints, topLabelPoint]);

			return generateVerticalBarPath(
				serieElX,
				serieY ?? 0,
				barWidth,
				chartYEnd,
				radius,
				topLeftRadius,
				topRightRadius,
				bottomRightRadius,
				bottomLeftRadius,
			);
		}
		const xSpacing = globalConfig?.barWidth
			? Number(globalConfig?.barWidth) / 2
			: padding;

		const serieElX =
			xAxisInterval * serieElIndex + xSpacing + (chartXStart + padding / 2);

		const formattedX =
			isDefined(serieElX) && !Number.isNaN(serieElX) ? serieElX : null;
		const formattedY =
			isDefined(serieY) && !Number.isNaN(serieY) ? serieY : null;

		const point =
			isDefined(formattedX) && isDefined(formattedY)
				? [serieElX, formattedY]
				: [0, -10];

		const allDataPoints = dataPoints.get(serie.name);

		dataPoints.set(serie.name, [...allDataPoints, point]);

		if (!isDefined(formattedY)) {
			return "";
		}
		return serieElIndex === getFirstValorizedElementIndex(timeSerieData)
			? `M ${serieElX} ${formattedY}`
			: generateLine(serieElX, formattedY);
	});

	const normalizedPaths = trimZerosAndNullLinePath(paths);

	return { paths: normalizedPaths, dataPoints, topLabelsPoints };
};

// Funzione che genera i dataPaths per le barre raggruppate
export const generateGroupDataPaths = (
	serie: Serie,
	ctx: ChartState & {
		padding: number;
		barWidth?: number;
		radius?: number;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
	},
) => {
	if (!ctx.elements) return null;
	const dataPoints = new Map();
	dataPoints.set(serie.name, []);

	const topLabelsPoints = new Map();
	topLabelsPoints.set(serie.name, []);

	const timeSerieData = serie.data as TimeSerieEl[];

	const barSeries = ctx.elements.filter((el) => el.type === "group-bar");

	const flatSeries = [...barSeries.map((serie) => serie.data)].flat();

	const serieMaxValue = getTimeSerieMaxValue(flatSeries as TimeSerieEl[]);

	const serieIndex = barSeries.findIndex((el) => el.name === serie.name);

	if (serieIndex < 0) return null;

	const {
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
	} = ctx;

	const chartXStart = _chartXStart as number;
	const chartXEnd = _chartXEnd as number;
	const chartYEnd = _chartYEnd as number;

	const xAxisGroupInterval =
		(chartXEnd - chartXStart) / timeSerieData?.length || 1;

	const xAxisInterval = xAxisGroupInterval / barSeries?.length;

	const flatMaxValue = ctx.flatMax
		? calculateFlatValue(serieMaxValue)
		: serieMaxValue;

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const value = getValuePosition(
			flatMaxValue,
			serieEl.value ?? 0,
			chartYEnd - padding,
		);

		const serieY = isDefined(serieEl.value) ? chartYEnd - value : null;

		const barWidth = ctxBarWidth ?? padding;
		const serieElX =
			serieElIndex * xAxisGroupInterval +
			(xAxisInterval - padding / 6) * serieIndex +
			(chartXStart + padding / 4);

		const point =
			value < 16
				? [-1, -1]
				: [serieElX + barWidth / 2, chartYEnd - value / 2 + padding / 4];

		const allDataPoints = dataPoints.get(serie.name);

		dataPoints.set(serie.name, [...allDataPoints, point]);

		const topLabelPoint = [
			serieElX + barWidth / 2,
			chartYEnd - value - padding / 2,
		];

		const allTopLabelsPoints = topLabelsPoints.get(serie.name);

		topLabelsPoints.set(serie.name, [...allTopLabelsPoints, topLabelPoint]);

		return generateVerticalBarPath(
			serieElX,
			serieY ?? 0,
			barWidth,
			chartYEnd,
			radius,
			topLeftRadius,
			topRightRadius,
			bottomRightRadius,
			bottomLeftRadius,
		);
	});

	return { paths, dataPoints, topLabelsPoints };
};

// Funzione che genera i dataPaths per le barre raggruppate stacked
export const generateStackedGroupDataPaths = (
	serie: Serie,
	ctx: ChartState & {
		padding: number;
		barWidth?: number;
		radius?: number;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
	},
) => {
	if (!ctx.elements) return null;
	const dataPoints = new Map();
	dataPoints.set(serie.name, []);

	const topLabelsPoints = new Map();
	topLabelsPoints.set(serie.name, []);

	const timeSerieData = serie.data as TimeSerieEl[];

	// Prendo le altre serie che vanno impilate con quella corrente
	const stackedSeries = ctx.elements.filter(
		(el) => el.stackedName === serie.stackedName,
	);

	// Listo tutte le serie non stacked
	const nonStackedSeries = ctx.elements.filter(
		(el) => el.type === "group-bar" && !el.stackedName,
	);

	// Listo tutte le serie stacked
	const allStackedSeries = ctx.elements.filter(
		(el) => el.type === "group-bar" && el.stackedName,
	);

	// Prendo tutti gli stackedName delle serie
	const allStackedNames = allStackedSeries.map((el) => el.stackedName);

	// Filtro tutti i nomi per avere una sola occorrenza
	const uniqueStackedNames = Array.from(new Set(allStackedNames));

	const stackedSeriesMaxArray = uniqueStackedNames.map((name) => {
		const involvedSeries = allStackedSeries.filter(
			(serie) => serie.stackedName === name,
		);

		const maxValue = calculateStackedSeriesMax(involvedSeries);
		return maxValue;
	});

	const nonStackedSeriesMaxArray = nonStackedSeries.map((serie) =>
		getTimeSerieMaxValue(serie.data as TimeSerieEl[]),
	);

	// Numero di barre del gruppo
	const groupBarNumber = nonStackedSeries.length + uniqueStackedNames.length;

	const stackedMaxValue = Math.max(
		...stackedSeriesMaxArray,
		...nonStackedSeriesMaxArray,
	);

	const serieStackedIndex = stackedSeries.findIndex(
		(el) => el.name === serie.name,
	);

	const serieGroupIndex = ctx.elements
		.reduce((acc, el) => {
			if (
				el.stackedName &&
				uniqueStackedNames.includes(el.stackedName) &&
				!Object.keys(acc).includes(el.stackedName)
			) {
				acc.push(el.stackedName);
			} else {
				acc.push(el.name);
			}
			return acc;
		}, [] as string[])
		.findIndex((el) => el === serie.stackedName || el === serie.name);

	if (serieGroupIndex < 0) return null;

	const {
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
	} = ctx;

	const chartXStart = _chartXStart as number;
	const chartXEnd = _chartXEnd as number;
	const chartYEnd = _chartYEnd as number;

	const xAxisGroupInterval =
		(chartXEnd - chartXStart) / timeSerieData?.length || 1;

	const xAxisInterval =
		groupBarNumber > 0 ? xAxisGroupInterval / groupBarNumber : 0;

	const flatMaxValue = ctx.flatMax
		? calculateFlatValue(stackedMaxValue)
		: stackedMaxValue;

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const value = getValuePosition(
			flatMaxValue,
			serieEl.value,
			chartYEnd - padding,
		);

		const prevValue = getStackedBarStartValue(
			stackedSeries,
			serieStackedIndex,
			serieElIndex,
		);
		const prevPosition =
			prevValue > 0
				? getValuePosition(flatMaxValue, prevValue, chartYEnd - padding)
				: 0;

		const serieY = chartYEnd - value - prevPosition;

		const barWidth = ctxBarWidth ?? padding;

		const serieElX =
			serieElIndex * xAxisGroupInterval +
			(xAxisInterval - barWidth + padding / 2 / groupBarNumber) *
				serieGroupIndex +
			(chartXStart + padding / 2);

		const point =
			value < 14
				? [-1, -1]
				: [serieElX + barWidth / 2, serieY + value / 2 + padding / 4];

		const allDataPoints = dataPoints.get(serie.name);

		dataPoints.set(serie.name, [...allDataPoints, point]);

		const topLabelsPoint = [
			serieElX + barWidth / 2,
			serieY + value + padding / 4,
		];

		const allTopLabelsDataPoints = topLabelsPoints.get(serie.name);

		topLabelsPoints.set(serie.name, [
			...allTopLabelsDataPoints,
			topLabelsPoint,
		]);

		return generateVerticalBarPath(
			serieElX,
			serieY,
			barWidth,
			chartYEnd - prevPosition,
			radius,
			topLeftRadius,
			topRightRadius,
			bottomRightRadius,
			bottomLeftRadius,
		);
	});

	return { paths, dataPoints, topLabelsPoints };
};

// Funzione che genera il path SVG per una barra orizzontale
export const generateHorizontalBarPath = (
	y: number,
	x: number,
	barHeight: number,
	startX: number,
	radius?: number,
	topLeftRadius?: number,
	topRightRadius?: number,
	bottomRightRadius?: number,
	bottomLeftRadius?: number,
) => {
	if (
		(radius ||
			topLeftRadius ||
			bottomLeftRadius ||
			topRightRadius ||
			bottomRightRadius) &&
		x !== startX
	) {
		const normalizedRadius = normalizeBarRadius(radius, x - startX);
		const normalizedTopLeftRadius = normalizeBarRadius(
			topLeftRadius,
			x - startX,
		);
		const normalizedBottomLeftRadius = normalizeBarRadius(
			bottomLeftRadius,
			x - startX,
		);
		const normalizedTopRightRadius = normalizeBarRadius(
			topRightRadius,
			x - startX,
		);
		const normalizedBottomRightRadius = normalizeBarRadius(
			bottomRightRadius,
			x - startX,
		);

		const leftX = startX;
		const rightX = x;

		const topY = y;
		const bottomY = y + barHeight;

		const topLeftCorner =
			normalizedRadius || normalizedTopLeftRadius
				? `Q${leftX},${topY} ${leftX},${topY + (normalizedRadius || normalizedTopLeftRadius || 0)}`
				: "";
		const topRightCorner =
			normalizedRadius || normalizedTopRightRadius
				? `Q${rightX},${topY} ${rightX - (normalizedRadius || normalizedTopRightRadius || 0)},${topY}`
				: "";
		const bottomRightCorner =
			normalizedRadius || normalizedBottomRightRadius
				? `Q${rightX},${bottomY} ${rightX},${bottomY - (normalizedRadius || normalizedBottomRightRadius || 0)}`
				: "";
		const bottomLeftCorner =
			normalizedRadius || normalizedBottomLeftRadius
				? `Q${leftX},${bottomY} ${leftX + (normalizedRadius || normalizedBottomLeftRadius || 0)},${bottomY}`
				: "";

		const startPosition = `M ${leftX + (normalizedRadius || normalizedTopLeftRadius || 0)} ${topY}`;
		const topLeftPoint = `H ${rightX - (normalizedRadius || normalizedTopRightRadius || 0)}`;
		const topRightPoint = `V ${bottomY - (normalizedRadius || normalizedTopRightRadius || 0)}`;
		const bottomRightPoint = `H ${leftX + (normalizedRadius || normalizedBottomLeftRadius || 0)}`;
		const bottomLeftPoint = `V ${topY + (normalizedRadius || normalizedTopLeftRadius || 0)}`;

		return `${startPosition} ${topLeftPoint} ${topRightCorner} ${topRightPoint} ${bottomRightCorner} ${bottomRightPoint} ${bottomLeftCorner} ${bottomLeftPoint} ${topLeftCorner}`;
	}
	return `M ${startX} ${y} H ${x} V ${y + barHeight} H ${startX} Z`;
};

// Funzione che genera i dataPaths per barre orizzontali
export const generateHorizontalDataPaths = (
	serie: Serie,
	ctx: ChartState & {
		padding: number;
		barWidth?: number;
		radius?: number;
		trimZeros?: boolean;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
		barOffset?: number;
	},
	type: "line" | "bar",
) => {
	if (!ctx.elements) return null;

	const dataPoints = new Map();
	dataPoints.set(serie.name, []);

	const topLabelsPoints = new Map();
	topLabelsPoints.set(serie.name, []);

	const timeSerieData = ctx.trimZeros
		? (serie.data as TimeSerieEl[]).map((el) => ({
				...el,
				value: el.value === 0 ? null : el.value,
			}))
		: (serie.data as TimeSerieEl[]);

	const axisSeries = getSeriesByAxisName(
		ctx.elements,
		serie.axisName ?? serie.name,
	);

	const flatAxisSeriesData = axisSeries.flat() as TimeSerieEl[];
	const seriesThresholds = getSerieAssociatedThresholds(
		ctx.elements,
		serie.name,
	);

	const serieMaxValue = getTimeSerieMaxValue([
		...(flatAxisSeriesData ?? []),
		...(seriesThresholds ?? []),
	]);

	const serieIndex = ctx.elements.findIndex((el) => el.name === serie.name);
	if (serieIndex < 0) return null;

	const {
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
		barOffset,
	} = ctx;

	// barOffset ora è parametrico
	const effectiveBarOffset = typeof barOffset === "number" ? barOffset : 40;
	const chartXStart = (_chartXStart as number) + effectiveBarOffset;
	const chartXEnd = (_chartXEnd as number) - 8;
	const chartYEnd = _chartYEnd as number;

	const yAxisInterval = (chartYEnd - padding) / timeSerieData?.length || 1;

	const flatMaxValue = ctx.flatMax
		? calculateFlatValue(serieMaxValue)
		: serieMaxValue;

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const value = getValuePosition(
			flatMaxValue,
			serieEl.value ?? 0,
			chartXEnd - chartXStart - padding,
		);
		const serieX = isDefined(serieEl.value) ? chartXStart + value : null;
		const barHeight = ctxBarWidth ?? padding;
		const serieElY = yAxisInterval * serieElIndex + padding / 2;

		if (type === "bar") {
			const point =
				value < 16
					? [-1, -1]
					: [chartXStart + value / 2, serieElY + barHeight / 2];

			const allDataPoints = dataPoints.get(serie.name);
			dataPoints.set(serie.name, [...allDataPoints, point]);

			const topLabelPoint = [
				chartXStart + value + padding / 2,
				serieElY + barHeight / 2,
			];
			const allTopLabelsPoints = topLabelsPoints.get(serie.name);
			topLabelsPoints.set(serie.name, [...allTopLabelsPoints, topLabelPoint]);

			return generateHorizontalBarPath(
				serieElY,
				chartXStart + value,
				barHeight,
				chartXStart,
				radius,
				topLeftRadius,
				topRightRadius,
				bottomRightRadius,
				bottomLeftRadius,
			);
		}

		// Caso LINEA ORIZZONTALE
		const formattedX =
			isDefined(serieX) && !Number.isNaN(serieX) ? serieX : null;
		const formattedY =
			isDefined(serieElY) && !Number.isNaN(serieElY) ? serieElY : null;

		const point =
			isDefined(formattedX) && isDefined(formattedY)
				? [formattedX, serieElY]
				: [0, -10];

		const allDataPoints = dataPoints.get(serie.name);
		dataPoints.set(serie.name, [...allDataPoints, point]);

		if (!isDefined(formattedX)) {
			return "";
		}
		return serieElIndex === getFirstValorizedElementIndex(timeSerieData)
			? `M ${formattedX} ${serieElY}`
			: generateLine(formattedX, serieElY);
	});

	const normalizedPaths = trimZerosAndNullLinePath(paths);

	return { paths: normalizedPaths, dataPoints, topLabelsPoints };
};
