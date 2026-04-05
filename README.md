# gnome-trackpad-gestures

GNOME Shell extension prototype focused on touchpad window switching.

## Expected behavior

- A **short swipe** switches to the next recent window directly (no popup).
- A **long swipe** enters multi-window selection and shows the preview popup.
- Swiping direction maps directly to list movement (left swipe goes left, right swipe goes right).
- Selection clamps at the list edges (no wrap-around).

## Install locally

```bash
UUID="gnome-trackpad-gestures@example.com"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
mkdir -p "$DEST/schemas"
cp -r extension.js prefs.js metadata.json stylesheet.css src "$DEST"/
cp schemas/org.gnome.shell.extensions.gnome-trackpad-gestures.gschema.xml "$DEST/schemas"/
glib-compile-schemas "$DEST/schemas"
gnome-extensions enable "$UUID"
```

On X11: press `Alt+F2`, run `r` to reload shell.
On Wayland: log out and back in.

## Settings

Open **Extensions** app → this extension → **Preferences** to tune:
- swipe sensitivity (`swipe-gain`, `pixels-per-step`)
- long-swipe popup threshold (`popup-reveal-steps`)
- short-swipe threshold (`short-swipe-distance`)
- preview thumbnail size (`preview-width`, `preview-height`)

Tested target shell range in metadata: GNOME Shell 45-49.
