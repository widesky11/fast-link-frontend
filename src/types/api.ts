/** 后端统一响应结构 */
export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}
