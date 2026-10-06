#!/usr/bin/env python3
"""Generate summary.json from the submodules listed in .gitmodules.

For each submodule: title (<title> of its index.html, else README heading, else
folder name), description (meta description, else first README paragraph),
last commit date/subject and repo URL. Run from anywhere; paths resolve from the repo root.
"""
import configparser, json, pathlib, re, subprocess
from datetime import datetime, timezone
from html import unescape

ROOT = pathlib.Path(__file__).resolve().parent.parent


def git(path, *args):
    r = subprocess.run(["git", "-C", str(path), *args], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else ""


def from_html(p):
    if not p.exists():
        return None, None
    html = p.read_text(errors="ignore")
    t = re.search(r"<title[^>]*>(.*?)</title>", html, re.S | re.I)
    d = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', html, re.S | re.I)
    if not d:
        d = re.search(r'<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']description["\']', html, re.S | re.I)
    sub = re.search(r"<h1[^>]*>.*?<small[^>]*>(.*?)</small>", html, re.S | re.I)
    desc = d.group(1) if d else (sub.group(1) if sub else None)
    return (unescape(t.group(1)).strip() if t else None,
            unescape(re.sub(r"\s+", " ", desc)).strip() if desc else None)


def from_readme(p):
    if not p.exists():
        return None, None
    title, desc = None, None
    for line in p.read_text(errors="ignore").splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("#") and not title:
            title = line.lstrip("# ").strip()
        elif not line.startswith(("#", "!", "[", "<", "```")) and not desc:
            desc = line
            break
    return title, desc


def main():
    cfg = configparser.ConfigParser()
    cfg.read(ROOT / ".gitmodules")
    items = []
    for section in cfg.sections():
        path = cfg[section]["path"]
        url = cfg[section]["url"].removesuffix(".git")
        d = ROOT / path
        if not d.exists():
            continue
        ht, hd = from_html(d / "index.html")
        rt, rd = from_readme(d / "README.md")
        date, _, msg = git(d, "log", "-1", "--format=%cI|%s").partition("|")
        items.append({
            "name": path,
            "title": ht or rt or path,
            "description": hd or rd or "",
            "url": f"{path}/",
            "repo": url,
            "updated": date,
            "last_commit": msg,
        })
    items.sort(key=lambda i: i["updated"], reverse=True)
    out = {"generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "items": items}
    (ROOT / "summary.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote summary.json with {len(items)} item(s)")


if __name__ == "__main__":
    main()
