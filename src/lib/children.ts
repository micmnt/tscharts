import {
	Children,
	Fragment,
	isValidElement,
	type JSX,
	type ReactNode,
} from "react";

export const flattenChildren = (children: ReactNode): JSX.Element[] => {
	const result: JSX.Element[] = [];

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
