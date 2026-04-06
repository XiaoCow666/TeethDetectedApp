const db = wx.cloud.database({ env: 'cloud1-4gjcsw2vb1218641' });
const videoCollection = db.collection('videos_collection');

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '刚刚';
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return '刚刚'; 
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'; 
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'; 
  if (diff < 2592000000) return Math.floor(diff / 86400000) + '天前'; 
  
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const now = Date.now();
const defaultVideos = [
  { 
    id: 1, title: '洗牙不是伤牙，是给牙齿做深度大扫除', 
    desc: '很多人对洗牙有误解，觉得会伤牙、让牙缝变大，其实恰恰相反。洗牙是用专业方式清除牙结石、牙菌斑，改善牙龈出血、口臭、牙周炎症，保护牙龈不萎缩。定期洗牙，才是维护牙齿健康最基础也最有效的方式',
    cover: '', url: 'cloud://cloud1-4gjcsw2vb1218641.636c-cloud1-4gjcsw2vb1218641-1408642439/洗牙.mp4', 
    likes: Math.floor(Math.random() * 401) + 100, views: Math.floor(Math.random() * 401) + 100, isLiked: false,
    comments: [
      { id: 101, nickname: '护牙小达人', avatar: 'https://ui-avatars.com/api/?name=护牙&background=FFB6C1&color=fff', content: '医生讲得很透彻，每年洗一次牙真的很有必要！', timestamp: now - 3600000, time: '1小时前', likeCount: 86, isLiked: false, replies: [], showReplies: false },
      { id: 102, nickname: '怕疼星人', avatar: 'https://ui-avatars.com/api/?name=怕疼&background=87CEFA&color=fff', content: '一直以为洗牙会让牙缝变大，原来都是因为原先牙结石太多了！', timestamp: now - 10800000, time: '3小时前', likeCount: 42, isLiked: false, replies: [], showReplies: false }
    ]
  },
  { 
    id: 2, title: '牙医不说的秘密：牙线比牙刷更重要', 
    desc: '很多人觉得刷完牙就干净了，其实牙缝里的残渣牙刷根本碰不到。只用刷牙不配合牙线，很容易藏污纳垢，形成蛀牙和口臭。每天坚持用牙线清理牙缝，能有效清除牙菌斑，保护牙龈，让牙齿更健康，这才是完整的口腔护理。',
    cover: '', url: 'cloud://cloud1-4gjcsw2vb1218641.636c-cloud1-4gjcsw2vb1218641-1408642439/牙线.mp4', 
    likes: Math.floor(Math.random() * 401) + 100, views: Math.floor(Math.random() * 401) + 100, isLiked: false,
    comments: [
      { id: 201, nickname: '吃货不长胖', avatar: 'https://ui-avatars.com/api/?name=吃货&background=FFD700&color=fff', content: '水牙线可以代替普通牙线吗？感觉普通的好难操作。', timestamp: now - 1800000, time: '半小时前', likeCount: 12, isLiked: false, replies: [], showReplies: false }
    ]
  },
  { 
    id: 3, title: '智齿发炎太难受，别硬扛拖延', 
    desc: '智齿不是必留牙，位置不正、反复发炎、顶坏邻牙、塞牙难清洁，都建议尽早拔除。别等疼到睡不着、牙龈肿到张不开嘴才处理，早拔少受罪，还能保护好牙不被蛀坏。',
    cover: '', url: 'cloud://cloud1-4gjcsw2vb1218641.636c-cloud1-4gjcsw2vb1218641-1408642439/智齿.mp4', 
    likes: Math.floor(Math.random() * 401) + 100, views: Math.floor(Math.random() * 401) + 100, isLiked: false,
    comments: [
      { id: 301, nickname: '小李不熬夜', avatar: 'https://ui-avatars.com/api/?name=小李&background=98FB98&color=fff', content: '正在发炎，疼得睡不着，明天一早就去拔！😭', timestamp: now - 600000, time: '10分钟前', likeCount: 304, isLiked: false, replies: [], showReplies: false }
    ]
  },
  { 
    id: 4, title: '美白牙膏越刷越白？别再交智商税了！', 
    desc: '依赖美白牙膏想让牙齿变白，效果微乎其微。别再盲目买美白牙膏，选对方式才能科学美白。',
    cover: '', url: 'cloud://cloud1-4gjcsw2vb1218641.636c-cloud1-4gjcsw2vb1218641-1408642439/美白.mp4', 
    likes: Math.floor(Math.random() * 401) + 100, views: Math.floor(Math.random() * 401) + 100, isLiked: false,
    comments: [
      { id: 401, nickname: '美妆爱好者', avatar: 'https://ui-avatars.com/api/?name=美妆&background=DDA0DD&color=fff', content: '天哪，原来我一直交了这么多智商税...', timestamp: now - 3600000, time: '1小时前', likeCount: 56, isLiked: false, replies: [], showReplies: false }
    ]
  },
  { 
    id: 5, title: '喝冷水牙酸难忍？牙齿敏感这样救！', 
    desc: '遇冷牙齿酸软，是牙齿敏感的信号，多因刷牙用力过度致楔状缺损。若酸痛持续要及时就医。',
    cover: '', url: 'cloud://cloud1-4gjcsw2vb1218641.636c-cloud1-4gjcsw2vb1218641-1408642439/牙齿敏感.mp4', 
    likes: Math.floor(Math.random() * 401) + 100, views: Math.floor(Math.random() * 401) + 100, isLiked: false,
    comments: [
      { id: 501, nickname: '夏天爱吃冰', avatar: 'https://ui-avatars.com/api/?name=吃冰&background=00CED1&color=fff', content: '对对对！一吃冰淇淋就酸倒牙，太痛苦了！', timestamp: now - 1200000, time: '20分钟前', likeCount: 201, isLiked: false, replies: [], showReplies: false }
    ]
  },
  { 
    id: 6, title: '天天刷牙还蛀牙？多半是刷牙方式错了!', 
    desc: '每日刷牙仍长蛀牙，大概率是刷牙方法不对。国际通用的巴氏刷牙法才是有效选择，刷毛与牙齿呈 45 度角对准牙龈交界处，小幅度水平震颤，每次刷牙不少于 3 分钟。若把控不好时间，可使用小程序刷牙计时器，跟着节奏科学刷牙，远离蛀牙困扰。',
    cover: '', url: 'cloud://cloud1-4gjcsw2vb1218641.636c-cloud1-4gjcsw2vb1218641-1408642439/刷牙刷对了吗.mp4', 
    likes: Math.floor(Math.random() * 401) + 200, views: Math.floor(Math.random() * 801) + 300, isLiked: false,
    comments: [
      { id: 601, nickname: '想变美的考研党', avatar: 'https://ui-avatars.com/api/?name=考研&background=FFB6C1&color=fff', content: '一直有这个困扰', timestamp: now - 3600000, time: '1小时前', likeCount: 234, isLiked: false, replies: [], showReplies: false },
      { id: 602, nickname: '钢牙小白', avatar: 'https://ui-avatars.com/api/?name=小白&background=87CEFA&color=fff', content: '知道了道理什么时候开始都不晚。', timestamp: now - 10800000, time: '3小时前', likeCount: 112, isLiked: false, replies: [], showReplies: false },
      { id: 603, nickname: '爱笑的橘子', avatar: 'https://ui-avatars.com/api/?name=橘子&background=FFD700&color=fff', content: '天天用小程序的刷牙计时器，学会巴氏刷牙法！', timestamp: now - 18000000, time: '5小时前', likeCount: 67, isLiked: false, replies: [], showReplies: false }
    ]
  }
];

