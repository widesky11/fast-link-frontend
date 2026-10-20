/** 短链状态：1=启用 0=禁用 2=风控封禁 */
export const LinkStatus = {
  DISABLED: 0,
  ENABLED: 1,
  BANNED: 2,
} as const

export type LinkStatusValue = (typeof LinkStatus)[keyof typeof LinkStatus]

/** 短链 VO，与后端 LinkVO 对应 */
export interface LinkVO {
  /** 雪花 ID，按字符串处理避免 JS 精度丢失 */
  id: string
  shortCode: string
  originUrl: string
  originDomain: string
  title: string | null
  description: string | null
  clickCount: number
  status: LinkStatusValue
  /** 归因活动 ID，未关联活动为 null */
  campaignId: string | null
  /** 归因活动名称；未关联或活动已删除为 null，前端展示「无」 */
  campaignName: string | null
  /** "yyyy-MM-dd HH:mm:ss"，null 表示永不过期 */
  expiredAt: string | null
  createTime: string
  updateTime: string
}

/** 分页结果，与后端 PageResult 对应 */
export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  size: number
}

/** 分页查询参数，与 GET /links 的 query 参数对应 */
export interface LinkPageQuery {
  page: number
  size: number
  keyword?: string
  status?: LinkStatusValue
}

/** 创建短链请求，与后端 CreateLinkRequest 对应 */
export interface CreateLinkRequest {
  originUrl: string
  title?: string
  description?: string
  /** "yyyy-MM-dd HH:mm:ss"，不传永不过期 */
  expiredAt?: string
  /** 归因活动 ID，与 channelId 成对传入；都不传则不参与归因 */
  campaignId?: string
  /** 归因渠道 ID，必须属于 campaignId 对应的活动 */
  channelId?: string
}

/** 更新短链请求，与后端 UpdateLinkRequest 对应（非 null 字段才覆盖） */
export interface UpdateLinkRequest {
  originUrl?: string
  title?: string
  description?: string
  expiredAt?: string
  status?: LinkStatusValue
}
