export const DEFAULT_LOCALE = 'zh-CN' as const;
export const SUPPORTED_LOCALES = ['zh-CN', 'en'] as const;
export const LOCALE_STORAGE_KEY = 'nav-hoard:locale';

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
type TranslationVars = Record<string, string | number | boolean | null | undefined>;

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  'zh-CN': '简体中文',
  en: 'English'
};

const catalogs: Record<SupportedLocale, Record<string, string>> = {
  'zh-CN': {
    'common.brand': 'NavHoard',
    'common.loading': '加载中…',
    'common.retry': '重试',
    'common.clear': '清空',
    'common.close': '关闭',
    'common.save': '保存',
    'common.delete': '删除',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.none': '无',
    'locale.label': '语言',

    'home.notice.favorite_parse_failed': '本地收藏读取失败，已忽略损坏数据。',
    'home.notice.favorite_save_quota': '收藏保存失败：本地存储空间已满，请清理后重试。',
    'home.notice.favorite_save_failed': '收藏保存失败，请稍后重试。',
    'home.notice.hidden_unlocked': '已解锁隐藏内容。',
    'home.notice.favorite_reminder_dismissed': '后续收藏时将不再弹出本地保存提醒。',
    'home.notice.favorite_added_first': '已加入第一次收藏。收藏数据只保存在当前浏览器本地，建议及时导出备份。',
    'home.notice.favorite_added': '已加入收藏。',
    'home.notice.favorite_removed': '已取消收藏。',
    'home.notice.import_no_match': '导入完成，但没有匹配到当前站点中的条目。',
    'home.notice.import_success': '已导入 {count} 条收藏。收藏数据仍只保存在当前浏览器本地。',
    'home.notice.import_failed': '导入失败：文件格式不正确。',
    'home.notice.export_empty': '当前还没有收藏内容可导出。',
    'home.notice.export_success': '已导出收藏备份文件。你可以稍后在任意浏览器中导入它。',
    'home.notice.copy_entry_success': '已复制条目 JSON，可直接粘贴到你的 NavHoard 编辑器或录入流程。',
    'home.notice.copy_link_success': '已复制链接，可直接分享给别人或保存到别处。',
    'home.notice.copy_failed': '复制失败：当前浏览器不允许访问剪贴板。',
    'home.notice.data_load_failed': '数据加载失败，请稍后重试。',

    'home.layout.waterfall': '瀑布流',
    'home.layout.list': '列表',

    'home.empty.favorites.title': '你还没有收藏内容。',
    'home.empty.favorites.hint': '收藏只保存在当前浏览器本地，建议定期导出一份备份文件。',
    'home.empty.favorites.cta': '先去看看全部内容',
    'home.empty.filtered.title': '没有找到符合当前条件的内容。',
    'home.empty.filtered.hint': '可以清空筛选，或者试试更宽松的关键词。',
    'home.empty.filtered.cta': '清空筛选',
    'home.empty.default.title': '暂时还没有可展示的内容。',

    'home.about.aria': '关于 NavHoard',
    'home.about.p1': '这里收录的是公开链接卡片，方便你通过搜索、标签和收藏重新发现内容。',
    'home.about.p2': '收藏状态只保存在当前浏览器本地，不会自动同步；如果准备长期使用，建议定期导出收藏。',
    'home.about.p3': '如果你想把某条内容带到自己的 NavHoard，可以点击卡片复制图标，把条目 JSON 粘贴到编辑器或录入流程里。',

    'home.favorite_reminder.aria': '收藏提醒',
    'home.favorite_reminder.kicker': '收藏提醒',
    'home.favorite_reminder.text': '收藏仅保存在当前浏览器本地，可用“导出收藏 / 导入收藏”备份或迁移。',
    'home.favorite_reminder.dismiss_forever': '不再提醒',

    'home.filters.none_all': '当前未使用筛选，正在展示全部内容{hiddenSuffix}。',
    'home.filters.none_favorites': '当前未使用筛选，正在展示收藏视图{hiddenSuffix}。',
    'home.filters.hidden_suffix': '（含隐藏条目）',
    'home.filters.current': '当前筛选',
    'home.filters.search_pill': '搜索：{query}',
    'home.filters.remove_tag': '移除该标签',
    'home.filters.clear': '清空筛选',

    'home.results.title_all': '结果列表',
    'home.results.title_favorites': '我的收藏',
    'home.results.subtitle': '当前共显示 {visible} 条结果 / {baseLabel}{featuredSuffix}',
    'home.results.base_all': '总计 {count} 条',
    'home.results.base_favorites': '已收藏 {count} 条',
    'home.results.featured_suffix': ' / 含推荐 {count} 条',
    'home.results.visible_count': '{count} 条',

    'home.layout.aria': '切换布局',
    'home.search.heading': '先搜，再筛',
    'home.search.summary': '默认展示推荐和最新内容。',
    'home.search.placeholder': '搜索标题、摘要或标签…',
    'home.search.quick_placeholder': '搜索…',
    'home.search.expand_filters': '展开筛选面板',
    'home.search.collapse_filters': '收起筛选面板',
    'home.search.quick': '快速搜索',
    'home.search.filters_enabled': '已启用筛选',
    'home.search.expand_filters_short': '展开筛选',
    'home.search.collapse_filters_short': '收起筛选',
    'home.search.compact_meta': '{title} · {count}',

    'home.toolbar.view': '视图',
    'home.toolbar.layout': '布局',
    'home.toolbar.sort': '排序',
    'home.toolbar.favorites': '收藏',
    'home.toolbar.all': '全部 ({count})',
    'home.toolbar.favorites_count': '收藏 ({count})',
    'home.toolbar.export_favorites': '导出收藏',
    'home.toolbar.import_favorites': '导入收藏',
    'home.toolbar.sort_relevance': '相关度优先',
    'home.toolbar.sort_newest': '最新优先',
    'home.toolbar.tip_local_only': '收藏只保存在本地浏览器，可随时导入 / 导出。',

    'home.tags.title': '热门标签',
    'home.tags.subtitle': '先搜索，再用标签快速缩小范围。',
    'home.tags.subtitle_compact': '滚动时也能继续细化筛选条件。',
    'home.tags.expand_all': '展开全部 {count} 个标签',
    'home.tags.collapse': '收起标签',
    'home.tags.more_hint': '还有 {count} 个标签未展开。',
    'home.tags.filter_title': '按此标签筛选',

    'home.controls.summary.search': '搜索：{query}',
    'home.controls.summary.all': '全部 {count} 条',
    'home.controls.summary.favorites': '收藏 {count} 条',

    'home.card.copy_entry': '复制条目 JSON，可粘贴到你的 NavHoard 编辑器或录入流程',
    'home.card.copy_link': '复制当前卡片链接，适合直接分享',
    'home.card.favorite_add': '加入收藏',
    'home.card.favorite_remove': '取消收藏',
    'home.card.featured': '作者推荐',
    'home.card.copy_link_button': '复制链接',
    'home.card.preview_alt': '{title} 的预览图',
    'home.card.untitled': '（未命名条目）',
    'home.card.no_url': '未填写 URL',
    'home.card.no_tags': '无标签',

    'home.topbar.title': '公开链接收藏站',
    'home.topbar.about_open': '收起说明',
    'home.topbar.about_closed': 'About',
    'home.notice.dismiss': '知道了',
    'home.footer.summary': '公开链接卡片 · 手动维护 · 收藏只保存在当前浏览器',
    'home.back_to_top': '回到顶部',

    'editor.status.initializing': '正在初始化编辑器…',
    'editor.title.clean': 'NavHoard Editor',
    'editor.title.dirty': 'NavHoard Editor *',
    'editor.notice.created': '已创建空白条目。下一步可以直接填写 URL 后点击同步。',
    'editor.notice.delete_current_confirm': '确认删除当前条目？此操作在保存前可通过刷新页面撤销。',
    'editor.notice.delete_current_done': '已删除当前条目，记得保存。',
    'editor.notice.delete_empty': '请先选择要删除的条目。',
    'editor.notice.delete_bulk_confirm': '确认删除已选中的 {count} 条内容？此操作在保存前可通过刷新页面撤销。',
    'editor.notice.delete_bulk_done': '已删除 {count} 条条目，记得保存。',
    'editor.notice.featured_on': '已置顶当前条目。',
    'editor.notice.featured_off': '已取消置顶，列表仍按创建时间排序。',
    'editor.notice.request_failed': '请求失败',
    'editor.notice.loading_entries': '正在读取当前数据…',
    'editor.notice.loaded_entries': '已加载 {count} 条记录。',
    'editor.notice.load_failed': '加载失败：{message}',
    'editor.notice.saving': '正在保存…',
    'editor.notice.save_failed': '保存失败',
    'editor.notice.saved': '保存成功：共 {total} 条，合并重复 {duplicateCount} 条。',
    'editor.notice.save_failed_with_reason': '保存失败：{message}',
    'editor.notice.select_entry_before_sync': '请先选择或新建一个条目。',
    'editor.notice.fill_url_before_sync': '请先填写 URL，再点击同步。',
    'editor.notice.syncing': '正在同步并抓取页面内容…',
    'editor.notice.sync_success': '同步成功，已自动填充主要字段。',
    'editor.notice.sync_partial': '已完成同步，但部分字段使用了回退结果。',
    'editor.notice.sync_failed': '未抓取到完整内容，已保留可继续手动编辑的草稿。',
    'editor.notice.reason': '原因：{reason}',
    'editor.notice.warnings': '提示：{warnings}',
    'editor.notice.added_tags': '已补充标签：{tags}。',
    'editor.notice.new_tags': '发现新的标签词：{tags}。',
    'editor.notice.sync_failed_with_reason': '同步失败：{message}',
    'editor.notice.read_image_failed': '读取图片失败',
    'editor.notice.select_entry_before_upload': '请先选择一个条目。',
    'editor.notice.uploading_preview': '正在上传预览图…',
    'editor.notice.uploaded_preview': '预览图已上传到 public 目录，可直接保存。',
    'editor.notice.upload_failed': '上传失败：{message}',
    'editor.notice.importing_bookmarks': '正在解析书签文件…',
    'editor.notice.import_bookmarks_empty': '未从该文件中识别到可导入的 HTTP 或 HTTPS 书签。',
    'editor.notice.import_bookmarks_done': '已导入 {count} 条书签，请检查后保存。',
    'editor.notice.import_bookmarks_failed': '导入失败：{message}',
    'editor.notice.external_reload': '检测到外部变更。为避免丢失你当前的修改，将在保存后再刷新页面。',

    'editor.empty.no_suggestions': '没有可推荐的现有标签。',
    'editor.empty.no_matches': '没有匹配条目',
    'editor.empty.no_featured_results': '当前没有置顶条目，或搜索条件未命中置顶内容。',
    'editor.empty.no_search_results': '可以新建条目，或清空搜索条件。',
    'editor.empty.no_tags': '暂无标签，输入后按回车快速添加。',
    'editor.empty.select_entry': '请先选择一个条目。',
    'editor.empty.no_preview': '当前没有预览图',

    'editor.badge.featured': '置顶',
    'editor.badge.hidden': '隐藏',
    'editor.button.unfeature': '取消置顶',
    'editor.button.new': '新建',
    'editor.button.view_all': '查看全部',
    'editor.button.featured_only': '只看置顶',
    'editor.button.bulk_exit': '退出批量',
    'editor.button.bulk_enter': '批量选择',
    'editor.button.bulk_select_all': '全选当前结果',
    'editor.button.bulk_unselect_all': '取消全选',
    'editor.button.bulk_delete': '删除选中',
    'editor.button.bulk_delete_count': '删除选中（{count}）',
    'editor.button.sync': '同步',
    'editor.button.syncing': '同步中…',
    'editor.button.import_bookmarks': '导入书签',
    'editor.button.save_all': '保存全部',
    'editor.button.saving': '保存中…',
    'editor.button.add_tag': '添加',
    'editor.button.upload_preview': '上传预览图',

    'editor.summary.local_editing': '本地编辑 {file}',
    'editor.summary.entries': '当前条目：{entries}；筛选结果：{filtered}{featuredSuffix}',
    'editor.summary.entries_featured_suffix': '；仅看置顶',
    'editor.summary.bulk_selected': '已选 {count} 条，可直接删除。',
    'editor.summary.bulk_hint': '勾选或点击条目来选择待删除项。',
    'editor.summary.form_hint': '保存时会统一执行 URL 规范化、标签清洗、去重、校验，并同步生成发布数据。',
    'editor.summary.tag_count': '{count} 个标签',
    'editor.summary.featured_order_hint': '编辑器列表默认仍严格按创建时间倒序排列；置顶仅作为主站推荐与筛选条件，不会在这里自动上浮。',
    'editor.summary.featured_sort': '排序 {rank}',

    'editor.heading.main': '编辑条目',
    'editor.field.search_placeholder': '搜索标题 / URL / 标签',
    'editor.field.title': '标题',
    'editor.field.url': 'URL',
    'editor.field.source': '来源',
    'editor.field.confidence': '置信度',
    'editor.field.tags': '标签',
    'editor.tags.selected': '已选标签',
    'editor.tags.suggested': '推荐标签',
    'editor.field.tags_placeholder': '输入标签后按回车 / 逗号快速添加',
    'editor.field.summary': '摘要',
    'editor.field.preview_enabled': '启用预览图',
    'editor.field.preview_mode': '预览模式',
    'editor.field.preview_src': '预览图地址',
    'editor.field.preview_alt': '预览图说明',
    'editor.field.created_at': '创建时间',
    'editor.field.updated_at': '更新时间',
    'editor.field.hide': '页面默认隐藏',
    'editor.field.featured': '作者推荐 / 置顶',
    'editor.field.featured_rank': '推荐顺序',
    'editor.field.featured_rank_placeholder': '数字越小越靠前',
    'editor.card.untitled': '（未命名条目）',
    'editor.card.no_url': '未填写 URL',
    'editor.card.no_tags': '无标签'
  },
  en: {
    'common.brand': 'NavHoard',
    'common.loading': 'Loading…',
    'common.retry': 'Retry',
    'common.clear': 'Clear',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.none': 'None',
    'locale.label': 'Language',

    'home.notice.favorite_parse_failed': 'Failed to read local favorites. Corrupted data was ignored.',
    'home.notice.favorite_save_quota': 'Failed to save favorites: local storage is full. Please clean up and try again.',
    'home.notice.favorite_save_failed': 'Failed to save favorites. Please try again later.',
    'home.notice.hidden_unlocked': 'Hidden content unlocked.',
    'home.notice.favorite_reminder_dismissed': 'Favorite storage reminders will no longer appear.',
    'home.notice.favorite_added_first': 'First favorite added. Favorites are stored only in this browser, so exporting a backup is recommended.',
    'home.notice.favorite_added': 'Added to favorites.',
    'home.notice.favorite_removed': 'Removed from favorites.',
    'home.notice.import_no_match': 'Import finished, but no items matched entries on this site.',
    'home.notice.import_success': 'Imported {count} favorites. Favorites are still stored only in this browser.',
    'home.notice.import_failed': 'Import failed: invalid file format.',
    'home.notice.export_empty': 'There are no favorites to export yet.',
    'home.notice.export_success': 'Favorites backup exported. You can import it in any browser later.',
    'home.notice.copy_entry_success': 'Entry JSON copied. You can paste it into your NavHoard editor or intake workflow.',
    'home.notice.copy_link_success': 'Link copied. You can share it or save it elsewhere.',
    'home.notice.copy_failed': 'Copy failed: this browser does not allow clipboard access.',
    'home.notice.data_load_failed': 'Failed to load data. Please try again later.',

    'home.layout.waterfall': 'Waterfall',
    'home.layout.list': 'List',

    'home.empty.favorites.title': 'You do not have any favorites yet.',
    'home.empty.favorites.hint': 'Favorites are stored only in this browser. Exporting a backup from time to time is recommended.',
    'home.empty.favorites.cta': 'Browse all entries first',
    'home.empty.filtered.title': 'No entries match the current filters.',
    'home.empty.filtered.hint': 'Try clearing filters or using broader keywords.',
    'home.empty.filtered.cta': 'Clear filters',
    'home.empty.default.title': 'There is nothing to show yet.',

    'home.about.aria': 'About NavHoard',
    'home.about.p1': 'This page collects public link cards so you can rediscover content through search, tags, and favorites.',
    'home.about.p2': 'Favorite state is stored only in the current browser and is not synced automatically. Exporting favorites is recommended for long-term use.',
    'home.about.p3': 'If you want to bring an item into your own NavHoard, use the copy action on a card and paste the entry JSON into your editor or intake workflow.',

    'home.favorite_reminder.aria': 'Favorite reminder',
    'home.favorite_reminder.kicker': 'Favorite reminder',
    'home.favorite_reminder.text': 'Favorites are stored only in this browser. Use export / import favorites to back them up or move them.',
    'home.favorite_reminder.dismiss_forever': 'Do not remind again',

    'home.filters.none_all': 'No filters are active. Showing all content{hiddenSuffix}.',
    'home.filters.none_favorites': 'No filters are active. Showing favorites{hiddenSuffix}.',
    'home.filters.hidden_suffix': ' (including hidden entries)',
    'home.filters.current': 'Current filters',
    'home.filters.search_pill': 'Search: {query}',
    'home.filters.remove_tag': 'Remove this tag',
    'home.filters.clear': 'Clear filters',

    'home.results.title_all': 'Results',
    'home.results.title_favorites': 'My favorites',
    'home.results.subtitle': 'Showing {visible} results / {baseLabel}{featuredSuffix}',
    'home.results.base_all': '{count} total',
    'home.results.base_favorites': '{count} favorited',
    'home.results.featured_suffix': ' / {count} featured',
    'home.results.visible_count': '{count} results',

    'home.layout.aria': 'Switch layout',
    'home.search.heading': 'Search first, then decide whether filters are needed',
    'home.search.summary': 'Search first, then filter. Featured and fresh picks show by default.',
    'home.search.placeholder': 'Search titles, summaries, or tags, such as React, browser, compiler…',
    'home.search.quick_placeholder': 'Quick search titles, summaries, or tags…',
    'home.search.expand_filters': 'Expand filters',
    'home.search.collapse_filters': 'Collapse filters',
    'home.search.quick': 'Quick search',
    'home.search.filters_enabled': 'Filters active',
    'home.search.expand_filters_short': 'Expand',
    'home.search.collapse_filters_short': 'Collapse',
    'home.search.compact_meta': '{title} · {count}',

    'home.toolbar.view': 'View',
    'home.toolbar.layout': 'Layout',
    'home.toolbar.sort': 'Sort',
    'home.toolbar.favorites': 'Favorites',
    'home.toolbar.all': 'All ({count})',
    'home.toolbar.favorites_count': 'Favorites ({count})',
    'home.toolbar.export_favorites': 'Export favorites',
    'home.toolbar.import_favorites': 'Import favorites',
    'home.toolbar.sort_relevance': 'Relevance first',
    'home.toolbar.sort_newest': 'Newest first',
    'home.toolbar.tip_local_only': 'Favorites are stored only in this browser and can be exported or imported anytime.',

    'home.tags.title': 'Popular tags',
    'home.tags.subtitle': 'Search first, then use tags to narrow the scope quickly.',
    'home.tags.subtitle_compact': 'Keep refining filters while you scroll.',
    'home.tags.expand_all': 'Show all {count} tags',
    'home.tags.collapse': 'Collapse tags',
    'home.tags.more_hint': '{count} more tags are hidden.',
    'home.tags.filter_title': 'Filter by this tag',

    'home.controls.summary.search': 'Search: {query}',
    'home.controls.summary.all': '{count} total',
    'home.controls.summary.favorites': '{count} favorites',

    'home.card.copy_entry': 'Copy entry JSON for use in your NavHoard editor or intake workflow',
    'home.card.copy_link': 'Copy this card link for sharing',
    'home.card.favorite_add': 'Add to favorites',
    'home.card.favorite_remove': 'Remove from favorites',
    'home.card.featured': 'Featured by author',
    'home.card.copy_link_button': 'Copy link',
    'home.card.preview_alt': 'Preview image for {title}',
    'home.card.untitled': '(Untitled entry)',
    'home.card.no_url': 'No URL provided',
    'home.card.no_tags': 'No tags',

    'home.topbar.title': 'Curated Links',
    'home.topbar.about_open': 'Hide details',
    'home.topbar.about_closed': 'About',
    'home.notice.dismiss': 'Got it',
    'home.footer.summary': 'Public link cards · manually curated · favorites stay in the current browser',
    'home.back_to_top': 'Back to top',

    'editor.status.initializing': 'Initializing editor…',
    'editor.title.clean': 'NavHoard Editor',
    'editor.title.dirty': 'NavHoard Editor *',
    'editor.notice.created': 'Blank entry created. Fill in a URL and click Sync next.',
    'editor.notice.delete_current_confirm': 'Delete the current entry? You can still undo this by refreshing before saving.',
    'editor.notice.delete_current_done': 'Current entry removed. Remember to save.',
    'editor.notice.delete_empty': 'Select entries to delete first.',
    'editor.notice.delete_bulk_confirm': 'Delete {count} selected entries? You can still undo this by refreshing before saving.',
    'editor.notice.delete_bulk_done': '{count} entries removed. Remember to save.',
    'editor.notice.featured_on': 'Current entry marked as featured.',
    'editor.notice.featured_off': 'Featured flag removed. The editor list still follows created time order.',
    'editor.notice.request_failed': 'Request failed',
    'editor.notice.loading_entries': 'Loading current data…',
    'editor.notice.loaded_entries': '{count} entries loaded.',
    'editor.notice.load_failed': 'Load failed: {message}',
    'editor.notice.saving': 'Saving…',
    'editor.notice.save_failed': 'Save failed',
    'editor.notice.saved': 'Saved: {total} entries total, {duplicateCount} duplicates merged.',
    'editor.notice.save_failed_with_reason': 'Save failed: {message}',
    'editor.notice.select_entry_before_sync': 'Select or create an entry first.',
    'editor.notice.fill_url_before_sync': 'Fill in a URL before syncing.',
    'editor.notice.syncing': 'Syncing and fetching page content…',
    'editor.notice.sync_success': 'Sync complete. Main fields were filled automatically.',
    'editor.notice.sync_partial': 'Sync completed, but some fields used fallback data.',
    'editor.notice.sync_failed': 'Full content could not be captured, but an editable draft was kept.',
    'editor.notice.reason': 'Reason: {reason}',
    'editor.notice.warnings': 'Hints: {warnings}',
    'editor.notice.added_tags': 'Added tags: {tags}.',
    'editor.notice.new_tags': 'New tag terms discovered: {tags}.',
    'editor.notice.sync_failed_with_reason': 'Sync failed: {message}',
    'editor.notice.read_image_failed': 'Failed to read image file',
    'editor.notice.select_entry_before_upload': 'Select an entry first.',
    'editor.notice.uploading_preview': 'Uploading preview image…',
    'editor.notice.uploaded_preview': 'Preview image uploaded into the public directory and is ready to save.',
    'editor.notice.upload_failed': 'Upload failed: {message}',
    'editor.notice.importing_bookmarks': 'Parsing bookmarks file…',
    'editor.notice.import_bookmarks_empty': 'No importable HTTP or HTTPS bookmarks were found in this file.',
    'editor.notice.import_bookmarks_done': '{count} bookmarks imported. Review them before saving.',
    'editor.notice.import_bookmarks_failed': 'Import failed: {message}',
    'editor.notice.external_reload': 'External changes were detected. To avoid losing edits, the page will refresh after you save.',

    'editor.empty.no_suggestions': 'No existing tag suggestions are available.',
    'editor.empty.no_matches': 'No matching entries',
    'editor.empty.no_featured_results': 'There are no featured entries right now, or the search did not match featured content.',
    'editor.empty.no_search_results': 'Create a new entry or clear the search query.',
    'editor.empty.no_tags': 'No tags yet. Type one and press Enter to add it quickly.',
    'editor.empty.select_entry': 'Select an entry first.',
    'editor.empty.no_preview': 'No preview image yet',

    'editor.badge.featured': 'Featured',
    'editor.badge.hidden': 'Hidden',
    'editor.button.unfeature': 'Remove feature',
    'editor.button.new': 'New',
    'editor.button.view_all': 'View all',
    'editor.button.featured_only': 'Featured only',
    'editor.button.bulk_exit': 'Exit bulk mode',
    'editor.button.bulk_enter': 'Bulk select',
    'editor.button.bulk_select_all': 'Select all results',
    'editor.button.bulk_unselect_all': 'Clear selection',
    'editor.button.bulk_delete': 'Delete selected',
    'editor.button.bulk_delete_count': 'Delete selected ({count})',
    'editor.button.sync': 'Sync',
    'editor.button.syncing': 'Syncing…',
    'editor.button.import_bookmarks': 'Import bookmarks',
    'editor.button.save_all': 'Save all',
    'editor.button.saving': 'Saving…',
    'editor.button.add_tag': 'Add',
    'editor.button.upload_preview': 'Upload preview',

    'editor.summary.local_editing': 'Editing locally: {file}',
    'editor.summary.entries': '{entries} total entries · {filtered} filtered{featuredSuffix}',
    'editor.summary.entries_featured_suffix': ' · featured only',
    'editor.summary.bulk_selected': '{count} selected. You can delete them now.',
    'editor.summary.bulk_hint': 'Use the checkboxes or click entries to choose what to remove.',
    'editor.summary.form_hint': 'Save cleans URLs and tags, deduplicates, validates, and republishes data.',
    'editor.summary.tag_count': '{count} tags',
    'editor.summary.featured_order_hint': 'The editor list still follows created time descending order. Featured is only a mark and a homepage filter condition here.',
    'editor.summary.featured_sort': 'Rank {rank}',

    'editor.heading.main': 'Edit entry',
    'editor.field.search_placeholder': 'Search title / URL / tags',
    'editor.field.title': 'Title',
    'editor.field.url': 'URL',
    'editor.field.source': 'Source',
    'editor.field.confidence': 'Confidence',
    'editor.field.tags': 'Tags',
    'editor.tags.selected': 'Selected',
    'editor.tags.suggested': 'Suggestions',
    'editor.field.tags_placeholder': 'Type tags, then press Enter or comma to add quickly',
    'editor.field.summary': 'Summary',
    'editor.field.preview_enabled': 'Enable preview image',
    'editor.field.preview_mode': 'Preview mode',
    'editor.field.preview_src': 'Preview source',
    'editor.field.preview_alt': 'Preview alt text',
    'editor.field.created_at': 'Created at',
    'editor.field.updated_at': 'Updated at',
    'editor.field.hide': 'Hide by default on page',
    'editor.field.featured': 'Featured / author pick',
    'editor.field.featured_rank': 'Featured rank',
    'editor.field.featured_rank_placeholder': 'Smaller numbers appear first',
    'editor.card.untitled': '(Untitled entry)',
    'editor.card.no_url': 'No URL provided',
    'editor.card.no_tags': 'No tags'
  }
};

