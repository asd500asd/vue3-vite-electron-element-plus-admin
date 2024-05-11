import { ipcMain, ipcRenderer  } from 'electron'
import path from 'path';
import fs from 'fs';
const os = require('os');
import { send } from './index'

export function ipc(){
  // 如果您希望从主流程收到单个响应，例如方法调用的结果，请考虑使用ipcRenderer.invoke。 如果只是单纯的推送和传输推送数据,用ipcRenderer.send
    ipcMain.handle('login',async ()=>{
      // mock一个状态码
      const code = Math.floor(Math.random()*(999999-100000))+100000;
      console.log('测试', code)
      return code;
    })
    ipcMain.on('control', async(e, remoteCode:string)=>{
        console.log('测试--> control')
        console.log(remoteCode, '主线程收到的控制码')
         // 这里跟服务端交互，但是mock返回
         send('control-state-change', remoteCode, 1)
    })

    ipcMain.on('upload-file', (event, { name, buffer }) => {
      console.log('file-->', buffer)
      const uploadPath = path.join(__dirname, name);
      console.log('file-name->', buffer, 'path', path, 'uploadPath', uploadPath)
    
      fs.writeFile(uploadPath, buffer, (err) => {
        if (err) {
          event.reply('file-upload-response', { success: false, message: '文件写入失败' });
        } else {
          event.reply('file-upload-response', { success: true, message: '文件写入成功' });
        }
      });
    });


    const folderPath = path.join(__dirname);
   
    ipcMain.on('get-folder-files', () => {
      // console.log('开始读取文件夹')
      fs.readdir(folderPath, (err, files) => {
        if (err) {
          console.error('读取文件夹失败:', err);
          return;
        }
        const readFiles = files.map(file => ({ name: file, path: path.join(folderPath, file) }))
        // console.log('读取文件夹成功-->readFiles', readFiles)
        // 将文件信息发送回渲染进程
        send('folder-files', readFiles);
      });
    });

    // const desktopPath = os.homedir() + path.sep + 'Desktop';
    //   const fileName = path.basename('D:\\study\\vue3-vite-electron-element-plus-admin\\dist-electron\\main\\npm包引用白屏问题.docx');
    //   // 设置桌面上的文件保存路径
    //   const destPath = path.join(desktopPath, fileName + '下载的副本');
     
    // ipcMain.on('download-file', (event, filePath) => {
      // 获取桌面路径
      // const desktopPath = os.homedir() + path.sep + 'Desktop';
      const desktopPath = 'D:\\study\\vue3-vite-electron-element-plus-admin\\dist-electron\\main';
      const filePath = 'D:\\study\\vue3-vite-electron-element-plus-admin\\dist-electron\\main\\npm包引用白屏问题.docx'
      const fileName = path.basename(filePath);
      // 设置桌面上的文件保存路径
      // const destPath = path.join(desktopPath, fileName + '下载的副本');
      const destPath = path.join(desktopPath, fileName + '下载的副本');
      console.log('测试桌面文件', filePath, 'fileName', fileName, 'desktopPath', desktopPath)
    
      const readStream = fs.createReadStream(filePath);
      const writeStream = fs.createWriteStream(destPath);

      readStream.on('error', (err) => {
        console.error('文件读取失败:', err);
        // event.reply('download-file-response', { success: false, message: '文件读取失败' });
      });
    
      writeStream.on('error', (err) => {
        console.error('文件写入失败:', err);
        // event.reply('download-file-response', { success: false, message: '文件写入失败' });
      });
    
      writeStream.on('close', () => {
        console.log('文件下载关闭');
        // event.reply('download-file-response', { success: true, message: '文件下载成功' });
      });
    
      readStream.pipe(writeStream);
      // 复制文件到桌面
      fs.rename(filePath, destPath, (err) => {
        if (err) {
          console.error('文件下载失败:', err);
          // event.reply('download-file-response', { success: false, message: '文件下载失败' });
        } else {
          console.log('文件下载成功');
          // event.reply('download-file-response', { success: true, message: '文件下载成功' });
        }
      });
    // });
}

export function useIpcRenderer() {
  return {
    send: (channel, data) => {
      ipcRenderer.send(channel, data);
    },
    on: (channel, callback) => {
      ipcRenderer.on(channel, callback);
    }
  };
}
