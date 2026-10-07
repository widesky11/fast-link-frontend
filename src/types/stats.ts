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