export function normalizeLocale(value?: string | null): SupportedLocale {
  const raw = String(value || '').trim();
  if (!raw) {
    return DEFAULT_LOCALE;
  }

  if ((SUPPORTED_LOCALES as readonly string[]).includes(raw)) {
    return raw as SupportedLocale;
  }

  const normalized = raw.toLowerCase();
  if (normalized.startsWith('zh')) {
    return 'zh-CN';
  }
  if (normalized.startsWith('en')) {
    return 'en';
  }
  return DEFAULT_LOCALE;
}

export function readStoredLocale(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): SupportedLocale | null {
  try {
    const stored = storage?.getItem(LOCALE_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return normalizeLocale(stored);
  } catch {
    return null;
  }
}

export function writeStoredLocale(
  locale: string,
  storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage
): boolean {
  try {
    storage?.setItem(LOCALE_STORAGE_KEY, normalizeLocale(locale));
    return true;
  } catch {
    return false;
  }
}

export function detectBrowserLocale(navigatorLike: Pick<Navigator, 'language' | 'languages'> | undefined = globalThis.navigator): SupportedLocale {
  const candidates = Array.isArray(navigatorLike?.languages) && navigatorLike.languages.length > 0
    ? navigatorLike.languages
    : [navigatorLike?.language || ''];

  for (const candidate of candidates) {
    const normalized = normalizeLocale(candidate);
    if ((SUPPORTED_LOCALES as readonly string[]).includes(normalized)) {
      return normalized;
    }
  }

  return DEFAULT_LOCALE;
}

export function detectPreferredLocale(
  storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage,
  navigatorLike: Pick<Navigator, 'language' | 'languages'> | undefined = globalThis.navigator
): SupportedLocale {
  return readStoredLocale(storage) || detectBrowserLocale(navigatorLike);
}

export function translate(locale: string, key: string, vars: TranslationVars = {}): string {
  const normalizedLocale = normalizeLocale(locale);
  const activeCatalog = catalogs[normalizedLocale];
  const fallbackCatalog = catalogs[DEFAULT_LOCALE];
  const template = activeCatalog[key] ?? fallbackCatalog[key] ?? key;

  return template.replace(/\{(\w+)\}/g, (_match, token) => {
    const value = vars[token];
    return value === null || value === undefined ? '' : String(value);
  });
}

export function formatNumber(locale: string, value: number): string {
  return new Intl.NumberFormat(normalizeLocale(locale)).format(value);
}

export function formatDate(
  locale: string,
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat(normalizeLocale(locale), options).format(date);
}
