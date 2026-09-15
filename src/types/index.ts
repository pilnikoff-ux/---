export type ApproachType =
  | 'comprehensive'
  | 'cbt'
  | 'gestalt'
  | 'natural_linetsky'
  | 'jungian_analytical'
  | 'psychodynamic'
  | 'client_centered'
  | 'somatic'
  | 'existential'
  | 'coaching_grow';

export interface DiltsLogicalLevels {
  environment: { description: string; problemManifestation: string };
  behavior: { description: string; problemManifestation: string };
  capabilities: { description: string; problemManifestation: string };
  beliefsAndValues: { description: string; problemManifestation: string };
  identity: { description: string; problemManifestation: string };
  missionAndPurpose: { description: string; problemManifestation: string };
  identifiedProblemLevel: 1 | 2 | 3 | 4 | 5 | 6; // 1=Оточення, 2=Поведінка, 3=Здібності, 4=Переконання, 5=Ідентичність, 6=Місія
  identifiedProblemLevelName: string;
  recommendedSolutionLevel: 1 | 2 | 3 | 4 | 5 | 6;
  recommendedSolutionLevelName: string;
  solutionShiftGuidance: string;
}

export interface BeliefPatternReframe {
  limitingBelief: string;
  distortionType?: string; // Узагальнення, Причинно-наслідковий зв'язок, Читання думок, Модальні оператори
  positiveIntention?: string; // Вторинна вигода / прихований намір захисту
  sphere?: string;
  diltsLevel?: string;
  diltsLogicLevel?: string;
  liberatingCoreBelief: string; // Фінальне підтримуюче переконання
  somaticShift?: string;
  microAction24h?: string;
  patternNameUk?: string;
  patternNameEn?: string;
  reframeQuestion?: string;
  empoweringAffirmation?: string;
  actionTestHypothesis?: string;
  sleightOfMouthReframes: {
    intention: string; // Намір
    redefine: string; // Перевизначення
    consequence: string; // Наслідки
    chunkDown: string; // Розділення на частини
    chunkUp: string; // Узагальнення / Вищий фрейм
    analogy: string; // Метафора / Аналогія
    changeFrameSize: string; // Зміна масштабу часу/контексту
    anotherOutcome: string; // Інший результат
    modelOfTheWorld: string; // Модель світу
    hierarchyOfCriteria: string; // Ієрархія критеріїв
    applyToSelf: string; // Застосування до себе
    metaFrame: string; // Мета-фрейм
  };
}

