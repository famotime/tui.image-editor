import { buildEditorOptions } from '../src/options';

describe('buildEditorOptions', () => {
  it('does not mutate include UI defaults when merging caller options', () => {
    const firstOptions = buildEditorOptions(true, {
      includeUI: {
        initMenu: 'shape',
        menuBarPosition: 'left',
      },
      cssMaxWidth: 300,
    });
    const secondOptions = buildEditorOptions(true, {});

    expect(firstOptions).toEqual({
      includeUI: {
        initMenu: 'shape',
        menuBarPosition: 'left',
      },
      cssMaxWidth: 300,
    });
    expect(secondOptions).toEqual({
      includeUI: {
        initMenu: 'filter',
      },
    });
  });

  it('returns caller options unchanged when include UI is disabled', () => {
    const options = {
      cssMaxWidth: 320,
      cssMaxHeight: 240,
    };

    expect(buildEditorOptions(false, options)).toEqual(options);
  });
});
