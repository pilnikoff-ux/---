import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint for Cloud Run and platform deployment health probes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', version: '1.0.2', timestamp: new Date().toISOString() });
});

// Lazy initialize Google GenAI so startup is resilient
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Clean error message helper
function cleanErrorMessage(error: any): string {
  if (!error) return 'Internal server error';
  let msg = error?.message || String(error);
  try {
    const parsed = typeof msg === 'string' && msg.trim().startsWith('{') ? JSON.parse(msg) : null;
    if (parsed?.error?.message) {
      msg = parsed.error.message;
    }
  } catch {
    // Keep original msg
  }
  return msg;
}

// Helper for resilient Gemini API calls with auto-retry and multi-model fallback
async function generateWithRetryAndFallback(params: {
  contents: any;
  config: any;
  preferredModel?: string;
  fallbackModels?: string[];
}) {
  // Use recommended standard models with cascaded fallback (Gemini 3.7 Flash -> Flash Latest -> 3.1 Flash Lite)
  const models = [
    params.preferredModel || 'gemini-3.7-flash',
    ...(params.fallbackModels || ['gemini-flash-latest', 'gemini-3.1-flash-lite']),
  ];

  // Remove duplicate models in chain
  const uniqueModels = Array.from(new Set(models));

  let lastError: any = null;
  for (const model of uniqueModels) {
    // Try up to 2 quick attempts per model before switching
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await getAiClient().models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = cleanErrorMessage(err);
        console.warn(`[Gemini GenAI] Model ${model} (attempt ${attempt + 1}) error: ${errMsg}`);

        // If it's a 503 (high demand / unavailable), 429 (rate limit / quota), or free tier limit, switch to fallback model
        const shouldSwitchModel =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('quota') ||
          errMsg.includes('Quota exceeded') ||
          errMsg.includes('limit: 0');

        if (shouldSwitchModel) {
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          // Switch to next model in the fallback chain
          break;
        } else {
          // If other error, switch to next model
          break;
        }
      }
    }
  }
  throw lastError;
}

