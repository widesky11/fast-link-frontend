import { clearAuthCache, getAccessToken, refreshAccessToken } from '@/utils/auth'
import type { ApiResult } from '@/types/api'
import axios from 'axios'
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

export type { ApiResult } from '@/types/api'

/** 已尝试过刷新重试的请求标记 */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

// 请求拦截：从本地凭证取 Access Token（定时续期会持续覆盖它）
request.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：拆包统一响应结构；401 时刷新 Token 重试，失败则回登录页
// （主动续期已覆盖大部分过期场景，这里是兜底：定时器漂移、多端踢下线等）
request.interceptors.response.use(
  (response) => {
    const result = response.data as ApiResult
    if (result.code !== 200) {
      ElMessage.error(result.message || '请求失败')
      return Promise.reject(new Error(result.message))
    }
    return result.data as never
  },
  async (error) => {
    const config = error.config as RetriableConfig | undefined
    // auth 接口自身的 401（如密码错误）不做刷新重试
    const isAuthApi = !!config?.url?.includes('/auth/')

    if (error.response?.status === 401 && config && !config._retried && !isAuthApi) {
      config._retried = true
      const token = await refreshAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        return request(config)
      }
      // refresh 也失败了：清空凭证回登录页
      clearAuthCache()
      router.push('/login')
    }

    ElMessage.error(error.response?.data?.message || error.message || '网络异常')
    return Promise.reject(error)
  },
)

export function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.get(url, config) as Promise<T>
}

export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request.post(url, data, config) as Promise<T>
}

export function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request.put(url, data, config) as Promise<T>
}

export function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.delete(url, config) as Promise<T>
}

export default request
