const includeUIOptions = {
  includeUI: {
    initMenu: 'filter',
  },
};

export const editorDefaultOptions = {
  cssMaxWidth: 700,
  cssMaxHeight: 500,
};

export function buildEditorOptions(includeUi, options = editorDefaultOptions) {
  if (!includeUi) {
    return options;
  }

  return {
    ...options,
    includeUI: {
      ...includeUIOptions.includeUI,
      ...(options.includeUI || {}),
    },
  };
}
