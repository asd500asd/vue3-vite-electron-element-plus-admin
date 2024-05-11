<script setup lang="ts">
import { ipcRenderer, IpcRendererEvent } from 'electron'
import { ElButton, ElTableColumn, ElTable, ElMessage, ElInput, ElUpload } from 'element-plus'
import { ref, onMounted, onUnmounted } from 'vue'
const localCode = ref(0)
const localInput = ref('3113fad测试')
const setLocalCode = (v) => {
  localCode.value = v
}

const startControl = () => {
  console.log('startControl-->', localInput.value)
  // 渲染线程发起一个请求
  ipcRenderer.send('control', localInput.value)
}

const setRemoteCode = (v) => {
  console.log('ee', v)
  localInput.value = v
}

const login = async () => {
  // 获取登陆后的控制码
  // 因为登录状态是在主进程维护，通过主进程来处理ipc事件
  const code = await ipcRenderer.invoke('login')
  setLocalCode(code)
  // 存储控制码
  console.log('code', code)
}

// const uploadFile = (file) => {
//   console.log('上传file-->', file)
//   ipcRenderer.send('upload-file', file)
//   ipcRenderer.on('upload-response', (event, response) => {
//     if (response.success) {
//       ElMessage.success(response.message)
//     } else {
//       ElMessage.error(response.message)
//     }
//   })
// }

const fileOrigin = ref(null)
const uploadFile = () => {
  console.log('999', fileOrigin.value)
  if (fileOrigin.value) {
    const reader = new FileReader()
    reader.onload = (e) => {
      console.log('file.value', e, 'e.tartget', e.target, e.target?.result)
      const arrayBuffer = new Uint8Array(e.target!.result)
      const buffer = Buffer.from(arrayBuffer)
      ipcRenderer.send('upload-file', { name: fileOrigin.value!.name, buffer })
    }
    reader.readAsArrayBuffer(fileOrigin.value)
  }
}

const handleFileChange = (file, fileList) => {
  console.log('file', file, 'fileList', fileList)
  fileOrigin.value = file.raw // 这里file.raw是原生File对象
}
const handleSuccess = (response, file, fileList) => {
  ElMessage('文件上传成功')
}
const handleError = (error, file, fileList) => {
  // ElMessage('文件上传失败')
}

// ==============
const handleControlState = (e: IpcRendererEvent, name: string, type: number) => {
  let text = ''
  if (type === 1) {
    //控制别人
    text = `正在远程控制==>【${name}】`
  }
  setLocalCode(text) //当前页面的文本
}

onMounted(() => {
  ipcRenderer.on('control-state-change', handleControlState) //监听ipc事
  ipcRenderer.on('folder-files', (event, files) => {
    tableFileList.value = files
    console.log('tableFileList', tableFileList.value)
  })

  ipcRenderer.on('file-upload-response', (event, response) => {
    if (response.success) {
      ElMessage.success(response.message)
      fetchFiles()
    } else {
      ElMessage.error(response.message)
    }
  })

  // 假设组件挂载后获取文件列表
  fetchFiles()
})
onUnmounted(() => {
  //监听函数之后，最好清理掉这个函数(退出时)
  ipcRenderer.removeListener('control-state-change', handleControlState)
})

const tableFileList = ref([])

const fetchFiles = () => {
  ipcRenderer.send('get-folder-files')
}

const downloadFile = (filePath) => {
  ipcRenderer.send('download-file', filePath)
}
</script>

<template>
  <div class="demo-main">
    <h1>Demo</h1>
    <hr />
    <h2
      >附件的存储、查询、导出(打包ZIP并设置解压密码),附件上传存储到安装目录下的data文件夹下,可以创建子文件夹。</h2
    >
    <h4>上传</h4>

    <div>hello react</div>
    <div> 本身的控制码: {{ localCode }} </div>
    <BaseButton type="primary" @click="login"> 登录 </BaseButton>
    <el-input v-model="localInput" placeholder="请输入内容" @change="setRemoteCode"></el-input>
    <BaseButton type="primary" @click="startControl"> 请求控制 </BaseButton>
    <!-- <input type="text" value={remoteCode} onChange={e=>setRemoteCode(e.target.value)}/> -->
    <hr />
    <!-- 由于不通过HTTP上传，所以这里action设置为none -->
    <el-upload
      action="none"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-change="handleFileChange"
      ref="upload"
    >
      <template #trigger>
        <el-button type="primary">选择文件</el-button>
      </template>
      <!-- <el-button type="success" @click="submitUpload">上传</el-button> -->
      <el-button type="success" @click="uploadFile">上传</el-button>
    </el-upload>

    <el-table :data="tableFileList" style="width: 100%">
      <el-table-column prop="name" label="文件名" width="180"></el-table-column>
      <el-table-column prop="path" label="文件路径"></el-table-column>
      <el-table-column prop="path" label="操作" @click="downLoadFile">
        <template #default="row">
          <el-button size="default" @click="downloadFile(row.path)">下载至桌面</el-button>
          <el-button size="default" type="danger" @click="handleDelete(row.name)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="less" scoped>
.demo-main {
  margin: 30px;
}
</style>
