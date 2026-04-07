const API_KEY = '2119252f91594ad9a51b6fa2869391b5.MrmTdK6yt1jJWnPb'; 
const APP_ID = '2041036538376302592'; 

Page({
  data: {
    displayList: [], 
    inputValue: '',
    bottomId: '',
    userInfo: {},
    isWaiting: false,
    conversationId: ''  
  },

  onLoad(options) {
    const user = wx.getStorageSync('userProfile') || {};
    this.setData({ userInfo: user });
    const score = options.score || 100;
    const issues = options.issues || '未见异常';
    const firstPrompt = `我刚刚在小程序完成了口腔拍照检测，AI得分为 ${score}分，提示的问题有：${issues}。请基于这个结果，主动跟我打招呼并询问我的感受。`;
    this.initAgentConversation(firstPrompt);
  },

  // ================= 第一步：创建云端记忆会话 =================
  initAgentConversation(firstPrompt) {
    this.setData({ isWaiting: true });
    wx.showNavigationBarLoading();

    wx.request({
      url: `https://open.bigmodel.cn/api/llm-application/open/v2/application/${APP_ID}/conversation`,
      method: 'POST',
      header: { 'Authorization': `Bearer ${API_KEY}` },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          // 成功获取到云端记忆 ID
          this.setData({ conversationId: res.data.data.conversation_id });
          // 创建成功后，自动发送隐式的病历数据
          this.sendToAgent(firstPrompt, true);
        } else {
          this.handleError("会话创建失败：" + JSON.stringify(res.data));
        }
      },
      fail: () => this.handleError("网络连接失败，请检查网络")
    });
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  sendMessage() {
    const text = this.data.inputValue.trim();
    if (!text || this.data.isWaiting) return;
    // 发送用户手动输入的话
    this.sendToAgent(text, false);
  },

  // ================= 第二步：生成请求任务 =================
  sendToAgent(text, isHidden) {
    if (!isHidden) {
      // 正常聊天，先把用户的话显示到屏幕上
      this.setData({
        displayList: [...this.data.displayList, { role: 'user', content: text }],
        inputValue: '',
        isWaiting: true,
        bottomId: 'bottom-anchor'
      });
    }

    wx.request({
      url: 'https://open.bigmodel.cn/api/llm-application/open/v2/application/generate_request_id',
      method: 'POST',
      header: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        app_id: APP_ID,
        conversation_id: this.data.conversationId,
        key_value_pairs: [{
          id: "user",
          type: "input",
          name: "用户提问",
          value: text
        }]
      },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          // 拿到任务 ID，进入最后一步：流式读取
          const reqId = res.data.data.id;
          this.readSSEStream(reqId);
        } else {
          this.handleError("请求生成失败：" + JSON.stringify(res.data));
        }
      },
      fail: () => this.handleError("网络请求失败")
    });
  },

  // ================= 第三步：SSE 流式“打字机”读取 =================
  readSSEStream(reqId) {
    // 提前在界面上创建一个空的 AI 气泡，准备逐字填入
    const msgIndex = this.data.displayList.length;
    this.setData({
      displayList: [...this.data.displayList, { role: 'assistant', content: '' }],
      bottomId: 'bottom-anchor'
    });

    // 开启微信原生的 Chunked 流式接收
    const requestTask = wx.request({
      url: `https://open.bigmodel.cn/api/llm-application/open/v2/model-api/${reqId}/sse-invoke`,
      method: 'POST',
      header: { 
        'Authorization': `Bearer ${API_KEY}`, 
        'Accept': 'text/event-stream' 
      },
      enableChunked: true, // 🌟 核心：开启流式分块读取
      success: () => {
        this.setData({ isWaiting: false });
        wx.hideNavigationBarLoading();
      },
      fail: () => this.handleError("流式接收中断")
    });

    let currentReply = '';
    let buffer = '';

    // 实时监听智谱传回来的每一个字
    requestTask.onChunkReceived((res) => {
      const uint8Array = new Uint8Array(res.data);
      let text = '';
      
      // 微信小程序 UTF-8 极速解码
      try {
        text = new TextDecoder('utf-8').decode(uint8Array, { stream: true });
      } catch (e) {
        for (let i = 0; i < uint8Array.length; i++) {
          text += String.fromCharCode(uint8Array[i]);
        }
        try { text = decodeURIComponent(escape(text)); } catch(err) {}
      }

      buffer += text;
      let lines = buffer.split('\n');
      buffer = lines.pop(); // 保留被截断的最后一行在缓存里

      lines.forEach(line => {
        if (line.startsWith('data:')) {
          const dataStr = line.replace('data:', '').trim();
          if (dataStr) {
            try {
              const dataObj = JSON.parse(dataStr);
              // 提取里面的 msg 字段
              if (dataObj.msg) {
                currentReply += dataObj.msg;
                // 实时动态更新到屏幕上，实现打字机效果！
                const key = `displayList[${msgIndex}].content`;
                this.setData({
                  [key]: currentReply,
                  bottomId: 'bottom-anchor'
                });
              }
            } catch(e) {}
          }
        }
      });
    });
  },

  handleError(errMsg) {
    this.setData({
      displayList: [...this.data.displayList, { role: 'assistant', content: errMsg }],
      isWaiting: false,
      bottomId: 'bottom-anchor'
    });
    wx.hideNavigationBarLoading();
  }
});