import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {GestureSwitcherController} from './src/gestureSwitcher.js';

export default class TrackpadGestureWindowSwitcherExtension extends Extension {
    enable() {
        try {
            this._settings = this.getSettings();
        } catch (_error) {
            this._settings = null;
            console.warn('[gnome-trackpad-gestures] Could not load GSettings schema. Using built-in defaults.');
        }

        this._controller = new GestureSwitcherController(this._settings);
        this._controller.enable();
    }

    disable() {
        this._controller?.disable();
        this._controller = null;
        this._settings = null;
    }
}
