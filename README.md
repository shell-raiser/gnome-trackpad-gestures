# gnome-trackpad-gestures

GNOME Shell extension prototype focused on touchpad window switching.

## Expected behavior

- A **single continuous 3-finger swipe** can move across multiple windows.
- The switcher popup appears immediately on swipe begin and updates while swiping.
- Swiping left/right changes selection in both directions.
- Releasing fingers activates the currently selected window.

## Install locally

```bash
UUID="gnome-trackpad-gestures@example.com"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
mkdir -p "$DEST"
cp -r extension.js metadata.json stylesheet.css src "$DEST"/
gnome-extensions enable "$UUID"
```

On X11: press `Alt+F2`, run `r` to reload shell.
On Wayland: log out and back in.


Tested target shell range in metadata: GNOME Shell 45-49.
