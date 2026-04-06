Page({
  data: {
    devicePosition: 'back',  // 控制前后摄像头，默认后置
    flashMode: 'off'         // 控制闪光灯，默认关闭
  },

  switchCamera: function() {
    this.setData({
      devicePosition: this.data.devicePosition === 'back' ? 'front' : 'back'
    });
  },

  toggleFlash: function() {
    this.setData({
      flashMode: this.data.flashMode === 'off' ? 'torch' : 'off'
    });
  },

  chooseFromAlbum: function() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album'], sizeType: ['compressed'], 
      success: (res) => {
        this.doUpload(res.tempFiles[0].tempFilePath); 
      }
    });
  },

  takePhotoAndCrop: function() {
    const ctx = wx.createCameraContext();
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        if (this.data.flashMode === 'torch') {
          this.setData({ flashMode: 'off' });
        }
        this.cropMouthArea(res.tempImagePath);
      },
      fail: () => {
        wx.showToast({ title: '相机调用失败，请检查授权', icon: 'none' });
      }
    });
  },

  cropMouthArea: function(imagePath) {
    wx.showLoading({ title: '图像预处理中...', mask: true });

    const query = wx.createSelectorQuery();
    query.select('.camera-wrapper').boundingClientRect();
    query.select('.mouth-guide-box').boundingClientRect();

    query.exec(rectRes => {
      if (!rectRes[0] || !rectRes[1]) {
        this.doUpload(imagePath); 
        return;
      }

      const cameraRect = rectRes[0];
      const mouthRect = rectRes[1];

      const ratioX = (mouthRect.left - cameraRect.left) / cameraRect.width;
      const ratioY = (mouthRect.top - cameraRect.top) / cameraRect.height;
      const ratioW = mouthRect.width / cameraRect.width;
      const ratioH = mouthRect.height / cameraRect.height;

      wx.getImageInfo({
        src: imagePath,
        success: (imgRes) => {
          const expandW = ratioW * 0.15;
          const expandH = ratioH * 0.4;

          const startX = Math.max(0, imgRes.width * (ratioX - expandW));
          const startY = Math.max(0, imgRes.height * (ratioY - expandH));
          const cropW = Math.min(imgRes.width - startX, imgRes.width * (ratioW + expandW * 2));
          const cropH = Math.min(imgRes.height - startY, imgRes.height * (ratioH + expandH * 2));

          const canvasQuery = wx.createSelectorQuery();
          canvasQuery.select('#cropCanvas').fields({ node: true, size: true }).exec(cRes => {
            if (!cRes[0]) { this.doUpload(imagePath); return; }
            
            const canvas = cRes[0].node;
            const ctx = canvas.getContext('2d');
            canvas.width = cropW;
            canvas.height = cropH;

            const img = canvas.createImage();
            img.src = imagePath;
            img.onload = () => {
              ctx.drawImage(img, startX, startY, cropW, cropH, 0, 0, cropW, cropH);
              wx.canvasToTempFilePath({
                canvas: canvas, destWidth: cropW, destHeight: cropH,
                success: (fileRes) => {
                  wx.hideLoading();
                  this.doUpload(fileRes.tempFilePath); 
                },
                fail: () => { this.doUpload(imagePath); }
              });
            };
            img.onerror = () => { this.doUpload(imagePath); };
          });
        },
        fail: () => { this.doUpload(imagePath); }
      });
    });
  },

  doUpload: function(finalPath) {
    wx.showLoading({ title: 'AI 极速分析中...', mask: true }); 
    const serverUrl = 'https://oral-ai-api-230115-5-1408642439.sh.run.tcloudbase.com/predict'; 

    wx.uploadFile({
      url: serverUrl,
      filePath: finalPath,
      name: 'file',
      success: (uploadRes) => {
        wx.hideLoading();
        
        if (uploadRes.statusCode !== 200) {
            wx.showModal({ title: '后端报错', content: '服务器开小差了，状态码: ' + uploadRes.statusCode, showCancel: false });
            return;
        }

        try {
          const data = JSON.parse(uploadRes.data);
          console.log("后端返回结果：", data);
          if (data.error) {
            wx.showModal({
              title: 'AI 分析失败',
              content: data.error,
              showCancel: false
            });
            return;
          }
          
          // 核心：只有 has_teeth = false 才拦（拍墙/没牙）
          // 健康牙 = true → 不拦
          if (!data.has_teeth) {
            wx.showModal({
              title: '未能识别到牙齿',
              content: '请确保照片清晰、光线充足且包含完整的牙齿区域',
              confirmText: '重新尝试',
              showCancel: false
            });
            return;
          }
          const currentPatient = wx.getStorageSync('currentPatient');
          const familyProfiles = wx.getStorageSync('familyProfiles') || [];
          const up = wx.getStorageSync('userProfile') || {};

          let pName = '本人';
          let pGender = '保密';

          if (currentPatient && currentPatient.id && currentPatient.id !== 'main') {
            const fam = familyProfiles.find(f => f.id === currentPatient.id) || currentPatient;
            pName = fam.name || currentPatient.name || '家人';
            pGender = fam.gender || '保密';
          } else {
            pName = up.realName || up.nickName || '本人';
            pGender = up.gender || '保密';
          }

          wx.navigateTo({
            url: '/pages/report/report',
            success: (res) => {
              res.eventChannel.emit('acceptData', { 
                result: data, 
                img: finalPath, 
                patientName: pName,
                patientGender: pGender // 传给报告页
              });
            }
          });

          this.saveRecordToCloud(finalPath, data, pName, pGender);

        } catch (e) {
          wx.showToast({ title: '数据解析失败，请重试', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络连接失败，请检查网络', icon: 'none' });
      }
    });
  },

  saveRecordToCloud: function(filePath, reportData, pName, pGender) {
    const cloudPath = 'oral_images/' + Date.now() + '-' + Math.floor(Math.random() * 1000) + '.png';
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: uploadRes => {
        const fileID = uploadRes.fileID; 
        const currentPatient = wx.getStorageSync('currentPatient');
        const patientId = currentPatient ? currentPatient.id : 'main'; 

        const db = wx.cloud.database();
        db.collection('records').add({
          data: { 
            patientId: patientId, 
            patientName: pName, 
            patientGender: pGender, 
            report: reportData, 
            imageFileID: fileID, 
            createTime: db.serverDate() 
          }
        });
      }
    });
  }
});