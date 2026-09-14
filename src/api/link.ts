import { get, post, del, put } from './request'
import type {
  CreateLinkRequest,
  LinkPageQuery,
  LinkVO,
  PageResult,
  UpdateLinkRequest,
} from '@/types/link'

/** 分页查询短链列表 GET /links */
export function pageLinks(params: LinkPageQuery): Promise<PageResult<LinkVO>> {
  return get('/links', { params })
}

/** 查询短链详情 GET /links/{id} */
export function getLinkDetail(id: string): Promise<LinkVO> {
  return get(`/links/${id}`)
}

/** 创建短链 POST /links */
export function createLink(data: CreateLinkRequest): Promise<LinkVO> {
  return post('/links', data)
}

/** 更新短链 PUT /links/{id}（非 null 字段才覆盖） */
export function updateLink(id: string, data: UpdateLinkRequest): Promise<LinkVO> {
  return put(`/links/${id}`, data)
}

/** 删除短链（逻辑删除）DELETE /links/{id} */
export function deleteLink(id: string): Promise<void> {
  return del(`/links/${id}`)
}
