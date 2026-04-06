Page({
  data: {
    userInfo: { avatarUrl: '', nickName: '', realName: '', gender: '' },
    genderArray: ['男', '女', '保密'],
    genderIndex: 0,
    familyProfiles: [], 
    currentMode: '本人' 
  },
  
  onLoad() {
    // 初始化由 onShow 接管，确保每次切页面都最新
  },

  // 每次显示页面，动态渲染当前身份的专属资料
  onShow() {
    const family = wx.getStorageSync('familyProfiles') || [];
    const currentPatient = wx.getStorageSync('currentPatient');

    this.setData({ familyProfiles: family });

    if (currentPatient) {
      // 从家属列表中找出这个人的最新资料
      const targetFam = family.find(f => f.id === currentPatient.id) || currentPatient;
      this.setData({
        currentMode: targetFam.name,
        userInfo: {
          avatarUrl: targetFam.avatarUrl || '', // 家属专属头像
          realName: targetFam.name,             // 家属名字
          gender: targetFam.gender || ''        // 家属专属性别
        },
        genderIndex: this.data.genderArray.indexOf(targetFam.gender || '保密') !== -1 ? this.data.genderArray.indexOf(targetFam.gender || '保密') : 0
      });
    } else {
      // 本人模式
      const user = wx.getStorageSync('userProfile') || {};
      this.setData({
        currentMode: '本人',
        userInfo: user,
        genderIndex: this.data.genderArray.indexOf(user.gender || '保密') !== -1 ? this.data.genderArray.indexOf(user.gender || '保密') : 0
      });
    }
  },

  // 修改资料时，判断是存给自己还是存给家人！
  updateProfile(key, value) {
    this.setData({ [`userInfo.${key}`]: value });

    const currentPatient = wx.getStorageSync('currentPatient');
    if (currentPatient) {
      // 🧱 当前是家人模式，把修改的资料存入家属数组中
      let family = wx.getStorageSync('familyProfiles') || [];
      let idx = family.findIndex(f => f.id === currentPatient.id);
      if (idx > -1) {
        if (key === 'realName') family[idx].name = value; 
        else family[idx][key] = value;
        
        wx.setStorageSync('familyProfiles', family);
        wx.setStorageSync('currentPatient', family[idx]); // 同步更新当前身份缓存
        this.setData({ familyProfiles: family, currentMode: family[idx].name });
      }
    } else {
      // 🧱 当前是本人模式，正常存入主账号
      wx.setStorageSync('userProfile', this.data.userInfo);
    }
  },

  onChooseAvatar(e) { this.updateProfile('avatarUrl', e.detail.avatarUrl); },
  onNameInput(e) { this.updateProfile('realName', e.detail.value); },
  onGenderChange(e) {
    const index = e.detail.value;
    this.setData({ genderIndex: index });
    this.updateProfile('gender', this.data.genderArray[index]);
  },

  viewHistory() { 
    wx.navigateTo({ url: '/pages/history/history' }); 
  },

  addFamilyMember() {
    wx.showModal({
      title: '添加家人',
      editable: true,
      placeholderText: '请输入称呼 (如: 爷爷, 宝宝)',
      success: (res) => {
        if (res.confirm && res.content) {
          let family = this.data.familyProfiles;
          family.push({
            id: 'fam_' + Date.now(), 
            name: res.content,
            avatarUrl: '', // 预留独立头像位置
            gender: ''     // 预留独立性别位置
          });
          wx.setStorageSync('familyProfiles', family);
          this.setData({ familyProfiles: family });
          wx.showToast({ title: '添加成功', icon: 'success' });
        }
      }
    });
  },

  handleFamilyClick(e) {
    const item = e.currentTarget.dataset.item;
    // 🌟 核心修改：在原生底部弹窗里，加了一个红色的删除选项
    wx.showActionSheet({
      itemList: ['📋 查看TA的历史记录', '📷 切换为TA进行拍牙检测', '🗑️ 删除此家人'],
      itemColor: '#333333',
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.navigateTo({ url: `/pages/history/history?familyId=${item.id}&name=${item.name}` });
        } else if (res.tapIndex === 1) {
          wx.setStorageSync('currentPatient', item); 
          wx.showToast({ title: `已切换至: ${item.name}`, icon: 'success' });
          this.onShow(); 
        } else if (res.tapIndex === 2) {
          
          // 🌟 核心删除与保护逻辑
          wx.showModal({
            title: '确认删除',
            content: `确定要移除家人 [${item.name}] 的健康档案吗？`,
            confirmColor: '#FF4D4F',
            success: (sm) => {
              if (sm.confirm) {
                let family = this.data.familyProfiles;
                let idx = family.findIndex(f => f.id === item.id);
                if (idx > -1) {
                  family.splice(idx, 1);
                  wx.setStorageSync('familyProfiles', family);
                  
                  // 🚨 关键防崩溃保护：如果删除了“当前正在操作的家属”，强行切回“本人模式”
                  const currentPatient = wx.getStorageSync('currentPatient');
                  if (currentPatient && currentPatient.id === item.id) {
                    wx.removeStorageSync('currentPatient');
                  }
                  
                  wx.showToast({ title: '已删除', icon: 'success' });
                  this.onShow(); // 重新加载页面，瞬间刷新
                }
              }
            }
          });

        }
      }
    });
  },

  switchToMain() {
    if (this.data.currentMode === '本人') {
      wx.showToast({ title: '当前已经是本人啦', icon: 'none' });
      return;
    }
    wx.removeStorageSync('currentPatient'); 
    wx.showToast({ title: '已切换回本人档案', icon: 'success' });
    this.onShow(); 
  }
});