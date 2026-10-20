import { post } from './request'

/**
 * 上传图片 POST /files/upload（后端中转方案，与苍穹外卖相同）：
 * 浏览器把文件发给后端，后端用 OSS SDK 转存，返回可公开访问的完整 URL。
 * 浏览器只与后端同源通信，OSS 的 CORS 与此方案无关。
 */
export function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  return post('/files/upload', formData)
}
