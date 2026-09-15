import { DailyAffirmationItem } from '../types';

export interface MoodCategory {
  id: DailyAffirmationItem['category'];
  titleUk: string;
  titleRu?: string;
  titleEn: string;
  emoji: string;
  descriptionUk: string;
  descriptionRu?: string;
  descriptionEn: string;
  color: string;
  bgLight: string;
  bgDark: string;
  accentBorder: string;
}

export const MOOD_CATEGORIES: MoodCategory[] = [
  {
    id: 'anxiety_overwhelm',
    titleUk: 'Тривога та перевантаження',
    titleRu: 'Тревога и перегрузка',
    titleEn: 'Anxiety & Overwhelm',
    emoji: '🌊',
    descriptionUk: 'Коли думок забагато, пульс прискорений, а майбутнє лякає',
    descriptionRu: 'Когда мыслей слишком много, пульс учащен, а будущее пугает',
    descriptionEn: 'When thoughts are racing and the future feels intimidating',
    color: 'text-sky-600 dark:text-sky-400',
    bgLight: 'bg-sky-50',
    bgDark: 'dark:bg-sky-950/40',
    accentBorder: 'border-sky-500/40',
  },
  {
    id: 'burnout_exhaustion',
    titleUk: 'Виснаження та вигорання',
    titleRu: 'Истощение и выгорание',
    titleEn: 'Burnout & Fatigue',
    emoji: '🔋',
    descriptionUk: 'Брак сил, емоційне спустошення та потреба у турботі про себе',
    descriptionRu: 'Нехватка сил, эмоциональное опустошение и потребность в заботе о себе',
    descriptionEn: 'Lack of energy, emotional depletion, needing self-care',
    color: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/40',
    accentBorder: 'border-amber-500/40',
  },
  {
    id: 'impostor_doubt',
    titleUk: 'Невпевненість & Самокритика',
    titleRu: 'Неуверенность & Самокритика',
    titleEn: 'Self-Doubt & Inner Critic',
    emoji: '🛡️',
    descriptionUk: 'Синдром самозванця, страх осуду, сумніви у власній цінності',
    descriptionRu: 'Синдром самозванца, страх осуждения, сомнения в собственной ценности',
    descriptionEn: 'Impostor syndrome, fear of judgment, doubting your worth',
    color: 'text-violet-600 dark:text-violet-400',
    bgLight: 'bg-violet-50',
    bgDark: 'dark:bg-violet-950/40',
    accentBorder: 'border-violet-500/40',
  },
  {
    id: 'sadness_grief',
    titleUk: 'Сум або розчарування',
    titleRu: 'Грусть или разочарование',
    titleEn: 'Sadness & Disappointment',
    emoji: '🌧️',
    descriptionUk: 'Втрата очікувань, біль змін, потреба у прийнятті почуттів',
    descriptionRu: 'Потеря ожиданий, боль перемен, потребность в принятии чувств',
    descriptionEn: 'Loss of expectations, pain of change, honoring grief',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgLight: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-950/40',
    accentBorder: 'border-indigo-500/40',
  },
  {
    id: 'anger_frustration',
    titleUk: 'Злість або роздратування',
    titleRu: 'Злость или раздражение',
    titleEn: 'Anger & Frustration',
    emoji: '⚡',
    descriptionUk: 'Порушення особистих кордонів, відчуття несправедливості',
    descriptionRu: 'Нарушение личных границ, чувство несправедливости',
    descriptionEn: 'Boundary breaches, indignation, tension with others',
    color: 'text-rose-600 dark:text-rose-400',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/40',
    accentBorder: 'border-rose-500/40',
  },
  {
    id: 'decision_fear',
    titleUk: 'Страх вибору & Невизначеність',
    titleRu: 'Страх выбора & Неопределенность',
    titleEn: 'Indecision & Uncertainty',
    emoji: '🧭',
    descriptionUk: 'Параліч аналізу, страх помилитися на роздоріжжі',
    descriptionRu: 'Паралич анализа, страх ошибиться на распутье',
    descriptionEn: 'Analysis paralysis, fear of making a wrong choice',
    color: 'text-teal-600 dark:text-teal-400',
    bgLight: 'bg-teal-50',
    bgDark: 'dark:bg-teal-950/40',
    accentBorder: 'border-teal-500/40',
  },
  {
    id: 'focus_courage',
    titleUk: 'Фокус, Мужність & Дія',
    titleRu: 'Фокус, Мужество & Действие',
    titleEn: 'Focus, Courage & Action',
    emoji: '🏹',
    descriptionUk: 'Подолання прокрастинації, сміливий рух до великих цілей',
    descriptionRu: 'Преодоление прокрастинации, смелое движение к большим целям',
    descriptionEn: 'Overcoming procrastination, taking brave bold steps',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-500/40',
  },
  {
    id: 'gratitude_peace',
    titleUk: 'Вдячність & Внутрішня опора',
    titleRu: 'Благодарность & Внутренняя опора',
    titleEn: 'Gratitude & Inner Peace',
    emoji: '🌅',
    descriptionUk: 'Святкування життя, гармонія з собою, присутність у "тут і зараз"',
    descriptionRu: 'Празднование жизни, гармония с собой, присутствие в "здесь и сейчас"',
    descriptionEn: 'Celebrating life, harmony with self, presence in the now',
    color: 'text-amber-500 dark:text-amber-300',
    bgLight: 'bg-amber-50/70',
    bgDark: 'dark:bg-amber-950/30',
    accentBorder: 'border-amber-400/40',
  },
];

