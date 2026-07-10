/* eslint-disable prettier/prettier */
import { getHelpMenuBarPosition } from '@/util';

export default ({ biImage, menuBarPosition }) => `
    <ul class="tui-image-editor-help-menu ${getHelpMenuBarPosition(menuBarPosition)}"></ul>
    <div class="tui-image-editor-controls">
        ${biImage ? `
        <div class="tui-image-editor-controls-logo">
            <img src="${biImage}" />
        </div>
        ` : ''}
        <ul class="tui-image-editor-menu"></ul>
    </div>
`;
