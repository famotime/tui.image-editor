/* eslint-disable prettier/prettier */
/**
 * @param {Locale} locale - Translate text
 * @returns {string}
 */
export default ({ locale }) => `
    <ul class="tui-image-editor-submenu-item">
        <!-- 滤镜分类分段控制器 -->
        <li class="tie-filter-category-segment tui-segmented-control">
            <div class="tui-image-editor-button active" data-category="presets" tooltip-content="${locale.localize('Presets')}">
                <label>${locale.localize('Presets')}</label>
                <span class="tie-filter-category-dot presets-dot"></span>
            </div>
            <div class="tui-image-editor-button" data-category="adjustments" tooltip-content="${locale.localize('Adjustments')}">
                <label>${locale.localize('Adjustments')}</label>
                <span class="tie-filter-category-dot adjustments-dot"></span>
            </div>
            <div class="tui-image-editor-button" data-category="blends" tooltip-content="${locale.localize('Color Blend')}">
                <label>${locale.localize('Color Blend')}</label>
                <span class="tie-filter-category-dot blends-dot"></span>
            </div>
        </li>
        <li class="tui-image-editor-partition">
            <div></div>
        </li>
        <!-- 分类 1: 基础预设滤镜 -->
        <li class="tie-filter-group tie-filter-group-presets active">
            <div class="tui-filter-chip-wrap">
                <label class="tui-filter-chip">
                    <input type="checkbox" class="tie-grayscale">
                    <span class="tui-filter-chip-text">${locale.localize('Grayscale')}</span>
                </label>
                <label class="tui-filter-chip">
                    <input type="checkbox" class="tie-invert">
                    <span class="tui-filter-chip-text">${locale.localize('Invert')}</span>
                </label>
                <label class="tui-filter-chip">
                    <input type="checkbox" class="tie-sepia">
                    <span class="tui-filter-chip-text">${locale.localize('Sepia')}</span>
                </label>
                <label class="tui-filter-chip">
                    <input type="checkbox" class="tie-vintage">
                    <span class="tui-filter-chip-text">${locale.localize('Sepia2')}</span>
                </label>
                <label class="tui-filter-chip">
                    <input type="checkbox" class="tie-blur">
                    <span class="tui-filter-chip-text">${locale.localize('Blur')}</span>
                </label>
                <label class="tui-filter-chip">
                    <input type="checkbox" class="tie-sharpen">
                    <span class="tui-filter-chip-text">${locale.localize('Sharpen')}</span>
                </label>
                <label class="tui-filter-chip">
                    <input type="checkbox" class="tie-emboss">
                    <span class="tui-filter-chip-text">${locale.localize('Emboss')}</span>
                </label>
            </div>
        </li>
        <!-- 分类 2: 画面调节滤镜 -->
        <li class="tie-filter-group tie-filter-group-adjustments" style="display: none;">
            <div class="tui-filter-adjustments-wrap">
                <div class="tui-image-editor-checkbox-group tui-image-editor-disabled tui-filter-item">
                    <label class="tui-filter-chip">
                        <input type="checkbox" class="tie-remove-white">
                        <span class="tui-filter-chip-text">${locale.localize('Remove White')}</span>
                    </label>
                    <div class="tui-image-editor-range-wrap short">
                        <label class="tui-filter-param-label">${locale.localize('Distance')}</label>
                        <div class="tie-removewhite-distance-range"></div>
                    </div>
                </div>
                <div class="tui-image-editor-checkbox-group tui-image-editor-disabled tui-filter-item">
                    <label class="tui-filter-chip">
                        <input type="checkbox" class="tie-brightness">
                        <span class="tui-filter-chip-text">${locale.localize('Brightness')}</span>
                    </label>
                    <div class="tui-image-editor-range-wrap short">
                        <div class="tie-brightness-range"></div>
                    </div>
                </div>
                <div class="tui-image-editor-checkbox-group tui-image-editor-disabled tui-filter-item">
                    <label class="tui-filter-chip">
                        <input type="checkbox" class="tie-noise">
                        <span class="tui-filter-chip-text">${locale.localize('Noise')}</span>
                    </label>
                    <div class="tui-image-editor-range-wrap short">
                        <div class="tie-noise-range"></div>
                    </div>
                </div>
                <div class="tui-image-editor-checkbox-group tui-image-editor-disabled tui-filter-item">
                    <label class="tui-filter-chip">
                        <input type="checkbox" class="tie-pixelate">
                        <span class="tui-filter-chip-text">${locale.localize('Pixelate')}</span>
                    </label>
                    <div class="tui-image-editor-range-wrap short">
                        <div class="tie-pixelate-range"></div>
                    </div>
                </div>
                <div class="tui-image-editor-checkbox-group tui-image-editor-disabled tui-filter-item">
                    <label class="tui-filter-chip">
                        <input type="checkbox" class="tie-color-filter">
                        <span class="tui-filter-chip-text">${locale.localize('Color Filter')}</span>
                    </label>
                    <div class="tui-image-editor-range-wrap short">
                        <label class="tui-filter-param-label">${locale.localize('Threshold')}</label>
                        <div class="tie-colorfilter-threshold-range"></div>
                    </div>
                </div>
            </div>
        </li>
        <!-- 分类 3: 色彩混合滤镜 -->
        <li class="tie-filter-group tie-filter-group-blends" style="display: none;">
            <div class="tui-filter-blends-wrap">
                <div class="tui-image-editor-checkbox-group tui-image-editor-disabled tui-filter-item filter-color-item">
                    <label class="tui-filter-chip">
                        <input type="checkbox" class="tie-tint">
                        <span class="tui-filter-chip-text">${locale.localize('Tint')}</span>
                    </label>
                    <div class="tie-filter-tint-color" title="${locale.localize('Tint')}"></div>
                </div>
                <div class="tui-image-editor-checkbox-group tui-image-editor-disabled tui-filter-item filter-color-item">
                    <label class="tui-filter-chip">
                        <input type="checkbox" class="tie-multiply">
                        <span class="tui-filter-chip-text">${locale.localize('Multiply')}</span>
                    </label>
                    <div class="tie-filter-multiply-color" title="${locale.localize('Multiply')}"></div>
                </div>
                <div class="tui-image-editor-checkbox-group tui-image-editor-disabled tui-filter-item filter-color-item">
                    <label class="tui-filter-chip">
                        <input type="checkbox" class="tie-blend">
                        <span class="tui-filter-chip-text">${locale.localize('Blend')}</span>
                    </label>
                    <div class="tie-filter-blend-color" title="${locale.localize('Blend')}"></div>
                </div>
            </div>
        </li>
    </ul>
`;
