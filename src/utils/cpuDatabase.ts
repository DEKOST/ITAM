// База данных процессоров с их поколениями и оценками устаревания
// Чем выше оценка - тем более устарел процессор

interface CPUInfo {
  generation: string;
  year: number;
  score: number; // Баллы устаревания (0-50)
  tier: 'modern' | 'recent' | 'aging' | 'old' | 'ancient';
}

// Intel Core i3/i5/i7/i9 по поколениям
const intelCoreGenerations: Record<number, { year: number; score: number }> = {
  1: { year: 2010, score: 45 }, // Nehalem/Westmere
  2: { year: 2011, score: 42 }, // Sandy Bridge
  3: { year: 2012, score: 40 }, // Ivy Bridge
  4: { year: 2013, score: 38 }, // Haswell
  5: { year: 2014, score: 35 }, // Broadwell
  6: { year: 2015, score: 32 }, // Skylake
  7: { year: 2017, score: 28 }, // Kaby Lake
  8: { year: 2017, score: 25 }, // Coffee Lake
  9: { year: 2018, score: 22 }, // Coffee Lake Refresh
  10: { year: 2019, score: 18 }, // Comet Lake
  11: { year: 2020, score: 15 }, // Rocket Lake
  12: { year: 2021, score: 10 }, // Alder Lake
  13: { year: 2022, score: 5 },  // Raptor Lake
  14: { year: 2023, score: 2 },  // Raptor Lake Refresh
  15: { year: 2024, score: 0 },  // Arrow Lake
};

// Intel Pentium/Celeron по поколениям
const intelPentiumCeleronGenerations: Record<number, { year: number; score: number }> = {
  1: { year: 2010, score: 48 },
  2: { year: 2011, score: 46 },
  3: { year: 2012, score: 44 },
  4: { year: 2013, score: 42 },
  5: { year: 2014, score: 40 },
  6: { year: 2015, score: 38 },
  7: { year: 2017, score: 35 },
  8: { year: 2017, score: 32 },
  9: { year: 2018, score: 28 },
  10: { year: 2019, score: 25 },
};

// AMD Ryzen по поколениям
const amdRyzenGenerations: Record<number, { year: number; score: number }> = {
  1: { year: 2017, score: 30 }, // Zen
  2: { year: 2018, score: 25 }, // Zen+
  3: { year: 2019, score: 20 }, // Zen 2
  4: { year: 2020, score: 15 }, // Zen 3
  5: { year: 2022, score: 10 }, // Zen 3+
  6: { year: 2022, score: 8 },  // Zen 4
  7: { year: 2023, score: 5 },  // Zen 4
  8: { year: 2024, score: 2 },  // Zen 5
};

// AMD Athlon/A-series (старые)
const amdLegacyGenerations: Record<string, { year: number; score: number }> = {
  'athlon': { year: 2018, score: 35 }, // Athlon 200GE/220GE (Zen)
  'a-series': { year: 2011, score: 45 }, // A-series APU
  'fx': { year: 2011, score: 48 }, // FX series
};

/**
 * Определяет поколение Intel Core процессора
 * @param cpuName - Название процессора (например, "i3-12100", "i5-10400")
 */
function parseIntelCoreGeneration(cpuName: string): number | null {
  const match = cpuName.match(/i[3579]-(\d{1,2})\d{3}/i);
  if (match) {
    const gen = parseInt(match[1]);
    return gen >= 1 && gen <= 15 ? gen : null;
  }
  return null;
}

/**
 * Определяет поколение Intel Pentium/Celeron
 * @param cpuName - Название процессора (например, "Pentium G4560", "Celeron E1200")
 */
function parseIntelPentiumCeleronGeneration(cpuName: string): number | null {
  // Pentium/Celeron с буквой G (современные)
  const matchG = cpuName.match(/(?:pentium|celeron)\s*g(\d{4})/i);
  if (matchG) {
    const model = parseInt(matchG[1]);
    if (model >= 4000) return 7; // 7-е поколение и выше
    if (model >= 3000) return 6;
    if (model >= 2000) return 5;
    if (model >= 1000) return 4;
  }
  
  // Старые Pentium/Celeron с буквой E
  const matchE = cpuName.match(/(?:pentium|celeron)\s*e(\d{4})/i);
  if (matchE) {
    return 1; // Очень старые (Core 2 Duo era)
  }
  
  return null;
}

