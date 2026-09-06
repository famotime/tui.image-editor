/* eslint-disable prettier/prettier */
/**
 * @param {Object} submenuInfo - submenu info for make template
 *   @param {Locale} locale - Translate text
 *   @param {Function} makeSvgIcon - svg icon generator
 * @returns {string}
 */
export default ({ locale, makeSvgIcon }) => `
    <ul class="tui-image-editor-submenu-item">
        <!-- 文本样式分段控制器：加粗 / 斜体 / 下划线 -->
        <li class="tie-text-effect-button tui-segmented-control">
            <div class="tui-image-editor-button bold" tooltip-content="${locale.localize('Bold')}">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'text-bold', true)}
                </div>
            </div>
            <div class="tui-image-editor-button italic" tooltip-content="${locale.localize('Italic')}">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'text-italic', true)}
                </div>
            </div>
            <div class="tui-image-editor-button underline" tooltip-content="${locale.localize('Underline')}">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'text-underline', true)}
                </div>
            </div>
        </li>
        <li class="tui-image-editor-partition">
            <div></div>
        </li>
        <!-- 对齐方式分段控制器：居左 / 居中 / 居右 -->
        <li class="tie-text-align-button tui-segmented-control">
            <div class="tui-image-editor-button left" tooltip-content="${locale.localize('Left')}">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'text-align-left', true)}
                </div>
            </div>
            <div class="tui-image-editor-button center" tooltip-content="${locale.localize('Center')}">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'text-align-center', true)}
                </div>
            </div>
            <div class="tui-image-editor-button right" tooltip-content="${locale.localize('Right')}">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'text-align-right', true)}
                </div>
            </div>
        </li>
        <li class="tui-image-editor-partition">
            <div></div>
        </li>
        <!-- 文本颜色 -->
        <li>
            <div class="tie-text-color" tooltip-content="${locale.localize('Color')}"></div>
        </li>
        <li class="tui-image-editor-partition">
            <div></div>
        </li>
        <!-- 字号大小 -->
        <li class="tui-image-editor-newline tui-image-editor-range-wrap" tooltip-content="${locale.localize('Text size')} (px)">
            <label class="range">${locale.localize('Text size')}</label>
            <div class="tie-text-range"></div>
            <input class="tie-text-range-value tui-image-editor-range-value" value="0" />
        </li>
    </ul>
`;
