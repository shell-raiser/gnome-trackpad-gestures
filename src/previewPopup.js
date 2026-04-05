import Clutter from 'gi://Clutter';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

/**
 * Popup with window icons + previews.
 * Thumbnail strategy:
 * - First preference: compositor texture clone when available.
 * - Fallback: app icon only.
 */
export class PreviewSwitcherPopup {
    constructor() {
        this._container = null;
        this._items = [];
        this._selectedIndex = 0;

        this._thumbWidth = 220;
        this._thumbHeight = 140;
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
            duration: 100,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });

        this._layoutCentered();
        this._applySelection();
    }

    updateSelection(selectedIndex, progress) {
        this._selectedIndex = selectedIndex;
        this._applySelection();

        if (this._container)
            this._container.set_pivot_point(progress, 0.5);
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
        });

        const thumbBin = new St.Bin({
            style_class: 'preview-switcher-thumb-bin',
            width: this._thumbWidth,
            height: this._thumbHeight,
        });

        thumbBin.set_child(this._buildThumbnailActor(window));

        const title = new St.Label({
            style_class: 'preview-switcher-title',
            text: window.get_title() || 'Untitled',
            y_align: Clutter.ActorAlign.CENTER,
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

        const app = window.get_wm_class_instance?.();
        return new St.Label({
            style_class: 'preview-switcher-fallback',
            text: app || 'No preview',
        });
    }

    _layoutCentered() {
        if (!this._container)
            return;

        const monitor = Main.layoutManager.currentMonitor;
        const [width, height] = this._container.get_preferred_size();

        this._container.set_position(
            Math.floor(monitor.x + (monitor.width - width) / 2),
            Math.floor(monitor.y + (monitor.height - height) / 2)
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
