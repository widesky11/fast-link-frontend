<script setup lang="ts">
import { pageLinks } from '@/api/link'
import { LinkStatus } from '@/types/link'
import type { LinkVO } from '@/types/link'
import * as echarts from 'echarts'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const loading = ref(false)
const linkTotal = ref(0)
const totalClicks = ref(0)
const enabledCount = ref(0)
const topLinks = ref<LinkVO[]>([])

const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

function renderChart() {
  if (!chartRef.value || topLinks.value.length === 0) return
  chart = echarts.init(chartRef.value)
  // 横向条形图，点击量从高到低排列
  const sorted = [...topLinks.value].reverse()
  chart.setOption({
    title: { text: '点击量 Top 10' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 8, right: 32, top: 48, bottom: 8, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: sorted.map((l) => l.title || l.shortCode),
    },
    series: [
      {
        name: '点击量',
        type: 'bar',
        data: sorted.map((l) => l.clickCount),
        itemStyle: { color: '#1677ff', borderRadius: [0, 4, 4, 0] },
      },
    ],
  })
}

onMounted(async () => {
  loading.value = true
  try {
    // 后端无账户级聚合接口，先拉一页数据在前端聚合（规模扩大后需后端补区间/汇总接口）
    const result = await pageLinks({ page: 1, size: 100 })
    linkTotal.value = result.total
    totalClicks.value = result.records.reduce((sum, r) => sum + r.clickCount, 0)
    enabledCount.value = result.records.filter((r) => r.status === LinkStatus.ENABLED).length
    topLinks.value = [...result.records].sort((a, b) => b.clickCount - a.clickCount).slice(0, 10)
    renderChart()
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  chart?.dispose()
})
</script>

<template>
  <div v-loading="loading">
    <el-row :gutter="16" class="dashboard-cards">
      <el-col :span="8">
        <el-card>
          <el-statistic title="短链总数" :value="linkTotal" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <el-statistic title="累计点击（实时 PV）" :value="totalClicks" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <el-statistic title="启用中" :value="enabledCount" />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="dashboard-chart">
      <div v-show="topLinks.length > 0" ref="chartRef" class="dashboard-chart__container" />
      <el-empty v-if="!loading && topLinks.length === 0" description="暂无短链数据，去创建第一条短链吧" />
    </el-card>
  </div>
</template>

<style scoped>
.dashboard-cards {
  margin-bottom: 16px;
}

.dashboard-chart__container {
  height: 360px;
}
</style>
