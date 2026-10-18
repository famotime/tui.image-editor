jest.mock('@css/index.styl', () => ({}));
require('../src');
import ImageEditor from '@/imageEditor';
import PersistenceManager, { DEFAULT_STORAGE_KEY } from '@/ui/persistenceManager';

describe('UI and Tool Configuration Persistence', () => {
  const TEST_STORAGE_KEY = 'test_tui_image_editor_persistence';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('PersistenceManager unit tests', () => {
    let manager;

    afterEach(() => {
      if (manager) {
        manager.destroy();
      }
    });

    it('initializes with default options and loads empty state', () => {
      manager = new PersistenceManager({ storageKey: TEST_STORAGE_KEY });
      expect(manager.enabled).toBe(true);
      expect(manager.storageKey).toBe(TEST_STORAGE_KEY);
      expect(manager.getState()).toEqual({});
    });

    it('saves and retrieves active menu', () => {
      manager = new PersistenceManager({ storageKey: TEST_STORAGE_KEY });
      manager.saveActiveMenu('draw');
      expect(manager.getActiveMenu()).toBe('draw');

      const saved = JSON.parse(localStorage.getItem(TEST_STORAGE_KEY));
      expect(saved.activeMenu).toBe('draw');
    });

    it('saves and retrieves toolbar position and collapsed state', () => {
      manager = new PersistenceManager({ storageKey: TEST_STORAGE_KEY });
      manager.saveToolbarPosition({ left: 120, top: 240 });
      manager.saveToolbarCollapsed(true);

      const toolbar = manager.getToolbarState();
      expect(toolbar.position).toEqual({ left: 120, top: 240 });
      expect(toolbar.collapsed).toBe(true);
    });

    it('saves and retrieves layer position and collapsed state', () => {
      manager = new PersistenceManager({ storageKey: TEST_STORAGE_KEY });
      manager.saveLayerPosition({ left: 400, top: 150 });
      manager.saveLayerCollapsed(true);

      const layer = manager.getLayerState();
      expect(layer.position).toEqual({ left: 400, top: 150 });
      expect(layer.collapsed).toBe(true);
    });

    it('saves and retrieves tool configuration', () => {
      manager = new PersistenceManager({ storageKey: TEST_STORAGE_KEY });
      manager.saveToolConfig('draw', { color: '#ff0000', width: 25, arrowType: 'double' });

      // Immediate save
      manager.saveState({}, true);
      const drawConfig = manager.getToolConfig('draw');
      expect(drawConfig).toEqual({ color: '#ff0000', width: 25, arrowType: 'double' });
    });

    it('clears persisted state and storage', () => {
      manager = new PersistenceManager({ storageKey: TEST_STORAGE_KEY });
      manager.saveActiveMenu('shape');
      expect(localStorage.getItem(TEST_STORAGE_KEY)).not.toBeNull();

      manager.clear();
      expect(manager.getState()).toEqual({});
      expect(localStorage.getItem(TEST_STORAGE_KEY)).toBeNull();
    });

    it('respects enable: false option', () => {
      manager = new PersistenceManager({ enable: false, storageKey: TEST_STORAGE_KEY });
      manager.saveActiveMenu('crop');
      expect(localStorage.getItem(TEST_STORAGE_KEY)).toBeNull();
      expect(manager.getActiveMenu()).toBeNull();
    });
  });

  describe('ImageEditor UI Persistence Integration', () => {
    let container, imageEditor;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'tui-image-editor-container';
      document.body.appendChild(container);
    });

    afterEach(() => {
      if (imageEditor) {
        imageEditor.destroy();
      }
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    it('restores toolbar and layer positions and collapsed states from localStorage', () => {
      const savedState = {
        toolbar: {
          position: { left: 88, top: 166 },
          collapsed: true,
        },
        layer: {
          position: { left: 450, top: 220 },
          collapsed: true,
        },
      };
      localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(savedState));

      imageEditor = new ImageEditor(container, {
        includeUI: {
          loadImage: { path: 'mockPath', name: 'mockName' },
          menu: ['crop', 'draw', 'text'],
          initMenu: '',
          persistence: {
            storageKey: TEST_STORAGE_KEY,
          },
        },
        cssMaxWidth: 700,
        cssMaxHeight: 500,
        usageStatistics: false,
      });

      const leftPalette = container.querySelector('.tui-image-editor-left-palette');
      const rightPalette = container.querySelector('.tui-image-editor-right-palette');

      expect(leftPalette.style.left).toBe('88px');
      expect(leftPalette.style.top).toBe('166px');
      expect(container.classList.contains('palette-collapsed')).toBe(true);

      expect(rightPalette.style.left).toBe('450px');
      expect(rightPalette.style.top).toBe('220px');
      expect(rightPalette.classList.contains('palette-collapsed')).toBe(true);
    });

    it('restores tool configurations (Draw, Shape, Text, Mosaic, Annotation)', () => {
      const savedState = {
        tools: {
          draw: {
            color: '#123456',
            width: 32,
            arrowType: 'single',
            type: 'line',
          },
          shape: {
            type: 'circle',
            stroke: '#654321',
            fill: '#ffffff',
            strokeWidth: 8,
          },
          text: {
            textColor: '#00ff00',
            fontSize: 42,
            align: 'tie-text-align-center',
          },
          mosaic: {
            type: 'brush',
            mosaicSize: 35,
            brushWidth: 60,
          },
          annotation: {
            shape: 'triangle',
            color: '#112233',
            textColor: '#445566',
            fontSize: 28,
          },
          eraser: {
            width: 45,
          },
        },
      };
      localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(savedState));

      imageEditor = new ImageEditor(container, {
        includeUI: {
          loadImage: { path: 'mockPath', name: 'mockName' },
          menu: ['draw', 'shape', 'text', 'mosaic', 'annotation', 'eraser'],
          initMenu: '',
          persistence: {
            storageKey: TEST_STORAGE_KEY,
          },
        },
        cssMaxWidth: 700,
        cssMaxHeight: 500,
        usageStatistics: false,
      });

      // Verify Draw
      expect(imageEditor.ui.draw.color).toBe('#123456');
      expect(imageEditor.ui.draw.width).toBe(32);
      expect(imageEditor.ui.draw.arrowType).toBe('single');
      expect(imageEditor.ui.draw.savedType).toBe('line');

      // Verify Shape
      expect(imageEditor.ui.shape.options.stroke).toBe('#654321');
      expect(imageEditor.ui.shape.options.fill).toBe('#ffffff');
      expect(imageEditor.ui.shape.options.strokeWidth).toBe(8);
      expect(imageEditor.ui.shape.savedType).toBe('circle');

      // Verify Text
      expect(imageEditor.ui.text.textColor).toBe('#00ff00');
      expect(imageEditor.ui.text.fontSize).toBe(42);
      expect(imageEditor.ui.text.align).toBe('tie-text-align-center');

      // Verify Mosaic
      expect(imageEditor.ui.mosaic.savedType).toBe('brush');
      expect(imageEditor.ui.mosaic.mosaicSize).toBe(35);
      expect(imageEditor.ui.mosaic.brushWidth).toBe(60);

      // Verify Annotation
      expect(imageEditor.ui.annotation.shape).toBe('triangle');
      expect(imageEditor.ui.annotation.color).toBe('#112233');
      expect(imageEditor.ui.annotation.textColor).toBe('#445566');
      expect(imageEditor.ui.annotation.fontSize).toBe(28);

      // Verify Eraser
      expect(imageEditor.ui.eraser.width).toBe(45);
    });

    it('restores active tool when initMenu is not provided', () => {
      const savedState = {
        activeMenu: 'shape',
      };
      localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(savedState));

      imageEditor = new ImageEditor(container, {
        includeUI: {
          loadImage: { path: 'mockPath', name: 'mockName' },
          menu: ['crop', 'draw', 'shape', 'text'],
          initMenu: '',
          persistence: {
            storageKey: TEST_STORAGE_KEY,
          },
        },
        cssMaxWidth: 700,
        cssMaxHeight: 500,
        usageStatistics: false,
      });
      imageEditor.ui.activeMenuEvent();

      expect(imageEditor.ui.submenu).toBe('shape');
    });

    it('explicit initMenu takes precedence over saved activeMenu', () => {
      const savedState = {
        activeMenu: 'shape',
      };
      localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(savedState));

      imageEditor = new ImageEditor(container, {
        includeUI: {
          loadImage: { path: 'mockPath', name: 'mockName' },
          menu: ['crop', 'draw', 'shape', 'text'],
          initMenu: 'text',
          persistence: {
            storageKey: TEST_STORAGE_KEY,
          },
        },
        cssMaxWidth: 700,
        cssMaxHeight: 500,
        usageStatistics: false,
      });
      imageEditor.ui.activeMenuEvent();

      expect(imageEditor.ui.submenu).toBe('text');
    });

    it('exposes clearPersistentConfig and getPersistentConfig on ImageEditor', () => {
      const savedState = {
        activeMenu: 'draw',
        toolbar: { position: { left: 50, top: 60 } },
      };
      localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(savedState));

      imageEditor = new ImageEditor(container, {
        includeUI: {
          loadImage: { path: 'mockPath', name: 'mockName' },
          menu: ['crop', 'draw'],
          initMenu: '',
          persistence: {
            storageKey: TEST_STORAGE_KEY,
          },
        },
        cssMaxWidth: 700,
        cssMaxHeight: 500,
        usageStatistics: false,
      });

      const config = imageEditor.getPersistentConfig();
      expect(config.activeMenu).toBe('draw');
      expect(config.toolbar.position).toEqual({ left: 50, top: 60 });

      imageEditor.clearPersistentConfig();
      expect(imageEditor.getPersistentConfig()).toEqual({});
      expect(localStorage.getItem(TEST_STORAGE_KEY)).toBeNull();
    });
  });
});
