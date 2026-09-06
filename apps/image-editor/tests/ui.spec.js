import UI from '@/ui';
import Lasso from '@/ui/lasso';
import { HELP_MENUS } from '@/consts';

describe('UI', () => {
  let ui, options;

  beforeEach(() => {
    options = {
      loadImage: { path: 'mockImagePath', name: '' },
      menu: ['resize', 'crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'mask', 'filter'],
      initMenu: 'shape',
      menuBarPosition: 'bottom',
    };
    ui = new UI(document.createElement('div'), options, {});
  });

  describe('Destroy()', () => {
    it('should be executed for all menu instances', () => {
      const spies = [];
      options.menu.forEach((menu) => {
        spies.push(jest.spyOn(ui[menu], 'destroy'));
      });

      ui._destroyAllMenu();

      spies.forEach((spy) => {
        expect(spy).toHaveBeenCalled();
      });
    });

    it('should execute "removeEventListener" for all menus', () => {
      const allUiButtonElementName = [...options.menu, ...HELP_MENUS];
      allUiButtonElementName.forEach((element) => {
        jest.spyOn(ui._buttonElements[element], 'removeEventListener');
      });

      ui._removeUiEvent();

      allUiButtonElementName.forEach((element) => {
        expect(ui._buttonElements[element].removeEventListener).toHaveBeenCalled();
      });
    });
  });

  describe('_changeMenu()', () => {
    it('should execute when the menu changes', () => {
      ui.submenu = 'shape';
      jest.spyOn(ui, 'resizeEditor');
      ui.shape.changeStandbyMode = jest.fn();
      jest.spyOn(ui.filter, 'changeStartMode');
      ui._actions.main = { changeSelectableAll: jest.fn() };
      ui.resizeEditor = jest.fn();

      ui._changeMenu('filter', false, false);

      expect(ui.shape.changeStandbyMode).toHaveBeenCalled();
      expect(ui.filter.changeStartMode).toHaveBeenCalled();
    });
  });

  describe('_makeSubMenu()', () => {
    it('should execute for the number of menus specified in the option.', () => {
      const makeMenuElementSpy = jest.spyOn(ui, '_makeMenuElement');

      ui._makeSubMenu();

      expect(makeMenuElementSpy).toHaveBeenCalledTimes(options.menu.length);
    });

    it('should create instance of the menu specified in the option', () => {
      jest.spyOn(ui, '_makeMenuElement');
      const getConstructorName = (constructor) => constructor.toString().match(/^class (.+?) /)[1];

      ui._makeSubMenu();

      options.menu.forEach((menu) => {
        const constructorNameOfInstance = getConstructorName(ui[menu].constructor);
        const expected = menu.replace(/^[a-z]/, ($0) => $0.toUpperCase());

        expect(constructorNameOfInstance).toBe(expected);
      });
    });
  });

  describe('initCanvas()', () => {
    beforeEach(() => {
      ui._editorElement = {
        querySelector: jest.fn(() => document.createElement('div')),
      };
      ui._actions.main = {
        initLoadImage: jest.fn(() => Promise.resolve()),
      };
    });

    it('should be run as required when initCanvas is executed', async () => {
      ui.activeMenuEvent = jest.fn();
      const addLoadEventSpy = jest.spyOn(ui, '_addLoadEvent');

      await ui.initCanvas();

      expect(addLoadEventSpy).toHaveBeenCalled();
    });

    it('should not be run when has not image path', () => {
      jest.spyOn(ui, '_getLoadImage').mockReturnValue({ path: '' });

      ui.initCanvas();

      expect(ui._actions.main.initLoadImage).not.toHaveBeenCalled();
    });

    it('should be executed even if there is no image path', () => {
      jest.spyOn(ui, '_getLoadImage').mockReturnValue({ path: '' });
      jest.spyOn(ui, '_addLoadEvent');

      ui.initCanvas();

      expect(ui._addLoadEvent).toHaveBeenCalled();
    });
  });

  describe('_setEditorPosition()', () => {
    beforeEach(() => {
      ui._editorElement = document.createElement('div');
      jest.spyOn(ui, '_getCanvasMaxDimension').mockReturnValue({ width: 300, height: 300 });
    });

    it('should be reflected in the bottom of the editor position', () => {
      ui.submenu = true;

      ui._setEditorPosition('bottom');

      expect(ui._editorElement.style).toMatchObject({ top: '150px', left: '0px' });
    });

    it('should be reflected in the top of the editor position', () => {
      ui.submenu = true;

      ui._setEditorPosition('top');

      expect(ui._editorElement.style).toMatchObject({ top: '-150px', left: '0px' });
    });

    it('should be reflected in the left, right of the editor position', () => {
      ui.submenu = true;

      ui._setEditorPosition('left');

      expect(ui._editorElement.style).toMatchObject({ top: '0px', left: '-150px' });
    });

    it('should be reflected in the right of the editor position', () => {
      ui.submenu = true;

      ui._setEditorPosition('right');

      expect(ui._editorElement.style).toMatchObject({ top: '0px', left: '150px' });
    });
  });

  describe('Toolbar Overflow & More Menu', () => {
    it('should create more menu element and dropdown panel in help menu bar', () => {
      expect(ui._moreMenuElement).toBeDefined();
      expect(ui._moreDropdownPanel).toBeDefined();
      expect(ui._moreDropdownList).toBeDefined();
      expect(ui._helpMenuBarElement.contains(ui._moreMenuElement)).toBe(true);
    });

    it('should show all items and hide more menu when container width is sufficient', () => {
      const parent = ui._helpMenuBarElement.parentElement;
      Object.defineProperty(parent, 'offsetWidth', { value: 1200, configurable: true });

      ui._updateToolbarOverflow();

      expect(ui._moreMenuElement.style.display).toBe('none');
      const hiddenItems = ui._helpMenuBarElement.querySelectorAll('.tie-overflow-hidden');
      expect(hiddenItems.length).toBe(0);
    });

    it('should collapse overflow items and display more menu when container width is narrow', () => {
      const parent = ui._helpMenuBarElement.parentElement;
      Object.defineProperty(parent, 'offsetWidth', { value: 200, configurable: true });

      ui._updateToolbarOverflow();

      expect(ui._moreMenuElement.style.display).toBe('inline-flex');
      const hiddenItems = ui._helpMenuBarElement.querySelectorAll('.tie-overflow-hidden');
      expect(hiddenItems.length).toBeGreaterThan(0);

      const dropdownItems = ui._moreDropdownList.querySelectorAll('.tie-more-dropdown-item');
      expect(dropdownItems.length).toBeGreaterThan(0);
    });

    it('should toggle opened class when more button is clicked and close on document click', () => {
      expect(ui._moreMenuElement.classList.contains('opened')).toBe(false);

      ui._moreMenuElement.click();
      expect(ui._moreMenuElement.classList.contains('opened')).toBe(true);

      document.body.click();
      expect(ui._moreMenuElement.classList.contains('opened')).toBe(false);
    });

    it('should proxy click event to original button when enabled dropdown item is clicked', () => {
      // 启用 redo 按钮
      ui.changeHelpButtonEnabled('redo', true);

      const parent = ui._helpMenuBarElement.parentElement;
      Object.defineProperty(parent, 'offsetWidth', { value: 200, configurable: true });
      ui._updateToolbarOverflow();

      const redoItem = ui._moreDropdownList.querySelector('[data-menu-name="redo"]');
      expect(redoItem).not.toBeNull();
      expect(redoItem.classList.contains('disabled')).toBe(false);

      const origBtn = ui._buttonElements.redo;
      const clickSpy = jest.fn();
      origBtn.addEventListener('click', clickSpy);

      ui._moreMenuElement.classList.add('opened');
      redoItem.click();

      expect(ui._moreMenuElement.classList.contains('opened')).toBe(false);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should not proxy click when disabled dropdown item is clicked', () => {
      ui.changeHelpButtonEnabled('delete', false);

      const parent = ui._helpMenuBarElement.parentElement;
      Object.defineProperty(parent, 'offsetWidth', { value: 200, configurable: true });
      ui._updateToolbarOverflow();

      const deleteItem = ui._moreDropdownList.querySelector('[data-menu-name="delete"]');
      expect(deleteItem).not.toBeNull();
      expect(deleteItem.classList.contains('disabled')).toBe(true);

      const origBtn = ui._buttonElements.delete;
      const clickSpy = jest.fn();
      origBtn.addEventListener('click', clickSpy);

      ui._moreMenuElement.classList.add('opened');
      deleteItem.click();

      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  describe('Submenu Overflow More Menu', () => {
    it('should create tie-submenu-more-wrap element with dark button and dropdown panel', () => {
      expect(ui._submenuMoreElement).toBeDefined();
      expect(ui._submenuMoreElement.classList.contains('tie-submenu-more-wrap')).toBe(true);
      expect(ui._submenuMoreElement.querySelector('.tie-submenu-more-btn')).not.toBeNull();
      expect(ui._submenuMoreElement.querySelector('.tie-submenu-more-panel')).not.toBeNull();
      expect(ui._submenuMoreElement.querySelector('.tie-submenu-more-content')).not.toBeNull();
    });

    it('should hide submenu more button when no items overflow', () => {
      ui.submenu = 'filter';
      ui._updateSubmenuOverflow();

      expect(ui._submenuMoreElement.style.display).toBe('none');
      expect(ui._submenuMoreElement.classList.contains('opened')).toBe(false);
    });

    it('should show more button, populate dropdown, and toggle opened state on overflow', () => {
      ui.submenu = 'filter';
      const filterMenuEl = ui._subMenuElement.querySelector('.tui-image-editor-menu-filter');

      // 模拟子菜单容器宽度与项的坐标
      ui._subMenuElement.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        right: 300,
        width: 300,
      }));

      const chips = filterMenuEl.querySelectorAll('.tie-filter-group-presets .tui-filter-chip');
      chips.forEach((chip, index) => {
        // 模拟可见性 offsetParent
        Object.defineProperty(chip, 'offsetParent', { value: filterMenuEl, configurable: true });
        Object.defineProperty(chip, 'offsetWidth', { value: 60, configurable: true });
        chip.getBoundingClientRect = jest.fn(() => ({
          left: index * 60,
          right: (index + 1) * 60,
          width: 60,
        }));
      });

      ui._updateSubmenuOverflow();

      // 容器 right 为 300，rightBoundary 为 272，第 5 个及以后 (right >= 300) 会被判定为溢出
      expect(ui._submenuMoreElement.style.display).toBe('inline-flex');
      expect(ui._submenuMoreElement.classList.contains('opened')).toBe(false);

      const items = ui._submenuMoreContent.querySelectorAll('.tie-submenu-more-item');
      expect(items.length).toBeGreaterThan(0);

      // 点击展开
      ui._submenuMoreElement.click();
      expect(ui._submenuMoreElement.classList.contains('opened')).toBe(true);

      // 点击页面外部收起
      document.body.click();
      expect(ui._submenuMoreElement.classList.contains('opened')).toBe(false);
    });

    it('should proxy click to original filter item and close dropdown when item clicked', () => {
      ui.submenu = 'filter';
      const filterMenuEl = ui._subMenuElement.querySelector('.tui-image-editor-menu-filter');

      ui._subMenuElement.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        right: 100,
        width: 100,
      }));

      const chips = filterMenuEl.querySelectorAll('.tie-filter-group-presets .tui-filter-chip');
      chips.forEach((chip, index) => {
        Object.defineProperty(chip, 'offsetParent', { value: filterMenuEl, configurable: true });
        Object.defineProperty(chip, 'offsetWidth', { value: 60, configurable: true });
        chip.getBoundingClientRect = jest.fn(() => ({
          left: index * 60,
          right: (index + 1) * 60,
          width: 60,
        }));
      });

      ui._updateSubmenuOverflow();

      const firstMoreItem = ui._submenuMoreContent.querySelector('.tie-submenu-more-item');
      expect(firstMoreItem).not.toBeNull();

      ui._submenuMoreElement.classList.add('opened');

      const targetInput = chips[1].querySelector('input');
      const clickSpy = jest.fn();
      targetInput.addEventListener('click', clickSpy);

      firstMoreItem.click();

      expect(ui._submenuMoreElement.classList.contains('opened')).toBe(false);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should reset submenu more element when submenu is deactivated', () => {
      ui.submenu = 'filter';
      ui._submenuMoreElement.style.display = 'inline-flex';
      ui._submenuMoreElement.classList.add('opened');

      ui._deactivateSubmenu(false);

      expect(ui._submenuMoreElement.classList.contains('opened')).toBe(false);
      expect(ui._submenuMoreElement.style.display).toBe('none');
    });
  });
});

describe('Lasso UI', () => {
  let lasso, actions, subMenuElement;

  beforeEach(() => {
    subMenuElement = document.createElement('div');
    actions = {
      setLassoMode: jest.fn(),
      getLassoMode: jest.fn(() => null),
      stopDrawingMode: jest.fn(),
      discardSelection: jest.fn(),
    };
    lasso = new Lasso(subMenuElement, {
      locale: { localize: (message) => message },
      makeSvgIcon: () => '',
      menuBarPosition: 'bottom',
      usageStatistics: false,
    });
    lasso.addEvent(actions);
  });

  afterEach(() => {
    lasso.destroy();
  });

  it('should keep freehand selected after standby and start until the user changes it', () => {
    const freehandButton = subMenuElement.querySelector('.freehand .tui-image-editor-button');

    freehandButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    lasso.changeStandbyMode();
    lasso.changeStartMode();

    expect(lasso.type).toBe('freehand');
    expect(freehandButton.classList.contains('active')).toBe(true);
    expect(actions.setLassoMode).toHaveBeenLastCalledWith('freehand');
  });
});
