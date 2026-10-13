import { fabric } from 'fabric';
import Graphics from '@/graphics';
import Invoker from '@/invoker';
import commandFactory from '@/factory/command';
import { commandNames as commands } from '@/consts';
import changeLayerOrderCommand from '@/command/changeLayerOrder';
import changeLayerOpacityCommand from '@/command/changeLayerOpacity';
import Layer from '@/ui/layer';
import Locale from '@/ui/locale/locale';

describe('Layer Management & Multi-Image Addition', () => {
  let graphics, invoker, canvas, rect1, rect2, imgObj;

  beforeAll(() => {
    commandFactory.register(changeLayerOrderCommand);
    commandFactory.register(changeLayerOpacityCommand);
  });

  beforeEach(() => {
    graphics = new Graphics(document.createElement('canvas'));
    invoker = new Invoker();
    canvas = graphics.getCanvas();

    const mockBg = new fabric.Image(null, { width: 400, height: 300 });
    graphics.setCanvasImage('mockBg', mockBg);

    rect1 = new fabric.Rect({ width: 50, height: 50 });
    rect2 = new fabric.Rect({ width: 60, height: 60 });
    imgObj = new fabric.Image(null, { width: 80, height: 80 });

    graphics.add(rect1);
    graphics.createObjectProperties(rect1);

    graphics.add(rect2);
    graphics.createObjectProperties(rect2);

    graphics.add(imgObj);
    graphics.createObjectProperties(imgObj);
  });

  describe('Commands', () => {
    it('executes changeLayerOrder and restores on undo', async () => {
      const initialObjects = canvas.getObjects();
      expect(initialObjects.indexOf(rect1)).toBe(0);
      expect(initialObjects.indexOf(rect2)).toBe(1);
      expect(initialObjects.indexOf(imgObj)).toBe(2);

      // Move rect1 to index 2 (top)
      const command = commandFactory.create(commands.CHANGE_LAYER_ORDER, graphics, rect1.id, 2);
      await invoker.execute(command);

      expect(canvas.getObjects().indexOf(rect1)).toBe(2);

      // Undo
      await invoker.undo();
      expect(canvas.getObjects().indexOf(rect1)).toBe(0);

      // Redo
      await invoker.redo();
      expect(canvas.getObjects().indexOf(rect1)).toBe(2);
    });

    it('executes changeLayerOpacity and restores on undo', async () => {
      expect(rect1.opacity).toBe(1);

      const command = commandFactory.create(commands.CHANGE_LAYER_OPACITY, graphics, rect1.id, 0.4);
      await invoker.execute(command);

      expect(rect1.opacity).toBe(0.4);

      // Undo
      await invoker.undo();
      expect(rect1.opacity).toBe(1);

      // Redo
      await invoker.redo();
      expect(rect1.opacity).toBe(0.4);
    });

    it('changes background layer opacity with changeLayerOpacity', async () => {
      const bg = graphics.getCanvasImage();
      const command = commandFactory.create(commands.CHANGE_LAYER_OPACITY, graphics, 'background', 0.6);
      await invoker.execute(command);

      expect(bg.opacity).toBe(0.6);

      await invoker.undo();
      expect(bg.opacity).toBe(1);
    });
  });

  describe('Layer UI Component', () => {
    let container, layer, actions;

    beforeEach(() => {
      container = document.createElement('div');
      container.className = 'tui-image-editor-right-palette';
      container.innerHTML = `
        <div class="tui-image-editor-palette-header">
          <span class="tui-image-editor-palette-title">图层</span>
          <button type="button" class="tui-image-editor-palette-toggle-btn">▲</button>
        </div>
        <div class="tui-image-editor-palette-body tui-image-editor-layer-body"></div>
      `;

      actions = {
        addImage: jest.fn(),
        reorderLayer: jest.fn((id, toIndex) => {
          const obj = graphics.getObject(id);
          canvas.moveTo(obj, toIndex);
          return Promise.resolve();
        }),
        setLayerOpacity: jest.fn((id, opacity) => {
          const target = id === 'background' ? graphics.getCanvasImage() : graphics.getObject(id);
          if (target) {
            target.set('opacity', opacity);
          }
          return Promise.resolve();
        }),
        setLayerVisibility: jest.fn((id, visible) => {
          const target = id === 'background' ? graphics.getCanvasImage() : graphics.getObject(id);
          if (target) {
            target.set('visible', visible);
          }
        }),
        setLayerLock: jest.fn((id, locked) => {
          const target = graphics.getObject(id);
          if (target) {
            target.set({ selectable: !locked, evented: !locked });
          }
        }),
        removeLayer: jest.fn((id) => {
          const target = graphics.getObject(id);
          if (target) {
            canvas.remove(target);
          }
          return Promise.resolve();
        }),
        cloneLayer: jest.fn(),
        renameLayer: jest.fn((id, name) => {
          const target = graphics.getObject(id);
          if (target) {
            target.layerName = name;
          }
        }),
        selectLayer: jest.fn((id) => {
          const target = graphics.getObject(id);
          if (target) {
            canvas.setActiveObject(target);
          }
        }),
        getCanvas: () => canvas,
        getCanvasImage: () => graphics.getCanvasImage(),
        getObject: (id) => graphics.getObject(id),
      };

      layer = new Layer(container, { locale: new Locale({}) }, actions);
    });

    afterEach(() => {
      if (layer) {
        layer.destroy();
      }
    });

    it('renders list items for canvas objects and background', () => {
      const items = container.querySelectorAll('.tie-layer-item');
      // 3 canvas objects + 1 background layer = 4 items
      expect(items.length).toBe(4);
      // Background layer should be at the bottom
      expect(items[3].getAttribute('data-id')).toBe('background');
    });

    it('toggles visibility when eye button is clicked', () => {
      const item = container.querySelector(`.tie-layer-item[data-id="${rect1.id}"]`);
      const visBtn = item.querySelector('.tie-layer-item-vis-btn');

      visBtn.click();
      expect(actions.setLayerVisibility).toHaveBeenCalledWith(String(rect1.id), false);
    });

    it('toggles lock when lock button is clicked', () => {
      const item = container.querySelector(`.tie-layer-item[data-id="${rect1.id}"]`);
      const lockBtn = item.querySelector('.tie-layer-item-lock-btn');

      lockBtn.click();
      expect(actions.setLayerLock).toHaveBeenCalledWith(String(rect1.id), true);
    });

    it('calls removeLayer when delete button is clicked', () => {
      const item = container.querySelector(`.tie-layer-item[data-id="${rect1.id}"]`);
      const delBtn = item.querySelector('.tie-layer-item-del-btn');

      delBtn.click();
      expect(actions.removeLayer).toHaveBeenCalledWith(String(rect1.id));
    });

    it('synchronizes active object selection to UI list item', () => {
      canvas.setActiveObject(rect2);
      layer._syncSelection();

      const activeItem = container.querySelector('.tie-layer-item.active');
      expect(activeItem).not.toBeNull();
      expect(activeItem.getAttribute('data-id')).toBe(String(rect2.id));
    });

    it('moves layer up and down via tool buttons', () => {
      canvas.setActiveObject(rect1); // at index 0

      const btnUp = container.querySelector('.tie-layer-btn-up');
      btnUp.click();

      expect(actions.reorderLayer).toHaveBeenCalledWith(String(rect1.id), 1);
    });

    it('renames layer on inline edit', () => {
      const item = container.querySelector(`.tie-layer-item[data-id="${rect1.id}"]`);
      const nameSpan = item.querySelector('.tie-layer-item-name');

      // Double click to trigger rename input
      nameSpan.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

      const renameInput = item.querySelector('.tie-layer-rename-input');
      expect(renameInput).not.toBeNull();

      renameInput.value = 'New Layer Name';
      renameInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(actions.renameLayer).toHaveBeenCalledWith(String(rect1.id), 'New Layer Name');
    });

    it('renders Lucide wireframe icons for toolbar tools and layer items', () => {
      // Check toolbar buttons have lucide-icon SVGs
      const topBtn = container.querySelector('.tie-layer-btn-top');
      const addBtn = container.querySelector('.tie-layer-add-btn');
      expect(topBtn.querySelector('svg.lucide-icon')).not.toBeNull();
      expect(addBtn.querySelector('svg.lucide-icon')).not.toBeNull();

      // Check item buttons have lucide-icon SVGs
      const item = container.querySelector(`.tie-layer-item[data-id="${rect1.id}"]`);
      const dragHandle = item.querySelector('.tie-layer-item-drag-handle');
      const visBtn = item.querySelector('.tie-layer-item-vis-btn');
      const lockBtn = item.querySelector('.tie-layer-item-lock-btn');
      const delBtn = item.querySelector('.tie-layer-item-del-btn');

      expect(dragHandle.querySelector('svg.lucide-icon')).not.toBeNull();
      expect(visBtn.querySelector('svg.lucide-icon')).not.toBeNull();
      expect(lockBtn.querySelector('svg.lucide-icon')).not.toBeNull();
      expect(delBtn.querySelector('svg.lucide-icon')).not.toBeNull();
    });
  });

  describe('Multi-Image Drag & Drop Interaction', () => {
    it('successfully finishes dragging added image without getting stuck to cursor', () => {
      const addedImg = new fabric.Image(null, { width: 120, height: 120, left: 100, top: 100 });
      graphics._callbackAfterLoadingImageObject(addedImg);

      expect(canvas.getActiveObject()).toBe(addedImg);

      // Simulate mousedown
      const evt = { clientX: 100, clientY: 100, preventDefault: jest.fn() };
      canvas.fire('mouse:down', { target: addedImg, e: evt });
      expect(graphics._dragState).not.toBeNull();

      // Simulate moving
      addedImg.set({ left: 160, top: 180 });
      canvas.fire('object:moving', { target: addedImg, e: evt });

      // Simulate mouseup
      canvas.fire('mouse:up', { target: addedImg, e: evt });
      canvas.fire('object:modified', { target: addedImg, e: evt });

      // Drag state should be cleanly cleared and object dropped at new coordinates
      expect(graphics._dragState).toBeNull();
      expect(addedImg.left).toBe(160);
      expect(addedImg.top).toBe(180);
    });
  });

  describe('Smart Scaling for Image Objects', () => {
    it('scales oversized image down proportionally when added to canvas', () => {
      const largeImg = new fabric.Image(null, { width: 1000, height: 800 });
      // canvas is 400x300, max allowed is 320x240 (80%)
      graphics._callbackAfterLoadingImageObject(largeImg);

      expect(largeImg.scaleX).toBeLessThan(1);
      expect(largeImg.scaleY).toBeLessThan(1);
      // Scaled width should not exceed 80% canvas width (320)
      expect(largeImg.getScaledWidth()).toBeLessThanOrEqual(320.01);
      // Scaled height should not exceed 80% canvas height (240)
      expect(largeImg.getScaledHeight()).toBeLessThanOrEqual(240.01);
    });
  });
});
