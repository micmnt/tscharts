const seriesColors = ["#3376bd", "#edae49", "#e63946", "#0079bc"];

const defaultTheme = {
	padding: 25,
	yInterval: 5,
	grid: {
		color: "#e3e3e3",
		size: 1,
		dashed: false,
	},
	line: {
		size: 3,
	},
	legend: {
		textColor: "#4f4f4f",
		textSize: 12,
	},
	axis: {
		color: "#e3e3e3",
		labelColor: "#4f4f4f",
		titleColor: "#4f4f4f",
		size: 2,
		labelSize: 12,
		titleSize: 12,
	},
	threshold: {
		size: 2,
		dash: 15,
		textSize: 12,
	},
	tooltip: {
		grid: {
			color: "#4f4f4f",
			size: 1,
		},
	},
	seriesColors,
};

export default defaultTheme;
