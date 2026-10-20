import { login as loginApi, logout as logoutApi } from '@/api/auth'
import { getMe, updateProfile as updateProfileApi } from '@/api/user'
import {
  clearAuthCache,
  getAccessToken,
  getUserInfo,
  setAuth,
  setAuthListener,
  updateStoredUser,
} from '@/utils/auth'
import type { LoginRequest, UpdateProfileRequest, UserVO } from '@/types/user'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 初始值取自本地凭证；后续 refresh 导致的变化通过监听同步
  const isLoggedIn = ref(!!getAccessToken())
  const user = ref<UserVO | null>(getUserInfo())

  const displayName = computed(() => user.value?.nickname || user.value?.username || '')

  setAuthListener((data) => {
    isLoggedIn.value = !!data
    user.value = data?.user ?? null
  })

  async function login(payload: LoginRequest) {
    // setAuth 内部会写入凭证、通知监听器并启动自动续期
    setAuth(await loginApi(payload))
  }

  async function logout() {
    try {
      await logoutApi()
    } finally {
      // 无论后端注销是否成功，本地凭证都清掉
      clearAuthCache()
    }
  }

  /** 拉取最新用户信息并同步本地缓存（updateStoredUser 会经监听器回写 store） */
  async function fetchMe() {
    updateStoredUser(await getMe())
  }

  /** 更新资料并同步本地缓存 */
  async function updateProfile(payload: UpdateProfileRequest) {
    updateStoredUser(await updateProfileApi(payload))
  }

  return { isLoggedIn, user, displayName, login, logout, fetchMe, updateProfile }
})