export interface ConsiliumAnalysis {
  summary: string;
  coreDilemma: string;
  theoreticalInsights: {
    generalPsychology: string;
    developmentalPattern: string;
    socialDynamics: string;
    psychophysiology: string;
  };
  therapeuticPerspectives: {
    cbt: {
      automaticThoughts: string[];
      cognitiveDistortions: string[];
      rationalAlternatives: string[];
      behavioralExperiment: string;
    };
    gestalt: {
      figureAndGround: string;
      unfinishedGestalt: string;
      hereAndNowAwareness: string;
      emptyChairDialoguePrompt: string;
    };
    naturalApproachLinetsky: {
      isVsShouldBeTension: string;
      effortlessAwarenessInsight: string;
      resistanceDissolution: string;
      ontologicalTriad: {
        lightOntology: string; // Світла: факти, форми, суб'єкт-об'єкт, оцифрування розумом
        sparklingOntology: string; // Сяюча: розриви, спалахи здивування, суб'єкт-суб'єкт, амбівалентність
        darkOntology: string; // Темна: приховані фонові сюжети, контингентність, об'єкт-об'єкт поза виправданнями
      };
      dialecticPoles: {
        enlightenedIntention: string; // Просвітлений суб'єкт (Модерн): прагнення, володіння, метонімія, розширення
        awakenedFeeling: string; // Пробуджений суб'єкт (Постмодерн): відчування, розмикання, метафора, заглиблення
        thirdTestamentSynthesis: string; // Третій завіт / Договір співучасті (со-узгодження волі творіння і волі людини, m1h2)
      };
      eventVibration5: {
        element: 'earth' | 'fire' | 'air' | 'water' | 'space';
        elementNameUk: string;
        polarityDilemma: string; // наприклад, "Переконання vs Факти" або "Індивідуалізм vs Колективізм"
        transmutedWisdom: string; // наприклад, "Мудрість розрізнення (Амітабха)" або "Мудрість рівності (Ратнасамбхава)"
        practicalGuidance: string;
      };
      transformationProtocol: {
        impossibilityCore: string; // Зачаклована роль або точка зупинки/безсилля
        spellbreakingQuestion: string; // Ключове деконструююче запитання (напр. "Що мало статися, щоб цей глухий кут мав сенс?")
        hyperfaithReframe: string; // Сценарний образ для розвороту подій (гіпервір'я за Ніком Ландом)
      };
      eventMatrixCell: {
        domain: 'emotions' | 'attention' | 'desires';
        domainNameUk: string;
        stage: 'birth' | 'maintenance' | 'completion';
        stageNameUk: string;
        vectorDescription: string;
      };
    };
    jungianAnalytical: {
      activeArchetype: string;
      shadowElement: string;
      individuationTask: string;
      subconsciousComplex: string;
      synchronicityOrSymbolPrompt: string;
    };
    psychodynamics: {
      defenseMechanisms: string[];
      unconsciousSecondaryGains: string;
      earlyExperienceEcho: string;
    };
    clientCentered: {
      empathicMirror: string;
      internalLocusOfControl: string;
    };
    somatic: {
      bodyTensionZones: string[];
      somaticReleasePractice: string;
    };
    existential: {
      meaningAndValues: string;
      freedomAndResponsibility: string;
    };
  };
  diltsLogicalLevels?: DiltsLogicalLevels;
  beliefPatterning?: BeliefPatternReframe;
  goalMakersActionPlan: {
    immediate24hStep: string;
    shortTerm7dMilestone: string;
    longTerm30dStrategy: string;
    innerSaboteurDefense: string;
    resourceAnchor: string;
  };
  coachingQuestions: string[];
  recommendedSmartTools?: {
    nvcEq?: {
      isRecommended: boolean;
      reason: string;
      rosenberg4Steps?: {
        observation: string;
        feeling: string;
        need: string;
        request: string;
      };
      golemanEqTip?: string;
    };
    wheelOfBalance?: {
      isRecommended: boolean;
      reason: string;
      prioritySphere?: string;
      diagnosticInsight?: string;
    };
    archetypes?: {
      isRecommended: boolean;
      reason: string;
      suggestedArchetype?: string;
    };
    beliefPatterning?: {
      isRecommended: boolean;
      reason: string;
    };
  };
}

export interface NvcEqData {
  id: string;
  date: string;
  triggerSituation: string;
  rawExpression: string; // Початкова претензія, агресивна думка або образа
  partnerRole?: string; // Партнер, керівник, колега, дитина, батьки тощо
  eqAssessment: {
    recognizedEmotions: string[];
    somaticTrigger: string;
    selfRegulationTip: string;
    golemanDomain: 'self_awareness' | 'self_regulation' | 'empathy' | 'social_skills';
  };
  nvc4Steps: {
    observation: string; // 1. Спостереження (без оцінок)
    feeling: string;     // 2. Почуття (мовний еквівалент EQ)
    need: string;        // 3. Базова потреба (безпека, повага, автономія...)
    request: string;     // 4. Конкретне, здійсненне прохання
  };
  nvcCompletePhrasing: string; // Готова формула мови Жирафа за Розенбергом
  internalSelfEmpathy: string; // Внутрішній діалог самоспівчуття
  empathicGuessForOther: string; // Емпатична здогадка про почуття іншої сторони
}

