// 笔记云对象调用封装
const noteCo = uniCloud.importObject('note-co', {
  customUI: true
});

const storageCo = uniCloud.importObject('storage-co', {
  customUI: true
});

/**
 * 笔记 API 封装
 */
export const noteApi = {
  // 创建笔记
  async create(data) {
    return noteCo.create(data);
  },

  // 获取笔记详情
  async getNote(id) {
    return noteCo.getNote(id);
  },

  // 更新笔记
  async updateNote(id, data) {
    return noteCo.updateNote(id, data);
  },

  // 删除笔记
  async deleteNote(id) {
    return noteCo.deleteNote(id);
  },

  // 获取笔记列表
  async listNotes(params) {
    return noteCo.listNotes(params);
  },

  // 获取分类列表
  async listCategories() {
    return noteCo.listCategories();
  },

  // 创建分类
  async createCategory(data) {
    return noteCo.createCategory(data);
  },

  // 更新分类
  async updateCategory(id, data) {
    return noteCo.updateCategory(id, data);
  },

  // 删除分类
  async deleteCategory(id) {
    return noteCo.deleteCategory(id);
  },

  // 获取版本历史
  async getVersionHistory(noteId) {
    return noteCo.getVersionHistory(noteId);
  },

  // 回滚到指定版本
  async rollbackToVersion(noteId, versionNumber) {
    return noteCo.rollbackToVersion(noteId, versionNumber);
  },

  // 创建分享链接
  async createShare(noteId, options) {
    return noteCo.createShare(noteId, options);
  },

  // 通过分享码访问笔记（无需登录）
  async getSharedNote(shareCode) {
    return noteCo.getSharedNote(shareCode);
  }
};

/**
 * 存储 API 封装
 */
export const storageApi = {
  // 获取上传路径
  async getUploadPath(data) {
    return storageCo.getUploadPath(data);
  },

  // 上传文件
  async uploadFile(data) {
    return storageCo.uploadFile(data);
  },

  // 获取临时链接
  async getTempFileURL(data) {
    return storageCo.getTempFileURL(data);
  },

  // 删除文件
  async deleteFile(data) {
    return storageCo.deleteFile(data);
  }
};
