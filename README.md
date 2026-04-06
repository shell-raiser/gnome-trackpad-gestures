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
- If only one window is available, short swipe stays on the same window; long swipe still shows a one-window popup.
- 3-finger swipe down shows desktop.
- 4-finger swipes preserve GNOME default behavior (workspace/overview) unless optional down/tap add-ons are enabled.
- Window list scope follows GNOME Alt+Tab current-workspace setting (or extension fallback setting).

## Optional 4-finger add-ons

- 4-finger tap opens notification list.
- 4-finger swipe down shows desktop.

## Install locally

```bash
UUID="gnome-trackpad-gestures@example.com"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
cp -r extension.js prefs.js metadata.json stylesheet.css src schemas "$DEST"/
glib-compile-schemas "$DEST/schemas"   # safe to run even though gschemas.compiled is bundled
gnome-extensions enable "$UUID"
```

On X11: press `Alt+F2`, run `r` to reload shell.
On Wayland: log out and back in.

## Settings

Open **Extensions** app → this extension → **Preferences** to tune:
- swipe sensitivity (`swipe-gain`, `pixels-per-step`)
- long-swipe duration threshold (`long-swipe-duration-ms`)
- preview size (`preview-scale`) preserving original window aspect ratio
- follow GNOME Alt+Tab scope or use fallback current-workspace-only filter
- optional 4-finger tap/down add-ons

Tested target shell range in metadata: GNOME Shell 45-49.
