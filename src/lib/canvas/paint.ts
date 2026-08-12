export const setupHiDPI = (
	canvas: HTMLCanvasElement,
	cssWidth: number,
	cssHeight: number,
): number => {
	const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
	canvas.width = Math.max(1, Math.round(cssWidth * dpr));
	canvas.height = Math.max(1, Math.round(cssHeight * dpr));
	return dpr;
};

export const strokePath = (
	g: CanvasRenderingContext2D,
	d: string,
	color: string,
	width: number,
): void => {
	if (!d) return;
	const path = new Path2D(d);
	g.lineWidth = width;
	g.strokeStyle = color;
	g.lineJoin = "round";
	g.lineCap = "round";
	g.stroke(path);
};

export const fillPathSolid = (
	g: CanvasRenderingContext2D,
	d: string,
	color: string,
	opacity: number,
): void => {
	if (!d) return;
	g.save();
	g.globalAlpha = opacity;
	g.fillStyle = color;
	g.fill(new Path2D(d));
	g.restore();
};

export const fillPathGradient = (
	g: CanvasRenderingContext2D,
	d: string,
	color: string,
	topOpacity: number,
	yTop: number,
	yBottom: number,
): void => {
	if (!d) return;
	g.save();
	g.globalAlpha = topOpacity;
	const grad = g.createLinearGradient(0, yTop, 0, yBottom);
	grad.addColorStop(0, color);
	grad.addColorStop(1, "rgba(0,0,0,0)");
	g.fillStyle = grad;
	g.fill(new Path2D(d));
	g.restore();
};

export const paintTexts = (
	g: CanvasRenderingContext2D,
	items: {
		x: number;
		y: number;
		text: string;
		align?: CanvasTextAlign;
		rotate?: number;
	}[],
	color: string,
	fontSize: number,
	bold = true,
): void => {
	g.save();
	g.fillStyle = color;
	g.font = `${bold ? "bold " : ""}${fontSize}px sans-serif`;
	g.textBaseline = "alphabetic";
	for (const item of items) {
		if (!item.text) continue;
		g.textAlign = item.align ?? "center";
		if (item.rotate) {
			g.save();
			g.translate(item.x, item.y);
			g.rotate((item.rotate * Math.PI) / 180);
			g.fillText(item.text, 0, 0);
			g.restore();
		} else {
			g.fillText(item.text, item.x, item.y);
		}
	}
	g.restore();
};

export const paintDots = (
	g: CanvasRenderingContext2D,
	points: [number, number][],
	color: string,
	radius: number,
	hoveredIndex: number,
	hoveredRadius: number,
): void => {
	for (let i = 0; i < points.length; i++) {
		const r = i === hoveredIndex ? hoveredRadius : radius;
		if (r <= 0) continue;
		const point = points[i];
		if (!point || point.length < 2) continue;
		g.beginPath();
		g.arc(point[0], point[1], r, 0, Math.PI * 2);
		g.globalAlpha = 0.7;
		g.fillStyle = color;
		g.fill();
		g.globalAlpha = 1;
		g.lineWidth = 2;
		g.strokeStyle = color;
		g.stroke();
	}
};
