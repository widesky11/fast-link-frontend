<script setup lang="ts">
import {
  batchCreateLinks,
  createChannel,
  deleteCampaign,
  deleteChannel,
  getCampaignAttribution,
  getCampaignDetail,
  listChannels,
  updateCampaign,
  updateChannel,
} from '@/api/campaign'
import ImageUpload from '@/components/ImageUpload.vue'
import { CampaignStatus } from '@/types/campaign'
import type {
  BatchCreateLinkVO,
  CampaignAttributionVO,
  CampaignStatusValue,
  CampaignVO,
  ChannelVO,
} from '@/types/campaign'
import { ArrowLeft } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const campaignId = route.params.id as string

const STATUS_TEXT: Record<CampaignStatusValue, string> = {
  [CampaignStatus.NOT_STARTED]: '未开始',
  [CampaignStatus.RUNNING]: '进行中',
  [CampaignStatus.ENDED]: '已结束',
  [CampaignStatus.DISABLED]: '已停用',
}

const STATUS_TAG_TYPE: Record<CampaignStatusValue, 'primary' | 'success' | 'info' | 'warning'> = {
  [CampaignStatus.NOT_STARTED]: 'primary',
  [CampaignStatus.RUNNING]: 'success',
  [CampaignStatus.ENDED]: 'info',
  [CampaignStatus.DISABLED]: 'warning',
}

// ---------- 活动详情 ----------
const campaign = ref<CampaignVO | null>(null)
const detailLoading = ref(false)

async function fetchDetail() {
  detailLoading.value = true
  try {
    campaign.value = await getCampaignDetail(campaignId)
  } finally {
    detailLoading.value = false
  }
}

// ---------- 活动编辑 / 启停 / 删除 ----------
const editDialogVisible = ref(false)
const editSubmitting = ref(false)
const editFormRef = ref<FormInstance>()
const editForm = reactive({
  name: '',
  description: '',
  coverUrl: '',
  /** 空串表示不限制 */
  startTime: '',
  endTime: '',
})