export const CURATED_AFFIRMATIONS: DailyAffirmationItem[] = [
  // 1. Anxiety & Overwhelm
  {
    id: 'aff-anx-1',
    date: '2026-01-01',
    category: 'anxiety_overwhelm',
    categoryTitleUk: 'Тривога та перевантаження',
    categoryTitleEn: 'Anxiety & Overwhelm',
    quoteUk: 'Я не мушу контролювати весь океан майбутнього. Достатньо керувати веслами мого човна прямо зараз.',
    quoteEn: 'I do not have to control the whole ocean of the future. It is enough to steer the oars of my boat right now.',
    authorOrSchoolUk: 'Стоїцизм & Когнітивне заземлення',
    authorOrSchoolEn: 'Stoicism & Cognitive Grounding',
    psychologicalMechanismUk: 'Звуження фокусу контролю знижує гіперактивацію мигдалеподібного тіла та повертає префронтальній корі керування поточною задачею.',
    psychologicalMechanismEn: 'Narrowing the locus of control dampens amygdala hyperactivity and restores prefrontal governance.',
    somaticAnchorUk: 'Покладіть обидві долоні на стегна, відчуйте стопами міцну підлогу і зробіть повільний видих через розімкнені губи.',
    somaticAnchorEn: 'Place both hands on your thighs, feel the solid floor under your feet, and exhale slowly through parted lips.',
    reflectionQuestionUk: 'Яка єдина дія в зоні мого 100% прямого контролю доступна мені в найближчі 15 хвилин?',
    reflectionQuestionEn: 'What single action strictly within my 100% direct control is available in the next 15 minutes?',
    microActionUk: 'Оберіть одну дрібну незавершену справу і виконайте її без поспіху.',
    microActionEn: 'Pick one small unfinished task and complete it without rushing.',
  },
  {
    id: 'aff-anx-2',
    date: '2026-01-02',
    category: 'anxiety_overwhelm',
    categoryTitleUk: 'Тривога та перевантаження',
    categoryTitleEn: 'Anxiety & Overwhelm',
    quoteUk: 'Тривога — це лише шум думок про те, що ще не сталося. У цьому моменті моє тіло в безпеці і я можу зробити подих.',
    quoteEn: 'Anxiety is merely the noise of thoughts about what has not yet happened. In this moment, my body is safe and I can take a breath.',
    authorOrSchoolUk: 'Терапія прийняття та відповідальності (ACT)',
    authorOrSchoolEn: 'Acceptance and Commitment Therapy (ACT)',
    psychologicalMechanismUk: 'Когнітивне розділення (Defusion): ми перестаємо ототожнювати думки з фактами реальності.',
    psychologicalMechanismEn: 'Cognitive defusion: disentangling automatic anxious forecasts from present objective safety.',
    somaticAnchorUk: 'Знайдіть очима 3 синіх або зелених предмети в кімнаті, щоб переключити зорову кору на сканування безпеки.',
    somaticAnchorEn: 'Spot 3 blue or green objects in the room to signal safety to your visual cortex.',
    reflectionQuestionUk: 'Чи є реальна фізична загроза прямо в цю секунду, чи це лише проєкція розуму?',
    reflectionQuestionEn: 'Is there a real physical threat at this exact second, or is it a mental projection?',
    microActionUk: 'Випийте склянку теплої води повільними маленькими ковтками.',
    microActionEn: 'Drink a glass of warm water in slow, intentional sips.',
  },

  // 2. Burnout & Exhaustion
  {
    id: 'aff-burn-1',
    date: '2026-01-03',
    category: 'burnout_exhaustion',
    categoryTitleUk: 'Виснаження та вигорання',
    categoryTitleEn: 'Burnout & Fatigue',
    quoteUk: 'Відпочинок — це не нагорода за виснаження, а базове пальне для існування. Я маю повне право зупинитися без почуття провини.',
    quoteEn: 'Rest is not a reward for total exhaustion, but the fundamental fuel of existence. I have the absolute right to pause without guilt.',
    authorOrSchoolUk: 'Природний підхід (Лінецький) & Самотурбота',
    authorOrSchoolEn: 'Natural Approach & Radical Self-Care',
    psychologicalMechanismUk: 'Деактивація внутрішнього критика-перфекціоніста знімає хронічний кортизоловий спазм і дозволяє парасимпатичній системі відновити ресурси.',
    psychologicalMechanismEn: 'Silencing the inner perfectionist lowers chronic cortisol and activates the parasympathetic rest-and-digest state.',
    somaticAnchorUk: 'Відкиньтеся на спинку крісла, опустіть плечі на 2 сантиметри вниз і дозвольте щелепі повністю розслабитися.',
    somaticAnchorEn: 'Lean back, drop your shoulders by two centimeters, and let your jaw unclench completely.',
    reflectionQuestionUk: 'Від чого несуттєвого я можу сьогодні відмовитися, щоб зберегти 20% життєвої енергії?',
    reflectionQuestionEn: 'What non-essential task can I safely cancel or postpone today to save 20% of my energy?',
    microActionUk: 'Влаштуйте 10 хвилин повної тиші без екранів, новин і розмов.',
    microActionEn: 'Take a 10-minute digital blackout with zero screens, notifications, or tasks.',
  },
  {
    id: 'aff-burn-2',
    date: '2026-01-04',
    category: 'burnout_exhaustion',
    categoryTitleUk: 'Виснаження та вигорання',
    categoryTitleEn: 'Burnout & Fatigue',
    quoteUk: 'Дерево не цвіте цілий рік, воно скидає листя для зими. Моя пауза — це накопичення сили для нового розквіту.',
    quoteEn: 'A tree does not blossom all year round; it sheds leaves for winter. My pause is gathering strength for a new bloom.',
    authorOrSchoolUk: 'Гештальт-терапія & Цикли контакту',
    authorOrSchoolEn: 'Gestalt Therapy & Life Cycles',
    psychologicalMechanismUk: 'Легітимізація фази асиміляції та спаду енергії як природної частини будь-якого органічного процесу.',
    psychologicalMechanismEn: 'Legitimizing the withdrawal/assimilation phase as a healthy natural organic rhythm.',
    somaticAnchorUk: 'Покладіть руку на серце та відчуйте тепло долоні через тканину одягу.',
    somaticAnchorEn: 'Place your palm over your heart and feel the soothing warmth through your clothes.',
    reflectionQuestionUk: 'Якої ніжності чи турботи моє тіло просить у мене просто зараз?',
    reflectionQuestionEn: 'What gentle care or nourishment is my physical body asking for right now?',
    microActionUk: 'Ляжте на 15 хвилин раніше сьогодні або зробіть легку розтяжку спини.',
    microActionEn: 'Go to sleep 15 minutes earlier tonight or stretch your spine gently.',
  },

  // 3. Impostor & Self-Doubt
  {
    id: 'aff-imp-1',
    date: '2026-01-05',
    category: 'impostor_doubt',
    categoryTitleUk: 'Невпевненість & Самокритика',
    categoryTitleEn: 'Self-Doubt & Inner Critic',
    quoteUk: 'Моя цінність не вимірюється бездоганністю. Я маю право бути у процесі навчання, робити помилки і залишатися гідною людиною.',
    quoteEn: 'My worth is not measured by flawlessness. I have the right to be in progress, to make mistakes, and remain worthy.',
    authorOrSchoolUk: 'Терапія самоспівчуття (Крістін Нефф)',
    authorOrSchoolEn: 'Mindful Self-Compassion (Kristin Neff)',
    psychologicalMechanismUk: 'Перехід від умовної самооцінки (постійна боротьба за статус) до безумовного самоприйняття знижує страх соціального відторгнення.',
    psychologicalMechanismEn: 'Shifting from conditional self-esteem to unconditional self-compassion disarms social anxiety.',
    somaticAnchorUk: 'Обійміть себе за плечі або міцно стисніть свої зап’ястя, відчуваючи власні фізичні кордони.',
    somaticAnchorEn: 'Hug your own shoulders or gently wrap hands around your wrists, sensing your tangible boundaries.',
    reflectionQuestionUk: 'Що б я сказав(ла) найдорожчому другові, якби він опинився у схожій ситуації сумнівів?',
    reflectionQuestionEn: 'What would I tell my dearest friend if they were experiencing this exact self-doubt?',
    microActionUk: 'Запишіть 3 реальні складнощі, які ви вже успішно подолали за останній рік.',
    microActionEn: 'Write down 3 real hardships that you have successfully overcome in the past year.',
  },
  {
    id: 'aff-imp-2',
    date: '2026-01-06',
    category: 'impostor_doubt',
    categoryTitleUk: 'Невпевненість & Самокритика',
    categoryTitleEn: 'Self-Doubt & Inner Critic',
    quoteUk: 'Сумнів — це ознака мислячого розуму, а не доказ моєї нездатності. Я дію разом із сумнівом, а не чекаю, поки він зникне.',
    quoteEn: 'Doubt is evidence of an inquisitive mind, not proof of incapacity. I act alongside doubt rather than waiting for it to vanish.',
    authorOrSchoolUk: 'Раціонально-емоційно-поведінкова терапія (РЕПТ)',
    authorOrSchoolEn: 'Rational Emotive Behavior Therapy (REBT)',
    psychologicalMechanismUk: 'Нормалізація дискомфорту трансформує сумнів із перешкоди на супутнє відчуття розвитку нейронних зв’язків.',
    psychologicalMechanismEn: 'Normalizing discomfort transforms doubt from a stop sign into an indicator of neural growth.',
    somaticAnchorUk: 'Розправте грудну клітку, підніміть погляд на лінію горизонту і відчуйте рівну поставу.',
    somaticAnchorEn: 'Open your chest, lift your gaze to the horizon line, and align your posture.',
    reflectionQuestionUk: 'Яку сміливу дію я відкладаю через очікування 100% готовності?',
    reflectionQuestionEn: 'What bold action am I delaying because I am waiting for 100% readiness?',
    microActionUk: 'Зробіть один перший крок до цієї дії на рівні "зроблено краще, ніж ідеально".',
    microActionEn: 'Take the first draft step under the rule: "Done is better than perfect".',
  },

  // 4. Sadness & Grief
  {
    id: 'aff-sad-1',
    date: '2026-01-07',
    category: 'sadness_grief',
    categoryTitleUk: 'Сум або розчарування',
    categoryTitleEn: 'Sadness & Disappointment',
    quoteUk: 'Я дозволяю собі сумувати без поспіху виправляти себе. Сум — це місце, де серце переосмислює те, що було для мене по-справжньому важливим.',
    quoteEn: 'I permit myself to feel sad without hurrying to fix myself. Sadness is where the heart processes what was truly precious.',
    authorOrSchoolUk: 'Екзистенційна психологія (Ірвін Ялом)',
    authorOrSchoolEn: 'Existential Psychology (Irvin Yalom)',
    psychologicalMechanismUk: 'Легалізація суму запобігає його соматизації та переходу в депресивну фіксацію.',
    psychologicalMechanismEn: 'Validating grief prevents somatic suppression and chronic depressive rumination.',
    somaticAnchorUk: 'Покладіть теплий плед або руку на живіт, дихайте м’яко, не затримуючи вдих.',
    somaticAnchorEn: 'Place a warm blanket or your hand over your belly, breathing softly without pauses.',
    reflectionQuestionUk: 'Про яку мою важливу цінність чи любов нагадує мені цей сум?',
    reflectionQuestionEn: 'What core value, dream, or love does this sadness signify?',
    microActionUk: 'Дозвольте собі 10 хвилин теплого чаю та м’якої музики без самобичування.',
    microActionEn: 'Allow yourself 10 minutes of warm tea and gentle music with zero self-blame.',
  },

  // 5. Anger & Frustration
  {
    id: 'aff-ang-1',
    date: '2026-01-08',
    category: 'anger_frustration',
    categoryTitleUk: 'Злість або роздратування',
    categoryTitleEn: 'Anger & Frustration',
    quoteUk: 'Моя злість — це священний охоронець моїх кордонів. Я скеровую цей вогонь не на руйнування, а на чіткість, захист та творення.',
    quoteEn: 'My anger is the sacred guardian of my boundaries. I direct this flame not into destruction, but into clarity, dignity, and creation.',
    authorOrSchoolUk: 'Ненасильницька комунікація (Маршалл Розенберг)',
    authorOrSchoolEn: 'Nonviolent Communication (Marshall Rosenberg)',
    psychologicalMechanismUk: 'Трансформація афекту: виявлення незадоволеної базової потреби (повага, автономія) під шаром адреналіну.',
    psychologicalMechanismEn: 'Affect transformation: unearthing the unmet core need (respect, autonomy) beneath adrenaline.',
    somaticAnchorUk: 'Стисніть кулаки щосили на 5 секунд під час вдиху, а потім повністю розтисніть пальці на довгому видиху зі звуком «ххх».',
    somaticAnchorEn: 'Squeeze your fists hard on inhale for 5 seconds, then release completely on a deep exhale.',
    reflectionQuestionUk: 'Який мій особистий кордон було порушено і як я можу заявити про нього спокійно й твердо?',
    reflectionQuestionEn: 'What boundary of mine was crossed, and how can I state it clearly and calmly?',
    microActionUk: 'Сформулюйте одне речення свого прохання або «Ні» у форматі «Я відчуваю..., тому що мені важливо...».',
    microActionEn: 'Draft one polite but firm "No" using: "I feel..., because it is important for me that...".',
  },

  // 6. Indecision & Fear of Choice
  {
    id: 'aff-dec-1',
    date: '2026-01-09',
    category: 'decision_fear',
    categoryTitleUk: 'Страх вибору & Невизначеність',
    categoryTitleEn: 'Indecision & Uncertainty',
    quoteUk: 'Не існує ідеальних рішень без ризику. Будь-який обраний шлях стане правильним, якщо я наповню його своєю присутністю та відданістю.',
    quoteEn: 'There are no risk-free perfect choices. Any chosen path becomes the right one once I commit my presence and dedication to it.',
    authorOrSchoolUk: 'Логотерапія (Віктор Франкл)',
    authorOrSchoolEn: 'Logotherapy (Viktor Frankl)',
    psychologicalMechanismUk: 'Звільнення від тиранії "максимізації вибору": перехід від пасивного пошуку гарантій до створення сенсу власною дією.',
    psychologicalMechanismEn: 'Liberation from decision paralysis by shifting from seeking guarantees to creating meaning through action.',
    somaticAnchorUk: 'По черзі перенесіть вагу тіла з лівої стопи на праву, відчуваючи баланс рівноваги.',
    somaticAnchorEn: 'Shift your body weight rhythmically from left foot to right foot, finding your center.',
    reflectionQuestionUk: 'Якби мені гарантували підтримку Всесвіту за будь-якого вибору, що б підказало мені серце?',
    reflectionQuestionEn: 'If you were guaranteed growth in either scenario, which direction feels most authentic?',
    microActionUk: 'Підкиньте подумки монетку — перше відчуття полегшення чи розчарування покаже справжнє бажання.',
    microActionEn: 'Flip a coin mentally — your instantaneous gut reaction reveals your true subconscious preference.',
  },

  // 7. Focus, Courage & Action
  {
    id: 'aff-foc-1',
    date: '2026-01-10',
    category: 'focus_courage',
    categoryTitleUk: 'Фокус, Мужність & Дія',
    categoryTitleEn: 'Focus, Courage & Action',
    quoteUk: 'Мужність — це не відсутність страху, а розуміння, що є щось набагато важливіше за страх. Мій намір сильніший за сумніви.',
    quoteEn: 'Courage is not the absence of fear, but the realization that something else is far more vital. My intention outshines my doubts.',
    authorOrSchoolUk: 'Коучинг «Goal Makers» & Психологія героїзму',
    authorOrSchoolEn: 'Goal Makers Coaching & Heroic Psychology',
    psychologicalMechanismUk: 'Активація дофамінової системи мотивації через зв’язок щоденної мікро-дії з глибинними довгостроковими цінностями.',
    psychologicalMechanismEn: 'Dopaminergic motivational ignition by linking everyday micro-actions to overarching existential values.',
    somaticAnchorUk: 'Зробіть глибокий вдих на 4 рахунки, затримайте дихання на 2 рахунки, випрямте спину і стисніть кулак переможця.',
    somaticAnchorEn: 'Inhale for 4 counts, hold for 2, straighten your spine, and clench a champion fist.',
    reflectionQuestionUk: 'Заради кого або заради якого майбутнього я роблю цей сміливий крок?',
    reflectionQuestionEn: 'For whom or for what inspiring future vision am I taking this brave step?',
    microActionUk: 'Запустіть таймер на 15 хвилин і займайтеся виключно головною задачею без жодних відволікань.',
    microActionEn: 'Start a 15-minute timer and work exclusively on your highest-leverage task.',
  },

  // 8. Gratitude & Peace
  {
    id: 'aff-grat-1',
    date: '2026-01-11',
    category: 'gratitude_peace',
    categoryTitleUk: 'Вдячність & Внутрішня опора',
    categoryTitleEn: 'Gratitude & Inner Peace',
    quoteUk: 'Сьогодні я помічаю красу в простих речах. Усе, що мені потрібно для глибокого спокою, вже живе всередині мене.',
    quoteEn: 'Today I notice the beauty in simple things. Everything required for profound serenity is already breathing within me.',
    authorOrSchoolUk: 'Майндфулнес (Джон Кабат-Зінн)',
    authorOrSchoolEn: 'Mindfulness-Based Stress Reduction',
    psychologicalMechanismUk: 'Практика вдячності стимулює вироблення серотоніну та окситоцину, формуючи стійкі антидепресивні нейронні мережі.',
    psychologicalMechanismEn: 'Gratitude enhances serotonin and oxytocin synthesis, reinforcing resilient positive neurological circuits.',
    somaticAnchorUk: 'Посміхніться кутиками очей та рота на 10 секунд, заплющіть очі та відчуйте ритм свого дихання.',
    somaticAnchorEn: 'Soften your eyes and smile gently for 10 seconds, feeling the organic rhythm of breathing.',
    reflectionQuestionUk: 'Які 3 непомітні блага (тепло, світло, кава, чиясь усмішка) є в моєму дні прямо зараз?',
    reflectionQuestionEn: 'What 3 subtle gifts (warmth, breath, coffee, a friendly glance) exist in your day right now?',
    microActionUk: 'Подякуйте одній людині щирим повідомленням або добрим словом.',
    microActionEn: 'Send a genuine message of appreciation to someone in your life.',
  },
];

export function getDailyQuoteForDate(category: DailyAffirmationItem['category'], date: Date = new Date()): DailyAffirmationItem {
  const categoryAffirmations = CURATED_AFFIRMATIONS.filter((a) => a.category === category);
  if (categoryAffirmations.length === 0) {
    return CURATED_AFFIRMATIONS[0];
  }
  // Deterministic daily index based on day of year + year
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const index = (dayOfYear + date.getFullYear()) % categoryAffirmations.length;
  return categoryAffirmations[index];
}

export function getRandomQuoteForCategory(category: DailyAffirmationItem['category']): DailyAffirmationItem {
  const categoryAffirmations = CURATED_AFFIRMATIONS.filter((a) => a.category === category);
  if (categoryAffirmations.length === 0) return CURATED_AFFIRMATIONS[0];
  const randomIndex = Math.floor(Math.random() * categoryAffirmations.length);
  return categoryAffirmations[randomIndex];
}
