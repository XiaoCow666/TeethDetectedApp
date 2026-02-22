Page({
  uploadAndAnalyze: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: 'AI 正在分析中...' });

        wx.uploadFile({
          url: 'http://127.0.0.1:8000/predict', // ⚠️ 电脑模拟器调试用，真机需换成 IP 地址
          filePath: filePath,
          name: 'file',
          success: (uploadRes) => {
            wx.hideLoading();
            const data = JSON.parse(uploadRes.data);
            wx.navigateTo({
              url: '/pages/report/report',
              success: (navRes) => {
                navRes.eventChannel.emit('acceptData', { result: data, img: filePath });
              }
            });
          }
        });
      }
    });
  }
})