export interface WheelSphereItem {
  id: string;
  nameUk: string;
  nameRu?: string;
  nameEn: string;
  score: number; // 1-10
  targetScore?: number; // 1-10
  iconName: string;
  color: string;
  notes?: string;
  tenPointVision?: string; // Що є 10 балів особисто для вас
  whyNotLower?: string; // Чому не на 1 бал нижче (захист від знецінення / опора на ресурси)
  whatNeedsForPlusOne?: string; // Чого не вистачає до +1 бала
}

export interface WheelOfBalanceData {
  id: string;
  date: string;
  title: string;
  spheres: WheelSphereItem[];
  balanceIndex: number; // 0-100%
  aiAnalysis?: {
    systemicDiagnosis: string;
    primaryDeficitSphere: string;
    leverageSphere: string; // Сфера-важіль («паровоз»)
    hiddenCompensations: string[];
    rebalanceActionPlan: {
      immediateAction: string;
      shortTermPlan: string;
      habitToTransform: string;
    };
    coachingInsight: string;
    // Розширений глибокий аналіз на основі методик HappyMonday, Всеосвіта та NewLeaf:
    wheelShapeDiagnostic?: {
      shapeName: string; // «Колючий їжак», «Збалансоване компактне», «Перекошене», «Рівномірний розквіт»
      rollabilityDescription: string; // Чи покотиться таке колесо та де виникає тертя
      frictionLevel: 'low' | 'moderate' | 'high' | 'critical';
    };
    peseschkianBalance?: {
      bodyHealthPct: number; // Тіло / Здоров'я & Відпочинок
      achievementCareerPct: number; // Діяльність / Кар'єра & Фінанси
      contactRelationshipsPct: number; // Контакти / Стосунки & Сім'я
      futureMeaningPct: number; // Майбутнє / Розвиток & Духовність
      interpretation: string;
    };
    chainReaction?: {
      leverageTarget: string;
      impactedSpheres: string[];
      expectedImpact: string;
    };
    coachingDriveQuestions?: {
      question: string;
      answerInsight: string;
    }[];
    recommendations?: {
      rule72HoursAction: string;
      smart30DaysGoal: string;
      ecologicalBoundary: string; // Від чого відмовитися, щоб вивільнити ресурс
      nextReviewDate: string;
    };
  };
}

export interface AssociationPyramidData {
  id: string;
  title: string;
  problemStatement: string;
  date: string;
  layer1: string[]; // 16 words (Everyday layer)
  layer2: string[]; // 8 words (Reason / Intellect layer)
  layer3: string[]; // 4 words (Emotional / Feeling layer)
  layer4: string[]; // 2 words (Root / Strategic layer)
  layer5: string;   // 1 word (Subconscious Key / Archetype)
  aiInterpretation?: {
    summary: string;
    layerMeanings: {
      level1Everyday: string;
      level2Intellect: string;
      level3Feelings: string;
      level4Root: string;
      level5Key: string;
    };
    subconsciousInsight: string;
    recommendedAction: string;
  };
}

export interface DescartesItem {
  id: string;
  text: string;
  weight: number; // 1-5
}

export interface DescartesMatrixData {
  id: string;
  dilemma: string;
  date: string;
  quadrant1_Will_Will: DescartesItem[]; // Що БУДЕ, якщо це ВІДБУДЕТЬСЯ (Плюси змін)
  quadrant2_Will_Not: DescartesItem[];  // Що БУДЕ, якщо це НЕ відбудеться (Плюси незмінності)
  quadrant3_Not_Will: DescartesItem[];  // Чого НЕ буде, якщо це ВІДБУДЕТЬСЯ (Мінуси/втрати при змінах)
  quadrant4_Not_Not: DescartesItem[];   // Чого НЕ буде, якщо це НЕ відбудеться (Мінуси незмінності)
  aiAnalysis?: {
    overallRecommendation: string;
    clarityScore: number; // 0-100
    blindSpots: string[];
    hiddenFears: string[];
    actionGuidance: string;
  };
}

