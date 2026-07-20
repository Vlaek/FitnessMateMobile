import type { en, TranslationShape } from './en';

export const ru: TranslationShape<typeof en> = {
  common: {
    save: 'Сохранить', cancel: 'Отмена', close: 'Закрыть', retry: 'Повторить', delete: 'Удалить',
    edit: 'Изменить', duplicate: 'Копировать', create: 'Создать', add: 'Добавить', done: 'Готово',
    confirm: 'Подтвердить', moveUp: 'Переместить выше', moveDown: 'Переместить ниже', kg: 'кг', lb: 'фунт',
  },
  nav: { home: 'Главная', programs: 'Программы', start: 'Старт', history: 'История', progress: 'Прогресс' },
  app: { loading: 'Загружаем данные…', databaseError: 'Не удалось открыть локальные данные.' },
  home: {
    title: 'FitnessMate', greeting: 'Готовы тренироваться?', noWorkouts: 'Завершённые тренировки появятся здесь.',
    weeklyVolume: 'Объём за неделю', workouts: 'Тренировки', resumeDraft: 'Продолжить тренировку',
  },
  programs: {
    title: 'Программы', emptyTitle: 'Программ пока нет', emptyBody: 'Создайте многоразовую программу тренировки.',
    new: 'Новая программа', name: 'Название программы', description: 'Описание', exercises: 'Упражнения',
    sets: 'подходов', exerciseCount: 'упражнений', deleteTitle: 'Удалить программу?',
    deleteBody: 'Программа будет удалена. История тренировок не изменится.', notFound: 'Программа не найдена.',
    nameRequired: 'Введите название программы.', exerciseRequired: 'Добавьте хотя бы одно упражнение.',
  },
  editor: {
    addExercise: 'Добавить упражнение', addSet: 'Добавить подход', removeExercise: 'Удалить упражнение',
    removeSet: 'Удалить подход', duplicateSet: 'Копировать подход', weight: 'Вес', reps: 'Повторы',
    setNumber: 'Подход {{number}}', chooseExercise: 'Выберите упражнение', searchExercise: 'Поиск упражнений',
    customExercise: 'Создать своё упражнение', customName: 'Название упражнения', muscleGroup: 'Группа мышц',
  },
  start: {
    title: 'Начать тренировку', choose: 'Выберите программу или начните пустую тренировку.',
    emptyWorkout: 'Пустая тренировка', unfinished: 'Проведение тренировки будет доступно на следующем этапе.',
  },
  history: { title: 'История', emptyTitle: 'История пуста', emptyBody: 'Завершите тренировку, чтобы увидеть её здесь.' },
  progress: { title: 'Прогресс', emptyTitle: 'Нет данных', emptyBody: 'Завершите тренировки, чтобы открыть аналитику.' },
  settings: {
    title: 'Настройки', language: 'Язык', units: 'Единицы веса', theme: 'Тема',
    russian: 'Русский', english: 'Английский', kilograms: 'Килограммы', pounds: 'Фунты',
    system: 'Системная', light: 'Светлая', dark: 'Тёмная',
  },
  muscleGroups: { chest: 'Грудь', back: 'Спина', legs: 'Ноги', shoulders: 'Плечи', arms: 'Руки', core: 'Кор', other: 'Другое' },
  exercises: {
    barbellBenchPress: 'Жим штанги лёжа', squat: 'Приседания', deadlift: 'Становая тяга',
    overheadPress: 'Жим над головой', barbellRow: 'Тяга штанги в наклоне', pullUp: 'Подтягивания',
    bicepsCurl: 'Сгибание на бицепс', tricepsExtension: 'Разгибание на трицепс', legPress: 'Жим ногами', calfRaise: 'Подъёмы на носки',
  },
};
