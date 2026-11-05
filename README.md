# petitbonney.github.io

Personal homepage, published with GitHub Pages at <https://petitbonney.github.io/>.

## Update the site

Edit `projects.json` and push to `master`. Projects appear in the order they are listed, so put featured projects first. Screenshots go in `images/`.

### `site`

| Field | Required | Meaning |
|---|---|---|
| `name` | Yes | Main heading |
| `alias` | No | Secondary name, shown smaller beside the heading |
| `intro` | Yes | One or two sentences under the heading |
| `links` | No | List of `{ "label", "url" }` shown under the intro |

### `projects[]`

| Field | Required | Meaning |
|---|---|---|
| `title` | Yes | Project name |
| `description` | No | Short summary |
| `url` | One of `url` or `source` | Live site, opened by clicking the card image |
| `source` | One of `url` or `source` | Source code, shown as "Source". The card image opens it when there is no `url`. |
| `image` | No | Image path relative to the site root, or a full URL. It is cropped to fit the card header. |
| `tags` | No | Short labels, such as technologies |
| `featured` | No | `true` gives the project a full-width card |

## Check before pushing

A JSON typo goes live with the push, so validate the file first:

```bash
python3 -m json.tool projects.json > /dev/null
```

## Preview locally

```bash
python3 -m http.server
```

Then open <http://localhost:8000>.

## Link previews

LinkedIn, Slack and similar services don't run JavaScript, so their preview text and image are set in `index.html`, not in `projects.json`. Update them there if your name or intro changes substantially.