export interface FiveWhysData {
  id: string;
  initialProblem: string;
  date: string;
  steps: {
    level: number;
    question: string;
    answer: string;
  }[];
  rootCause?: string;
  transformativeAction?: string;
  aiFeedback?: string;
}

export interface CbtDiaryEntry {
  id: string;
  date: string;
  situation: string;
  automaticThought: string;
  beliefIntensityBefore: number; // 0-100%
  emotions: {
    name: string;
    intensityBefore: number; // 0-100%
    intensityAfter?: number;  // 0-100%
  }[];
  bodySensations: string;
  cognitiveDistortions: string[];
  rationalAlternative: string;
  beliefIntensityAfter: number; // 0-100%
  outcomeBehavior: string;
}

export interface GoalMakersQuest {
  id: string;
  title: string;
  timeframe: '24h' | '7d' | '30d';
  completed: boolean;
  notes?: string;
  rewardPoints: number;
}

export interface GoalMakersGameState {
  id: string;
  goalTitle: string;
  pointA: string; // Current reality / pain point
  pointB: string; // Desired future state & criteria of success
  resources: string[]; // Magic backpack
  saboteurs: string[]; // Internal dragons (procrastination, fear of failure, perfectionism)
  antidotes: string[]; // Strategies to tame dragons
  quests: GoalMakersQuest[];
  activeCard?: MetaCard;
  dateCreated: string;
  progressPercent: number;
}

export interface MetaCard {
  id: string;
  title: string;
  category: 'courage' | 'truth' | 'resource' | 'linetsky_flow' | 'future_focus';
  categoryLabel: string;
  metaphor: string;
  provocativeQuestion: string;
  actionImpulse: string;
  linetskyQuote?: string;
}

export interface DailyAffirmationItem {
  id: string;
  date: string;
  category: 'anxiety_overwhelm' | 'burnout_exhaustion' | 'sadness_grief' | 'impostor_doubt' | 'anger_frustration' | 'decision_fear' | 'focus_courage' | 'gratitude_peace';
  categoryTitleUk: string;
  categoryTitleRu?: string;
  categoryTitleEn: string;
  quoteUk: string;
  quoteRu?: string;
  quoteEn: string;
  authorOrSchoolUk: string;
  authorOrSchoolRu?: string;
  authorOrSchoolEn: string;
  psychologicalMechanismUk: string;
  psychologicalMechanismRu?: string;
  psychologicalMechanismEn: string;
  somaticAnchorUk: string;
  somaticAnchorRu?: string;
  somaticAnchorEn: string;
  reflectionQuestionUk: string;
  reflectionQuestionRu?: string;
  reflectionQuestionEn: string;
  microActionUk: string;
  microActionRu?: string;
  microActionEn: string;
  isAiGenerated?: boolean;
}

export interface UserProfile {
  id: string;
  login: string;
  name: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  authProvider?: 'google' | 'local' | 'guest';
  pinOrPassword?: string;
  birthDate?: string;
  dateOfBirth?: string;
  fieldOfActivity?: string;
  registeredAt: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
}

export interface UserActivityLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  tab: string;
  toolName: string;
  querySummary: string;
  category?: string;
  details?: Record<string, any>;
}

export interface UserFeedback {
  id: string;
  date: string;
  userId?: string;
  userName?: string;
  rating: number; // 1-5
  likedAspects: string[];
  difficulties: string | string[];
  improvementSuggestions?: string;
  featureSuggestions?: string;
  comment?: string;
  selfLearningApplied?: boolean;
  systemAdaptationInsights?: string[];
}

