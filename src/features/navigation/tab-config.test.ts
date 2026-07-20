import { TAB_ROUTES } from './tab-config';

describe('tab navigation', () => {
  it('keeps the approved order and central start route', () => {
    expect(TAB_ROUTES.map((route) => route.name)).toEqual(['index', 'programs', 'start', 'history', 'progress']);
    expect(TAB_ROUTES[2]).toMatchObject({ name: 'start', prominent: true });
  });
});
