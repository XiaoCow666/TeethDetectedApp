Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: ''
    }
  },
  onLoad() {
    // 尝试从本地缓存加载用户信息
    const user = wx.getStorageSync('userProfile');
    if(user) this.setData({ userInfo: user });
  },
  // 获取微信头像 (微信新版接口)
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ 'userInfo.avatarUrl': avatarUrl });
    wx.setStorageSync('userProfile', this.data.userInfo);
  },
  // 获取微信昵称 (微信新版接口)
  onNicknameChange(e) {
    const nickName = e.detail.value;
    this.setData({ 'userInfo.nickName': nickName });
    wx.setStorageSync('userProfile', this.data.userInfo);
  },
  viewHistory() {
    wx.showToast({ title: '记录功能开发中', icon: 'none' });
  },
  contactUs() {
    wx.showToast({ title: '即将接入客服', icon: 'none' });
  },
  // 新增的功能建设中提示函数
  showWIP() {
    wx.showToast({
      title: '功能建设中，感谢您的关注',
      icon: 'none'
    });
  }
})