/**
 * Определяет поколение AMD Ryzen
 * @param cpuName - Название процессора (например, "Ryzen 5 3600", "Ryzen 7 5800X")
 */
function parseAMDRyzenGeneration(cpuName: string): number | null {
  const match = cpuName.match(/ryzen\s*\S*\s*(\d)\d{3}/i);
  if (match) {
    const gen = parseInt(match[1]);
    return gen >= 1 && gen <= 8 ? gen : null;
  }
  return null;
}

/**
 * Определяет тип AMD legacy процессора
 * @param cpuName - Название процессора
 */
function parseAMDLegacyType(cpuName: string): string | null {
  const lower = cpuName.toLowerCase();
  if (lower.includes('athlon')) return 'athlon';
  if (lower.includes('a-series') || lower.match(/a\d{2,4}/)) return 'a-series';
  if (lower.includes('fx-')) return 'fx';
  return null;
}

/**
 * Оценивает процессор и возвращает информацию о нём
 * @param cpuName - Название процессора
 */
export function evaluateCPU(cpuName: string): CPUInfo | null {
  if (!cpuName || cpuName.trim() === '') {
    return null;
  }

  const cpu = cpuName.trim();

  // Intel Core i3/i5/i7/i9
  const intelCoreGen = parseIntelCoreGeneration(cpu);
  if (intelCoreGen !== null) {
    const info = intelCoreGenerations[intelCoreGen];
    if (info) {
      return {
        generation: `Intel Core ${intelCoreGen}-е поколение`,
        year: info.year,
        score: info.score,
        tier: getTier(info.score)
      };
    }
  }

  // Intel Pentium/Celeron
  const intelPCGen = parseIntelPentiumCeleronGeneration(cpu);
  if (intelPCGen !== null) {
    const info = intelPentiumCeleronGenerations[intelPCGen];
    if (info) {
      return {
        generation: `Intel Pentium/Celeron ${intelPCGen}-е поколение`,
        year: info.year,
        score: info.score,
        tier: getTier(info.score)
      };
    }
  }

  // AMD Ryzen
  const amdRyzenGen = parseAMDRyzenGeneration(cpu);
  if (amdRyzenGen !== null) {
    const info = amdRyzenGenerations[amdRyzenGen];
    if (info) {
      return {
        generation: `AMD Ryzen ${amdRyzenGen}-е поколение`,
        year: info.year,
        score: info.score,
        tier: getTier(info.score)
      };
    }
  }

  // AMD Legacy (Athlon, A-series, FX)
  const amdLegacyType = parseAMDLegacyType(cpu);
  if (amdLegacyType) {
    const info = amdLegacyGenerations[amdLegacyType];
    if (info) {
      return {
        generation: `AMD ${amdLegacyType.toUpperCase()}`,
        year: info.year,
        score: info.score,
        tier: getTier(info.score)
      };
    }
  }

  // Если процессор не распознан, возвращаем среднюю оценку
  return {
    generation: 'Неизвестный процессор',
    year: 2015,
    score: 25,
    tier: 'aging'
  };
}

/**
 * Определяет категорию устаревания по баллам
 */
function getTier(score: number): 'modern' | 'recent' | 'aging' | 'old' | 'ancient' {
  if (score <= 5) return 'modern';
  if (score <= 15) return 'recent';
  if (score <= 25) return 'aging';
  if (score <= 40) return 'old';
  return 'ancient';
}

/**
 * Получает цвет для категории процессора
 */
export function getCPUBadgeColor(tier: CPUInfo['tier']): string {
  switch (tier) {
    case 'modern': return 'bg-green-100 text-green-800';
    case 'recent': return 'bg-blue-100 text-blue-800';
    case 'aging': return 'bg-yellow-100 text-yellow-800';
    case 'old': return 'bg-orange-100 text-orange-800';
    case 'ancient': return 'bg-red-100 text-red-800';
  }
}

/**
 * Получает текст для категории процессора
 */
export function getCPUBadgeText(tier: CPUInfo['tier']): string {
  switch (tier) {
    case 'modern': return 'Современный';
    case 'recent': return 'Недавний';
    case 'aging': return 'Устаревающий';
    case 'old': return 'Устаревший';
    case 'ancient': return 'Древний';
  }
}
