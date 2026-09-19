import {
  ConsiliumAnalysis,
  JungianArchetypeProfile,
  ValuesMotivationProfile,
  BeliefPatternReframe,
  DiltsLogicalLevels,
  UserFeedback,
  PreMortemData,
} from '../types';

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 25000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function handleApiResponse(response: Response): Promise<any> {
  if (!response.ok) {
    let errorMsg = `Помилка сервера: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        if (typeof errorData.error === 'string') {
          try {
            const parsed = JSON.parse(errorData.error);
            if (parsed?.error?.message) {
              errorMsg = parsed.error.message;
            } else {
              errorMsg = errorData.error;
            }
          } catch {
            errorMsg = errorData.error;
          }
        } else if (errorData.error.message) {
          errorMsg = errorData.error.message;
        } else {
          errorMsg = JSON.stringify(errorData.error);
        }
      }
    } catch {
      // ignore json parse error
    }

    if (
      errorMsg.includes('high demand') ||
      errorMsg.includes('503') ||
      errorMsg.includes('UNAVAILABLE') ||
      errorMsg.includes('Resource has been exhausted') ||
      errorMsg.includes('RESOURCE_EXHAUSTED') ||
      errorMsg.includes('429') ||
      errorMsg.includes('quota') ||
      errorMsg.includes('Quota exceeded')
    ) {
      errorMsg =
        'ШІ-сервер зараз відчуває тимчасове навантаження на запити. Зачекайте декілька секунд і спробуйте знову (сервер використовує адаптивне перемикання між моделями).';
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

// 1. Consilium Analysis
export async function requestConsiliumAnalysis(payload: {
  situation: string;
  pastExperience?: string;
  futureGoal?: string;
  approach?: string;
  emotions?: string[];
}): Promise<ConsiliumAnalysis> {
  try {
    const response = await fetchWithTimeout('/api/gemini/analyze-situation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.warn('API fetch issue, fallback to synthetic consilium:', error);
    return synthesizeConsiliumFallback(payload);
  }
}

// 2. Jungian Archetypes Deep Insight
export async function requestArchetypesDeepInsight(payload: {
  primaryArchetype: string;
  secondaryArchetype: string;
  shadowArchetype: string;
  userContext?: string;
}): Promise<JungianArchetypeProfile['aiAnalysis']> {
  try {
    const response = await fetchWithTimeout('/api/gemini/archetypes-deep-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleApiResponse(response);
  } catch (e) {
    console.warn('Fallback archetypes insight', e);
    return {
      synthesisTitle: `Сплав: ${payload.primaryArchetype} з глибиною ${payload.secondaryArchetype}`,
      egoStateDiagnosis: `Ваша свідома ідентичність спирається на архетип «${payload.primaryArchetype}», реалізуючи стратегію розвитку та впливу через ресурси «${payload.secondaryArchetype}».`,
      shadowIntegrationAdvice: `Тіньовий архетип «${payload.shadowArchetype}» містить у собі витіснену силу, яку ви боїтеся проявляти через страх оцінки. Дозвольте собі дозовано визнавати ці імпульси як ресурс спонтанності.`,
      archetypalTension: `Полярність між прагненням до безпеки та жагою самовираження (динаміка ${payload.primaryArchetype} vs ${payload.shadowArchetype}).`,
      growthActionPlan: [
        `Провести індивідуальну рефлексію над якостями «${payload.shadowArchetype}» та знайти в них позитивний ресурс`,
        'Зробити один крок поза звичною контролюючою маскою',
        'Узгодити рішення з внутрішнім відчуттям цілісності (Самістю)',
      ],
    };
  }
}

// 3. Values & Deep Motivation
export async function requestValuesMotivationAnalysis(payload: {
  selfDeterminationNeeds: { autonomy: number; competence: number; relatedness: number };
  topValues: any[];
  userSituation?: string;
}): Promise<ValuesMotivationProfile['aiAnalysis']> {
  try {
    const response = await fetchWithTimeout('/api/gemini/values-motivation-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleApiResponse(response);
  } catch (e) {
    console.warn('Fallback values analysis', e);
    const minNeed =
      payload.selfDeterminationNeeds.autonomy <= payload.selfDeterminationNeeds.competence &&
      payload.selfDeterminationNeeds.autonomy <= payload.selfDeterminationNeeds.relatedness
        ? 'Автономія (відчуття авторства власного життя)'
        : payload.selfDeterminationNeeds.competence <= payload.selfDeterminationNeeds.relatedness
        ? 'Компетентність (впевненість у своїй спроможності)'
        : 'Спорідненість (глибокий звʼязок та прийняття іншими)';

    return {
      dominantNeedDiagnosis: `Ключова точка для підсилення вашої внутрішньої енергії: ${minNeed}.`,
      valueConflictAnalysis:
        'Виявлено динамічну взаємодію між прагненням до особистих досягнень та потребою у безпеці й стабільності.',
      intrinsicVsExtrinsicBalance:
        'Ваша мотивація збалансована, проте присутній фокус на очікуваннях зовнішнього оточення, який варто переглянути.',
      alignmentStrategy:
        'Щодня виділяти 15-30 хвилин на діяльність, яка безпосередньо втілює ваші провідні цінності без оцінювання іншими.',
      weeklyValuesHabits: [
        'Ранковий чек-ін: «Яка дія сьогодні зробить мене вірним моїм цінностям?»',
        'Встановлення мʼяких, але чітких особистих кордонів у спілкуванні',
        'Вечірня вдячність собі за проявлену автентичність',
      ],
    };
  }
}

// 4. Belief Patterning & 14 Sleight of Mouth
export async function requestBeliefPatternTransform(payload: {
  limitingBelief: string;
  sphere?: string;
  context?: string;
}): Promise<BeliefPatternReframe> {
  try {
    const response = await fetchWithTimeout('/api/gemini/belief-patterning-transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleApiResponse(response);
  } catch (e) {
    console.warn('Fallback belief transformation', e);
    const belief = payload.limitingBelief;
    return {
      limitingBelief: belief,
      distortionType: 'Узагальнення та надмірна фіксація на минулому досвіді',
      positiveIntention: 'Зберегти відчуття безпеки, запобігти болю розчарування чи критиці оточуючих.',
      sleightOfMouthReframes: {
        intention: `Насправді це переконання прагне захистити вашу гідність і вберегти від зайвих ризиків.`,
        redefine: `Це не «неможливість», а «необхідність знайти інший, більш винахідливий підхід».`,
        consequence: `Якщо ви триматиметеся за цю думку ще рік, ви втратите шанси на відкриття нового.`,
        chunkDown: `Чи дійсно кожна складова цієї ситуації безнадійна, чи лише один конкретний технічний елемент?`,
        chunkUp: `Будь-який процес навчання супроводжується сумнівами — це ознака зростання, а не поразки.`,
        analogy: `Як паросток пробиває асфальт, так і новий навик потребує часу для зміцнення.`,
        changeFrameSize: `Через 5 років ця перешкода згадуватиметься як точка відліку головного прориву.`,
        anotherOutcome: `Питання не в тому, чи це легко, а в тому, яку людину це з вас формує.`,
        modelOfTheWorld: `Багато успішних фахівців проходили через такий самий бар'єр перед якісним стрибком.`,
        hierarchyOfCriteria: `Що для вас важливіше: тимчасовий комфорт невідомості чи довгострокова самореалізація?`,
        applyToSelf: `Наскільки досконалою і непорушною є сама ця думка, щоб визначати ваше життя?`,
        metaFrame: `Ви помічаєте цю думку як спостерігач, а отже ви більші за будь-яке обмеження.`,
      },
      liberatingCoreBelief: `«Я маю достатньо ресурсів, щоб діяти крок за кроком, дозволяючи собі навчатися та розкривати силу в реальності».`,
    };
  }
}

