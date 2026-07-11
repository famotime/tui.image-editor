export default ({ locale, makeSvgIcon }) => `
    <ul class="tui-image-editor-submenu-item">
        <li class="tie-mosaic-type-select-button">
            <div class="tui-image-editor-button rect">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'shape-rectangle', true)}
                </div>
                <label>
                    ${locale.localize('Box Selection')}
                </label>
            </div>
            <div class="tui-image-editor-button brush">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'draw-free', true)}
                </div>
                <label>
                    ${locale.localize('Brush Stroke')}
                </label>
            </div>
        </li>
        <li class="tui-image-editor-partition">
            <div></div>
        </li>
        <li class="tui-image-editor-newline tui-image-editor-range-wrap">
            <label class="range">${locale.localize('Mosaic size')}</label>
            <div class="tie-mosaic-size-range"></div>
            <input class="tie-mosaic-size-range-value tui-image-editor-range-value" value="0" />
        </li>
        <li class="tui-image-editor-partition only-left-right tie-mosaic-brush-partition">
            <div></div>
        </li>
        <li class="tui-image-editor-newline tui-image-editor-range-wrap tie-mosaic-brush-range-wrap">
            <label class="range">${locale.localize('Brush size')}</label>
            <div class="tie-mosaic-brush-range"></div>
            <input class="tie-mosaic-brush-range-value tui-image-editor-range-value" value="0" />
        </li>
    </ul>
`;
