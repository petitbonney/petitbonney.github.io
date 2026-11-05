const text = (value) => (typeof value === "string" ? value.trim() : "");

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

const list = (value) => (Array.isArray(value) ? value : []);

export function isHttpUrl(value) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value.trim())) return false;
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}

const httpUrl = (value) => (isHttpUrl(value) ? value.trim() : "");

function normalizeLink(raw) {
  const label = text(raw?.label);
  const url = httpUrl(raw?.url);
  return label && url ? { label, url } : null;
}

function normalizeProject(raw) {
  if (!isObject(raw)) return null;
  const title = text(raw.title);
  const url = httpUrl(raw.url);
  const source = httpUrl(raw.source);
  if (!title || (!url && !source)) return null;
  return {
    title,
    description: text(raw.description),
    url,
    source,
    image: text(raw.image),
    tags: list(raw.tags).map(text).filter(Boolean),
    featured: raw.featured === true,
  };
}

export function normalizeContent(raw) {
  if (!isObject(raw) || !isObject(raw.site)) return null;

  const name = text(raw.site.name);
  const intro = text(raw.site.intro);
  if (!name || !intro) return null;

  const projects = list(raw.projects).flatMap((entry) => {
    const project = normalizeProject(entry);
    if (!project) console.warn("Skipped invalid project:", entry);
    return project ? [project] : [];
  });
  if (projects.length === 0) return null;

  return {
    site: {
      name,
      alias: text(raw.site.alias),
      intro,
      links: list(raw.site.links).map(normalizeLink).filter(Boolean),
    },
    projects,
  };
}

const PALETTE = ["#dbe6ff", "#f3e4ff", "#ffe9d6", "#ffd9e4", "#d8f3e4", "#d9ecff"];

export function fallbackColor(index) {
  return PALETTE[index % PALETTE.length];
}

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content) node.textContent = content;
  return node;
}

function link(label, url, accessibleName) {
  const node = element("a", "", label);
  node.href = url;
  if (accessibleName) node.setAttribute("aria-label", accessibleName);
  return node;
}

function colorBlock(project, index) {
  const block = element("div", "card-placeholder", project.title);
  block.style.backgroundColor = fallbackColor(index);
  block.setAttribute("aria-hidden", "true");
  return block;
}

const inNewTab = (entry) => ({ ...entry, target: "_blank", rel: "noopener" });

export function mediaLink({ title, url, source }) {
  return inNewTab(
    url
      ? { href: url, label: `${title} live site` }
      : { href: source, label: `${title} source code` },
  );
}

export function sourceLink({ title, source }) {
  if (!source) return null;
  return inNewTab({ text: "Source", href: source, label: `${title} source code` });
}

function projectAnchor({ text, href, label, target, rel }) {
  const node = link(text, href, label);
  node.target = target;
  node.rel = rel;
  return node;
}

function cardMedia(project, index) {
  const media = projectAnchor(mediaLink(project));
  media.className = "card-media";
  if (!project.image) {
    media.append(colorBlock(project, index));
    return media;
  }
  const image = element("img");
  image.src = project.image;
  image.alt = `${project.title} screenshot`;
  image.loading = index === 0 ? "eager" : "lazy";
  image.addEventListener("error", () => image.replaceWith(colorBlock(project, index)));
  media.append(image);
  return media;
}

function card(project, index) {
  const article = element("article", project.featured ? "card featured" : "card");
  const body = element("div", "card-body");
  body.append(element("h2", "", project.title));

  if (project.description) body.append(element("p", "description", project.description));

  if (project.tags.length > 0) {
    const tags = element("ul", "tags");
    tags.append(...project.tags.map((tag) => element("li", "", tag)));
    body.append(tags);
  }

  const source = sourceLink(project);
  if (source) {
    const links = element("div", "card-links");
    links.append(projectAnchor(source));
    body.append(links);
  }

  article.append(cardMedia(project, index), body);
  return article;
}

export function renderPage({ site, projects }) {
  const heading = element("h1", "", site.name);
  if (site.alias) heading.append(" ", element("span", "alias", site.alias));

  const header = document.querySelector("#site-header");
  header.append(heading, element("p", "intro", site.intro));

  if (site.links.length > 0) {
    const nav = element("nav", "site-links");
    nav.append(...site.links.map(({ label, url }) => link(label, url)));
    header.append(nav);
  }

  document.querySelector("#projects").append(...projects.map(card));
}

export function showFallback() {
  document.querySelector("#fallback").hidden = false;
}

export async function init() {
  try {
    const response = await fetch("projects.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`projects.json returned ${response.status}`);
    const content = normalizeContent(await response.json());
    if (!content) throw new Error("projects.json has no usable content");
    renderPage(content);
  } catch (error) {
    console.error(error);
    showFallback();
  }
}

if (typeof document !== "undefined") init();