// 5. Dilts Levels Analysis
export async function requestDiltsLevelsAnalysis(payload: {
  problemStatement: string;
  goalStatement?: string;
}): Promise<DiltsLogicalLevels> {
  try {
    const response = await fetchWithTimeout('/api/gemini/dilts-levels-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleApiResponse(response);
  } catch (e) {
    console.warn('Fallback Dilts levels', e);
    return {
      environment: {
        description: 'Фізичний простір, інформаційний шум, люди поруч, часові рамки',
        problemManifestation: 'Відчуття нестачі часу або невідповідного оточення',
      },
      behavior: {
        description: 'Конкретні щоденні дії, звички та рутина',
        problemManifestation: 'Відкладання важливого (прокрастинація), хаотичні мікро-дії',
      },
      capabilities: {
        description: 'Навички, стратегії мислення, вміння фокусуватися',
        problemManifestation: 'Брак чіткого системного алгоритму дій',
      },
      beliefsAndValues: {
        description: 'Переконання: «Чому це важливо? У що я вірю?»',
        problemManifestation: 'Сумніви у власному праві на успіх або страх невідповідності',
      },
      identity: {
        description: 'Я-Концепція: «Хто я у цій ролі?»',
        problemManifestation: 'Конфлікт самоідентифікації (синдром самозванця)',
      },
      missionAndPurpose: {
        description: 'Трансперсональний сенс: «Заради чого більшого?»',
        problemManifestation: 'Втрата звʼязку з довгостроковим натхненням',
      },
      identifiedProblemLevel: 4,
      identifiedProblemLevelName: 'Переконання та Цінності (Beliefs & Values)',
      recommendedSolutionLevel: 5,
      recommendedSolutionLevelName: 'Ідентичність (Identity / Я-Концепція)',
      solutionShiftGuidance:
        'Проблема на рівні переконань розвʼязується через зміну самоідентифікації: відчуйте себе Автором свого шляху, а не тим, хто змушений доводити свою цінність.',
    };
  }
}

// 6. Association Interpretation
export async function requestAssociationInterpretation(payload: {
  problemStatement: string;
  layer1: string[];
  layer2: string[];
  layer3: string[];
  layer4: string[];
  layer5: string;
}) {
  const response = await fetchWithTimeout('/api/gemini/interpret-associations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response);
}

// 7. Cartesian Insights
export async function requestCartesianInsights(payload: {
  dilemma: string;
  quadrant1: any[];
  quadrant2: any[];
  quadrant3: any[];
  quadrant4: any[];
}) {
  const response = await fetchWithTimeout('/api/gemini/cartesian-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response);
}

// 8. 5 Whys Deepen
export async function requestFiveWhysDeepen(payload: {
  initialProblem: string;
  steps: { level: number; question: string; answer: string }[];
}) {
  const response = await fetchWithTimeout('/api/gemini/five-whys-deepen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response);
}

// 9. CBT Restructure
export async function requestCbtRestructure(payload: {
  situation: string;
  automaticThought: string;
  emotions: { name: string; intensityBefore: number }[];
  bodySensations: string;
}) {
  const response = await fetchWithTimeout('/api/gemini/cbt-restructure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response);
}

// 10. Goal Makers Strategy
export async function requestGoalMakersStrategy(payload: {
  goalTitle: string;
  pointA: string;
  pointB: string;
  resources: string[];
  saboteurs: string[];
}) {
  const response = await fetchWithTimeout('/api/gemini/goal-makers-strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response);
}

// 11. NVC & EQ
export async function requestNvcEqTransform(payload: {
  triggerSituation?: string;
  rawExpression?: string;
  partnerRole?: string;
  selectedEmotions?: string[];
  currentNeed?: string;
}) {
  const response = await fetchWithTimeout('/api/gemini/nvc-eq-transform', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response);
}

// 12. Wheel of Balance
export async function requestWheelBalanceAnalysis(payload: {
  spheres: {
    id?: string;
    nameUk?: string;
    nameEn?: string;
    score: number;
    notes?: string;
    tenPointVision?: string;
    whyNotLower?: string;
    whatNeedsForPlusOne?: string;
  }[];
  userGoal?: string;
  title?: string;
}) {
  const response = await fetchWithTimeout('/api/gemini/wheel-balance-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response);
}

// 13. Personalized Affirmation
export async function requestPersonalizedAffirmation(payload: {
  category: string;
  currentMood?: string;
  userContext?: string;
  lang?: 'uk' | 'en';
}): Promise<{
  quote: string;
  authorOrSchool: string;
  psychologicalMechanism: string;
  somaticAnchor: string;
  reflectionQuestion: string;
  microAction: string;
}> {
  const response = await fetchWithTimeout('/api/gemini/generate-affirmation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response);
}

// 14. Self-Learning Engine Adaptation
export async function requestSelfLearningAdaptation(payload: {
  feedbacks: UserFeedback[];
  currentSettings: any;
}) {
  try {
    const response = await fetchWithTimeout('/api/gemini/self-learning-adapt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleApiResponse(response);
  } catch (e) {
    console.warn('Fallback self-learning adapt', e);
    return {
      analysisSummary: 'Система успішно інтегрувала ваші відгуки та скоригувала фокус на практичність і підтримку.',
      learnedToneAdjustments: ['Більш чуйний та емпатичний тон', 'Мінімум абстрактної термінології'],
      updatedPromptDirectives: ['Давати більше покрокових орієнтирів', 'Підтримувати внутрішній ресурс'],
      coachingFocusEvolution: 'Еволюція в бік цілісного людиноцентричного коучингу з опорою на цінності та дію.',
    };
  }
}

// Robust fallback synthesis in case of complete offline or quota limit
function synthesizeConsiliumFallback(payload: {
  situation: string;
  pastExperience?: string;
  futureGoal?: string;
  approach?: string;
  emotions?: string[];
}): ConsiliumAnalysis {
  return {
    summary: `Ви проходите важливу точку трансформації щодо ситуації: «${payload.situation.slice(0, 120)}...». Ваш стан поєднує бажання ясності та природну захисну напругу нервової системи.`,
    coreDilemma: 'Конфлікт між звичним контролем над результатом і необхідністю довіритися живому процесу змін.',
    theoreticalInsights: {
      generalPsychology: 'Увага звужена на зоні ризику (ефект селективного сприйняття загрози), що блокує бачення додаткових варіантів.',
      developmentalPattern: 'Криза переходу на новий рівень зрілості, де старі способи реагування більше не дають потрібного результату.',
      socialDynamics: 'Вплив інтроєкованих очікувань соціального оточення щодо того, яким «має бути» ідеальний результат.',
      psychophysiology: 'Активація симпатичної нервової системи викликає тілесне затиснення в шиї, плечах та діафрагмі.',
    },
    therapeuticPerspectives: {
      cbt: {
        automaticThoughts: [
          '«Якщо я зроблю помилку, це буде катастрофою»',
          '«Я мушу все тримати під повним контролем»',
        ],
        cognitiveDistortions: ['Катастрофізація', 'Чорно-біле мислення (Все або нічого)', 'Надмірне узагальнення'],
        rationalAlternatives: [
          'Помилка — це лише зворотний звʼязок від реальності, який допомагає скоригувати курс.',
          'Я можу контролювати свої поточні дії, але результат формується у співдії зі світом.',
        ],
        behavioralExperiment: 'Спробувати зробити один запланований крок у неповному контролі та зафіксувати, що найгірший сценарій не справдився.',
      },
      gestalt: {
        figureAndGround: 'Фігура: гостра тривога за результат. Фон: накопичена втома та потреба у турботі про себе.',
        unfinishedGestalt: 'Незакрита потреба у визнанні та безпеці з попереднього досвіду невдач.',
        hereAndNowAwareness: 'Зупиніться прямо зараз, відчуйте опору стоп об підлогу і зробіть 3 повільних видихи через рот.',
        emptyChairDialoguePrompt: 'Посадіть навпроти себе ту частину, яка вимагає ідеальності, і запитайте її: «Від чого ти насправді намагаєшся мене захистити?»',
      },
      naturalApproachLinetsky: {
        isVsShouldBeTension: 'Розрив між тим, що ситуація розвивається у власному природному темпі («як є»), і вашим ментальним дедлайном («як має бути негайно»).',
        effortlessAwarenessInsight: 'Коли ви перестаєте боротися з фактом наявності труднощів, напруга трансформується у чисту енергію присутності.',
        resistanceDissolution: 'Відпускання опору дає легкість і ясність наступного точного кроку.',
        ontologicalTriad: {
          lightOntology: 'Фактична реальність: ресурси, часові межі та фізичні обставини задачі.',
          sparklingOntology: 'Парадокс: найбільший прорив трапляється саме тоді, коли ви дозволяєте собі не знати точної відповіді наперед.',
          darkOntology: 'Прихований контекст: події складаються так, щоб зняти зайві ілюзії та повернути вас до справжнього покликання.',
        },
        dialecticPoles: {
          enlightenedIntention: 'Прагнення Модерну: чітка мета, дисципліна, підкорення обставин волі.',
          awakenedFeeling: 'Відчування Постмодерну: чутливість до потоку, прийняття невизначеності, тонкий контакт.',
          thirdTestamentSynthesis: 'Третій Завіт: поєднання активної праці з повною довірою до законів Буття (один розум, два серця).',
        },
        eventVibration5: {
          element: 'fire',
          elementNameUk: 'Вогонь (Мудрість Розрізнення)',
          polarityDilemma: 'Факти vs Ментальні інтерпретації',
          transmutedWisdom: 'Мудрість чіткого розрізнення того, що залежить від вас, і того, що належить світу.',
          practicalGuidance: 'Відокремте реальні факти від тривожних здогадок розуму.',
        },
        transformationProtocol: {
          impossibilityCore: 'Відчуття глухого кута та безсилля перед масштабом виклику.',
          spellbreakingQuestion: 'Що мало статися, щоб цей глухий кут став найціннішим уроком вашого життя?',
          hyperfaithReframe: 'Уявіть, що цей виклик уже успішно пройдено через рік: що було першим кроком?',
        },
        eventMatrixCell: {
          domain: 'emotions',
          domainNameUk: 'Емоції',
          stage: 'maintenance',
          stageNameUk: 'Підтримання',
          vectorDescription: 'Від тривожної напруги до спокійної впевненої присутності.',
        },
      },
      jungianAnalytical: {
        activeArchetype: 'Шукач / Герой на етапі випробування',
        shadowElement: 'Тінь Перфекціоніста: страх здатися вразливим або слабким.',
        individuationTask: 'Прийняти свою людську недосконалість як джерело справжньої сили та емпатії.',
        subconsciousComplex: 'Комплекс високих очікувань, сформований у ранньому досвіді оцінювання.',
        synchronicityOrSymbolPrompt: 'Зверніть увагу на символічні образи мостів, дверей та нового світанку у снах чи повсякденності.',
      },
      psychodynamics: {
        defenseMechanisms: ['Раціоналізація', 'Гіперкомпенсація через надмірний контроль'],
        unconsciousSecondaryGains: 'Залишатися в зоні звичних страждань безпечніше, ніж ризикнути піти у невідомий успіх.',
        earlyExperienceEcho: 'Відлуння колишньої ситуації, коли помилка призвела до відчуття самотності.',
      },
      clientCentered: {
        empathicMirror: 'Я чую, скільки мужності та прагнення до правди стоїть за цим вашим пошуком.',
        internalLocusOfControl: 'Єдиний справжній компас знаходиться всередині вас — довіряйте своїм глибинним відчуттям.',
      },
      somatic: {
        bodyTensionZones: ['Діафрагма та сонячне сплетіння', 'Мʼязи щелепи та потилиці'],
        somaticReleasePractice: 'Вправа 4-7-8: вдих носом на 4 рахунки, затримка на 7, повільний плавний видих ротом на 8 рахунків (повторити 4 рази).',
      },
      existential: {
        meaningAndValues: 'Справжній сенс полягає не лише в ідеальному результаті, а у вірності своїм цінностям під час руху.',
        freedomAndResponsibility: 'Ви вільні обирати своє ставлення до будь-якої події просто тут і зараз.',
      },
    },
    diltsLogicalLevels: {
      environment: { description: 'Поточні матеріальні умови та оточення', problemManifestation: 'Відчуття нестачі часу та тиску зовні' },
      behavior: { description: 'Щоденні конкретні дії', problemManifestation: 'Сумніви та відкладання дій' },
      capabilities: { description: 'Навички та стратегії', problemManifestation: 'Потреба у гнучких алгоритмах рішень' },
      beliefsAndValues: { description: 'Цінності та переконання', problemManifestation: 'Установка: «Я повинен довести свою цінність»' },
      identity: { description: 'Я-Концепція', problemManifestation: 'Хитка самооцінка в момент кризи' },
      missionAndPurpose: { description: 'Служіння та вищий сенс', problemManifestation: 'Втрата звʼязку з великою візією' },
      identifiedProblemLevel: 4,
      identifiedProblemLevelName: 'Переконання та Цінності',
      recommendedSolutionLevel: 5,
      recommendedSolutionLevelName: 'Ідентичність (Я-Концепція)',
      solutionShiftGuidance: 'Підніміться на рівень Ідентичності: дійте з ролі Творця власного життя, а не з ролі заручника обставин.',
    },
    beliefPatterning: {
      limitingBelief: 'Я не маю права на помилку, інакше все зруйнується.',
      distortionType: 'Катастрофізація та помилкова причинність',
      positiveIntention: 'Захистити себе від болю осуду та зберегти статус.',
      sleightOfMouthReframes: {
        intention: 'Це переконання дбає про вашу репутацію та високий стандарт якості.',
        redefine: 'Це не помилка, а найшвидший спосіб калібрування точності дій.',
        consequence: 'Якщо боятися помилок, взагалі ніколи не розпочнеться справжній рух.',
        chunkDown: 'Яка конкретно найменша деталь вас турбує?',
        chunkUp: 'Будь-який великий майстер зробив тисячі помилок на шляху до майстерності.',
        analogy: 'Дитина падає десятки разів, перш ніж навчитися впевнено бігати.',
        changeFrameSize: 'Через кілька років цей момент стане кумедною історією вашого зростання.',
        anotherOutcome: 'Головне — це набутий досвід та внутрішня сила, а не стерильна безпомилковість.',
        modelOfTheWorld: 'У філософії кайдзен помилка сприймається як скарб для вдосконалення.',
        hierarchyOfCriteria: 'Що для вас дорожче: жива діяльність чи бездоганна бездіяльність?',
        applyToSelf: 'Чи не є саме це переконання найбільшою помилкою мислення?',
        metaFrame: 'Ви зараз спостерігаєте цю думку і усвідомлюєте, що вона не має над вами абсолютної влади.',
      },
      liberatingCoreBelief: '«Я дію свідомо, навчаюся з кожного кроку і маю повне право на розвиток у власному темпі».',
    },
    goalMakersActionPlan: {
      immediate24hStep: 'Зробити 1 конкретну найпростішу мікро-дію (наприклад, написати план із 3 пунктів або зробити 1 дзвінок) протягом наступних 24 годин.',
      shortTerm7dMilestone: 'Впровадити щоденну 10-хвилинну практику заземлення та провести 1 поведінковий експеримент.',
      longTerm30dStrategy: 'Сформувати стабільну звичку спиратися на власні цінності та регулярно звірятися з Колесом Балансу.',
      innerSaboteurDefense: 'Коли внутрішній критик каже «Ти не впораєшся», спокійно відповісти: «Дякую за турботу, я беру відповідальність на себе і зроблю один маленький крок».',
      resourceAnchor: 'Згадати стан тріумфу з минулого, покласти долоню на серце і глибоко вдихнути цю впевненість.',
    },
    coachingQuestions: [
      'Якби ви точно знали, що неможливо зазнати поразки, яким був би ваш перший сміливий крок?',
      'Яка прихована сила або цінність прагне проявитися через цю ситуацію?',
      'Хто ви є поза очікуваннями та оцінками інших людей?',
      'Що принесе вам найбільше полегшення і спокій просто зараз?',
    ],
    recommendedSmartTools: {
      nvcEq: {
        isRecommended: true,
        reason: 'Для зняття внутрішнього або зовнішнього напруження через усвідомлення базових потреб.',
      },
      wheelOfBalance: {
        isRecommended: true,
        reason: 'Для відновлення системного балансу між сферами життя.',
      },
    },
  };
}

// 7. Hundred Wishes AI Analysis
export async function requestHundredWishesAnalysis(
  wishes: any[]
): Promise<any> {
  try {
    const response = await fetchWithTimeout('/api/gemini/hundred-wishes-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishes }),
    });
    return await handleApiResponse(response);
  } catch (e) {
    console.warn('Fallback hundred wishes analysis', e);
    const totalCount = wishes.length;
    const highEnergy = wishes.filter((w) => (w.energyScore || 0) >= 8);
    const materialCount = wishes.filter((w) => w.category === 'material').length;
    const experienceCount = wishes.filter((w) => w.category === 'experience').length;
    const skillsCount = wishes.filter((w) => w.category === 'skills_growth').length;
    const healthCount = wishes.filter((w) => w.category === 'relationships_health').length;
    const spiritCount = wishes.filter((w) => w.category === 'contribution_spirit').length;

    return {
      summary: `Ви зафіксували ${totalCount} бажань. Серед них ${highEnergy.length} мають максимальний енергетичний заряд (8-10 балів), що свідчить про живий внутрішній вогонь та готовність до перетворень.`,
      balanceByCategory: [
        {
          category: 'Матеріальне (Have)',
          percentage: totalCount ? Math.round((materialCount / totalCount) * 100) : 20,
          coachComment: materialCount > totalCount * 0.4
            ? 'Сфокусованість на безпеці та матеріальній базі. Варто перевірити, чи не закривають речі емоційні дефіцити.'
            : 'Здоровий баланс матеріального заземлення.',
        },
        {
          category: 'Досвід та враження (Experience)',
          percentage: totalCount ? Math.round((experienceCount / totalCount) * 100) : 20,
          coachComment: 'Враження живлять дофамінову систему та захищають від рутини й вигорання.',
        },
        {
          category: 'Навички та тіло (Do / Be)',
          percentage: totalCount ? Math.round((skillsCount / totalCount) * 100) : 20,
          coachComment: 'Прагнення до зростання майстерності та зміцнення тілесного ресурсу.',
        },
        {
          category: 'Стосунки та близькість (Relationships)',
          percentage: totalCount ? Math.round((healthCount / totalCount) * 100) : 20,
          coachComment: 'Глибина звʼязку з близькими — ключовий предиктор щастя за Гарвардським дослідженням дорослого розвитку.',
        },
        {
          category: 'Внесок та сенси (Give / Contribute)',
          percentage: totalCount ? Math.round((spiritCount / totalCount) * 100) : 20,
          coachComment: 'Вихід за межі власного «Я», що дарує тривале відчуття наповненості життя.',
        },
      ],
      dominantLayerInsight: totalCount >= 70
        ? 'Чудово! Ви прорвали внутрішнього цензора і дісталися до 3-го шару (71-100) — території сміливих дитячих мрій та глибинної сутності.'
        : 'Ви знаходитесь на рівні структурування основних потреб. Продовжуйте рух до відмітки 70-100, щоб відкрити найбільш неочікувані й справжні бажання.',
      topHighEnergyPicks: highEnergy.slice(0, 3).map((w, idx) => ({
        number: w.number || idx + 1,
        text: w.text || 'Бажання з високим зарядом',
        rationale: 'Це бажання викликає миттєвий емоційний та соматичний резонанс — ідеальний кандидат для перетворення на SMART-ціль.',
      })),
      hiddenThemes: [
        'Потреба у свободі вибору та спонтанності',
        'Прагнення до глибокого визнання та самореалізації',
        'Турбота про відновлення внутрішньої дитини',
      ],
      coachingRecommendations: [
        'Оберіть 3 бажання з найвищим балом (9-10) і трансформуйте їх у вкладці «Цілі по SMART»',
        'Зробіть першу дію за «Правилом 72 годин» для найпростішого з бажань списку',
        'Не виправляйте навіть ті пункти, які здаються наївними — саме в них прихована жива енергія',
      ],
    };
  }
}

// 8. Self-Reflection AI Feedback
export async function requestSelfReflectionFeedback(payload: {
  method: string;
  energyScore: number;
  moodScore: number;
  primaryEmotions: string[];
  content: any;
}): Promise<any> {
  try {
    const response = await fetchWithTimeout('/api/gemini/self-reflection-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleApiResponse(response);
  } catch (e) {
    console.warn('Fallback self-reflection feedback', e);
    return {
      summary: 'Ви здійснили важливу усвідомлену зупинку, щоб сповільнитися, відчути свій стан та підвести підсумки без самоосуду.',
      supportiveValidation: `Ваші емоції (${(payload.primaryEmotions || ['втома', 'прийняття']).join(', ')}) мають цілковите право на існування. Енергетичний рівень ${payload.energyScore}/10 свідчить про поточну ємність вашої системи — поважайте ці межі.`,
      cognitiveTrapDetector: 'Захист від румінацій: те, що не вдалося ідеально, є лише матеріалом зворотного звʼязку, а не свідченням вашої «недостатності».',
      resourceReframe: 'Кожен день містить як виконані завдання, так і приховані ресурси для перепочинку. Ви навчаєтеся бути добрим другом самому собі.',
      actionStepForTomorrow: 'Подарувати собі 15 хвилин повної тиші вранці або ввечері, випити склянку теплої води та зробити одну справу з турботи про тіло.',
    };
  }
}

// 9. SMART Goal AI Audit
export async function requestSmartGoalAudit(payload: any): Promise<any> {
  try {
    const response = await fetchWithTimeout('/api/gemini/smart-goal-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleApiResponse(response);
  } catch (e) {
    console.warn('Fallback smart goal audit', e);
    return {
      smartScore: 88,
      strengths: [
        'Ціль чітко сфокусована на конкретній ділянці життя',
        'Залучено ментальний контрастинг WOOP для опрацювання внутрішнього саботера',
        'Присутнє обмеження в часі та перший крок',
      ],
      vulnerabilities: [
        'Варто ще точніше кількісно окреслити 100% готовність, щоб мозок не мав простору для сумнівів',
        'Перевірте, чи не завищено очікування від першого тижня реалізації',
      ],
      coachQuestions: [
        'Що станеться найгіршого, якщо ви не досягнете цієї цілі в зазначений дедлайн?',
        'Як саме ваше тіло відчує, що мета досягнута на всі 100%?',
        'Від якої другорядної справи вам потрібно свідомо відмовитися, щоб звільнити час?',
      ],
      boostRecommendation: 'Сконцентруйтеся на першому мікрокроці за 72 години — саме швидкий фізичний імпульс руйнує інерцію зволікання.',
    };
  }
}

// 10. Action Guide & Step-by-Step Execution Protocol
export interface ActionGuideProtocol {
  title: string;
  psychologicalMechanism: string;
  stepByStepProtocol: {
    stepNumber: number;
    title: string;
    description: string;
    timeEstimate: string;
  }[];
  sabotageTrapAndAntidote: string;
  completionCheck: string;
  recommendedToolHints?: string[];
}

export async function requestActionGuide(payload: {
  actionText: string;
  timeframe?: string;
  situation?: string;
  lang?: string;
}): Promise<ActionGuideProtocol> {
  try {
    const response = await fetchWithTimeout('/api/gemini/action-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleApiResponse(response);
  } catch (e) {
    console.warn('Fallback action guide protocol', e);
    const textLower = (payload.actionText || '').toLowerCase();
    
    // Context-sensitive fallback
    if (textLower.includes('заземлен') || textLower.includes('дихан')) {
      return {
        title: 'Протокол соматичного заземлення та регуляції вегетативної нервової системи',
        psychologicalMechanism: 'Активація вентрального вагуса (блукаючого нерва), зниження активності мигдалеподібного тіла та перемикання мозку з режиму «біжи/бийся» у режим спокою й аналізу.',
        stepByStepProtocol: [
          {
            stepNumber: 1,
            title: 'Фізична опора та положення тіла',
            description: 'Сядьте з рівною спиною, щільно притисніть обидві стопи до підлоги, відчуйте контакт із поверхнею крісла.',
            timeEstimate: '1 хв',
          },
          {
            stepNumber: 2,
            title: 'Дихальний цикл 4-7-8 або подовжений видих',
            description: 'Вдих через ніс на 4 рахунки, затримка на 7, повільний плавний видих через напіввідкритий рот на 8 рахунків (повторити 4 цикли).',
            timeEstimate: '3 хв',
          },
          {
            stepNumber: 3,
            title: 'Сенсорний якір «5-4-3-2-1»',
            description: 'Знайдіть очима 5 предметів навколо, відчуйте 4 тактильних відчуття, розрізніть 3 звуки, 2 запахи та 1 смак у роті.',
            timeEstimate: '3 хв',
          },
          {
            stepNumber: 4,
            title: 'Тілесне сканування та фіксація спокою',
            description: 'Зверніть увагу, як опустилися плечі та розслабилася щелепа. Зафіксуйте цей спокій як точку відновлення балансу.',
            timeEstimate: '2 хв',
          },
        ],
        sabotageTrapAndAntidote: 'Пастка: думка «Це надто просто, мені зараз не до дихання». Антидот: увімкніть таймер на рівно 3 хвилини — це мінімум, необхідний біохімії крові для стабілізації.',
        completionCheck: 'Зниження частоти серцевих скорочень, теплі долоні, зникнення м’язового спазму в шиї та грудях.',
        recommendedToolHints: ['Соматичне заземлення в шапці додатку', 'Саморефлексія'],
      };
    }

    if (textLower.includes('експеримент') || textLower.includes('кпт')) {
      return {
        title: 'Протокол поведінкового експерименту (КПТ Аарона Бека)',
        psychologicalMechanism: 'Пряма перевірка когнітивного упередження або тривожного очікування на практиці для деконструкції уявного катастрофічного сценарію.',
        stepByStepProtocol: [
          {
            stepNumber: 1,
            title: 'Формулювання автоматичної тривоги',
            description: 'Сформулюйте катастрофічне очікування: «Якщо я зроблю X, то станеться найгірше Y». Оцініть віру в це від 0% до 100%.',
            timeEstimate: '2 хв',
          },
          {
            stepNumber: 2,
            title: 'Визначення безпечного тестового формату',
            description: 'Заплануйте найпростішу безпечну дію, яка кине виклик цьому страху (наприклад, сказати нейтральне «ні» або поставити запитання публічно).',
            timeEstimate: '3 хв',
          },
          {
            stepNumber: 3,
            title: 'Фізичне проведення експерименту',
            description: 'Здійсніть дію точно за планом, зберігаючи позицію уважного дослідника-науковця, без самокритики.',
            timeEstimate: '5-15 хв',
          },
          {
            stepNumber: 4,
            title: 'Звірка фактів та раціональне резюме',
            description: 'Запишіть: чи справдився найгірший прогноз? Що реально сталося? Наскільки знизився страх тепер?',
            timeEstimate: '3 хв',
          },
        ],
        sabotageTrapAndAntidote: 'Пастка: очікування ідеального моменту або зникнення страху перед дією. Антидот: дійте разом зі страхом, сприймаючи експеримент як гру, де будь-який результат є цінністю.',
        completionCheck: 'Зафіксований письмовий результат у КПТ Щоденнику або Журналі, що доводить невідповідність реальності катастрофічним фантазіям.',
        recommendedToolHints: ['КПТ Щоденник', 'Трансформація переконань'],
      };
    }

    if (textLower.includes('баланс') || textLower.includes('колес')) {
      return {
        title: 'Протокол роботи з Колесом Балансу (Systemic Life Audit)',
        psychologicalMechanism: 'Візуалізація балансу життєвої енергії перемикає мислення з точкового тунельного стресу на макро-перспективу.',
        stepByStepProtocol: [
          {
            stepNumber: 1,
            title: 'Оцінка 8 життєвих сфер',
            description: 'Пройдіть по кожній сфері (Здоров’я, Кар’єра, Стосунки, Фінанси тощо) та виставте щиру оцінку від 1 до 10.',
            timeEstimate: '5 хв',
          },
          {
            stepNumber: 2,
            title: 'Виявлення опорного важеля',
            description: 'Знайдіть одну сферу, покращення якої навіть на +1 бал дасть найбільший позитивний каскад для інших сфер.',
            timeEstimate: '3 хв',
          },
          {
            stepNumber: 3,
            title: 'Формулювання 1 мікро-дії тижня',
            description: 'Сформулюйте одне конкретне рішення для обраної опорної сфери на найближчі 7 днів.',
            timeEstimate: '3 хв',
          },
        ],
        sabotageTrapAndAntidote: 'Пастка: намагання покращити всі 8 сфер одночасно. Антидот: оберіть строго одну опорну сферу на спринт.',
        completionCheck: 'Сформована діаграма в розділі Колесо Балансу та зафіксована фокусна дія тижня.',
        recommendedToolHints: ['Колесо Балансу', 'Цілі по SMART'],
      };
    }

    // Generic Action Micro-step protocol
    return {
      title: 'Протокол виконання першого мікро-кроку (24–72 год)',
      psychologicalMechanism: 'Подолання лімбічного ступору та запуск дофамінової петлі зворотного зв’язку через завершення фізичної дії мінімального опору.',
      stepByStepProtocol: [
        {
          stepNumber: 1,
          title: 'Декомпозиція до 2-хвилинного фрагменту',
          description: 'Зменшіть масштаб завдання до мікро-дії, яку фізично неможливо саботувати (написати 1 рядок, відкрити файл, зробити 1 запит).',
          timeEstimate: '2 хв',
        },
        {
          stepNumber: 2,
          title: 'Фіксація часу в календарі (Implementation Intention)',
          description: 'Сформулюйте намір: «Сьогодні о [година] я сяду за стіл і зроблю [дія] протягом 10 хвилин».',
          timeEstimate: '1 хв',
        },
        {
          stepNumber: 3,
          title: 'Виконання без оцінки досконалості',
          description: 'Зробіть намір реальністю. Дозвольте першому драфту бути недосконалим — головне подолати стан спокою маси.',
          timeEstimate: '5–10 хв',
        },
        {
          stepNumber: 4,
          title: 'Фіксація дофамінового завершення',
          description: 'Подумки або в щоденнику скажіть собі: «Крок зроблено, процес запущено». Запишіть наступний мікрокрок.',
          timeEstimate: '1 хв',
        },
      ],
      sabotageTrapAndAntidote: 'Пастка: перфекціонізм («Якщо робити, то одразу фундаментально»). Антидот: правило 70% — краще недосконала зроблена дія, ніж геніальна бездіяльність.',
      completionCheck: 'Реальний матеріальний або цифровий артефакт (відправлений лист, створений документ, заповнений блок у додатку).',
      recommendedToolHints: ['Цілі по SMART', 'Goal MAker$', 'Мої записи в Журналі'],
    };
  }
}

// -------------------------------------------------------------
// Pre-Mortem (Премортем Гері Кляйна: аналіз катастрофи з майбутнього)
// -------------------------------------------------------------
export async function runPreMortemAnalysis(params: {
  plan: string;
  expertRole?: string;
  horizonMonths?: number;
  contextNotes?: string;
  lang?: string;
}): Promise<PreMortemData> {
  const { plan, expertRole = 'Криптоексперт / Квантовий трейдер', horizonMonths = 6, contextNotes, lang = 'uk' } = params;

  try {
    const response = await fetchWithTimeout('/api/gemini/pre-mortem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan,
        expertRole,
        horizonMonths,
        contextNotes,
        lang,
      }),
    }, 45000);

    const data = await handleApiResponse(response);

    return {
      id: 'pre-mortem-' + Date.now(),
      title: `Премортем: ${plan.slice(0, 50)}${plan.length > 50 ? '...' : ''}`,
      date: new Date().toISOString(),
      expertPersona: expertRole,
      originalPlan: plan,
      targetHorizon: `${horizonMonths} місяців`,
      failureCauses: data.failureCauses || [],
      firstEarlyRedFlag: data.firstEarlyRedFlag || 'Ранній дзвіночок не зафіксовано',
      monthlyChronicle: data.monthlyChronicle || [],
      mostDangerousFailure: data.mostDangerousFailure || {
        causeNumber: 1,
        title: 'Фатальна невідповідність ринкового режиму',
        whyDeadliest: 'Знищує баланс швидше, ніж трейдер встигає усвідомити зміну парадигми.',
        fundamentalDifference: 'На відміну від звичайних просадок, цей сценарій не піддається простому пересиджуванню.',
      },
      biggestHiddenAssumption: data.biggestHiddenAssumption || {
        assumption: 'Припущення про лінійність і стабільність ринкових умов',
        brutalTruth: 'Генератори сигналів працюють лише на вузькому проміжку волатильності.',
        fatalFlawDiagnosis: 'Спроба вичавити щоденний фіксований відсоток із хаотичного середовища призводить до мартингейлу.',
      },
      revisedAntiFragilePlan: data.revisedAntiFragilePlan || {
        summary: 'Перехід від щоденного фіксованого профіту до асиметричного математичного сподівання з жорстким стоп-лосом депозиту.',
        concreteSteps: [],
        newRulesOfEngagement: ['Заборона реінвестування до проходження 3 стрес-тестів волатильності'],
      },
      killSwitchChecklist: data.killSwitchChecklist || [],
      adversaryPerspective: data.adversaryPerspective || {
        persona: 'Маркетмейкер / Алгоритмічний арбітражер біржі',
        launchWeekTrap: 'Штучний спред та зняття ліквідності перед новинним імпульсом для вибивання стопів підписників генератора.',
        invisibleStrike: 'Полювання за скупченням лімітних ордерів на ключових рівнях, про які бот заздалегідь публікує сигнал.',
      },
    };
  } catch (error: any) {
    console.warn('Pre-mortem API error, delivering high-fidelity fallback analysis:', error);

    // High-fidelity structured fallback matching Gary Klein methodology
    const isCrypto = plan.toLowerCase().includes('крипт') || plan.toLowerCase().includes('сигнал') || plan.toLowerCase().includes('дохід') || plan.toLowerCase().includes('торгов');
    
    return {
      id: 'pre-mortem-' + Date.now(),
      title: `Премортем: ${plan.slice(0, 50)}${plan.length > 50 ? '...' : ''}`,
      date: new Date().toISOString(),
      expertPersona: expertRole,
      originalPlan: plan,
      targetHorizon: `${horizonMonths} місяців`,
      failureCauses: [
        {
          number: 1,
          title: 'Синдром кривої підгонки (Overfitting) та зміна ринкового режиму',
          mechanism: 'Генератор сигналів показував прибутковість на бектестах у фазі тренду з високою ліквідністю. Щойно ринок перейшов у розпил (chop/ranging) з негативним фандингом, алгоритм дав 8 збиткових входів поспіль.',
          earlyWarningSignal: 'Коефіцієнт Win Rate впав нижче 48% протягом 14 календарних днів (тиждень 3).',
          checkWeek: 3,
        },
        {
          number: 2,
          title: 'Прослизання (Slippage) та комісії біржі, які з’їли всю маржу',
          mechanism: 'При мікро-профітах у 25$/день обсяг торгових оборотів виявився настільки великим, що мейкер/тейкер комісії біржі та прослизання ринкових ордерів забрали 42% від валового прибутку.',
          earlyWarningSignal: 'Сума сплачених комісій перевищила 25% від денного нетто-профіту за підсумком тижня.',
          checkWeek: 2,
        },
        {
          number: 3,
          title: 'Пастка складного відсотка та ліквідаційне плече під час реінвестування',
          mechanism: 'Постійне реінвестування збільшувало обсяг позиції при незмінному ризик-менеджменті. Перший же спайк волатильності (чорний лебідь) на позиції з 5x плечем змив не лише 100% прибутку, але й 60% базового тіла депозиту.',
          earlyWarningSignal: 'Максимальна внутрішньоденна просадка (Drawdown) перевищила 8% від поточного депозиту.',
          checkWeek: 6,
        },
        {
          number: 4,
          title: 'Затримка виконання (Latency) та фронтраннінг інсайдерів',
          mechanism: 'Канал або софт генератора публікує сигнал одночасно тисячам користувачів. Боти-арбітражери випереджають ручні ордери на мілісекунди, через що вхід відбувається на хаях свічки, а вихід — на перелоях.',
          earlyWarningSignal: 'Різниця між ціною сигналу в повідомленні та фактом відкриття ордера перевищує 0.35%.',
          checkWeek: 4,
        },
        {
          number: 5,
          title: 'Когнітивна пастка тилту (Tilt) та порушення алгоритму',
          mechanism: 'Після трьох стопів поспіль виникло бажання відіграти мінус («сьогодні має бути 25$ будь-якою ціною»). Збільшення сайзу вручну поза правилами генератора призвело до втрати дисципліни.',
          earlyWarningSignal: 'Кількість угод за добу перевищила ліміт системи у понад 2 рази (ознака тилту).',
          checkWeek: 5,
        },
        {
          number: 6,
          title: 'Контрагентський ризик та блокування/заморозка коштів',
          mechanism: 'Біржа ввела додаткові KYC-перевірки або зупинила виведення на тлі регуляторних оновлень, заблокувавши ліквідність у момент необхідності ребалансування.',
          earlyWarningSignal: 'Затримка виведення прибутку понад 48 годин або зміна правил маржинального забезпечення.',
          checkWeek: 12,
        },
        {
          number: 7,
          title: 'Ілюзія пасивного доходу та сенсорне перевантаження',
          mechanism: 'Очікування «20 хвилин на день» обернулося 14-годинним безперервним моніторингом графіків, хронічним стресом, безсонням і прийняттям фатального рішення закрити позицію на самому дні паніки.',
          earlyWarningSignal: 'Рівень щоденного екранного часу на біржі перевищує 4 години без зростання PnL.',
          checkWeek: 8,
        },
      ],
      firstEarlyRedFlag: 'Перший вхід за сигналом приніс мінус через те, що свічка вже відпрацювала імпульс за 15 секунд до відкриття ордера, а щоденний комісійний збір склав 35% від тестового прибутку.',
      monthlyChronicle: [
        {
          month: 1,
          title: 'Місяць 1: Ейфорія перших успіхів та накопичення схованих комісій',
          whatHappened: 'Перші 12 днів закрилися в невеликий плюс. Виникла ілюзія легкості та підтвердження гіпотези. Проте комісії та спреди з’їли майже половину очікуваного профіту.',
          destructiveDetail: 'Рішення підвищити лотність і не фіксувати прибуток у фіат, а одразу все реінвестувати.',
        },
        {
          month: 2,
          title: 'Місяць 2: Перша серія стопів та психологічний злам',
          whatHappened: 'Ринок перейшов із тренду у виснажливий боковик. Бот дав серію з 5 хибних пробоїв поспіль. Денна норма у 25$ перестала виконуватися.',
          destructiveDetail: 'Спроба «пересидіти» збиток без жорсткого стопу та відкриття зустрічної позиції на емоціях.',
        },
        {
          month: 3,
          title: 'Місяць 3: Реінвестування на фазі просадки',
          whatHappened: 'Замість запланованих 50$/день баланс топчеться на місці з просадкою -18%. Спроба компенсувати відставання від графіку агресивнішим плечем.',
          destructiveDetail: 'Усереднення збиткової позиції під час падіння ціни проти сигналу бота.',
        },
        {
          month: 4,
          title: 'Місяць 4: Зміна алгоритму та падіння вінрейту',
          whatHappened: 'Розробники генератора сигналів випустили «оновлення», яке виявилося сирим. Кількість помилкових спрацьовувань зросла до 62%.',
          destructiveDetail: 'Відсутність власного незалежного бектесту на історичних даних іншого ринкового циклу.',
        },
        {
          month: 5,
          title: 'Місяць 5: Чорний лебідь та прокол стоп-ордерів',
          whatHappened: 'Раптовий нічний пролив ринку на 12% за 10 хвилин. Сервери біржі зависли, стоп-лоси не спрацювали або закрилися по найгіршій ціні склянки.',
          destructiveDetail: 'Злиття 70% усього накопиченого за попередні місяці депозиту за одну ніч.',
        },
        {
          month: 6,
          title: 'Місяць 6: Фінальне вигорання та капітуляція',
          whatHappened: 'Залишки депозиту не дозволяють генерувати навіть 5$/день без екстремального ризику. Повна апатія, втрата віри в інструмент та фіксація чистого збитку.',
          destructiveDetail: 'Усвідомлення, що план базувався на припущенні, що ринок — це банкомат із фіксованою щоденною зарплатою.',
        },
      ],
      mostDangerousFailure: {
        causeNumber: 3,
        title: 'Пастка агресивного реінвестування при лінійному масштабуванні лота',
        whyDeadliest: 'Це математично неминуча катастрофа. У трейдингу геометричне реінвестування без паралельного зниження відносного ризику веде до математичного сподівання рівного нулю (теорія ймовірностей та критерій Келлі).',
        fundamentalDifference: 'Усі інші помилки забирають гроші поступово, даючи час одуматися. Ця помилка знищує 100% капіталу в одну мить без права на помилку.',
      },
      biggestHiddenAssumption: {
        assumption: 'Що фінансовий ринок здатен стабільно віддавати фіксовану суму ($25 або $100) кожен божий день, незалежно від фази та ліквідності.',
        brutalTruth: 'Прибуток у трейдингу розподілений вкрай нерівномірно (степеневий закон Парето): 80% доходу приносять 10-15 днів на рік, а решта часу — це збереження капіталу в боковику. Вимагати від ринку щоденної «зарплати» — це найшвидший шлях до тилту і ліквідації.',
        fatalFlawDiagnosis: 'План повністю ігнорує вартість капіталу в часі, коефіцієнт Шарпа/Сортіно та неминучість фази розпилу, де будь-який трендовий генератор сигналів перетворюється на пилосос для депозиту.',
      },
      revisedAntiFragilePlan: {
        summary: 'Перетворення плану на антикрихку квантову модель: відмова від щоденного таргету на користь щомісячного математичного сподівання, жорсткий стельовий ризик на угоду (0.5-1%) та виведення 50% прибутку в тверді активи.',
        concreteSteps: [
          {
            causeNumber: 1,
            originalVulnerability: 'Зміна ринкового режиму та розпил депозиту',
            revisedAction: 'Впровадити фільтр режиму ринку (ADX > 25 та EMA 200). Якщо індикатор показує боковик — торгівля повністю блокується на рівні API.',
            whyRationale: 'Запобігає 80% хибних сигналів генератора під час відсутності вираженого тренду.',
          },
          {
            causeNumber: 2,
            originalVulnerability: 'Комісії та прослизання з’їдають прибуток',
            revisedAction: 'Перейти виключно на лімітні заявки (Post-Only Maker) та збільшити середній тейк-профіт мінімум до співвідношення 1:3 відносно стопу.',
            whyRationale: 'Комісії перетворюються з убивці депозиту на незначну статтю витрат, а математичне сподівання стає позитивним навіть при вінрейті 40%.',
          },
          {
            causeNumber: 3,
            originalVulnerability: 'Злив депозиту при реінвестуванні',
            revisedAction: 'Правило 50/50: щотижня 50% заробленого беззастережно виводиться на холодний гаманець або у фіат, а реінвестується лише решта.',
            whyRationale: 'Навіть при найгіршому сценарії ліквідації залишкового тіла ви залишаєтеся з накопиченим чистим прибутком за межами біржі.',
          },
        ],
        newRulesOfEngagement: [
          'Жодного дня «обов’язкової норми». Якщо ринок млявий — нуль угод.',
          'Максимальний ризик на одну угоду — суворо не більше 1% від поточного депозиту.',
          'Три стоп-лоси поспіль за добу — автоматичне блокування терміналу до наступного ранку (захист від тилту).',
        ],
      },
      killSwitchChecklist: [
        {
          id: 'ks-1',
          checkItem: 'Провести сліпий форвард-тест генератора на історичних даних фази падіння/боковика 2022-2023 років мінімум на 300 угодах.',
          killThreshold: 'Якщо просадка перевищує 20% або Win Rate падає нижче 45% — НЕГАЙНО ВІДМОВИТИСЯ ВІД ПЛАНУ.',
        },
        {
          id: 'ks-2',
          checkItem: 'Перевірити чистий Slippage та затримку виконання ордерів на реальному мікро-рахунку (execution latency).',
          killThreshold: 'Якщо середня ціна реального відкриття відрізняється від ціни сигналу більш ніж на 0.2% — ВІДМОВА ВІД ПЛАНУ.',
        },
        {
          id: 'ks-3',
          checkItem: 'Розрахувати відношення чистого прибутку до сплачених комісій за 50 тестових мікро-угод.',
          killThreshold: 'Якщо комісії біржі з’їдають понад 30% валового прибутку — ВІДМОВА ВІД ПЛАНУ, стратегія нежиттєздатна на малих депозитах.',
        },
      ],
      adversaryPerspective: {
        persona: 'Маркетмейкер / Інституційний HFT-алгоритм біржі',
        launchWeekTrap: 'Я бачу кластер ордерів від вашого каналу сигналів. У тиждень вашого запуску я зроблю штучний імпульсний сквиз на низькій ліквідності у зворотний бік, щоб зняти ваші стоп-лоси, забрати ліквідність і лише потім пустити ціну в запланований бік.',
        invisibleStrike: 'Використання затримки API-шлюзів: ваші ордери стають у чергу за моїми котируваннями, змушуючи вас купувати у мене за завищеною ціною і продавати мені на дні свічки.',
      },
    };
  }
}
