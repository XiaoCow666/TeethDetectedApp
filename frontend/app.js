App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      // 🌟 必须指向您的数据环境：cloud1-4gjcsw2vb1218641
      wx.cloud.init({
        env: 'cloud1-4gjcsw2vb1218641',
        traceUser: true,
      });
    }
  }
})