<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<template>
  <el-card class="profile-card">
    <template #header>个人信息</template>
    <el-descriptions :column="1" border>
      <el-descriptions-item label="用户 ID">{{ userStore.user?.id ?? '-' }}</el-descriptions-item>
      <el-descriptions-item label="用户名">{{ userStore.user?.username ?? '-' }}</el-descriptions-item>
      <el-descriptions-item label="昵称">{{ userStore.user?.nickname || '未设置' }}</el-descriptions-item>
      <el-descriptions-item label="邮箱">{{ userStore.user?.email || '未设置' }}</el-descriptions-item>
      <el-descriptions-item label="注册时间">{{ userStore.user?.createTime ?? '-' }}</el-descriptions-item>
    </el-descriptions>
    <el-alert
      type="info"
      :closable="false"
      title="修改昵称 / 密码功能将在后端开放对应接口后上线"
      class="profile-tip"
    />
  </el-card>
</template>

<style scoped>
.profile-card {
  max-width: 640px;
}

.profile-tip {
  margin-top: 16px;
}
</style>
