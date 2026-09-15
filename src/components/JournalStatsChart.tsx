import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Flame,
  CalendarCheck,
  BarChart2,
  PieChart as PieChartIcon,
  Sparkles,
} from 'lucide-react';
import { JournalEntry } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface JournalStatsChartProps {
  entries: JournalEntry[];
}

export const JournalStatsChart: React.FC<JournalStatsChartProps> = ({ entries }) => {
  const { lang, theme } = useThemeLanguage();
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const isDark = theme === 'dark';

  // Generate data for the past 7 days (including today)
  const chartData = useMemo(() => {
    const days: {
      dateKey: string;
      label: string;
      fullDate: string;
      total: number;
      consilium: number;
      associations16: number;
      descartes: number;
      fiveWhys: number;
      cbt: number;
      nvcEq: number;
      wheelOfBalance: number;
      goalMakers: number;
    }[] = [];

    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD

      const dayName = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'uk-UA', {
        weekday: 'short',
      });
      const dayNum = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'uk-UA', {
        day: 'numeric',
        month: 'short',
      });

      days.push({
        dateKey,
        label: `${dayName}, ${dayNum}`,
        fullDate: d.toLocaleDateString(lang === 'en' ? 'en-US' : 'uk-UA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        total: 0,
        consilium: 0,
        associations16: 0,
        descartes: 0,
        fiveWhys: 0,
        cbt: 0,
        nvcEq: 0,
        wheelOfBalance: 0,
        goalMakers: 0,
      });
    }

    // Populate counts from actual entries
    entries.forEach((entry) => {
      if (!entry.date) return;
      const entryDateKey = new Date(entry.date).toISOString().slice(0, 10);
      const targetDay = days.find((day) => day.dateKey === entryDateKey);
      if (targetDay) {
        targetDay.total += 1;
        if (entry.type === 'consilium') targetDay.consilium += 1;
        else if (entry.type === 'associations16') targetDay.associations16 += 1;
        else if (entry.type === 'descartes') targetDay.descartes += 1;
        else if (entry.type === 'fiveWhys') targetDay.fiveWhys += 1;
        else if (entry.type === 'cbt') targetDay.cbt += 1;
        else if (entry.type === 'nvcEq') targetDay.nvcEq += 1;
        else if (entry.type === 'wheelOfBalance') targetDay.wheelOfBalance += 1;
        else if (entry.type === 'goalMakers') targetDay.goalMakers += 1;
      }
    });

    return days;
  }, [entries, lang]);

  // Derived statistics
  const total7Days = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.total, 0);
  }, [chartData]);

  const peakDay = useMemo(() => {
    let max = -1;
    let peak = chartData[0];
    chartData.forEach((day) => {
      if (day.total > max) {
        max = day.total;
        peak = day;
      }
    });
    return max > 0 ? peak : null;
  }, [chartData]);

  const activeDaysCount = useMemo(() => {
    return chartData.filter((d) => d.total > 0).length;
  }, [chartData]);

  // Calculate current streak
  const streak = useMemo(() => {
    let currentStreak = 0;
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].total > 0) {
        currentStreak++;
      } else {
        // If today has 0, but yesterday had >0, we can still count streak ending yesterday or reset
        if (i === chartData.length - 1) {
          continue;
        }
        break;
      }
    }
    return currentStreak;
  }, [chartData]);

  // Practice type labels & colors
  const practiceTypes = [
    { key: 'consilium', label: lang === 'en' ? 'Consilium' : 'Консиліум', color: '#14b8a6' },
    { key: 'nvcEq', label: lang === 'en' ? 'NVC & EQ' : 'ННК & EQ', color: '#8b5cf6' },
    { key: 'wheelOfBalance', label: lang === 'en' ? 'Wheel of Balance' : 'Колесо Балансу', color: '#10b981' },
    { key: 'associations16', label: lang === 'en' ? '16 Associations' : '16 Асоціацій', color: '#a855f7' },
    { key: 'cbt', label: lang === 'en' ? 'CBT Journal' : 'КПТ Щоденник', color: '#3b82f6' },
    { key: 'descartes', label: lang === 'en' ? 'Descartes Square' : 'Квадрат Декарта', color: '#0ea5e9' },
    { key: 'fiveWhys', label: lang === 'en' ? '5 Whys' : '5 Чому', color: '#f59e0b' },
    { key: 'goalMakers', label: lang === 'en' ? 'Hero\'s Goal' : 'Мета Героя', color: '#ec4899' },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-3.5 shadow-xl text-xs space-y-2 min-w-[190px]">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-1.5 font-bold text-stone-800 dark:text-stone-100 flex items-center justify-between">
            <span>{data.fullDate}</span>
            <span className="rounded-full bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 px-2 py-0.5 text-[10px] font-mono">
              {data.total} {lang === 'en' ? 'practices' : 'практик'}
            </span>
          </div>

          <div className="space-y-1">
            {practiceTypes.map((pt) => {
              const val = data[pt.key] || 0;
              if (val === 0 && chartType === 'area') return null;
              return (
                <div key={pt.key} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: pt.color }}
                    />
                    <span className="text-stone-600 dark:text-stone-400">{pt.label}:</span>
                  </div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200 font-mono">
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="journal-stats-visualization"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 p-4 sm:p-6 shadow-sm space-y-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-400">
            <Activity className="h-3.5 w-3.5" />
            {lang === 'en' ? '7-Day Practice Analytics' : 'Аналітика практик за останні 7 днів'}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 font-serif">
            {lang === 'en' ? 'Psychological Self-Care Rhythm' : 'Динаміка психологічної саморегуляції'}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {lang === 'en'
              ? 'Visualization of completed sessions, tests, and cognitive exercises.'
              : 'Візуалізація кількості завершених сесій, тестів та когнітивних практик.'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              chartType === 'area'
                ? 'bg-white dark:bg-stone-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{lang === 'en' ? 'Trend Area' : 'Трендова крива'}</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              chartType === 'bar'
                ? 'bg-white dark:bg-stone-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>{lang === 'en' ? 'Categories' : 'По категоріях'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block">
            {lang === 'en' ? 'Total (7 days)' : 'Всього за 7 днів'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400">
              {total7Days}
            </span>
            <span className="text-[11px] text-stone-500">
              {lang === 'en' ? 'practices' : 'практик'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block">
            {lang === 'en' ? 'Active Days' : 'Активних днів'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {activeDaysCount}
            </span>
            <span className="text-[11px] text-stone-500">/ 7 днів</span>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block">
            {lang === 'en' ? 'Current Streak' : 'Поточна серія'}
          </span>
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-amber-500" />
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {streak}
            </span>
            <span className="text-[11px] text-stone-500">
              {lang === 'en' ? 'days' : 'днів поспіль'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block">
            {lang === 'en' ? 'Peak Activity Day' : 'Піковий день'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate">
              {peakDay ? peakDay.label : (lang === 'en' ? 'No records' : 'Немає записів')}
            </span>
            {peakDay && (
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-mono font-bold">
                ({peakDay.total})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={isDark ? 0.45 : 0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConsilium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={isDark ? 0.3 : 0.2} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#292524' : '#e7e5e4'}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: isDark ? '#a8a29e' : '#78716c', fontSize: 11 }}
                axisLine={{ stroke: isDark ? '#44403c' : '#d6d3d1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: isDark ? '#a8a29e' : '#78716c', fontSize: 11 }}
                axisLine={{ stroke: isDark ? '#44403c' : '#d6d3d1' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                name={lang === 'en' ? 'Total Practices' : 'Всього практик'}
                stroke="#14b8a6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTotal)"
                activeDot={{ r: 6, fill: '#14b8a6', stroke: isDark ? '#1c1917' : '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#292524' : '#e7e5e4'}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: isDark ? '#a8a29e' : '#78716c', fontSize: 11 }}
                axisLine={{ stroke: isDark ? '#44403c' : '#d6d3d1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: isDark ? '#a8a29e' : '#78716c', fontSize: 11 }}
                axisLine={{ stroke: isDark ? '#44403c' : '#d6d3d1' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => <span className="text-stone-600 dark:text-stone-300">{value}</span>}
              />
              <Bar dataKey="consilium" name={lang === 'en' ? 'Consilium' : 'Консиліум'} stackId="a" fill="#14b8a6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="nvcEq" name={lang === 'en' ? 'NVC & EQ' : 'ННК & EQ'} stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="wheelOfBalance" name={lang === 'en' ? 'Wheel' : 'Колесо'} stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="associations16" name={lang === 'en' ? '16 Assoc.' : '16 Асоціацій'} stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} />
              <Bar dataKey="cbt" name={lang === 'en' ? 'CBT' : 'КПТ'} stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="descartes" name={lang === 'en' ? 'Descartes' : 'Декарт'} stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
              <Bar dataKey="fiveWhys" name={lang === 'en' ? '5 Whys' : '5 Чому'} stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="goalMakers" name={lang === 'en' ? 'Hero\'s Goal' : 'Мета Героя'} stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Practice Legend Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-stone-200 dark:border-stone-800/80">
        {practiceTypes.map((pt) => (
          <div
            key={pt.key}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-2.5 py-1 text-[11px] text-stone-600 dark:text-stone-300"
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pt.color }} />
            <span>{pt.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
