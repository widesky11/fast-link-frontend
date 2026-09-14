<script setup lang="ts">
import { DataAnalysis, Link } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'

const route = useRoute()
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
  border-bottom: 1px solid #e4e7ed;
  font-size: 16px;
  font-weight: 600;
}
</style>
