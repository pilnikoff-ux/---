export type Language = 'ua' | 'ru' | 'en';

export interface TranslationsDict {
  [key: string]: {
    ua: string;
    ru: string;
    en: string;
  };
}

export const translations: TranslationsDict = {
  // Brand & Header
  app_name: {
    ua: 'Психологічно-коучинговий навігатор',
    ru: 'Психологическо-коучинговый навигатор',
    en: 'Psychological & Coaching Navigator',
  },
  app_subtitle: {
    ua: 'Консиліум шкіл, глибинна трансформація, Архетипи та Мета Героя',
    ru: 'Консилиум школ, глубинная трансформация, Архетипы и Цель Героя',
    en: "Consilium of schools, deep transformation, Archetypes & Hero's Goal",
  },
  linetsky_badge: {
    ua: 'Олег Линецький: Вспалахи Вічної Філософії',
    ru: 'Олег Линецкий: Вспышки Вечной Философии',
    en: 'Oleg Linetsky: Flashes of Perennial Philosophy',
  },

  // Tabs / Navigation
  tab_consilium: {
    ua: 'Консиліум',
    ru: 'Консилиум',
    en: 'Consilium',
  },
  tab_consilium_desc: {
    ua: 'Мультимодальний консиліум шкіл психотерапії та рівні Ділтса',
    ru: 'Мультимодальный консилиум школ психотерапии и уровни Дилтса',
    en: 'Multimodal consilium of psychotherapy schools & Dilts levels',
  },
  tab_affirmations: {
    ua: 'Афірмації Дня',
    ru: 'Аффирмации Дня',
    en: 'Daily Affirmations',
  },
  tab_affirmations_desc: {
    ua: 'Нейро-опори, стоїчна мудрість та дихання',
    ru: 'Нейро-опоры, стоическая мудрость и дыхание',
    en: 'Neuro-anchors, stoic wisdom & somatic breathing',
  },
  tab_archetypes: {
    ua: 'Архетипи Юнга',
    ru: 'Архетипы Юнга',
    en: 'Jungian Archetypes',
  },
  tab_archetypes_desc: {
    ua: 'Діагностика 12 архетипів, Тіні та Самості',
    ru: 'Диагностика 12 архетипов, Тени и Самости',
    en: '12 Archetypes, Shadow & Self diagnostic',
  },
  tab_valuesMotivation: {
    ua: 'Мотивація & Цінності',
    ru: 'Мотивация и Ценности',
    en: 'Motivation & Values',
  },
  tab_valuesMotivation_desc: {
    ua: 'Глибинна мотивація та карта 10 базових цінностей',
    ru: 'Глубинная мотивация и карта 10 базовых ценностей',
    en: 'Deep motivation & 10 core values map',
  },
  tab_beliefPatterning: {
    ua: 'Патеринг переконань',
    ru: 'Паттеринг убеждений',
    en: 'Belief Patterning',
  },
  tab_beliefPatterning_desc: {
    ua: '14 фокусів мови Роберта Ділтса для трансформації установок',
    ru: '14 фокусов языка Роберта Дилтса для трансформации установок',
    en: "Robert Dilts' 14 Sleight of Mouth reframing engines",
  },
  tab_associations16: {
    ua: '16 Асоціацій',
    ru: '16 Ассоциаций',
    en: '16 Associations',
  },
  tab_associations16_desc: {
    ua: 'Піраміда Юнга: розкриття несвідомого коду',
    ru: 'Пирамида Юнга: раскрытие бессознательного кода',
    en: 'Jungian pyramid: subconscious code reveal',
  },
  tab_descartes: {
    ua: 'Квадрат Декарта',
    ru: 'Квадрат Декарта',
    en: 'Descartes Square',
  },
  tab_descartes_desc: {
    ua: '4D аналіз прийняття складних рішень',
    ru: '4D анализ принятия сложных решений',
    en: '4D complex decision-making analysis',
  },
  tab_fiveWhys: {
    ua: '5 Чому',
    ru: '5 Почему',
    en: '5 Whys',
  },
  tab_fiveWhys_desc: {
    ua: 'Пошук першопричини та точки трансформації',
    ru: 'Поиск первопричины и точки трансформации',
    en: 'Root cause discovery & pivot points',
  },
  tab_cbt: {
    ua: 'КПТ Щоденник',
    ru: 'КПТ Дневник',
    en: 'CBT Diary',
  },
  tab_cbt_desc: {
    ua: 'Когнітивно-поведінкова реструктуризація думок',
    ru: 'Когнитивно-поведенческая реструктуризация мыслей',
    en: 'Cognitive-behavioral thought restructuring',
  },
  tab_goalMakersBoard: {
    ua: 'Goal MAker$',
    ru: 'Goal MAker$',
    en: 'Goal MAker$',
  },
  tab_goalMakersBoard_desc: {
    ua: 'Настільна гра-тренінг (Конфайнмент-моделювання)',
    ru: 'Настольная игра-тренинг (Конфайнмент-моделирование)',
    en: 'Confinement Modeling Training Board Game',
  },
  tab_goalMakers: {
    ua: 'Мета Героя',
    ru: 'Цель Героя',
    en: "Hero's Goal",
  },
  tab_goalMakers_desc: {
    ua: 'Гейміфікований RPG квест досягнення цілей',
    ru: 'Геймифицированный RPG квест достижения целей',
    en: "Gamified RPG quest for goal achievement",
  },
  tab_nvcEq: {
    ua: 'ННК & EQ',
    ru: 'НОО & EQ',
    en: 'NVC & EQ',
  },
  tab_nvcEq_desc: {
    ua: 'Ненасильницька комунікація та Емоційний інтелект',
    ru: 'Ненасильственное общение и Эмоциональный интеллект',
    en: 'Nonviolent Communication & Emotional Intelligence',
  },
  tab_wheelOfBalance: {
    ua: 'Колесо Балансу',
    ru: 'Колесо Баланса',
    en: 'Wheel of Balance',
  },
  tab_wheelOfBalance_desc: {
    ua: 'Діагностика 8 сфер життя та пошук сфери-важеля',
    ru: 'Диагностика 8 сфер жизни и поиск сферы-рычага',
    en: 'Diagnostic of 8 life spheres & leverage pivot point',
  },
  tab_feedback: {
    ua: 'Зворотний звʼязок',
    ru: 'Обратная связь',
    en: 'Feedback & Learning',
  },
  tab_feedback_desc: {
    ua: 'Відгуки клієнтів та самонавчання навігатора',
    ru: 'Отзывы клиентов и самообучение навигатора',
    en: 'User reviews & navigator self-learning engine',
  },
  tab_knowledge: {
    ua: 'База Знань',
    ru: 'База Знаний',
    en: 'Knowledge Base',
  },
  tab_knowledge_desc: {
    ua: 'Концепції Линецького та каталог психотерапії',
    ru: 'Концепции Линецкого и каталог психотерапии',
    en: 'Linetsky concepts & therapy library',
  },
  tab_journal: {
    ua: 'Журнал',
    ru: 'Журнал',
    en: 'Journal',
  },
  tab_journal_desc: {
    ua: 'Збережені аналізи, квести та щоденники',
    ru: 'Сохраненные анализы, квесты и дневники',
    en: 'Saved analyses, quests & diaries',
  },
  tab_stats: {
    ua: 'Статистика & Профіль',
    ru: 'Статистика и Профиль',
    en: 'Stats & Profile',
  },

  // Common UI
  save_to_journal: {
    ua: 'Зберегти в Журнал',
    ru: 'Сохранить в Журнал',
    en: 'Save to Journal',
  },
  saved_successfully: {
    ua: 'Збережено успішно!',
    ru: 'Успешно сохранено!',
    en: 'Saved successfully!',
  },
  voice_input_tooltip: {
    ua: 'Голосове введення (натисніть та говоріть)',
    ru: 'Голосовой ввод (нажмите и говорите)',
    en: 'Voice input (click and speak)',
  },
  instructions_btn: {
    ua: 'Інструкція та правила',
    ru: 'Инструкция и правила',
    en: 'Instructions & Rules',
  },
  loading_ai: {
    ua: 'ШІ-Консиліум формує глибинний аналіз...',
    ru: 'ИИ-Консилиум формирует глубинный анализ...',
    en: 'AI Consilium is formulating deep analysis...',
  },
  export_csv: {
    ua: 'Експорт у CSV',
    ru: 'Экспорт в CSV',
    en: 'Export to CSV',
  },
  export_json: {
    ua: 'Експорт у JSON',
    ru: 'Экспорт в JSON',
    en: 'Export to JSON',
  },
  profile_title: {
    ua: 'Профіль користувача',
    ru: 'Профиль пользователя',
    en: 'User Profile',
  },
  login_label: {
    ua: 'Логін / Нікнейм',
    ru: 'Логин / Никнейм',
    en: 'Login / Nickname',
  },
  name_label: {
    ua: 'Ваше імʼя',
    ru: 'Ваше имя',
    en: 'Your Name',
  },
  field_of_activity_label: {
    ua: 'Сфера діяльності / Професія',
    ru: 'Сфера деятельности / Профессия',
    en: 'Field of Activity / Profession',
  },
  birth_date_label: {
    ua: 'Дата народження',
    ru: 'Дата рождения',
    en: 'Date of Birth',
  },
  registered_at_label: {
    ua: 'Дата реєстрації',
    ru: 'Дата регистрации',
    en: 'Registration Date',
  },
  action_plan_title: {
    ua: 'Покроковий план дій та дорожня карта',
    ru: 'Пошаговый план действий и дорожная карта',
    en: 'Action Plan & Step-by-Step Roadmap',
  },
  action_24h: {
    ua: '24 години: Перший мікро-крок',
    ru: '24 часа: Первый микро-шаг',
    en: '24 Hours: Immediate Micro-step',
  },
  action_7d: {
    ua: '7 днів: Закріплення та експеримент',
    ru: '7 дней: Закрепление и эксперимент',
    en: '7 Days: Anchor & Experiment',
  },
  action_30d: {
    ua: '30 днів: Системна звичка та інтеграція',
    ru: '30 дней: Системная привычка и интеграция',
    en: '30 Days: Systemic Habit & Integration',
  },
  how_to_perform_btn: {
    ua: 'Як це виконувати (покрокова інструкція)',
    ru: 'Как это выполнять (пошаговая инструкция)',
    en: 'How to perform (Step-by-step guide)',
  },
  how_to_perform_title: {
    ua: 'Покроковий алгоритм виконання практики',
    ru: 'Пошаговый алгоритм выполнения практики',
    en: 'Step-by-step Execution Algorithm',
  },
};
