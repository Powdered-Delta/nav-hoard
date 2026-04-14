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
    'home.notice.favorite_added_first': '已加入第一次收藏。收藏仅保存于当前浏览器，建议尽快导出备份。',
    'home.notice.favorite_added': '已加入收藏。',
    'home.notice.favorite_removed': '已取消收藏。',
    'home.notice.import_no_match': '导入完成，没有匹配到本站条目。',
    'home.notice.import_success': '已导入 {count} 条收藏；收藏仅保存于当前浏览器。',
    'home.notice.import_failed': '导入失败：文件格式不正确。',
    'home.notice.export_empty': '暂无可导出的收藏。',
    'home.notice.export_success': '已导出收藏备份文件。你可以稍后在任意浏览器中导入它。',
    'home.notice.copy_entry_success': '已复制条目 JSON，可粘贴到编辑器或录入流程。',
    'home.notice.copy_link_success': '已复制链接，可直接分享给别人或保存到别处。',
    'home.notice.copy_failed': '复制失败：当前浏览器不允许访问剪贴板。',
    'home.notice.data_load_failed': '数据加载失败，请稍后重试。',

    'home.layout.waterfall': '瀑布流',
    'home.layout.list': '列表',

    'home.empty.favorites.title': '你还没有收藏内容。',
    'home.empty.favorites.hint': '收藏仅保存于当前浏览器，建议定期导出备份。',
    'home.empty.favorites.cta': '先去看看全部内容',
    'home.empty.filtered.title': '没有符合当前筛选的条目。',
    'home.empty.filtered.hint': '可以清空筛选，或者试试更宽松的关键词。',
    'home.empty.filtered.cta': '清空筛选',
    'home.empty.default.title': '暂时还没有可展示的内容。',

    'home.about.aria': '关于 NavHoard',
    'home.about.p1': '这里收录的是公开链接卡片，方便你通过搜索、标签和收藏重新发现内容。',
    'home.about.p2': '收藏不会跨设备同步；长期使用请定期导出备份。',
    'home.about.p3': '想把某条收进自己的 NavHoard，可用卡片上的复制，将条目 JSON 粘贴到编辑器或录入流程。',

    'home.favorite_reminder.aria': '收藏提醒',
    'home.favorite_reminder.kicker': '收藏提醒',
    'home.favorite_reminder.text': '收藏仅保存于当前浏览器，可用「导出/导入收藏」备份或迁移。',
    'home.favorite_reminder.dismiss_forever': '不再提醒',

    'home.filters.none_all': '未筛选，显示全部{hiddenSuffix}。',
    'home.filters.none_favorites': '未筛选，显示收藏{hiddenSuffix}。',
    'home.filters.hidden_suffix': '（含隐藏条目）',
    'home.filters.current': '当前筛选',
    'home.filters.search_pill': '搜索：{query}',
    'home.filters.remove_tag': '移除该标签',
    'home.filters.clear': '清空筛选',

    'home.results.title_all': '结果列表',
    'home.results.title_favorites': '我的收藏',
    'home.results.subtitle': '共显示 {visible} 条，{baseLabel}{featuredSuffix}',
    'home.results.base_all': '总计 {count} 条',
    'home.results.base_favorites': '已收藏 {count} 条',
    'home.results.featured_suffix': '，含推荐 {count} 条',
    'home.results.grouped_by_site': '（按站点分组；组间按条数从多到少，组内仍按更新时间）',
    'home.results.visible_count': '{count} 条',

    'home.site.unknown': '未分类站点',
    'home.site.entry_count': '{count} 条',
    'home.site.expand_group': '展开分组：{title}',
    'home.site.collapse_group': '收起分组：{title}',
    'home.site.group_github_io': 'GitHub Pages（*.github.io）',
    'home.site.group_gitlab_io': 'GitLab Pages（*.gitlab.io）',
    'home.site.group_netlify_app': 'Netlify（*.netlify.app）',
    'home.site.group_vercel_app': 'Vercel（*.vercel.app）',
    'home.site.group_pages_dev': 'Cloudflare Pages（*.pages.dev）',
    'home.site.group_firebaseapp': 'Firebase Hosting（*.firebaseapp.com）',
    'home.site.group_web_app': 'Firebase（*.web.app）',

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
    'home.toolbar.sort_site': '按站点分组',
    'home.toolbar.tip_local_only': '收藏仅保存于当前浏览器，可随时导入或导出。',

    'home.tags.title': '热门标签',
    'home.tags.subtitle': '用标签缩小范围（可先搜索）。',
    'home.tags.subtitle_compact': '滚动时也能继续细化筛选条件。',
    'home.tags.expand_all': '展开全部 {count} 个标签',
    'home.tags.collapse': '收起标签',
    'home.tags.more_hint': '还有 {count} 个标签未展开。',
    'home.tags.filter_title': '按此标签筛选',

    'home.controls.summary.search': '搜索：{query}',
    'home.controls.summary.all': '全部 {count} 条',
    'home.controls.summary.favorites': '收藏 {count} 条',

    'home.card.copy_entry': '复制条目 JSON（可粘贴到编辑器）',
    'home.card.copy_link': '复制本条链接，便于分享',
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
    'home.topbar.about_closed': '简介',
    'home.notice.dismiss': '知道了',
    'home.footer.summary': '公开链接卡片 · 手动维护 · 收藏仅保存于当前浏览器',
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
    'editor.notice.sync_partial': '已同步；部分字段为自动填充，请核对。',
    'editor.notice.sync_failed': '未抓取到完整内容，已保留可继续手动编辑的草稿。',
    'editor.notice.reason': '原因：{reason}',
    'editor.notice.warnings': '提示：{warnings}',
    'editor.notice.added_tags': '已补充标签：{tags}。',
    'editor.notice.new_tags': '发现新标签：{tags}。',
    'editor.notice.sync_failed_with_reason': '同步失败：{message}',
    'editor.notice.sync_preview_success': '已根据抓取结果更新预览图。',
    'editor.notice.sync_preview_no_image': '本次抓取未返回预览图，已保留原预览。',
    'editor.notice.sync_preview_failed_with_reason': '未能更新预览图：{message}',
    'editor.notice.read_image_failed': '读取图片失败',
    'editor.notice.select_entry_before_upload': '请先选择一个条目。',
    'editor.notice.uploading_preview': '正在上传预览图…',
    'editor.notice.uploaded_preview': '预览图已上传到 public 目录，可直接保存。',
    'editor.notice.upload_failed': '上传失败：{message}',
    'editor.notice.importing_bookmarks': '正在解析书签文件…',
    'editor.notice.import_bookmarks_empty': '未从该文件中识别到可导入的书签链接。',
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
    'editor.button.sync_preview': '仅更新预览',
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
    'editor.summary.form_hint': '保存时会规范化 URL、清洗标签、去重校验，并生成发布数据。',
    'editor.summary.tag_count': '{count} 个标签',
    'editor.summary.featured_order_hint': '列表仍按创建时间排序；「置顶」只影响主站推荐与筛选，不会在此自动靠前。',
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
    'editor.field.persist_capture_preview': '抓取时把预览图存到本仓库',
    'editor.field.persist_capture_preview_hint': '写入 public/images/previews/；下载失败则仍用远程地址。记得再点「全部保存」以提交文件。',
    'editor.field.persist_capture_preview_help_label': '关于将抓取预览保存到仓库',
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
    'home.notice.favorite_added_first': 'First favorite added. Favorites are only saved in this browser—export a backup soon.',
    'home.notice.favorite_added': 'Added to favorites.',
    'home.notice.favorite_removed': 'Removed from favorites.',
    'home.notice.import_no_match': 'Import finished. No entries on this site matched.',
    'home.notice.import_success': 'Imported {count} favorites; they are only saved in this browser.',
    'home.notice.import_failed': 'Import failed: invalid file format.',
    'home.notice.export_empty': 'No favorites to export yet.',
    'home.notice.export_success': 'Favorites backup exported. You can import it in any browser later.',
    'home.notice.copy_entry_success': 'Entry JSON copied. Paste it into your editor or intake workflow.',
    'home.notice.copy_link_success': 'Link copied. You can share it or save it elsewhere.',
    'home.notice.copy_failed': 'Copy failed: this browser blocks clipboard access.',
    'home.notice.data_load_failed': 'Failed to load data. Please try again later.',

    'home.layout.waterfall': 'Waterfall',
    'home.layout.list': 'List',

    'home.empty.favorites.title': 'You do not have any favorites yet.',
    'home.empty.favorites.hint': 'Favorites are only saved in this browser. Export a backup regularly.',
    'home.empty.favorites.cta': 'Browse all entries first',
    'home.empty.filtered.title': 'No entries match the active filters.',
    'home.empty.filtered.hint': 'Try clearing filters or using broader keywords.',
    'home.empty.filtered.cta': 'Clear filters',
    'home.empty.default.title': 'There is nothing to show yet.',

    'home.about.aria': 'About NavHoard',
    'home.about.p1': 'This page collects public link cards so you can rediscover content through search, tags, and favorites.',
    'home.about.p2': 'Favorites do not sync across devices. Export backups regularly if you use them long term.',
    'home.about.p3': 'To add an entry to your NavHoard, use Copy on the card and paste the entry JSON into your editor or intake workflow.',

    'home.favorite_reminder.aria': 'Favorite reminder',
    'home.favorite_reminder.kicker': 'Favorite reminder',
    'home.favorite_reminder.text': 'Favorites are only saved in this browser. Use Export/Import favorites to back up or move them.',
    'home.favorite_reminder.dismiss_forever': 'Do not remind again',

    'home.filters.none_all': 'No filters; showing all{hiddenSuffix}.',
    'home.filters.none_favorites': 'No filters; showing favorites{hiddenSuffix}.',
    'home.filters.hidden_suffix': ' (including hidden entries)',
    'home.filters.current': 'Current filters',
    'home.filters.search_pill': 'Search: {query}',
    'home.filters.remove_tag': 'Remove this tag',
    'home.filters.clear': 'Clear filters',

    'home.results.title_all': 'Results',
    'home.results.title_favorites': 'My favorites',
    'home.results.subtitle': 'Showing {visible} entries, {baseLabel}{featuredSuffix}',
    'home.results.base_all': '{count} total',
    'home.results.base_favorites': '{count} favorited',
    'home.results.featured_suffix': ', including {count} featured',
    'home.results.grouped_by_site': '(grouped by site; groups sorted by size, newest within each group)',
    'home.results.visible_count': '{count} results',

    'home.site.unknown': 'Uncategorized site',
    'home.site.entry_count': '{count} entries',
    'home.site.expand_group': 'Expand group: {title}',
    'home.site.collapse_group': 'Collapse group: {title}',
    'home.site.group_github_io': 'GitHub Pages (*.github.io)',
    'home.site.group_gitlab_io': 'GitLab Pages (*.gitlab.io)',
    'home.site.group_netlify_app': 'Netlify (*.netlify.app)',
    'home.site.group_vercel_app': 'Vercel (*.vercel.app)',
    'home.site.group_pages_dev': 'Cloudflare Pages (*.pages.dev)',
    'home.site.group_firebaseapp': 'Firebase Hosting (*.firebaseapp.com)',
    'home.site.group_web_app': 'Firebase (*.web.app)',

    'home.layout.aria': 'Switch layout',
    'home.search.heading': 'Search first, then filter',
    'home.search.summary': 'Featured and newest entries show by default.',
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
    'home.toolbar.sort_site': 'Group by site',
    'home.toolbar.tip_local_only': 'Favorites are only saved in this browser. Import or export anytime.',

    'home.tags.title': 'Popular tags',
    'home.tags.subtitle': 'Narrow with tags (search first if you like).',
    'home.tags.subtitle_compact': 'Keep refining filters while you scroll.',
    'home.tags.expand_all': 'Show all {count} tags',
    'home.tags.collapse': 'Collapse tags',
    'home.tags.more_hint': '{count} more tags are hidden.',
    'home.tags.filter_title': 'Filter by this tag',

    'home.controls.summary.search': 'Search: {query}',
    'home.controls.summary.all': '{count} total',
    'home.controls.summary.favorites': '{count} favorites',

    'home.card.copy_entry': 'Copy entry JSON (paste into editor)',
    'home.card.copy_link': 'Copy this link for sharing',
    'home.card.favorite_add': 'Add to favorites',
    'home.card.favorite_remove': 'Remove from favorites',
    'home.card.featured': 'Featured by author',
    'home.card.copy_link_button': 'Copy link',
    'home.card.preview_alt': 'Preview image for {title}',
    'home.card.untitled': '(Untitled entry)',
    'home.card.no_url': 'No URL provided',
    'home.card.no_tags': 'No tags',

    'home.topbar.title': 'Curated Links',
    'home.topbar.about_open': 'Collapse intro',
    'home.topbar.about_closed': 'Intro',
    'home.notice.dismiss': 'Got it',
    'home.footer.summary': 'Public link cards · hand-curated · favorites only saved in this browser',
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
    'editor.notice.sync_partial': 'Synced; some fields were filled automatically—please review.',
    'editor.notice.sync_failed': 'Full content could not be captured, but an editable draft was kept.',
    'editor.notice.reason': 'Reason: {reason}',
    'editor.notice.warnings': 'Hints: {warnings}',
    'editor.notice.added_tags': 'Added tags: {tags}.',
    'editor.notice.new_tags': 'New tags found: {tags}.',
    'editor.notice.sync_failed_with_reason': 'Sync failed: {message}',
    'editor.notice.sync_preview_success': 'Preview image updated from the latest capture.',
    'editor.notice.sync_preview_no_image': 'No preview image in this capture; previous preview kept.',
    'editor.notice.sync_preview_failed_with_reason': 'Could not update the preview image: {message}',
    'editor.notice.read_image_failed': 'Failed to read image file',
    'editor.notice.select_entry_before_upload': 'Select an entry first.',
    'editor.notice.uploading_preview': 'Uploading preview image…',
    'editor.notice.uploaded_preview': 'Preview image uploaded into the public directory and is ready to save.',
    'editor.notice.upload_failed': 'Upload failed: {message}',
    'editor.notice.importing_bookmarks': 'Parsing bookmarks file…',
    'editor.notice.import_bookmarks_empty': 'No importable bookmark links were found in this file.',
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
    'editor.button.sync_preview': 'Preview only',
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
    'editor.summary.form_hint': 'On save: normalize URLs, clean tags, dedupe and validate, then publish data.',
    'editor.summary.tag_count': '{count} tags',
    'editor.summary.featured_order_hint': 'List order stays by creation time. “Featured” only affects the public site and filters—it does not reorder entries here.',
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
    'editor.field.persist_capture_preview': 'Save captured preview into this repo',
    'editor.field.persist_capture_preview_hint':
      'Writes to public/images/previews/; on failure the remote URL is kept. Use Save all to commit files.',
    'editor.field.persist_capture_preview_help_label': 'About saving captured previews to the repo',
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
