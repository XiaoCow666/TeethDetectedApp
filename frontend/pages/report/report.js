Page({
  data: { report: null, imagePath: '' },
  onLoad: function() {
    const channel = this.getOpenerEventChannel();
    channel.on('acceptData', (data) => {
      this.setData({
        report: data.result,
        imagePath: data.img
      });
    });
  }
})