const isLocal =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";

const hubLink = document.getElementById("hub-link");
if (hubLink) {
  hubLink.href = isLocal
    ? window.TOOLS_HUB_LOCAL_URL ?? window.TOOLS_HUB_URL
    : window.TOOLS_HUB_URL;
}

const inputEl = document.getElementById("input-list");
const outputEl = document.getElementById("output-sql");
const quoteStringsEl = document.getElementById("quote-strings");
const copyBtn = document.getElementById("copy-btn");
const statusEl = document.getElementById("copy-status");

function parseList(raw) {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeSqlString(value) {
  return value.replace(/'/g, "''");
}

function buildInClause(values, quoteStrings) {
  if (!values.length) {
    return "";
  }

  const formatted = quoteStrings
    ? values.map((v) => `'${escapeSqlString(v)}'`)
    : values.map((v) => escapeSqlString(v));

  return `IN (${formatted.join(",")})`;
}

function updateOutput() {
  const values = parseList(inputEl.value);
  outputEl.value = buildInClause(values, quoteStringsEl.checked);
  statusEl.textContent = values.length
    ? `${values.length} знач.`
    : "";
  copyBtn.disabled = !outputEl.value;
}

async function copyOutput() {
  if (!outputEl.value) return;
  try {
    await navigator.clipboard.writeText(outputEl.value);
    statusEl.textContent = "Скопировано";
    setTimeout(() => updateOutput(), 1500);
  } catch {
    outputEl.select();
    document.execCommand("copy");
    statusEl.textContent = "Скопировано";
    setTimeout(() => updateOutput(), 1500);
  }
}

inputEl.addEventListener("input", updateOutput);
quoteStringsEl.addEventListener("change", updateOutput);
copyBtn.addEventListener("click", copyOutput);

updateOutput();
