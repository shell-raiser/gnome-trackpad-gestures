import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class TrackpadGesturesPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let settings = null;

        try {
            settings = this.getSettings();
        } catch (_error) {
            settings = null;
        }

        const page = new Adw.PreferencesPage();

        if (!settings) {
            const errorGroup = new Adw.PreferencesGroup({
                title: 'Settings schema not available',
                description: 'Run glib-compile-schemas in the extension schemas directory and reopen preferences.',
            });
            page.add(errorGroup);
            window.add(page);
            return;
        }

        const gestureGroup = new Adw.PreferencesGroup({
            title: '3-Finger Window Switching',
            description: 'Tune sensitivity, duration threshold, and preview size.',
        });

        gestureGroup.add(this._spinRow('Swipe gain', settings, 'swipe-gain', 0.2, 4.0, 0.1, 1));
        gestureGroup.add(this._spinRow('Pixels per step', settings, 'pixels-per-step', 40, 600, 10, 0));
        gestureGroup.add(this._spinRow('Long swipe duration (ms)', settings, 'long-swipe-duration-ms', 80, 800, 10, 0));
        gestureGroup.add(this._spinRow('Preview size (%)', settings, 'preview-scale', 40, 180, 5, 0));
        gestureGroup.add(this._switchRow('Follow GNOME Alt+Tab window scope', settings, 'respect-gnome-window-switcher'));
        gestureGroup.add(this._switchRow('Fallback: current workspace only', settings, 'fallback-current-workspace-only'));

        const fourFingerGroup = new Adw.PreferencesGroup({
            title: '4-Finger Add-ons',
            description: 'GNOME default swipe behavior stays active; these add optional tap/down actions.',
        });

        fourFingerGroup.add(this._switchRow('4-finger tap opens notification list', settings, 'four-finger-tap-notifications'));
        fourFingerGroup.add(this._switchRow('4-finger swipe down shows desktop', settings, 'four-finger-swipe-down-show-desktop'));

        page.add(gestureGroup);
        page.add(fourFingerGroup);
        window.add(page);
    }

    _spinRow(title, settings, key, min, max, step, digits) {
        const row = new Adw.ActionRow({title});
        const adjustment = new Gtk.Adjustment({
            lower: min,
            upper: max,
            step_increment: step,
            page_increment: step,
            value: settings.get_value(key).deepUnpack(),
        });

        const spin = new Gtk.SpinButton({adjustment, digits, valign: Gtk.Align.CENTER});
        spin.connect('value-changed', w => {
            if (digits > 0)
                settings.set_double(key, w.get_value());
            else
                settings.set_int(key, w.get_value_as_int());
        });

        row.add_suffix(spin);
        row.activatable_widget = spin;
        return row;
    }

    _switchRow(title, settings, key) {
        const row = new Adw.ActionRow({title});
        const sw = new Gtk.Switch({active: settings.get_boolean(key), valign: Gtk.Align.CENTER});
        sw.connect('notify::active', w => settings.set_boolean(key, w.active));
        row.add_suffix(sw);
        row.activatable_widget = sw;
        return row;
    }
}
