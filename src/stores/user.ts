import { login as loginApi, logout as logoutApi } from '@/api/auth'
import { clearAuthCache, getAccessToken, getUserInfo, setAuth, setAuthListener } from '@/utils/auth'
import type { LoginRequest, UserVO } from '@/types/user'
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

  return { isLoggedIn, user, displayName, login, logout }
})
