/* eslint-disable prettier/prettier */
import { getHelpMenuBarPosition } from '@/util';

export default ({ biImage, menuBarPosition, locale, submenuStyle }) => `
    <div class="tui-image-editor-top-bar">
        <div class="tui-image-editor-top-left">
            ${biImage ? `
            <div class="tui-image-editor-header-logo">
                <img src="${biImage}" />
            </div>
            ` : `
            <div class="tui-image-editor-brand-text">${locale ? locale.localize('Image Editor') : '资源管家'}</div>
            `}
        </div>
        <div class="tui-image-editor-top-center">
            <ul class="tui-image-editor-help-menu ${getHelpMenuBarPosition(menuBarPosition)}"></ul>
        </div>
    </div>
    <div class="tui-image-editor-options-bar">
        <div class="tui-image-editor-active-tool-badge" title="${locale ? locale.localize('Tool') : '工具'}">
            <span class="tui-image-editor-active-tool-icon active-tool-icon"></span>
            <span class="tui-image-editor-active-tool-title active-tool-title">${locale ? locale.localize('Tool') : '工具'}</span>
        </div>
        <div class="tui-image-editor-options-separator"></div>
        <div class="tui-image-editor-submenu">
            <div class="tui-image-editor-submenu-style" style="${submenuStyle || ''}"></div>
        </div>
        <div class="tui-image-editor-options-info">
            <span class="canvas-zoom-info">100%</span>
        </div>
    </div>
`;
