import Clutter from 'gi://Clutter';
import Meta from 'gi://Meta';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
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
        this._accumulatedDy = 0;

        this._fourFingerActive = false;
        this._fourFingerDx = 0;
        this._fourFingerDy = 0;

        this._pixelsPerStep = 140;
        this._swipeGain = 1;
        this._longSwipeDurationMs = 220;
        this._wrapSelection = false;

        this._fourFingerTapNotifications = true;
        this._fourFingerSwipeDownShowDesktop = true;
        this._respectGnomeWindowSwitcher = true;
        this._fallbackCurrentWorkspaceOnly = true;
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
        this._fourFingerActive = false;
    }

    _loadSettings() {
        if (!this._settings)
            return;

        this._swipeGain = this._settings.get_double('swipe-gain');
        this._pixelsPerStep = this._settings.get_int('pixels-per-step');
        this._longSwipeDurationMs = this._settings.get_int('long-swipe-duration-ms');

        this._fourFingerTapNotifications = this._settings.get_boolean('four-finger-tap-notifications');
        this._fourFingerSwipeDownShowDesktop = this._settings.get_boolean('four-finger-swipe-down-show-desktop');

        this._respectGnomeWindowSwitcher = this._settings.get_boolean('respect-gnome-window-switcher');
        this._fallbackCurrentWorkspaceOnly = this._settings.get_boolean('fallback-current-workspace-only');
    }

    _onCapturedEvent(_actor, event) {
        if (event.type() !== Clutter.EventType.TOUCHPAD_SWIPE)
            return Clutter.EVENT_PROPAGATE;

        this._loadSettings();

        const fingers = event.get_touchpad_gesture_finger_count();
        if (fingers === 4)
            return this._handleFourFingerGesture(event);

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

    _handleFourFingerGesture(event) {
        const phase = event.get_gesture_phase();

        if (phase === Clutter.TouchpadGesturePhase.BEGIN) {
            this._fourFingerActive = true;
            this._fourFingerDx = 0;
            this._fourFingerDy = 0;
            return Clutter.EVENT_PROPAGATE;
        }

        if (phase === Clutter.TouchpadGesturePhase.UPDATE) {
            if (!this._fourFingerActive)
                return Clutter.EVENT_PROPAGATE;

            const [dx, dy] = event.get_gesture_motion_delta();
            this._fourFingerDx += dx;
            this._fourFingerDy += dy;
            return Clutter.EVENT_PROPAGATE;
        }

        if (phase === Clutter.TouchpadGesturePhase.END) {
            if (!this._fourFingerActive)
                return Clutter.EVENT_PROPAGATE;

            this._fourFingerActive = false;
            return this._runFourFingerAddons();
        }

        if (phase === Clutter.TouchpadGesturePhase.CANCEL) {
            this._fourFingerActive = false;
            return Clutter.EVENT_PROPAGATE;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _runFourFingerAddons() {
        const absX = Math.abs(this._fourFingerDx);
        const absY = Math.abs(this._fourFingerDy);
        const tapThreshold = 12;
        const downThreshold = 80;

        if (absX < tapThreshold && absY < tapThreshold && this._fourFingerTapNotifications) {
            Main.panel.statusArea.dateMenu.menu.open();
            return Clutter.EVENT_STOP;
        }

        const isVertical = absY > absX;
        if (isVertical && this._fourFingerDy > downThreshold && this._fourFingerSwipeDownShowDesktop) {
            if (Main.overview.visible)
                return Clutter.EVENT_PROPAGATE;

            this._showDesktopCurrentWorkspace();
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _showDesktopCurrentWorkspace() {
        const workspace = global.workspace_manager.get_active_workspace();
        workspace.list_windows().forEach(window => {
            if (!window.skip_taskbar && !window.minimized)
                window.minimize();
        });
    }

    _beginSession() {
        this._windows = this._getMruWindows();

        if (this._windows.length < 1)
            return Clutter.EVENT_PROPAGATE;

        this._sessionActive = true;
        this._popupVisible = false;
        this._gestureStartUsec = GLib.get_monotonic_time();
        this._anchorIndex = 0;
        this._selectedIndex = 0;
        this._accumulatedDx = 0;
        this._accumulatedDy = 0;

        this._ensurePopup();
        this._popup.configureFromSettings();
        return Clutter.EVENT_STOP;
    }

    _updateSession(event) {
        if (!this._sessionActive)
            return Clutter.EVENT_PROPAGATE;

        const [dx, dy] = event.get_gesture_motion_delta();
        this._accumulatedDx += dx * this._swipeGain;
        this._accumulatedDy += dy * this._swipeGain;

        const rawSteps = Math.trunc(this._accumulatedDx / this._pixelsPerStep);
        const minSteps = -this._anchorIndex;
        const maxSteps = (this._windows.length - 1) - this._anchorIndex;
        const clampedSteps = Math.max(minSteps, Math.min(maxSteps, rawSteps));

        if (clampedSteps !== rawSteps)
            this._accumulatedDx = clampedSteps * this._pixelsPerStep;

        this._selectedIndex = this._offsetIndex(this._anchorIndex, clampedSteps);

        const elapsedMs = this._elapsedGestureMs();
        const longSwipeReached = elapsedMs >= this._longSwipeDurationMs;

        if (!this._popupVisible && longSwipeReached && (this._windows.length === 1 || Math.abs(clampedSteps) >= 1)) {
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

        const isVertical = Math.abs(this._accumulatedDy) > Math.abs(this._accumulatedDx);
        if (isVertical && this._accumulatedDy > 80) {
            if (Main.overview.visible) {
                this._endCommon();
                return Clutter.EVENT_PROPAGATE;
            }

            this._showDesktopCurrentWorkspace();
            this._endCommon();
            return Clutter.EVENT_STOP;
        }

        const isLongSwipe = this._elapsedGestureMs() >= this._longSwipeDurationMs;

        if (!isLongSwipe) {
            if (this._windows.length >= 2 && Math.abs(this._accumulatedDx) > 0)
                this._selectedIndex = this._offsetIndex(0, 1);
            else
                this._selectedIndex = 0;
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
        this._accumulatedDy = 0;

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
        let windows = global.display
            .get_tab_list(Meta.TabList.NORMAL_ALL, null)
            .filter(window => !window.skip_taskbar);

        const currentWorkspaceOnly = this._shouldUseCurrentWorkspaceOnly();
        if (currentWorkspaceOnly) {
            const activeWorkspace = global.workspace_manager.get_active_workspace();
            windows = windows.filter(window => window.get_workspace() === activeWorkspace);
        }

        return windows;
    }

    _shouldUseCurrentWorkspaceOnly() {
        if (!this._respectGnomeWindowSwitcher)
            return this._fallbackCurrentWorkspaceOnly;

        try {
            const shellSwitcher = new Gio.Settings({schema: 'org.gnome.shell.window-switcher'});
            return shellSwitcher.get_boolean('current-workspace-only');
        } catch (_error) {
            return this._fallbackCurrentWorkspaceOnly;
        }
    }
}