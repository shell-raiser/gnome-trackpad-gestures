import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {GestureSwitcherController} from './src/gestureSwitcher.js';

export default class TrackpadGestureWindowSwitcherExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._controller = new GestureSwitcherController(this._settings);
        this._controller.enable();
    }

    disable() {
        this._controller?.disable();
        this._controller = null;
        this._settings = null;
    }
}
