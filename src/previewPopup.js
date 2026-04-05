import Clutter from 'gi://Clutter';
import St from 'gi://St';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

/**
 * Popup with window previews.
 */
export class PreviewSwitcherPopup {
    constructor() {
        this._container = null;
        this._items = [];
        this._selectedIndex = 0;

        this._thumbWidth = 260;
        this._thumbHeight = 160;
    }

    open(windows, selectedIndex) {
        this.close();

        this._selectedIndex = selectedIndex;
        this._container = new St.BoxLayout({
            style_class: 'preview-switcher-popup',
            vertical: false,
            reactive: false,
            can_focus: false,
            track_hover: false,
        });

        windows.forEach(window => {
            const item = this._buildWindowItem(window);
            this._items.push(item);
            this._container.add_child(item.root);
        });

        Main.layoutManager.uiGroup.add_child(this._container);
        this._container.opacity = 0;
        this._container.ease({
            opacity: 255,
            duration: 120,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });

        this._layoutCentered();
        this._applySelection();
    }

    updateSelection(selectedIndex, _progress) {
        this._selectedIndex = selectedIndex;
        this._applySelection();
    }

    close() {
        if (!this._container)
            return;

        this._container.destroy();
        this._container = null;
        this._items = [];
        this._selectedIndex = 0;
    }

    _buildWindowItem(window) {
        const root = new St.BoxLayout({
            style_class: 'preview-switcher-item',
            vertical: true,
            x_expand: true,
        });

        const thumbBin = new St.Bin({
            style_class: 'preview-switcher-thumb-bin',
            width: this._thumbWidth,
            height: this._thumbHeight,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });

        thumbBin.set_child(this._buildThumbnailActor(window));

        const title = new St.Label({
            style_class: 'preview-switcher-title',
            text: window.get_title() || 'Untitled',
            x_align: Clutter.ActorAlign.CENTER,
        });

        root.add_child(thumbBin);
        root.add_child(title);

        return {root, window};
    }

    _buildThumbnailActor(window) {
        const compositorActor = window.get_compositor_private?.();
        const texture = compositorActor?.get_texture?.();

        if (texture) {
            return new Clutter.Clone({
                source: texture,
                reactive: false,
                width: this._thumbWidth,
                height: this._thumbHeight,
            });
        }

        const fallback = new St.BoxLayout({
            style_class: 'preview-switcher-fallback',
            vertical: true,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });

        const app = Shell.WindowTracker.get_default().get_window_app(window);
        const icon = app?.create_icon_texture?.(64);
        if (icon)
            fallback.add_child(icon);

        fallback.add_child(new St.Label({
            text: app?.get_name?.() || window.get_wm_class() || 'Preview unavailable',
        }));

        return fallback;
    }

    _layoutCentered() {
        if (!this._container)
            return;

        const monitor = Main.layoutManager.currentMonitor;
        const [, , natWidth, natHeight] = this._container.get_preferred_size();

        this._container.set_position(
            Math.floor(monitor.x + (monitor.width - natWidth) / 2),
            Math.floor(monitor.y + (monitor.height - natHeight) / 2)
        );
    }

    _applySelection() {
        this._items.forEach((item, index) => {
            item.root.remove_style_pseudo_class('selected');
            if (index === this._selectedIndex)
                item.root.add_style_pseudo_class('selected');
        });
    }
}
