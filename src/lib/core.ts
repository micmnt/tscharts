import { ChartState, PieSerieEl, Serie, TimeSerieEl } from "../types";
import {
  calculateFlatValue,
  isDefined,
  normalizeBarRadius,
  trimZerosLinePath,
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

    const topLeftCorner =
      normalizedRadius || normalizedTopLeftRadius
        ? `Q${x},${y} ${x + (normalizedRadius || normalizedTopLeftRadius || 0)},${y}`
        : "";
    const topRightCorner =
      normalizedRadius || normalizedTopRightRadius
        ? `Q${x + barWidth},${y} ${x + barWidth},${y + (normalizedRadius || normalizedTopRightRadius || 0)}`
        : "";
    const bottomRightCorner =
      normalizedRadius || normalizedBottomRightRadius
        ? `Q${x + barWidth},${startY} ${x + barWidth - (normalizedRadius || normalizedBottomRightRadius || 0)},${startY}`
        : "";
    const bottomLeftCorner =
      normalizedRadius || normalizedBottomLeftRadius
        ? `Q${x},${startY} ${x},${startY - (normalizedRadius || normalizedBottomLeftRadius || 0)}`
        : "";

    const startPosition = `M ${x} ${startY + (normalizedRadius || normalizedTopLeftRadius || 0)}`;
    const topLeftPoint = `V ${y + (normalizedRadius || normalizedTopLeftRadius || 0)}`;
    const topRightPoint = `H ${x + barWidth - (normalizedRadius || normalizedTopRightRadius || 0)}`;
    const bottomRightPoint = `V ${startY - (normalizedRadius || normalizedBottomRightRadius || 0)}`;
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
    startAngle,
    endAngle,
  );

  return `${startRadius} ${arc} ${endRadius}`;
};

// Funzione che genera il valore d di un path svg per una barra ad arco
export const generateArcBarPath = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  const startPoint = polarToCartesian(centerX, centerY, radius, startAngle);
  const endPoint = polarToCartesian(centerX, centerY, radius, endAngle);

  const isLargeArc = endAngle - startAngle <= 180 ? 0 : 1;

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
      ...serie.filter((el) => el !== null).map((serieEl) => serieEl.value),
    );
  }

  return 0;
};

// Funzione che trasforma un punto globale dello schermo in un punto nel grafico svg
export const convertToSVGPoint = (
  svgContainer: SVGSVGElement | null = null,
  x: number = 0,
  y: number = 0,
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
      ? svgPoint.x + 10
      : svgPoint.x - tooltipElement.clientWidth;

  const tooltipY =
    svgPoint.y < (chartYEnd - 10) / 2
      ? svgPoint.y + 10
      : svgPoint.y - 20 - tooltipElement.clientHeight / 2;

  return { x: tooltipX < 0 ? 0 : tooltipX, y: tooltipY };
};

//Funzione che dato un array di serie, calcola il numero di assi che devono essere a sinistra e a destra del grafico
export const getAxisCount = (yAxisCount: number = 0) => {
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
  const chartXEnd = svgWidth - xPaddingMultiplier * padding * rightAxisCount;
  const chartYEnd = svgHeight - yPaddingMultiplier * padding - legendHeight;

  return { chartXStart, chartXEnd, chartYEnd };
};

// Funzione che genera l'asse x
export const generateXAxis = (ctx: ChartState) => {
  const { chartXStart, chartXEnd, chartYEnd } = ctx;

  return {
    path: `M ${chartXStart} ${chartYEnd} H ${chartXEnd}`,
  };
};

