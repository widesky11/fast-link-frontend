import { del, get, post, put } from './request'
import type {
  BatchCreateLinkRequest,
  BatchCreateLinkVO,
  CampaignAttributionVO,
  CampaignCardQuery,
  CampaignCardVO,
  CampaignVO,
  ChannelVO,
  CreateCampaignRequest,
  CreateChannelRequest,
  UpdateCampaignRequest,
  UpdateChannelRequest,
} from '@/types/campaign'

// ---------- 活动 ----------

/** 活动卡片列表 GET /campaigns（不分页，每张卡片带短链数 / 累计 PV / 今日 PV） */
export function listCampaignCards(params: CampaignCardQuery): Promise<CampaignCardVO[]> {
  return get('/campaigns', { params })
}

/** 活动详情 GET /campaigns/{id}（channelCount/linkCount 仅此接口填充） */
export function getCampaignDetail(id: string): Promise<CampaignVO> {
  return get(`/campaigns/${id}`)
}

/** 创建活动 POST /campaigns */
export function createCampaign(data: CreateCampaignRequest): Promise<CampaignVO> {
  return post('/campaigns', data)
}

/** 更新活动 PUT /campaigns/{id}（非 null 字段才覆盖） */
export function updateCampaign(id: string, data: UpdateCampaignRequest): Promise<CampaignVO> {
  return put(`/campaigns/${id}`, data)
}

/** 删除活动 DELETE /campaigns/{id} */
export function deleteCampaign(id: string): Promise<void> {
  return del(`/campaigns/${id}`)
}

/**
 * 活动下批量建链 POST /campaigns/{id}/links/batch
 * 同一目标链接为每个选中渠道生成一条独立短码的短链，自动带上归因
 */
export function batchCreateLinks(
  campaignId: string,
  data: BatchCreateLinkRequest,
): Promise<BatchCreateLinkVO> {
  return post(`/campaigns/${campaignId}/links/batch`, data)
}

/**
 * 活动归因聚合 GET /campaigns/{id}/attribution
 * @param startTime ISO 格式 "yyyy-MM-ddTHH:mm:ss"；与 endTime 都不传时后端默认近 30 天
 */
export function getCampaignAttribution(
  id: string,
  startTime?: string,
  endTime?: string,
): Promise<CampaignAttributionVO> {
  return get(`/campaigns/${id}/attribution`, { params: { startTime, endTime } })
}

// ---------- 渠道 ----------

/** 活动下渠道列表 GET /campaigns/{campaignId}/channels（不分页） */
export function listChannels(campaignId: string): Promise<ChannelVO[]> {
  return get(`/campaigns/${campaignId}/channels`)
}

/** 创建渠道 POST /campaigns/{campaignId}/channels */
export function createChannel(campaignId: string, data: CreateChannelRequest): Promise<ChannelVO> {
  return post(`/campaigns/${campaignId}/channels`, data)
}

/** 更新渠道 PUT /channels/{id}（code 创建后不可修改） */
export function updateChannel(id: string, data: UpdateChannelRequest): Promise<ChannelVO> {
  return put(`/channels/${id}`, data)
}

/**
 * 删除渠道 DELETE /channels/{id}
 * 注意：渠道下还有短链时后端返回 409，需先删除短链
 */
export function deleteChannel(id: string): Promise<void> {
  return del(`/channels/${id}`)
}
