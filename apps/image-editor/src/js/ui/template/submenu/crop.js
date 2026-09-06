/* eslint-disable prettier/prettier */
/**
 * @param {Object} submenuInfo - submenu info for make template
 *   @param {Locale} locale - Translate text
 *   @param {Function} makeSvgIcon - svg icon generator
 * @returns {string}
 */
export default ({ locale, makeSvgIcon }) => `
    <ul class="tui-image-editor-submenu-item">
        <!-- 裁剪预设比例分段控制器 -->
        <li class="tie-crop-preset-button tui-segmented-control">
            <div class="tui-image-editor-button preset preset-none active" tooltip-content="${locale.localize('Custom')}">
                <label> ${locale.localize('Custom')} </label>
            </div>
            <div class="tui-image-editor-button preset preset-square" tooltip-content="${locale.localize('Square')} (1:1)">
                <label> 1:1 </label>
            </div>
            <div class="tui-image-editor-button preset preset-3-2" tooltip-content="${locale.localize('3:2')}">
                <label> 3:2 </label>
            </div>
            <div class="tui-image-editor-button preset preset-4-3" tooltip-content="${locale.localize('4:3')}">
                <label> 4:3 </label>
            </div>
            <div class="tui-image-editor-button preset preset-5-4" tooltip-content="${locale.localize('5:4')}">
                <label> 5:4 </label>
            </div>
            <div class="tui-image-editor-button preset preset-7-5" tooltip-content="${locale.localize('7:5')}">
                <label> 7:5 </label>
            </div>
            <div class="tui-image-editor-button preset preset-16-9" tooltip-content="${locale.localize('16:9')}">
                <label> 16:9 </label>
            </div>
        </li>
        <li class="tui-image-editor-partition only-left-right">
            <div></div>
        </li>
        <!-- 确认应用与取消操作 -->
        <li class="tie-crop-button action">
            <div class="tui-image-editor-button apply" tooltip-content="${locale.localize('Apply')} (Enter)">
                ${makeSvgIcon(['normal', 'active'], 'apply')}
                <label>
                    ${locale.localize('Apply')}
                </label>
            </div>
            <div class="tui-image-editor-button cancel" tooltip-content="${locale.localize('Cancel')} (Esc)">
                ${makeSvgIcon(['normal', 'active'], 'cancel')}
                <label>
                    ${locale.localize('Cancel')}
                </label>
            </div>
        </li>
    </ul>
`;
