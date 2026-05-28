<template>
  <view class="note-edit-page">
    <!-- 顶部操作栏 -->
    <view class="action-bar">
      <button size="mini" type="default" @tap="goBack" style="margin:0;">返回</button>
      <view class="action-buttons">
        <button size="mini" type="default" @tap="saveDraft">存草稿</button>
        <button size="mini" type="primary" @tap="publishNote">发布</button>
      </view>
    </view>

    <!-- 标题输入 -->
    <view class="title-input">
      <input
        v-model="title"
        placeholder="输入笔记标题"
        class="title-field"
        maxlength="200"
      />
    </view>

    <!-- 分类和标签 -->
    <view class="meta-bar">
      <picker mode="selector" :range="categories" range-key="name" @change="onCategoryChange">
        <view class="meta-item">
          <text class="meta-label">分类:</text>
          <text class="meta-value">{{ currentCategoryName || '未选择' }}</text>
        </view>
      </picker>
      <view class="meta-divider"></view>
      <view class="meta-item" @tap="editTags">
        <text class="meta-label">标签:</text>
        <text class="meta-value">{{ tags.length > 0 ? tags.join(', ') : '点击添加' }}</text>
      </view>
    </view>

    <!-- 编辑器 -->
    <note-editor
      ref="editor"
      :value="content"
      :enable-auto-save="true"
      auto-save-status="autoSaveStatus"
      @auto-save="onAutoSave"
      @image-inserted="onImageInserted"
    ></note-editor>
  </view>
</template>

<script>
  import NoteEditor from '@/components/note-editor/note-editor.vue';
  import { noteApi } from '@/common/note-api.js';

  export default {
    components: {
      NoteEditor
    },
    data() {
      return {
        noteId: '',
        title: '',
        content: '',
        category_id: '',
        tags: [],
        categories: [],
        autoSaveStatus: '',
        autoSaveTimer: null,
        isSaving: false
      };
    },
    computed: {
      currentCategoryName() {
        const cat = this.categories.find(c => c._id === this.category_id);
        return cat ? cat.name : '';
      }
    },
    onLoad(options) {
      if (options.id) {
        this.noteId = options.id;
        this.loadNote(options.id);
      }
      this.loadCategories();
    },
    onUnload() {
      this.stopAutoSave();
    },
    methods: {
      async loadNote(id) {
        uni.showLoading({ title: '加载中...' });
        try {
          const res = await noteApi.getNote(id);
          if (res.code === 0) {
            this.title = res.data.title;
            this.content = res.data.content;
            this.category_id = res.data.category_id || '';
            this.tags = res.data.tags || [];
          } else {
            uni.showToast({ title: res.msg, icon: 'none' });
          }
        } catch (e) {
          uni.showToast({ title: '加载失败', icon: 'none' });
        }
        uni.hideLoading();
      },
      async loadCategories() {
        const res = await noteApi.listCategories();
        if (res.code === 0) {
          this.categories = res.data || [];
        }
      },
      onCategoryChange(e) {
        const index = e.detail.value;
        this.category_id = this.categories[index]._id;
      },
      editTags() {
        uni.showModal({
          title: '编辑标签',
          editableText: true,
          placeholderText: '输入标签，用逗号分隔',
          content: this.tags.join(', '),
          success: (res) => {
            if (res.confirm) {
              this.tags = res.content.split(',').map(t => t.trim()).filter(t => t);
            }
          }
        });
      },
      async onAutoSave(html) {
        if (this.isSaving || !this.noteId) return;
        this.isSaving = true;
        this.autoSaveStatus = '保存中...';

        try {
          await noteApi.updateNote(this.noteId, {
            content: html,
            changeType: 'auto_save'
          });
          this.autoSaveStatus = '已自动保存';
        } catch (e) {
          this.autoSaveStatus = '保存失败';
        }

        setTimeout(() => {
          this.autoSaveStatus = '';
        }, 3000);
        this.isSaving = false;
      },
      async saveDraft() {
        const html = await this.$refs.editor.getHtml();
        const text = await this.$refs.editor.getPlainText();

        uni.showLoading({ title: '保存中...' });

        try {
          if (this.noteId) {
            await noteApi.updateNote(this.noteId, {
              title: this.title,
              content: html,
              plain_text: text,
              word_count: text.length,
              category_id: this.category_id,
              tags: this.tags,
              status: 0
            });
          } else {
            const res = await noteApi.create({
              title: this.title,
              content: html,
              category_id: this.category_id,
              tags: this.tags,
              status: 0
            });
            if (res.code === 0) {
              this.noteId = res.id;
            }
          }
          uni.showToast({ title: '草稿已保存', icon: 'success' });
          uni.$emit('note-saved');
        } catch (e) {
          uni.showToast({ title: '保存失败', icon: 'none' });
        }

        uni.hideLoading();
      },
      async publishNote() {
        const html = await this.$refs.editor.getHtml();
        const text = await this.$refs.editor.getPlainText();

        if (!this.title.trim()) {
          uni.showToast({ title: '请输入标题', icon: 'none' });
          return;
        }

        uni.showLoading({ title: '发布中...' });

        try {
          if (this.noteId) {
            await noteApi.updateNote(this.noteId, {
              title: this.title,
              content: html,
              plain_text: text,
              word_count: text.length,
              category_id: this.category_id,
              tags: this.tags,
              status: 1
            });
          } else {
            const res = await noteApi.create({
              title: this.title,
              content: html,
              category_id: this.category_id,
              tags: this.tags,
              status: 1
            });
            if (res.code === 0) {
              this.noteId = res.id;
            }
          }
          uni.showToast({ title: '发布成功', icon: 'success' });
          uni.$emit('note-saved');
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } catch (e) {
          uni.showToast({ title: '发布失败', icon: 'none' });
        }

        uni.hideLoading();
      },
      goBack() {
        uni.navigateBack();
      }
    }
  };
</script>

<style scoped>
  .note-edit-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f5f5f5;
  }

  .action-bar {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .title-input {
    padding: 12px;
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
  }

  .title-field {
    font-size: 20px;
    font-weight: bold;
    width: 100%;
  }

  .meta-bar {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
  }

  .meta-item {
    display: flex;
    align-items: center;
    font-size: 14px;
  }

  .meta-label {
    color: #999;
    margin-right: 4px;
  }

  .meta-value {
    color: #333;
  }

  .meta-divider {
    width: 1px;
    height: 16px;
    background: #e0e0e0;
    margin: 0 12px;
  }
</style>
