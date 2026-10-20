<script setup lang="ts">
import { uploadImage } from '@/api/file'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { ref } from 'vue'

/**
 * 图片上传组件（后端中转方案，与苍穹外卖相同）：
 * 文件 POST 到后端 /files/upload，由后端转存 OSS 并返回完整 URL。
 * 浏览器只与后端同源通信，无需配置 OSS CORS。
 */
const props = withDefaults(
  defineProps<{
    /** 图片完整 URL，空串表示未上传 */
    modelValue: string
    /** 大小上限（MB），需与后端 multipart / oss.max-size 保持一致 */
    maxSizeMB?: number
  }>(),
  { maxSizeMB: 5 },
)
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const uploading = ref(false)

function beforeUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (file.size > props.maxSizeMB * 1024 * 1024) {
    ElMessage.error(`图片大小不能超过 ${props.maxSizeMB}MB`)
    return false
  }
  return true
}

async function handleUpload(options: UploadRequestOptions) {
  uploading.value = true
  try {
    // 后端返回可公开访问的完整 URL（统一响应已在拦截器拆包）
    const url = await uploadImage(options.file)
    emit('update:modelValue', url)
    ElMessage.success('上传成功')
  } finally {
    // 错误提示由响应拦截器统一弹出
    uploading.value = false
  }
}

function handleRemove() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="image-upload">
    <el-upload
      v-loading="uploading"
      class="image-upload__picker"
      :show-file-list="false"
      accept="image/*"
      :before-upload="beforeUpload"
      :http-request="handleUpload"
    >
      <!-- @click.stop：阻止冒泡到 el-upload，点击封面是放大预览而不是重新选图 -->
      <div v-if="modelValue" class="image-upload__img-wrap" @click.stop>
        <el-image
          :src="modelValue"
          fit="cover"
          class="image-upload__img"
          :preview-src-list="[modelValue]"
          preview-teleported
        />
      </div>
      <el-icon v-else class="image-upload__icon"><Plus /></el-icon>
    </el-upload>
    <div class="image-upload__footer">
      <span class="image-upload__tip">JPG/PNG/WebP，不超过 {{ maxSizeMB }}MB</span>
      <el-button v-if="modelValue" link type="danger" size="small" @click="handleRemove">
        移除
      </el-button>
    </div>
  </div>
</template>

<style scoped>
/* 注意：:deep() 必须用扁平组合器写法，原生嵌套里写 :deep() 会在 Vite 预处理后丢规则 */
.image-upload__picker :deep(.el-upload) {
  width: 178px;
  height: 100px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}

.image-upload__picker :deep(.el-upload:hover) {
  border-color: #1677ff;
}

.image-upload__img-wrap {
  width: 100%;
  height: 100%;
}

.image-upload__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-upload__icon {
  font-size: 24px;
  color: #909399;
}

.image-upload__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.image-upload__tip {
  font-size: 12px;
  color: #909399;
}
</style>
