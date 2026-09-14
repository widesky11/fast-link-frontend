<script setup lang="ts">
import { createLink, deleteLink, pageLinks, updateLink } from '@/api/link'
import { LinkStatus } from '@/types/link'
import type { CreateLinkRequest, LinkStatusValue, LinkVO } from '@/types/link'
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

function openEditDialog(row: LinkVO) {
  editingId.value = row.id
  dialogTitle.value = '编辑短链'
  form.originUrl = row.originUrl
  form.title = row.title ?? ''
  form.description = row.description ?? ''
  form.expiredAt = row.expiredAt ?? undefined
  form.status = row.status
  dialogVisible.value = true
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
  await navigator.clipboard.writeText(fullShortUrl(shortCode))
  ElMessage.success('短链已复制')
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
            <el-button
              link
              type="primary"
              size="small"
              tag="a"
              :href="fullShortUrl(row.shortCode)"
              target="_blank"
            >
              访问
            </el-button>
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
          {{ row.expiredAt ?? '永不过期' }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }: { row: LinkVO }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
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

.links-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
