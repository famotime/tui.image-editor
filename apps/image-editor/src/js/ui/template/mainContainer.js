/* eslint-disable prettier/prettier */
export default ({
  commonStyle,
  locale,
}) => {
  const toolbarTitle = (locale && locale.localize('Toolbar')) || '工具栏';
  const collapseText = (locale && locale.localize('Collapse')) || '折叠工具栏';

  return `
    <div class="tui-image-editor-main-container" style="${commonStyle}">
        <div class="tui-image-editor-workspace">
            <div class="tui-image-editor-controls tui-image-editor-left-palette left-palette">
                <div class="tui-image-editor-palette-header">
                    <span class="tui-image-editor-palette-title">${toolbarTitle}</span>
                    <button type="button" class="tui-image-editor-palette-toggle-btn" title="${collapseText}" tooltip-content="${collapseText}">▲</button>
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
};
