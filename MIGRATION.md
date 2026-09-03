# Guida alla migrazione

Questa guida copre il passaggio da **0.17.x** (l'ultima 0.x pubblicata) a
**1.3.0**.

I breaking change sono concentrati in due release:

- **1.0.0** — riorganizzazione dell'API: ogni prop si sposta sul componente che
  la "possiede". Le API vecchie continuavano a funzionare, ma emettevano un
  avviso in console in sviluppo.
- **1.3.0** — rimozione di quel layer deprecato. Le API vecchie **non esistono
  più**.

Chi salta direttamente da 0.17.x a 1.3.0 non passa mai dalla fase di
deprecazione: va applicato tutto in una volta. La buona notizia è che quasi
tutto è meccanico e **TypeScript segnala ogni punto da toccare** — se il
progetto è tipizzato, `tsc` è la checklist più affidabile.

## In breve

| # | Cosa cambia | Da | A |
|---|---|---|---|
| 1 | Tipo della serie | `type` opzionale | `type` **obbligatorio** su ogni elemento di `elements` |
| 2 | Componenti d'asse | `<Axis type="xAxis \| yAxis">` | `<XAxis>` / `<YAxis>` |
| 3 | Config delle barre | `<Bar config={{...}}>` / `<GroupBar config={{...}}>` | props piatte, più `<Chart>` e `<XAxis>` |
| 4 | Prop di `<Line>` | `higlightLabels` | `highlightLabels` |
| 5 | Foglio di stile | `tscharts/dist/style.css` | `tscharts/style.css` |
| 6 | Label di pie/donut | `labels` su qualsiasi serie | `labels` solo su serie `pie` / `donut` |
| 7 | Export pubblici | `<Svg>` esportato | non più esportato (era un componente interno) |
| 8 | `<Chart style>` | `any` | `CSSProperties` |

Nessun altro componente cambia: `<Pie>`, `<Donut>`, `<AngleDonut>`,
`<Threshold>`, `<Tooltip>` e `<Legend>` mantengono l'API che avevano (le loro
novità sono tutte additive).

---

## 1. `type` obbligatorio su ogni serie

Era `type?: string`, ora è il **discriminante** di una union: dal valore di
`type` TypeScript deriva la forma di `data`.

```ts
// prima (0.17.x) — `type` opzionale, `data` era l'unione di tutte le forme
const elements = [
  { name: "vendite", data: [{ date: "2024-03-13", value: 120 }] },
  { name: "obiettivo", type: "threshold", data: 150 },
];

// ora (1.x)
const elements: Serie[] = [
  { name: "vendite", type: "bar", data: [{ date: "2024-03-13", value: 120 }] },
  { name: "obiettivo", type: "threshold", data: 150 },
];
```

Valori ammessi: `"bar"`, `"line"`, `"bar-stacked"`, `"group-bar"`, `"pie"`,
`"donut"`, `"angle-donut"`, `"threshold"`.

Il vantaggio pratico: una serie `threshold` ha `data: number`, una serie `pie`
ha `data: PieSerieEl[]`, e l'autocomplete smette di proporre campi che non
appartengono a quel tipo di serie. Il tipo `Serie` (e i tipi correlati) sono ora
esportati dalla root del pacchetto:

```ts
import type { Serie, PieSerieEl, TimeSerieEl } from "tscharts";
```

**A runtime** una serie senza `type` non viene più riconosciuta dai type guard
interni: il componente non trova la serie e non renderizza nulla (con un avviso
in console in sviluppo). Non è un cambio silenzioso, ma è bene saperlo se il
progetto non è in TypeScript.

## 2. `<Axis type="…">` → `<XAxis>` / `<YAxis>`

```tsx
// prima
<Axis type="yAxis" name="vendite" showLine showName />
<Axis type="xAxis" dataPoints={["13/03", "14/03"]} showLine showName />

// ora
<YAxis name="vendite" showLine showName />
<XAxis dataPoints={["13/03", "14/03"]} showLine showName />
```

Tutte le altre prop mantengono nome e significato. La sostituzione è meccanica:
si rimuove `type` e si cambia il nome del componente.

