# Implementation notes

## Gesture handling fixes

To address "only left swipe partially works" symptoms, this version does:

- Start a gesture session on `TOUCHPAD_SWIPE BEGIN` and open popup immediately.
- Use cumulative horizontal motion for index selection.
- Scale `pixelsPerStep` from monitor width so short and long swipes map predictably.
- Support both swipe directions with wrapped indexing.

## Popup rendering

- Popup is created at session begin and destroyed at session end/cancel.
- Selection highlight updates every gesture update.
- Thumbnail priority:
  1) compositor texture clone (`Clutter.Clone`)
  2) app icon + app title fallback
