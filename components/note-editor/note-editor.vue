<template>
  <view class="note-editor-wrapper">
    <!-- 工具栏 -->
    <view class="toolbar-container" id="toolbar-container"></view>

    <!-- 编辑区域 -->
    <view class="editor-area">
      <view id="editor-container" class="editor-content"></view>
    </view>

    <!-- 底部状态栏 -->
    <view class="status-bar">
      <text class="status-text">{{ autoSaveStatus }}</text>
      <text class="status-text">字数: {{ wordCount }}</text>
    </view>
  </view>
</template>

<script>
  import Quill from 'quill';
  import { storageApi } from '@/common/note-api.js';

  export default {
    name: 'NoteEditor',
    props: {
      value: { type: String, default: '' },
      readonly: { type: Boolean, default: false },
      autoSaveStatus: { type: String, default: '' },
      enableAutoSave: { type: Boolean, default: true }
    },
    data() {
      return {
        quill: null,
        wordCount: 0,
        autoSaveTimer: null
      };
    },
    watch: {
      value(newVal) {
        if (this.quill) {
          const current = this.quill.root.innerHTML;
          if (newVal !== current) {
            this.quill.root.innerHTML = newVal;
          }
        }
      }
    },
    mounted() {
      this.initEditor();
      if (this.enableAutoSave) {
        this.startAutoSave();
      }
    },
    beforeDestroy() {
      this.stopAutoSave();
      if (this.quill) {
        this.quill.disable();
        this.quill = null;
      }
    },
    methods: {
      initEditor() {
        const toolbarOptions = [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          ['link', 'image', 'video'],
          ['clean']
        ];

        this.quill = new Quill('#editor-container', {
          theme: 'snow',
          readOnly: this.readonly,
          placeholder: '开始写笔记...',
          modules: {
            toolbar: {
              container: toolbarOptions,
              handlers: {
                image: this.imageHandler
              }
            }
          }
        });

        // 设置初始内容
        if (this.value) {
          this.quill.clipboard.dangerouslyPasteHTML(this.value);
        }

        // 监听输入变化
        this.quill.on('text-change', () => {
          const html = this.quill.root.innerHTML;
          const text = this.quill.getText().replace(/\n$/, '');
          this.wordCount = text.length;
          this.$emit('input', { html, text });
        });
      },

      async imageHandler() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
          const file = input.files[0];
          if (!file) return;

          uni.showLoading({ title: '上传中...' });
          try {
            const pathRes = await storageApi.getUploadPath({
              fileType: file.type,
              fileName: file.name
            });
            if (pathRes.code !== 0) {
              uni.showToast({ title: pathRes.msg, icon: 'none' });
              return;
            }
            const base64 = await this._fileToBase64(file);
            const uploadRes = await storageApi.uploadFile({
              fileBase64: base64,
              fileName: file.name,
              cloudPath: pathRes.cloudPath
            });
            if (uploadRes.code !== 0) {
              uni.showToast({ title: uploadRes.msg, icon: 'none' });
              return;
            }
            const urlRes = await storageApi.getTempFileURL({
              fileList: [uploadRes.fileID]
            });
            if (urlRes.code === 0 && urlRes.data && urlRes.data.length > 0) {
              const url = urlRes.data[0].tempFileURL;
              const range = this.quill.getSelection(true);
              this.quill.insertEmbed(range.index, 'image', url);
              this.$emit('image-inserted', url);
            } else {
              uni.showToast({ title: '获取图片链接失败', icon: 'none' });
            }
          } catch (e) {
            uni.showToast({ title: '上传失败: ' + e.message, icon: 'none' });
          }
          uni.hideLoading();
        };
      },

      _fileToBase64(file) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      },

      getHtml() {
        if (!this.quill) return Promise.resolve('');
        return Promise.resolve(this.quill.root.innerHTML);
      },

      getPlainText() {
        if (!this.quill) return Promise.resolve('');
        return Promise.resolve(this.quill.getText().replace(/\n$/, ''));
      },

      setHtml(html) {
        if (this.quill) {
          this.quill.clipboard.dangerouslyPasteHTML(html || '');
        }
      },

      startAutoSave() {
        this.autoSaveTimer = setInterval(async () => {
          const html = await this.getHtml();
          if (html && html !== '<p><br></p>') {
            this.$emit('auto-save', html);
          }
        }, 30000);
      },

      stopAutoSave() {
        if (this.autoSaveTimer) {
          clearInterval(this.autoSaveTimer);
          this.autoSaveTimer = null;
        }
      }
    }
  };
</script>

<style scoped>
  .note-editor-wrapper {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f5f5f5;
  }

  .toolbar-container {
    background: #fff;
  }

  .editor-area {
    flex: 1;
    background: #fff;
    margin: 8px;
    border-radius: 4px;
    overflow: hidden;
  }

  .editor-content {
    height: 100%;
    font-size: 16px;
  }

  .status-bar {
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
    background: #fff;
    border-top: 1px solid #e0e0e0;
  }

  .status-text {
    font-size: 12px;
    color: #999;
  }
</style>
