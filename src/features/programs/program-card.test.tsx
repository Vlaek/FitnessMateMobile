import { render } from '@testing-library/react-native';

import type { ProgramSummary } from '@/domain/programs/types';
import { setAppLanguage } from '@/shared/i18n';

import { ProgramCard } from './program-card';

const program: ProgramSummary = {
  id: 'program',
  name: 'Strength',
  description: 'Main lifts',
  sortOrder: 0,
  exerciseCount: 3,
  setCount: 9,
};

describe('ProgramCard', () => {
  beforeAll(async () => setAppLanguage('en'));

  it('shows Edit and an accessible delete cross without legacy actions', async () => {
    const view = await render(
      <ProgramCard program={program} onOpen={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(view.getByText('Edit')).toBeTruthy();
    expect(view.getByLabelText('Delete program')).toBeTruthy();
    expect(view.queryByText('Duplicate')).toBeNull();
    expect(view.queryByText('Move up')).toBeNull();
    expect(view.queryByText('Move down')).toBeNull();
  });
});
