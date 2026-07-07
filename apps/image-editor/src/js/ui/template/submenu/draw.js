/**
 * @param {Object} submenuInfo - submenu info for make template
 *   @param {Locale} locale - Translate text
 *   @param {Function} makeSvgIcon - svg icon generator
 * @returns {string}
 */
export default ({ locale, makeSvgIcon }) => `
    <ul class="tui-image-editor-submenu-item">
        <li class="tie-draw-line-select-button">
            <div class="tui-image-editor-button free">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'draw-free', true)}
                </div>
                <label>
                    ${locale.localize('Free')}
                </label>
            </div>
            <div class="tui-image-editor-button line">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'draw-line', true)}
                </div>
                <label>
                    ${locale.localize('Straight')}
                </label>
            </div>
        </li>
        <li class="tui-image-editor-partition">
            <div></div>
        </li>
        <li>
            <div class="tie-draw-color" title="${locale.localize('Color')}"></div>
        </li>
        <li class="tui-image-editor-partition only-left-right">
            <div></div>
        </li>
        <li class="tui-image-editor-newline tui-image-editor-range-wrap">
            <label class="range">${locale.localize('Range')}</label>
            <div class="tie-draw-range"></div>
            <input class="tie-draw-range-value tui-image-editor-range-value" value="0" />
        </li>
        <!-- 箭头类型选择：无箭头 / 单向箭头 / 双向箭头 -->
        <li class="tui-image-editor-partition only-left-right">
            <div></div>
        </li>
        <li class="custom-arrow-select-button tie-draw-arrow-select-button">
            <div class="tui-image-editor-button arrow-none active" title="${locale.localize(
              'NoArrow'
            )}">
                <div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </div>
                <label>${locale.localize('NoArrow')}</label>
            </div>
            <div class="tui-image-editor-button arrow-single" title="${locale.localize(
              'SingleArrow'
            )}">
                <div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </div>
                <label>${locale.localize('SingleArrow')}</label>
            </div>
            <div class="tui-image-editor-button arrow-double" title="${locale.localize(
              'DoubleArrow'
            )}">
                <div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                        <polyline points="12 5 5 12 12 19" />
                    </svg>
                </div>
                <label>${locale.localize('DoubleArrow')}</label>
            </div>
        </li>
    </ul>
`;
