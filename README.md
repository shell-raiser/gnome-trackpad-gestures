# gnome-trackpad-gestures
I've vibe coded this extension since the next best touchpad gestures extension (https://github.com/amarullz/windowgestures) was not enough for me.
I am using this extension and will keep fixing bugs whenever I discover one. You can try it if you want to (maybe I'll setup a Action to give a packed zip?)

I want the touchpad gestures to work as similar as the gestures in Windows, that's the goal.

I have'nt  tried to look at any of this code right now, may be I'll review it after a certain stage.

-----
GNOME Shell extension prototype focused on touchpad window switching.

## Expected behavior

- A **short 3-finger swipe** switches to the next recent window directly (no popup).
- A **long 3-finger swipe** enters multi-window selection and shows the preview popup.
- Short-vs-long is determined by **swipe duration**, not distance.
- **4-finger swipes are left to GNOME default behavior** (native direction + animation).
- Swiping direction maps directly to list movement (left swipe goes left, right swipe goes right).
- Selection clamps at the list edges (no wrap-around).

## Installation

### Option 1: From GitHub Releases (Easiest)

1. Download the latest `gnome-trackpad-gestures.zip` from [GitHub Releases](https://github.com/amarullz/windowgestures/releases)
2. Extract it to your extensions directory:
   ```bash
   UUID="gnome-trackpad-gestures@example.com"
   DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
   mkdir -p "$DEST"
   unzip gnome-trackpad-gestures.zip -d "$DEST"
   glib-compile-schemas "$DEST/schemas"
   ```
3. Enable the extension:
   ```bash
   gnome-extensions enable "$UUID"
   ```
4. Reload the shell:
   - On X11: press `Alt+F2`, run `r` to reload shell
   - On Wayland: log out and back in

### Option 2: Manual Installation from Source

1. Clone or download the repository
2. Install the extension:
   ```bash
   UUID="gnome-trackpad-gestures@example.com"
   DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
   mkdir -p "$DEST"
   cp -r extension.js prefs.js metadata.json stylesheet.css src schemas "$DEST"/
   glib-compile-schemas "$DEST/schemas"
   gnome-extensions enable "$UUID"
   ```
3. Reload the shell:
   - On X11: press `Alt+F2`, run `r` to reload shell
   - On Wayland: log out and back in

### Uninstall

```bash
UUID="gnome-trackpad-gestures@example.com"
gnome-extensions disable "$UUID"
gnome-extensions uninstall "$UUID"
# Or manually remove:
# rm -rf ~/.local/share/gnome-shell/extensions/$UUID
```

## Settings

Open **Extensions** app → this extension → **Preferences** to tune:
- swipe sensitivity (`swipe-gain`, `pixels-per-step`)
- long-swipe duration threshold (`long-swipe-duration-ms`)
- preview thumbnail size (`preview-width`, `preview-height`)
- automatic down-scaling when many windows are open so the popup fits on screen

Tested target shell range in metadata: GNOME Shell 45-49.

