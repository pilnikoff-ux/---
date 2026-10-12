import { AiReflectionPrompt, TelegramReflectionSettings, UserProfile } from '../types';
import { getUserProfile, updateTelegramSettings } from './userStatsService';

export interface GeneratePromptParams {
  type?: 'morning' | 'evening';
  date?: string;
  userName?: string;
  lang?: 'ua' | 'ru' | 'en';
  moodOrTheme?: string;
}

export interface TelegramSendResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

/**
 * Request AI to generate a 5-part structured reflection prompt:
 * 1. Greeting (🌿 Доброго ранку! / 🌙 Доброго вечора!)
 * 2. Question of the day/evening (💭 Питання дня / вечора)
 * 3. Micro-task (🎯 Маленьке завдання)
 * 4. Daily reminder (💚 Нагадування дня)
 * 5. Wish from AI (☀️ / ✨ Побажання від ШІ)
 */
export async function generateAiReflectionPrompt(
  params: GeneratePromptParams = {}
): Promise<AiReflectionPrompt> {
  const profile = getUserProfile();
  const today = new Date();
  const dateFormatted = today.toLocaleDateString(
    params.lang === 'ru' ? 'ru-RU' : params.lang === 'en' ? 'en-US' : 'uk-UA',
    { weekday: 'long', day: 'numeric', month: 'long' }
  );

  const payload = {
    type: params.type || 'morning',
    date: params.date || dateFormatted,
    userName: params.userName || profile?.name || '',
    lang: params.lang || 'ua',
    moodOrTheme: params.moodOrTheme || '',
  };

  try {
    const res = await fetch('/api/gemini/generate-reflection-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const json = await res.json();
    if (json.success && json.data) {
      const data = json.data;
      return {
        id: `prompt-${Date.now()}`,
        type: payload.type as 'morning' | 'evening',
        greeting: data.greeting,
        questionTitle: data.questionTitle || (payload.type === 'morning' ? 'Питання дня' : 'Питання вечора'),
        question: data.question,
        microTask: data.microTask,
        reminder: data.reminder,
        wishes: data.wishes,
        fullFormattedText: data.fullFormattedText,
        createdAt: new Date().toISOString(),
      };
    }
    throw new Error('Invalid response structure');
  } catch (err) {
    console.warn('Fallback to local psychological reflection prompt:', err);
    // Beautiful default fallback matching user's exact specification
    const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
    const isMorning = payload.type === 'morning';

    if (payload.lang === 'en') {
      return {
        id: `prompt-${Date.now()}`,
        type: payload.type as 'morning' | 'evening',
        greeting: isMorning
          ? `🌿 Good morning! ${capitalizedDate}.`
          : `🌙 Good evening! ${capitalizedDate}.`,
        questionTitle: isMorning ? 'Question of the day' : 'Question of the evening',
        question: isMorning
          ? 'What has recently sparked my sincere curiosity and desire to act, even when no one expects anything from me?'
          : 'What was the warmest micro-moment today that truly nourished my inner calm?',
        microTask: isMorning
          ? 'Dedicate 10 minutes today to whatever inspires you: music, art, walking, or a novel curiosity. Do it purely for joy, not for output.'
          : 'Pause for 5 minutes, let your shoulders drop, and express gentle gratitude to your body for carrying you through the day.',
        reminder: isMorning
          ? 'Not everything useful has to be productive. Joy, wonder, and leisure are vital sources of human vitality.'
          : 'Rest is not a reward you earn; it is a fundamental biological requirement for regeneration.',
        wishes: isMorning
          ? 'May today have room not just for tasks, but for living!'
          : 'Wishing you deep serenity, ease, and restorative rest tonight!',
        fullFormattedText: isMorning
          ? `🌿 Good morning! ${capitalizedDate}.\n\n💭 Question of the day:\nWhat has recently sparked my sincere curiosity and desire to act, even when no one expects anything from me?\n\n🎯 Micro-task:\nDedicate 10 minutes today to whatever inspires you: music, art, walking, or a novel curiosity. Do it purely for joy, not for output.\n\n💚 Daily reminder:\nNot everything useful has to be productive. Joy, wonder, and leisure are vital sources of human vitality.\n\n☀️ May today have room not just for tasks, but for living!`
          : `🌙 Good evening! ${capitalizedDate}.\n\n💭 Question of the evening:\nWhat was the warmest micro-moment today that truly nourished my inner calm?\n\n🎯 Micro-task:\nPause for 5 minutes, let your shoulders drop, and express gentle gratitude to your body for carrying you through the day.\n\n💚 Daily reminder:\nRest is not a reward you earn; it is a fundamental biological requirement for regeneration.\n\n✨ Wishing you deep serenity, ease, and restorative rest tonight!`,
        createdAt: new Date().toISOString(),
      };
    }

    if (payload.lang === 'ru') {
      return {
        id: `prompt-${Date.now()}`,
        type: payload.type as 'morning' | 'evening',
        greeting: isMorning
          ? `🌿 Доброе утро! ${capitalizedDate}.`
          : `🌙 Добрый вечер! ${capitalizedDate}.`,
        questionTitle: isMorning ? 'Вопрос дня' : 'Вопрос вечера',
        question: isMorning
          ? 'Что в последнее время вызывает у меня искренний интерес и желание действовать, даже когда никто ничего от меня не ждет?'
          : 'Какой момент сегодняшнего дня оставил самое теплое и спокойное послевкусие в теле и мыслях?',
        microTask: isMorning
          ? 'Сегодня уделите 10 минут тому, что вас вдохновляет: музыке, творчеству, прогулке или новому увлечению. Делайте это не ради результата, а ради удовольствия. Заметьте, как изменилось настроение.'
          : 'Сделайте медленный глубокий вдох-выдох, отпустите напряжение с челюсти и плеч. Поблагодарите себя за 3 любые мелочи сегодняшнего дня.',
        reminder: isMorning
          ? 'Не все полезное должно быть продуктивным. Радость, любопытство и удовольствие — тоже важнейшие источники энергии.'
          : 'Отдых — это не награда за усталость, а естественное право вашего организма на восстановление.',
        wishes: isMorning
          ? 'Пусть сегодня найдется время не только для дел, но и для самой жизни!'
          : 'Спокойного, теплого и восстанавливающего вам вечера!',
        fullFormattedText: isMorning
          ? `🌿 Доброе утро! ${capitalizedDate}.\n\n💭 Вопрос дня:\nЧто в последнее время вызывает у меня искренний интерес и желание действовать, даже когда никто ничего от меня не ждет?\n\n🎯 Маленькое задание:\nСегодня уделите 10 минут тому, что вас вдохновляет: музыке, творчеству, прогулке или новому увлечению. Делайте это не ради результата, а ради удовольствия. Заметьте, как изменилось настроение.\n\n💚 Напоминание дня:\nНе все полезное должно быть продуктивным. Радость, любопытство и удовольствие — тоже важнейшие источники энергии.\n\n☀️ Пусть сегодня найдется время не только для дел, но и для самой жизни!`
          : `🌙 Добрый вечер! ${capitalizedDate}.\n\n💭 Вопрос вечера:\nКакой момент сегодняшнего дня оставил самое теплое и спокойное послевкусие в теле и мыслях?\n\n🎯 Маленькое задание:\nСделайте медленный глубокий вдох-выдох, отпустите напряжение с челюсти и плеч. Поблагодарите себя за 3 любые мелочи сегодняшнего дня.\n\n💚 Напоминание дня:\nОтдых — это не награда за усталость, а естественное право вашего организма на восстановление.\n\n✨ Спокойного, теплого и восстанавливающего вам вечера!`,
        createdAt: new Date().toISOString(),
      };
    }

    // Default Ukrainian
    return {
      id: `prompt-${Date.now()}`,
      type: payload.type as 'morning' | 'evening',
      greeting: isMorning
        ? `🌿 Доброго ранку! ${capitalizedDate}.`
        : `🌙 Доброго вечора! ${capitalizedDate}.`,
      questionTitle: isMorning ? 'Питання дня' : 'Питання вечора',
      question: isMorning
        ? 'Що останнім часом викликає в мене щиру цікавість і бажання діяти, навіть коли ніхто нічого від мене не очікує?'
        : 'Який теплий момент або внутрішнє усвідомлення сьогодні принесли найбільше спокою?',
      microTask: isMorning
        ? 'Сьогодні приділи 10 хвилин тому, що тебе надихає: музиці, творчості, прогулянці або новому захопленню. Роби це не заради результату, а просто для задоволення. Після цього поміть, чи змінився твій настрій.'
        : 'Зроби 3 повільних глибоких вдихи, опусти плечі та подумки подякуй собі за зусилля, які ти доклав(ла) сьогодні.',
      reminder: isMorning
        ? 'Не все корисне має бути продуктивним. Радість, цікавість і задоволення — теж важливі джерела енергії.'
        : 'Відпочинок — це не винагорода, яку потрібно заслужити виснаженням, а фундамент твого ресурсу.',
      wishes: isMorning
        ? 'Нехай сьогодні знайдеться час не лише для справ, а й для життя!'
        : 'Затишного, спокійного та відновлюючого тобі вечора!',
      fullFormattedText: isMorning
        ? `🌿 Доброго ранку! ${capitalizedDate}.\n\n💭 Питання дня:\nЩо останнім часом викликає в мене щиру цікавість і бажання діяти, навіть коли ніхто нічого від мене не очікує?\n\n🎯 Маленьке завдання:\nСьогодні приділи 10 хвилин тому, що тебе надихає: музиці, творчості, прогулянці або новому захопленню.\nРоби це не заради результату, а просто для задоволення. Після цього поміть, чи змінився твій настрій.\n\n💚 Нагадування дня:\nНе все корисне має бути продуктивним. Радість, цікавість і задоволення — теж важливі джерела енергії.\n\n☀️ Нехай сьогодні знайдеться час не лише для справ, а й для життя!`
        : `🌙 Доброго вечора! ${capitalizedDate}.\n\n💭 Питання вечора:\nЯкий теплий момент або внутрішнє усвідомлення сьогодні принесли найбільше спокою?\n\n🎯 Маленьке завдання:\nЗроби 3 повільних глибоких вдихи, опусти плечі та подумки подякуй собі за зусилля, які ти доклав(ла) сьогодні.\n\n💚 Нагадування дня:\nВідпочинок — це не винагорода, яку потрібно заслужити виснаженням, а фундамент твого ресурсу.\n\n✨ Затишного, спокійного та відновлюючого тобі вечора!`,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Send reflection text to user's Telegram Chat
 */
export async function sendTelegramMessage(
  chatId: string,
  message: string,
  botToken?: string
): Promise<TelegramSendResult> {
  if (!chatId || !chatId.trim()) {
    return {
      success: false,
      error: 'Вкажіть Telegram Chat ID або username у налаштуваннях.',
    };
  }

  try {
    const res = await fetch('/api/telegram/send-reflection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: chatId.trim(),
        message,
        botToken: botToken?.trim() || undefined,
      }),
    });

    const json = await res.json();
    if (json.success) {
      return { success: true, messageId: json.messageId };
    }
    return {
      success: false,
      error: json.error || 'Не вдалося надіслати повідомлення у Telegram.',
    };
  } catch (err: any) {
    console.error('Error in sendTelegramMessage:', err);
    return {
      success: false,
      error: 'Помилка звʼязку із сервером надсилання Telegram.',
    };
  }
}

/**
 * Check if today's scheduled reflection needs to be sent to Telegram, and send if due
 */
export async function checkAndSendAutoTelegramReflection(
  profile?: UserProfile | null
): Promise<{ sent: boolean; type?: 'morning' | 'evening'; error?: string }> {
  const user = profile || getUserProfile();
  if (!user || !user.telegramSettings) {
    return { sent: false };
  }

  const {
    enabled,
    telegramChatId,
    telegramUsername,
    morningEnabled,
    eveningEnabled,
    botToken,
    lastSentMorningDate,
    lastSentEveningDate,
  } = user.telegramSettings;

  const targetId = (telegramChatId || telegramUsername || '').trim();
  if (!enabled || !targetId) {
    return { sent: false };
  }

  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const currentHour = new Date().getHours();

  // Check morning reflection: 06:00 to 14:00
  if (morningEnabled && lastSentMorningDate !== todayStr && currentHour >= 6 && currentHour < 15) {
    try {
      const prompt = await generateAiReflectionPrompt({ type: 'morning', userName: user.name });
      const sendRes = await sendTelegramMessage(targetId, prompt.fullFormattedText, botToken);
      if (sendRes.success) {
        updateTelegramSettings({ lastSentMorningDate: todayStr });
        return { sent: true, type: 'morning' };
      }
      return { sent: false, error: sendRes.error };
    } catch (e: any) {
      return { sent: false, error: e.message };
    }
  }

  // Check evening reflection: 18:00 to 23:59 or 00:00 to 03:00
  if (eveningEnabled && lastSentEveningDate !== todayStr && (currentHour >= 18 || currentHour < 3)) {
    try {
      const prompt = await generateAiReflectionPrompt({ type: 'evening', userName: user.name });
      const sendRes = await sendTelegramMessage(targetId, prompt.fullFormattedText, botToken);
      if (sendRes.success) {
        updateTelegramSettings({ lastSentEveningDate: todayStr });
        return { sent: true, type: 'evening' };
      }
      return { sent: false, error: sendRes.error };
    } catch (e: any) {
      return { sent: false, error: e.message };
    }
  }

  return { sent: false };
}
