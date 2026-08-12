import {
	useChartsDispatch,
	useChartsInteractive,
	useChartsStructural,
	useChartsTheme,
} from "../../contexts/chartContext";

export const useAxisBase = () => {
	const ctx = useChartsStructural();
	const interactive = useChartsInteractive();
	const dispatch = useChartsDispatch();
	const theme = useChartsTheme();
	return { ctx, interactive, dispatch, theme };
};
