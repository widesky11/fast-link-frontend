/**
 * 活动展示状态（后端实时计算，不落库）：
 * 0=未开始 1=进行中 2=已结束 3=已停用
 */
export const CampaignStatus = {
  NOT_STARTED: 0,
  RUNNING: 1,
  ENDED: 2,
  DISABLED: 3,
} as const

export type CampaignStatusValue = (typeof CampaignStatus)[keyof typeof CampaignStatus]

/** 活动 VO，与后端 CampaignVO 对应 */
export interface CampaignVO {
  /** 雪花 ID，后端序列化为字符串 */
  id: string
  name: string
  description: string | null
  coverUrl: string | null
  /** "yyyy-MM-dd HH:mm:ss"，null 表示不限制 */
  startTime: string | null
  endTime: string | null
  /** 展示状态：0=未开始 1=进行中 2=已结束 3=已停用 */
  status: CampaignStatusValue
  /** 渠道数，仅详情接口填充，列表接口为 null */
  channelCount: number | null
  /** 短链数，仅详情接口填充，列表接口为 null */
  linkCount: number | null
  createTime: string
}

/** 活动卡片 VO，与后端 CampaignCardVO 对应（GET /campaigns 卡片列表，不分页） */
export interface CampaignCardVO {
  /** 雪花 ID，后端序列化为字符串 */
  id: string
  name: string
  coverUrl: string | null
  /** 展示状态：0=未开始 1=进行中 2=已结束 3=已停用 */
  status: CampaignStatusValue
  /** 活动下短链数 */
  linkCount: number
  /** 累计 PV（Redis 计数） */
  totalPv: number
  /** 今日 PV（Redis 计数） */
  todayPv: number
}

/** 活动卡片查询参数，与 GET /campaigns 的 query 参数对应 */
export interface CampaignCardQuery {
  /** 模糊匹配 name 或 description */
  keyword?: string
  /** 落库的人工开关：1=启用 0=停用 */
  enabled?: number
}

/** 创建活动请求，与后端 CreateCampaignRequest 对应 */
export interface CreateCampaignRequest {
  name: string
  description?: string
  /** "yyyy-MM-dd HH:mm:ss"，不传不限制 */
  startTime?: string
  endTime?: string
  coverUrl?: string
}

/** 更新活动请求，与后端 UpdateCampaignRequest 对应（非 null 字段才覆盖） */
export interface UpdateCampaignRequest {
  name?: string
  description?: string
  startTime?: string
  endTime?: string
  coverUrl?: string
  /** 人工开关：1=启用 0=停用 */
  status?: number
}

/** 渠道 VO，与后端 ChannelVO 对应 */
export interface ChannelVO {
  id: string
  campaignId: string
  name: string
  /** 活动内唯一业务键，创建后不可修改 */
  code: string
  utmSource: string | null
  utmMedium: string | null
  /** 预留字段，后端列表接口暂不填充（恒为 null） */
  linkCount: number | null
  /** 预留字段，归因聚合接口上线前恒为 null */
  clickCount: number | null
  createTime: string
}

/** 创建渠道请求，与后端 CreateChannelRequest 对应（campaignId 走路径参数） */
export interface CreateChannelRequest {
  name: string
  /** 仅字母、数字、下划线、中划线，活动内唯一 */
  code: string
  utmSource?: string
  utmMedium?: string
}

/** 更新渠道请求，与后端 UpdateChannelRequest 对应（无 code 字段，创建后不可改） */
export interface UpdateChannelRequest {
  name?: string
  utmSource?: string
  utmMedium?: string
}

/** 活动下批量建链请求，与后端 BatchCreateLinkRequest 对应 */
export interface BatchCreateLinkRequest {
  originUrl: string
  /** 渠道 ID 列表，单次最多 50 个 */
  channelIds: string[]
}

/** 批量建链单项结果，与后端 BatchCreateLinkVO 内嵌项对应 */
export interface BatchCreateLinkItem {
  channelId: string
  channelName: string
  shortCode: string
}

/** 批量建链返回，与后端 BatchCreateLinkVO 对应 */
export interface BatchCreateLinkVO {
  successCount: number
  items: BatchCreateLinkItem[]
}

/** 渠道归因明细项，与后端 CampaignAttributionVO.ChannelItem 对应 */
export interface ChannelAttributionItem {
  channelId: string
  /** 渠道已删除但历史日志还在时为「已删除渠道」 */
  channelName: string
  channelCode: string | null
  pv: number
  /** 按 IP 去重（ES cardinality 估算） */
  uv: number
  /** pv/uv，保留两位小数 */
  avgClicksPerUser: number
}

/** 活动归因聚合，与后端 CampaignAttributionVO 对应（GET /campaigns/{id}/attribution） */
export interface CampaignAttributionVO {
  campaignId: string
  campaignName: string
  /** 各渠道 PV 之和 */
  totalPv: number
  /** 全活动按 IP 去重 UV（ES cardinality 估算） */
  totalUv: number
  /** 实际生效的时间范围 "yyyy-MM-dd HH:mm:ss" */
  startTime: string
  endTime: string
  /** 渠道明细，按 PV 降序 */
  channels: ChannelAttributionItem[]
}
