import Filter from '@/ui/filter';
import Locale from '@/ui/locale/locale';

describe('UI Filter', () => {
  let subMenuElement;
  let filterUi;
  let mockApplyFilter;

  beforeEach(() => {
    subMenuElement = document.createElement('div');
    document.body.appendChild(subMenuElement);

    const locale = new Locale({});
    filterUi = new Filter(subMenuElement, {
      locale,
      menuBarPosition: 'bottom',
      usageStatistics: false,
    });

    mockApplyFilter = jest.fn();
    filterUi.addEvent({ applyFilter: mockApplyFilter });
  });

  afterEach(() => {
    if (filterUi) {
      filterUi.destroy();
    }
    if (subMenuElement && subMenuElement.parentNode) {
      subMenuElement.parentNode.removeChild(subMenuElement);
    }
  });

  it('should initialize with presets category active by default', () => {
    expect(filterUi._activeCategory).toBe('presets');
    const presetsGroup = subMenuElement.querySelector('.tie-filter-group-presets');
    const adjustmentsGroup = subMenuElement.querySelector('.tie-filter-group-adjustments');

    expect(presetsGroup).not.toBeNull();
    expect(adjustmentsGroup).not.toBeNull();
    expect(adjustmentsGroup.style.display).toBe('none');
  });

  it('should switch category tab and toggle group visibility on category click', () => {
    const adjBtn = subMenuElement.querySelector(
      '.tie-filter-category-segment [data-category="adjustments"]'
    );
    expect(adjBtn).not.toBeNull();

    adjBtn.click();

    expect(filterUi._activeCategory).toBe('adjustments');
    expect(adjBtn.classList.contains('active')).toBe(true);

    const presetsGroup = subMenuElement.querySelector('.tie-filter-group-presets');
    const adjustmentsGroup = subMenuElement.querySelector('.tie-filter-group-adjustments');

    expect(presetsGroup.style.display).toBe('none');
    expect(adjustmentsGroup.style.display).toBe('inline-flex');
  });

  it('should toggle chip active state and update category dot badge when a filter is toggled', () => {
    const grayscaleInput = subMenuElement.querySelector('.tie-grayscale');
    expect(grayscaleInput).not.toBeNull();

    const chip = grayscaleInput.closest('.tui-filter-chip');
    expect(chip).not.toBeNull();

    const presetsDot = subMenuElement.querySelector('.tie-filter-category-dot.presets-dot');
    expect(presetsDot.classList.contains('has-active')).toBe(false);

    // Toggle on
    grayscaleInput.checked = true;
    grayscaleInput.dispatchEvent(new Event('change'));

    expect(mockApplyFilter).toHaveBeenCalledWith(true, 'grayscale', {}, false);
    expect(chip.classList.contains('active')).toBe(true);
    expect(presetsDot.classList.contains('has-active')).toBe(true);

    // Toggle off
    grayscaleInput.checked = false;
    grayscaleInput.dispatchEvent(new Event('change'));

    expect(mockApplyFilter).toHaveBeenCalledWith(false, 'grayscale', {}, false);
    expect(chip.classList.contains('active')).toBe(false);
    expect(presetsDot.classList.contains('has-active')).toBe(false);
  });

  it('should sync chip and badge state when setFilterState (undo/redo) is invoked', () => {
    const presetsDot = subMenuElement.querySelector('.tie-filter-category-dot.presets-dot');

    filterUi.setFilterState({
      type: 'grayscale',
      action: 'add',
      options: {},
    });

    const grayscaleInput = subMenuElement.querySelector('.tie-grayscale');
    const chip = grayscaleInput.closest('.tui-filter-chip');

    expect(grayscaleInput.checked).toBe(true);
    expect(chip.classList.contains('active')).toBe(true);
    expect(presetsDot.classList.contains('has-active')).toBe(true);

    filterUi.setFilterState({
      type: 'grayscale',
      action: 'remove',
      options: {},
    });

    expect(grayscaleInput.checked).toBe(false);
    expect(chip.classList.contains('active')).toBe(false);
    expect(presetsDot.classList.contains('has-active')).toBe(false);
  });

  it('should reset all filter states on initFilterCheckBoxState', () => {
    const grayscaleInput = subMenuElement.querySelector('.tie-grayscale');
    const presetsDot = subMenuElement.querySelector('.tie-filter-category-dot.presets-dot');

    grayscaleInput.checked = true;
    grayscaleInput.dispatchEvent(new Event('change'));
    expect(presetsDot.classList.contains('has-active')).toBe(true);

    filterUi.initFilterCheckBoxState();

    expect(grayscaleInput.checked).toBe(false);
    expect(presetsDot.classList.contains('has-active')).toBe(false);
  });
});
