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

        this._thumbWidth = 260;
        this._thumbHeight = 160;
        this._renderThumbWidth = 260;
        this._renderThumbHeight = 160;
        this._itemSpacing = 18;
        this._horizontalPadding = 80;
        this._maxMonitorUsage = 0.92;
    }

    configureFromSettings() {
        if (!this._settings)
            return;

        this._thumbWidth = this._settings.get_int('preview-width');
        this._thumbHeight = this._settings.get_int('preview-height');
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

        this._computeRenderSize(windows.length);

        windows.forEach(window => {
            const item = this._buildWindowItem(window);
            this._items.push(item);
            this._container.add_child(item.root);
        });

        Main.layoutManager.addTopChrome(this._container);
        this._layoutCentered(windows.length);

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
        this._selectedIndex = 0;
    }

    _computeRenderSize(windowCount) {
        const monitor = Main.layoutManager.currentMonitor;
        const maxWidth = Math.floor((monitor?.width ?? 1920) * this._maxMonitorUsage);
        const totalSpacing = (windowCount - 1) * this._itemSpacing + this._horizontalPadding;
        const availableForThumbs = Math.max(120, maxWidth - totalSpacing);
        const maxPerItem = Math.floor(availableForThumbs / Math.max(1, windowCount));

        const scale = Math.min(1, maxPerItem / this._thumbWidth);

        this._renderThumbWidth = Math.max(100, Math.floor(this._thumbWidth * scale));
        this._renderThumbHeight = Math.max(72, Math.floor(this._thumbHeight * scale));
    }

    _buildWindowItem(window) {
        const root = new St.BoxLayout({
            style_class: 'preview-switcher-item',
            vertical: true,
            width: this._renderThumbWidth,
            x_expand: false,
        });

        const thumbBin = new St.Bin({
            style_class: 'preview-switcher-thumb-bin',
            width: this._renderThumbWidth,
            height: this._renderThumbHeight,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });

        thumbBin.set_child(this._buildThumbnailActor(window));

        const title = new St.Label({
            style_class: 'preview-switcher-title',
            text: window.get_title() || 'Untitled',
            width: this._renderThumbWidth,
            x_align: Clutter.ActorAlign.CENTER,
        });
        title.clutter_text.ellipsize = Pango.EllipsizeMode.END;
        title.clutter_text.single_line_mode = true;

        root.add_child(thumbBin);
        root.add_child(title);

        return {root, window};
    }

    _buildThumbnailActor(window) {
        const compositorActor = window.get_compositor_private?.();

        if (compositorActor && compositorActor.width > 0 && compositorActor.height > 0) {
            return new Clutter.Clone({
                source: compositorActor,
                reactive: false,
                width: this._renderThumbWidth,
                height: this._renderThumbHeight,
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
        const iconSize = Math.max(24, Math.floor(this._renderThumbHeight * 0.35));
        const icon = app?.create_icon_texture?.(iconSize);
        if (icon)
            fallback.add_child(icon);

        fallback.add_child(new St.Label({
            text: app?.get_name?.() || window.get_wm_class() || 'Preview unavailable',
        }));

        return fallback;
    }

    _layoutCentered(windowCount) {
        if (!this._container)
            return;

        const monitor = Main.layoutManager.currentMonitor;
        const [, , natWidth, natHeight] = this._container.get_preferred_size();

        const estimatedWidth = (windowCount * this._renderThumbWidth) + ((windowCount - 1) * this._itemSpacing) + this._horizontalPadding;
        const estimatedHeight = this._renderThumbHeight + 90;

        const popupWidth = natWidth > 0 ? natWidth : estimatedWidth;
        const popupHeight = natHeight > 0 ? natHeight : estimatedHeight;

        this._container.set_position(
            Math.floor(monitor.x + (monitor.width - popupWidth) / 2),
            Math.floor(monitor.y + (monitor.height - popupHeight) / 2)
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
