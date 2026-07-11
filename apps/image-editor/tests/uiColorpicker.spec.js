import Colorpicker from '@/ui/tools/colorpicker';

describe('Colorpicker', () => {
  let colorpicker, container;

  beforeEach(() => {
    container = document.createElement('div');
    container.setAttribute('title', 'Color');
    colorpicker = new Colorpicker(container, {
      defaultColor: '#7e7e7e',
    });
  });

  afterEach(() => {
    colorpicker.destroy();
  });

  it('should set color and element background color style', () => {
    colorpicker.color = '#ff0000';
    expect(colorpicker.color).toBe('#ff0000');
    expect(colorpicker.colorElement.style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(colorpicker.colorElement.classList.contains('transparent')).toBe(false);
  });

  it('should remove background color style and add transparent class when color is empty', () => {
    colorpicker.color = '';
    expect(colorpicker.color).toBe('');
    expect(colorpicker.colorElement.style.backgroundColor).toBe('');
    expect(colorpicker.colorElement.classList.contains('transparent')).toBe(true);
  });

  it('should remove background color style and add transparent class when color is "transparent"', () => {
    colorpicker.color = 'transparent';
    expect(colorpicker.color).toBe('transparent');
    expect(colorpicker.colorElement.style.backgroundColor).toBe('');
    expect(colorpicker.colorElement.classList.contains('transparent')).toBe(true);
  });

  it('should destructure color if passed as an object', () => {
    colorpicker.color = { type: 'color', color: '#00ff00' };
    expect(colorpicker.color).toBe('#00ff00');
    expect(colorpicker.colorElement.style.backgroundColor).toBe('rgb(0, 255, 0)');
    expect(colorpicker.colorElement.classList.contains('transparent')).toBe(false);
  });

  it('should destructure transparent color if passed as an object', () => {
    colorpicker.color = { type: 'color', color: 'transparent' };
    expect(colorpicker.color).toBe('transparent');
    expect(colorpicker.colorElement.style.backgroundColor).toBe('');
    expect(colorpicker.colorElement.classList.contains('transparent')).toBe(true);
  });
});