export interface SelfLearningSettings {
  preferredDepth: 'surface_practical' | 'deep_philosophical' | 'balanced' | 'concise';
  favoredSchools: string[];
  avoidJargon: boolean;
  morePracticalSteps: boolean;
  adaptedPromptDirectives: string[];
  feedbackCount?: number;
  coachingFocusEvolution?: string;
  learnedToneAdjustments?: string[];
  updatedPromptDirectives?: string[];
  lastLearnedAt: string;
}

export interface JungianArchetypeScore {
  id: string;
  nameUk: string;
  nameRu: string;
  nameEn: string;
  score: number; // 0-100
  cardinalMottoUk: string;
  cardinalMottoRu: string;
  cardinalMottoEn: string;
  coreDesire: string;
  goal: string;
  greatestFear: string;
  strategy: string;
  weakness: string;
  talent: string;
  shadowAspect: string;
  color: string;
  iconName: string;
}

export interface JungianArchetypeProfile {
  id: string;
  date: string;
  primaryArchetype: JungianArchetypeScore;
  secondaryArchetype: JungianArchetypeScore;
  shadowArchetype: JungianArchetypeScore;
  allScores: JungianArchetypeScore[];
  aiAnalysis?: {
    synthesisTitle: string;
    egoStateDiagnosis: string;
    shadowIntegrationAdvice: string;
    archetypalTension: string;
    growthActionPlan: string[];
  };
}

export interface ValueItemScore {
  id: string;
  nameUk: string;
  nameRu: string;
  nameEn: string;
  categoryUk: string; // Самовизначення, Відкритість, Збереження, Самотрансцендентність
  score: number; // 1-10
  importanceReason?: string;
}

export interface ValuesMotivationProfile {
  id: string;
  date: string;
  selfDeterminationNeeds: {
    autonomy: number; // 1-10
    competence: number; // 1-10
    relatedness: number; // 1-10
  };
  topValues: ValueItemScore[];
  allValues: ValueItemScore[];
  aiAnalysis?: {
    dominantNeedDiagnosis: string;
    valueConflictAnalysis: string;
    intrinsicVsExtrinsicBalance: string;
    alignmentStrategy: string;
    weeklyValuesHabits: string[];
  };
}

// 1. Практика 100 Бажань (100 Desires Practice)
export type WishCategory =
  | 'material'            // Матеріальне (Have)
  | 'experience'          // Досвід та подорожі (Experience)
  | 'skills_growth'       // Навички, тіло та саморозвиток (Do / Be)
  | 'relationships_health'// Стосунки, сім'я та здоров'я (Relationships)
  | 'contribution_spirit'; // Внесок, творчість та сенси (Give / Contribute)

export type WishLayer =
  | 'social'             // 1-30: Соціально обумовлені / поверхневі
  | 'personal'           // 31-70: Особистісні та зрілі цілі
  | 'deep_subconscious'; // 71-100: Глибинні, дитячі та істинні мрії

export interface WishItem {
  id: string;
  number: number; // 1 to 100
  text: string;
  category: WishCategory;
  energyScore: number; // 1-10 (енергетичний заряд)
  layer: WishLayer;
  status: 'pending' | 'in_progress' | 'completed';
  completedDate?: string;
  gratitudeNote?: string;
  linkedToSmart?: boolean;
}

export interface HundredWishesData {
  id: string;
  title: string;
  date: string;
  wishes: WishItem[];
  aiAnalysis?: {
    summary: string;
    balanceByCategory: {
      category: string;
      percentage: number;
      coachComment: string;
    }[];
    dominantLayerInsight: string;
    topHighEnergyPicks: {
      number: number;
      text: string;
      rationale: string;
    }[];
    hiddenThemes: string[];
    coachingRecommendations: string[];
  };
}

// 2. Саморефлексія (Self-Reflection)
export type ReflectionMethod =
  | 'stoic_evening'    // Стоїчний вечірній чек-ін (Марк Аврелій & Сенека)
  | 'gibbs_cycle'      // Цикл рефлексії Гіббса (Подія -> Емоції -> Оцінка -> Аналіз -> Висновок -> Дія)
  | 'what_so_what'     // Driscoll: Що? Ну і що? Що тепер?
  | 'kpt_retrospective'// KPT: Keep / Problem / Try (Життєвий аудит)
  | 'express_checkin'; // Експрес-рефлексія настрою та стану

