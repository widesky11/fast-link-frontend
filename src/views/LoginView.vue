<script setup lang="ts">
import { register } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import type { LoginRequest, RegisterRequest } from '@/types/user'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const mode = ref<'login' | 'register'>('login')
const formRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive<LoginRequest>({
  username: '',
  password: '',
})

const registerForm = reactive<RegisterRequest & { confirmPassword: string }>({
  username: '',
  password: '',
  nickname: '',
  email: '',
  confirmPassword: '',
})

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

/** 校验规则与后端 RegisterRequest 的 JSR-303 注解保持一致 */
const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度需为 2-50 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 64, message: '密码长度需为 8-64 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  nickname: [{ max: 50, message: '昵称最多 50 个字符', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
}

function switchMode(target: 'login' | 'register') {
  mode.value = target
  formRef.value?.resetFields()
}

async function handleSubmit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    if (mode.value === 'login') {
      await userStore.login(loginForm)
      ElMessage.success('登录成功')
      router.push((route.query.redirect as string) || '/')
    } else {
      await register({
        username: registerForm.username,
        password: registerForm.password,
        nickname: registerForm.nickname || undefined,
        email: registerForm.email || undefined,
      })
      ElMessage.success('注册成功，请登录')
      // 保留用户名方便直接登录
      loginForm.username = registerForm.username
      switchMode('login')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card">
      <div class="login-card__title">
        <h1>快链 FastLink</h1>
        <p>分布式短链接与访问分析平台</p>
      </div>

      <!-- 登录 -->
      <el-form
        v-if="mode === 'login'"
        ref="formRef"
        :model="loginForm"
        :rules="loginRules"
        size="large"
        @submit.prevent="handleSubmit"
      >
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="用户名" autocomplete="username" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            show-password
            autocomplete="current-password"
            @keyup.enter="handleSubmit"
          />
        </el-form-item>
        <el-form-item>
          <el-button class="login-card__submit" type="primary" native-type="submit" :loading="loading">
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 注册 -->
      <el-form
        v-else
        ref="formRef"
        :model="registerForm"
        :rules="registerRules"
        size="large"
        @submit.prevent="handleSubmit"
      >
        <el-form-item prop="username">
          <el-input v-model="registerForm.username" placeholder="用户名（2-50 字符）" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码（8-64 字符）"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            show-password
            autocomplete="new-password"
            @keyup.enter="handleSubmit"
          />
        </el-form-item>
        <el-form-item prop="nickname">
          <el-input v-model="registerForm.nickname" placeholder="昵称（选填）" />
        </el-form-item>
        <el-form-item prop="email">
          <el-input v-model="registerForm.email" placeholder="邮箱（选填）" />
        </el-form-item>
        <el-form-item>
          <el-button class="login-card__submit" type="primary" native-type="submit" :loading="loading">
            注 册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-card__switch">
        <template v-if="mode === 'login'">
          还没有账号？<el-link type="primary" @click="switchMode('register')">注册一个</el-link>
        </template>
        <template v-else>
          已有账号？<el-link type="primary" @click="switchMode('login')">直接登录</el-link>
        </template>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #1677ff 0%, #36cfc9 100%);
}

.login-card {
  width: 400px;
  border-radius: 8px;
}

.login-card__title {
  text-align: center;
  margin-bottom: 24px;
}

.login-card__title h1 {
  font-size: 24px;
  margin: 0 0 8px;
}

.login-card__title p {
  color: #909399;
  font-size: 13px;
  margin: 0;
}

.login-card__submit {
  width: 100%;
}

.login-card__switch {
  text-align: center;
  font-size: 13px;
  color: #606266;
}
</style>
