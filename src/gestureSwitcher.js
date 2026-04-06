import Clutter from 'gi://Clutter';
import Meta from 'gi://Meta';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {PreviewSwitcherPopup} from './previewPopup.js';

export class GestureSwitcherController {
    constructor(settings) {
        this._settings = settings;
        this._stageCaptureId = 0;
        this._popup = null;

        this._sessionActive = false;
        this._popupVisible = false;
        this._gestureStartUsec = 0;
        this._windows = [];
        this._anchorIndex = 0;
        this._selectedIndex = 0;
        this._accumulatedDx = 0;

        this._pixelsPerStep = 140;
        this._swipeGain = 1;
        this._longSwipeDurationMs = 220;
        this._wrapSelection = false;
    }

    enable() {
        if (this._stageCaptureId)
            return;

        this._stageCaptureId = global.stage.connect('captured-event', this._onCapturedEvent.bind(this));
    }

    disable() {
        if (this._stageCaptureId) {
            global.stage.disconnect(this._stageCaptureId);
            this._stageCaptureId = 0;
        }

        this._cancelSession();
    }

    _loadSettings() {
        if (!this._settings)
            return;

        this._swipeGain = this._settings.get_double('swipe-gain');
        this._pixelsPerStep = this._settings.get_int('pixels-per-step');
        this._longSwipeDurationMs = this._settings.get_int('long-swipe-duration-ms');
    }

    _onCapturedEvent(_actor, event) {
        if (event.type() !== Clutter.EventType.TOUCHPAD_SWIPE)
            return Clutter.EVENT_PROPAGATE;

        const fingers = event.get_touchpad_gesture_finger_count();

        // Keep 4-finger behavior fully default GNOME (workspace swipe animation + direction).
        if (fingers === 4)
            return Clutter.EVENT_PROPAGATE;

        if (fingers !== 3)
            return Clutter.EVENT_PROPAGATE;

        const phase = event.get_gesture_phase();

        if (phase === Clutter.TouchpadGesturePhase.BEGIN)
            return this._beginSession();

        if (phase === Clutter.TouchpadGesturePhase.UPDATE)
            return this._updateSession(event);

        if (phase === Clutter.TouchpadGesturePhase.END)
            return this._finishSession();

        if (phase === Clutter.TouchpadGesturePhase.CANCEL)
            return this._cancelSession();

        return Clutter.EVENT_PROPAGATE;
    }

    _beginSession() {
        this._windows = this._getMruWindows();

        if (this._windows.length < 2)
            return Clutter.EVENT_PROPAGATE;

        this._loadSettings();

        this._sessionActive = true;
        this._popupVisible = false;
        this._gestureStartUsec = GLib.get_monotonic_time();
        this._anchorIndex = 0;
        this._selectedIndex = 0;
        this._accumulatedDx = 0;

        this._ensurePopup();
        this._popup.configureFromSettings();
        return Clutter.EVENT_STOP;
    }

    _updateSession(event) {
        if (!this._sessionActive)
            return Clutter.EVENT_PROPAGATE;

        const [dx] = event.get_gesture_motion_delta();
        this._accumulatedDx += dx * this._swipeGain;

        const rawSteps = Math.trunc(this._accumulatedDx / this._pixelsPerStep);
        const minSteps = -this._anchorIndex;
        const maxSteps = (this._windows.length - 1) - this._anchorIndex;
        const clampedSteps = Math.max(minSteps, Math.min(maxSteps, rawSteps));

        if (clampedSteps !== rawSteps)
            this._accumulatedDx = clampedSteps * this._pixelsPerStep;

        this._selectedIndex = this._offsetIndex(this._anchorIndex, clampedSteps);

        const elapsedMs = this._elapsedGestureMs();
        const longSwipeReached = elapsedMs >= this._longSwipeDurationMs;

        if (!this._popupVisible && longSwipeReached && Math.abs(clampedSteps) >= 1) {
            this._popup.open(this._windows, this._selectedIndex);
            this._popupVisible = true;
        }

        if (this._popupVisible)
            this._popup.updateSelection(this._selectedIndex, this._normalizedProgress());

        return Clutter.EVENT_STOP;
    }

    _offsetIndex(start, offset) {
        const length = this._windows.length;
        if (!length)
            return 0;

        if (!this._wrapSelection)
            return Math.max(0, Math.min(length - 1, start + offset));

        return ((start + offset) % length + length) % length;
    }

    _finishSession() {
        if (!this._sessionActive)
            return Clutter.EVENT_PROPAGATE;

        const isLongSwipe = this._elapsedGestureMs() >= this._longSwipeDurationMs;

        if (!isLongSwipe) {
            if (Math.abs(this._accumulatedDx) > 0)
                this._selectedIndex = this._offsetIndex(0, 1);
        }

        const targetWindow = this._windows[this._selectedIndex];
        if (targetWindow)
            Main.activateWindow(targetWindow);

        this._endCommon();
        return Clutter.EVENT_STOP;
    }

    _elapsedGestureMs() {
        if (!this._gestureStartUsec)
            return 0;

        return Math.floor((GLib.get_monotonic_time() - this._gestureStartUsec) / 1000);
    }

    _cancelSession() {
        if (!this._sessionActive)
            return Clutter.EVENT_PROPAGATE;

        this._endCommon();
        return Clutter.EVENT_STOP;
    }

    _endCommon() {
        this._sessionActive = false;
        this._popupVisible = false;
        this._gestureStartUsec = 0;
        this._windows = [];
        this._anchorIndex = 0;
        this._selectedIndex = 0;
        this._accumulatedDx = 0;

        this._popup?.close();
    }

    _normalizedProgress() {
        if (!this._windows.length)
            return 0;

        const span = Math.max(this._pixelsPerStep, (this._windows.length - 1) * this._pixelsPerStep);
        return Math.min(1, Math.max(0, Math.abs(this._accumulatedDx) / span));
    }

    _ensurePopup() {
        if (!this._popup)
            this._popup = new PreviewSwitcherPopup(this._settings);
    }

    _getMruWindows() {
        return global.display
            .get_tab_list(Meta.TabList.NORMAL_ALL, null)
            .filter(window => !window.skip_taskbar && !window.minimized);
    }
}
