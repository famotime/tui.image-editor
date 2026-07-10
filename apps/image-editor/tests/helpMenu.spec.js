import {
  COMMAND_HELP_MENUS,
  DELETE_HELP_MENUS,
  VIEW_HELP_MENUS,
  ZOOM_HELP_MENUS,
} from '@/consts';
import { makeHelpMenuWithPartitions } from '@/ui/helpMenu';

describe('helpMenu', () => {
  it('groups help menus with partition placeholders', () => {
    expect(makeHelpMenuWithPartitions()).toEqual([
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
    ]);
  });
});
