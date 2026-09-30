import { fabric } from 'fabric';
import Graphics from '@/graphics';
import Compress, { formatFileSize, getByteLengthFromDataUrl } from '@/component/compress';
import Compresszone from '@/extension/compresszone';
import compressCommand from '@/command/compress';
import UI from '@/ui';

describe('Compress and Split Comparison', () => {
  describe('Utility functions', () => {
    it('formatFileSize correctly formats bytes into readable units', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(-10)).toBe('0 B');
      expect(formatFileSize(null)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.50 MB');
    });

    it('getByteLengthFromDataUrl estimates byte length accurately', () => {
      expect(getByteLengthFromDataUrl('')).toBe(0);
      expect(getByteLengthFromDataUrl(null)).toBe(0);

      // 'hello' in base64 is 'aGVsbG8=' (5 bytes)
      const dataUrl = 'data:image/png;base64,aGVsbG8=';
      expect(getByteLengthFromDataUrl(dataUrl)).toBe(5);
    });
  });

  describe('Compresszone Overlay', () => {
    let wrapper, compresszone;

    beforeEach(() => {
      wrapper = document.createElement('div');
      wrapper.style.width = '400px';
      wrapper.style.height = '300px';
      document.body.appendChild(wrapper);

      compresszone = new Compresszone(wrapper, {
        originalUrl: 'data:image/png;base64,orig',
        compressedUrl: 'data:image/jpeg;base64,comp',
        splitPercent: 50,
      });
    });

    afterEach(() => {
      if (compresszone) {
        compresszone.destroy();
      }
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    });

    it('mounts container into wrapper with before, after layers and divider', () => {
      const container = wrapper.querySelector('.tui-image-editor-compresszone');
      expect(container).not.toBeNull();

      const beforeLayer = wrapper.querySelector('.tie-compress-before');
      const afterLayer = wrapper.querySelector('.tie-compress-after');
      const divider = wrapper.querySelector('.tie-compress-divider');
      const handle = wrapper.querySelector('.tie-compress-handle');

      expect(beforeLayer).not.toBeNull();
      expect(afterLayer).not.toBeNull();
      expect(divider).not.toBeNull();
      expect(handle).not.toBeNull();
    });

    it('updates split percent and clip path correctly', () => {
      compresszone.setSplitPercent(30);
      expect(compresszone.getSplitPercent()).toBe(30);

      const divider = wrapper.querySelector('.tie-compress-divider');
      expect(divider.style.left).toBe('30%');

      const beforeLayer = wrapper.querySelector('.tie-compress-before');
      expect(beforeLayer.style.clipPath).toBe('inset(0 70% 0 0)');
    });

    it('clamps split percent between 0 and 100', () => {
      compresszone.setSplitPercent(-20);
      expect(compresszone.getSplitPercent()).toBe(0);

      compresszone.setSplitPercent(150);
      expect(compresszone.getSplitPercent()).toBe(100);
    });

    it('updates image URLs', () => {
      compresszone.setOriginalImage('data:image/png;base64,newOrig');
      compresszone.setCompressedImage('data:image/jpeg;base64,newComp');

      const beforeImg = wrapper.querySelector('.tie-compress-before-img');
      const afterImg = wrapper.querySelector('.tie-compress-after-img');

      expect(beforeImg.src).toContain('newOrig');
      expect(afterImg.src).toContain('newComp');
    });

    it('cleans up DOM on destroy', () => {
      compresszone.destroy();
      const container = wrapper.querySelector('.tui-image-editor-compresszone');
      expect(container).toBeNull();
    });
  });

  describe('Compress Component', () => {
    let graphics, compress, mockImage;

    beforeEach(() => {
      graphics = new Graphics(document.createElement('canvas'));
      mockImage = new fabric.Image(null, { width: 200, height: 150 });
      mockImage.getElement = () => {
        const img = document.createElement('img');
        img.src = 'data:image/png;base64,sample';
        img.width = 200;
        img.height = 150;
        return img;
      };
      graphics.setCanvasImage('testImage', mockImage);
      compress = new Compress(graphics);
    });

    afterEach(() => {
      if (compress) {
        compress.end();
      }
    });

    it('starts with default quality and format', async () => {
      const stats = await compress.start();

      expect(compress.getQuality()).toBe(80);
      expect(compress.getFormat()).toBe('auto');
      expect(stats).toBeDefined();
    });

    it('updates quality and format', async () => {
      await compress.start();
      const stats = await compress.update({ quality: 60, format: 'image/jpeg' });

      expect(compress.getQuality()).toBe(60);
      expect(compress.getFormat()).toBe('image/jpeg');
      expect(stats.quality).toBe(60);
      expect(stats.format).toBe('image/jpeg');
    });

    it('adjusts split position', async () => {
      await compress.start();
      compress.setSplitPosition(40);

      expect(compress.getSplitPosition()).toBe(40);
    });

    it('applies compressed result and ends mode', async () => {
      await compress.start();
      const result = await compress.apply();

      expect(result).toHaveProperty('prevUrl');
      expect(result).toHaveProperty('newUrl');
      expect(result).toHaveProperty('quality');
      expect(result).toHaveProperty('format');
    });

    it('restores image on undo', async () => {
      await compress.start();
      const result = await compress.apply();

      await expect(compress.restore(result)).resolves.not.toThrow();
    });
  });

  describe('Compress Command', () => {
    let graphics, mockImage;

    beforeEach(() => {
      graphics = new Graphics(document.createElement('canvas'));
      mockImage = new fabric.Image(null, { width: 100, height: 100 });
      graphics.setCanvasImage('testImage', mockImage);
    });

    afterEach(() => {});

    it('executes and un-does compress command cleanly', async () => {
      const compressComp = graphics.getComponent('COMPRESS');
      await compressComp.start();

      const result = await compressCommand.execute(graphics, { quality: 75 });
      expect(result).toBeDefined();
      expect(compressCommand.undoData).toBeDefined();

      await expect(compressCommand.undo(graphics)).resolves.not.toThrow();
    });
  });

  describe('Compress UI Menu Switching', () => {
    it('switches between compress and other menus cleanly', () => {
      const options = {
        menu: ['resize', 'compress', 'crop', 'draw'],
        initMenu: '',
        menuBarPosition: 'bottom',
      };
      const actions = {
        compress: {
          start: jest.fn().mockResolvedValue({}),
          stopDrawingMode: jest.fn(),
          end: jest.fn(),
          modeChange: jest.fn(),
        },
        crop: {
          stopDrawingMode: jest.fn(),
          modeChange: jest.fn(),
        },
        draw: {
          stopDrawingMode: jest.fn(),
          modeChange: jest.fn(),
        },
        resize: {
          stopDrawingMode: jest.fn(),
          modeChange: jest.fn(),
        },
        main: {
          changeSelectableAll: jest.fn(),
        },
      };
      const container = document.createElement('div');
      const ui = new UI(container, options, actions);
      ui.activeMenuEvent();

      ui.resizeEditor = jest.fn();

      // Switch to compress
      ui._changeMenu('compress', true, true);
      expect(ui.submenu).toBe('compress');

      // Switch to crop
      ui._changeMenu('crop', true, true);
      expect(ui.submenu).toBe('crop');
      expect(actions.compress.stopDrawingMode).toHaveBeenCalled();
      expect(actions.compress.end).toHaveBeenCalled();

      // Switch back to compress
      ui._changeMenu('compress', true, true);
      expect(ui.submenu).toBe('compress');
      expect(actions.crop.stopDrawingMode).toHaveBeenCalled();

      // Toggle off compress
      ui._changeMenu('compress', true, true);
      expect(ui.submenu).toBeNull();

      ui.destroy();
    });
  });
});

