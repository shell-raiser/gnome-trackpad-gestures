import Clutter from 'gi://Clutter';
import St from 'gi://St';
import Shell from 'gi://Shell';
import Pango from 'gi://Pango';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export class PreviewSwitcherPopup {
    constructor(settings) {
        this._settings = settings;
        this._container = null;
        this._items = [];
        this._selectedIndex = 0;

        this._baseThumbHeight = 160;
        this._previewScale = 100;
        this._itemSpacing = 18;
        this._horizontalPadding = 80;
        this._maxMonitorUsage = 0.92;
        this._itemSizes = [];
    }

    configureFromSettings() {
        if (!this._settings)
            return;

        this._previewScale = this._settings.get_int('preview-scale');
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
            visible: true,
        });

        this._computeItemSizes(windows);

        windows.forEach((window, index) => {
            const item = this._buildWindowItem(window, index);
            this._items.push(item);
            this._container.add_child(item.root);
        });

        Main.layoutManager.addTopChrome(this._container, {trackFullscreen: false});
        this._layoutCentered();

        this._container.opacity = 0;
        this._container.ease({
            opacity: 255,
            duration: 120,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });

        this._applySelection();
    }

    updateSelection(selectedIndex, _progress) {
        this._selectedIndex = selectedIndex;
        this._applySelection();
    }

    close() {
        if (!this._container)
            return;

        Main.layoutManager.removeChrome(this._container);
        this._container.destroy();
        this._container = null;
        this._items = [];
        this._itemSizes = [];
        this._selectedIndex = 0;
    }

    _computeItemSizes(windows) {
        const height = Math.max(72, Math.floor(this._baseThumbHeight * (this._previewScale / 100)));
        const rawSizes = windows.map(window => {
            const actor = window.get_compositor_private?.();
            const aw = actor?.width ?? 16;
            const ah = actor?.height ?? 10;
            const aspect = ah > 0 ? aw / ah : 1.6;
            return {
                width: Math.max(100, Math.floor(height * aspect)),
                height,
            };
        });

        const monitor = Main.layoutManager.currentMonitor;
        const maxWidth = Math.floor((monitor?.width ?? 1920) * this._maxMonitorUsage);
        const spacing = (rawSizes.length - 1) * this._itemSpacing + this._horizontalPadding;
        const contentWidth = rawSizes.reduce((sum, size) => sum + size.width, 0);
        const totalWidth = contentWidth + spacing;

        const fitScale = totalWidth > maxWidth ? maxWidth / totalWidth : 1;

        this._itemSizes = rawSizes.map(size => ({
            width: Math.max(100, Math.floor(size.width * fitScale)),
            height: Math.max(72, Math.floor(size.height * fitScale)),
        }));
    }

    _buildWindowItem(window, index) {
        const size = this._itemSizes[index];

        const root = new St.BoxLayout({
            style_class: 'preview-switcher-item',
            vertical: true,
            width: size.width,
            x_expand: false,
        });

        const thumbBin = new St.Bin({
            style_class: 'preview-switcher-thumb-bin',
            width: size.width,
            height: size.height,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });

        thumbBin.set_child(this._buildThumbnailActor(window, size));

        const title = new St.Label({
            style_class: 'preview-switcher-title',
            text: window.get_title() || 'Untitled',
            width: size.width,
            x_align: Clutter.ActorAlign.CENTER,
        });
        title.clutter_text.ellipsize = Pango.EllipsizeMode.END;
        title.clutter_text.single_line_mode = true;

        root.add_child(thumbBin);
        root.add_child(title);

        return {root, window};
    }

    _buildThumbnailActor(window, size) {
        const compositorActor = window.get_compositor_private?.();

        if (compositorActor && compositorActor.width > 0 && compositorActor.height > 0) {
            return new Clutter.Clone({
                source: compositorActor,
                reactive: false,
                width: size.width,
                height: size.height,
                x_align: Clutter.ActorAlign.FILL,
                y_align: Clutter.ActorAlign.FILL,
            });
        }

        const fallback = new St.BoxLayout({
            style_class: 'preview-switcher-fallback',
            vertical: true,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });

        const app = Shell.WindowTracker.get_default().get_window_app(window);
        const iconSize = Math.max(24, Math.floor(size.height * 0.35));
        const icon = app?.create_icon_texture?.(iconSize);
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
