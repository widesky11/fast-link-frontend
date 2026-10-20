<script setup lang="ts">
import { createCampaign, listCampaignCards } from '@/api/campaign'
import ImageUpload from '@/components/ImageUpload.vue'
import { CampaignStatus } from '@/types/campaign'
import type {
  CampaignCardVO,
  CampaignStatusValue,
  CreateCampaignRequest,
} from '@/types/campaign'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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

// ---------- 卡片列表查询（不分页） ----------
const loading = ref(false)
const cards = ref<CampaignCardVO[]>([])
const query = reactive({
  keyword: '',
  enabled: undefined as number | undefined,
})

async function fetchList() {
  loading.value = true
  try {
    cards.value = await listCampaignCards({
      keyword: query.keyword || undefined,
      enabled: query.enabled,
    })
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  fetchList()
}

function handleReset() {
  query.keyword = ''
  query.enabled = undefined
  fetchList()
}

// ---------- 创建 ----------
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
  description: '',
  coverUrl: '',
  /** 空串表示不限制 */
  startTime: '',
  endTime: '',
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { max: 50, message: '活动名称最多 50 个字符', trigger: 'blur' },
  ],
  description: [{ max: 500, message: '描述最多 500 个字符', trigger: 'blur' }],
  coverUrl: [{ max: 500, message: '封面链接最多 500 个字符', trigger: 'blur' }],
  endTime: [
    {
      validator: (_rule, value: string, callback) => {
        if (value && form.startTime && value <= form.startTime) {
          callback(new Error('结束时间必须晚于开始时间'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
}

function openCreateDialog() {
  form.name = ''
  form.description = ''
  form.coverUrl = ''
  form.startTime = ''
  form.endTime = ''
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    const payload: CreateCampaignRequest = {
      name: form.name,
      description: form.description || undefined,
      coverUrl: form.coverUrl || undefined,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
    }
    await createCampaign(payload)
    ElMessage.success('创建成功')
    dialogVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

/** 大数字缩写：1234 → 1.2K，与原型的「12.4K」风格一致 */
function formatPv(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function goDetail(card: CampaignCardVO) {
  router.push(`/campaigns/${card.id}`)
}

onMounted(fetchList)
</script>

<template>
  <div v-loading="loading" class="campaigns-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar__filters">
        <el-input
          v-model="query.keyword"
          placeholder="搜索活动名称 / 描述..."
          clearable
          class="toolbar__search"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="query.enabled"
          placeholder="全部状态"
          clearable
          class="toolbar__status"
          @change="handleSearch"
        >
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
        <el-button @click="handleReset">重置</el-button>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建活动</el-button>
    </div>

    <!-- 卡片网格 -->
    <div v-if="cards.length > 0" class="card-grid">
      <div
        v-for="card in cards"
        :key="card.id"
        class="campaign-card"
        @click="goDetail(card)"
      >
        <div class="campaign-card__cover">
          <img v-if="card.coverUrl" :src="card.coverUrl" :alt="card.name" loading="lazy" />
          <span v-else class="campaign-card__cover-fallback">{{ card.name.slice(0, 1) }}</span>
          <el-tag
            class="campaign-card__status"
            :type="STATUS_TAG_TYPE[card.status]"
            size="small"
            effect="light"
          >
            {{ STATUS_TEXT[card.status] }}
          </el-tag>
        </div>
        <div class="campaign-card__body">
          <div class="campaign-card__name" :title="card.name">{{ card.name }}</div>
          <div class="campaign-card__count">{{ card.linkCount }} 个短链接</div>
          <div class="campaign-card__stats">
            <span>总点击 {{ formatPv(card.totalPv) }}</span>
            <span class="campaign-card__today">· 今日 {{ formatPv(card.todayPv) }}</span>
          </div>
        </div>
      </div>

      <!-- 新建占位卡片 -->
      <button type="button" class="campaign-card campaign-card--ghost" @click="openCreateDialog">
        <el-icon class="campaign-card--ghost__icon"><Plus /></el-icon>
        <span>新建活动</span>
      </button>
    </div>

    <!-- 空态 -->
    <el-empty v-else-if="!loading" description="暂无活动，点击右上角新建">
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建活动</el-button>
    </el-empty>
  </div>

  <!-- 创建对话框（编辑在详情页进行） -->
  <el-dialog v-model="dialogVisible" title="创建活动" width="560px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
      <el-form-item label="活动名称" prop="name">
        <el-input v-model="form.name" placeholder="如：双 11 大促" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="选填，最多 500 字"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker
          v-model="form.startTime"
          type="datetime"
          placeholder="不填则即刻生效"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
          @change="formRef?.validateField('endTime')"
        />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker
          v-model="form.endTime"
          type="datetime"
          placeholder="不填则不限结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="活动封面" prop="coverUrl">
        <ImageUpload v-model="form.coverUrl" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.campaigns-page {
  min-height: 300px;
}

/* ---------- 工具栏 ---------- */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.toolbar__filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar__search {
  width: 260px;
}

.toolbar__status {
  width: 130px;
}

/* ---------- 卡片网格 ---------- */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.campaign-card {
  background: #fff;
  border: 1px solid var(--fl-border);
  border-radius: var(--fl-radius);
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.campaign-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: var(--fl-shadow-card);
  transform: translateY(-2px);
}

/* 封面区 */
.campaign-card__cover {
  position: relative;
  height: 120px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0f2f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.campaign-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.campaign-card__cover-fallback {
  font-size: 40px;
  font-weight: 700;
  color: #4f7cff;
  opacity: 0.6;
}

.campaign-card__status {
  position: absolute;
  top: 10px;
  right: 10px;
}

/* 内容区 */
.campaign-card__body {
  padding: 14px 16px 16px;
}

.campaign-card__name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.campaign-card__count {
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
}

.campaign-card__stats {
  margin-top: 10px;
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
}

.campaign-card__today {
  color: #0ea5a4;
}

/* 新建占位卡片 */
.campaign-card--ghost {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 216px;
  border-style: dashed;
  border-color: #d1d5db;
  color: #9ca3af;
  font-size: 14px;
  background: #fafafa;
}

.campaign-card--ghost:hover {
  color: var(--el-color-primary);
  background: #f5f8ff;
}

.campaign-card--ghost__icon {
  font-size: 28px;
}
</style>
