<template>
  <view class="share-page">
    <view class="share-form">
      <view class="form-item">
        <text class="label">查看模式</text>
        <radio-group @change="onModeChange">
          <label v-for="mode in modes" :key="mode.value" class="radio-item">
            <radio :value="mode.value" :checked="viewMode === mode.value" />
            <text>{{ mode.text }}</text>
          </label>
        </radio-group>
      </view>

      <view class="form-item">
        <text class="label">过期时间</text>
        <picker mode="date" @change="onDateChange">
          <view class="picker-value">
            {{ expireDate ? formatDate(expireDate) : '永久有效' }}
          </view>
        </picker>
      </view>

      <button type="primary" @tap="createShareLink" :loading="creating">
        创建分享链接
      </button>

      <view v-if="shareCode" class="share-result">
        <text class="result-title">分享链接已创建</text>
        <view class="share-code">
          <text class="code-text">{{ shareCode }}</text>
          <button size="mini" type="default" @tap="copyLink">复制链接</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  import { noteApi } from '@/common/note-api.js';

  export default {
    data() {
      return {
        noteId: '',
        viewMode: 'read_only',
        expireDate: '',
        shareCode: '',
        creating: false,
        modes: [
          { text: '只读', value: 'read_only' },
          { text: '可编辑', value: 'editable' }
        ]
      };
    },
    onLoad(options) {
      if (options.id) {
        this.noteId = options.id;
      }
    },
    methods: {
      onModeChange(e) {
        this.viewMode = e.detail.value;
      },
      onDateChange(e) {
        this.expireDate = new Date(e.detail.value).getTime();
      },
      async createShareLink() {
        this.creating = true;
        try {
          const res = await noteApi.createShare(this.noteId, {
            view_mode: this.viewMode,
            expire_date: this.expireDate || null
          });
          if (res.code === 0) {
            this.shareCode = res.share_code;
            uni.showToast({ title: res.msg, icon: 'success' });
          } else {
            uni.showToast({ title: res.msg, icon: 'none' });
          }
        } catch (e) {
          uni.showToast({ title: '创建失败', icon: 'none' });
        }
        this.creating = false;
      },
      copyLink() {
        const baseUrl = ''; // TODO: 替换为实际的网页托管域名
        const url = `${baseUrl}/#/pages/share/view?code=${this.shareCode}`;
        uni.setClipboardData({
          data: url,
          success: () => {
            uni.showToast({ title: '链接已复制', icon: 'success' });
          }
        });
      },
      formatDate(ts) {
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
  };
</script>

<style scoped>
  .share-page {
    padding: 20px;
    min-height: 100vh;
    background: #f5f5f5;
  }

  .share-form {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
  }

  .form-item {
    margin-bottom: 20px;
  }

  .label {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 8px;
    display: block;
  }

  .radio-item {
    display: flex;
    align-items: center;
    padding: 8px 0;
  }

  .radio-item text {
    margin-left: 8px;
  }

  .picker-value {
    height: 40px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    color: #333;
  }

  .share-result {
    margin-top: 20px;
    padding: 16px;
    background: #f0f7ff;
    border-radius: 4px;
  }

  .result-title {
    font-size: 16px;
    font-weight: bold;
    display: block;
    margin-bottom: 12px;
  }

  .share-code {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    padding: 8px 12px;
    border-radius: 4px;
  }

  .code-text {
    font-family: monospace;
    font-size: 18px;
    font-weight: bold;
    color: [1296db](pages/note/detail.vue#L12);
  }
</style>
