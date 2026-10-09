export default ({ locale }) => {
  const addImageText = (locale && locale.localize('Add Image')) || '添加图片';
  const bringToFrontText = (locale && locale.localize('Bring To Front')) || '置顶';
  const bringForwardText = (locale && locale.localize('Bring Forward')) || '上移一层';
  const sendBackwardText = (locale && locale.localize('Send Backward')) || '下移一层';
  const sendToBackText = (locale && locale.localize('Send To Back')) || '置底';
  const duplicateText = (locale && locale.localize('Duplicate')) || '复制图层';
  const deleteText = (locale && locale.localize('Delete')) || '删除图层';
  const opacityText = (locale && locale.localize('Opacity')) || '不透明度';

  return `
    <div class="tui-image-editor-layer-panel">
      <div class="tie-layer-toolbar">
        <label class="tie-layer-add-btn" tooltip-content="${addImageText}">
          <input type="file" class="tie-layer-add-input" accept="image/*" />
          <span class="tie-layer-add-icon">+</span>
          <span class="tie-layer-add-text">${addImageText}</span>
        </label>
        <div class="tie-layer-tools">
          <button type="button" class="tie-layer-tool-btn tie-layer-btn-top" tooltip-content="${bringToFrontText}">⤊</button>
          <button type="button" class="tie-layer-tool-btn tie-layer-btn-up" tooltip-content="${bringForwardText}">↑</button>
          <button type="button" class="tie-layer-tool-btn tie-layer-btn-down" tooltip-content="${sendBackwardText}">↓</button>
          <button type="button" class="tie-layer-tool-btn tie-layer-btn-bottom" tooltip-content="${sendToBackText}">⤋</button>
          <button type="button" class="tie-layer-tool-btn tie-layer-btn-clone" tooltip-content="${duplicateText}">❐</button>
          <button type="button" class="tie-layer-tool-btn tie-layer-btn-delete" tooltip-content="${deleteText}">🗑</button>
        </div>
      </div>
      <div class="tie-layer-opacity-wrap">
        <span class="tie-layer-opacity-label">${opacityText}</span>
        <input type="range" class="tie-layer-opacity-range" min="0" max="100" value="100" />
        <span class="tie-layer-opacity-val">100%</span>
      </div>
      <div class="tie-layer-list-container">
        <ul class="tie-layer-list"></ul>
      </div>
    </div>
  `;
};
