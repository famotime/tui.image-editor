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
  ];
}
