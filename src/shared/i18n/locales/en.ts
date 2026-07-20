export type TranslationShape<T> = {
  [Key in keyof T]: T[Key] extends string ? string : TranslationShape<T[Key]>;
};

export const en = {
  common: {
    save: 'Save', cancel: 'Cancel', close: 'Close', retry: 'Retry', delete: 'Delete',
    edit: 'Edit', duplicate: 'Duplicate', create: 'Create', add: 'Add', done: 'Done',
    confirm: 'Confirm', moveUp: 'Move up', moveDown: 'Move down', kg: 'kg', lb: 'lb',
  },
  nav: { home: 'Home', programs: 'Programs', start: 'Start', history: 'History', progress: 'Progress' },
  app: { loading: 'Loading your data…', databaseError: 'Could not open local data.' },
  home: {
    title: 'FitnessMate', greeting: 'Ready to train?', noWorkouts: 'Your completed workouts will appear here.',
    weeklyVolume: 'Weekly volume', workouts: 'Workouts', resumeDraft: 'Resume workout',
  },
  programs: {
    title: 'Programs', emptyTitle: 'No programs yet', emptyBody: 'Create a reusable workout program.',
    new: 'New program', name: 'Program name', description: 'Description', exercises: 'Exercises',
    sets: 'sets', exerciseCount: 'exercises', deleteTitle: 'Delete program?',
    deleteBody: 'The program will be removed. Workout history stays unchanged.', notFound: 'Program not found.',
    nameRequired: 'Enter a program name.', exerciseRequired: 'Add at least one exercise.',
  },
  editor: {
    addExercise: 'Add exercise', addSet: 'Add set', removeExercise: 'Remove exercise',
    removeSet: 'Remove set', duplicateSet: 'Duplicate set', weight: 'Weight', reps: 'Reps',
    setNumber: 'Set {{number}}', chooseExercise: 'Choose exercise', searchExercise: 'Search exercises',
    customExercise: 'Create custom exercise', customName: 'Exercise name', muscleGroup: 'Muscle group',
  },
  start: {
    title: 'Start workout', choose: 'Choose a program or start an empty workout.',
    emptyWorkout: 'Empty workout', unfinished: 'Workout tracking is available in the next build step.',
  },
  history: { title: 'History', emptyTitle: 'No workout history', emptyBody: 'Finish a workout to see it here.' },
  progress: { title: 'Progress', emptyTitle: 'No progress data', emptyBody: 'Complete workouts to unlock analytics.' },
  settings: {
    title: 'Settings', language: 'Language', units: 'Weight units', theme: 'Theme',
    russian: 'Russian', english: 'English', kilograms: 'Kilograms', pounds: 'Pounds',
    system: 'System', light: 'Light', dark: 'Dark',
  },
  muscleGroups: { chest: 'Chest', back: 'Back', legs: 'Legs', shoulders: 'Shoulders', arms: 'Arms', core: 'Core', other: 'Other' },
  exercises: {
    barbellBenchPress: 'Barbell bench press', squat: 'Squat', deadlift: 'Deadlift',
    overheadPress: 'Overhead press', barbellRow: 'Barbell row', pullUp: 'Pull-up',
    bicepsCurl: 'Biceps curl', tricepsExtension: 'Triceps extension', legPress: 'Leg press', calfRaise: 'Calf raise',
  },
} as const;
