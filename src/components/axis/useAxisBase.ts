import {
	useChartsDispatch,
	useChartsInteractive,
	useChartsStructural,
	useChartsTheme,
} from "../../contexts/chartContext";

// Context hooks condivisi da <XAxis> e <YAxis>. Il guard (return null quando
// manca ctx/theme) resta nel componente, che deve poter interrompere il render.
export const useAxisBase = () => {
	const ctx = useChartsStructural();
	const interactive = useChartsInteractive();
	const dispatch = useChartsDispatch();
	const theme = useChartsTheme();
	return { ctx, interactive, dispatch, theme };
};
