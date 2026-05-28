function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

function generateShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function createVersion(noteId, note, versionNumber, changeType, diffSummary) {
  const db = uniCloud.database();
  await db.collection('note_version').add({
    note_id: noteId,
    title_snapshot: note.title,
    content_snapshot: note.content,
    version_number: versionNumber,
    change_type: changeType,
    diff_summary: diffSummary || '',
    create_date: Date.now()
  });
}

module.exports = {
  _before: async function() {
    // 单用户模式，无需鉴权
  },

  /**
   * 创建笔记
   */
  async create(data) {
    const db = uniCloud.database();
    const plainText = stripHtml(data.content || '');
    const note = {
      title: data.title,
      content: data.content || '',
      plain_text: plainText,
      category_id: data.category_id || '',
      tags: data.tags || [],
      status: data.status !== undefined ? data.status : 0,
      cover_image: data.cover_image || '',
      word_count: plainText.length,
      create_date: Date.now(),
      update_date: Date.now()
    };

    const res = await db.collection('note').add(note);

    // 创建首个版本快照
    await createVersion(res.id, note, 1, 'manual');

    return { code: 0, msg: '创建成功', id: res.id };
  },

  /**
   * 获取笔记详情
   */
  async getNote(id) {
    const db = uniCloud.database();
    const res = await db.collection('note').doc(id).get();
    if (!res.data || res.data.length === 0) {
      return { code: 404, msg: '笔记不存在' };
    }

    return { code: 0, data: res.data[0] };
  },

  /**
   * 更新笔记
   */
  async updateNote(id, data) {
    const db = uniCloud.database();
    const noteRes = await db.collection('note').doc(id).get();
    if (!noteRes.data || noteRes.data.length === 0) {
      return { code: 404, msg: '笔记不存在' };
    }

    const note = noteRes.data[0];

    // 如果修改了内容，更新纯文本和字数
    if (data.content !== undefined) {
      data.plain_text = stripHtml(data.content);
      data.word_count = data.plain_text.length;
    }
    data.update_date = Date.now();

    await db.collection('note').doc(id).update(data);

    // 创建新版本快照
    const mergedNote = { ...note, ...data };
    const versionRes = await db.collection('note_version')
      .where({ note_id: id }).orderBy('version_number', 'desc').limit(1).get();
    const nextVersion = (versionRes.data && versionRes.data.length > 0)
      ? versionRes.data[0].version_number + 1 : 1;

    await createVersion(id, mergedNote, nextVersion, data.changeType || 'manual', data.diff_summary);

    return { code: 0, msg: '更新成功' };
  },

  /**
   * 删除笔记（软删除）
   */
  async deleteNote(id) {
    const db = uniCloud.database();
    await db.collection('note').doc(id).update({
      status: 2,
      update_date: Date.now()
    });

    return { code: 0, msg: '删除成功' };
  },

  /**
   * 获取笔记列表（分页、搜索、筛选）
   */
  async listNotes(params = {}) {
    const {
      keyword = '',
      category_id = '',
      tag = '',
      status = '',
      page = 1,
      pageSize = 20
    } = params;

    const db = uniCloud.database();
    const dbCmd = db.command;

    let where = { status: dbCmd.neq(2) };

    if (status !== '') {
      where.status = parseInt(status);
    }
    if (category_id) {
      where.category_id = category_id;
    }
    if (tag) {
      where.tags = tag;
    }

    // 关键词搜索（plain_text 模糊匹配）
    if (keyword) {
      where.plain_text = new RegExp(keyword, 'i');
    }

    const collection = db.collection('note');
    const countRes = await collection.where(where).count();
    const total = countRes.total;

    const dataRes = await collection
      .where(where)
      .orderBy('update_date', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    return {
      code: 0,
      data: dataRes.data,
      total,
      page,
      pageSize
    };
  },

  /**
   * 获取版本历史
   */
  async getVersionHistory(noteId) {
    const db = uniCloud.database();
    const res = await db.collection('note_version')
      .where({ note_id: noteId })
      .orderBy('version_number', 'desc')
      .get();

    return { code: 0, data: res.data };
  },

  /**
   * 回滚到指定版本
   */
  async rollbackToVersion(noteId, versionNumber) {
    const db = uniCloud.database();
    const versionRes = await db.collection('note_version')
      .where({ note_id: noteId, version_number: versionNumber }).get();

    if (!versionRes.data || versionRes.data.length === 0) {
      return { code: 404, msg: '版本不存在' };
    }

    const snapshot = versionRes.data[0];

    await db.collection('note').doc(noteId).update({
      title: snapshot.title_snapshot,
      content: snapshot.content_snapshot,
      plain_text: stripHtml(snapshot.content_snapshot),
      word_count: stripHtml(snapshot.content_snapshot).length,
      update_date: Date.now()
    });

    return { code: 0, msg: '回滚成功' };
  },

  /**
   * 创建分享链接
   */
  async createShare(noteId, options = {}) {
    const db = uniCloud.database();
    const shareCode = generateShareCode();

    const share = {
      note_id: noteId,
      share_code: shareCode,
      view_mode: options.view_mode || 'read_only',
      expire_date: options.expire_date || null,
      is_active: true,
      create_date: Date.now()
    };

    await db.collection('note_share').add(share);

    // 同时更新笔记的 is_public 和 share_id
    await db.collection('note').doc(noteId).update({
      is_public: true,
      share_id: shareCode
    });

    return { code: 0, share_code: shareCode, msg: '分享链接创建成功' };
  },

  /**
   * 通过分享码访问笔记（公开接口，无需登录）
   */
  async getSharedNote(shareCode) {
    const db = uniCloud.database();
    const dbCmd = db.command;

    const shareRes = await db.collection('note_share')
      .where({ share_code: shareCode, is_active: true }).get();

    if (!shareRes.data || shareRes.data.length === 0) {
      return { code: 404, msg: '分享链接不存在或已失效' };
    }

    const share = shareRes.data[0];

    // 检查过期
    if (share.expire_date && share.expire_date < Date.now()) {
      return { code: 410, msg: '分享链接已过期' };
    }

    // 获取笔记内容
    const noteRes = await db.collection('note').doc(share.note_id).get();
    if (!noteRes.data || noteRes.data.length === 0) {
      return { code: 404, msg: '笔记已被删除' };
    }

    // 访问计数 +1
    db.collection('note_share').doc(share._id).update({
      view_count: dbCmd.inc(1)
    });

    const note = noteRes.data[0];
    return {
      code: 0,
      data: {
        title: note.title,
        content: note.content,
        view_mode: share.view_mode,
        create_date: note.create_date,
        update_date: note.update_date
      }
    };
  },

  /**
   * 获取分类列表
   */
  async listCategories() {
    const db = uniCloud.database();
    const res = await db.collection('note_category')
      .orderBy('sort', 'asc')
      .get();

    return { code: 0, data: res.data };
  },

  /**
   * 创建分类
   */
  async createCategory(data) {
    const db = uniCloud.database();
    const res = await db.collection('note_category').add({
      name: data.name,
      icon: data.icon || '',
      color: data.color || '#1296db',
      parent_id: data.parent_id || '',
      is_public: data.is_public || false,
      sort: data.sort || 0,
      create_date: Date.now(),
      update_date: Date.now()
    });

    return { code: 0, msg: '创建成功', id: res.id };
  },

  /**
   * 更新分类
   */
  async updateCategory(id, data) {
    const db = uniCloud.database();
    await db.collection('note_category').doc(id).update({
      ...data,
      update_date: Date.now()
    });

    return { code: 0, msg: '更新成功' };
  },

  /**
   * 删除分类
   */
  async deleteCategory(id) {
    const db = uniCloud.database();
    await db.collection('note_category').doc(id).remove();

    return { code: 0, msg: '删除成功' };
  }
};
