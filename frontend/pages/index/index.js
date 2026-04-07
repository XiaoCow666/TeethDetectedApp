const db = wx.cloud.database({ env: 'cloud1-4gjcsw2vb1218641' });

//小贴士题库
const tipsArray = [
  "巴氏刷牙法：刷毛与牙齿呈45度角，小幅度震颤哦！",
  "饭后建议使用牙线，牙签容易导致牙缝变大。",
  "半年到一年洗一次牙，是预防牙周炎的最佳方式。",
  "晚上刷牙后千万不要再进食啦，尤其是含糖饮料！",
  "牙齿敏感？试试抗敏感牙膏，并避免冷热交替饮食。",
  "刷牙别太用力，轻柔清洁才能保护牙龈不受伤。",
  "儿童建议使用含氟牙膏，有效预防蛀牙更安心。",
  "舌苔也要清洁哦，能减少口腔细菌和口臭。",
  "多喝水保持口腔湿润，帮助冲刷食物残渣。",
  "少吃坚硬零食，避免牙齿崩裂或磨损。",
  "矫正期更要认真清洁，防止托槽周围蛀牙。",
  "智齿发炎要及时就医，不要硬扛拖延哦。",
  "晨起先刷牙再吃饭，减少细菌进入肠胃。",
  "假牙每天清洁浸泡，保持卫生更舒适。"
];