Page({
  data: {
    currentIndex: 0,
    showComment: false, 
    activeVideoIndex: 0, 
    commentInput: '', 
    replyTargetIndex: '', 
    replyTargetName: '',  
    inputFocus: false, 
    videos: [],
    myName: '我', 
    myAvatar: '/assets/icons/mine.png',
    keyboardHeight: 0 
  },

  onLoad() {
    wx.showLoading({ title: '加载频道...', mask: true });
    
    let myAvatar = '/assets/icons/mine.png';
    let myName = '我';
    const currentPatient = wx.getStorageSync('currentPatient');
    if (currentPatient) {
      const family = wx.getStorageSync('familyProfiles') || [];
      const targetFam = family.find(f => f.id === currentPatient.id) || currentPatient;
      if (targetFam.avatarUrl) myAvatar = targetFam.avatarUrl;
      if (targetFam.name) myName = targetFam.name;
    } else {
      const userProfile = wx.getStorageSync('userProfile');
      if (userProfile) {
        if (userProfile.avatarUrl) myAvatar = userProfile.avatarUrl;
        if (userProfile.nickName || userProfile.realName) myName = userProfile.nickName || userProfile.realName;
      }
    }
    this.setData({ myName, myAvatar });

    this.initDatabase();
  },

  onShow() {
    if (this.data.videos && this.data.videos.length > 0) {
      this.fetchVideosFromDB();
    }
  },

  onReady() {
    setTimeout(() => {
      this.playCurrentVideo(this.data.currentIndex);
    }, 1000);
  },

  initDatabase() {
    videoCollection.get({
      success: res => {
        let dbVideos = res.data || [];
        let promises = [];
        
        defaultVideos.forEach(defaultVideo => {
          let exists = dbVideos.find(v => v.id === defaultVideo.id);
          if (!exists) {
            promises.push(videoCollection.add({ data: defaultVideo }));
          }
        });

        if (promises.length > 0) {
          Promise.all(promises).then(() => {
            this.fetchVideosFromDB(); 
          });
        } else {
          this.setData({ videos: dbVideos }, () => {
            this.resolveVideoUrls();
            this.incrementView(this.data.currentIndex);
          });
        }
      },
      fail: err => {
        console.error("数据库读取失败", err);
        wx.hideLoading();
      }
    });
  },

  fetchVideosFromDB() {
    videoCollection.get({
      success: res => {
        this.setData({ videos: res.data }, () => {
          this.resolveVideoUrls();
        });
      }
    });
  },

  resolveVideoUrls() {
    const cloudUrls = this.data.videos.map(v => v.url).filter(url => url && url.startsWith('cloud://'));
    if (cloudUrls.length === 0) {
      wx.hideLoading();
      return; 
    }

    wx.cloud.getTempFileURL({
      fileList: cloudUrls,
      success: res => {
        let tempIndex = 0;
        const realVideos = this.data.videos.map(v => {
          if (v.url && v.url.startsWith('cloud://')) {
            const fileRes = res.fileList[tempIndex];
            tempIndex++;
            if (fileRes && fileRes.status === 0) {
              v.url = fileRes.tempFileURL;
            }
          }
          
          if(v.comments) {
            v.comments.forEach(c => {
              if(!c.replies) c.replies = [];
              if (c.timestamp) c.time = formatRelativeTime(c.timestamp);
              
              c.replies.forEach(r => {
                if (r.timestamp) r.time = formatRelativeTime(r.timestamp);
              });
            })
          }
          return v;
        });
        this.setData({ videos: realVideos });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  incrementView(index) {
    if (this.data.videos.length === 0) return;
    let currentVideo = this.data.videos[index];
    let newViews = (currentVideo.views || 0) + 1;

    this.setData({ [`videos[${index}].views`]: newViews });

    if (currentVideo._id) {
      videoCollection.doc(currentVideo._id).update({ data: { views: newViews } });
    }
  },

  onSwiperChange(e) {
    const newIndex = e.detail.current;
    this.pauseVideo(this.data.currentIndex); 
    this.setData({ 
      currentIndex: newIndex,
      showComment: false,
      replyTargetName: '', 
      replyTargetIndex: '',
      inputFocus: false,
      keyboardHeight: 0 
    }); 
    this.playCurrentVideo(newIndex); 
    this.incrementView(newIndex);
  },

  playCurrentVideo(index) {
    const videoContext = wx.createVideoContext(`video_${index}`);
    if (videoContext) videoContext.play();
  },

  pauseVideo(index) {
    const videoContext = wx.createVideoContext(`video_${index}`);
    if (videoContext) videoContext.pause();
  },

  handleLike(e) {
    const index = e.currentTarget.dataset.index;
    const video = this.data.videos[index];
    const newLikeState = !video.isLiked;
    const newLikesCount = newLikeState ? video.likes + 1 : video.likes - 1;

    this.setData({ 
      [`videos[${index}].isLiked`]: newLikeState, 
      [`videos[${index}].likes`]: newLikesCount 
    });

    videoCollection.doc(video._id).update({
      data: { isLiked: newLikeState, likes: newLikesCount }
    });
  },

  openComment(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ showComment: true, activeVideoIndex: index });
  },

  closeComment() {
    this.setData({ showComment: false, replyTargetName: '', replyTargetIndex: '', inputFocus: false, commentInput: '', keyboardHeight: 0 });
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  onKeyboardHeightChange(e) {
    this.setData({
      keyboardHeight: e.detail.height || 0
    });
  },

  onInputBlur() {
    this.setData({
      inputFocus: false,
      keyboardHeight: 0
    });
  },

  onCmtAvatarError(e) {
    const cIndex = e.currentTarget.dataset.cindex;
    const vIndex = this.data.activeVideoIndex;
    this.setData({ [`videos[${vIndex}].comments[${cIndex}].avatar`]: '/assets/icons/mine.png' });
  },

  onReplyAvatarError(e) {
    const cIndex = e.currentTarget.dataset.cindex;
    const rIndex = e.currentTarget.dataset.rindex;
    const vIndex = this.data.activeVideoIndex;
    this.setData({ [`videos[${vIndex}].comments[${cIndex}].replies[${rIndex}].avatar`]: '/assets/icons/mine.png' });
  },

  toggleReplies(e) {
    const cIndex = e.currentTarget.dataset.cindex;
    const vIndex = this.data.activeVideoIndex;
    const key = `videos[${vIndex}].comments[${cIndex}].showReplies`;
    const currentState = this.data.videos[vIndex].comments[cIndex].showReplies;
    this.setData({ [key]: !currentState });
  },

  tapReply(e) {
    const cIndex = e.currentTarget.dataset.cindex;
    const nickname = e.currentTarget.dataset.nickname;
    this.setData({
      replyTargetIndex: cIndex,  
      replyTargetName: nickname, 
      inputFocus: true 
    });
  },

  async submitComment() {
    if (!this.data.commentInput.trim()) {
      wx.showToast({ title: '写点什么吧~', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '发送中...', mask: true });

    let finalAvatar = this.data.myAvatar || '/assets/icons/mine.png';
    
    // 如果检测到头像是本地临时文件（wxfile:// 或 http://tmp/）
    // 就强制把它先上传到云开发存储中，换取真实的云端地址
    if (finalAvatar.startsWith('wxfile://') || finalAvatar.startsWith('http://tmp/') || finalAvatar.startsWith('https://tmp/')) {
      try {
        const cloudPath = 'user_avatars/' + Date.now() + '-' + Math.floor(Math.random() * 1000) + '.png';
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: finalAvatar
        });
        finalAvatar = uploadRes.fileID; // 拿到 cloud:// 的真实网络路径
        this.setData({ myAvatar: finalAvatar }); // 存到本地，下次发评论就不用再传了
      } catch (err) {
        console.error('头像静默上传云端失败:', err);
        finalAvatar = '/assets/icons/mine.png'; // 传失败了就兜底用默认头像
      }
    }

    const index = this.data.activeVideoIndex;
    const videoId = this.data.videos[index]._id;
    const currentTimestamp = Date.now();

    const newComment = {
      id: currentTimestamp,
      nickname: this.data.myName, 
      avatar: finalAvatar,
      content: this.data.commentInput,
      timestamp: currentTimestamp, 
      time: '刚刚',                
      likeCount: 0,
      isLiked: false,
      replies: [],
      showReplies: false
    };

    if (this.data.replyTargetIndex !== '' && this.data.replyTargetIndex !== undefined) {
      let cIndex = this.data.replyTargetIndex;
      let cmts = this.data.videos[index].comments;
      if(!cmts[cIndex].replies) cmts[cIndex].replies = [];
      
      let targetName = this.data.replyTargetName;
      if (targetName === cmts[cIndex].nickname) targetName = '';
      newComment.replyTo = targetName;

      cmts[cIndex].replies.push(newComment);
      cmts[cIndex].showReplies = true; 
      
      this.setData({
        [`videos[${index}].comments`]: cmts,
        commentInput: '', replyTargetName: '', replyTargetIndex: '', inputFocus: false, keyboardHeight: 0
      });
    } else {
      const updatedComments = [newComment, ...this.data.videos[index].comments];
      this.setData({
        [`videos[${index}].comments`]: updatedComments,
        commentInput: '', replyTargetName: '', replyTargetIndex: '', inputFocus: false, keyboardHeight: 0
      });
    }

    // 更新到云端数据库
    videoCollection.doc(videoId).update({
      data: { comments: this.data.videos[index].comments },
      success: () => {
        wx.hideLoading();
        wx.showToast({ title: '评论成功', icon: 'success' });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '评论失败', icon: 'none' });
      }
    });
  },

  likeComment(e) {
    const cIndex = e.currentTarget.dataset.cindex;
    const vIndex = this.data.activeVideoIndex;
    const video = this.data.videos[vIndex];
    let cmt = video.comments[cIndex];
    
    let newLikeState = !cmt.isLiked;
    let currentCount = parseInt(cmt.likeCount) || 0;
    let newCount = newLikeState ? (currentCount + 1) : Math.max(0, currentCount - 1);
    
    let updateData = {
      [`videos[${vIndex}].comments[${cIndex}].isLiked`]: newLikeState,
      [`videos[${vIndex}].comments[${cIndex}].likeCount`]: newCount,
    };
    
    this.setData(updateData, () => {
      videoCollection.doc(video._id).update({
        data: { comments: this.data.videos[vIndex].comments }
      });
    });
  },

  deleteComment(e) {
    const cIndex = e.currentTarget.dataset.cindex;
    const vIndex = this.data.activeVideoIndex;
    const video = this.data.videos[vIndex];
    
    wx.showModal({
      title: '提示',
      content: '确定要删除这条评论吗？',
      confirmColor: '#FF4D4F',
      success: (res) => {
        if(res.confirm) {
          let cmts = video.comments;
          cmts.splice(cIndex, 1);
          this.setData({
            [`videos[${vIndex}].comments`]: cmts
          }, () => {
            videoCollection.doc(video._id).update({
              data: { comments: this.data.videos[vIndex].comments }
            });
          });
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    })
  },

  deleteReply(e) {
    const cIndex = e.currentTarget.dataset.cindex;
    const rIndex = e.currentTarget.dataset.rindex;
    const vIndex = this.data.activeVideoIndex;
    const video = this.data.videos[vIndex];

    wx.showModal({
      title: '提示', content: '删除这条回复？', confirmColor: '#FF4D4F',
      success: (res) => {
        if(res.confirm) {
          let cmts = video.comments;
          cmts[cIndex].replies.splice(rIndex, 1);
          this.setData({ [`videos[${vIndex}].comments`]: cmts }, () => {
            videoCollection.doc(video._id).update({
              data: { comments: this.data.videos[vIndex].comments }
            });
          });
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    })
  },

  onShareAppMessage(options) {
    if (options.from === 'button' && options.target.dataset.video) {
      const videoInfo = options.target.dataset.video;
      return { title: videoInfo.title, imageUrl: videoInfo.cover, path: '/pages/videoList/videoList' }
    }
    return { title: '刷不停的口腔科普小课堂！', path: '/pages/videoList/videoList' }
  }
});