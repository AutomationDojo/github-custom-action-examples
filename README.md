# PR Size Checker

A reusable GitHub Action that automatically checks Pull Request size and adds appropriate labels.

## Features

- Automatically calculates total lines changed (additions + deletions)
- Adds size-based labels: `small`, `medium`, `large`, `extra-large`
- Automatically creates labels if they don't exist in the repository
- Removes old labels when size changes
- Comments on large PRs suggesting split (optional)
- Configurable with custom thresholds

## Usage

### Basic Setup

Create a `.github/workflows/pr-size-check.yml` file in your repository:

```yaml
name: PR Size Check

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  check-pr-size:
    runs-on: ubuntu-latest
    name: Check PR Size
    steps:
      - name: Check PR Size
        uses: automationDojo/github-custom-action-examples@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced Configuration

```yaml
name: PR Size Check

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  check-pr-size:
    runs-on: ubuntu-latest
    name: Check PR Size
    steps:
      - name: Check PR Size
        uses: automationDojo/github-custom-action-examples@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          small-threshold: 100      # PRs up to 100 lines = small
          medium-threshold: 300     # PRs up to 300 lines = medium
          large-threshold: 600      # PRs up to 600 lines = large
          comment-on-large: true    # Comment on large PRs
```

## Inputs

| Input | Description | Required | Default |
|-------|-----------|-------------|---------|
| `github-token` | GitHub token for API calls | Yes | - |
| `small-threshold` | Maximum lines changed for a small PR | No | `100` |
| `medium-threshold` | Maximum lines changed for a medium PR | No | `300` |
| `large-threshold` | Maximum lines changed for a large PR | No | `600` |
| `comment-on-large` | Whether to comment on large PRs | No | `true` |

## Outputs

| Output | Description |
|--------|-----------|
| `size-label` | Label applied to the PR (small, medium, large, extra-large) |
| `lines-changed` | Total number of lines changed |

## Example Usage with Outputs

```yaml
- name: Check PR Size
  id: pr-size
  uses: automationDojo/github-custom-action-examples@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}

- name: Display PR Size
  run: |
    echo "PR Size: ${{ steps.pr-size.outputs.size-label }}"
    echo "Lines Changed: ${{ steps.pr-size.outputs.lines-changed }}"
```

## Labels Created

The action automatically creates the following labels:

| Label | Color | Description |
|-------|-----|-----------|
| `small` | Green | Small PRs, easy to review |
| `medium` | Yellow | Medium-sized PRs |
| `large` | Orange | Large PRs, consider splitting |
| `extra-large` | Red | Very large PRs, splitting recommended |

## How It Works

1. The action is triggered on pull request events
2. Calculates total lines changed (additions + deletions)
3. Determines size based on configured thresholds
4. Removes old size labels
5. Adds the appropriate new label
6. If the PR is large or extra-large, adds a comment suggesting split

## Local Development

### Prerequisites

- Node.js 20 or higher
- npm

### Setup

```bash
npm install
```

### File Structure

```
github-custom-action-examples/
├── action.yml          # Action metadata
├── index.js           # Main logic
├── package.json       # Dependencies
├── README.md          # Documentation
└── .github/
    └── workflows/
        ├── pr-size-check.yml          # Local usage example
        └── pr-size-check-external.yml # External usage example
```

## Releases and Versioning

This project uses [Semantic Release](https://semantic-release.gitbook.io/) for automated versioning and releases.

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature (triggers minor version bump)
- `fix:` - A bug fix (triggers patch version bump)
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `BREAKING CHANGE:` - Breaking changes (triggers major version bump)

**Examples:**

```bash
feat: add support for custom label colors
fix: resolve issue with label removal
docs: update README with new examples
chore: update dependencies
```

### How It Works

1. Push commits to `main` branch using conventional commit format
2. Semantic Release analyzes commits and determines version bump
3. Automatically generates CHANGELOG.md
4. Creates a GitHub release with release notes
5. Updates version in package.json

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a branch for your feature
3. Commit your changes using conventional commit format
4. Open a Pull Request

## License

MIT

## Author

AutomationDojo

## Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Creating a JavaScript Action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
