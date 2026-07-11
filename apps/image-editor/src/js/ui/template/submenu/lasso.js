/**
 * @param {Object} submenuInfo - submenu info for make template
 *   @param {Locale} locale - Translate text
 *   @param {Function} makeSvgIcon - svg icon generator
 * @returns {string}
 */
export default ({ locale, makeSvgIcon }) => `
    <ul class="tui-image-editor-submenu-item tie-lasso-select-button">
        <li class="rectangular">
            <div class="tui-image-editor-button rectangular">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'shape-rectangle', true)}
                </div>
                <label>
                    ${locale.localize('Rectangular')}
                </label>
            </div>
        </li>
        <li class="freehand">
            <div class="tui-image-editor-button freehand">
                <div>
                    ${makeSvgIcon(['normal', 'active'], 'draw-free', true)}
                </div>
                <label>
                    ${locale.localize('Freehand')}
                </label>
            </div>
        </li>
    </ul>
`;
