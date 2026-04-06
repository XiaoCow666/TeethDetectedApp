const db = wx.cloud.database({ env: 'cloud1-4gjcsw2vb1218641' });

Page({
  data: {
    records: [],
    totalDays: 0,
    todayTimes: 0,
    avgDuration: 0
  },

  onShow() {
    this.fetchData();
  },

  fetchData() {
    wx.showLoading({ title: '加载数据中...' });
    const cp = wx.getStorageSync('currentPatient');
    const pid = cp ? cp.id : 'main';

    db.collection('brush_records').where({ patientId: pid })
      .orderBy('createTime', 'desc').limit(50).get({
      success: res => {
        wx.hideLoading();
        this.processData(res.data);
      },
      fail: err => {
        wx.hideLoading();
        // 即使请求失败，也必须渲染空图表防止白屏
        this.processData([]); 
      }
    });
  },

  processData(data) {
    let today = new Date().toDateString();
    let todayCount = 0;
    let totalDur = 0;
    let uniqueDays = new Set();
    
    // 初始化7天的坐标轴
    let chartMap = {};
    for(let i=6; i>=0; i--) {
      let d = new Date();
      d.setDate(d.getDate() - i);
      chartMap[`${d.getMonth()+1}/${d.getDate()}`] = 0;
    }

    let formattedRecords = [];

    // 如果有数据才处理
    if (data && data.length > 0) {
      formattedRecords = data.map(r => {
        const d = new Date(r.createTime);
        const dateStr = d.toDateString();
        const shortDate = `${d.getMonth()+1}/${d.getDate()}`;
        
        uniqueDays.add(dateStr);
        totalDur += r.duration;
        if (dateStr === today) todayCount++;
        
        if(chartMap[shortDate] !== undefined) {
          chartMap[shortDate] += r.duration;
        }

        return {
          ...r,
          displayDate: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
          displayTime: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
        };
      });
    }

    const chartData = Object.keys(chartMap).map(k => ({ date: k, score: chartMap[k] }));

    this.setData({
      records: formattedRecords,
      totalDays: uniqueDays.size,
      todayTimes: todayCount,
      avgDuration: data && data.length > 0 ? Math.floor(totalDur / data.length) : 0
    });

    // 延迟一点画图，确保 WXML 中的 Canvas 节点已经完全挂载
    setTimeout(() => {
      this.drawChart(chartData);
    }, 300);
  },

  drawChart(chartData) {
    const query = wx.createSelectorQuery();
    query.select('#brushChart').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0]) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      ctx.scale(dpr, dpr);
      
      const w = res[0].width;
      const h = res[0].height;
      const padLeft = 40; const padBottom = 30;
      const gap = (w - padLeft - 20) / Math.max(chartData.length - 1, 1);
      
      ctx.clearRect(0, 0, w, h);
      
      // 画虚线底网
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      [0, 120, 240].forEach(val => {
        const y = (h - padBottom) - (val / 240) * (h - padBottom - 20);
        ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(w, y); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px sans-serif';
        ctx.fillText(val + 's', 0, y + 4);
      });
      ctx.setLineDash([]);
      
      // 绘制渐变曲线
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(0, 230, 184, 0.4)');
      grad.addColorStop(1, 'rgba(0, 230, 184, 0)');
      
      ctx.beginPath();
      chartData.forEach((d, i) => {
        const x = padLeft + i * gap;
        const val = Math.min(d.score, 240); // 封顶高度
        const y = (h - padBottom) - (val / 240) * (h - padBottom - 20);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.lineTo(padLeft + (chartData.length - 1) * gap, h - padBottom);
      ctx.lineTo(padLeft, h - padBottom);
      ctx.fillStyle = grad; ctx.fill();
      
      // 描边与圆点
      chartData.forEach((d, i) => {
        const x = padLeft + i * gap;
        const val = Math.min(d.score, 240);
        const y = (h - padBottom) - (val / 240) * (h - padBottom - 20);
        
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '10px sans-serif';
        ctx.fillText(d.date, x - 12, h - 5);

        if (i > 0) {
          ctx.beginPath();
          const prevVal = Math.min(chartData[i-1].score, 240);
          ctx.moveTo(padLeft + (i - 1) * gap, (h - padBottom) - (prevVal / 240) * (h - padBottom - 20));
          ctx.lineTo(x, y);
          ctx.strokeStyle = '#00E6B8'; ctx.lineWidth = 3; ctx.stroke();
        }
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      });
    });
  }
});