Page({
  data: {
    banners: [
      {
        image: "cloud://cloud1-4gjcsw2vb1218641.636c-cloud1-4gjcsw2vb1218641-1408642439/早筛.png",
        title: "AI 智能口腔早筛",
        subtitle: "3秒极速出报告，随时掌握牙齿健康"
      },
      {
        image: "cloud://cloud1-4gjcsw2vb1218641.636c-cloud1-4gjcsw2vb1218641-1408642439/9大病理.png",
        title: "9 大病理精准定位",
        subtitle: "深度识别龋齿、结石等潜在隐患"
      },
      {
        image: "cloud://cloud1-4gjcsw2vb1218641.636c-cloud1-4gjcsw2vb1218641-1408642439/笑容.png",
        title: "关注口腔 绽放自信",
        subtitle: "专业级 AI 辅助诊断，为您的笑容护航"
      }
    ],
    videos: [
      { 
        id: 1, 
        title: '洗牙不是伤牙，是给牙齿做深度大扫除', 
        cover: '', 
        url: 'cloud://cloud1-4gjcsw2vb1218641.636c-cloud1-4gjcsw2vb1218641-1408642439/洗牙.mp4', 
        views: '1.2w' 
      },
      { 
        id: 2, 
        title: '牙医不说的秘密：牙线比牙刷更重要', 
        cover: '', 
        url: 'cloud://cloud1-4gjcsw2vb1218641.636c-cloud1-4gjcsw2vb1218641-1408642439/牙线.mp4', 
        views: '8000+' 
      }
    ],
    userInfo: {},
    dailyTip: '',
    latestScore: '--',
    hasData: false
  },
  
  onShow() { 
    const currentPatient = wx.getStorageSync('currentPatient');
    
    if (currentPatient) {
      const family = wx.getStorageSync('familyProfiles') || [];
      const targetFam = family.find(f => f.id === currentPatient.id) || currentPatient;
      this.setData({ 
        userInfo: {
          avatarUrl: targetFam.avatarUrl || '', 
          realName: targetFam.name + ' 的档案'
        }
      });
    } else {
      const userProfile = wx.getStorageSync('userProfile') || {};
      this.setData({ userInfo: userProfile });
    }

    this.fetchTrendData(); 
    this.setData({
      dailyTip: tipsArray[Math.floor(Math.random() * tipsArray.length)]
    });
    this.syncVideosFromDB();
  },

  syncVideosFromDB() {
    db.collection('videos_collection').limit(2).get({
      success: res => {
        if (res.data && res.data.length > 0) {
          this.setData({ videos: res.data }, () => {
            this.resolveVideoUrls();
          });
        } else {
          this.resolveVideoUrls();
        }
      },
      fail: err => {
        console.error('同步云端视频失败', err);
        this.resolveVideoUrls();
      }
    });
  },

  resolveVideoUrls() {
    const fileList = this.data.videos.map(v => v.url);
    if(fileList.length === 0) return;
    wx.cloud.getTempFileURL({
      fileList: fileList,
      success: res => {
        const realVideos = this.data.videos.map((v, index) => {
          if (res.fileList[index] && res.fileList[index].status === 0) {
            return { ...v, url: res.fileList[index].tempFileURL };
          }
          return v;
        });
        this.setData({ videos: realVideos });
      },
      fail: err => console.error('转换视频链接失败', err)
    });
  },
  
  startScreening() { wx.navigateTo({ url: '/pages/camera/camera' }); },
  goToHistory() { wx.navigateTo({ url: '/pages/history/history' }); },
  goToTimer() { wx.navigateTo({ url: '/pages/timer/timer' }); },
  goToForum() { wx.navigateTo({ url: '/pages/forum/forum' }); },
  goToMine() { wx.switchTab({ url: '/pages/mine/mine' }); },
  showWIP() { wx.navigateTo({ url: '/pages/videoList/videoList' }); },

  fetchTrendData() {
    const currentPatient = wx.getStorageSync('currentPatient');
    const patientId = currentPatient ? currentPatient.id : 'main';

    db.collection('records')
      .where({ patientId: patientId }) 
      .orderBy('createTime', 'desc')
      .limit(7)
      .get({
        success: res => {
          if (res.data.length > 0) {
            const latest = res.data[0].report.health_score;
            this.setData({ hasData: true, latestScore: latest });
            
            const chartData = res.data.reverse().map(item => ({
              score: item.report.health_score,
              date: `${new Date(item.createTime).getMonth() + 1}/${new Date(item.createTime).getDate()}`
            }));
            this.drawTrendChart(chartData);
          } else {
            this.setData({ hasData: false, latestScore: '--' });
          }
        }
    });
  },

  drawTrendChart(chartData) {
    const query = wx.createSelectorQuery();
    query.select('#trendChart').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      ctx.scale(dpr, dpr);
      
      const w = res[0].width;
      const h = res[0].height;
      const pad = 30;
      const gap = (w - pad * 2) / Math.max(chartData.length - 1, 1);
      
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      
      [0, 50, 100].forEach(val => {
        const y = (h - pad) - (val / 100) * (h - pad * 2);
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
        ctx.fillStyle = '#999'; ctx.font = '10px sans-serif'; ctx.fillText(val, 0, y + 4);
      });
      
      ctx.setLineDash([]);
      ctx.fillStyle = '#999';
      chartData.forEach((d, i) => {
        const x = pad + i * gap;
        ctx.fillText(d.date, x - 10, h - 5);
      });
      
      if (chartData.length < 2) return;
      
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(0, 191, 165, 0.2)');
      grad.addColorStop(1, 'rgba(0, 191, 165, 0)');
      
      ctx.beginPath();
      chartData.forEach((d, i) => {
        const x = pad + i * gap;
        const y = (h - pad) - (d.score / 100) * (h - pad * 2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.lineTo(pad + (chartData.length - 1) * gap, h - pad);
      ctx.lineTo(pad, h - pad);
      ctx.fillStyle = grad; ctx.fill();
      
      chartData.forEach((d, i) => {
        const x = pad + i * gap;
        const y = (h - pad) - (d.score / 100) * (h - pad * 2);
        const color = d.score >= 90 ? '#00BFA5' : (d.score >= 70 ? '#FF9800' : '#F44336');
        
        if (i > 0) {
          ctx.beginPath();
          ctx.moveTo(pad + (i - 1) * gap, (h - pad) - (chartData[i-1].score / 100) * (h - pad * 2));
          ctx.lineTo(x, y);
          ctx.strokeStyle = '#D1EAE6'; ctx.lineWidth = 4; ctx.stroke();
        }
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      });
    });
  },
  
  onShareAppMessage(options) {
    if (options.from === 'button' && options.target.dataset.video) {
      const videoInfo = options.target.dataset.video;
      return { title: videoInfo.title, imageUrl: videoInfo.cover, path: '/pages/index/index' }
    }
    return { title: 'AI 口腔极速早筛，快来测测你的牙齿评分！', path: '/pages/index/index' }
  }
  
});
