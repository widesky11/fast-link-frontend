<script setup lang="ts">
import { updatePassword } from '@/api/user'
import { useUserStore } from '@/stores/user'
import type { UpdatePasswordRequest } from '@/types/user'
import { clearAuthCache } from '@/utils/auth'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()

/** 头像占位：取显示名首字符 */
const avatarText = computed(() => userStore.displayName?.charAt(0)?.toUpperCase() || 'U')

// ---------- 基本资料 ----------
const profileFormRef = ref<FormInstance>()
const profileSaving = ref(false)
const profileForm = reactive({
  nickname: '',
  email: '',
})

/** 用最新用户信息回填表单 */
function syncProfileForm() {
  profileForm.nickname = userStore.user?.nickname ?? ''
  profileForm.email = userStore.user?.email ?? ''
}

const profileRules: FormRules = {
  nickname: [{ max: 50, message: '昵称最多 50 个字符', trigger: 'blur' }],
  email: [
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
    { max: 100, message: '邮箱最多 100 个字符', trigger: 'blur' },
  ],
}

async function handleProfileSubmit() {
  await profileFormRef.value?.validate()
  profileSaving.value = true
  try {
    // 空串传给后端表示清除该字段
    await userStore.updateProfile({
      nickname: profileForm.nickname.trim(),
      email: profileForm.email.trim(),
    })
    ElMessage.success('资料已更新')
  } finally {
    profileSaving.value = false
  }
}

// ---------- 修改密码 ----------
const passwordFormRef = ref<FormInstance>()
const passwordSaving = ref(false)
const passwordForm = reactive<UpdatePasswordRequest & { confirmPassword: string }>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 64, message: '密码长度需为 8-64 个字符', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value && value === passwordForm.oldPassword) {
          callback(new Error('新密码不能与原密码相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

async function handlePasswordSubmit() {
  await passwordFormRef.value?.validate()
  passwordSaving.value = true
  try {
    await updatePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    // 后端已使 refresh token 失效：本地直接清空凭证回登录页
    ElMessage.success('密码已修改，请重新登录')
    clearAuthCache()
    router.push('/login')
  } finally {
    passwordSaving.value = false
  }
}

onMounted(async () => {
  // 进入页面拉一次最新信息（可能在他端修改过）
  await userStore.fetchMe()
  syncProfileForm()
})
</script>

<template>
  <div class="profile-page">
    <!-- 左：账号卡 -->
    <el-card class="profile-side" shadow="never">
      <div class="profile-side__avatar">{{ avatarText }}</div>
      <div class="profile-side__name">{{ userStore.displayName }}</div>
      <div class="profile-side__username">@{{ userStore.user?.username }}</div>
      <el-divider class="profile-side__divider" />
      <ul class="profile-side__meta">
        <li>
          <span>用户 ID</span>
          <b>{{ userStore.user?.id ?? '-' }}</b>
        </li>
        <li>
          <span>注册时间</span>
          <b>{{ userStore.user?.createTime ?? '-' }}</b>
        </li>
      </ul>
    </el-card>

    <!-- 右：表单区 -->
    <div class="profile-main">
      <el-card class="profile-panel" shadow="never">
        <template #header>基本资料</template>
        <el-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          label-width="80px"
          class="profile-form"
        >
          <el-form-item label="用户名">
            <el-input :model-value="userStore.user?.username" disabled />
            <p class="profile-form__hint">用户名不可修改</p>
          </el-form-item>
          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="profileForm.nickname"
              placeholder="留空则清除昵称"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="profileForm.email" placeholder="留空则清除邮箱" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="profileSaving" @click="handleProfileSubmit">
              保存资料
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="profile-panel" shadow="never">
        <template #header>修改密码</template>
        <el-alert
          type="warning"
          :closable="false"
          title="修改密码后需要重新登录"
          class="profile-panel__alert"
        />
        <el-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          label-width="80px"
          class="profile-form"
        >
          <el-form-item label="原密码" prop="oldPassword">
            <el-input
              v-model="passwordForm.oldPassword"
              type="password"
              show-password
              autocomplete="current-password"
            />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="8-64 个字符"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="passwordSaving" @click="handlePasswordSubmit">
              修改密码
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

/* ========== 左侧账号卡 ========== */
.profile-side {
  border: 1px solid var(--fl-border);
  border-radius: var(--fl-radius);
  text-align: center;
}

.profile-side__avatar {
  width: 72px;
  height: 72px;
  margin: 8px auto 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #4f7cff, #36cfc9);
  box-shadow: 0 12px 24px -10px rgba(79, 124, 255, 0.55);
}

.profile-side__name {
  font-size: 17px;
  font-weight: 600;
  color: var(--fl-text-1);
}

.profile-side__username {
  margin-top: 4px;
  font-size: 13px;
  color: var(--fl-text-3);
}

.profile-side__divider {
  margin: 18px 0 14px;
}

.profile-side__meta {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.profile-side__meta li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.profile-side__meta span {
  color: var(--fl-text-3);
  flex-shrink: 0;
}

.profile-side__meta b {
  font-weight: 500;
  color: var(--fl-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 右侧表单卡 ========== */
.profile-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-panel {
  border: 1px solid var(--fl-border);
  border-radius: var(--fl-radius);
}

.profile-panel :deep(.el-card__header) {
  font-size: 15px;
  font-weight: 600;
  color: var(--fl-text-1);
}

.profile-panel__alert {
  margin-bottom: 18px;
}

.profile-form {
  max-width: 480px;
}

.profile-form__hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--fl-text-3);
}

@media (max-width: 900px) {
  .profile-page {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