Un dettaglio in più: prima `AxisProps` era **un tipo solo** per entrambi gli
assi, quindi era possibile passare prop dell'asse X a un asse Y senza che
TypeScript protestasse (venivano ignorate). Ora i due tipi sono separati:
`dataPoints`, `tiltLabels`, `labelXOffset`, `selectedArea`, `selectedValue`,
`scaleType`, … esistono solo su `<XAxis>`; `min`, `max`, `zoomable`, … solo su
`<YAxis>`. Se il codice passava per errore prop dell'asse sbagliato, ora emerge
come errore di tipo — è la segnalazione di un bug preesistente, non una
regressione.

## 3. L'oggetto `config` di `<Bar>` e `<GroupBar>`

L'oggetto `config` non esiste più. Ogni chiave si è spostata sul componente che
la possiede davvero: le prop di **aspetto della barra** restano su `<Bar>` /
`<GroupBar>` ma diventano piatte, quelle di **layout** (che erano già globali
per tutto il grafico) salgono su `<Chart>`, quelle di **selezione della
categoria** scendono su `<XAxis>`.

### `<Bar>`

| Prima (`config.…`) | Ora |
|---|---|
| `radius`, `topLeftRadius`, `topRightRadius`, `bottomRightRadius`, `bottomLeftRadius` | prop piatte su `<Bar>` |
| `labelSize`, `labelColor`, `topLabelSize`, `topLabelColor` | prop piatte su `<Bar>` |
| `dragValueDecimals` | prop piatta su `<Bar>` |
| `barClickAction` | **`onBarClick`** su `<Bar>` |
| `barDragAction` | **`onBarDrag`** su `<Bar>` |
| `barWidth` | **`<Chart barWidth>`** |
| `barOffset` | **`<Chart barOffset>`** |
| `selectedValue` | **`<XAxis selectedValue>`** |
| `selectedColor` | **`<XAxis selectedColor>`** |

```tsx
// prima
<Chart width={600} height={400} elements={elements}>
  <Axis type="yAxis" name="vendite" showLine />
  <Bar
    name="vendite"
    config={{
      radius: 4,
      barWidth: 24,
      labelColor: "white",
      selectedValue: "14/03",
      selectedColor: "#eef2ff",
      barClickAction: (value) => console.log(value),
    }}
  />
  <Axis type="xAxis" dataPoints={labels} showLine />
</Chart>

// ora
<Chart width={600} height={400} elements={elements} barWidth={24}>
  <YAxis name="vendite" showLine />
  <Bar
    name="vendite"
    radius={4}
    labelColor="white"
    onBarClick={(value) => console.log(value)}
  />
  <XAxis
    dataPoints={labels}
    showLine
    selectedValue="14/03"
    selectedColor="#eef2ff"
  />
</Chart>
```

### `<GroupBar>`

| Prima (`config.…`) | Ora |
|---|---|
| `radius`, `topLeftRadius`, `topRightRadius`, `bottomRightRadius`, `bottomLeftRadius` | prop piatte su `<GroupBar>` |
| `labelSize`, `labelColor`, `topLabelSize`, `topLabelColor` | prop piatte su `<GroupBar>` |
| `barWidth` | **`<Chart barWidth>`** |
| `barGroupGap` | **`<Chart barGroupGap>`** |

### Perché `barWidth` / `barGroupGap` / `barOffset` salgono su `<Chart>`

Non è una perdita di granularità: in 0.17.x il grafico **raccoglieva il `config`
di tutti i figli e li fondeva in un'unica configurazione globale**, con l'ultimo
figlio a vincere in caso di conflitto. Larghezza e spaziatura delle barre erano
quindi già condivise da tutte le serie, solo in modo implicito e dipendente
dall'ordine dei componenti. Ora sono dichiarate una volta sola dove valgono.

Se il codice attuale passa `barWidth` diversi su `<Bar>` differenti, il valore
che stai vedendo a schermo è quello dell'ultimo `<Bar>` nel JSX: usa quello su
`<Chart>` e il risultato resta identico.

### Attenzione ai progetti non tipizzati

`config` non è più nel tipo delle prop, ma in JavaScript puro passarlo non
produce nessun errore: viene semplicemente **ignorato**, e barre senza raggio o
click handler che non scattano sono l'unico sintomo. Se non usi TypeScript,
cerca a mano ogni `config=` su `<Bar>` e `<GroupBar>`.

Il `config` di **`<Donut>` e `<AngleDonut>` resta valido**: non era mai stato
deprecato.

## 4. `higlightLabels` → `highlightLabels`

Correzione di un refuso nel nome della prop di `<Line>`.

```tsx
// prima
<Line name="vendite" higlightLabels />

// ora
<Line name="vendite" highlightLabels />
```

