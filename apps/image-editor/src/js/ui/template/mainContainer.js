/* eslint-disable prettier/prettier */
export default ({
  commonStyle,
  locale,
}) => `
    <div class="tui-image-editor-main-container" style="${commonStyle}">
        <div class="tui-image-editor-workspace">
            <div class="tui-image-editor-controls tui-image-editor-left-palette left-palette">
                <div class="tui-image-editor-palette-header">
                    <span class="tui-image-editor-palette-title">${(locale && locale.localize('Tool')) || '工具'}</span>
                    <button type="button" class="tui-image-editor-palette-toggle-btn" title="折叠/展开工具栏">◀</button>
                </div>
                <div class="tui-image-editor-palette-body">
                    <ul class="tui-image-editor-menu"></ul>
                </div>
            </div>
            <div class="tui-image-editor-main">
                <div class="tui-image-editor-wrap">
                    <div class="tui-image-editor-size-wrap">
                        <div class="tui-image-editor-align-wrap">
                            <div class="tui-image-editor"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
