# MIE Web Open Source Template

Shared baseline files for MIE Web open source projects — Copilot instructions, `.gitignore`, and more.

## Apply to an Existing Project

### Option 1 — `npx` (Node.js 18+)

```bash
# Run directly from GitHub (no npm install needed)
npx github:mieweb/template-mieweb-opensource
```

If the package is published to npm:

```bash
npx @mieweb/template-apply
```

### Option 2 — `curl` one-liner (no Node.js required)

```bash
bash <(curl -sL https://raw.githubusercontent.com/mieweb/template-mieweb-opensource/main/apply.sh)
```

### What it does

Both commands will:

1. Fetch each template file from this repo
2. Check if it already exists in your project
3. If it **doesn't exist** → prompt to **create** or skip
4. If it **exists but differs** → prompt to:
   - **(o)verwrite** — replace with the template version
   - **(a)ppend** — add the template content at the end
   - **(m)erge** — deduplicate lines (great for `.gitignore`)
   - **(s)kip** — leave your file untouched
5. If it's **already identical** → skip automatically

### Template files included

| File | Purpose |
|------|---------|
| `.github/copilot-instructions.md` | Code quality, accessibility, i18n, docs standards for GitHub Copilot |
| `.gitignore` | Standard ignores for Node.js projects |

## Adding new template files

Edit the `TEMPLATE_FILES` array in both:

- [bin/apply-template.mjs](bin/apply-template.mjs) (Node.js / npx)
- [apply.sh](apply.sh) (shell script)

## Starting a new project

1. Use this repo as a [GitHub template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)
2. Replace this README with your own — consider [Working Backwards](https://docs.google.com/document/d/1zxa0Rgq56xGHOgY51DbZJVUlWMRh2pbd6AupVYI9IZc)
3. Use `npx create` to scaffold your framework
4. Use API-first thinking (no UI-first)
