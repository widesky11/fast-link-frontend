<script setup lang="ts">
import { getAccountSummary, getTopLinks, getTrend } from '@/api/stats'
import { LinkStatus } from '@/types/link'
import type { AccountStatsVO, TopLinkVO, TrendVO } from '@/types/stats'
import { DataLine, Link, Pointer, User } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const loading = ref(false)
const summary = ref<AccountStatsVO | null>(null)
const trend = ref<TrendVO | null>(null)
const topLinks = ref<TopLinkVO[]>([])

const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

/** 千分位格式化（1,248 风格） */
function fmt(n: number | undefined) {
  return (n ?? 0).toLocaleString('en-US')
}

const STATUS_TEXT: Record<number, string> = {
  [LinkStatus.ENABLED]: '启用',
  [LinkStatus.DISABLED]: '禁用',
  [LinkStatus.BANNED]: '封禁',
}

const STATUS_TAG_TYPE: Record<number, 'success' | 'info' | 'danger'> = {
  [LinkStatus.ENABLED]: 'success',
  [LinkStatus.DISABLED]: 'info',
  [LinkStatus.BANNED]: 'danger',
}

async function renderTrendChart() {
  if (!trend.value || trend.value.points.length === 0) return
  // 图表容器用 v-show 控制：数据赋值后 DOM 尚未更新（容器仍 display:none），
  // 此时 init 会得到 0x0 尺寸导致画布空白，必须等 DOM 刷新完成
  await nextTick()
  if (!chartRef.value) return
  chart ??= echarts.init(chartRef.value)
  const points = trend.value.points
  chart.setOption(
    {
      tooltip: { trigger: 'axis' },
      legend: { data: ['PV', 'UV'], right: 8, top: 0 },
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: points.map((p) => p.date.slice(5)), // MM-dd
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f2f5' } },
      },
      series: [
        {
          name: 'PV',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: points.map((p) => p.pv),
          lineStyle: { width: 2.5, color: '#4f7cff' },
          itemStyle: { color: '#4f7cff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(79,124,255,0.22)' },
              { offset: 1, color: 'rgba(79,124,255,0.01)' },
            ]),
          },
        },
        {
          name: 'UV',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: points.map((p) => p.uv),
          lineStyle: { width: 2.5, color: '#36cfc9' },
          itemStyle: { color: '#36cfc9' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(54,207,201,0.20)' },
              { offset: 1, color: 'rgba(54,207,201,0.01)' },
            ]),
          },
        },
      ],
    },
    true,
  )
}

function handleResize() {
  chart?.resize()
}

