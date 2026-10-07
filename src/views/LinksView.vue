<script setup lang="ts">
import { createLink, deleteLink, getLinkDetail, pageLinks, updateLink } from '@/api/link'
import LinkStatsDialog from '@/components/LinkStatsDialog.vue'
import { LinkStatus } from '@/types/link'
import type { CreateLinkRequest, LinkStatusValue, LinkVO } from '@/types/link'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const SHORT_DOMAIN = import.meta.env.VITE_SHORT_DOMAIN

const STATUS_TEXT: Record<LinkStatusValue, string> = {
  [LinkStatus.ENABLED]: '启用',
  [LinkStatus.DISABLED]: '禁用',
  [LinkStatus.BANNED]: '封禁',
}

const STATUS_TAG_TYPE: Record<LinkStatusValue, 'success' | 'info' | 'danger'> = {
  [LinkStatus.ENABLED]: 'success',
  [LinkStatus.DISABLED]: 'info',
  [LinkStatus.BANNED]: 'danger',
}

// ---------- 列表查询 ----------
const loading = ref(false)
const tableData = ref<LinkVO[]>([])
const total = ref(0)
const query = reactive({
  page: 1,
  size: 10,
  keyword: '',
  status: undefined as LinkStatusValue | undefined,
})

async function fetchList() {
  loading.value = true
  try {
    const result = await pageLinks({
      page: query.page,
      size: query.size,
      keyword: query.keyword || undefined,
      status: query.status,
    })
    tableData.value = result.records
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handleReset() {
  query.keyword = ''
  query.status = undefined
  query.page = 1
  fetchList()
}

function handlePageChange(page: number) {
  query.page = page
  fetchList()
}

function handleSizeChange(size: number) {
  query.size = size
  query.page = 1
  fetchList()
}

// ---------- 创建 / 编辑 ----------
const dialogVisible = ref(false)
const dialogTitle = ref('创建短链')
const submitting = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<FormInstance>()
const form = reactive<CreateLinkRequest & { status?: LinkStatusValue }>({
  originUrl: '',
  title: '',
  description: '',
  expiredAt: undefined,
  status: undefined,
})

const formRules: FormRules = {
  originUrl: [
    { required: true, message: '请输入原始链接', trigger: 'blur' },
    { pattern: /^https?:\/\/.+/, message: '链接需以 http:// 或 https:// 开头', trigger: 'blur' },
  ],
  title: [{ max: 100, message: '标题最多 100 个字符', trigger: 'blur' }],
  description: [{ max: 500, message: '描述最多 500 个字符', trigger: 'blur' }],
}

function openCreateDialog() {
  editingId.value = null
  dialogTitle.value = '创建短链'
  form.originUrl = ''
  form.title = ''
  form.description = ''
  form.expiredAt = undefined
  form.status = undefined
  dialogVisible.value = true
}

// 编辑前先拉详情，避免基于列表的陈旧数据修改（多端同时操作时）
const editLoadingId = ref<string | null>(null)

async function openEditDialog(row: LinkVO) {
  editLoadingId.value = row.id
  try {
    const detail = await getLinkDetail(row.id)
    editingId.value = detail.id
    dialogTitle.value = '编辑短链'
    form.originUrl = detail.originUrl
    form.title = detail.title ?? ''
    form.description = detail.description ?? ''
    form.expiredAt = detail.expiredAt ?? undefined
    form.status = detail.status
    dialogVisible.value = true
  } finally {
    editLoadingId.value = null
  }
}

// ---------- 统计弹窗 ----------
const statsDialogVisible = ref(false)
const statsLink = ref<LinkVO | null>(null)

function openStatsDialog(row: LinkVO) {
  statsLink.value = row
  statsDialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    const payload: CreateLinkRequest = {
      originUrl: form.originUrl,
      title: form.title || undefined,
      description: form.description || undefined,
      expiredAt: form.expiredAt || undefined,
    }
    if (editingId.value) {
      await updateLink(editingId.value, { ...payload, status: form.status })
      ElMessage.success('更新成功')
    } else {
      await createLink(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

// ---------- 状态切换 / 删除 ----------
async function handleToggleStatus(row: LinkVO) {
  const target =
    row.status === LinkStatus.ENABLED ? LinkStatus.DISABLED : LinkStatus.ENABLED
  await updateLink(row.id, { status: target })
  ElMessage.success(target === LinkStatus.ENABLED ? '已启用' : '已禁用')
  fetchList()
}

async function handleDelete(row: LinkVO) {
  await ElMessageBox.confirm(`确定删除短链「${row.title || row.shortCode}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  })
  await deleteLink(row.id)
  ElMessage.success('删除成功')
  // 删除当前页最后一条时回退一页
  if (tableData.value.length === 1 && query.page > 1) {
    query.page -= 1
  }
  fetchList()
}

// ---------- 工具 ----------
function fullShortUrl(shortCode: string) {
  return `${SHORT_DOMAIN}/${shortCode}`
}

async function copyShortUrl(shortCode: string) {
  const url = fullShortUrl(shortCode)
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    // 非安全上下文（HTTP 非 localhost）clipboard API 不可用，降级用 textarea
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

/** 是否已过期（后端跳转接口对过期短链返回 410） */
function isExpired(row: LinkVO) {
  return !!row.expiredAt && dayjs(row.expiredAt).isBefore(dayjs())
}

onMounted(fetchList)
</script>

<template>
  <el-card>
    <!-- 搜索栏 -->
    <el-form inline @submit.prevent="handleSearch">
      <el-form-item label="标题">
        <el-input
          v-model="query.keyword"
          placeholder="按标题模糊搜索"
          clearable
          style="width: 200px"
          @clear="handleSearch"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="query.status"
          placeholder="全部"
          clearable
          style="width: 120px"
          @change="handleSearch"
        >
          <el-option label="启用" :value="LinkStatus.ENABLED" />
          <el-option label="禁用" :value="LinkStatus.DISABLED" />
          <el-option label="封禁" :value="LinkStatus.BANNED" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
      <el-form-item style="float: right">
        <el-button type="primary" @click="openCreateDialog">创建短链</el-button>
      </el-form-item>
    </el-form>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="tableData" stripe>
      <el-table-column label="短链" min-width="200">
        <template #default="{ row }: { row: LinkVO }">
          <div class="link-cell">
            <span class="link-cell__code">{{ row.shortCode }}</span>
            <el-button link type="primary" size="small" @click="copyShortUrl(row.shortCode)">
              复制
            </el-button>
            <el-tooltip
              :content="row.status !== LinkStatus.ENABLED ? '非启用状态，跳转会返回 410 已失效' : ''"
              :disabled="row.status === LinkStatus.ENABLED"
              placement="top"
            >
              <span>
                <el-button
                  link
                  type="primary"
                  size="small"
                  tag="a"
                  :href="row.status === LinkStatus.ENABLED ? fullShortUrl(row.shortCode) : undefined"
                  :target="row.status === LinkStatus.ENABLED ? '_blank' : undefined"
                  :disabled="row.status !== LinkStatus.ENABLED"
                >
                  访问
                </el-button>
              </span>
            </el-tooltip>
          </div>
          <div class="link-cell__title">{{ row.title || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="原始链接" min-width="240" show-overflow-tooltip>
        <template #default="{ row }: { row: LinkVO }">
          <el-link :href="row.originUrl" target="_blank" type="info" :underline="false">
            {{ row.originUrl }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column prop="clickCount" label="点击量" width="90" align="right" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }: { row: LinkVO }">
          <el-tag :type="STATUS_TAG_TYPE[row.status]">{{ STATUS_TEXT[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="过期时间" width="160">
        <template #default="{ row }: { row: LinkVO }">
          <span v-if="!row.expiredAt">永不过期</span>
          <span v-else-if="isExpired(row)" class="expired-text">{{ row.expiredAt }}（已过期）</span>
          <span v-else>{{ row.expiredAt }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }: { row: LinkVO }">
          <el-button link type="primary" @click="openStatsDialog(row)">统计</el-button>
          <el-tooltip
            content="封禁状态由风控管理，不可手动编辑"
            :disabled="row.status !== LinkStatus.BANNED"
            placement="top"
          >
            <span>
              <el-button
                link
                type="primary"
                :disabled="row.status === LinkStatus.BANNED"
                :loading="editLoadingId === row.id"
                @click="openEditDialog(row)"
              >
                编辑
              </el-button>
            </span>
          </el-tooltip>
          <el-button
            v-if="row.status !== LinkStatus.BANNED"
            link
            :type="row.status === LinkStatus.ENABLED ? 'warning' : 'success'"
            @click="handleToggleStatus(row)"
          >
            {{ row.status === LinkStatus.ENABLED ? '禁用' : '启用' }}
          </el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无短链，点击右上角创建" />
      </template>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      class="links-pagination"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      :current-page="query.page"
      :page-size="query.size"
      :page-sizes="[10, 20, 50]"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </el-card>

  <!-- 创建 / 编辑对话框 -->
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
      <el-form-item label="原始链接" prop="originUrl">
        <el-input v-model="form.originUrl" placeholder="https://example.com/..." />
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="选填，最多 100 字" maxlength="100" show-word-limit />
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
      <el-form-item label="过期时间">
        <el-date-picker
          v-model="form.expiredAt"
          type="datetime"
          placeholder="不选则永不过期"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item v-if="editingId" label="状态">
        <el-radio-group v-model="form.status">
          <el-radio :value="LinkStatus.ENABLED">启用</el-radio>
          <el-radio :value="LinkStatus.DISABLED">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>

  <!-- 点击统计弹窗 -->
  <LinkStatsDialog v-model="statsDialogVisible" :link="statsLink" />
</template>

<style scoped>
.link-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.link-cell__code {
  font-family: monospace;
  font-weight: 600;
}

.link-cell__title {
  color: #909399;
  font-size: 12px;
}

.expired-text {
  color: #f56c6c;
}

.links-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
