import axios from 'axios'
import router from '@/router'
import type { ApiResult } from '@/types/api'
import type { LoginVO, UserVO } from '@/types/user'

/**
 * 认证凭证统一管理：读写 localStorage、无感刷新、自动续期。
 * 注意：本模块只依赖 router 与裸 axios，不能反向依赖 api/request 或 stores（否则循环引用）。
 */
const TOKEN_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  user: 'user_info',
  expireAt: 'access_expire_at',
} as const

/** 提前刷新余量（秒）：在 accessToken 过期前多久主动续期 */
const REFRESH_AHEAD_SECONDS = 60

/** 最小定时器间隔（秒），防止异常值导致疯刷 */
const MIN_TIMER_SECONDS = 5

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEYS.access)
}

export function getRefreshToken() {
  return localStorage.getItem(TOKEN_KEYS.refresh)
}

export function getUserInfo(): UserVO | null {
  const raw = localStorage.getItem(TOKEN_KEYS.user)
  return raw ? (JSON.parse(raw) as UserVO) : null
}

/** 认证状态变化监听：Pinia store 借此同步内存状态（结构子集，只需携带 user） */
type AuthListener = (data: { user: UserVO } | null) => void
let authListener: AuthListener | null = null

export function setAuthListener(listener: AuthListener | null) {
  authListener = listener
}

/** 资料更新后同步本地缓存的用户信息（不触碰 token 与续期定时器） */
export function updateStoredUser(user: UserVO) {
  localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(user))
  authListener?.({ user })
}

/** 登录 / 刷新成功后写入凭证，并重置自动续期定时器 */
export function setAuth(data: LoginVO) {
  localStorage.setItem(TOKEN_KEYS.access, data.accessToken)
  localStorage.setItem(TOKEN_KEYS.refresh, data.refreshToken)
  localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(data.user))
  localStorage.setItem(TOKEN_KEYS.expireAt, String(Date.now() + data.accessExpiresIn * 1000))
  authListener?.(data)
  startAutoRefresh(data.accessExpiresIn)
}

/** 清空本地凭证并停止续期 */
export function clearAuthCache() {
  localStorage.removeItem(TOKEN_KEYS.access)
  localStorage.removeItem(TOKEN_KEYS.refresh)
  localStorage.removeItem(TOKEN_KEYS.user)
  localStorage.removeItem(TOKEN_KEYS.expireAt)
  stopAutoRefresh()
  authListener?.(null)
}

// ---------- 无感刷新 ----------
// 并发触发时只发起一次 refresh，其余调用复用同一个 Promise
let refreshPromise: Promise<string | null> | null = null

/**
 * 用 refreshToken 换新 Token（后端为轮换式，旧的立即失效）。
 * @returns 新的 accessToken，失败返回 null
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken()
    refreshPromise = refreshToken
      ? axios
          .post<ApiResult<LoginVO>>(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })
          .then((res) => {
            if (res.data.code !== 200 || !res.data.data) {
              throw new Error(res.data.message)
            }
            setAuth(res.data.data)
            return res.data.data.accessToken
          })
          .catch(() => null)
          .finally(() => {
            refreshPromise = null
          })
      : Promise.resolve(null)
  }
  return refreshPromise
}

// ---------- 自动续期 ----------
let refreshTimer: number | null = null

function stopAutoRefresh() {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

function startAutoRefresh(expiresIn: number) {
  stopAutoRefresh()
  const delay = Math.max(expiresIn - REFRESH_AHEAD_SECONDS, MIN_TIMER_SECONDS) * 1000
  refreshTimer = window.setTimeout(handleAutoRefresh, delay)
}

/** 定时到期或回到前台时调用：刷新失败即视为登录失效 */
async function handleAutoRefresh() {
  const token = await refreshAccessToken()
  if (!token) {
    clearAuthCache()
    router.push('/login')
  }
}

/**
 * 应用启动时调用：
 * 1. 按本地记录的过期时间恢复自动续期（刷新页面后不丢）；
 * 2. 监听页面回到前台，检查是否已临近过期（后台标签页定时器会被浏览器节流）。
 */
export function setupAuthRefresh() {
  if (getAccessToken()) {
    const expireAt = Number(localStorage.getItem(TOKEN_KEYS.expireAt) || 0)
    const remain = Math.round((expireAt - Date.now()) / 1000)
    if (remain <= REFRESH_AHEAD_SECONDS) {
      handleAutoRefresh()
    } else {
      startAutoRefresh(remain)
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !getAccessToken()) return
    const expireAt = Number(localStorage.getItem(TOKEN_KEYS.expireAt) || 0)
    if (Date.now() >= expireAt - REFRESH_AHEAD_SECONDS * 1000) {
      handleAutoRefresh()
    }
  })
}
