<template>
  <view class="version-page">
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <view v-else-if="versions.length === 0" class="empty-state">
      <text>暂无版本历史</text>
    </view>

    <scroll-view v-else class="version-list" scroll-y>
      <view
        v-for="(ver, index) in versions"
        :key="ver._id"
        class="version-item"
      >
        <view class="version-header">
          <text class="version-number">V{{ ver.version_number }}</text>
          <text class="version-type">{{ ver.change_type === 'auto_save' ? '自动保存' : ver.change_type === 'publish' ? '发布' : '手动保存' }}</text>
          <text class="version-date">{{ formatDate(ver.create_date) }}</text>
        </view>
        <view class="version-summary" v-if="ver.diff_summary">
          <text>{{ ver.diff_summary }}</text>
        </view>
        <view class="version-actions">
          <button size="mini" type="default" @tap="previewVersion(ver)">预览</button>
          <button
            size="mini"
            type="warn"
            @tap="rollbackVersion(ver.version_number)"
            :disabled="index === 0"
          >
            回滚到此版本
          </button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
  import { noteApi } from '@/common/note-api.js';

  export default {
    data() {
      return {
        noteId: '',
        versions: [],
        loading: true
      };
    },
    onLoad(options) {
      if (options.id) {
        this.noteId = options.id;
        this.loadVersions();
      }
    },
    methods: {
      async loadVersions() {
        try {
          const res = await noteApi.getVersionHistory(this.noteId);
          if (res.code === 0) {
            this.versions = res.data;
          }
        } catch (e) {
          uni.showToast({ title: '加载失败', icon: 'none' });
        }
        this.loading = false;
      },
      previewVersion(ver) {
        uni.showModal({
          title: `版本 V${ver.version_number}`,
          content: `标题: ${ver.title_snapshot}\n内容长度: ${(ver.content_snapshot || '').length} 字符`,
          showCancel: false
        });
      },
      async rollbackVersion(versionNumber) {
        uni.showModal({
          title: '确认回滚',
          content: `确定回滚到版本 V${versionNumber}？当前内容将被覆盖。`,
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ title: '回滚中...' });
              const result = await noteApi.rollbackToVersion(this.noteId, versionNumber);
              uni.hideLoading();
              if (result.code === 0) {
                uni.showToast({ title: '回滚成功', icon: 'success' });
                setTimeout(() => {
                  uni.navigateBack();
                }, 1500);
              } else {
                uni.showToast({ title: result.msg, icon: 'none' });
              }
            }
          }
        });
      },
      formatDate(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }
  };
</script>

<style scoped>
  .version-page {
    min-height: 100vh;
    background: #f5f5f5;
  }

  .loading-state, .empty-state {
    text-align: center;
    padding: 60px 0;
    color: #999;
  }

  .version-list {
    padding: 12px;
  }

  .version-item {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 8px;
  }

  .version-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .version-number {
    font-size: 16px;
    font-weight: bold;
    margin-right: 8px;
  }

  .version-type {
    font-size: 12px;
    padding: 2px 8px;
    background: #e3f2fd;
    color: #1976d2;
    border-radius: 4px;
    margin-right: auto;
  }

  .version-date {
    font-size: 12px;
    color: #999;
  }

  .version-summary {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
    padding: 8px;
    background: #f9f9f9;
    border-radius: 4px;
  }

  .version-actions {
    display: flex;
    gap: 8px;
  }
</style>
