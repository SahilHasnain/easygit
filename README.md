# easyGit

A simplified Git workflow for VS Code — everything lives in one sidebar panel. No status bar clutter, no complex menus.

## Features

- **Sidebar panel** with branch info, ahead/behind counts, and one-click actions
- **Commit All** — stage everything and commit with a message
- **Push / Pull** — shown only when there's something to push or pull
- **Switch Branch** — quick-pick dropdown of all branches
- **Stage / Unstage** — click a file row to toggle
- **Stash Changes** — stash all changes (including untracked)
- **Undo Last Commit** — soft reset, changes stay staged

## Usage

Open any Git repository. The easyGit panel appears in the Activity Bar (source-control icon).

## Development

```bash
npm install        # install dependencies
npm run build      # compile with esbuild
npm run watch      # watch mode for development
npm run package    # build a .vsix installer
```

Press **F5** in VS Code to launch the Extension Development Host.

## License

MIT