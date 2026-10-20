import { get } from './request'
import type {
  AccountStatsVO,
  ClickLogPageVO,
  ClickLogQueryParams,
  ClickStatsVO,
  TopLinkVO,
  TrendVO,
} from '@/types/stats'

/**
 * 查询单短链当日点击概览 GET /stats/links/{shortCode}
 * @param date 格式 "yyyy-MM-dd"，不传默认当天；后端不允许未来日期
 */
export function getClickOverview(shortCode: string, date?: string): Promise<ClickStatsVO> {
  return get(`/stats/links/${shortCode}`, { params: { date } })
}

/**
 * 点击日志查询 GET /stats/clicks
 * 游标分页：首页不传 cursor，后续页传上一页返回的 nextCursor
 */
export function searchClickLogs(params: ClickLogQueryParams): Promise<ClickLogPageVO> {
  return get('/stats/clicks', { params })
}

/** 账户级汇总 GET /stats/summary（短链总数 / 今日与累计 PV、UV） */
export function getAccountSummary(): Promise<AccountStatsVO> {
  return get('/stats/summary')
}

/** 近 7 天点击趋势 GET /stats/trend（天数由后端固定，无需传参） */
export function getTrend(): Promise<TrendVO> {
  return get('/stats/trend')
}

/** 热门短链 GET /stats/top-links?limit=N（默认 5，上限 50） */
export function getTopLinks(limit = 5): Promise<TopLinkVO[]> {
  return get('/stats/top-links', { params: { limit } })
}
