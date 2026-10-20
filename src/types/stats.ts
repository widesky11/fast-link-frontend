/** 单短链当日点击统计，与后端 ClickStatsVO 对应 */
export interface ClickStatsVO {
  shortCode: string
  /** 当日 PV（Redis 精确计数） */
  pv: number
  /** 当日 UV（HyperLogLog 估算，误差约 0.81%） */
  uv: number
  /** 统计日期 "yyyy-MM-dd" */
  date: string
  /** 自创建以来累计 PV（实时） */
  totalPv: number
}

/** 点击日志条目，与后端 ClickLogVO 对应 */
export interface ClickLogVO {
  shortCode: string
  /** 雪花 ID 字符串，未参与归因的点击为 null */
  campaignId: string | null
  channelId: string | null
  ip: string
  deviceType: string | null
  referer: string | null
  userAgent: string | null
  /** "yyyy-MM-dd HH:mm:ss" */
  clickTime: string
}

/** 日志游标分页结果，与后端 ClickLogPageVO 对应 */
export interface ClickLogPageVO {
  records: ClickLogVO[]
  /** 命中总数（有上限截断，仅作量级参考） */
  total: number
  /** 下一页游标（search_after），hasMore 为 false 时为 null */
  nextCursor: string | null
  hasMore: boolean
}

/** 日志查询参数，与 GET /stats/clicks 的 query 参数对应 */
export interface ClickLogQueryParams {
  campaignId?: string
  channelId?: string
  shortCode?: string
  /** ISO 格式 "yyyy-MM-ddTHH:mm:ss"，与 endTime 都不传默认近 7 天 */
  startTime?: string
  endTime?: string
  /** 默认 20，最大 200 */
  size?: number
  /** 翻页游标，首页不传 */
  cursor?: string
}

/** 账户级汇总，与后端 AccountStatsVO 对应（GET /stats/summary） */
export interface AccountStatsVO {
  linkTotal: number
  enabledCount: number
  todayPv: number
  todayUv: number
  totalPv: number
  totalUv: number
}

/** 单日趋势点 */
export interface TrendPoint {
  /** "yyyy-MM-dd" */
  date: string
  pv: number
  uv: number
}

/** 近 7 天点击趋势，与后端 TrendVO 对应（GET /stats/trend，天数后端固定） */
export interface TrendVO {
  startDate: string
  endDate: string
  days: number
  totalPv: number
  totalUv: number
  points: TrendPoint[]
}

/** 热门短链，与后端 TopLinkVO 对应（GET /stats/top-links?limit=N，上限 50） */
export interface TopLinkVO {
  shortCode: string
  title: string | null
  originUrl: string
  status: number
  createTime: string
  pv: number
  uv: number
}
