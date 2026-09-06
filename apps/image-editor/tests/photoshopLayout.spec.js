jest.mock('@css/index.styl', () => ({}));
require('../src');
import ImageEditor from '@/imageEditor';

describe('Photoshop Layout UI Integration', () => {
  let container, imageEditor;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'tui-image-editor-container';
    document.body.appendChild(container);

    imageEditor = new ImageEditor(container, {
      includeUI: {
        loadImage: {
          path: 'mockPath',
          name: 'mockName',
        },
        menu: ['crop', 'draw', 'text'],
        initMenu: 'draw',
        menuBarPosition: 'bottom',
      },
      cssMaxWidth: 700,
      cssMaxHeight: 500,
      usageStatistics: false,
    });
    imageEditor.ui.activeMenuEvent();
  });

  afterEach(() => {
    if (imageEditor) {
      imageEditor.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('renders top bar 1 and top bar 2 (options bar)', () => {
    const topBar1 = container.querySelector('.tui-image-editor-top-bar');
    const optionsBar = container.querySelector('.tui-image-editor-options-bar');
    const badge = container.querySelector('.tui-image-editor-active-tool-badge');
    const badgeTitle = container.querySelector('.active-tool-title');

    expect(topBar1).not.toBeNull();
    expect(optionsBar).not.toBeNull();
    expect(badge).not.toBeNull();
    expect(badgeTitle.textContent).toBe('Draw');
  });

  it('renders collapsible left palette with tool items and toggle button', () => {
    const palette = container.querySelector(
      '.tui-image-editor-controls.tui-image-editor-left-palette'
    );
    const menuItems = container.querySelectorAll(
      '.tui-image-editor-menu .tui-image-editor-item'
    );
    const toggleBtn = container.querySelector('.tui-image-editor-palette-toggle-btn');

    expect(palette).not.toBeNull();
    expect(menuItems.length).toBe(3); // crop, draw, text
    expect(toggleBtn).not.toBeNull();
    expect(toggleBtn.textContent).toBe('◀');

    // Toggle collapse
    toggleBtn.click();
    expect(container.classList.contains('palette-collapsed')).toBe(true);
    expect(container.classList.contains('tui-image-editor-palette-collapsed')).toBe(true);
    expect(toggleBtn.textContent).toBe('▶');

    // Toggle expand
    toggleBtn.click();
    expect(container.classList.contains('palette-collapsed')).toBe(false);
    expect(container.classList.contains('tui-image-editor-palette-collapsed')).toBe(false);
    expect(toggleBtn.textContent).toBe('◀');
  });

  it('shows the active submenu element and badge when switching menus', () => {
    const cropBtn = container.querySelector('.tie-btn-crop');
    cropBtn.click();

    const badgeTitle = container.querySelector('.active-tool-title');
    expect(badgeTitle.textContent).toBe('Crop');
    expect(container.classList.contains('tui-image-editor-menu-crop')).toBe(true);

    const submenuCrop = container.querySelector(
      '.tui-image-editor-submenu .tui-image-editor-menu-crop'
    );
    expect(submenuCrop).not.toBeNull();
  });
});