const editFormRules: FormRules = {
  name: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { max: 50, message: '活动名称最多 50 个字符', trigger: 'blur' },
  ],
  description: [{ max: 500, message: '描述最多 500 个字符', trigger: 'blur' }],
  coverUrl: [{ max: 500, message: '封面链接最多 500 个字符', trigger: 'blur' }],
  endTime: [
    {
      validator: (_rule, value: string, callback) => {
        if (value && editForm.startTime && value <= editForm.startTime) {
          callback(new Error('结束时间必须晚于开始时间'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
}

function openCampaignEditDialog() {
  if (!campaign.value) return
  editForm.name = campaign.value.name
  editForm.description = campaign.value.description ?? ''
  editForm.coverUrl = campaign.value.coverUrl ?? ''
  editForm.startTime = campaign.value.startTime ?? ''
  editForm.endTime = campaign.value.endTime ?? ''
  editDialogVisible.value = true
}

async function handleEditSubmit() {
  await editFormRef.value?.validate()
  editSubmitting.value = true
  try {
    await updateCampaign(campaignId, {
      name: editForm.name,
      description: editForm.description || undefined,
      coverUrl: editForm.coverUrl || undefined,
      startTime: editForm.startTime || undefined,
      endTime: editForm.endTime || undefined,
    })
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    fetchDetail()
  } finally {
    editSubmitting.value = false
  }
}

/** 展示状态 3=已停用 → 启用；其余 → 停用（落库 status：1=启用 0=停用） */
async function handleToggleStatus() {
  if (!campaign.value) return
  const disabling = campaign.value.status !== CampaignStatus.DISABLED
  await updateCampaign(campaignId, { status: disabling ? 0 : 1 })
  ElMessage.success(disabling ? '已停用' : '已启用')
  fetchDetail()
}

async function handleDeleteCampaign() {
  if (!campaign.value) return
  await ElMessageBox.confirm(
    `确定删除活动「${campaign.value.name}」吗？其下渠道与短链需先清理。`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  )
  await deleteCampaign(campaignId)
  ElMessage.success('删除成功')
  router.push('/campaigns')
}

// ---------- 渠道列表 ----------
const channels = ref<ChannelVO[]>([])
const channelLoading = ref(false)

async function fetchChannels() {
  channelLoading.value = true
  try {
    channels.value = await listChannels(campaignId)
  } finally {
    channelLoading.value = false
  }
}

// ---------- 渠道创建 / 编辑 ----------
const dialogVisible = ref(false)
const dialogTitle = ref('新建渠道')
const submitting = ref(false)
const editingChannelId = ref<string | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
  code: '',
  utmSource: '',
  utmMedium: '',
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入渠道名称', trigger: 'blur' },
    { max: 50, message: '渠道名称最多 50 个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入渠道标识', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_-]+$/,
      message: '仅支持字母、数字、下划线和中划线',
      trigger: 'blur',
    },
    { max: 20, message: '渠道标识最多 20 个字符', trigger: 'blur' },
  ],
  utmSource: [{ max: 50, message: 'utm_source 最多 50 个字符', trigger: 'blur' }],
  utmMedium: [{ max: 50, message: 'utm_medium 最多 50 个字符', trigger: 'blur' }],
}

function openCreateDialog() {
  editingChannelId.value = null
  dialogTitle.value = '新建渠道'
  form.name = ''
  form.code = ''
  form.utmSource = ''
  form.utmMedium = ''
  dialogVisible.value = true
}

function openEditDialog(row: ChannelVO) {
  editingChannelId.value = row.id
  dialogTitle.value = '编辑渠道'
  form.name = row.name
  form.code = row.code
  form.utmSource = row.utmSource ?? ''
  form.utmMedium = row.utmMedium ?? ''
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    if (editingChannelId.value) {
      // code 创建后不可修改，更新接口也不接受该字段
      await updateChannel(editingChannelId.value, {
        name: form.name,
        utmSource: form.utmSource || undefined,
        utmMedium: form.utmMedium || undefined,
      })
      ElMessage.success('更新成功')
    } else {
      await createChannel(campaignId, {
        name: form.name,
        code: form.code,
        utmSource: form.utmSource || undefined,
        utmMedium: form.utmMedium || undefined,
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchChannels()
    fetchDetail()
  } finally {
    submitting.value = false
  }
}

async function handleDeleteChannel(row: ChannelVO) {
  await ElMessageBox.confirm(
    `确定删除渠道「${row.name}」吗？渠道下还有短链时无法删除（后端返回 409），需先删除短链。`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  )
  try {
    await deleteChannel(row.id)
    ElMessage.success('删除成功')
    fetchChannels()
    fetchDetail()
  } catch {
    // 409 等错误提示已由响应拦截器统一弹出
  }
}

// ---------- 批量建链 ----------
const channelTableRef = ref<TableInstance>()
const selectedChannels = ref<ChannelVO[]>([])
const batchDialogVisible = ref(false)
const batchSubmitting = ref(false)
const batchOriginUrl = ref('')
const batchResult = ref<BatchCreateLinkVO | null>(null)

const SHORT_DOMAIN = import.meta.env.VITE_SHORT_DOMAIN

function handleSelectionChange(rows: ChannelVO[]) {
  selectedChannels.value = rows
}

function openBatchDialog() {
  batchOriginUrl.value = ''
  batchResult.value = null
  batchDialogVisible.value = true
}

async function handleBatchSubmit() {
  if (!/^https?:\/\/.+/.test(batchOriginUrl.value)) {
    ElMessage.warning('目标链接需以 http:// 或 https:// 开头')
    return
  }
  batchSubmitting.value = true
  try {
    batchResult.value = await batchCreateLinks(campaignId, {
      originUrl: batchOriginUrl.value,
      channelIds: selectedChannels.value.map((c) => c.id),
    })
    ElMessage.success(`成功创建 ${batchResult.value.successCount} 条短链`)
    channelTableRef.value?.clearSelection()
    selectedChannels.value = []
    fetchDetail()
  } finally {
    batchSubmitting.value = false
  }
}

async function copyShortUrl(shortCode: string) {
  const url = `${SHORT_DOMAIN}/${shortCode}`
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  ElMessage.success('短链已复制')
}

// ---------- 渠道归因 ----------
const attrLoading = ref(false)
const attribution = ref<CampaignAttributionVO | null>(null)
/** 时间范围 [startTime, endTime]（ISO 格式），null = 后端默认近 30 天 */
const attrRange = ref<[string, string] | null>(null)
const attrChartRef = ref<HTMLDivElement>()
let attrChart: echarts.ECharts | null = null

async function fetchAttribution() {
  attrLoading.value = true
  try {
    attribution.value = await getCampaignAttribution(
      campaignId,
      attrRange.value?.[0],
      attrRange.value?.[1],
    )
    renderAttrChart()
  } finally {
    attrLoading.value = false
  }
}

function renderAttrChart() {
  if (!attrChartRef.value) return
  const channels = attribution.value?.channels ?? []
  if (channels.length === 0) {
    attrChart?.dispose()
    attrChart = null
    return
  }
  attrChart ??= echarts.init(attrChartRef.value)
  attrChart.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['PV', 'UV'] },
      grid: { left: 8, right: 24, top: 40, bottom: 8, containLabel: true },
      xAxis: { type: 'category', data: channels.map((c) => c.channelName) },
      yAxis: { type: 'value' },
      series: [
        { name: 'PV', type: 'bar', data: channels.map((c) => c.pv), itemStyle: { color: '#1677ff' } },
        { name: 'UV', type: 'bar', data: channels.map((c) => c.uv), itemStyle: { color: '#36cfc9' } },
      ],
    },
    true,
  )
}

onMounted(() => {
  fetchDetail()
  fetchChannels()
  fetchAttribution()
})

onBeforeUnmount(() => {
  attrChart?.dispose()
})
</script>

<template>
  <div>
    <!-- 活动信息 -->
    <el-card v-loading="detailLoading" class="detail-card">
      <template #header>
        <div class="detail-header">
          <el-button :icon="ArrowLeft" link @click="router.push('/campaigns')">返回列表</el-button>
          <span class="detail-header__title">{{ campaign?.name ?? '活动详情' }}</span>
          <el-tag v-if="campaign" :type="STATUS_TAG_TYPE[campaign.status]">
            {{ STATUS_TEXT[campaign.status] }}
          </el-tag>
          <div v-if="campaign" class="detail-header__actions">
            <el-button type="primary" plain @click="openCampaignEditDialog">编辑</el-button>
            <el-button
              :type="campaign.status === CampaignStatus.DISABLED ? 'success' : 'warning'"
              plain
              @click="handleToggleStatus"
            >
              {{ campaign.status === CampaignStatus.DISABLED ? '启用' : '停用' }}
            </el-button>
            <el-button type="danger" plain @click="handleDeleteCampaign">删除</el-button>
          </div>
        </div>
      </template>
      <el-descriptions v-if="campaign" :column="3" border>
        <el-descriptions-item label="活动时间">
          {{
            campaign.startTime || campaign.endTime
              ? `${campaign.startTime ?? '即刻'} ~ ${campaign.endTime ?? '不限'}`
              : '不限制'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="渠道数">{{ campaign.channelCount ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="短链数">{{ campaign.linkCount ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ campaign.createTime }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ campaign.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="封面" :span="3">
          <el-image
            v-if="campaign.coverUrl"
            :src="campaign.coverUrl"
            fit="cover"
            class="detail-cover"
            :preview-src-list="[campaign.coverUrl]"
            preview-teleported
          />
          <span v-else class="text-muted">未上传</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 活动编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑活动" width="560px" destroy-on-close>
      <el-form ref="editFormRef" :model="editForm" :rules="editFormRules" label-width="90px">
        <el-form-item label="活动名称" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="如：双 11 大促"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="选填，最多 500 字"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="editForm.startTime"
            type="datetime"
            placeholder="不填则即刻生效"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            @change="editFormRef?.validateField('endTime')"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="editForm.endTime"
            type="datetime"
            placeholder="不填则不限结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="活动封面" prop="coverUrl">
          <ImageUpload v-model="editForm.coverUrl" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="handleEditSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 渠道归因 -->
    <el-card v-loading="attrLoading" class="attr-card">
      <template #header>
        <div class="attr-header">
          <span>渠道归因</span>
          <el-date-picker
            v-model="attrRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间（默认近 30 天）"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD[T]HH:mm:ss"
            style="width: 380px"
            clearable
            @change="fetchAttribution"
          />
        </div>
      </template>
      <div v-if="attribution" class="attr-summary">
        <el-statistic title="总 PV" :value="attribution.totalPv" />
        <el-statistic title="总 UV（按 IP 去重）" :value="attribution.totalUv" />
        <span class="attr-range">
          统计范围：{{ attribution.startTime }} ~ {{ attribution.endTime }}
        </span>
      </div>
      <div
        v-show="attribution && attribution.channels.length > 0"
        ref="attrChartRef"
        class="attr-chart"
      />
      <el-empty
        v-if="!attrLoading && (!attribution || attribution.channels.length === 0)"
        description="该时间范围内暂无归因数据"
      />
      <el-table
        v-if="attribution && attribution.channels.length > 0"
        :data="attribution.channels"
        size="small"
      >
        <el-table-column prop="channelName" label="渠道" min-width="140" />
        <el-table-column label="标识" min-width="100">
          <template #default="{ row }">
            <code v-if="row.channelCode" class="channel-code">{{ row.channelCode }}</code>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="pv" label="PV" width="110" align="right" sortable />
        <el-table-column prop="uv" label="UV" width="110" align="right" sortable />
        <el-table-column prop="avgClicksPerUser" label="人均点击" width="110" align="right" sortable />
      </el-table>
    </el-card>

    <!-- 渠道管理 -->
    <el-card>
      <template #header>
        <div class="channel-header">
          <span>渠道管理</span>
          <div>
            <el-button
              type="danger"
              plain
              :disabled="selectedChannels.length === 0"
              @click="openBatchDialog"
            >
              批量建链{{ selectedChannels.length ? `（${selectedChannels.length}）` : '' }}
            </el-button>
            <el-button type="primary" @click="openCreateDialog">新建渠道</el-button>
          </div>
        </div>
      </template>
      <el-table
        ref="channelTableRef"
        v-loading="channelLoading"
        :data="channels"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="name" label="渠道名称" min-width="140" />
        <el-table-column prop="code" label="渠道标识" min-width="120">
          <template #default="{ row }: { row: ChannelVO }">
            <code class="channel-code">{{ row.code }}</code>
          </template>
        </el-table-column>
        <el-table-column label="UTM 配置" min-width="180">
          <template #default="{ row }: { row: ChannelVO }">
            <span v-if="row.utmSource || row.utmMedium">
              source={{ row.utmSource ?? '-' }} / medium={{ row.utmMedium ?? '-' }}
            </span>
            <span v-else class="text-muted">未配置</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }: { row: ChannelVO }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDeleteChannel(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无渠道，点击右上角新建" />
        </template>
      </el-table>
    </el-card>

    <!-- 渠道创建 / 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="渠道名称" prop="name">
          <el-input v-model="form.name" placeholder="如：微博 KOL 投放" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="渠道标识" prop="code">
          <el-input
            v-model="form.code"
            placeholder="如：weibo-kol，活动内唯一"
            maxlength="20"
            :disabled="!!editingChannelId"
          />
          <div v-if="editingChannelId" class="form-tip">渠道标识创建后不可修改</div>
        </el-form-item>
        <el-form-item label="utm_source" prop="utmSource">
          <el-input v-model="form.utmSource" placeholder="选填，如：weibo" />
        </el-form-item>
        <el-form-item label="utm_medium" prop="utmMedium">
          <el-input v-model="form.utmMedium" placeholder="选填，如：social" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量建链对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量建链" width="560px" destroy-on-close>
      <!-- 第一步：输入目标链接 -->
      <template v-if="!batchResult">
        <el-alert
          type="info"
          :closable="false"
          title="将为每个选中渠道创建一条独立短码的短链（同一目标链接，自动带归因）"
          class="batch-tip"
        />
        <el-form label-width="90px">
          <el-form-item label="目标链接" required>
            <el-input v-model="batchOriginUrl" placeholder="https://example.com/..." />
          </el-form-item>
          <el-form-item label="渠道">
            <el-tag v-for="c in selectedChannels" :key="c.id" class="batch-channel-tag">
              {{ c.name }}
            </el-tag>
          </el-form-item>
        </el-form>
      </template>
      <!-- 第二步：展示结果 -->
      <template v-else>
        <el-alert
          type="success"
          :closable="false"
          :title="`成功创建 ${batchResult.successCount} 条短链`"
          class="batch-tip"
        />
        <el-table :data="batchResult.items" size="small" max-height="320">
          <el-table-column prop="channelName" label="渠道" min-width="140" />
          <el-table-column prop="shortCode" label="短码" width="120">
            <template #default="{ row }">
              <code class="channel-code">{{ row.shortCode }}</code>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="copyShortUrl(row.shortCode)">
                复制
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template #footer>
        <el-button @click="batchDialogVisible = false">关闭</el-button>
        <el-button v-if="!batchResult" type="primary" :loading="batchSubmitting" @click="handleBatchSubmit">
          开始创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.detail-card {
  margin-bottom: 16px;
}

.attr-card {
  margin-bottom: 16px;
}

.attr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.attr-summary {
  display: flex;
  align-items: baseline;
  gap: 48px;
  margin-bottom: 16px;
}

.attr-range {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}

.attr-chart {
  height: 300px;
  margin-bottom: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-header__title {
  font-size: 16px;
  font-weight: 600;
}

.detail-header__actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.channel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.channel-code {
  font-family: monospace;
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.text-muted {
  color: #909399;
}

.detail-cover {
  width: 178px;
  height: 100px;
  border-radius: 4px;
  cursor: zoom-in;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.batch-tip {
  margin-bottom: 16px;
}

.batch-channel-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}
</style>