export interface SelfReflectionData {
  id: string;
  title: string;
  date: string;
  method: ReflectionMethod;
  energyScore: number; // 1-10
  moodScore: number;   // 1-10
  primaryEmotions: string[];
  content: {
    // Stoic
    stoicDoneWell?: string;
    stoicFaltered?: string;
    stoicTomorrowBetter?: string;
    // Gibbs
    gibbsDescription?: string;
    gibbsFeelings?: string;
    gibbsEvaluation?: string;
    gibbsAnalysis?: string;
    gibbsConclusion?: string;
    gibbsActionPlan?: string;
    // What - So What - Now What
    whatHappened?: string;
    soWhatMeaning?: string;
    nowWhatNextStep?: string;
    // KPT
    kptKeep?: string;
    kptProblem?: string;
    kptTry?: string;
    // Express
    expressWins?: string;
    expressDifficulties?: string;
    expressGratitude?: string;
  };
  aiSupervisorFeedback?: {
    summary: string;
    supportiveValidation: string;
    cognitiveTrapDetector?: string; // Виявлення румінацій чи чорно-білого мислення
    resourceReframe: string;
    actionStepForTomorrow: string;
  };
}

// 3. SMART-Цілі + WOOP + Implementation Intentions
export interface SmartGoalData {
  id: string;
  title: string;
  status: 'active' | 'achieved' | 'paused' | 'in_progress';
  dateCreated?: string;
  createdAt?: string;
  targetDeadline?: string;
  deadline?: string;
  category: WishCategory | string;
  // SMART core
  specific: string;     // Що саме, де, з ким, чому
  measurable: string;   // Кількісні та якісні метрики 100% готовності
  achievable: string;   // Ресурси, навички та віра (1-10)
  relevant: string;     // Зв'язок із цінностями та особистим сенсом
  timeBound: string;    // Дедлайн та частота дій
  // WOOP extension (Gabriele Oettingen)
  woopWish?: string;    // Справжнє внутрішнє бажання
  woopOutcome?: string; // Найкращий емоційний результат
  woopObstacle?: string;// Головна внутрішня перешкода (страх, саботаж, втома)
  woopPlan?: string;    // План подолання перешкоди
  woopPlanIfThen?: string;
  // Implementation Intentions (Peter Gollwitzer)
  ifThenRules?: {
    id: string;
    ifTrigger: string;  // ЯКЩО [ситуація / спокуса / втома]
    thenAction: string; // ТО [конкретна заздалегідь підготовлена дія]
  }[];
  // Anti-goals (Тім Феррісс - що я НЕ буду робити)
  antiGoals?: string;
  firstStep72h?: string; // Перший мікрокрок за 72 години
  first72hStep?: string;
  milestones?: {
    id: string;
    title: string;
    targetDate: string;
    completed: boolean;
  }[];
  progressPercent?: number; // 0-100
  aiAudit?: {
    smartScore: number; // 0-100
    strengths: string[];
    vulnerabilities: string[];
    coachQuestions: string[];
    boostRecommendation: string;
  };
}

export interface JournalEntry {
  id: string;
  type:
    | 'consilium'
    | 'associations16'
    | 'descartes'
    | 'fiveWhys'
    | 'cbt'
    | 'goalMakersBoard'
    | 'goalMakers'
    | 'nvcEq'
    | 'wheelOfBalance'
    | 'affirmations'
    | 'archetypes'
    | 'valuesMotivation'
    | 'beliefPatterning'
    | 'hundredWishes'
    | 'selfReflection'
    | 'smartGoals'
    | 'feedback';
  title: string;
  date: string;
  summary: string;
  data: any;
}


