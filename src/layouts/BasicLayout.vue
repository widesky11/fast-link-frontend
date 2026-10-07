<script setup lang="ts">
import { ArrowDown, DataAnalysis, Link, SwitchButton, User, UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

async function handleCommand(command: string) {
  if (command === 'profile') {
    router.push('/profile')
    return
  }
  if (command === 'logout') {
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<template>
  <el-container class="basic-layout">
    <el-aside width="220px" class="basic-layout__aside">
      <div class="basic-layout__logo">快链 FastLink</div>
      <el-menu :default-active="route.path" router class="basic-layout__menu">
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/links">
          <el-icon><Link /></el-icon>
          <span>短链管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="basic-layout__header">
        <span>{{ route.meta.title }}</span>
        <el-dropdown @command="handleCommand">
          <span class="basic-layout__user">
            <el-icon><User /></el-icon>
            {{ userStore.displayName }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile" :icon="UserFilled">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.basic-layout {
  height: 100vh;
}

.basic-layout__aside {
  background-color: #001529;
}

.basic-layout__logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.basic-layout__menu {
  border-right: none;
  background-color: transparent;
}

.basic-layout__menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.75);
}

.basic-layout__menu :deep(.el-menu-item.is-active),
.basic-layout__menu :deep(.el-menu-item:hover) {
  color: #fff;
  background-color: #1677ff;
}

.basic-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e4e7ed;
  font-size: 16px;
  font-weight: 600;
}

.basic-layout__user {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 400;
  color: #606266;
  cursor: pointer;
  outline: none;
}
</style>
