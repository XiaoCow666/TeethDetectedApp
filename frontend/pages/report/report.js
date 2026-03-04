Page({
  // 页面数据
  data: {
    report: null,
    imagePath: ''
  },

  // 页面加载时执行的逻辑
  onLoad: function() {
    const channel = this.getOpenerEventChannel();
    channel.on('acceptData', (data) => {
      this.setData({
        report: data.result,
        imagePath: data.img
      });
    });
  },

  // 新增的提示函数：显示功能开发中的提示
  showWIP() {
    wx.showToast({
      title: '商业对接/PDF生成 模块测试中，即将开放',
      icon: 'none', // 无图标，仅文字提示
      duration: 2000 // 可选：设置提示显示时长，默认1500ms
    });
  }
})