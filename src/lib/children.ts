import {
	Children,
	Fragment,
	isValidElement,
	type JSX,
	type ReactNode,
} from "react";

// Appiattisce i children di <Chart> in una lista di elementi "foglia",
// scendendo dentro i Fragment e gli array (es. da {items.map(...)}). Serve
// all'ispezione statica dei children (conteggio assi Y, orientamento, altezza
// legenda, config globale): senza appiattire, <>...</> e .map non venivano
// contati e il layout usciva sbagliato (R6).
//
// NB: non scende dentro componenti wrapper custom (const MyAxis = () =>
// <Axis/>), perche' non sono renderizzati a questo livello: mettere i
// componenti della libreria come figli, eventualmente in Fragment/map.
export const flattenChildren = (children: ReactNode): JSX.Element[] => {
	const result: JSX.Element[] = [];
	// Children.forEach appiattisce gia' gli array annidati (da .map); qui
	// aggiungo la discesa ricorsiva nei Fragment.
	Children.forEach(children, (child) => {
		if (!isValidElement(child)) return;
		if (child.type === Fragment) {
			const fragmentChildren = (child.props as { children?: ReactNode })
				.children;
			result.push(...flattenChildren(fragmentChildren));
		} else {
			result.push(child as JSX.Element);
		}
	});
	return result;
};