Anche qui: in TypeScript è un errore, in JavaScript la prop viene ignorata in
silenzio e le label semplicemente non si evidenziano più al passaggio del mouse.

## 5. Percorso del foglio di stile

Il pacchetto dichiara ora un campo `exports`, quindi il CSS ha un percorso
pubblico stabile:

```ts
// prima
import "tscharts/dist/style.css";

// ora
import "tscharts/style.css";
```

Conseguenza del campo `exports`: **gli import profondi non sono più
raggiungibili**. Se il codice importava da `tscharts/dist/...` per arrivare a
qualcosa di interno, quel percorso ora fallisce. I punti d'ingresso pubblici
sono tre:

```ts
import { Chart, Bar, XAxis } from "tscharts";
import { movingAverage, aggregate } from "tscharts/transform";
import "tscharts/style.css";
```

## 6. `labels` solo sulle serie pie/donut

Le label personalizzate di pie e donut (`labels: { name, value }[]`) erano
dichiarate sul tipo base di tutte le serie: comparivano nell'autocomplete anche
di una serie `bar`, dove non facevano nulla. Ora vivono su `PieSerie`.

Nessun cambiamento a runtime: se le usavi su una serie `pie` o `donut`
continuano a funzionare identiche. Se comparivano su una serie di altro tipo,
erano già inerti e ora TypeScript le segnala.

## 7. `<Svg>` non è più esportato

`<Svg>` era il contenitore interno usato da `<Chart>`, esportato per errore
dalla root del pacchetto. Non è più pubblico. Non era pensato per essere usato
direttamente (richiede `containerRef` e `chartID` prodotti da `<Chart>`), quindi
è improbabile che qualcuno lo importasse: se lo facevi, la composizione corretta
è `<Chart>` con i suoi figli.

## 8. `<Chart style>` tipizzata

`style` era `any`, ora è `CSSProperties`. Se passavi un oggetto valido non
cambia nulla; se passavi valori non validi, ora emergono.

---

## Dopo la migrazione

Una volta che il progetto compila, queste sono le novità 1.x che puoi adottare
quando ti servono — tutte opzionali, nessuna richiede altre modifiche.

**Tema.** `<Chart theme={{ ... }}>` fa un override parziale del tema di default
(deep-merge per chiave), e `defaultTheme` è esportato per partire da lì. Prima
il tema non era personalizzabile dall'esterno.

**Asse Y.** `<YAxis min max>` per fissare il dominio invece di usare `[0, max]`
auto-calcolato, e `<YAxis zoomable>` per lo zoom con la rotella (con
`onZoomChange`, `zoomStep`, `zoomSnap`).

**Asse X temporale.** `<XAxis scaleType="time">` posiziona le marche in base
alla data e non all'indice, così un campionamento irregolare si vede per quello
che è: vale per le linee e (dalla 1.4) per le barre, centrate sull'istante del
dato. Il default `scaleType="band"` è invariato.

**Area chart e sparkline.** `<Line fill fillOpacity>` riempie l'area fino alla
baseline, `fillGradient` la sfuma. Nota: in 0.17.x `fill` chiudeva il tratto su
se stesso producendo una regione imperfetta — se lo usavi già, il risultato ora
è diverso (ed è quello che la prop dichiarava di fare).

**Trasformazione dati.** `tscharts/transform` espone funzioni pure
`dati → dati` (`movingAverage`, `cumulative`, `aggregate`, `bin`) da applicare a
monte di `elements`. Entry point separato, non pesa sul bundle base.

**Rendering su canvas.** `<Chart renderer="canvas">` disegna le marche dense su
un unico `<canvas>` tenendo assi, griglia, legenda e tooltip in SVG. Serve per
dataset grandi; `renderer="svg"` resta il default ed esclude completamente il
canvas.

**Marche custom.** L'hook `useChartMark` espone il sistema di coordinate del
grafico per comporre marche proprie come figli di `<Chart>`; `<Line renderDot>`
sostituisce il pallino del punto con una marca custom.

**Donut e pie.** `<Donut config>` accetta `gap`, `sliceRadius` (angoli
arrotondati), `labelPosition: "outside"` con leader line e anti-collisione, e un
`badge` nell'elemento centrale. `<Pie config>` accetta `labelPosition` e
`leaderLine`.

Il dettaglio completo di ogni release è nel [CHANGELOG](./CHANGELOG.md).