// Endpoint: Multi-perspective Consilium Analysis
app.post('/api/gemini/analyze-situation', async (req: Request, res: Response) => {
  try {
    const { situation, pastExperience, futureGoal, approach, emotions } = req.body;

    if (!situation) {
      return res.status(400).json({ error: 'Situation description is required' });
    }

    const systemInstruction = `Ти — висококваліфікований супервізор, клінічний психолог та майстер інтегрального коучингу з 20-річним досвідом.
Твоє завдання — провести глибокий, науково обґрунтований та підтримуючий психологічний консиліум за запитом людини у складній ситуації, сумнівах чи кризі.
Ти поєднуєш:
1. Фундаментальну теоретичну психологію (Загальна, Вікова, Диференціальна, Соціальна психологія, Психофізіологія).
2. Провідні психотерапевтичні школи:
   - Когнітивно-поведінкова терапія (КПТ): виявлення автоматичних думок, когнітивних спотворень, раціональні альтернативи, поведінковий експеримент.
   - Гештальт-терапія: фокус на «тут і зараз», контакт, фігура/фон, незавершені гештальти, діалог субособистостей.
   - Природний підхід Олега Линецького («Вспалахи Вічної Філософії»):
     * Онтологічна тріада: Світла онтологія (факти, суб'єкт-об'єкт), Сяюча онтологія (розриви, спалахи здивування, суб'єкт-суб'єкт), Темна онтологія (приховані фонові сюжети, контингентність буття, об'єкт-об'єкт).
     * Діалектика суб'єктів: Просвітлений суб'єкт Модерну (прагнення, володіння, метонімія, розширення) vs Пробуджений суб'єкт Постмодерну (відчування, розмикання, метафора, заглиблення) vs Третій Завіт / Договір співучасті (со-узгодження волі творіння і волі людини, m1h2 - один розум, два серця).
     * 108 бусин події та 9-клітинна матриця запитів (Емоції, Увага, Бажання на стадіях Зародження, Підтримання, Завершення).
     * 5 стихій / мудростей та полярностей: Земля (рівність/Ратнасамбхава), Вогонь (розрізнення фактів і переконань/Амітабха), Повітря (досвід/Амогхасіддхі), Вода (дзеркало контролю й інтуїції/Акшоб'я), Простір (пустота й надія/Вайрочана).
     * Протоколи перетворень у точці неможливості (зачакловані ролі, деконструююче запитання «Що мало статися, щоб цей глухий кут мав сенс?», гіпервір'я за Ніком Ландом).
   - Аналітична психологія Карла Густава Юнга: Архетипи несвідомого, Тіньовий аспект (Shadow), Аніма/Анімус, індивідуація, підсвідомі комплекси та символічна синхронічність.
   - Психодинамічний підхід/Психоаналіз (Юнг, Фройд): захисні механізми (раціоналізація, проекція, витіснення), несвідомі вторинні вигоди, відлуння минулого.
   - Клієнт-центрована терапія (Карл Роджерс): безумовне прийняття, емпатичне дзеркало, внутрішній локус оцінки.
   - Тілесно-орієнтована терапія: соматичні зони напруги, дихання, заземлення.
   - Екзистенційна терапія: сенс, свобода, відповідальність, автентичність.
3. Нейрологічні рівні Роберта Ділтса (Піраміда сприйняття: Оточення -> Поведінка -> Здібності -> Переконання/Цінності -> Ідентичність -> Місія): визначення рівня проблеми та рівня рішення.
4. Патеринг переконань та 14 фокусів мови Роберта Ділтса (Sleight of Mouth) для перетворення обмежуючого переконання у ресурсне.
5. Коучинг та ігрову механіку «Goal Makers» (Майстри Цілей): конкретні кроки на 24 години, 7 днів, 30 днів, захист від внутрішнього саботера, ресурсний якір.

Повертай відповідь СТРОГО у форматі JSON згідно з наданою схемою. Мова відповіді — українська. Тон — теплий, поважний, глибокий, без штампів та повчань.`;

    const prompt = `Проведи детальний інтегральний консиліум для наступного випадку:
Опис ситуації: ${situation}
${pastExperience ? `Минулий досвід / помилки / передісторія: ${pastExperience}` : ''}
${futureGoal ? `Бажані майбутні цілі: ${futureGoal}` : ''}
${emotions?.length ? `Поточні емоції: ${emotions.join(', ')}` : ''}
${approach ? `Обраний пріоритетний фокус: ${approach}` : 'Комплексний мульти-підхід'}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Емпатичне, глибоке резюме суті проблеми людини та її емоційного стану.',
            },
            coreDilemma: {
              type: Type.STRING,
              description: 'Справжній внутрішній конфлікт або глибинна дилема, яка стоїть за зовнішнім симптомом.',
            },
            theoreticalInsights: {
              type: Type.OBJECT,
              properties: {
                generalPsychology: { type: Type.STRING, description: 'Пояснення з точки зору уваги, пам’яті, когнітивних фільтрів.' },
                developmentalPattern: { type: Type.STRING, description: 'Зв’язок з віковим етапом або кризою дорослішання.' },
                socialDynamics: { type: Type.STRING, description: 'Аналіз соціальних ролей, очікувань оточення чи меж.' },
                psychophysiology: { type: Type.STRING, description: 'Як тіло та нервова система (стресова вісь) реагують на цю напругу.' },
              },
              required: ['generalPsychology', 'developmentalPattern', 'socialDynamics', 'psychophysiology'],
            },
            therapeuticPerspectives: {
              type: Type.OBJECT,
              properties: {
                cbt: {
                  type: Type.OBJECT,
                  properties: {
                    automaticThoughts: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cognitiveDistortions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    rationalAlternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    behavioralExperiment: { type: Type.STRING },
                  },
                  required: ['automaticThoughts', 'cognitiveDistortions', 'rationalAlternatives', 'behavioralExperiment'],
                },
                gestalt: {
                  type: Type.OBJECT,
                  properties: {
                    figureAndGround: { type: Type.STRING },
                    unfinishedGestalt: { type: Type.STRING },
                    hereAndNowAwareness: { type: Type.STRING },
                    emptyChairDialoguePrompt: { type: Type.STRING },
                  },
                  required: ['figureAndGround', 'unfinishedGestalt', 'hereAndNowAwareness', 'emptyChairDialoguePrompt'],
                },
                naturalApproachLinetsky: {
                  type: Type.OBJECT,
                  properties: {
                    isVsShouldBeTension: { type: Type.STRING, description: 'У чому саме розрив між фактом «як є» та очікуванням «як має бути».' },
                    effortlessAwarenessInsight: { type: Type.STRING, description: 'Як беззусильно усвідомити цей процес без боротьби з собою.' },
                    resistanceDissolution: { type: Type.STRING, description: 'Що відбувається, коли опір факту відпускається.' },
                    ontologicalTriad: {
                      type: Type.OBJECT,
                      properties: {
                        lightOntology: { type: Type.STRING, description: 'Світла онтологія: тверді факти, об’єкти та судження розуму (суб’єкт-об’єкт).' },
                        sparklingOntology: { type: Type.STRING, description: 'Сяюча онтологія: спалахи здивування, розриви сприйняття, амбівалентні коливання (суб’єкт-суб’єкт).' },
                        darkOntology: { type: Type.STRING, description: 'Темна онтологія: приховані фонові сюжети, доособистісна логіка подій, контингентність (об’єкт-об’єкт).' },
                      },
                      required: ['lightOntology', 'sparklingOntology', 'darkOntology'],
                    },
                    dialecticPoles: {
                      type: Type.OBJECT,
                      properties: {
                        enlightenedIntention: { type: Type.STRING, description: 'Просвітлений суб’єкт (Модерн): фокус на прагненні, володінні, експансії та метонімії («тому що...»).' },
                        awakenedFeeling: { type: Type.STRING, description: 'Пробуджений суб’єкт (Постмодерн): фокус на почуттях, афіційованості, розмиканні та метафорі («як ніби...»).' },
                        thirdTestamentSynthesis: { type: Type.STRING, description: 'Третій Завіт / Договір співучасті: со-узгодження волі творіння і волі людини (один розум, два серця m1h2).' },
                      },
                      required: ['enlightenedIntention', 'awakenedFeeling', 'thirdTestamentSynthesis'],
                    },
                    eventVibration5: {
                      type: Type.OBJECT,
                      properties: {
                        element: { type: Type.STRING, enum: ['earth', 'fire', 'air', 'water', 'space'] },
                        elementNameUk: { type: Type.STRING, description: 'Назва стихії (Земля, Вогонь, Повітря, Вода або Простір)' },
                        polarityDilemma: { type: Type.STRING, description: 'Ключова полярність (напр. «Переконання vs Факти», «Індивідуалізм vs Колективізм» тощо)' },
                        transmutedWisdom: { type: Type.STRING, description: 'Пробуджена мудрість (Рівності, Розрізнення, Досвіду, Дзеркала або Пустоти)' },
                        practicalGuidance: { type: Type.STRING, description: 'Практична настанова для балансування полярностей.' },
                      },
                      required: ['element', 'elementNameUk', 'polarityDilemma', 'transmutedWisdom', 'practicalGuidance'],
                    },
                    transformationProtocol: {
                      type: Type.OBJECT,
                      properties: {
                        impossibilityCore: { type: Type.STRING, description: 'Точка неможливості: зачаклована роль або тупик, де можливе перетворилося на неможливе.' },
                        spellbreakingQuestion: { type: Type.STRING, description: 'Деконструююче запитання (напр. «Що мало статися, щоб цей глухий кут мав сенс?»).' },
                        hyperfaithReframe: { type: Type.STRING, description: 'Сценарний образ гіпервір’я (Ник Ланд) для перезавантаження матриці подій.' },
                      },
                      required: ['impossibilityCore', 'spellbreakingQuestion', 'hyperfaithReframe'],
                    },
                    eventMatrixCell: {
                      type: Type.OBJECT,
                      properties: {
                        domain: { type: Type.STRING, enum: ['emotions', 'attention', 'desires'] },
                        domainNameUk: { type: Type.STRING, description: 'Сфера: Емоції, Увага або Бажання' },
                        stage: { type: Type.STRING, enum: ['birth', 'maintenance', 'completion'] },
                        stageNameUk: { type: Type.STRING, description: 'Стадія: Зародження, Підтримання або Завершення' },
                        vectorDescription: { type: Type.STRING, description: 'Формула вектору (напр. «Від страждань до полегшення (Завершення драми)»)' },
                      },
                      required: ['domain', 'domainNameUk', 'stage', 'stageNameUk', 'vectorDescription'],
                    },
                  },
                  required: [
                    'isVsShouldBeTension',
                    'effortlessAwarenessInsight',
                    'resistanceDissolution',
                    'ontologicalTriad',
                    'dialecticPoles',
                    'eventVibration5',
                    'transformationProtocol',
                    'eventMatrixCell',
                  ],
                },
                jungianAnalytical: {
                  type: Type.OBJECT,
                  properties: {
                    activeArchetype: { type: Type.STRING, description: 'Провідний архетип несвідомого у даній ситуації' },
                    shadowElement: { type: Type.STRING, description: 'Тіньовий аспект (те витіснене, що проектується на інших)' },
                    individuationTask: { type: Type.STRING, description: 'Завдання індивідуації та інтеграції цілісності' },
                    subconsciousComplex: { type: Type.STRING, description: 'Підсвідомий емоційний комплекс' },
                    synchronicityOrSymbolPrompt: { type: Type.STRING, description: 'Символічний образ або синхронічний знак для осмислення' },
                  },
                  required: ['activeArchetype', 'shadowElement', 'individuationTask', 'subconsciousComplex', 'synchronicityOrSymbolPrompt'],
                },
                psychodynamics: {
                  type: Type.OBJECT,
                  properties: {
                    defenseMechanisms: { type: Type.ARRAY, items: { type: Type.STRING } },
                    unconsciousSecondaryGains: { type: Type.STRING },
                    earlyExperienceEcho: { type: Type.STRING },
                  },
                  required: ['defenseMechanisms', 'unconsciousSecondaryGains', 'earlyExperienceEcho'],
                },
                clientCentered: {
                  type: Type.OBJECT,
                  properties: {
                    empathicMirror: { type: Type.STRING },
                    internalLocusOfControl: { type: Type.STRING },
                  },
                  required: ['empathicMirror', 'internalLocusOfControl'],
                },
                somatic: {
                  type: Type.OBJECT,
                  properties: {
                    bodyTensionZones: { type: Type.ARRAY, items: { type: Type.STRING } },
                    somaticReleasePractice: { type: Type.STRING },
                  },
                  required: ['bodyTensionZones', 'somaticReleasePractice'],
                },
                existential: {
                  type: Type.OBJECT,
                  properties: {
                    meaningAndValues: { type: Type.STRING },
                    freedomAndResponsibility: { type: Type.STRING },
                  },
                  required: ['meaningAndValues', 'freedomAndResponsibility'],
                },
              },
              required: ['cbt', 'gestalt', 'naturalApproachLinetsky', 'jungianAnalytical', 'psychodynamics', 'clientCentered', 'somatic', 'existential'],
            },
            diltsLogicalLevels: {
              type: Type.OBJECT,
              properties: {
                environment: {
                  type: Type.OBJECT,
                  properties: { description: { type: Type.STRING }, problemManifestation: { type: Type.STRING } },
                  required: ['description', 'problemManifestation'],
                },
                behavior: {
                  type: Type.OBJECT,
                  properties: { description: { type: Type.STRING }, problemManifestation: { type: Type.STRING } },
                  required: ['description', 'problemManifestation'],
                },
                capabilities: {
                  type: Type.OBJECT,
                  properties: { description: { type: Type.STRING }, problemManifestation: { type: Type.STRING } },
                  required: ['description', 'problemManifestation'],
                },
                beliefsAndValues: {
                  type: Type.OBJECT,
                  properties: { description: { type: Type.STRING }, problemManifestation: { type: Type.STRING } },
                  required: ['description', 'problemManifestation'],
                },
                identity: {
                  type: Type.OBJECT,
                  properties: { description: { type: Type.STRING }, problemManifestation: { type: Type.STRING } },
                  required: ['description', 'problemManifestation'],
                },
                missionAndPurpose: {
                  type: Type.OBJECT,
                  properties: { description: { type: Type.STRING }, problemManifestation: { type: Type.STRING } },
                  required: ['description', 'problemManifestation'],
                },
                identifiedProblemLevel: { type: Type.INTEGER, description: '1=Оточення, 2=Поведінка, 3=Здібності, 4=Переконання, 5=Ідентичність, 6=Місія' },
                identifiedProblemLevelName: { type: Type.STRING },
                recommendedSolutionLevel: { type: Type.INTEGER, description: 'Рівень де лежить ключ до розвʼязання' },
                recommendedSolutionLevelName: { type: Type.STRING },
                solutionShiftGuidance: { type: Type.STRING, description: 'Конкретний коучинговий перехід на вищий логічний рівень' },
              },
              required: [
                'environment',
                'behavior',
                'capabilities',
                'beliefsAndValues',
                'identity',
                'missionAndPurpose',
                'identifiedProblemLevel',
                'identifiedProblemLevelName',
                'recommendedSolutionLevel',
                'recommendedSolutionLevelName',
                'solutionShiftGuidance',
              ],
            },
            beliefPatterning: {
              type: Type.OBJECT,
              properties: {
                limitingBelief: { type: Type.STRING },
                distortionType: { type: Type.STRING },
                positiveIntention: { type: Type.STRING },
                sleightOfMouthReframes: {
                  type: Type.OBJECT,
                  properties: {
                    intention: { type: Type.STRING },
                    redefine: { type: Type.STRING },
                    consequence: { type: Type.STRING },
                    chunkDown: { type: Type.STRING },
                    chunkUp: { type: Type.STRING },
                    analogy: { type: Type.STRING },
                    changeFrameSize: { type: Type.STRING },
                    anotherOutcome: { type: Type.STRING },
                    modelOfTheWorld: { type: Type.STRING },
                    hierarchyOfCriteria: { type: Type.STRING },
                    applyToSelf: { type: Type.STRING },
                    metaFrame: { type: Type.STRING },
                  },
                  required: [
                    'intention',
                    'redefine',
                    'consequence',
                    'chunkDown',
                    'chunkUp',
                    'analogy',
                    'changeFrameSize',
                    'anotherOutcome',
                    'modelOfTheWorld',
                    'hierarchyOfCriteria',
                    'applyToSelf',
                    'metaFrame',
                  ],
                },
                liberatingCoreBelief: { type: Type.STRING },
              },
              required: ['limitingBelief', 'distortionType', 'positiveIntention', 'sleightOfMouthReframes', 'liberatingCoreBelief'],
            },
            goalMakersActionPlan: {
              type: Type.OBJECT,
              properties: {
                immediate24hStep: { type: Type.STRING, description: 'Конкретна мікро-дія на найближчі 24 години.' },
                shortTerm7dMilestone: { type: Type.STRING, description: 'Тижневий рубікон дій.' },
                longTerm30dStrategy: { type: Type.STRING, description: '30-денна стратегія закріплення результату.' },
                innerSaboteurDefense: { type: Type.STRING, description: 'Як нейтралізувати внутрішнього дракона/саботера.' },
                resourceAnchor: { type: Type.STRING, description: 'Головне джерело сили та ресурсний якір.' },
              },
              required: ['immediate24hStep', 'shortTerm7dMilestone', 'longTerm30dStrategy', 'innerSaboteurDefense', 'resourceAnchor'],
            },
            coachingQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 потужних трансформаційних відкритих запитання для подальших роздумів.',
            },
            recommendedSmartTools: {
              type: Type.OBJECT,
              description: 'Рекомендації спеціалізованих інструментів, якщо вони критично необхідні для даного запиту.',
              properties: {
                nvcEq: {
                  type: Type.OBJECT,
                  description: 'Ненасильницька комунікація (Маршалл Розенберг) та Емоційний Інтелект (Деніел Ґоулман). Обовʼязково пропонувати, якщо є конфлікти, образа, агресія, труднощі у вираженні потреб або міжособистісне напруження.',
                  properties: {
                    isRecommended: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING, description: 'Чому саме тут необхідні EQ та ННК.' },
                    rosenberg4Steps: {
                      type: Type.OBJECT,
                      properties: {
                        observation: { type: Type.STRING, description: '1. Фактичне спостереження без оцінок' },
                        feeling: { type: Type.STRING, description: '2. Автентичне почуття (EQ)' },
                        need: { type: Type.STRING, description: '3. Глибинна універсальна потреба' },
                        request: { type: Type.STRING, description: '4. Конкретне прохання у стверджувальній формі' },
                      },
                      required: ['observation', 'feeling', 'need', 'request'],
                    },
                    golemanEqTip: { type: Type.STRING, description: 'Практична порада з саморегуляції за Ґоулманом перед розмовою.' },
                  },
                  required: ['isRecommended', 'reason'],
                },
                wheelOfBalance: {
                  type: Type.OBJECT,
                  description: 'Колесо Балансу Життя. Обовʼязково пропонувати при вигоранні, дезорієнтації, перекосі сфер (робота vs сімʼя/здоровʼя), втраті життєвого балансу.',
                  properties: {
                    isRecommended: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING, description: 'Чому тут потрібна діагностика життєвого балансу.' },
                    prioritySphere: { type: Type.STRING, description: 'Провідна сфера дефіциту чи фокусу уваги' },
                    diagnosticInsight: { type: Type.STRING, description: 'Гіпотеза системного дисбалансу.' },
                  },
                  required: ['isRecommended', 'reason'],
                },
                archetypes: {
                  type: Type.OBJECT,
                  properties: {
                    isRecommended: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING },
                    suggestedArchetype: { type: Type.STRING },
                  },
                  required: ['isRecommended', 'reason'],
                },
                beliefPatterning: {
                  type: Type.OBJECT,
                  properties: {
                    isRecommended: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING },
                  },
                  required: ['isRecommended', 'reason'],
                },
              },
            },
          },
          required: ['summary', 'coreDilemma', 'theoreticalInsights', 'therapeuticPerspectives', 'goalMakersActionPlan', 'coachingQuestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in analyze-situation:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: Nonviolent Communication (NVC / Marshall Rosenberg) & Emotional Intelligence (EQ / Daniel Goleman)
app.post('/api/gemini/nvc-eq-transform', async (req: Request, res: Response) => {
  try {
    const { triggerSituation, rawExpression, partnerRole, selectedEmotions, currentNeed } = req.body;

    if (!triggerSituation && !rawExpression) {
      return res.status(400).json({ error: 'Situation or raw expression is required' });
    }

    const systemInstruction = `Ти — світовий експерт з Емоційного Інтелекту (за моделлю Деніела Ґоулмана) та майстер Ненасильницького Спілкування (ННК за методом Маршалла Розенберга).
Твоя місія:
1. Допомогти людині глибоко розпізнати, назвати та прожити свої справжні емоції (Емоційний інтелект: Самосвідомість, Саморегуляція, Емпатія, Соціальні навички).
2. Трансформувати будь-яку токсичну, агресивну, образливу або звинувачувальну думку/претензію («Мова Шакала» — звинувачення, ярлики, вимоги) у серцецентричну, ясну та дієву «Мову Жирафа» (ННК) за 4-кроковою формулою Розенберга:
   - Крок 1. Спостереження (Observation): Тільки нейтральні факти та дії без оцінок, критики та узагальнень на кшталт «ти завжди»/«ти ніколи».
   - Крок 2. Почуття (Feeling / EQ): Точні назви автентичних емоцій (смуток, безпорадність, тривога, страх, втома), уникаючи псевдопочуттів-звинувачень («мене зрадили», «мене ігнорують»).
   - Крок 3. Потреба (Need): Глибинна загальнолюдська потреба (повага, безпека, співпраця, автономія, відпочинок, ясність).
   - Крок 4. Конкретне прохання (Request): Здійсненна, позитивно сформульована дія у теперішньому/найближчому часі без ультиматумів.
3. Сформулювати внутрішній діалог самоспівчуття та емпатичну гіпотезу про почуття й потреби іншої сторони діалогу.

Формат відповіді — строго JSON. Мова — українська.`;

    const prompt = `Виконай повну EQ & ННК трансформацію комунікації:
Ситуація / Тригер: ${triggerSituation || 'Не вказано'}
Початкові слова, претензія чи думка (Мова Шакала): ${rawExpression || 'Не вказано'}
Кому адресовано (роль співрозмовника): ${partnerRole || 'Близька людина / Колега'}
${selectedEmotions?.length ? `Відзначені емоції користувача: ${selectedEmotions.join(', ')}` : ''}
${currentNeed ? `Передбачувана потреба: ${currentNeed}` : ''}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eqAssessment: {
              type: Type.OBJECT,
              properties: {
                recognizedEmotions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Список 2-4 точних автентичних емоцій за Ґоулманом' },
                somaticTrigger: { type: Type.STRING, description: 'Де в тілі та вегетативній системі осідає ця реакція' },
                selfRegulationTip: { type: Type.STRING, description: 'Практична техніка саморегуляції (пауза між тригером і реакцією)' },
                golemanDomain: {
                  type: Type.STRING,
                  enum: ['self_awareness', 'self_regulation', 'empathy', 'social_skills'],
                  description: 'Провідний домен емоційного інтелекту для тренування',
                },
              },
              required: ['recognizedEmotions', 'somaticTrigger', 'selfRegulationTip', 'golemanDomain'],
            },
            nvc4Steps: {
              type: Type.OBJECT,
              properties: {
                observation: { type: Type.STRING, description: '1. Спостереження (Коли я бачу/чую, що...)' },
                feeling: { type: Type.STRING, description: '2. Почуття (Я відчуваю...)' },
                need: { type: Type.STRING, description: '3. Потреба (Оскільки для мене важливо / мені потрібно...)' },
                request: { type: Type.STRING, description: '4. Прохання (Чи готовий ти / Чи міг би ти...)' },
              },
              required: ['observation', 'feeling', 'need', 'request'],
            },
            nvcCompletePhrasing: {
              type: Type.STRING,
              description: 'Цілісна, бездоганно сформульована фраза для виголошення вголос у живій розмові (Мова Жирафа).',
            },
            internalSelfEmpathy: {
              type: Type.STRING,
              description: 'Внутрішня фраза підтримки себе для зниження емоційного накалу перед контактом.',
            },
            empathicGuessForOther: {
              type: Type.STRING,
              description: 'Емпатичне припущення: «Можливо, співрозмовник діє так, тому що сам відчуває [емоція] і потребує [потреба]...»',
            },
          },
          required: ['eqAssessment', 'nvc4Steps', 'nvcCompletePhrasing', 'internalSelfEmpathy', 'empathicGuessForOther'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in nvc-eq-transform:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: Wheel of Balance (Колесо Життєвого Балансу) Analysis
app.post('/api/gemini/wheel-balance-analyze', async (req: Request, res: Response) => {
  try {
    const { spheres, userGoal, title } = req.body;

    if (!spheres || !Array.isArray(spheres) || spheres.length === 0) {
      return res.status(400).json({ error: 'Spheres data is required' });
    }

    const systemInstruction = `Ти — провідний системний коуч, експерт з інтегральної психології та розробник методик життєвого балансу, що об'єднує підходи:
1. Пола Майєра (Paul J. Meyer, концепція Wheel of Life): взаємозв'язок сфер, пошук сфери-важеля («паровоз» змін).
2. Happy Monday (happymonday.ua): фокус на суб'єктивних критеріях «10 з 10», відкидання нав'язаних шаблонів, оцінка стану тут і зараз за останні 1-3 місяці, правило 72 годин для першого мікрокроку.
3. Всеосвіта (vseosvita.ua): коучингові запитання-драйвери («чому не на 1 бал нижче» для пошуку внутрішніх опор та захисту від знецінення; «чого не вистачає до +1..+2 балів» замість перфекціоністського паралічу), аналіз рухливості колеса («чи покотиться воно, чи трястиме на ямах?»).
4. New Leaf (newleaf.ua) & модель балансу Носсрата Пезешкіана: 4 вектори розподілу життєвої енергії (Тіло/Здоров'я, Діяльність/Досягнення, Контакти/Стосунки, Сенси/Майбутнє); виявлення зон витоку ресурсу, психологічних компенсацій (втеча в роботу, втеча в ізоляцію) та вторинних вигод низьких оцінок.

Твоє завдання:
- Провести глибоку інтерпретацію геометрії колеса (рівень тертя, де трястиме, назва форми: напр. «Колючий їжак з розривами», «Перекошений овал трудоголізму», «Компактне, але стабільне колесо»).
- Розрахувати розподіл енергії у % за 4 векторами Пезешкіана (Тіло, Діяльність, Контакти, Сенси).
- Визначити ключову Сферу-Важіль («ефект доміно») та пояснити ланцюгову реакцію: як саме зростання цієї однієї сфери на +1..+2 бали автоматично підніме інші конкретні сфери.
- Сформулювати конкретні рефлексивні запитання-драйвери за методикою Всеосвіта (з індивідуальними відповідями-підказками).
- Надати чіткі рекомендації: дію за правилом 72 годин, SMART-ціль на 30 днів та екологічну межу (від чого свідомо відмовитися, щоб вивільнити час/енергію).

Формат відповіді — строго JSON. Мова — українська.`;

    const prompt = `Проведи вичерпний коучинговий та психологічний аналіз Колеса Життєвого Балансу:
Контекст / Назва: ${title || 'Діагностика життєвого балансу'}
${userGoal ? `Головний фокус / Запит користувача: ${userGoal}` : ''}

Оцінки та коментарі сфер:
${spheres
  .map(
    (s: any) =>
      `- ${s.nameUk || s.name || s.nameEn}: ${s.score}/10 ${
        s.tenPointVision ? `[Бачення 10/10: ${s.tenPointVision}]` : ''
      } ${s.whyNotLower ? `[Чому не нижче: ${s.whyNotLower}]` : ''} ${
        s.whatNeedsForPlusOne ? `[Для +1 бала: ${s.whatNeedsForPlusOne}]` : ''
      } ${s.notes ? `(Коментар: ${s.notes})` : ''}`
  )
  .join('\n')}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            balanceIndex: {
              type: Type.NUMBER,
              description: 'Індекс збалансованості життя у відсотках (від 0 до 100).',
            },
            systemicDiagnosis: {
              type: Type.STRING,
              description: 'Глибокий системний психологічний діагноз поточної конфігурації життя: де витікає ресурс, де надлишок напруги, загальний баланс.',
            },
            primaryDeficitSphere: {
              type: Type.STRING,
              description: 'Сфера з найбільшим дефіцитом уваги, яка створює прихований витік життєвих сил.',
            },
            leverageSphere: {
              type: Type.STRING,
              description: 'Ключова сфера-важіль («паровоз»), покращення якої запустить ефект доміно.',
            },
            hiddenCompensations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 приховані психологічні компенсаторні механізми (напр., трудоголізм як втеча від конфліктів у стосунках).',
            },
            wheelShapeDiagnostic: {
              type: Type.OBJECT,
              properties: {
                shapeName: { type: Type.STRING, description: 'Образна назва форми (напр. «Колючий їжак з піком у карʼєрі», «Перекошений овал»)' },
                rollabilityDescription: { type: Type.STRING, description: 'Опис: чи покотиться таке колесо, на яких ділянках життя виникає максимальна тряска і опір' },
                frictionLevel: { type: Type.STRING, enum: ['low', 'moderate', 'high', 'critical'], description: 'Рівень тертя/опору руху життя' },
              },
              required: ['shapeName', 'rollabilityDescription', 'frictionLevel'],
            },
            peseschkianBalance: {
              type: Type.OBJECT,
              properties: {
                bodyHealthPct: { type: Type.NUMBER, description: 'Відсоток ресурсу в Тілі/Здоровʼї та Відпочинку' },
                achievementCareerPct: { type: Type.NUMBER, description: 'Відсоток ресурсу в Діяльності/Карʼєрі та Фінансах' },
                contactRelationshipsPct: { type: Type.NUMBER, description: 'Відсоток ресурсу в Контактах/Стосунках та Сімʼї' },
                futureMeaningPct: { type: Type.NUMBER, description: 'Відсоток ресурсу в Сенсах/Розвитку та Духовності' },
                interpretation: { type: Type.STRING, description: 'Короткий психологічний висновок щодо балансу цих 4 векторів' },
              },
              required: ['bodyHealthPct', 'achievementCareerPct', 'contactRelationshipsPct', 'futureMeaningPct', 'interpretation'],
            },
            chainReaction: {
              type: Type.OBJECT,
              properties: {
                leverageTarget: { type: Type.STRING, description: 'Назва сфери-важеля' },
                impactedSpheres: { type: Type.ARRAY, items: { type: Type.STRING }, description: '2-4 сфери, які автоматично зростуть слідом' },
                expectedImpact: { type: Type.STRING, description: 'Пояснення ланцюгового ефекту: чому це спрацює' },
              },
              required: ['leverageTarget', 'impactedSpheres', 'expectedImpact'],
            },
            coachingDriveQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: 'Потужне коучингове запитання (за Всеосвітою/HappyMonday)' },
                  answerInsight: { type: Type.STRING, description: 'Глибока рефлексивна відповідь-підказка для даного користувача' },
                },
                required: ['question', 'answerInsight'],
              },
              description: '3 ключові рефлексивні запитання-драйвери для усвідомлення',
            },
            rebalanceActionPlan: {
              type: Type.OBJECT,
              properties: {
                immediateAction: { type: Type.STRING, description: 'Конкретна дія на перші 24-48 годин для сфери-важеля' },
                shortTermPlan: { type: Type.STRING, description: 'Стратегія на найближчі 2-3 тижні' },
                habitToTransform: { type: Type.STRING, description: 'Одна ключова мікро-звичка для щоденного відновлення балансу' },
              },
              required: ['immediateAction', 'shortTermPlan', 'habitToTransform'],
            },
            recommendations: {
              type: Type.OBJECT,
              properties: {
                rule72HoursAction: { type: Type.STRING, description: 'Перша мінімальна дія протягом 72 годин (за правилом Бодо Шефера / HappyMonday)' },
                smart30DaysGoal: { type: Type.STRING, description: 'Чітка SMART-ціль на найближчі 30 днів' },
                ecologicalBoundary: { type: Type.STRING, description: 'Від чого свідомо відмовитися або послабити контроль для вивільнення ресурсу' },
                nextReviewDate: { type: Type.STRING, description: 'Рекомендована дата та періодичність повторного аудиту' },
              },
              required: ['rule72HoursAction', 'smart30DaysGoal', 'ecologicalBoundary', 'nextReviewDate'],
            },
            coachingInsight: {
              type: Type.STRING,
              description: 'Потужне трансформаційне філософське питання чи інсайт для усвідомлення.',
            },
          },
          required: [
            'balanceIndex',
            'systemicDiagnosis',
            'primaryDeficitSphere',
            'leverageSphere',
            'hiddenCompensations',
            'wheelShapeDiagnostic',
            'peseschkianBalance',
            'chainReaction',
            'coachingDriveQuestions',
            'rebalanceActionPlan',
            'recommendations',
            'coachingInsight',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in wheel-balance-analyze:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: 16 Jungian Associations Interpretation
app.post('/api/gemini/interpret-associations', async (req: Request, res: Response) => {
  try {
    const { problemStatement, layer1, layer2, layer3, layer4, layer5 } = req.body;

    const systemInstruction = `Ти — експерт з юнгіанського психоаналізу та проективних методик.
Метод «16 асоціацій» (Піраміда Сабурової/Юнга) занурює з рівня свідомих штампів у глибини підсвідомого:
- Рівень 1 (16 слів): Шар буденності, поверхневі асоціації, стереотипи.
- Рівень 2 (8 слів): Шар розуму, раціональні установки, логічні зв'язки.
- Рівень 3 (4 слова): Шар почуттів, емоційні тригери та переживання.
- Рівень 4 (2 слова): Корінь проблеми, внутрішній вибір або дилема субособистостей.
- Рівень 5 (1 слово): Ключ несвідомого, архетипова першопричина або прихований ресурс.

Проаналізуй заповнену піраміду, розкрий прихований зміст кожного рівня, поясни, як підсвідомість привела до фінального слова-ключа, і дай глибоку трансформаційну рекомендацію.
Формат відповіді — строго JSON. Мова — українська.`;

    const prompt = `Проаналізуй піраміду 16 асоціацій:
Запит/Проблема: ${problemStatement}
Рівень 1 (16 слів): ${layer1.join(', ')}
Рівень 2 (8 слів розуму): ${layer2.join(', ')}
Рівень 3 (4 слова почуттів): ${layer3.join(', ')}
Рівень 4 (2 слова кореня): ${layer4.join(', ')}
Рівень 5 (Фінальне слово-ключ): ${layer5}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Загальний огляд психологічного ландшафту піраміди.' },
            layerMeanings: {
              type: Type.OBJECT,
              properties: {
                level1Everyday: { type: Type.STRING, description: 'Що транслює поверхневий шар буденності.' },
                level2Intellect: { type: Type.STRING, description: 'Які розумові патерни та установки виявлено.' },
                level3Feelings: { type: Type.STRING, description: 'Які глибинні емоції насправді керують станом.' },
                level4Root: { type: Type.STRING, description: 'Смисл двох кореневих слів та їхнього діалогу/протистояння.' },
                level5Key: { type: Type.STRING, description: 'Розшифровка фінального слова як архетипового ключа несвідомого.' },
              },
              required: ['level1Everyday', 'level2Intellect', 'level3Feelings', 'level4Root', 'level5Key'],
            },
            subconsciousInsight: { type: Type.STRING, description: 'Головне приховане послання несвідомого людині.' },
            recommendedAction: { type: Type.STRING, description: 'Практична дія для інтеграції цього інсайту в життя.' },
          },
          required: ['summary', 'layerMeanings', 'subconsciousInsight', 'recommendedAction'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in interpret-associations:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: Descartes Square Decision Analysis
app.post('/api/gemini/cartesian-insights', async (req: Request, res: Response) => {
  try {
    const { dilemma, quadrant1, quadrant2, quadrant3, quadrant4 } = req.body;

    const systemInstruction = `Ти — висококласний коуч зі стратегічного прийняття рішень та аналізу когнітивних пасток.
Квадрат Декарта досліджує 4 аспекти вибору:
1. Що буде, якщо це відбудеться? (+/+)
2. Що буде, якщо це НЕ відбудеться? (+/-)
3. Чого НЕ буде, якщо це відбудеться? (-/+)
4. Чого НЕ буде, якщо це НЕ відбудеться? (-/-)

Проаналізуй заповнені квадранти, знайди приховані сліпі зони, вияви неявні страхи та вторинні вигоди, обчисли коефіцієнт ясності рішення (0-100) та надай зважену коучингову рекомендацію.
Формат відповіді — строго JSON. Мова — українська.`;

    const prompt = `Дилема прийняття рішення: ${dilemma}
Квадрант 1 (Що буде, якщо відбудеться): ${JSON.stringify(quadrant1)}
Квадрант 2 (Що буде, якщо НЕ відбудеться): ${JSON.stringify(quadrant2)}
Квадрант 3 (Чого НЕ буде, якщо відбудеться): ${JSON.stringify(quadrant3)}
Квадрант 4 (Чого НЕ буде, якщо НЕ відбудеться): ${JSON.stringify(quadrant4)}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRecommendation: { type: Type.STRING, description: 'Комплексний підсумок та стратегічний висновок.' },
            clarityScore: { type: Type.INTEGER, description: 'Рівень психологічної готовності та ясності вибору від 0 до 100.' },
            blindSpots: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Сліпі зони, які людина не врахувала.' },
            hiddenFears: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Приховані страхи або вторинні вигоди від нерішучості.' },
            actionGuidance: { type: Type.STRING, description: 'Крок за кроком керівництво для безпечного старту.' },
          },
          required: ['overallRecommendation', 'clarityScore', 'blindSpots', 'hiddenFears', 'actionGuidance'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in cartesian-insights:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: 5 Whys Root Cause Deepening
app.post('/api/gemini/five-whys-deepen', async (req: Request, res: Response) => {
  try {
    const { initialProblem, steps } = req.body;

    const systemInstruction = `Ти — досвідчений психолог-фасилітатор методу «5 Чому».
Твоє завдання — проаналізувати ланцюжок запитань і відповідей, допомогти відрізнити поверхову побутову причину від фундаментального психологічного переконання (кореневої причини), а також запропонувати трансформаційну дію.
Формат відповіді — строго JSON. Мова — українська.`;

    const prompt = `Початкова проблема: ${initialProblem}
Поточні кроки: ${JSON.stringify(steps)}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedNextWhyPrompt: { type: Type.STRING, description: 'Глибоке підказуюче запитання «Чому?» для наступного рівня.' },
            isRootReached: { type: Type.BOOLEAN, description: 'Чи досягнуто вже глибинне базове переконання.' },
            rootCauseInsight: { type: Type.STRING, description: 'Аналіз справжнього кореня проблеми.' },
            transformativeAction: { type: Type.STRING, description: 'Трансформаційна поведінкова дія для розриву цього патерну.' },
          },
          required: ['suggestedNextWhyPrompt', 'isRootReached', 'rootCauseInsight', 'transformativeAction'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in five-whys-deepen:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: CBT Restructure Assistant
app.post('/api/gemini/cbt-restructure', async (req: Request, res: Response) => {
  try {
    const { situation, automaticThought, emotions, bodySensations } = req.body;

    const systemInstruction = `Ти — сертифікований когнітивно-поведінковий терапевт (КПТ).
Проаналізуй ситуацію та автоматичну думку клієнта, визнач конкретні когнітивні спотворення, сформулюй реалістичну альтернативну думку та дизайн простого поведінкового експерименту.
Формат відповіді — строго JSON. Мова — українська.`;

    const prompt = `Ситуація: ${situation}
Автоматична думка: ${automaticThought}
Емоції: ${JSON.stringify(emotions)}
Відчуття в тілі: ${bodySensations}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedDistortions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['name', 'explanation'],
              },
            },
            socraticQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            rationalAlternative: { type: Type.STRING, description: 'Зважена, реалістична і підтримуюча альтернативна думка.' },
            behavioralExperiment: { type: Type.STRING, description: 'Поведінковий експеримент для перевірки реальністю.' },
          },
          required: ['detectedDistortions', 'socraticQuestions', 'rationalAlternative', 'behavioralExperiment'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in cbt-restructure:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: Goal Makers Strategy Generator
app.post('/api/gemini/goal-makers-strategy', async (req: Request, res: Response) => {
  try {
    const { goalTitle, pointA, pointB, resources, saboteurs } = req.body;

    const systemInstruction = `Ти — головний архітектор та майстер коучингової гри «Goal Makers».
Створи захоплюючу стратегічну дорожню карту дій для гравця, розбий шлях на конкретні мікро-квести на 24 години, 7 днів та 30 днів, пропиши зброю проти внутрішніх саботерів та ресурсний ритуал тріумфу.
Формат відповіді — строго JSON. Мова — українська.`;

    const prompt = `Мета гри: ${goalTitle}
Точка А (Поточна реальність): ${pointA}
Точка Б (Бажаний фініш): ${pointB}
Наявні ресурси: ${JSON.stringify(resources)}
Внутрішні саботери (дракони): ${JSON.stringify(saboteurs)}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            heroArchetype: { type: Type.STRING, description: 'Архетип героя в цій подорожі (напр. Дослідник, Творець, Стратег).' },
            saboteurAntidotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  saboteur: { type: Type.STRING },
                  antidoteStrategy: { type: Type.STRING },
                },
                required: ['saboteur', 'antidoteStrategy'],
              },
            },
            quests: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  timeframe: { type: Type.STRING, enum: ['24h', '7d', '30d'] },
                  rewardPoints: { type: Type.INTEGER },
                  notes: { type: Type.STRING },
                },
                required: ['title', 'timeframe', 'rewardPoints'],
              },
            },
            victoryRitual: { type: Type.STRING, description: 'Ритуал святкування перемоги при досягненні точки Б.' },
          },
          required: ['heroArchetype', 'saboteurAntidotes', 'quests', 'victoryRitual'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in goal-makers-strategy:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: AI-Personalized Daily Affirmation tailored to psychological state & context
app.post('/api/gemini/generate-affirmation', async (req: Request, res: Response) => {
  try {
    const { category, userContext, currentMood, lang } = req.body;

    const systemInstruction = `Ти — провідний експерт з психотерапії, нейробіології та екзистенційної психології (КПТ, Стоїцизм, Терапія прийняття та відповідальності ACT, Природний підхід Лінецького, Соматичний коучинг).
Твоє завдання — створити глибоку, реалістичну, науково обґрунтовану щоденну афірмацію-опору, адаптовану під актуальний психологічний стан користувача.

ВАЖЛИВІ ПРАВИЛА:
1. ЖОДНОЇ токсичної позитивності (заборони "все буде ідеально", "ти найкращий у світі", "просто посміхайся").
2. Афірмація має бути формулою внутрішньої сили, прийняття реальності, гідності, соматичного заземлення або сміливої дії у теперішньому моменті.
3. Додай чітке нейробіологічне/психологічне обґрунтування (чому ця думка знижує тривогу / відновлює префронтальний контроль).
4. Обов'язково надай соматичний якір (тілесна дія / подих / жест).
5. Мова відповіді: ${lang === 'en' ? 'англійська' : 'українська'}.
Формат відповіді — строго JSON.`;

    const prompt = `Психологічний стан/категорія: ${category || 'Загальна підтримка'}
Актуальний настрій: ${currentMood || 'Не вказано'}
Особистий контекст користувача (ситуація, думки, тривоги): ${userContext || 'Потребую психологічної опори та ясності на сьогодні'}
Мова: ${lang || 'uk'}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING, description: 'Глибока, ємна формула афірмації від першої особи' },
            authorOrSchool: { type: Type.STRING, description: 'Психологічний підхід або філософська традиція (напр. Стоїцизм & ACT, КПТ Бека, Гештальт)' },
            psychologicalMechanism: { type: Type.STRING, description: 'Нейробіологічний та психологічний механізм дії (2-3 речення)' },
            somaticAnchor: { type: Type.STRING, description: 'Тілесна мікро-практика для закріплення (постава, руки, подих)' },
            reflectionQuestion: { type: Type.STRING, description: 'Глибоке питання для рефлексії в щоденнику' },
            microAction: { type: Type.STRING, description: 'Проста дія на 1-5 хвилин на сьогодні' },
          },
          required: ['quote', 'authorOrSchool', 'psychologicalMechanism', 'somaticAnchor', 'reflectionQuestion', 'microAction'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in generate-affirmation:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: Jungian Archetypes Deep Insight
app.post('/api/gemini/archetypes-deep-insight', async (req: Request, res: Response) => {
  try {
    const { primaryArchetype, secondaryArchetype, shadowArchetype, userContext } = req.body;

    const systemInstruction = `Ти — експерт з глибинної юнгіанської аналітичної психології, міфопоетики та індивідуації.
Твоє завдання — проаналізувати поєднання провідного, допоміжного та тіньового архетипів людини і скласти глибокий, трансформаційний психологічний портрет.
Відповідь повертай СТРОГО у JSON згідно зі схемою. Мова — українська.`;

    const prompt = `Провідний архетип: ${primaryArchetype}
Допоміжний архетип: ${secondaryArchetype}
Тіньовий архетип (Shadow): ${shadowArchetype}
${userContext ? `Контекст ситуації людини: ${userContext}` : ''}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            synthesisTitle: { type: Type.STRING, description: 'Міфопоетична назва архетипового сплаву (напр. «Мудрий Правитель у пошуках Творчого вогню»)' },
            egoStateDiagnosis: { type: Type.STRING, description: 'Діагностика свідомого Его та способів взаємодії зі світом.' },
            shadowIntegrationAdvice: { type: Type.STRING, description: 'Як інтегрувати силу витісненого Тіньового архетипу без шкоди для себе та оточуючих.' },
            archetypalTension: { type: Type.STRING, description: 'Ключовий внутрішній конфлікт між провідним та тіньовим архетипами.' },
            growthActionPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 конкретні дії для виходу на вищий рівень зрілості (Індивідуації).',
            },
          },
          required: ['synthesisTitle', 'egoStateDiagnosis', 'shadowIntegrationAdvice', 'archetypalTension', 'growthActionPlan'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in archetypes-deep-insight:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: Values & Deep Motivation Analysis
app.post('/api/gemini/values-motivation-analyze', async (req: Request, res: Response) => {
  try {
    const { selfDeterminationNeeds, topValues, userSituation } = req.body;

    const systemInstruction = `Ти — експерт з теорії самодетермінації (Едвард Десі та Річард Раян) та теорії базових цінностей Шалома Шварца.
Твоє завдання — продіагностувати рівень задоволеності потреб (Автономія, Компетентність, Зв'язок з іншими), розкрити можливі ціннісні конфлікти та створити план гармонізації внутрішньої мотивації.
Відповідь — строго JSON. Мова — українська.`;

    const prompt = `Потреби за самодетермінацією: Автономія ${selfDeterminationNeeds?.autonomy}/10, Компетентність ${selfDeterminationNeeds?.competence}/10, Спорідненість ${selfDeterminationNeeds?.relatedness}/10.
Топ-цінності: ${JSON.stringify(topValues)}
${userSituation ? `Поточний життєвий контекст: ${userSituation}` : ''}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dominantNeedDiagnosis: { type: Type.STRING, description: 'Діагностика провідного дефіциту чи сильної сторони у базових потребах.' },
            valueConflictAnalysis: { type: Type.STRING, description: 'Виявлення прихованого ціннісного розриву (наприклад, Безпека vs Стимуляція чи Досягнення vs Доброта).' },
            intrinsicVsExtrinsicBalance: { type: Type.STRING, description: 'Оцінка балансу внутрішньої (автентичної) та зовнішньої (навʼязаної) мотивації.' },
            alignmentStrategy: { type: Type.STRING, description: 'Конкретна стратегія узгодження щоденних дій з глибинними цінностями.' },
            weeklyValuesHabits: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 мікро-звички для щоденного живлення виявлених цінностей.',
            },
          },
          required: ['dominantNeedDiagnosis', 'valueConflictAnalysis', 'intrinsicVsExtrinsicBalance', 'alignmentStrategy', 'weeklyValuesHabits'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in values-motivation-analyze:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: Belief Patterning & 14 Sleight of Mouth Reframes
app.post('/api/gemini/belief-patterning-transform', async (req: Request, res: Response) => {
  try {
    const { limitingBelief, sphere, context } = req.body;

    const systemInstruction = `Ти — гросмейстер НЛП та майстер 14 фокусів мови Роберта Ділтса (Sleight of Mouth).
Твоє завдання — деконструювати обмежуюче переконання, виявити його приховану позитивну інтенцію (захисний намір) та створити 12 філігранних трансформаційних рефреймінгів і 1 остаточне визвольне переконання.
Відповідь — строго JSON українською мовою.`;

    const prompt = `Обмежуюче переконання: "${limitingBelief}"
Сфера: ${sphere || 'Життя та реалізація'}
${context ? `Додатковий контекст: ${context}` : ''}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            limitingBelief: { type: Type.STRING },
            distortionType: { type: Type.STRING, description: 'Тип лінгвістичного спотворення (Узагальнення, Причинно-наслідкове, Модальний оператор необхідності тощо)' },
            positiveIntention: { type: Type.STRING, description: 'Глибинний позитивний намір (від чого цей патерн несвідомо захищав людину).' },
            sleightOfMouthReframes: {
              type: Type.OBJECT,
              properties: {
                intention: { type: Type.STRING, description: '1. Намір: сфокусувати увагу на позитивній меті переконання.' },
                redefine: { type: Type.STRING, description: '2. Перевизначення: змінити одне зі слів на інше зі схожим значенням, але іншим відтінком.' },
                consequence: { type: Type.STRING, description: '3. Наслідки: показати, до чого веде утримання цього переконання.' },
                chunkDown: { type: Type.STRING, description: '4. Розділення на частини (дрібніший елемент).' },
                chunkUp: { type: Type.STRING, description: '5. Узагальнення (більш висока категорія).' },
                analogy: { type: Type.STRING, description: '6. Метафора / Аналогія з природи чи іншої сфери.' },
                changeFrameSize: { type: Type.STRING, description: '7. Зміна розміру фрейму (у перспективі 10 років або іншого масштабу).' },
                anotherOutcome: { type: Type.STRING, description: '8. Інший результат: переведення фокусу на більш важливу мету.' },
                modelOfTheWorld: { type: Type.STRING, description: '9. Модель світу: як би на це подивилася інша людина або філософія.' },
                hierarchyOfCriteria: { type: Type.STRING, description: '10. Ієрархія критеріїв: що стоїть вище за це правило.' },
                applyToSelf: { type: Type.STRING, description: '11. Застосування до себе: застосувати критерій переконання до самого ж переконання.' },
                metaFrame: { type: Type.STRING, description: '12. Мета-фрейм: оцінка переконання з позиції спостерігача.' },
              },
              required: [
                'intention',
                'redefine',
                'consequence',
                'chunkDown',
                'chunkUp',
                'analogy',
                'changeFrameSize',
                'anotherOutcome',
                'modelOfTheWorld',
                'hierarchyOfCriteria',
                'applyToSelf',
                'metaFrame',
              ],
            },
            liberatingCoreBelief: { type: Type.STRING, description: 'Остаточне підтримуюче, сильне і мудре переконання.' },
          },
          required: ['limitingBelief', 'distortionType', 'positiveIntention', 'sleightOfMouthReframes', 'liberatingCoreBelief'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in belief-patterning-transform:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: Dilts Neurological Levels Detailed Analysis
app.post('/api/gemini/dilts-levels-analyze', async (req: Request, res: Response) => {
  try {
    const { problemStatement, goalStatement } = req.body;

    const systemInstruction = `Ти — майстер системного коучингу за Нейрологічними рівнями Роберта Ділтса (Environment, Behavior, Capabilities, Beliefs/Values, Identity, Mission).
Твоє завдання — проаналізувати затик клієнта на кожному з 6 рівнів, визначити на якому саме рівні застрягла проблема та на якому вищому рівні знаходиться ключ до її системного вирішення.
Відповідь — строго JSON українською мовою.`;

    const prompt = `Опис проблеми/запиту: ${problemStatement}
${goalStatement ? `Бажана мета: ${goalStatement}` : ''}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            environment: {
              type: Type.OBJECT,
              properties: { description: { type: Type.STRING }, problemManifestation: { type: Type.STRING } },
              required: ['description', 'problemManifestation'],
            },
            behavior: {
              type: Type.OBJECT,
              properties: { description: { type: Type.STRING }, problemManifestation: { type: Type.STRING } },
              required: ['description', 'problemManifestation'],
            },
            capabilities: {
              type: Type.OBJECT,
              properties: { description: { type: Type.STRING }, problemManifestation: { type: Type.STRING } },
              required: ['description', 'problemManifestation'],
            },
            beliefsAndValues: {
              type: Type.OBJECT,
              properties: { description: { type: Type.STRING }, problemManifestation: { type: Type.STRING } },
              required: ['description', 'problemManifestation'],
            },
            identity: {
              type: Type.OBJECT,
              properties: { description: { type: Type.STRING }, problemManifestation: { type: Type.STRING } },
              required: ['description', 'problemManifestation'],
            },
            missionAndPurpose: {
              type: Type.OBJECT,
              properties: { description: { type: Type.STRING }, problemManifestation: { type: Type.STRING } },
              required: ['description', 'problemManifestation'],
            },
            identifiedProblemLevel: { type: Type.INTEGER },
            identifiedProblemLevelName: { type: Type.STRING },
            recommendedSolutionLevel: { type: Type.INTEGER },
            recommendedSolutionLevelName: { type: Type.STRING },
            solutionShiftGuidance: { type: Type.STRING },
          },
          required: [
            'environment',
            'behavior',
            'capabilities',
            'beliefsAndValues',
            'identity',
            'missionAndPurpose',
            'identifiedProblemLevel',
            'identifiedProblemLevelName',
            'recommendedSolutionLevel',
            'recommendedSolutionLevelName',
            'solutionShiftGuidance',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in dilts-levels-analyze:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: Self-Learning Adaptation Engine
app.post('/api/gemini/self-learning-adapt', async (req: Request, res: Response) => {
  try {
    const { feedbacks, currentSettings } = req.body;

    const systemInstruction = `Ти — мета-когнітивний алгоритм самонавчання ШІ-навігатора.
Твоє завдання — проаналізувати масив зворотного зв'язку від користувачів і сформувати набір скоригованих системних настанов для поліпшення наступних відповідей.
Формат відповіді — строго JSON. Мова — українська.`;

    const prompt = `Зворотний зв'язок користувачів: ${JSON.stringify(feedbacks || [])}
Поточні налаштування: ${JSON.stringify(currentSettings || {})}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysisSummary: { type: Type.STRING, description: 'Синтез головних паттернів задоволеності та точок зростання.' },
            learnedToneAdjustments: { type: Type.ARRAY, items: { type: Type.STRING } },
            updatedPromptDirectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            coachingFocusEvolution: { type: Type.STRING },
          },
          required: ['analysisSummary', 'learnedToneAdjustments', 'updatedPromptDirectives', 'coachingFocusEvolution'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in self-learning-adapt:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: Hundred Wishes Analysis (Практика 100 бажань)
app.post('/api/gemini/hundred-wishes-analyze', async (req: Request, res: Response) => {
  try {
    const { wishes } = req.body;

    const systemInstruction = `Ти — досвідчений коуч вищого рангу (ICF Master Coach) та глибинний психолог.
Твоє завдання — проаналізувати список із практики «100 бажань» користувача.
Методологічна основа:
1. Теорія трьох шарів бажань:
   - 1-30: Соціально обумовлені, поверхневі («треба», речі, тренди, очікування соціуму).
   - 31-70: Особистісні, дорослі зрілі прагнення (навички, комфорт, проєкти, стосунки).
   - 71-100: Глибинні, дитячі, істинні та сміливі мрії («Внутрішня дитина», прихована творчість, трансформація).
2. 5 життєвих векторів:
   - Матеріальне (Have)
   - Досвід та подорожі (Experience)
   - Навички, тіло та саморозвиток (Do / Be)
   - Стосунки та здоров'я (Relationships / Health)
   - Внесок, творчість та сенси (Give / Contribute)
3. Енергетичний потенціал (бажання з високим зарядом 8-10 балів).

Вияви перекоси (наприклад, надлишок матеріального без досвіду, або відсутність турботи про тіло), розкрий приховані психологічні теми та виділи найпотужніші бажання для негайного втілення. Тон — надихаючий, проникливий, підтримуючий, без оцінювання.
Відповідь повертай строго у форматі JSON згідно з наданою схемою. Мова — українська.`;

    const prompt = `Проаналізуй цей список бажань користувача:
${JSON.stringify(wishes || [])}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Загальний психологічний зріз та аналіз стану мрійника.' },
            balanceByCategory: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  percentage: { type: Type.NUMBER },
                  coachComment: { type: Type.STRING },
                },
                required: ['category', 'percentage', 'coachComment'],
              },
            },
            dominantLayerInsight: { type: Type.STRING, description: 'Аналіз прориву крізь внутрішнього цензора за 3 шарами.' },
            topHighEnergyPicks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                },
                required: ['number', 'text', 'rationale'],
              },
            },
            hiddenThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            coachingRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'summary',
            'balanceByCategory',
            'dominantLayerInsight',
            'topHighEnergyPicks',
            'hiddenThemes',
            'coachingRecommendations',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in hundred-wishes-analyze:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: Self-Reflection Analysis (Саморефлексія)
app.post('/api/gemini/self-reflection-analyze', async (req: Request, res: Response) => {
  try {
    const { method, energyScore, moodScore, primaryEmotions, content } = req.body;

    const systemInstruction = `Ти — чуйний, висококваліфікований психотерапевт і супервізор саморефлексії.
Людина щойно заповнила протокол рефлексії (метод: ${method}).
Твоя місія:
1. Надати безумовне емпатичне дзеркало (валідація почуттів без жодного знецінення).
2. Захистити людину від «румінації» (токсичного пережовування провини та самобичування), перевівши фокус у конструктивне усвідомлення.
3. Виявити можливі когнітивні пастки (наприклад: катастрофізація, мислення «все або нічого», надмірне взяття провини на себе) і запропонувати м'який рефреймінг.
4. Сформулювати одну маленьку підтримуючу мікро-дію або теплий намір на завтра.

Тон — турботливий, надійний, мудрий, без сухого академізму. Мова — українська.
Повертай відповідь СТРОГО у форматі JSON згідно з наданою схемою.`;

    const prompt = `Дані саморефлексії користувача:
Метод: ${method}
Рівень енергії (1-10): ${energyScore}
Рівень настрою (1-10): ${moodScore}
Домінуючі емоції: ${(primaryEmotions || []).join(', ')}
Зміст запису:
${JSON.stringify(content || {})}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Глибоке та тепле резюме досвіду людини.' },
            supportiveValidation: { type: Type.STRING, description: 'Валідація почуттів та нормалізація пережитого.' },
            cognitiveTrapDetector: { type: Type.STRING, description: 'Виявлення та корекція румінацій чи когнітивних пасток.' },
            resourceReframe: { type: Type.STRING, description: 'Ресурсне переосмислення ситуації.' },
            actionStepForTomorrow: { type: Type.STRING, description: 'Конкретний, дуже легкий та реалістичний мікрокрок на завтра.' },
          },
          required: [
            'summary',
            'supportiveValidation',
            'cognitiveTrapDetector',
            'resourceReframe',
            'actionStepForTomorrow',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in self-reflection-analyze:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: SMART Goal Audit (Цілі по SMART + WOOP + If-Then)
app.post('/api/gemini/smart-goal-audit', async (req: Request, res: Response) => {
  try {
    const goalData = req.body;

    const systemInstruction = `Ти — провідний експерт з постановки та досягнення цілей, що поєднує:
1. Методику SMART (Specific, Measurable, Achievable, Relevant, Time-bound).
2. Науково доведений метод ментального контрастингу WOOP (Wish, Outcome, Obstacle, Plan) дослідниці Габріеле Еттінген (NYU).
3. Наміри щодо реалізації (Implementation Intentions: плани «Якщо ..., то ...») професора Пітера Голлвітцера.
4. Анти-цілі (екологічні обмеження: що НЕ робити, аби не вигоріти).

Твоє завдання — провести аудит сформульованої цілі:
- Оцінити ступінь готовності та чіткості від 0 до 100%.
- Виявити сильні сторони та вразливі місця (чи не розмиті критерії вимірюваності, чи реалістичний дедлайн).
- Проаналізувати внутрішню перешкоду у WOOP (чи це справжня психологічна перешкода — наприклад, страх оцінки або прокрастинація, а не просто брак часу).
- Запропонувати 1-2 високоефективні підсилюючі If-Then конструкції.
- Дати коучингові запитання на перевірку істинності.

Тон — партнерський, конструктивний, підтримуючий та професійний. Мова — українська.
Повертай відповідь СТРОГО у форматі JSON згідно з наданою схемою.`;

    const prompt = `Проведи глибокий аудит наступної цілі:
${JSON.stringify(goalData || {})}`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            smartScore: { type: Type.NUMBER, description: 'Оцінка зрілості та чіткості мети (0-100).' },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Сильні сторони формулювання.' },
            vulnerabilities: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Слабкі місця або сліпі зони.' },
            coachQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: '2-3 провокативні коучингові питання для перевірки.' },
            boostRecommendation: { type: Type.STRING, description: 'Головна порада для підвищення шансів на успіх.' },
          },
          required: ['smartScore', 'strengths', 'vulnerabilities', 'coachQuestions', 'boostRecommendation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in smart-goal-audit:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: Pre-Mortem (Премортем Гері Кляйна: аналіз повного краху з майбутнього)
app.post('/api/gemini/pre-mortem', async (req: Request, res: Response) => {
  try {
    const { plan, expertRole, horizonMonths, contextNotes, lang } = req.body;

    if (!plan || typeof plan !== 'string' || !plan.trim()) {
      return res.status(400).json({ error: 'План є обов’язковим полем для аналізу Премортем' });
    }

    const language = lang === 'en' ? 'English' : lang === 'ru' ? 'Russian' : 'Ukrainian';
    const horizon = horizonMonths || 6;
    const persona = expertRole && expertRole.trim() ? expertRole.trim() : 'Безкомпромісний антикризовий стратег та профільний експерт ринку';

    const systemInstruction = `Ти — світовий експерт з управління ризиками та авторської методології «Премортем» (Pre-Mortem) когнітивного психолога Гері Кляйна.

ТВОЯ ЕКСПЕРТНА РОЛЬ У ЦЬОМУ ДІАЛОЗІ: ${persona}.
ГОВОРИ ВІД ІМЕНІ ЦІЄЇ РОЛІ з максимальним рівнем експертної глибини, специфічного сленгу, математики, механіки ринку та психології поведінки.

МЕТОДОЛОГІЧНА ПЕРЕДУМОВА ПРЕМОРТЕМ:
Пройшло рівно ${horizon} місяців від сьогодні. План користувача зазнав ТОТАЛЬНОГО, КАТАСТРОФІЧНОГО КРАХУ. Всі гроші або час злито, ресурси вичерпано, мети не досягнуто. Цей крах — доконаний факт майбутнього.

ЗАЛІЗНІ ПРАВИЛА ТВОЄЇ ВІДПОВІДІ (СТРОГО):
1. НІКОЛИ НЕ ЗАСПАКОЮЙ КОРИСТУВАЧА. Жодних фраз на кшталт «все буде добре», «це цінний досвід», «ви на правильному шляху».
2. НІЯКИХ ЗАГАЛЬНИХ РЕКОМЕНДАЦІЙ ЧИ ВОДИ («треба дисципліна», «треба диверсифікація»). Тільки конкретні механізми: slippage, funding rate, black swan, overconfidence bias, market regime shift, counterparty risk, margin call, customer churn, margin squeeze тощо.
3. ПОТРІБНА «РОЗТЯЖКА», А НЕ «ВІДЧУТТЯ»! Кожен сигнал має бути вимірюваним фактом (цифра, метрика, співвідношення, зафіксована подія), а не абстрактним відчуттям.
4. ЯКЩО У ПЛАНУ Є ТОТАЛЬНИЙ ІЗ'ЯН (fatal flaw) — СКАЖИ ПРО ЦЕ ПРЯМО ТА ХІРУРГІЧНО ВІДВЕРТО.
5. МОВА: ${language}.
6. ВІДПОВІДЬ СТРОГО У JSON за заданою схемою.

СТРУКТУРНІ БЛОКИ:
- failureCauses: РІВНО 7 імовірних детальних причин краху. Для кожної:
  * number: від 1 до 7
  * title: коротка пронизлива назва провалу
  * mechanism: детальний опис ланцюжка подій і чому це сталося
  * earlyWarningSignal: 1 вимірюваний цифровий/фактичний показник (метрика, відсоток, співвідношення, не відчуття!), що це починає відбуватися
  * checkWeek: точний номер тижня від 1 до ${horizon * 4}, коли користувач ЗОБОВ'ЯЗАНИЙ це перевірити
- firstEarlyRedFlag: найперший тривожний сигнал, який з'явився ще на перших тижнях і який проігнорували
- monthlyChronicle: щомісячна хроніка розпаду за всі ${horizon} місяців (Місяць 1 по ${horizon}): що відбувалося і яка саме критична деталь призвела до наступної стадії катастрофи
- mostDangerousFailure: який із 7 провалів НАЙНЕБЕЗПЕЧНІШИЙ, чому саме він смертельний для проєкту і чим він принципово відрізняється від інших 6
- biggestHiddenAssumption: найбільше приховане хибне допущення, яке користувач зробив несвідомо і сприйняв як аксіому; відверта правда та діагноз фатального дефекту плану
- revisedAntiFragilePlan: переписаний бронебійний план, де КОЖЕН із 7 провалів закритий контрзаходом. Що конкретно змінити і чому.
- killSwitchChecklist: 3-5 пунктів передстартової перевірки (Kill-Switch Checklist). Що обов'язково перевірити ДО будь-яких витрат/запусків, і який ТОЧНИЙ РЕЗУЛЬТАТ означає: «НЕГАЙНО ВІДМОВИТИСЯ ВІД ПЛАНУ НАЗАВЖДИ»
- adversaryPerspective: зіграй персону, яка найбільше виграє від краху плану (маркетмейкер, арбітражер, жорсткий конкурент, рекрутер або опонент). Що ця сторона зробить у тиждень твого запуску, і який прихований хід користувач би ніколи не помітив сам.`;

    const prompt = `Проведи сесію Премортем (Pre-Mortem) для наступного плану:
ПЛАН КОРИСТУВАЧА:
"${plan}"

ГОРИЗОНТ ЧАСУ: ${horizon} місяців (проєкт вже повністю розбився вщент).
РОЛЬ ЕКСПЕРТА: ${persona}
${contextNotes ? `ДОДАТКОВИЙ КОНТЕКСТ / РЕСУРСИ: ${contextNotes}` : ''}

Надай детальний, хірургічно жорсткий аналіз краху за всіма 7 сценаріями, хронікою розпаду, поглядом конкурента та бронебійним переписаним планом.`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.8-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            failureCauses: {
              type: Type.ARRAY,
              description: 'Рівно 7 детальних сценаріїв краху',
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  mechanism: { type: Type.STRING },
                  earlyWarningSignal: { type: Type.STRING, description: '1 вимірюваний цифровий/фактичний показник (метрика, факт)' },
                  checkWeek: { type: Type.NUMBER, description: 'Точний тиждень аудиту' },
                },
                required: ['number', 'title', 'mechanism', 'earlyWarningSignal', 'checkWeek'],
              },
            },
            firstEarlyRedFlag: { type: Type.STRING, description: 'Найперший тривожний сигнал' },
            monthlyChronicle: {
              type: Type.ARRAY,
              description: 'Хроніка розпаду помісячно',
              items: {
                type: Type.OBJECT,
                properties: {
                  month: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  whatHappened: { type: Type.STRING },
                  destructiveDetail: { type: Type.STRING },
                },
                required: ['month', 'title', 'whatHappened', 'destructiveDetail'],
              },
            },
            mostDangerousFailure: {
              type: Type.OBJECT,
              properties: {
                causeNumber: { type: Type.NUMBER },
                title: { type: Type.STRING },
                whyDeadliest: { type: Type.STRING },
                fundamentalDifference: { type: Type.STRING },
              },
              required: ['causeNumber', 'title', 'whyDeadliest', 'fundamentalDifference'],
            },
            biggestHiddenAssumption: {
              type: Type.OBJECT,
              properties: {
                assumption: { type: Type.STRING },
                brutalTruth: { type: Type.STRING },
                fatalFlawDiagnosis: { type: Type.STRING },
              },
              required: ['assumption', 'brutalTruth', 'fatalFlawDiagnosis'],
            },
            revisedAntiFragilePlan: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                concreteSteps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      causeNumber: { type: Type.NUMBER },
                      originalVulnerability: { type: Type.STRING },
                      revisedAction: { type: Type.STRING },
                      whyRationale: { type: Type.STRING },
                    },
                    required: ['causeNumber', 'originalVulnerability', 'revisedAction', 'whyRationale'],
                  },
                },
                newRulesOfEngagement: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['summary', 'concreteSteps', 'newRulesOfEngagement'],
            },
            killSwitchChecklist: {
              type: Type.ARRAY,
              description: '3-5 критичних пунктів перед запуском із критерієм повної відмови',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  checkItem: { type: Type.STRING },
                  killThreshold: { type: Type.STRING },
                },
                required: ['id', 'checkItem', 'killThreshold'],
              },
            },
            adversaryPerspective: {
              type: Type.OBJECT,
              properties: {
                persona: { type: Type.STRING },
                launchWeekTrap: { type: Type.STRING },
                invisibleStrike: { type: Type.STRING },
              },
              required: ['persona', 'launchWeekTrap', 'invisibleStrike'],
            },
          },
          required: [
            'failureCauses',
            'firstEarlyRedFlag',
            'monthlyChronicle',
            'mostDangerousFailure',
            'biggestHiddenAssumption',
            'revisedAntiFragilePlan',
            'killSwitchChecklist',
            'adversaryPerspective',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in pre-mortem:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// Endpoint: Action Guide & Step-by-Step Execution Protocol
app.post('/api/gemini/action-guide', async (req: Request, res: Response) => {
  try {
    const { actionText, timeframe, situation, lang } = req.body;

    if (!actionText) {
      return res.status(400).json({ error: 'Action text is required' });
    }

    const language = lang === 'en' ? 'English' : lang === 'ru' ? 'Russian' : 'Ukrainian';

    const systemInstruction = `Ти — експертний супервізор, психолог та коуч-методолог.
Твоє завдання — створити гранично чіткий, зрозумілий та дієвий покроковий алгоритм виконання рекомендованої практики чи дії.
Пиши мовою: ${language}. Уникай абстрактних порад; давай чіткі інструкції "Крок 1, Крок 2, Крок 3" з часовими рамками та тілесними/поведінковими маркерами.
Повертай відповідь СТРОГО у форматі JSON згідно зі схемою.`;

    const prompt = `Створи покрокове керівництво для виконання наступної практики / завдання:
Дія / Практика: "${actionText}"
Часовий горизонт: ${timeframe || 'загальний'}
${situation ? `Контекст життєвої ситуації користувача: "${situation}"` : ''}

Надай чіткі практичні кроки, поясни психологічний механізм дії, підкажи, як подолати можливий внутрішній саботаж, та сформулюй критерій успішного завершення.`;

    const response = await generateWithRetryAndFallback({
      preferredModel: 'gemini-3.7-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            psychologicalMechanism: { type: Type.STRING },
            stepByStepProtocol: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  timeEstimate: { type: Type.STRING },
                },
                required: ['stepNumber', 'title', 'description', 'timeEstimate'],
              },
            },
            sabotageTrapAndAntidote: { type: Type.STRING },
            completionCheck: { type: Type.STRING },
            recommendedToolHints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'title',
            'psychologicalMechanism',
            'stepByStepProtocol',
            'sabotageTrapAndAntidote',
            'completionCheck',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in action-guide:', error);
    const msg = cleanErrorMessage(error);
    res.status(500).json({ error: msg });
  }
});

// ==========================================
// TELEMETRY & GOOGLE SHEETS SYNC SYSTEM
// (Protected for owner pilnikoff@gmail.com)
// ==========================================

interface TelemetryUser {
  id: string;
  login: string;
  name: string;
  fullName: string;
  email?: string;
  birthDate?: string;
  fieldOfActivity?: string;
  authProvider: string;
  registeredAt: string;
  lastLoginAt: string;
  ip?: string;
  userAgent?: string;
}

interface TelemetryActivity {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  tab: string;
  toolName: string;
  querySummary: string;
  category?: string;
}

interface TelemetryStore {
  googleSheetsWebhookUrl: string;
  googleSheetViewUrl: string;
  users: TelemetryUser[];
  activities: TelemetryActivity[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'telemetry.json');

let telemetryStore: TelemetryStore = {
  googleSheetsWebhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL || '',
  googleSheetViewUrl: '',
  users: [],
  activities: [],
};

// Load saved data if exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    telemetryStore = {
      ...telemetryStore,
      ...parsed,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
    };
  }
} catch (e) {
  console.warn('[Telemetry] Error initializing data file:', e);
}

function saveTelemetryStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(telemetryStore, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Telemetry] Error saving data file:', e);
  }
}

// Forward data to Google Sheets Webhook asynchronously
async function forwardToGoogleSheets(payload: any) {
  const webhook = telemetryStore.googleSheetsWebhookUrl;
  if (!webhook || !webhook.trim().startsWith('http')) {
    return;
  }
  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log(`[Google Sheets Webhook] Synced payload (${payload.type}), response status: ${res.status}`);
  } catch (err) {
    console.warn('[Google Sheets Webhook] Sync notice:', err);
  }
}

// Endpoint 1: Register or update user
app.post('/api/telemetry/user-registration', async (req: Request, res: Response) => {
  try {
    const { id, login, name, fullName, email, birthDate, fieldOfActivity, authProvider, registeredAt } = req.body;
    
    const effectiveName = fullName || name;
    if (!login || !effectiveName) {
      return res.status(400).json({ error: 'Логін та імʼя є обовʼязковими' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const existingIndex = telemetryStore.users.findIndex((u) => u.login === login || (email && u.email === email));

    const userObj: TelemetryUser = {
      id: id || `user_${Date.now()}`,
      login: String(login).trim(),
      name: String(effectiveName).trim(),
      fullName: String(effectiveName).trim(),
      email: email ? String(email).trim() : undefined,
      birthDate: birthDate ? String(birthDate).trim() : undefined,
      fieldOfActivity: fieldOfActivity ? String(fieldOfActivity).trim() : undefined,
      authProvider: authProvider || 'local',
      registeredAt: registeredAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      ip: String(ip),
      userAgent: String(userAgent),
    };

    if (existingIndex >= 0) {
      telemetryStore.users[existingIndex] = {
        ...telemetryStore.users[existingIndex],
        ...userObj,
        lastLoginAt: new Date().toISOString(),
      };
    } else {
      telemetryStore.users.unshift(userObj);
    }

    saveTelemetryStore();

    // Push to owner's Google Sheet
    forwardToGoogleSheets({
      type: 'user_registration',
      ...userObj,
    });

    res.json({ success: true, user: userObj, googleSheetConnected: !!telemetryStore.googleSheetsWebhookUrl });
  } catch (err: any) {
    console.error('Error in user-registration telemetry:', err);
    res.status(500).json({ error: cleanErrorMessage(err) });
  }
});

// Endpoint 2: Log user activity
app.post('/api/telemetry/user-activity', async (req: Request, res: Response) => {
  try {
    const { userId, userName, userEmail, tab, toolName, querySummary, category } = req.body;
    
    const act: TelemetryActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName: userName || 'Гість',
      userEmail,
      tab: tab || 'general',
      toolName: toolName || 'Action',
      querySummary: String(querySummary || '').slice(0, 300),
      category,
    };

    telemetryStore.activities.unshift(act);
    if (telemetryStore.activities.length > 3000) {
      telemetryStore.activities = telemetryStore.activities.slice(0, 3000);
    }

    saveTelemetryStore();

    // Push activity to Google Sheet
    forwardToGoogleSheets({
      type: 'user_activity',
      ...act,
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: cleanErrorMessage(err) });
  }
});

// Endpoint 3: Admin summary (restricted to pilnikoff@gmail.com / pilnikoff)
app.get('/api/telemetry/admin-summary', (req: Request, res: Response) => {
  const adminEmail = (req.query.adminEmail as string || req.headers['x-admin-email'] as string || '').toLowerCase().trim();
  const adminLogin = (req.query.adminLogin as string || req.headers['x-admin-login'] as string || '').toLowerCase().trim();

  const isOwner = adminEmail === 'pilnikoff@gmail.com' || adminLogin === 'pilnikoff';
  if (!isOwner) {
    return res.status(403).json({ error: 'Доступ лише для власника (pilnikoff@gmail.com)' });
  }

  res.json({
    totalUsers: telemetryStore.users.length,
    totalActivities: telemetryStore.activities.length,
    googleSheetsWebhookUrl: telemetryStore.googleSheetsWebhookUrl,
    googleSheetViewUrl: telemetryStore.googleSheetViewUrl,
    users: telemetryStore.users,
    recentActivities: telemetryStore.activities.slice(0, 50),
  });
});

// Endpoint 4: Admin configures Google Sheet Webhook or View URL
app.post('/api/telemetry/config-google-sheet', (req: Request, res: Response) => {
  const { adminEmail, adminLogin, webhookUrl, sheetViewUrl } = req.body;
  const isOwner = (adminEmail || '').toLowerCase().trim() === 'pilnikoff@gmail.com' || (adminLogin || '').toLowerCase().trim() === 'pilnikoff';
  
  if (!isOwner) {
    return res.status(403).json({ error: 'Доступ лише для власника (pilnikoff@gmail.com)' });
  }

  if (typeof webhookUrl === 'string') {
    telemetryStore.googleSheetsWebhookUrl = webhookUrl.trim();
  }
  if (typeof sheetViewUrl === 'string') {
    telemetryStore.googleSheetViewUrl = sheetViewUrl.trim();
  }

  saveTelemetryStore();
  res.json({
    success: true,
    googleSheetsWebhookUrl: telemetryStore.googleSheetsWebhookUrl,
    googleSheetViewUrl: telemetryStore.googleSheetViewUrl,
  });
});

// Endpoint 5: Export users as CSV (with UTF-8 BOM for Google Sheets / Excel)
app.get('/api/telemetry/export-users-csv', (req: Request, res: Response) => {
  const adminEmail = (req.query.adminEmail as string || '').toLowerCase().trim();
  const adminLogin = (req.query.adminLogin as string || '').toLowerCase().trim();

  const isOwner = adminEmail === 'pilnikoff@gmail.com' || adminLogin === 'pilnikoff';
  if (!isOwner) {
    return res.status(403).json({ error: 'Доступ лише для власника (pilnikoff@gmail.com)' });
  }

  const headers = ['ID', 'Дата реєстрації', 'Логін', 'Повне імʼя', 'Google Email', 'Дата народження', 'Сфера діяльності', 'Авторизація', 'Останній візит'];
  const rows = telemetryStore.users.map((u) => [
    `"${u.id}"`,
    `"${new Date(u.registeredAt).toLocaleString('uk-UA')}"`,
    `"${(u.login || '').replace(/"/g, '""')}"`,
    `"${(u.fullName || u.name || '').replace(/"/g, '""')}"`,
    `"${(u.email || '').replace(/"/g, '""')}"`,
    `"${(u.birthDate || '').replace(/"/g, '""')}"`,
    `"${(u.fieldOfActivity || '').replace(/"/g, '""')}"`,
    `"${(u.authProvider || '').replace(/"/g, '""')}"`,
    `"${new Date(u.lastLoginAt).toLocaleString('uk-UA')}"`,
  ]);

  const csv = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=navigator_users_${Date.now()}.csv`);
  res.send(csv);
});

// Endpoint 6: Export activity logs as CSV
app.get('/api/telemetry/export-logs-csv', (req: Request, res: Response) => {
  const adminEmail = (req.query.adminEmail as string || '').toLowerCase().trim();
  const adminLogin = (req.query.adminLogin as string || '').toLowerCase().trim();

  const isOwner = adminEmail === 'pilnikoff@gmail.com' || adminLogin === 'pilnikoff';
  if (!isOwner) {
    return res.status(403).json({ error: 'Доступ лише для власника (pilnikoff@gmail.com)' });
  }

  const headers = ['ID', 'Час', 'Користувач', 'Email', 'Розділ', 'Інструмент', 'Зміст запиту', 'Категорія'];
  const rows = telemetryStore.activities.map((a) => [
    `"${a.id}"`,
    `"${new Date(a.timestamp).toLocaleString('uk-UA')}"`,
    `"${(a.userName || '').replace(/"/g, '""')}"`,
    `"${(a.userEmail || '').replace(/"/g, '""')}"`,
    `"${(a.tab || '').replace(/"/g, '""')}"`,
    `"${(a.toolName || '').replace(/"/g, '""')}"`,
    `"${(a.querySummary || '').replace(/"/g, '""')}"`,
    `"${(a.category || '').replace(/"/g, '""')}"`,
  ]);

  const csv = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=navigator_activity_logs_${Date.now()}.csv`);
  res.send(csv);
});

// ==========================================
// Multi-Device Cloud Sync Endpoints
// (Enables cross-device synchronization between phone, laptop, and PC via Google Account)
// ==========================================
const SYNC_DATA_DIR = path.join(process.cwd(), 'data', 'user_sync');
if (!fs.existsSync(SYNC_DATA_DIR)) {
  try {
    fs.mkdirSync(SYNC_DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create sync directory', e);
  }
}

function getSyncFilePath(key: string): string {
  const sanitized = key.toLowerCase().replace(/[^a-z0-9_@-]/g, '_');
  return path.join(SYNC_DATA_DIR, `${sanitized}.json`);
}

// 1. Push user data from client to cloud server
app.post('/api/sync/push', (req: Request, res: Response) => {
  try {
    const { email, login, userId, profile, journalEntries, clientTimestamp } = req.body;
    const syncKey = (email || login || userId || '').trim().toLowerCase();

    if (!syncKey) {
      return res.status(400).json({ error: 'User identifier (email, login, or ID) is required for sync' });
    }

    const filePath = getSyncFilePath(syncKey);
    let existingData: any = { journalEntries: [], profile: null, updatedAt: null };

    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (err) {
        console.warn('Error reading existing sync file, overwriting', err);
      }
    }

    // Merge journal entries by ID without duplicates, keeping latest date
    const clientEntries: any[] = Array.isArray(journalEntries) ? journalEntries : [];
    const serverEntries: any[] = Array.isArray(existingData.journalEntries) ? existingData.journalEntries : [];

    const entryMap = new Map<string, any>();
    // First populate from server
    for (const e of serverEntries) {
      if (e && e.id) entryMap.set(e.id, e);
    }
    // Then merge client entries
    for (const e of clientEntries) {
      if (e && e.id) {
        entryMap.set(e.id, e);
      }
    }

    const mergedEntries = Array.from(entryMap.values()).sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );

    const mergedProfile = profile || existingData.profile;
    const now = new Date().toISOString();

    const recordToSave = {
      syncKey,
      profile: mergedProfile,
      journalEntries: mergedEntries,
      updatedAt: now,
      clientTimestamp: clientTimestamp || now,
    };

    fs.writeFileSync(filePath, JSON.stringify(recordToSave, null, 2), 'utf-8');

    res.json({
      success: true,
      count: mergedEntries.length,
      profile: mergedProfile,
      journalEntries: mergedEntries,
      lastSynced: now,
    });
  } catch (err: any) {
    console.error('Failed to process cloud sync push', err);
    res.status(500).json({ error: cleanErrorMessage(err) });
  }
});

// 2. Pull user data from cloud server to client
app.post('/api/sync/pull', (req: Request, res: Response) => {
  try {
    const { email, login, userId } = req.body;
    const syncKey = (email || login || userId || '').trim().toLowerCase();

    if (!syncKey) {
      return res.status(400).json({ error: 'User identifier (email, login, or ID) is required' });
    }

    const filePath = getSyncFilePath(syncKey);

    if (!fs.existsSync(filePath)) {
      return res.json({
        success: true,
        found: false,
        journalEntries: [],
        profile: null,
        message: 'No previous cloud records found for this account',
      });
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);

    res.json({
      success: true,
      found: true,
      journalEntries: parsed.journalEntries || [],
      profile: parsed.profile || null,
      lastSynced: parsed.updatedAt || new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Failed to process cloud sync pull', err);
    res.status(500).json({ error: cleanErrorMessage(err) });
  }
});

async function setupServer() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.argv[1]?.includes('dist') ||
    process.argv[1]?.endsWith('.cjs');

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const isHmrDisabled = process.env.DISABLE_HMR === 'true';
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: isHmrDisabled ? false : undefined,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite dev middleware initialization notice:', err);
      const distPath = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req: Request, res: Response) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Psychological Navigator & Goal Makers server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
