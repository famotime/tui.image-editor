/* eslint-disable prettier/prettier */
/**
 * @param {Object} submenuInfo - submenu info for make template
 *   @param {Locale} locale - Translate text
 *   @param {Function} makeSvgIcon - svg icon generator
 * @returns {string}
 */
export default ({ locale, makeSvgIcon }) => `
    <ul class="tui-image-editor-submenu-item">
        <!-- 绘图模式分段控制器：自由手绘 / 直线绘制 -->
        <li class="tie-draw-line-select-button tui-segmented-control">
            <div class="tui-image-editor-button free" tooltip-content="${locale.localize('Free')}">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'draw-free', true)}
                </div>
            </div>
            <div class="tui-image-editor-button line" tooltip-content="${locale.localize('Straight')}">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'draw-line', true)}
                </div>
            </div>
        </li>
        <li class="tui-image-editor-partition">
            <div></div>
        </li>
        <!-- 颜色选择 -->
        <li>
            <div class="tie-draw-color" tooltip-content="${locale.localize('Color')}"></div>
        </li>
        <li class="tui-image-editor-partition">
            <div></div>
        </li>
        <!-- 画笔粗细 -->
        <li class="tui-image-editor-newline tui-image-editor-range-wrap" tooltip-content="${locale.localize('Range')} (px)">
            <label class="range">${locale.localize('Range')}</label>
            <div class="tie-draw-range"></div>
            <input class="tie-draw-range-value tui-image-editor-range-value" value="0" />
        </li>
        <li class="tui-image-editor-partition">
            <div></div>
        </li>
        <!-- 不透明度 -->
        <li class="tui-image-editor-newline tui-image-editor-range-wrap" tooltip-content="${locale.localize('Opacity')} (%)">
            <label class="range">${locale.localize('Opacity')}</label>
            <div class="tie-draw-opacity-range"></div>
            <input class="tie-draw-opacity-range-value tui-image-editor-range-value" value="1" />
        </li>
        <!-- 箭头端点分段控制器：无箭头 / 单向箭头 / 双向箭头 -->
        <li class="tui-image-editor-partition">
            <div></div>
        </li>
        <li class="custom-arrow-select-button tie-draw-arrow-select-button tui-segmented-control">
            <div class="tui-image-editor-button arrow-none active" tooltip-content="${locale.localize('NoArrow')}">
                <div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12" />
                    </svg>
                </div>
            </div>
            <div class="tui-image-editor-button arrow-single" tooltip-content="${locale.localize('SingleArrow')}">
                <div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="19" y2="12" />
                        <polyline points="13 6 19 12 13 18" />
                    </svg>
                </div>
            </div>
            <div class="tui-image-editor-button arrow-double" tooltip-content="${locale.localize('DoubleArrow')}">
                <div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="14 7 19 12 14 17" />
                        <polyline points="10 7 5 12 10 17" />
                    </svg>
                </div>
            </div>
        </li>
    </ul>
`;