// Funzione che calcola il massimo sommando i massimi delle serie da mostrare come colonne stacked
const calculateStackedSeriesMax = (series: Serie[]) =>
  series.reduce((acc, stackedSerie) => {
    const serieMaxValue = getTimeSerieMaxValue(
      (stackedSerie.data as TimeSerieEl[]) ?? [],
    );
    acc += serieMaxValue;

    return acc;
  }, 0);

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

  const serieMaxValue = isStacked
    ? calculateStackedSeriesMax(
        ctx.elements.filter((el) => el.type === "bar-stacked"),
      )
    : getTimeSerieMaxValue([
        ...flatAxisSeriesData,
        ...(seriesThresholds ?? []),
      ]);

  const serieIndex = ctx.elements.findIndex((el) => el.name === serie.name);

  if (serieIndex < 0) return null;

  const { height, chartXStart, chartXEnd, chartYEnd, padding, yInterval } = ctx;

  const yAxisInterval = (chartYEnd! - padding) / yInterval;

  const isOppositeAxis = serieIndex % 2 !== 0;

  /* Creazione degli assi */
  const axisX = isOppositeAxis ? chartXEnd! : chartXStart! + padding / 2;
  const axisPath = generateVerticalLine(axisX, chartYEnd!, 0);

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
    height! - 3 * padding,
  );

  const lastValue = serie.format
    ? serie.format(calculateFlatValue(serieMaxValue))
    : calculateFlatValue(serieMaxValue);

  const yAxisLabels = [...Array(yInterval)]
    .map((_, index) => {
      const flatInterval = calculateFlatValue(serieMaxValue) / yInterval;
      const axisValue = flatInterval * index;

      const serieValue = serie.format ? serie.format(axisValue) : axisValue;

      return {
        value: serieValue,
        x: axisLabelsX,
        y: chartYEnd! - yAxisInterval * index,
      };
    })
    .concat({
      value: lastValue,
      x: axisLabelsX,
      y: chartYEnd! - yAxisInterval * yInterval,
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

// Funzione che genera i path per una serie di un grafico a torta
export const generatePiePaths = (
  serie: Serie,
  ctx: ChartState & { padding: number },
) => {
  const MIN_SLICE_VALUE = 18;
  const serieData = serie.data as PieSerieEl[];

  const dataPoints = new Map();

  const pieTotalValue = serieData.reduce(
    (acc, dataEl) => (acc += dataEl.value),
    0,
  );

  const { width, height, padding } = ctx;

  const centerX = width! / 2;
  const centerY = height! / 2 - 1.5 * padding;
  const radius = (height! - 3 * padding) / 2;

  const startAngles = serieData.map(
    (serieEl) => (Number(serieEl.value) * 360) / Number(pieTotalValue),
  );

  const paths = serieData.map((serieEl, serieElIndex) => {
    const startAngle =
      serieElIndex > 0
        ? startAngles.slice(0, serieElIndex).reduce((acc, el) => (acc += el), 0)
        : 0;

    const valueAngle =
      (Number(serieEl.value) * 360) / Number(pieTotalValue) + startAngle;
    const path = generatePieSlice(
      centerX,
      centerY,
      radius,
      startAngle,
      valueAngle,
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
    chartXStart,
    chartXEnd,
    chartYEnd,
    padding,
    barWidth: ctxBarWidth,
    radius,
    topLeftRadius,
    topRightRadius,
    bottomRightRadius,
    bottomLeftRadius,
  } = ctx;

  const xAxisInterval =
    (chartXEnd! - chartXStart!) / (timeSerieData?.length || 1);

  const flatMaxValue = calculateFlatValue(stackedMaxValue);

  const paths = timeSerieData?.map((serieEl, serieElIndex) => {
    const value = getValuePosition(
      flatMaxValue,
      serieEl.value,
      chartYEnd! - padding,
    );

    const prevValue = getStackedBarStartValue(
      barSeries,
      serieIndex,
      serieElIndex,
    );
    const prevPosition =
      prevValue > 0
        ? getValuePosition(flatMaxValue, prevValue, chartYEnd! - padding)
        : 0;

    const serieY = chartYEnd! - value - prevPosition;

    const barWidth = ctxBarWidth ?? padding;
    const serieElX =
      xAxisInterval * serieElIndex + (chartXStart! + padding / 2);

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
      chartYEnd! - prevPosition,
      radius,
      topLeftRadius,
      topRightRadius,
      bottomRightRadius,
      bottomLeftRadius,
    );
  });

  return { paths, dataPoints, topLabelsPoints };
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
    chartXStart,
    chartXEnd,
    chartYEnd,
    padding,
    barWidth: ctxBarWidth,
    trimZeros,
    radius,
    topLeftRadius,
    topRightRadius,
    bottomRightRadius,
    bottomLeftRadius,
    globalConfig,
  } = ctx;

  const xAxisInterval =
    (chartXEnd! - chartXStart!) / timeSerieData?.length || 1;

  const flatMaxValue = calculateFlatValue(serieMaxValue);

  const paths = timeSerieData?.map((serieEl, serieElIndex) => {
    const value = getValuePosition(
      flatMaxValue,
      serieEl.value ?? 0,
      chartYEnd! - padding,
    );

    const serieY = isDefined(serieEl.value) ? chartYEnd! - value : null;

    if (type === "bar") {
      const barWidth = ctxBarWidth ?? padding;
      const serieElX =
        xAxisInterval * serieElIndex + (chartXStart! + padding / 2);

      const point =
        value < 14
          ? [-1, -1]
          : [serieElX + barWidth / 2, chartYEnd! - value / 2 + padding / 2];

      const allDataPoints = dataPoints.get(serie.name);

      dataPoints.set(serie.name, [...allDataPoints, point]);

      const topLabelPoint = [
        serieElX + barWidth / 2,
        chartYEnd! - value - padding / 2,
      ];

      const allTopLabelsPoints = topLabelsPoints.get(serie.name);

      topLabelsPoints.set(serie.name, [...allTopLabelsPoints, topLabelPoint]);

      return generateVerticalBarPath(
        serieElX,
        serieY ?? 0,
        barWidth,
        chartYEnd!,
        radius,
        topLeftRadius,
        topRightRadius,
        bottomRightRadius,
        bottomLeftRadius,
      );
    } else {
      const xSpacing = globalConfig?.barWidth
        ? Number(globalConfig?.barWidth) / 2
        : padding;

      const serieElX =
        xAxisInterval * serieElIndex + xSpacing + (chartXStart! + padding / 2);

      const formattedX =
        isDefined(serieElX) && !isNaN(serieElX) ? serieElX : null;
      const formattedY = isDefined(serieY) && !isNaN(serieY) ? serieY : null;

      const point =
        isDefined(formattedX) && isDefined(formattedY)
          ? [serieElX, formattedY]
          : [0, -10];

      const allDataPoints = dataPoints.get(serie.name);

      dataPoints.set(serie.name, [...allDataPoints, point]);

      if (!isDefined(formattedY)) {
        return "";
      }
      return serieElIndex === 0
        ? `M ${serieElX} ${formattedY}`
        : generateLine(serieElX, formattedY);
    }
  });

  const normalizedPaths = trimZeros ? trimZerosLinePath(paths) : paths;

  return { paths: normalizedPaths, dataPoints, topLabelsPoints };
};
