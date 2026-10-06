const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const DATE_FORMAT = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString(undefined, DATE_FORMAT);
}

function renderMessage(container, text) {
  container.innerHTML = `<p class="empty">${esc(text)}</p>`;
}

function renderCard(item) {
  const description = item.description
    ? `<p>${esc(item.description)}</p>`
    : "";

  return `
    <a class="card" href="${esc(item.url)}">
      <h2>${esc(item.title)}</h2>
      ${description}
      <div class="meta">
        <span>Updated ${formatDate(item.updated)}</span>
        <span>${esc(item.last_commit)}</span>
      </div>
    </a>`;
}

function renderSummary({ items, generated }) {
  const container = document.getElementById("summary");

  if (!items.length) {
    renderMessage(container, "Nothing here yet.");
    return;
  }

  container.innerHTML = items.map(renderCard).join("");

  if (generated) {
    const stamp = document.getElementById("stamp");
    stamp.textContent = `Summary generated ${new Date(generated).toLocaleString()}`;
  }
}

async function loadSummary() {
  const response = await fetch("summary.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(response.status);
  }
  return response.json();
}

loadSummary()
  .then(renderSummary)
  .catch(() => {
    renderMessage(document.getElementById("summary"), "Summary unavailable.");
  });
