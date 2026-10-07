import { get } from './request'
import type { ClickStatsVO } from '@/types/stats'

/**
 * 查询单短链当日点击概览 GET /stats/links/{shortCode}
 * @param date 格式 "yyyy-MM-dd"，不传默认当天；后端不允许未来日期
 */
export function getClickOverview(shortCode: string, date?: string): Promise<ClickStatsVO> {
  return get(`/stats/links/${shortCode}`, { params: { date } })
}
