<script setup lang="ts">
import { ArrowDown, DataAnalysis, Document, Link, SwitchButton, Tickets, UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 详情页（/campaigns/:id）也高亮「活动管理」菜单
const activeMenu = computed(() =>
  route.path.startsWith('/campaigns') ? '/campaigns' : route.path,
)

/** 头像占位：取显示名首字符 */
const avatarText = computed(() => userStore.displayName?.charAt(0)?.toUpperCase() || 'U')

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
    <el-aside width="232px" class="basic-layout__aside">
      <div class="basic-layout__brand">
        <span class="basic-layout__brand-mark">链</span>
        <span class="basic-layout__brand-text">
          快链
          <i>FASTLINK</i>
        </span>
      </div>
      <el-menu :default-active="activeMenu" router class="basic-layout__menu">
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/links">
          <el-icon><Link /></el-icon>
          <span>短链管理</span>
        </el-menu-item>
        <el-menu-item index="/campaigns">
          <el-icon><Tickets /></el-icon>
          <span>活动管理</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <el-icon><Document /></el-icon>
          <span>点击日志</span>
        </el-menu-item>
      </el-menu>
      <div class="basic-layout__aside-foot">让每一次点击，都能追溯来源</div>
    </el-aside>
    <el-container>
      <el-header class="basic-layout__header" height="60px">
        <span class="basic-layout__title">{{ route.meta.title }}</span>
        <el-dropdown @command="handleCommand">
          <span class="basic-layout__user">
            <span class="basic-layout__avatar">{{ avatarText }}</span>
            {{ userStore.displayName }}
            <el-icon class="basic-layout__caret"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile" :icon="UserFilled">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="basic-layout__main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.basic-layout {
  height: 100vh;
}

/* ================= 侧边栏：与登录页同一套深蓝夜景 ================= */
.basic-layout__aside {
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(420px 300px at 0% 0%, rgba(79, 124, 255, 0.22), transparent 65%),
    linear-gradient(180deg, #0e1734 0%, #0b1026 100%);
}

.basic-layout__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 60px;
  padding: 0 20px;
}

.basic-layout__brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #4f7cff, #36cfc9);
  box-shadow: 0 8px 18px -6px rgba(79, 124, 255, 0.6);
}

.basic-layout__brand-text {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #eef2ff;
  line-height: 1.15;
}

.basic-layout__brand-text i {
  display: block;
  font-style: normal;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 5px;
  background: linear-gradient(90deg, #6f96ff, #36cfc9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.basic-layout__menu {
  flex: 1;
  border-right: none;
  background-color: transparent;
  padding: 12px 12px 0;
}

.basic-layout__menu :deep(.el-menu-item) {
  height: 44px;
  margin-bottom: 4px;
  border-radius: 10px;
  color: rgba(214, 223, 250, 0.62);
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.basic-layout__menu :deep(.el-menu-item:hover) {
  color: #eef2ff;
  background-color: rgba(148, 170, 226, 0.12);
}

.basic-layout__menu :deep(.el-menu-item.is-active) {
  color: #fff;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(79, 124, 255, 0.95), rgba(54, 207, 201, 0.85));
  box-shadow: 0 8px 18px -8px rgba(79, 124, 255, 0.7);
}

.basic-layout__aside-foot {
  padding: 16px 20px 20px;
  font-size: 11px;
  letter-spacing: 1px;
  color: rgba(124, 138, 179, 0.55);
}

/* ================= 顶栏 ================= */
.basic-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid var(--fl-border);
}

.basic-layout__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--fl-text-1);
}

.basic-layout__user {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--fl-text-2);
  cursor: pointer;
  outline: none;
}

.basic-layout__avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #4f7cff, #36cfc9);
}

.basic-layout__caret {
  font-size: 12px;
  color: var(--fl-text-3);
}

/* ================= 内容区 ================= */
.basic-layout__main {
  background: var(--fl-bg);
  padding: 20px;
}
</style>
