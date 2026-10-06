import { HUES, LETTER_HUE, baseLetter, hueFor } from "./letters.js";

const $ = (id) => document.getElementById(id);
const input = $("input");
const SHELF_KEY = "magnet-words-shelf";

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

/* ---------- storage: the link carries the text, the browser the shelf ---------- */

function readHash() {
  const m = location.hash.match(/^#t=(.*)$/);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return null; }
}

function writeHash(text) {
  try { history.replaceState(null, "", `#t=${encodeURIComponent(text)}`); } catch {}
}

function loadShelf() {
  try {
    const v = JSON.parse(localStorage.getItem(SHELF_KEY) || "[]");
    return Array.isArray(v) ? v.filter((w) => typeof w === "string") : [];
  } catch { return []; }
}

function saveShelf() {
  try { localStorage.setItem(SHELF_KEY, JSON.stringify(shelf)); } catch {}
}

let shelf = loadShelf();

/* ---------- pieces ---------- */

// Word = a run of letters (any script, accents included); apostrophes inside
// a word stay with it so "don't" is one strip.
function wordsIn(text) {
  return text.match(/\p{L}[\p{L}\p{M}']*/gu) || [];
}

function lettersOf(word) {
  return [...word].map(baseLetter).filter(Boolean);
}

function mixOf(letters) {
  const n = Object.fromEntries(HUES.map((h) => [h, 0]));
  letters.forEach((l) => n[LETTER_HUE[l]]++);
  return n;
}

// The colour with the most letters; ties go to the earlier one in the cycle.
function mainHue(mix) {
  return HUES.reduce((best, h) => (mix[h] > mix[best] ? h : best), HUES[0]);
}

function mixBar(mix, label) {
  const total = HUES.reduce((s, h) => s + mix[h], 0);
  const bar = el("span", "mix");
  if (!total) return bar;
  const parts = [];
  HUES.forEach((h) => {
    if (!mix[h]) return;
    const seg = el("span", `seg bg-${h}`);
    seg.style.flexGrow = mix[h];
    bar.append(seg);
    parts.push(`${mix[h]} ${h}`);
  });
  bar.setAttribute("role", "img");
  bar.setAttribute("aria-label", `${label}: ${parts.join(", ")}`);
  return bar;
}

function strip(word, { pinned }) {
  const letters = lettersOf(word);
  const mix = mixOf(letters);
  const li = el("li", "strip-row");

  const name = el("span", "word", word);
  const blocks = el("span", "blocks");
  blocks.setAttribute("role", "img");
  blocks.setAttribute("aria-label",
    `${word}: ${letters.map((l) => `${l.toUpperCase()} ${LETTER_HUE[l]}`).join(", ")}`);
  letters.forEach((l) => blocks.append(el("span", `block bg-${LETTER_HUE[l]}`, l.toUpperCase())));

  const onShelf = !pinned && shelf.some((w) => w.toLowerCase() === word.toLowerCase());
  const btn = el("button", "mono link pin", pinned ? "remove" : onShelf ? "pinned" : "pin");
  btn.type = "button";
  btn.disabled = onShelf;
  btn.setAttribute("aria-label", `${pinned ? "Remove" : "Pin"} ${word}`);
  btn.addEventListener("click", () => {
    const key = word.toLowerCase();
    shelf = pinned
      ? shelf.filter((w) => w.toLowerCase() !== key)
      : shelf.some((w) => w.toLowerCase() === key) ? shelf : [...shelf, word];
    saveShelf();
    renderShelf();
    renderStrips();
  });

  li.append(name, blocks, mixBar(mix, `${word} colour mix`), btn);
  return li;
}

function sortWords(words, how) {
  const w = [...words];
  if (how === "alpha") w.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  if (how === "length") w.sort((a, b) => lettersOf(b).length - lettersOf(a).length);
  if (how === "colour") {
    // Group by main colour in cycle order, then by how much of the word it
    // takes up, so the reddest words sit at the top of the red group.
    const key = (word) => {
      const l = lettersOf(word), m = mixOf(l), h = mainHue(m);
      return [HUES.indexOf(h), l.length ? -m[h] / l.length : 0];
    };
    w.sort((a, b) => {
      const [ha, sa] = key(a), [hb, sb] = key(b);
      return ha - hb || sa - sb;
    });
  }
  return w;
}

/* ---------- renderers ---------- */

function renderTitle() {
  const h1 = $("title");
  [..."Magnet Words"].forEach((ch) => {
    const hue = hueFor(ch);
    const s = el("span", hue ? `ltr ltr-${hue}` : "", ch);
    s.setAttribute("aria-hidden", "true");
    h1.append(s);
  });
}

function renderFridge(text) {
  const fridge = $("fridge");
  fridge.replaceChildren();
  let i = 0;
  // Each word's magnets sit in one unbreakable group, so a line wraps
  // between words, never through one.
  let word = null;
  for (const ch of text) {
    if (ch === "\n") { word = null; fridge.append(el("span", "br")); continue; }
    if (/\s/.test(ch)) { word = null; fridge.append(el("span", "gap", " ")); continue; }
    if (!word) { word = el("span", "mag-word"); fridge.append(word); }
    const hue = hueFor(ch);
    const m = el("span", hue ? `mag ltr-${hue}` : "mag other", ch);
    // A small fixed tilt per slot, the way magnets never sit straight. It's
    // from the position, not random, so the fridge doesn't jitter as you type.
    m.style.setProperty("--tilt", `${(((i * 37) % 9) - 4) * 0.9}deg`);
    word.append(m);
    i++;
  }
}

function renderTotal(text) {
  const letters = [...text].map(baseLetter).filter(Boolean);
  $("count").textContent = `${letters.length} letter${letters.length === 1 ? "" : "s"}`;
  $("total-mix").replaceChildren(mixBar(mixOf(letters), "Whole text colour mix"));
}

function renderStrips() {
  let words = wordsIn(input.value).filter((w) => lettersOf(w).length);
  if ($("dedupe").checked) {
    const seen = new Set();
    words = words.filter((w) => {
      const k = w.toLowerCase();
      return seen.has(k) ? false : seen.add(k);
    });
  }
  const list = $("strips");
  list.replaceChildren(...sortWords(words, $("sort").value).map((w) =>
    strip(w, { pinned: false })));
  if (!words.length) list.append(el("li", "mono note", "No words yet."));
}

function renderShelf() {
  $("shelf").replaceChildren(...sortWords(shelf, $("sort").value).map((w) =>
    strip(w, { pinned: true })));
  $("shelf-empty").hidden = shelf.length > 0;
  $("clear-shelf").hidden = shelf.length === 0;
}

function renderKey() {
  const key = $("key");
  Object.entries(LETTER_HUE).forEach(([l, hue]) => {
    const m = el("span", `mag ltr-${hue}`, l.toUpperCase());
    m.setAttribute("title", `${l.toUpperCase()} — ${hue}`);
    key.append(m);
  });
}

function update() {
  const text = input.value;
  renderFridge(text);
  renderTotal(text);
  renderStrips();
  writeHash(text);
}

/* ---------- wire up ---------- */

const fromLink = readHash();
if (fromLink != null) input.value = fromLink;

renderTitle();
renderKey();
renderShelf();
update();

input.addEventListener("input", update);
$("sort").addEventListener("change", () => { renderStrips(); renderShelf(); });
$("dedupe").addEventListener("change", renderStrips);
$("clear-shelf").addEventListener("click", () => {
  shelf = [];
  saveShelf();
  renderShelf();
});
window.addEventListener("hashchange", () => {
  const t = readHash();
  if (t != null && t !== input.value) { input.value = t; update(); }
});
