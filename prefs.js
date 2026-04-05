import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class TrackpadGesturesPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: 'Gesture Tuning',
            description: 'Adjust swipe sensitivity and preview size.',
        });

        group.add(this._spinRow('Swipe gain', settings, 'swipe-gain', 0.2, 4.0, 0.1, 1));
        group.add(this._spinRow('Pixels per step', settings, 'pixels-per-step', 40, 600, 10, 0));
        group.add(this._spinRow('Popup reveal steps', settings, 'popup-reveal-steps', 2, 8, 1, 0));
        group.add(this._spinRow('Short swipe distance', settings, 'short-swipe-distance', 10, 200, 5, 0));
        group.add(this._spinRow('Preview width', settings, 'preview-width', 120, 600, 10, 0));
        group.add(this._spinRow('Preview height', settings, 'preview-height', 90, 480, 10, 0));

        page.add(group);
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

        const spin = new Gtk.SpinButton({
            adjustment,
            digits,
            valign: Gtk.Align.CENTER,
        });

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
}
