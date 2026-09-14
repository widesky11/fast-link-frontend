import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const accessToken = ref(localStorage.getItem('access_token') ?? '')
  const nickname = ref('')

  const isLoggedIn = computed(() => !!accessToken.value)

  function setToken(token: string) {
    accessToken.value = token
    localStorage.setItem('access_token', token)
  }

  function logout() {
    accessToken.value = ''
    nickname.value = ''
    localStorage.removeItem('access_token')
  }

  return { accessToken, nickname, isLoggedIn, setToken, logout }
})
