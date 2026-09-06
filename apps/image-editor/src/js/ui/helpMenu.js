import { COMMAND_HELP_MENUS, DELETE_HELP_MENUS, VIEW_HELP_MENUS, ZOOM_HELP_MENUS } from '@/consts';

export function makeHelpMenuWithPartitions() {
  return [
    ...ZOOM_HELP_MENUS,
    '',
    ...COMMAND_HELP_MENUS,
    '',
    ...DELETE_HELP_MENUS,
    '',
    ...VIEW_HELP_MENUS,
    '',
    'load',
    'download',
  ];
}

export const HELP_MENU_TITLE_KEYS = {
  zoomIn: 'ZoomIn',
  zoomOut: 'ZoomOut',
  hand: 'Hand',
  undo: 'Undo',
  redo: 'Redo',
  history: 'History',
  reset: 'Reset',
  delete: 'Delete',
  deleteAll: 'DeleteAll',
  viewOriginal: 'ViewOriginal',
  load: 'Load',
  download: 'Download',
};
