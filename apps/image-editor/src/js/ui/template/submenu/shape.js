/* eslint-disable prettier/prettier */
/**
 * @param {Object} submenuInfo - submenu info for make template
 *   @param {Locale} locale - Translate text
 *   @param {Function} makeSvgIcon - svg icon generator
 * @returns {string}
 */
export default ({ locale, makeSvgIcon }) => `
    <ul class="tui-image-editor-submenu-item">
        <!-- 形状类型分段控制器：矩形 / 圆形 / 三角形 -->
        <li class="tie-shape-button tui-segmented-control">
            <div class="tui-image-editor-button rect" tooltip-content="${locale.localize('Rectangle')}">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'shape-rectangle', true)}
                </div>
            </div>
            <div class="tui-image-editor-button circle" tooltip-content="${locale.localize('Circle')}">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'shape-circle', true)}
                </div>
            </div>
            <div class="tui-image-editor-button triangle" tooltip-content="${locale.localize('Triangle')}">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'shape-triangle', true)}
                </div>
            </div>
        </li>
        <li class="tui-image-editor-partition">
            <div></div>
        </li>
        <!-- 填充色与描边色 -->
        <li class="tie-shape-color-button">
            <div class="tie-color-fill" tooltip-content="${locale.localize('Fill')}"></div>
            <div class="tie-color-stroke" tooltip-content="${locale.localize('Stroke')}"></div>
        </li>
        <li class="tui-image-editor-partition">
            <div></div>
        </li>
        <!-- 描边粗细 -->
        <li class="tui-image-editor-newline tui-image-editor-range-wrap" tooltip-content="${locale.localize('Stroke')} (px)">
            <label class="range">${locale.localize('Stroke')}</label>
            <div class="tie-stroke-range"></div>
            <input class="tie-stroke-range-value tui-image-editor-range-value" value="0" />
        </li>
    </ul>
`;
