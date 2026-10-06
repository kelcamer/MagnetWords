# Magnet Words

Type anything and every letter takes its Fisher-Price magnet colour. Each word
becomes a colour strip you can sort, pin and compare.

Live: https://kelcamer.github.io/MagnetWords/

- **Fridge** — the text as coloured magnet letters.
- **Strips** — one fixed-width block per letter, so word length and colour
  mix compare at a glance. Sort as typed, A–Z, by length or by main colour.
- **Shelf** — pin strips to keep them while you type something else (stored
  in this browser only).
- The text lives in the URL (`#t=...`), so a link shares it.

The letter map is the Fisher-Price plastic alphabet magnets (sold 1971–1990):
red, orange, yellow, green, blue, purple, cycling from A. It is the same map
as the title on [Special Interests](https://kelcamer.github.io/SpecialInterests/)
— `src/letters.js` is a copy of that repo's `src/data/synesthesia.js`.
Witthoft, Winawer & Eagleman 2015, PLoS ONE 10(3):e0118996,
[PMID 25739095](https://pubmed.ncbi.nlm.nih.gov/25739095/).

Vite, no framework. `npm run build`; pushing to `main` deploys to GitHub Pages.
