/**
 * @param {Object} submenuInfo - submenu info for make template
 *   @param {Locale} locale - Translate text
 *   @param {Function} makeSvgIcon - svg icon generator
 * @returns {string}
 */
export default ({ locale }) => `
    <ul class="tui-image-editor-submenu-item">
        <!-- 形状选择 -->
        <li class="custom-annotation-shape-button">
            <div class="tui-image-editor-button circle active" title="${locale.localize('Circle')}">
                <div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="8" />
                    </svg>
                </div>
                <label>${locale.localize('Circle')}</label>
            </div>
            <div class="tui-image-editor-button rect" title="${locale.localize('Rectangle')}">
                <div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="5" y="5" width="14" height="14" rx="2" />
                    </svg>
                </div>
                <label>${locale.localize('Rectangle')}</label>
            </div>
            <div class="tui-image-editor-button triangle" title="${locale.localize('Triangle')}">
                <div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 5 5 19 19 19" />
                    </svg>
                </div>
                <label>${locale.localize('Triangle')}</label>
            </div>
        </li>
        
        <li class="tui-image-editor-partition"><div></div></li>
        
        <!-- 颜色选择：文字色与背景色（中线对齐，文字在下，内置色盘） -->
        <li class="custom-annotation-color-button">
            <div class="color-item-wrapper tie-annotation-textcolor-trigger">
                <div class="color-preview-container">
                    <div class="color-preview-circle tie-annotation-textcolor-preview" style="background-color: #ffffff;" title="${locale.localize(
                      'Text Color'
                    )}">
                        <div class="color-preview-inner"></div>
                    </div>
                </div>
                <label class="custom-label">${locale.localize('TextColor')}</label>
                
                <!-- 预设颜色卡片 -->
                <div class="preset-colors-popup tie-annotation-textcolor-popup" style="display: none;">
                    <div class="preset-grid">
                        <div class="preset-color-dot" style="background-color: #ff4d4f;" title="#ff4d4f"></div>
                        <div class="preset-color-dot" style="background-color: #ff9c6e;" title="#ff9c6e"></div>
                        <div class="preset-color-dot" style="background-color: #fadb14;" title="#fadb14"></div>
                        <div class="preset-color-dot" style="background-color: #52c41a;" title="#52c41a"></div>
                        <div class="preset-color-dot" style="background-color: #13c2c2;" title="#13c2c2"></div>
                        <div class="preset-color-dot" style="background-color: #1890ff;" title="#1890ff"></div>
                        <div class="preset-color-dot" style="background-color: #722ed1;" title="#722ed1"></div>
                        <div class="preset-color-dot" style="background-color: #000000;" title="#000000"></div>
                        <div class="preset-color-dot" style="background-color: #ffffff;" title="#ffffff"></div>
                        <div class="preset-color-dot" style="background-color: #8c8c8c;" title="#8c8c8c"></div>
                        <div class="preset-color-custom tie-annotation-textcolor-custom" title="${locale.localize(
                          'Custom Color'
                        )}">🎨</div>
                    </div>
                </div>
            </div>
            
            <div class="color-item-wrapper tie-annotation-bgcolor-trigger" style="margin-left: 16px;">
                <div class="color-preview-container">
                    <div class="color-preview-circle tie-annotation-bgcolor-preview" style="background-color: #ff4d4f;" title="${locale.localize(
                      'Background Color'
                    )}">
                        <div class="color-preview-inner"></div>
                    </div>
                </div>
                <label class="custom-label">${locale.localize('BgColor')}</label>
                
                <!-- 预设颜色卡片 -->
                <div class="preset-colors-popup tie-annotation-bgcolor-popup" style="display: none;">
                    <div class="preset-grid">
                        <div class="preset-color-dot" style="background-color: #ff4d4f;" title="#ff4d4f"></div>
                        <div class="preset-color-dot" style="background-color: #ff9c6e;" title="#ff9c6e"></div>
                        <div class="preset-color-dot" style="background-color: #fadb14;" title="#fadb14"></div>
                        <div class="preset-color-dot" style="background-color: #52c41a;" title="#52c41a"></div>
                        <div class="preset-color-dot" style="background-color: #13c2c2;" title="#13c2c2"></div>
                        <div class="preset-color-dot" style="background-color: #1890ff;" title="#1890ff"></div>
                        <div class="preset-color-dot" style="background-color: #722ed1;" title="#722ed1"></div>
                        <div class="preset-color-dot" style="background-color: #000000;" title="#000000"></div>
                        <div class="preset-color-dot" style="background-color: #ffffff;" title="#ffffff"></div>
                        <div class="preset-color-dot" style="background-color: #8c8c8c;" title="#8c8c8c"></div>
                        <div class="preset-color-custom tie-annotation-bgcolor-custom" title="${locale.localize(
                          'Custom Color'
                        )}">🎨</div>
                    </div>
                </div>
            </div>
            
            <input type="color" class="tie-annotation-bgcolor-input" style="display: none;" value="#ff4d4f" />
            <input type="color" class="tie-annotation-textcolor-input" style="display: none;" value="#ffffff" />
        </li>
        
        <li class="tui-image-editor-partition"><div></div></li>
        
        <!-- 下次序号与重置（中线高度对齐，文字在下） -->
        <li class="custom-annotation-step-wrap">
            <div class="step-control-wrapper">
                <div class="step-control-row">
                    <input class="tui-image-editor-range-value step-value-input tie-annotation-step-input" value="1" type="number" min="1" />
                    <span class="custom-reset-btn tie-annotation-reset-btn">${
                      locale.localize('ResetStep') === 'ResetStep'
                        ? 'Reset'
                        : locale.localize('ResetStep')
                    }</span>
                </div>
                <label class="custom-label">${locale.localize('NextStep')}</label>
            </div>
        </li>
        
        <!-- 字体大小滑块（另起一行，全宽延伸，符合原生布局） -->
        <li class="tui-image-editor-newline tui-image-editor-range-wrap custom-annotation-range-wrap">
            <label class="range">${locale.localize('Text size')}</label>
            <div class="custom-slider-container">
                <input type="range" min="12" max="60" value="20" class="custom-tui-slider tie-annotation-fontsize-range" />
            </div>
            <input class="tui-image-editor-range-value tie-annotation-fontsize-input" value="20" type="number" min="12" max="60" />
        </li>
    </ul>
`;
