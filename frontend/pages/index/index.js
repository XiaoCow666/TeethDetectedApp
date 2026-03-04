Page({
  // 真实的启动拍照功能
  startScreening() {
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({ url: '/pages/camera/camera' });
  },

  // 画板门测试：拦截并提示开发中
  showWIP() {
    wx.showToast({
      title: '🚀 该功能正在努力开发中，敬请期待！',
      icon: 'none',
      duration: 2000
    });
  }
})
