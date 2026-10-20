<script setup lang="ts">
import { listCampaignCards, listChannels } from '@/api/campaign'
import { searchClickLogs } from '@/api/stats'
import type { CampaignCardVO, ChannelVO } from '@/types/campaign'
import type { ClickLogVO } from '@/types/stats'
import dayjs from 'dayjs'
import { onMounted, reactive, ref } from 'vue'

// ---------- 查询条件 ----------
const query = reactive({
  campaignId: undefined as string | undefined,
  channelId: undefined as string | undefined,
  shortCode: '',
  /** 默认近 7 天，与后端 DEFAULT_QUERY_DAYS 一致 */
  timeRange: [dayjs().subtract(7, 'day').format('YYYY-MM-DD[T]HH:mm:ss'), dayjs().format('YYYY-MM-DD[T]HH:mm:ss')] as [string, string] | null,
  size: 20,
})

// 活动 / 渠道级联选项
const campaignOptions = ref<CampaignCardVO[]>([])
const channelOptions = ref<ChannelVO[]>([])

async function loadCampaignOptions() {
  // 卡片接口不分页，一次拉全量作为筛选项
  campaignOptions.value = await listCampaignCards({})
}

async function handleCampaignChange(campaignId?: string) {
  query.channelId = undefined
  channelOptions.value = []
  if (campaignId) {
    channelOptions.value = await listChannels(campaignId)
  }
}

// ---------- 列表与游标分页 ----------
const loading = ref(false) // 整表查询（新条件）
const loadingMore = ref(false) // 追加下一页
const records = ref<ClickLogVO[]>([])
const total = ref(0)
const nextCursor = ref<string | null>(null)
const hasMore = ref(false)
const searched = ref(false) // 是否查过（控制空态文案）

function buildParams() {
  return {
    campaignId: query.campaignId,
    channelId: query.channelId,
    shortCode: query.shortCode || undefined,
    startTime: query.timeRange?.[0],
    endTime: query.timeRange?.[1],
    size: query.size,
  }
}

/** 新条件查询：清空旧数据从头查 */
async function handleSearch() {
  loading.value = true
  searched.value = true
  try {
    const result = await searchClickLogs(buildParams())
    records.value = result.records
    total.value = result.total
    nextCursor.value = result.nextCursor
    hasMore.value = result.hasMore
    saveHistory()
  } finally {
    loading.value = false
  }
}

// ---------- 短码搜索历史（localStorage 持久化，最多 10 条） ----------
const HISTORY_KEY = 'click_log_shortcode_history'
const MAX_HISTORY = 10
const history = ref<string[]>(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'))

/** el-autocomplete 建议源：空输入显示全部历史，有输入按包含关系过滤（忽略大小写） */
function queryHistory(queryString: string, cb: (suggestions: { value: string }[]) => void) {
  const matched = queryString
    ? history.value.filter((h) => h.toLowerCase().includes(queryString.toLowerCase()))
    : history.value
  cb(matched.map((value) => ({ value })))
}

function saveHistory() {
  const code = query.shortCode.trim()
  if (!code) return
  history.value = [code, ...history.value.filter((h) => h !== code)].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
}

function handleSelectHistory(item: { value: string }) {
  query.shortCode = item.value
  handleSearch()
}

/** 加载更多：带上游标追加 */
async function handleLoadMore() {
  if (!nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  try {
    const result = await searchClickLogs({ ...buildParams(), cursor: nextCursor.value })
    records.value = [...records.value, ...result.records]
    nextCursor.value = result.nextCursor
    hasMore.value = result.hasMore
  } finally {
    loadingMore.value = false
  }
}

function handleReset() {
  query.campaignId = undefined
  query.channelId = undefined
  query.shortCode = ''
  query.timeRange = [
    dayjs().subtract(7, 'day').format('YYYY-MM-DD[T]HH:mm:ss'),
    dayjs().format('YYYY-MM-DD[T]HH:mm:ss'),
  ]
  query.size = 20
  channelOptions.value = []
  handleSearch()
}

onMounted(() => {
  loadCampaignOptions()
  handleSearch()
})
</script>

<template>
  <el-card>
    <!-- 查询条件 -->
    <el-form inline @submit.prevent="handleSearch">
      <el-form-item label="活动">
        <el-select
          v-model="query.campaignId"
          placeholder="全部活动"
          clearable
          style="width: 180px"
          @change="handleCampaignChange"
        >
          <el-option v-for="c in campaignOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="渠道">
        <el-select
          v-model="query.channelId"
          placeholder="全部渠道"
          clearable
          :disabled="!query.campaignId"
          style="width: 160px"
        >
          <el-option v-for="ch in channelOptions" :key="ch.id" :label="ch.name" :value="ch.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="短码">
        <el-autocomplete
          v-model="query.shortCode"
          :fetch-suggestions="queryHistory"
          placeholder="精确匹配"
          clearable
          style="width: 160px"
          @select="handleSelectHistory"
          @clear="handleSearch"
        />
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="query.timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD[T]HH:mm:ss"
          style="width: 340px"
        />
      </el-form-item>
      <el-form-item label="每页">
        <el-select v-model="query.size" style="width: 90px">
          <el-option :value="20">20</el-option>
          <el-option :value="50">50</el-option>
          <el-option :value="100">100</el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 结果列表（max-height 让表体独立滚动，筛选区与表头不跟随） -->
    <el-table v-loading="loading" :data="records" stripe max-height="560">
      <el-table-column prop="clickTime" label="点击时间" width="165" />
      <el-table-column prop="shortCode" label="短码" width="100">
        <template #default="{ row }: { row: ClickLogVO }">
          <code class="log-code">{{ row.shortCode }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="130" />
      <el-table-column label="设备" width="90" align="center">
        <template #default="{ row }: { row: ClickLogVO }">
          <el-tag v-if="row.deviceType" size="small">{{ row.deviceType }}</el-tag>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="来源 Referer" min-width="200" show-overflow-tooltip>
        <template #default="{ row }: { row: ClickLogVO }">
          <el-link
            v-if="row.referer"
            :href="row.referer"
            target="_blank"
            type="info"
            :underline="false"
          >
            {{ row.referer }}
          </el-link>
          <span v-else class="text-muted">直接访问</span>
        </template>
      </el-table-column>
      <el-table-column label="User-Agent" min-width="220" show-overflow-tooltip>
        <template #default="{ row }: { row: ClickLogVO }">
          <span class="log-ua">{{ row.userAgent || '-' }}</span>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty :description="searched ? '该条件下暂无点击日志' : '输入条件后点击查询'" />
      </template>
    </el-table>

    <!-- 游标分页：总数 + 加载更多 -->
    <div v-if="searched && !loading" class="logs-footer">
      <span class="logs-footer__total">共 {{ total }} 条，已加载 {{ records.length }} 条</span>
      <el-button
        v-if="hasMore"
        type="primary"
        plain
        :loading="loadingMore"
        @click="handleLoadMore"
      >
        加载更多
      </el-button>
      <span v-else-if="records.length > 0" class="text-muted">已加载全部</span>
    </div>
  </el-card>
</template>

<style scoped>
.log-code {
  font-family: monospace;
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.log-ua {
  font-size: 12px;
  color: #606266;
}

.text-muted {
  color: #909399;
}

.logs-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}

.logs-footer__total {
  font-size: 13px;
  color: #606266;
}
</style>
