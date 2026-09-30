/**
 * @param {Object} submenuInfo - submenu info for make template
 *   @param {Locale} locale - Translate text
 *   @param {Function} makeSvgIcon - svg icon generator
 * @returns {string}
 */
export default ({ locale, makeSvgIcon }) => `
    <ul class="tui-image-editor-submenu-item">
        <!-- 画质调节滑块 -->
        <li class="tui-image-editor-submenu-align">
            <div class="tui-image-editor-range-wrap tui-image-editor-newline">
                <label class="range">${locale.localize('Quality')}&nbsp;</label>
                <div class="tie-compress-quality-range"></div>
                <input class="tie-compress-quality-range-value tui-image-editor-range-value" value="80" /> <label>%</label>
            </div>
        </li>
        <li class="tui-image-editor-partition tui-image-editor-newline"></li>
        <li class="tui-image-editor-partition only-left-right">
            <div></div>
        </li>
        <!-- 输出目标格式选择 -->
        <li class="tie-compress-format-button tui-segmented-control">
            <div class="tui-image-editor-button format format-auto active" data-format="auto" tooltip-content="${locale.localize(
              'Original Format'
            )}">
                <label> ${locale.localize('Original Format')} </label>
            </div>
            <div class="tui-image-editor-button format format-jpeg" data-format="image/jpeg" tooltip-content="JPEG">
                <label> JPEG </label>
            </div>
            <div class="tui-image-editor-button format format-webp" data-format="image/webp" tooltip-content="WebP">
                <label> WebP </label>
            </div>
            <div class="tui-image-editor-button format format-png" data-format="image/png" tooltip-content="PNG">
                <label> PNG </label>
            </div>
        </li>
        <li class="tui-image-editor-partition tui-image-editor-newline"></li>
        <li class="tui-image-editor-partition only-left-right">
            <div></div>
        </li>
        <!-- 实时体积与压缩率指标 -->
        <li class="tui-image-editor-submenu-align tie-compress-stats-item">
            <div class="tie-compress-stats" style="font-size: 12px; color: #ffffff; padding: 4px 10px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px;">
                <span class="tie-compress-stats-text">--</span>
            </div>
        </li>
        <li class="tui-image-editor-partition tui-image-editor-newline"></li>
        <li class="tui-image-editor-partition only-left-right">
            <div></div>
        </li>
        <!-- 确认应用与取消操作 -->
        <li class="tie-compress-button action">
            <div class="tui-image-editor-button apply" tooltip-content="${locale.localize(
              'Apply'
            )} (Enter)">
                ${makeSvgIcon(['normal', 'active'], 'apply')}
                <label>
                    ${locale.localize('Apply')}
                </label>
            </div>
            <div class="tui-image-editor-button cancel" tooltip-content="${locale.localize(
              'Cancel'
            )} (Esc)">
                ${makeSvgIcon(['normal', 'active'], 'cancel')}
                <label>
                    ${locale.localize('Cancel')}
                </label>
            </div>
        </li>
    </ul>
`;
