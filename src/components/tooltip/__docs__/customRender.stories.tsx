import type { Meta, StoryObj } from "@storybook/react";
import CustomRenderExample from "./custom-render-example";

const meta: Meta<typeof CustomRenderExample> = {
	title: "Tooltip/Custom render",
	component: CustomRenderExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"`render` sostituisce **l'intero** riquadro del tooltip: niente contenitore",
					"di default, niente titolo, niente footer. La libreria continua a occuparsi",
					"di quando mostrarlo e di dove metterlo (ribaltamento ai bordi e clamp nel",
					"contenitore), tu decidi cosa disegnare.",
					"",
					"```tsx",
					'import { Chart, Line, Tooltip, XAxis, YAxis } from "tscharts";',
					"",
					"<Tooltip",
					"  render={({ label, index, series }) => (",
					'    <div className="mio-tooltip">',
					"      <strong>{label}</strong>",
					"      {series.map((row) => (",
					"        <div key={row.name}>",
					"          <span style={{ background: row.color }} />",
					"          {row.name}: {row.formatted}",
					"        </div>",
					"      ))}",
					"    </div>",
					"  )}",
					"/>",
					"```",
					"",
					"Ogni riga di `series` arriva gia' risolta sul punto in hover: `name`,",
					"`value` (`null` se manca il dato), `formatted` (con il `format` della",
					"serie applicato), `color` e la `serie` di origine, nell'ordine e con i",
					"filtri di `reverseOrder` / `hideSeries`.",
					"",
					"Senza `width` esplicita il riquadro prende la larghezza del contenuto.",
					"L'overlay resta `pointer-events: none`, quindi il contenuto custom e'",
					"informativo, non interattivo.",
					"",
					"In questo esempio il tooltip e' una card chiara con i valori allineati a",
					"destra e una riga di margine calcolata al volo dalle due serie.",
				].join("\n"),
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof CustomRenderExample>;

export const CardTooltip: Story = {};
