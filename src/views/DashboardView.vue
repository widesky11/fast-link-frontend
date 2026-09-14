<script setup lang="ts">
import * as echarts from 'echarts'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

onMounted(() => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption({
    title: { text: '近 7 日点击量（示例数据）' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '点击量',
        type: 'line',
        smooth: true,
        data: [120, 200, 150, 80, 70, 110, 130],
      },
    ],
  })
})

onBeforeUnmount(() => {
  chart?.dispose()
})
</script>

<template>
  <el-row :gutter="16" class="dashboard-cards">
    <el-col :span="8">
      <el-card>
        <el-statistic title="短链总数" :value="128" />
      </el-card>
    </el-col>
    <el-col :span="8">
      <el-card>
        <el-statistic title="今日点击" :value="1024" />
      </el-card>
    </el-col>
    <el-col :span="8">
      <el-card>
        <el-statistic title="活动数" :value="6" />
      </el-card>
    </el-col>
  </el-row>
  <el-card class="dashboard-chart">
    <div ref="chartRef" class="dashboard-chart__container" />
  </el-card>
</template>

<style scoped>
.dashboard-cards {
  margin-bottom: 16px;
}

.dashboard-chart__container {
  height: 360px;
}
</style>
