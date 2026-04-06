// 顶部初始化数据库，保证保存功能畅通无阻
const db = wx.cloud.database({ env: 'cloud1-4gjcsw2vb1218641' });

Page({
  data: {
    timeLeft: 120, 
    timeString: "02:00",
    isRunning: false,
    currentStage: 0, 
    instruction: "巴氏护齿引擎已就绪 ⚡"
  },
  timer: null,

  formatTime(seconds) {
    let m = Math.floor(seconds / 60).toString().padStart(2, '0');
    let s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  //  点击右上角跳转统计页
  goToStats() {
    wx.navigateTo({ url: '/pages/brushStats/brushStats' });
  },

  // 将刷牙时长存入云端数据库
  saveBrushRecord(duration) {
    if (duration < 15) return; // 刷少于15秒视为无效把戏，不记录
    const cp = wx.getStorageSync('currentPatient');
    const pid = cp ? cp.id : 'main';
    
    db.collection('brush_records').add({
      data: { 
        patientId: pid, 
        duration: duration, 
        createTime: db.serverDate() 
      }
    });
  },

  toggleTimer() {
    if (this.data.isRunning) {
      clearInterval(this.timer);
      this.setData({ isRunning: false, instruction: "系统挂起，点击恢复运行" });
    } else {
      this.setData({ isRunning: true });
      wx.vibrateShort({ type: 'medium' }); 
      
      if (this.data.timeLeft === 120) {
        this.updateStageLogic(120);
      }
      
      this.timer = setInterval(() => {
        let newTime = this.data.timeLeft - 1;
        
        if (newTime <= 0) {
          clearInterval(this.timer);
          this.setData({ 
            isRunning: false, 
            timeString: "00:00", 
            currentStage: 6,
            instruction: "✅ 深度清洁完成，数据已记录" 
          });
          wx.vibrateLong(); 
          
          // 倒计时走完，完美保存 120 秒！
          this.saveBrushRecord(120);
          return;
        }

        this.updateStageLogic(newTime);
      }, 1000);
    }
  },

  updateStageLogic(newTime) {
    let stage = this.data.currentStage;
    let hint = this.data.instruction;

    if (newTime <= 120 && newTime > 100) {
      stage = 1;
      hint = "阶段 1/6：上颌外侧 (45°朝向牙龈，小幅颤动)";
    } else if (newTime <= 100 && newTime > 80) {
      stage = 2;
      hint = "阶段 2/6：上颌内侧 (保持45°角，微震并向下拂刷)";
    } else if (newTime <= 80 && newTime > 60) {
      stage = 3;
      hint = "阶段 3/6：下颌外侧 (45°朝向牙龈，微震并向上拂刷)";
    } else if (newTime <= 60 && newTime > 40) {
      stage = 4;
      hint = "阶段 4/6：下颌内侧 (深入盲区，继续保持小幅颤动)";
    } else if (newTime <= 40 && newTime > 20) {
      stage = 5;
      hint = "阶段 5/6：咬合面 (刷毛垂直贴合，稍用力水平颤动)";
    } else if (newTime <= 20 && newTime > 0) {
      stage = 6;
      hint = "阶段 6/6：门牙内侧与舌苔 (刷柄竖起，上下拂刷)";
    }

    if ([100, 80, 60, 40, 20].includes(newTime)) {
      wx.vibrateShort({ type: 'heavy' });
      setTimeout(() => { wx.vibrateShort({ type: 'heavy' }); }, 300);
    }

    this.setData({
      timeLeft: newTime,
      timeString: this.formatTime(newTime),
      currentStage: stage,
      instruction: hint
    });
  },

  resetTimer() {
    clearInterval(this.timer);
    wx.vibrateShort({ type: 'light' });
    
    // 中途点击重置退出的时间结算
    const timeSpent = 120 - this.data.timeLeft;
    if (timeSpent >= 15) {
      this.saveBrushRecord(timeSpent);
      wx.showToast({ title: '已为您记录有效时长', icon: 'none' });
    }

    this.setData({
      timeLeft: 120,
      timeString: "02:00",
      isRunning: false,
      currentStage: 0,
      instruction: "巴氏护齿引擎已就绪 ⚡"
    });
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
    const timeSpent = 120 - this.data.timeLeft;
    if (timeSpent >= 15 && timeSpent < 120) { 
      this.saveBrushRecord(timeSpent);
    }
  }
});