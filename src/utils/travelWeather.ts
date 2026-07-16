import { rollD20 } from '@/utils/dice'

export interface TravelWeatherResult {
  roll: number
  weather: string
  effect: string
}

// 规则书 1.5.6 的通用天气表（按项目当前阶段做统一版）
export function rollTravelWeather(): TravelWeatherResult {
  const roll = rollD20()
  if (roll === 1) {
    return { roll, weather: '极端恶劣天气', effect: '移动速度减半，远程相关判定劣势。' }
  }
  if (roll <= 4) {
    return { roll, weather: '阴雨/风雪', effect: '移动速度 -25%，视野下降。' }
  }
  if (roll <= 10) {
    return { roll, weather: '多云', effect: '无额外修正。' }
  }
  if (roll <= 17) {
    return { roll, weather: '晴朗', effect: '无额外修正。' }
  }
  if (roll <= 19) {
    return { roll, weather: '微风舒适', effect: '顺风旅行，移动效率略有提升。' }
  }
  return { roll, weather: '天象赐福', effect: '当日关键检定叙事上视作有利态势。' }
}

export function formatTravelWeatherMessage(result: TravelWeatherResult): string {
  return `【旅行天气】1d20=${result.roll} → ${result.weather}\n效果：${result.effect}`
}
