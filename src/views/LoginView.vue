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
    <!-- 深邃品牌背景：辉光 + 网格 + 链路星座 -->
    <div class="bg" aria-hidden="true">
      <div class="bg__glow bg__glow--a" />
      <div class="bg__glow bg__glow--b" />
      <div class="bg__grid" />
      <svg class="bg__network" viewBox="0 0 900 500" fill="none">
        <g stroke="url(#lineGradient)" stroke-width="1">
          <line x1="80" y1="420" x2="260" y2="240" />
          <line x1="260" y1="240" x2="480" y2="340" />
          <line x1="480" y1="340" x2="700" y2="160" />
          <line x1="260" y1="240" x2="420" y2="110" />
          <line x1="420" y1="110" x2="700" y2="160" />
          <line x1="700" y1="160" x2="830" y2="330" />
          <line x1="480" y1="340" x2="830" y2="330" />
        </g>
        <g>
          <circle cx="80" cy="420" r="6" class="node node--a" />
          <circle cx="260" cy="240" r="9" class="node node--b" />
          <circle cx="480" cy="340" r="6" class="node node--c" />
          <circle cx="700" cy="160" r="9" class="node node--d" />
          <circle cx="420" cy="110" r="5" class="node node--e" />
          <circle cx="830" cy="330" r="6" class="node node--a" />
        </g>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="900" y2="500">
            <stop offset="0" stop-color="#4f7cff" stop-opacity="0.8" />
            <stop offset="1" stop-color="#36cfc9" stop-opacity="0.8" />
          </linearGradient>
        </defs>
      </svg>
    </div>

    <div class="login-grid">
      <!-- 左侧：品牌叙事 -->
      <section class="brand">
        <div class="brand-badge">
          <span class="brand-badge__dot" />
          分布式短链接与访问分析平台
        </div>
        <h1 class="brand-title">
          快链
          <span class="brand-title__en">FASTLINK</span>
        </h1>
        <p class="brand-slogan">让每一次点击，都能追溯来源。</p>
        <ul class="brand-features">
          <li class="brand-features__item">
            <span class="brand-features__index">01</span>
            <div class="brand-features__text">
              <b>渠道归因</b>
              <span>活动 / 渠道 / 短链三层追踪</span>
            </div>
          </li>
          <li class="brand-features__item">
            <span class="brand-features__index">02</span>
            <div class="brand-features__text">
              <b>实时统计</b>
              <span>PV / UV 秒级可见</span>
            </div>
          </li>
          <li class="brand-features__item">
            <span class="brand-features__index">03</span>
            <div class="brand-features__text">
              <b>安全风控</b>
              <span>频控限流保驾护航</span>
            </div>
          </li>
        </ul>
      </section>

      <!-- 右侧：登录 / 注册 -->
      <section class="auth">
        <div class="form-card">
          <div class="form-card__header">
            <div class="form-logo">链</div>
            <h2>{{ mode === 'login' ? '欢迎回来' : '创建账号' }}</h2>
            <p>{{ mode === 'login' ? '登录以管理你的短链接' : '注册后即可开始创建短链' }}</p>
          </div>

          <!-- 登录 / 注册分段切换 -->
          <div class="mode-switch">
            <button
              type="button"
              class="mode-switch__item"
              :class="{ 'is-active': mode === 'login' }"
              @click="switchMode('login')"
            >
              登 录
            </button>
            <button
              type="button"
              class="mode-switch__item"
              :class="{ 'is-active': mode === 'register' }"
              @click="switchMode('register')"
            >
              注 册
            </button>
            <span class="mode-switch__thumb" :class="{ 'is-right': mode === 'register' }" />
          </div>

          <!-- 登录 -->
          <el-form
            v-if="mode === 'login'"
            ref="formRef"
            :model="loginForm"
            :rules="loginRules"
            size="large"
            class="auth-form"
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
            <el-button
              class="auth-form__submit"
              type="primary"
              native-type="submit"
              :loading="loading"
            >
              进入控制台
            </el-button>
          </el-form>

          <!-- 注册 -->
          <el-form
            v-else
            ref="formRef"
            :model="registerForm"
            :rules="registerRules"
            size="large"
            class="auth-form"
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
            <el-button
              class="auth-form__submit"
              type="primary"
              native-type="submit"
              :loading="loading"
            >
              注册并去登录
            </el-button>
          </el-form>
        </div>
        <p class="auth-footnote">快链 FastLink · 短链生成 / 渠道归因 / 点击分析</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ================= 页面骨架：全屏深色夜景 ================= */
