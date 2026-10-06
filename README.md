# petitbonney.github.io

Homepage with an auto-generated summary of every submodule.

- `scripts/build_summary.py` reads `.gitmodules` and writes `summary.json`
  (title, description, last commit, link per submodule).
- `.github/workflows/summary.yml` runs it daily, on manual dispatch, on a
  `submodule-updated` repository_dispatch event, and when `.gitmodules`/scripts
  change; it bumps submodules to their latest commit and commits the result.
- `index.html` fetches `summary.json` and renders one card per sub-page.

Adding a sub-page: `git submodule add <url> <folder>` and push. The next run adds its card.

Preview locally: `python3 scripts/build_summary.py && python3 -m http.server`.

## Rebuild instantly when a sub-repo changes (optional)

Add to the sub-repo a workflow step (needs a PAT secret `ROOT_PAT` with repo scope):

```yaml
- run: >
    curl -X POST -H "Authorization: Bearer ${{ secrets.ROOT_PAT }}"
    -H "Accept: application/vnd.github+json"
    https://api.github.com/repos/petitbonney/petitbonney.github.io/dispatches
    -d '{"event_type":"submodule-updated"}'
```
