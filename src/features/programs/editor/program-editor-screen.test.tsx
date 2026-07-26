import { render } from '@testing-library/react-native';
import { setAppLanguage } from '@/shared/i18n';
import { ProgramEditorScreen } from './program-editor-screen';
import { useProgramEditor } from './use-program-editor';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

jest.mock('./use-program-editor', () => ({
  useProgramEditor: jest.fn(),
}));

const exerciseA = '11111111-1111-4111-8111-111111111111';
const exerciseB = '22222222-2222-4222-8222-222222222222';

describe('ProgramEditorScreen', () => {
  beforeAll(async () => setAppLanguage('en'));

  beforeEach(() => {
    jest.mocked(useProgramEditor).mockReturnValue({
      draft: {
        name: 'Strength',
        description: '',
        exercises: [
          { exerciseId: exerciseA, sets: [{ weightKg: 50, repetitions: 8 }] },
          { exerciseId: exerciseB, sets: [{ weightKg: 60, repetitions: 6 }] },
        ],
      },
      setDraft: jest.fn(),
      exercises: [
        {
          id: exerciseA,
          builtInKey: null,
          customName: 'Squat',
          muscleGroup: 'legs',
          isCustom: true,
        },
        {
          id: exerciseB,
          builtInKey: null,
          customName: 'Press',
          muscleGroup: 'chest',
          isCustom: true,
        },
      ],
      loading: false,
      saving: false,
      error: null,
      save: jest.fn(),
      createExercise: jest.fn(),
    });
  });

  it('uses crosses, sortable cards and a bottom back action', async () => {
    const view = await render(<ProgramEditorScreen programId="program-1" />);

    expect(view.queryByText('Cancel')).toBeNull();
    expect(view.queryByText('↑')).toBeNull();
    expect(view.queryByText('↓')).toBeNull();
    expect(view.getAllByLabelText('Remove exercise')).toHaveLength(2);
    expect(view.getByTestId(`sortable-item-${exerciseA}-0`)).toBeTruthy();
    expect(view.getByText('Go back')).toBeTruthy();
  });
});