.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(1100px 620px at 8% -10%, rgba(79, 124, 255, 0.32), transparent 60%),
    radial-gradient(900px 540px at 96% 108%, rgba(54, 207, 201, 0.22), transparent 55%),
    linear-gradient(160deg, #0b1026 0%, #131c3f 55%, #0e2a3f 100%);
}

/* ================= 背景层 ================= */
.bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.55;
  animation: float 9s ease-in-out infinite;
}

.bg__glow--a {
  width: 340px;
  height: 340px;
  top: 6%;
  left: 3%;
  background: #4f7cff;
}

.bg__glow--b {
  width: 280px;
  height: 280px;
  bottom: 4%;
  right: 5%;
  background: #36cfc9;
  animation-delay: -4.5s;
}

/* 细腻网格纹理，给深色底一点"工程感" */
.bg__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 170, 226, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 170, 226, 0.05) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(70% 70% at 40% 45%, #000 30%, transparent 100%);
}

.bg__network {
  position: absolute;
  left: -4%;
  bottom: 2%;
  width: min(760px, 62vw);
  opacity: 0.75;
}

.bg__network line {
  stroke-dasharray: 6 6;
  animation: dashMove 3.2s linear infinite;
}

.node {
  fill: #8fb3ff;
  animation: pulse 2.6s ease-in-out infinite;
}

