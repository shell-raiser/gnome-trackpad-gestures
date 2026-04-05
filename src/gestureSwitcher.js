import Clutter from 'gi://Clutter';
import Meta from 'gi://Meta';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {PreviewSwitcherPopup} from './previewPopup.js';

/**
 * Gesture-driven MRU switcher:
 * - One long swipe can step through multiple windows.
 * - Selection updates continuously during the active gesture.
 * - Activation only happens on gesture end.
 */
export class GestureSwitcherController {
    constructor() {
        this._stageCaptureId = 0;
        this._popup = null;

        this._sessionActive = false;
        this._windows = [];
        this._anchorIndex = 0;
        this._selectedIndex = 0;
        this._accumulatedDx = 0;

        // Pixels needed to move one MRU slot. Tuned for touchpad long-swipes.
        this._pixelsPerStep = 140;
    }

    enable() {
        if (this._stageCaptureId)
            return;

        this._stageCaptureId = global.stage.connect(
            'captured-event',
            this._onCapturedEvent.bind(this)
        );
    }

    disable() {
        if (this._stageCaptureId) {
            global.stage.disconnect(this._stageCaptureId);
            this._stageCaptureId = 0;
        }

        this._cancelSession();
    }

    _onCapturedEvent(_actor, event) {
        if (!this._isThreeFingerTouchpadEvent(event))
            return Clutter.EVENT_PROPAGATE;

        const type = event.type();

        if (type === Clutter.EventType.TOUCHPAD_SWIPE) {
            const phase = event.get_gesture_phase();

            if (phase === Clutter.TouchpadGesturePhase.BEGIN)
                return this._beginSession();

            if (phase === Clutter.TouchpadGesturePhase.UPDATE)
                return this._updateSession(event);

            if (phase === Clutter.TouchpadGesturePhase.END)
                return this._finishSession();

            if (phase === Clutter.TouchpadGesturePhase.CANCEL)
                return this._cancelSession();
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _isThreeFingerTouchpadEvent(event) {
        if (event.type() !== Clutter.EventType.TOUCHPAD_SWIPE)
            return false;

        return event.get_touchpad_gesture_finger_count() === 3;
    }

    _beginSession() {
        this._windows = this._getMruWindows();

        if (this._windows.length < 2)
            return Clutter.EVENT_PROPAGATE;

        this._sessionActive = true;
        this._anchorIndex = 0;
        this._selectedIndex = 0;
        this._accumulatedDx = 0;

        this._ensurePopup();
        this._popup.open(this._windows, this._selectedIndex);

        return Clutter.EVENT_STOP;
    }

    _updateSession(event) {
        if (!this._sessionActive)
            return Clutter.EVENT_PROPAGATE;

        const [dx] = event.get_gesture_motion_delta();
        this._accumulatedDx += dx;

        const rawStepOffset = Math.trunc(-this._accumulatedDx / this._pixelsPerStep);
        const unclampedIndex = this._anchorIndex + rawStepOffset;

        const maxIndex = this._windows.length - 1;
        this._selectedIndex = Math.max(0, Math.min(maxIndex, unclampedIndex));

        this._popup.updateSelection(this._selectedIndex, this._normalizedProgress());

        return Clutter.EVENT_STOP;
    }

    _finishSession() {
        if (!this._sessionActive)
            return Clutter.EVENT_PROPAGATE;

        const targetWindow = this._windows[this._selectedIndex];

        if (targetWindow)
            Main.activateWindow(targetWindow);

        this._endCommon();
        return Clutter.EVENT_STOP;
    }

    _cancelSession() {
        if (!this._sessionActive)
            return Clutter.EVENT_PROPAGATE;

        this._endCommon();
        return Clutter.EVENT_STOP;
    }

    _endCommon() {
        this._sessionActive = false;
        this._windows = [];
        this._anchorIndex = 0;
        this._selectedIndex = 0;
        this._accumulatedDx = 0;

        this._popup?.close();
    }

    _normalizedProgress() {
        if (!this._windows.length)
            return 0;

        const maxIndex = this._windows.length - 1;
        const span = Math.max(1, maxIndex * this._pixelsPerStep);
        const progress = Math.min(1, Math.max(0, -this._accumulatedDx / span));
        return progress;
    }

    _ensurePopup() {
        if (!this._popup)
            this._popup = new PreviewSwitcherPopup();
    }

    _getMruWindows() {
        return global.display
            .get_tab_list(Meta.TabList.NORMAL_ALL, null)
            .filter(window => !window.skip_taskbar);
    }
}