onMounted(async () => {
  loading.value = true
  try {
    const [summaryRes, trendRes, topRes] = await Promise.all([
      getAccountSummary(),
      getTrend(),
      getTopLinks(5),
    ])
    summary.value = summaryRes
    trend.value = trendRes
    topLinks.value = topRes
    renderTrendChart()
    window.addEventListener('resize', handleResize)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<template>
  <div v-loading="loading" class="dashboard">
    <!-- 汇总卡片 -->
    <div class="stats-grid">
      <div class="stat-card stat-card--blue">
        <div class="stat-card__icon"><el-icon><Link /></el-icon></div>
        <div class="stat-card__label">短链总数</div>
        <div class="stat-card__value">{{ fmt(summary?.linkTotal) }}</div>
        <div class="stat-card__sub">启用中 {{ fmt(summary?.enabledCount) }}</div>
      </div>
      <div class="stat-card stat-card--green">
        <div class="stat-card__icon"><el-icon><Pointer /></el-icon></div>
        <div class="stat-card__label">今日点击量</div>
        <div class="stat-card__value">{{ fmt(summary?.todayPv) }}</div>
        <div class="stat-card__sub">今日 UV {{ fmt(summary?.todayUv) }}</div>
      </div>
      <div class="stat-card stat-card--orange">
        <div class="stat-card__icon"><el-icon><DataLine /></el-icon></div>
        <div class="stat-card__label">总点击量</div>
        <div class="stat-card__value">{{ fmt(summary?.totalPv) }}</div>
        <div class="stat-card__sub">自创建以来累计</div>
      </div>
      <div class="stat-card stat-card--purple">
        <div class="stat-card__icon"><el-icon><User /></el-icon></div>
        <div class="stat-card__label">独立访客（UV）</div>
        <div class="stat-card__value">{{ fmt(summary?.totalUv) }}</div>
        <div class="stat-card__sub">按 IP 去重估算</div>
      </div>
    </div>

    <!-- 趋势图 -->
    <el-card class="panel" shadow="never">
      <div class="panel__title">
        <span>近 7 天点击趋势</span>
        <span class="panel__tag">PV / UV · {{ trend?.startDate }} ~ {{ trend?.endDate }}</span>
      </div>
      <div v-show="trend && trend.points.length > 0" ref="chartRef" class="trend-chart" />
      <el-empty
        v-if="!loading && (!trend || trend.points.length === 0)"
        description="近 7 天暂无点击数据"
      />
    </el-card>

    <!-- 热门短链 TOP 5 -->
    <el-card class="panel" shadow="never">
      <div class="panel__title">
        <span>热门短链 TOP 5</span>
        <span class="panel__tag">按点击量排序</span>
      </div>
      <el-table :data="topLinks" stripe>
        <el-table-column label="排名" width="70" align="center">
          <template #default="{ $index }">
            <span class="rank-badge" :class="{ 'rank-badge--top': $index < 3 }">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="短码" width="110">
          <template #default="{ row }: { row: TopLinkVO }">
            <el-link
              type="primary"
              :underline="false"
              :href="row.originUrl"
              target="_blank"
              class="mono-code"
              title="点击访问原始链接"
            >
              {{ row.shortCode }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="标题 / 原始链接" min-width="260">
          <template #default="{ row }: { row: TopLinkVO }">
            <div class="link-title">{{ row.title || '-' }}</div>
            <div class="link-url">{{ row.originUrl }}</div>
          </template>
        </el-table-column>
        <el-table-column label="点击量" width="110" align="right">
          <template #default="{ row }: { row: TopLinkVO }">
            <b>{{ fmt(row.pv) }}</b>
          </template>
        </el-table-column>
        <el-table-column label="UV" width="100" align="right">
          <template #default="{ row }: { row: TopLinkVO }">{{ fmt(row.uv) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }: { row: TopLinkVO }">
            <el-tag :type="STATUS_TAG_TYPE[row.status]" size="small">
              {{ STATUS_TEXT[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <template #empty>
          <el-empty description="暂无短链，去创建第一条吧" />
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 400px;
}

/* ========== 汇总卡片（原型风格：左侧色条 + 图标 + 大数字） ========== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  position: relative;
  background: #fff;
  border: 1px solid var(--fl-border);
  border-radius: var(--fl-radius);
  padding: 20px 20px 16px 24px;
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--fl-shadow-card);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.stat-card--blue::before { background: #4f7cff; }
.stat-card--green::before { background: #2cc6c0; }
.stat-card--orange::before { background: #f5a623; }
.stat-card--purple::before { background: #6a5cff; }

.stat-card__icon {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
}

.stat-card--blue .stat-card__icon { background: #e8efff; color: #4f7cff; }
.stat-card--green .stat-card__icon { background: #e0f7f5; color: #2cc6c0; }
.stat-card--orange .stat-card__icon { background: #fdf0dc; color: #f5a623; }
.stat-card--purple .stat-card__icon { background: #e9e6ff; color: #6a5cff; }

.stat-card__label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
}

.stat-card__value {
  font-size: 30px;
  font-weight: 700;
  color: #1f2937;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.stat-card__sub {
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
}

/* ========== 面板卡片 ========== */
.panel {
  border-radius: var(--fl-radius);
  margin-bottom: 16px;
  border: 1px solid var(--fl-border);
}

.panel__title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: var(--fl-text-1);
  margin-bottom: 16px;
}

.panel__tag {
  font-size: 12px;
  font-weight: 400;
  color: var(--fl-text-3);
}

.trend-chart {
  height: 320px;
}

/* ========== TOP 表格 ========== */
.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #f3f4f6;
  color: #6b7280;
}

.rank-badge--top {
  background: linear-gradient(135deg, #4f7cff, #36cfc9);
  color: #fff;
}

.mono-code {
  font-family: monospace;
  font-weight: 600;
}

.link-title {
  font-weight: 500;
  color: #1f2937;
}

.link-url {
  font-size: 12px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