.node--b { fill: #4f7cff; animation-delay: -0.5s; }
.node--c { fill: #36cfc9; animation-delay: -1s; }
.node--d { fill: #7c5cff; animation-delay: -1.5s; }
.node--e { fill: #8fb3ff; animation-delay: -2s; }

/* ================= 双栏布局 ================= */
.login-grid {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 40px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(380px, 460px);
  align-items: center;
  gap: 64px;
}

/* ================= 左侧品牌区 ================= */
.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  border: 1px solid rgba(148, 170, 226, 0.28);
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 1.5px;
  color: #aebadd;
  animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both;
}

.brand-badge__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #36cfc9;
  box-shadow: 0 0 10px rgba(54, 207, 201, 0.9);
}

.brand-title {
  margin: 30px 0 14px;
  font-size: 76px;
  font-weight: 800;
  letter-spacing: 6px;
  line-height: 1.05;
  color: #f2f5ff;
  animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.13s both;
}

.brand-title__en {
  display: block;
  margin-top: 10px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 14px;
  background: linear-gradient(90deg, #6f96ff, #36cfc9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.brand-slogan {
  margin: 0 0 48px;
  font-size: 18px;
  letter-spacing: 2px;
  color: #93a2c9;
  animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.21s both;
}

.brand-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 22px;
  animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.29s both;
}

.brand-features__item {
  display: flex;
  align-items: baseline;
  gap: 18px;
}

.brand-features__index {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #36cfc9;
  font-variant-numeric: tabular-nums;
}

.brand-features__text {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.brand-features__text b {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  color: #dfe6fb;
}

.brand-features__text span {
  font-size: 13px;
  color: #7c8ab3;
  letter-spacing: 0.5px;
}

/* ================= 右侧表单卡（深色实心，不用玻璃拟态） ================= */
.auth {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-card {
  width: 100%;
  padding: 42px 40px 36px;
  background: #111d3d;
  border: 1px solid rgba(148, 170, 226, 0.16);
  border-radius: 18px;
  box-shadow:
    0 40px 80px -32px rgba(2, 6, 23, 0.8),
    0 4px 16px rgba(2, 6, 23, 0.4);
  animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both;
}

.form-card__header {
  text-align: center;
  margin-bottom: 26px;
}

.form-logo {
  width: 52px;
  height: 52px;
  margin: 0 auto 18px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #4f7cff, #36cfc9);
  box-shadow: 0 12px 26px -8px rgba(79, 124, 255, 0.6);
}

.form-card__header h2 {
  margin: 0 0 8px;
  font-size: 24px;
  letter-spacing: 1px;
  color: #eef2ff;
}

.form-card__header p {
  margin: 0;
  font-size: 13px;
  color: #7c8ab3;
}

/* 分段切换器（深色） */
.mode-switch {
  position: relative;
  display: flex;
  margin-bottom: 26px;
  padding: 4px;
  border-radius: 10px;
  background: #0a1229;
  border: 1px solid rgba(148, 170, 226, 0.12);
}

.mode-switch__item {
  position: relative;
  z-index: 1;
  flex: 1;
  height: 38px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  letter-spacing: 3px;
  color: #7c8ab3;
  cursor: pointer;
  transition: color 0.25s;
}

.mode-switch__item:focus-visible {
  outline: 2px solid rgba(79, 124, 255, 0.7);
  outline-offset: 2px;
}

.mode-switch__item.is-active {
  color: #eef2ff;
  font-weight: 600;
}

.mode-switch__thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: 38px;
  border-radius: 8px;
  background: #22315e;
  box-shadow: 0 2px 10px rgba(2, 6, 23, 0.5);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mode-switch__thumb.is-right {
  transform: translateX(100%);
}

/* 深色输入框 */
.auth-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 4px 14px;
  background: #0c1731;
  box-shadow: 0 0 0 1px rgba(148, 170, 226, 0.18) inset;
  transition: box-shadow 0.2s;
}

.auth-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(148, 170, 226, 0.32) inset;
}

.auth-form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 2px rgba(79, 124, 255, 0.35) inset,
    0 0 0 1px #4f7cff inset;
}

.auth-form :deep(.el-input__inner) {
  color: #e6ecff;
}

.auth-form :deep(.el-input__inner::placeholder) {
  color: #56648c;
}

.auth-form :deep(.el-input__password-icon),
.auth-form :deep(.el-input__clear-icon) {
  color: #56648c;
}

.auth-form :deep(.el-form-item__error) {
  color: #ff8a9a;
}

/* 渐变主按钮（页面上唯一的亮色焦点） */
.auth-form__submit {
  width: 100%;
  height: 46px;
  margin-top: 4px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  letter-spacing: 4px;
  font-weight: 600;
  background: linear-gradient(135deg, #4f7cff, #36a2ff 55%, #36cfc9);
  box-shadow: 0 14px 28px -10px rgba(79, 124, 255, 0.65);
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.auth-form__submit:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
  box-shadow: 0 18px 34px -10px rgba(79, 124, 255, 0.75);
  background: linear-gradient(135deg, #4f7cff, #36a2ff 55%, #36cfc9);
}

.auth-form__submit:active {
  transform: translateY(0);
}

.auth-footnote {
  margin-top: 24px;
  font-size: 12px;
  letter-spacing: 1.5px;
  color: #4d5b84;
  animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.36s both;
}

/* ================= 动效 ================= */
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-18px); }
}

@keyframes dashMove {
  to { stroke-dashoffset: -24; }
}

@keyframes pulse {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.45; }
}

@media (prefers-reduced-motion: reduce) {
  .bg__glow,
  .bg__network line,
  .node {
    animation: none;
  }

  .brand-badge,
  .brand-title,
  .brand-slogan,
  .brand-features,
  .form-card,
  .auth-footnote {
    animation: none;
  }
}

/* ================= 响应式 ================= */
@media (max-width: 960px) {
  .login-grid {
    grid-template-columns: minmax(0, 1fr);
    padding: 40px 24px;
    gap: 0;
  }

  .brand {
    display: none;
  }
}
</style>
