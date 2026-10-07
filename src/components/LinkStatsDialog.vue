<script setup lang="ts">
import { getClickOverview } from '@/api/stats'
import type { LinkVO } from '@/types/link'
import type { ClickStatsVO } from '@/types/stats'
import { InfoFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  link: LinkVO | null
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const date = ref(dayjs().format('YYYY-MM-DD'))
const stats = ref<ClickStatsVO | null>(null)
const loading = ref(false)

async function fetchStats() {
  if (!props.link) return
  loading.value = true
  try {
    stats.value = await getClickOverview(props.link.shortCode, date.value)
  } finally {
    loading.value = false
  }
}

watch(visible, (v) => {
  if (v) {
    date.value = dayjs().format('YYYY-MM-DD')
    stats.value = null
    fetchStats()
  }
})

/** 后端校验 date 不允许未来日期 */
const disabledDate = (d: Date) => d.getTime() > Date.now()
</script>

<template>
  <el-dialog v-model="visible" :title="`点击统计 - ${link?.shortCode ?? ''}`" width="560px">
    <div class="stats-toolbar">
      <span class="stats-toolbar__label">统计日期</span>
      <el-date-picker
        v-model="date"
        type="date"
        value-format="YYYY-MM-DD"
        :disabled-date="disabledDate"
        :clearable="false"
        style="width: 160px"
        @change="fetchStats"
      />
    </div>

    <el-row v-loading="loading" :gutter="12" class="stats-cards">
      <el-col :span="8">
        <el-card shadow="never">
          <el-statistic :value="stats?.pv ?? 0">
            <template #title>
              PV（当日）
              <el-tooltip content="页面浏览量，精确计数" placement="top">
                <el-icon class="stats-tip-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <el-statistic :value="stats?.uv ?? 0">
            <template #title>
              UV（当日）
              <el-tooltip content="独立访客数，HyperLogLog 估算，误差约 0.81%" placement="top">
                <el-icon class="stats-tip-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <el-statistic :value="stats?.totalPv ?? 0">
            <template #title>
              累计 PV
              <el-tooltip content="自创建以来累计点击量（实时）" placement="top">
                <el-icon class="stats-tip-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <el-alert
      type="info"
      :closable="false"
      title="趋势图、地域、来源等多维分析将在后端开放对应统计接口后上线"
      class="stats-alert"
    />
  </el-dialog>
</template>

<style scoped>
.stats-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.stats-toolbar__label {
  font-size: 14px;
  color: #606266;
}

.stats-tip-icon {
  vertical-align: -2px;
  color: #909399;
  cursor: help;
}

.stats-alert {
  margin-top: 16px;
}
</style>
