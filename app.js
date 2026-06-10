const hubLink = document.getElementById("hub-link");
if (hubLink) {
  hubLink.href = window.TOOLS_HUB_URL;
}

const inputEl = document.getElementById("input-list");
const outputEl = document.getElementById("output-sql");
const quoteStringsEl = document.getElementById("quote-strings");
const dedupeEl = document.getElementById("dedupe-values");
const sortEl = document.getElementById("sort-values");
const notInEl = document.getElementById("not-in");
const copyBtn = document.getElementById("copy-btn");
const pasteBtn = document.getElementById("paste-btn");
const clearBtn = document.getElementById("clear-btn");
const statusEl = document.getElementById("copy-status");
const toastEl = document.getElementById("toast");

const MAX_VALUES = 10_000;

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toastEl.hidden = true;
  }, 2200);
}

function parseListRaw(raw) {
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!text) return [];

  if (text.includes("\n")) {
    return text.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  if (/[,;]/.test(text)) {
    return text.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
  }
  return text.split(/\s+/).filter(Boolean);
}

function parseList(raw) {
  let values = parseListRaw(raw);
  if (dedupeEl?.checked) {
    values = [...new Set(values)];
  }
  if (sortEl?.checked) {
    values = [...values].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }
  return values.slice(0, MAX_VALUES);
}

function escapeSqlString(value) {
  return value.replace(/'/g, "''");
}

function buildInClause(values, quoteStrings, notIn) {
  if (!values.length) return "";

  const formatted = quoteStrings
    ? values.map((v) => `'${escapeSqlString(v)}'`)
    : values.map((v) => escapeSqlString(v));

  const keyword = notIn ? "NOT IN" : "IN";
  return `${keyword} (${formatted.join(", ")})`;
}

function updateOutput() {
  const values = parseList(inputEl.value);
  outputEl.value = buildInClause(
    values,
    quoteStringsEl.checked,
    notInEl?.checked
  );

  if (!values.length) {
    statusEl.textContent = "";
    copyBtn.disabled = true;
    return;
  }

  const rawCount = parseListRaw(inputEl.value).length;
  const extra =
    dedupeEl?.checked && rawCount > values.length
      ? ` · −${rawCount - values.length} дубл.`
      : "";
  statusEl.textContent = `${values.length} знач.${extra}`;
  const headerCount = document.getElementById("value-count");
  if (headerCount) {
    headerCount.textContent = values.length ? `${values.length} знач.` : "";
  }
  copyBtn.disabled = false;
}

async function copyOutput() {
  if (!outputEl.value) return;
  try {
    await navigator.clipboard.writeText(outputEl.value);
    showToast("Скопировано в буфер");
  } catch {
    outputEl.select();
    showToast("Выделено — нажмите Ctrl+C");
  }
}

async function pasteInput() {
  try {
    const text = await navigator.clipboard.readText();
    inputEl.value = text;
    updateOutput();
    showToast("Вставлено из буфера");
  } catch {
    showToast("Нет доступа к буферу обмена");
  }
}

inputEl.addEventListener("input", updateOutput);
quoteStringsEl.addEventListener("change", updateOutput);
dedupeEl?.addEventListener("change", updateOutput);
sortEl?.addEventListener("change", updateOutput);
notInEl?.addEventListener("change", updateOutput);
copyBtn.addEventListener("click", copyOutput);
pasteBtn?.addEventListener("click", pasteInput);
clearBtn?.addEventListener("click", () => {
  inputEl.value = "";
  updateOutput();
  inputEl.focus();
});

outputEl.addEventListener("click", () => {
  outputEl.select();
});

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    copyOutput();
  }
});

updateOutput();
