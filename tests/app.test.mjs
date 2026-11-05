import test from "node:test";
import assert from "node:assert/strict";
import { fallbackColor, isHttpUrl, mediaLink, normalizeContent, sourceLink } from "../app.js";

const project = (fields = {}) => ({ title: "Project", url: "https://a.b", ...fields });

const valid = () => ({
  site: { name: "Name", intro: "Intro" },
  projects: [project()],
});

const countingWarnings = (run) => {
  const original = console.warn;
  let count = 0;
  console.warn = () => {
    count += 1;
  };
  try {
    return { result: run(), count };
  } finally {
    console.warn = original;
  }
};

test("isHttpUrl accepts http and https", () => {
  for (const url of ["http://a.b", "https://a.b", "HTTPS://a.b"]) {
    assert.equal(isHttpUrl(url), true, url);
  }
});

test("isHttpUrl rejects other values", () => {
  for (const value of ["javascript:alert(1)", "mailto:a@b.c", "images/a.png", "", 42, null]) {
    assert.equal(isHttpUrl(value), false, String(value));
  }
});

test("isHttpUrl rejects URLs without two slashes after the scheme", () => {
  for (const url of ["https:example.com/x", "http:/example.com/x", "https:\\\\example.com"]) {
    assert.equal(isHttpUrl(url), false, url);
  }
});

test("normalizeContent fills defaults", () => {
  const { site, projects } = normalizeContent(valid());
  assert.equal(site.alias, "");
  assert.deepEqual(site.links, []);
  assert.equal(projects[0].description, "");
  assert.equal(projects[0].source, "");
  assert.equal(projects[0].image, "");
  assert.deepEqual(projects[0].tags, []);
  assert.equal(projects[0].featured, false);
});

test("normalizeContent keeps JSON order", () => {
  const raw = valid();
  raw.projects = [project({ title: "C" }), project({ title: "A" }), project({ title: "B" })];
  const titles = normalizeContent(raw).projects.map((item) => item.title);
  assert.deepEqual(titles, ["C", "A", "B"]);
});

test("normalizeContent rejects a bad top level", () => {
  for (const raw of [null, [], {}, { project: [] }, { site: valid().site }]) {
    assert.equal(normalizeContent(raw), null, JSON.stringify(raw));
  }
});

test("normalizeContent rejects a bad site", () => {
  const cases = [{ intro: "Intro" }, { name: "Name" }, { name: "  ", intro: "Intro" }];
  for (const site of cases) {
    assert.equal(normalizeContent({ ...valid(), site }), null, JSON.stringify(site));
  }
});

test("normalizeContent rejects an empty project list", () => {
  assert.equal(normalizeContent({ ...valid(), projects: [] }), null);
});

test("normalizeContent skips bad projects and warns for each", () => {
  const raw = valid();
  raw.projects.push(
    { url: "https://a.b" },
    project({ title: "  " }),
    project({ title: 42 }),
    { title: "No links" },
    { title: "Bad link", url: "javascript:alert(1)" },
  );
  const { result, count } = countingWarnings(() => normalizeContent(raw));
  assert.equal(result.projects.length, 1);
  assert.equal(count, 5);
});

test("normalizeContent rejects a list with only bad projects", () => {
  const raw = { ...valid(), projects: [{ url: "https://a.b" }] };
  const { result } = countingWarnings(() => normalizeContent(raw));
  assert.equal(result, null);
});

test("normalizeContent keeps a project with one valid link", () => {
  const raw = valid();
  raw.projects = [{ title: "One link", url: "javascript:alert(1)", source: "https://a.b" }];
  const [item] = normalizeContent(raw).projects;
  assert.equal(item.url, "");
  assert.equal(item.source, "https://a.b");
});

test("normalizeContent drops wrong types", () => {
  const raw = valid();
  raw.projects = [project({ tags: "x", description: 42, image: 42, featured: "yes" })];
  const [item] = normalizeContent(raw).projects;
  assert.deepEqual(item.tags, []);
  assert.equal(item.description, "");
  assert.equal(item.image, "");
  assert.equal(item.featured, false);
});

test("normalizeContent drops non-string tags", () => {
  const raw = valid();
  raw.projects = [project({ tags: ["Scala", 42, "  "] })];
  assert.deepEqual(normalizeContent(raw).projects[0].tags, ["Scala"]);
});

test("normalizeContent filters site links", () => {
  const raw = valid();
  raw.site.links = [
    { label: "GitHub", url: "https://github.com" },
    { label: "Bad", url: "javascript:alert(1)" },
    { url: "https://a.b" },
  ];
  assert.deepEqual(normalizeContent(raw).site.links, [{ label: "GitHub", url: "https://github.com" }]);
});

test("normalizeContent ignores site links of the wrong type", () => {
  const raw = valid();
  raw.site.links = "x";
  assert.deepEqual(normalizeContent(raw).site.links, []);
});

test("fallbackColor cycles through the palette", () => {
  assert.equal(fallbackColor(0), "#dbe6ff");
  assert.equal(fallbackColor(5), "#d9ecff");
  assert.equal(fallbackColor(6), fallbackColor(0));
});

const newTab = { target: "_blank", rel: "noopener" };

test("mediaLink prefers the live site", () => {
  const link = mediaLink({ title: "ovrly", url: "https://live.example", source: "https://source.example" });
  assert.deepEqual(link, { href: "https://live.example", label: "ovrly live site", ...newTab });
});

test("mediaLink falls back to the source", () => {
  const link = mediaLink({ title: "ovrly", url: "", source: "https://source.example" });
  assert.deepEqual(link, { href: "https://source.example", label: "ovrly source code", ...newTab });
});

test("sourceLink shows the source even when there is a live site", () => {
  const link = sourceLink({ title: "ovrly", url: "https://live.example", source: "https://source.example" });
  assert.deepEqual(link, {
    text: "Source",
    href: "https://source.example",
    label: "ovrly source code",
    ...newTab,
  });
});

test("sourceLink is null without a source", () => {
  assert.equal(sourceLink({ title: "ovrly", url: "https://live.example", source: "" }), null);
});
