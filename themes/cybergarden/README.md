# Cybergarden 主题代码文档（Hugo）

> 一份面向"阅读学习"的逐文件代码注解。建议打开主题源码，按本文顺序边读边对照。

- **主题名称**：Cybergarden（赛博花园）
- **风格定位**：新粗野主义（Neo-Brutalism）
- **作者**：JiangTieZhu
- **许可证**：GPL-3.0-only
- **最低 Hugo 版本**：v0.100.0
- **本文适用版本**：Hugo v0.146+（v0.146 起 Hugo 重做了模板查找系统，下文会反复提到这个分水岭）

---

## 目录

1. [快速上手](#1-快速上手)
2. [目录结构与文件清单](#2-目录结构与文件清单)
3. [Hugo 模板机制速览（读代码前必看）](#3-hugo-模板机制速览读代码前必看)
4. [核心母版：`baseof.html`（全站骨架）](#4-核心母版baseofhtml全站骨架)
5. [首页：`home.html` 与旧版 `index.html`](#5-首页homehtml-与旧版-indexhtml)
6. [板块列表页：`section.html`](#6-板块列表页sectionhtml)
7. [分类与标签页：`taxonomy.html` / `term.html`](#7-分类与标签页taxonomyhtml--termhtml)
8. [文章页：`page.html` / `single.html`](#8-文章页pagehtml--singlehtml)
9. [全部文章列表：`list.html`](#9-全部文章列表listhtml)
10. [归档页：`archives.html`](#10-归档页archiveshtml)
11. [搜索：`search.html` + `searchindex.json`](#11-搜索searchhtml--searchindexjson)
12. [Partials 组件逐个拆解](#12-partials-组件逐个拆解)
13. [样式系统：`assets/css/style.css`](#13-样式系统assetscssstylecss)
14. [资源管线与脚手架遗留文件](#14-资源管线与脚手架遗留文件)
15. [主题与站点的"配置契约"](#15-主题与站点的配置契约)
16. [本主题用到的 Hugo 语法速查](#16-本主题用到的-hugo-语法速查)
17. [已知问题与改进建议](#17-已知问题与改进建议)
18. [学习路线总结](#18-学习路线总结)
19. [优化变更说明（原主题 → 优化版）](#19-优化变更说明原主题--优化版)

---

## 1. 快速上手

把主题放进 Hugo 站点：

```
my-blog/
├── hugo.toml              # 站点配置（关键配置见 §15）
├── content/               # 文章内容（结构见 §15）
└── themes/
    └── cybergarden/       # 本主题
```

```bash
# 在 my-blog 下
git clone <你的主题仓库> themes/cybergarden   # 或手动拷贝
hugo new post/study/my-first-post.md          # 新建文章（使用 archetypes/default.md 模板）
hugo server -D                                # 本地预览（-D 连草稿一起显示）
```

运行的前提是站点内容结构符合主题的硬性约定（板块目录、归档/搜索入口），详见 [§15 配置契约](#15-主题与站点的配置契约)。

---

## 2. 目录结构与文件清单

> 说明：本章展示的是**优化后的结构**（与交付的 `cybergarden-optimized` 一致）。原始主题与优化版的差异见 [§19 优化变更说明](#19-优化变更说明原主题--优化版)。

```
cybergarden/                      # 主题根目录
├── theme.toml                    # 主题元数据（Hugo 读取）
├── archetypes/
│   └── default.md                # hugo new 生成文章时的 front matter 模板
├── assets/
│   └── css/
│       └── style.css             # ★ 真正被加载的样式（全站设计系统，约 930 行）
├── content/                      # 空目录（Hugo 主题内一般不放内容，内容属于站点）
├── data/                         # 空目录（Hugo data 文件预留位）
├── i18n/                         # 空目录（多语言翻译预留位）
├── layouts/                      # ★ 模板目录（全部按新规范放在根目录）
│   ├── baseof.html               # ★ 页面骨架（全站母版）
│   ├── home.html                 # ★ 首页模板
│   ├── page.html                 # ★ 文章页（查找链优先于 single.html）
│   ├── section.html              # ★ 板块列表页（如 /post/study/）
│   ├── taxonomy.html             # ★ 分类/标签聚合页（/categories/、/tags/）
│   ├── term.html                 # ★ 单个分类/标签条目页（/tags/xxx/）
│   ├── search.html               # ★ 搜索页（配合站点内容 + layout 触发）
│   ├── searchindex.json          # ★ 搜索索引（构建时输出的 JSON 数据文件）
│   ├── archives.html             # ★ 归档页（需站点内容 + layout 触发）
│   ├── list.html                 # 通用列表兜底（list 标准布局名）
│   ├── single.html               # 单页兜底（single 标准布局名）
│   └── _partials/                # 可复用组件（partial）
│       ├── header.html           # ★ 顶部导航（logo + 主菜单）—— baseof 引用
│       ├── footer.html           # ★ 页脚 —— baseof 引用
│       ├── marquee.html          # ★ 底部跑马灯 —— baseof 引用
│       └── terms.html            # ★ 文章标签列表 —— page.html 引用
└── static/
    └── favicon.ico               # 站点图标（static 下的文件会原样拷到 public 根）
```

**一眼看懂"谁在用"**（引用关系图，★ = 参与渲染）：

```
baseof.html ──┬── partial: header.html      （顶部导航）
              ├── block: main               （每个页面模板用 define "main" 填进来）
              ├── partial: marquee.html     （跑马灯）
              └── partial: footer.html      （页脚）

home.html / page.html / section.html / taxonomy.html / term.html
  └── 都只 define "main"，由 baseof.html 提供外壳

page.html ──┬── partial: terms.html        （文章底部标签）
            └── 链接到 /archives/ /search/ 等

兜底模板（新系统标准布局名，仅在前者缺失时生效）：list.html、single.html
```

---

## 3. Hugo 模板机制速览（读代码前必看）

Hugo 不是"一个 HTML 模板渲染所有页面"，而是按**页面种类（Kind）**选择模板：

| Kind | 含义 | 本主题对应模板（v0.146+） |
|---|---|---|
| `home` | 首页（站点根） | `home.html` |
| `page` | 普通内容页（一篇文章） | `page.html` → 兜底 `single.html` |
| `section` | 板块页（一个目录的列表） | `section.html` |
| `taxonomy` | 分类/标签聚合页（/tags/） | `taxonomy.html` |
| `term` | 单个分类/标签条目页（/tags/foo/） | `term.html` |

**v0.146 分水岭**：v0.146 之前首页叫 `index.html`、单页叫 `single.html`/`list.html`；v0.146 之后新查找表是 `home.html → page.html → section.html → taxonomy.html → term.html`（`single`/`list` 作为旧名仍然兼容，但**新名优先**——同一个 kind 下若新名和旧名都在，新名胜出）。

**三个核心语法**：

1. `baseof.html` 定义外壳：`{{ block "main" . }}{{ end }}` 是"插槽"；
2. 每个页面模板用 `{{ define "main" }}...{{ end }}` 填这个插槽（本主题所有页面模板都只写了 `define "main"`，就是这个原因）；
3. `{{ partial "xxx.html" . }}` 把可复用片段（导航、页脚）插进来。

**两套上下文**：模板里的 `.` 是当前页（Page 对象）；`site` / `.Site` 是站点对象（全站数据，如 `site.RegularPages` = 全部文章）。本主题两者混用，效果一样。

**资源管线（Hugo Pipes）**：`assets/` 下的文件要用 `resources.Get "路径"` 取出来，再经过 `minify`（压缩）、`fingerprint`（生成哈希指纹做 SRI）、`css.Build`/`js.Build`（编译/打包）等加工，最后输出到 `public/`。见 [§14](#14-资源管线与脚手架遗留文件)。

### 3.1 你的版本（v0.163.3）速查表

你使用的 Hugo 是 v0.163.3，远高于 v0.146 分水岭，**文档中所有"v0.146+ 生效"的结论直接适用**。以下为**优化版**在 v0.163.3 下的逐文件状态（已用 v0.163.3 实际构建验证，渲染输出与原始主题逐字节一致）：

| 文件 | v0.163.3 下的状态 |
|---|---|
| `layouts/home.html` | ✅ 首页渲染用它（官方明确：v0.146 起"不再存在 index.html 首页模板"） |
| `layouts/page.html` | ✅ 文章页渲染用它（查找链 page.html → single.html → all.html） |
| `layouts/section.html` | ✅ 板块列表页 |
| `layouts/taxonomy.html` + `layouts/term.html` | ✅ 分开的两个模板——新系统要求二者并存（旧版一个 taxonomy.html 同时管两个 kind），主题做得对 |
| `layouts/_partials/` | ✅ 新系统标准目录名（v0.146 起 partials 目录从 `partials/` 正式改名为 `_partials/`） |
| `layouts/baseof.html` / `archives.html` / `list.html` / `single.html` | ✅ 已按新规范上移到 layouts 根目录（原在 `_default/` 旧式目录中，兼容映射下也能跑，优化版直接放到正确位置） |
| `layouts/index.html` | ❌ 原为死文件（首页模板旧名），**优化版已删除** |
| `layouts/_partials/menu.html`、`head.html`、`head/css.html`、`head/js.html`、`assets/css/main.css`、`assets/css/components/*`、`assets/js/main.js` | ❌ 原为脚手架遗留（未被引用），**优化版已删除** |

另外两点版本提醒：

- v0.146.0 刚发布时 baseof 查找有过 bug，已在 v0.146.2 修复——0.163.3 不受影响；
- 新系统模板查找的权重优先级为：front matter `layout` > 页面种类（home/section/taxonomy/term/page）> `list`/`single` > 输出格式 > `all` > 语言 > 媒体类型 > 页面路径 > `type`。**给内容页设置 `layout: xxx` 会优先于 kind 模板**——归档页（`layout: archives`）和搜索页（`layout: search`）正是靠这一点触发。

---

## 4. 核心母版：`baseof.html`（全站骨架）

> 优化版位置：`layouts/baseof.html`（原在 `_default/`，v0.146+ 新规范下移到了根目录；内容未改动）。

这是全站唯一的 HTML 骨架，任何页面都先套它。

```html
<!DOCTYPE html>
<html lang="{{ .Site.Language.Locale | default "zh-CN" }}">
```

`| default "zh-CN"`：如果站点语言没有定义 Locale，就回退到 `zh-CN`。管道（`|`）把左边的值传给右边的函数——这是 Hugo/Go 模板最常用的写法。

```html
<title>{{ if .IsHome }}{{ .Site.Title }}{{ else }}{{ .Title }} - {{ .Site.Title }}{{ end }}</title>
```

标题规则：首页显示站点名；其他页面显示"页面标题 - 站点名"。

```html
<!-- 直接读取 assets 里的 CSS，如果这段报错，说明你放错文件夹了 -->
{{ $style := resources.Get "css/style.css" }}
{{ if $style }}
    {{ $style = $style | minify | fingerprint }}
    <link rel="stylesheet" href="{{ $style.RelPermalink }}">
{{ else }}
    <!-- 如果你把 css 放在了 static/css/style.css，就用下面这行 -->
    <link rel="stylesheet" href="{{ "css/style.css" | relURL }}">
{{ end }}
```

这一段是**经典的双保险写法**：
- `resources.Get "css/style.css"` 从 `assets/` 取文件；取到就 `minify`（压缩）→ `fingerprint`（加哈希指纹，文件名变成 `style.<hash>.css`，浏览器可长期缓存）；
- 取不到（比如文件放错了位置）就回退到 `static/` 目录的普通路径（`relURL` 生成相对 URL）；
- 变量用 `:=` 声明并赋值，之后用 `=` 重新赋值。

```html
<body>
    <div class="container">
        {{ partial "header.html" . }}
        <main>
            {{ block "main" . }}{{ end }}   <!-- 页面内容插槽 -->
        </main>
    </div>
    {{ partial "marquee.html" . }}
    <div class="container">
        {{ partial "footer.html" . }}
    </div>
</body>
```

布局结构：`container > (header + main)`，然后**全宽的跑马灯**，再一个 `container > footer`。跑马灯被放在两个 container 之间，配合 CSS 的负 margin 实现通栏效果（见 style.css 的 `.marquee-wrapper`）。

**注意两个"没做"的事**（学习价值很高）：
- 这里没有引用 `_partials/head.html`——脚手架自带的 head 组件（含 favicon、JS 加载、更规范的 CSS 加载）**并未接入**，所以 `main.js`、`main.css` 实际都不会被加载（详见 §14）；
- 没有 `<link rel="icon">`，favicon 靠浏览器默认约定去请求 `/favicon.ico`。

---

## 5. 首页：`home.html` 与旧版 `index.html`

> 优化版说明：`index.html` 在 v0.146+ 下不参与渲染，优化版已删除；本节保留对它的介绍，用于理解版本差异与迭代历史。

### 5.1 `home.html`（v0.146+ 生效）

文件头注释说明了一切：

```
注意：Hugo v0.146.0 起，首页模板必须叫 home.html，旧的 index.html 不再被识别为首页。
```

**Hero 区（红色大标题块 + 最新文章卡片）：**

```html
<section class="hero-section">
    <div class="hero-red-box">
        <h1>{{ .Site.Title }}</h1>
        <p>{{ .Site.Params.description }}</p>
    </div>
    <div class="brutal-card latest-card">
        <span class="badge-new">最新</span>
        {{ $latest := first 1 (where site.RegularPages "Section" "post") }}
        {{ if $latest }}
          {{ range $latest }}
            <h3 ...><a href="{{ .RelPermalink }}">{{ .Title }}</a></h3>
            <div class="meta" ...>{{ .Date.Format "2006.01.02" }} · {{ .ReadingTime }} min</div>
          {{ end }}
        {{ else }}
            <h3 ...>暂无文章</h3>
            ...
        {{ end }}
    </div>
</section>
```

逐个拆解：
- `.Site.Params.description`：读站点配置 `[params]` 里的 `description`（站点配置示例见 §15）；
- `where site.RegularPages "Section" "post"`：**筛选**所有 `Section == "post"` 的文章。注意 `.Section` 返回的是**顶级板块**（`content/post/study/xxx.md` 的 Section 也是 `post`），所以这一句能拿到 `post/` 下所有子目录的文章；
- `first 1 (...)`：取集合的第一条（最新一篇？不一定——RegularPages 默认按日期倒序，所以第一条通常就是最新）；
- `if $latest ... range $latest`：有文章就遍历（其实只有一条），没有就显示"暂无文章 / 快去写一篇吧"。这是**空状态处理**的经典写法。

**统计条（四个可点击数字）：**

```html
{{ $latest := first 1 (where site.RegularPages "Section" "post") }}
<section class="stats-bar">
    <a class="stats-item stats-link" href="{{ "/archives/" | relURL }}">
        <div class="num">{{ len (where site.RegularPages "Section" "post") }}</div>
        <div class="label">篇文章</div>
    </a>
    <a ... href="{{ "/categories/" | relURL }}">
        <div class="num">{{ len site.Taxonomies.categories }}</div>
        <div class="label">个分类</div>
    </a>
    <a ... href="{{ "/tags/" | relURL }}">
        <div class="num">{{ len site.Taxonomies.tags }}</div>
        <div class="label">个标签</div>
    </a>
    {{ with $latest }}{{ range . }}
    <a ... href="{{ .RelPermalink }}">
        <div class="num">{{ .Date.Format "2006.01.02" }}</div>
        <div class="label">最近更新</div>
    </a>
    {{ end }}{{ end }}
</section>
```

- `len (...)`：集合长度；
- `site.Taxonomies.categories` / `site.Taxonomies.tags`：Hugo 内置分类法（默认就启用 tags、categories，无需站点配置）；
- `with $latest`：`with` 是"如果非空，把 `.` 换成它的值再执行块内"；结合 `range` 取最新文章的日期；
- 每个统计数字都是 `<a>` 链接——作者把整条统计条做成了可点击入口。

**板块网格（首页的核心内容）：**

```html
{{ $boards := slice
    (dict "title" "学习"       "path" "post/study"    "url" "/post/study/")
    (dict "title" "随想"       "path" "post/thoughts"  "url" "/post/thoughts/")
    (dict "title" "观影与阅读" "path" "post/reading"  "url" "/post/reading/")
    (dict "title" "游戏"       "path" "post/gaming"   "url" "/post/gaming/")
}}

{{ range $board := $boards }}
{{ $sec := site.GetPage $board.path }}
{{ $pages := $sec.RegularPages | default slice }}
<div class="brutal-card category-card">
    <div class="category-header">
        <h2>{{ $board.title }} <span>{{ len $pages }} 篇</span></h2>
        <a href="{{ $board.url }}" class="view-all">全部 →</a>
    </div>
    <div class="post-list">
        {{ if $pages }}
            {{ range first 4 $pages }}
            <div class="post-item">
                <div class="post-meta">{{ .Date.Format "2006.01.02" }} · {{ .ReadingTime }} min</div>
                <a href="{{ .RelPermalink }}" class="post-title">{{ .Title }}</a>
            </div>
            {{ end }}
        {{ else }}
            <div class="post-item">
                <span class="post-meta">—</span>
                <span class="post-title">还没有内容</span>
            </div>
        {{ end }}
    </div>
</div>
{{ end }}
```

- `slice (dict ...) (dict ...)`：用 `slice` 造一个数组、`dict` 造键值对对象——这是在模板里"手工造数据"的方式，4 个板块的标题/路径/链接写死在代码里；
- `site.GetPage $board.path`：按路径拿页面对象。`post/study` 是一个 section（**前提是 `content/post/study/` 下有 `_index.md`**，否则 `GetPage` 返回 nil，见 §15 配置契约）；
- `$pages := $sec.RegularPages | default slice`：取该板块的全部文章；`| default slice` 是防呆——如果 `$sec` 是 nil（板块不存在），取 `.RegularPages` 会得到 nil，`default slice` 把它兜底成空数组，避免模板报错；
- `range first 4 $pages`：只显示前 4 篇；
- 日期在左、标题在右的排版由 CSS 控制（`.post-item` 的 flex 布局）。

### 5.2 `index.html`（旧版首页）

内容结构和 home.html 几乎一样，但有三处差异，能看出作者的迭代痕迹：

| 对比项 | index.html（旧） | home.html（新） |
|---|---|---|
| 统计条 | 纯文本（不可点击），"最近更新"用 `now.Format "2006.01.02"`（今天的日期） | 全部是链接，"最近更新"显示最新文章日期 |
| 板块 | 硬编码 `posts / writing / reading / site`（标题：文章/写作/阅读/建站），链接 `/posts/` 等 | 硬编码 `post/study` 等四个子板块 |
| 板块取数 | `where site.RegularPages "Section" $section` | `site.GetPage` 拿 section 再取 `.RegularPages` |

**关键知识点**：这两个文件同时存在，谁生效取决于 Hugo 版本。v0.146+ 用 `home.html`；旧版 Hugo（theme.toml 声明的最低版本 0.100.0 到 0.145）会优先用 `index.html`——也就是说**同一个站点在旧版和新版 Hugo 下会渲染出两套不同的首页**。这是版本分水岭的活教材。

---

## 6. 板块列表页：`section.html`

当一个板块目录（如 `content/post/study/` 带 `_index.md`）被访问时，用这个模板渲染它的文章列表。

```html
<h1 class="article-title" style="margin-top:60px;">{{ .Title }}</h1>
<div class="section-count">{{ len .Pages }} 篇</div>
```

- 对 section 页面，`.Title` 来自该目录 `_index.md` 的 front matter（比如 `title: 学习`）；
- `.Pages`：该 section **直属**的所有内容页（注意：不含更深层子目录的内容）。

```html
{{ range $i, $p := .Pages.ByDate.Reverse }}
<a class="section-post-card" href="{{ $p.RelPermalink }}">
    <div class="spc-top">
        <span class="spc-index">{{ printf "%02d" (add $i 1) }}</span>
        <span class="spc-date">{{ $p.Date.Format "2006.01.02" }}</span>
    </div>
    <h2 class="spc-title">{{ $p.Title }}</h2>
    <p class="spc-summary">{{ $p.Summary | plainify | truncate 60 }}</p>
    <div class="spc-bottom">
        <span class="spc-cat">{{ with $p.Params.categories }}{{ index . 0 }}{{ else }}{{ $p.Section }}{{ end }}</span>
        <span class="spc-time">{{ $p.ReadingTime }} MIN</span>
    </div>
</a>
{{ end }}
```

- `range $i, $p := ...`：同时拿到序号和页面；`add $i 1` 从 1 开始编号；
- `printf "%02d"`：补零成两位（01、02、03…）；
- `.Pages.ByDate.Reverse`：按日期倒序（新的在前）；
- `$p.Summary | plainify | truncate 60`：取摘要 → 去掉 HTML 标签（`plainify`）→ 截断成 60 字符。这是"摘要变纯文本"的标准管道；
- `with $p.Params.categories }}{{ index . 0 }}`：取文章 front matter 里 `categories` 数组的第一个作为分类名；没有就显示板块名 `.Section`。

---

## 7. 分类与标签页：`taxonomy.html` / `term.html`

### 7.1 `taxonomy.html`（聚合页：`/categories/` 和 `/tags/`）

```html
<h1 class="article-title" style="margin-top:60px;">{{ .Title }}</h1>

{{ if eq .Data.Singular "category" }}
{{/* 分类页：大卡片，左侧深绿竖线 */}}
<div class="taxonomy-cards">
  {{ range .Data.Terms.ByCount }}
  <a class="taxonomy-card" href="{{ .Page.RelPermalink }}">
    <span class="taxonomy-name">{{ .Page.Title }}</span>
    <span class="taxonomy-count">{{ .Count }} 篇</span>
  </a>
  {{ end }}
</div>
{{ else }}
{{/* 标签页：小按钮云 */}}
<div class="tag-cloud">
  {{ range .Data.Terms.ByCount }}
  <a class="tag-btn" href="{{ .Page.RelPermalink }}"># {{ .Page.Title }} <span class="tag-count">{{ .Count }}</span></a>
  {{ end }}
</div>
{{ end }}
```

- `.Data.Singular`：当前分类法的单数名（categories → `category`，tags → `tag`）。**同一个模板按分类法类型分支**——分类显示成大卡片，标签显示成按钮云，这是 Hugo 模板里常见的"一模板两用"技巧；
- `.Data.Terms.ByCount`：所有分类/标签条目，按文章数倒序。每个 Term 对象有 `.Page`（条目页）和 `.Count`（文章数）；
- `.Page.RelPermalink`：条目页的链接（如 `/categories/reading/`）。

### 7.2 `term.html`（条目页：`/tags/foo/`）

```html
<h1>{{ .Title }}</h1>
{{ .Content }}
{{ range .Pages }}
  <h2><a href="{{ .RelPermalink }}">{{ .LinkTitle }}</a></h2>
{{ end }}
```

- `.Content`：如果条目页有内容（`content/tags/foo/_index.md` 写了正文）会渲染出来；
- `.Pages`：打上这个标签/分类的所有文章；
- `.LinkTitle`：优先用 front matter 里的 `linkTitle`，没有就用标题——链接文字专用字段。

> 对比：`term.html` 极简，`taxonomy.html` 有完整视觉。这也是学习点——**模板可以只做"功能正确"，视觉交给需要的地方**。

---

## 8. 文章页：`page.html` / `single.html`

> 优化版位置：`layouts/page.html`、`layouts/single.html`（原 `single.html` 在 `_default/`，已上移；内容未改动）。

这两个文件内容几乎相同，区别只有一行。**v0.146+ 下 `layouts/page.html`（新名）优先于 `single.html`（标准兜底布局）**。

以 `page.html` 为例逐行拆：

```html
{{ $author := .Site.Params.author | default .Site.Title }}
{{ $sectionTitle := "" }}
{{ $sectionURL := "" }}
{{ with .CurrentSection }}
  {{ $sectionTitle = .Title }}
  {{ $sectionURL = .RelPermalink }}
{{ end }}
```

- `$author`：站点配置里 `params.author`，没配就用站点名；
- `with .CurrentSection`：拿到这篇文章**所属的板块**（对 `post/study/foo.md` 而言是 `study` 板块，前提是它有 `_index.md`；注意 `.Section` 返回 `post` 而 `.CurrentSection` 返回最近一级板块——两者不同，别混）。`with` 块内 `.` 变成板块对象，取它的标题和链接。

```html
<!-- 文章 meta 行：日期 · 阅读时长 · 板块 · BY 作者 -->
<div class="article-meta-top">
  <span>{{ .Date.Format "2006.01.02" }}</span>
  <span>{{ .ReadingTime }} MIN READ</span>
  {{ with $sectionTitle }}<span>{{ . }}</span>{{ end }}
  <span>BY {{ $author }}</span>
</div>
```

- `.Date.Format "2006.01.02"`：日期格式化。**"2006.01.02" 是 Go 的参考时间格式**（不是随便写的格式串）；
- `.ReadingTime`：Hugo 按字数自动估算的阅读分钟数。

```html
<h1 class="article-title">{{ .Title }}</h1>

<article class="article-card">
  <div class="article-content">
    {{ .Content }}
  </div>
</article>
```

- `.Content`：**Markdown 渲染后的完整 HTML 正文**——这是单页模板最核心的一行。

```html
<nav class="post-nav-buttons">
  <a class="nav-btn" href="{{ "/" | relURL }}">← 首页</a>
  {{ with $sectionURL }}<a class="nav-btn" href="{{ . }}">☰ {{ $sectionTitle }}</a>{{ end }}
  <a class="nav-btn" href="{{ "/archives/" | relURL }}">▦ 归档</a>
  <a class="nav-btn" href="#" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;">↑ 顶部</a>
</nav>
```

- 文末四个按钮；"板块"按钮只在 `$sectionURL` 非空时出现（`with` 的省略用法）；
- "顶部"按钮用内联 `onclick` 平滑滚动——演示了"模板里直接写一点原生 JS"的简单场景。

```html
{{ partial "terms.html" (dict "taxonomy" "tags" "page" .) }}
```

- **page.html 独有的那一行**：把当前页 `.` 和分类法名 `"tags"` 包成字典传给 `terms.html`，渲染文章底部的标签列表。`_default/single.html` 里没有这一行（所以旧版 Hugo 下文章页不显示标签）。

> 结论：v0.146+ 渲染文章时走 `page.html`（带标签）；旧版走 `single.html`（不带标签）。又一次版本差异。

---

## 9. 全部文章列表：`list.html`

> 优化版位置：`layouts/list.html`（原在 `_default/`，已上移；内容未改动）。在新系统中它是 `list` 标准布局，作为各 list kind 的兜底。

```html
<h1 class="page-title">全部文章</h1>

<div class="all-posts-grid">
    {{ $paginator := .Paginate (where site.RegularPages "Type" "in" site.Params.mainSections) }}
    {{ range $index, $page := $paginator.Pages }}
    <div class="all-post-item">
        <div class="post-index">{{ printf "%02d" (add $index 1) }}</div>
        <div class="all-post-content">
            <a href="{{ .RelPermalink }}" class="post-title">{{ .Title }}</a>
            <div class="post-meta">
                {{ with .Section }}{{ . | humanize }} · {{ end }}
                {{ .Date.Format "2006.01.02" }} · {{ .ReadingTime }} MIN
            </div>
        </div>
    </div>
    {{ end }}
</div>
```

- `site.Params.mainSections`：**这是 Hugo 内置参数**（不是作者发明的）。站点不配置时，Hugo 默认取"文章数最多的板块"；也可以在 `[params]` 里显式指定（如 `mainSections = ["post"]`）。所以 `where ... "Type" "in" site.Params.mainSections` = "只统计主要板块的文章"；
- `with .Section }}{{ . | humanize }}`：板块名转成人类可读形式（如 `study` → `Study`）；
- `{{ .Paginate }}`：分页器，默认每页 10 篇（可用站点配置 `paginate` 调整）。

```html
<div class="pagination">
    {{ if $paginator.HasPrev }}<a href="{{ $paginator.Prev.URL }}">← 上一页</a>{{ end }}
    {{ range $paginator.Pagers }}<a href="{{ .URL }}" class="{{ if eq . $paginator }}current{{ end }}">{{ .PageNumber }}</a>{{ end }}
    {{ if $paginator.HasNext }}<a href="{{ $paginator.Next.URL }}">下一页 →</a>{{ end }}
</div>
```

- `$paginator.Pagers`：所有页码页（PageNumber 1、2、3…），`eq . $paginator` 判断当前页并加 `current` 样式；
- `HasPrev / Prev.URL / HasNext / Next.URL`：分页器标准 API。

**实际生效范围**：v0.146+ 下 home/section/taxonomy/term 都有专属模板，`list.html` 实际上轮不到——它只在"某个 list kind 没有专属模板"时兜底。它是脚手架时代留下的通用模板。

---

## 10. 归档页：`archives.html`

> 优化版位置：`layouts/archives.html`（原在 `_default/`，已上移；内容未改动）。

```html
<h1 class="article-title" style="margin-top:60px;">归档</h1>

{{ $posts := where .Site.RegularPages "Section" "post" }}
{{ range $posts.GroupByDate "2006" }}
<div class="archive-year">
  <h2 class="archive-year-title">{{ .Key }}</h2>
  <div class="archive-list">
    {{ range .Pages.ByDate.Reverse }}
    <div class="archive-row">
      <span class="archive-date">{{ .Date.Format "01.02" }}</span>
      <a class="archive-title" href="{{ .RelPermalink }}">{{ .Title }}</a>
      <span class="archive-cat">{{ with .Params.categories }}{{ index . 0 }}{{ end }}</span>
    </div>
    {{ end }}
  </div>
</div>
{{ end }}
```

- `GroupByDate "2006"`：按年分组——这是 Hugo 聚合语法最漂亮的一处：返回一组"年 → 文章"的分组对象，每组的 `.Key` 是年份；
- `range ... .Pages.ByDate.Reverse`：组内按日期倒序；
- 日期只显示 `01.02`（月.日）；
- 每篇取第一个分类显示在行尾。

**触发方式（重要）**：`archives.html` 不是任何 kind 的默认模板名，必须由站点内容"点"出来。标准做法是创建 `content/archives/_index.md` 并在 front matter 里写 `layout = 'archives'`（Hugo 的 layout 查找链会命中 `layouts/archives.html`，优化版位置）。如果 `_index.md` 不写 layout，这个 section 会落到 `section.html`（板块模板）而不是归档模板。详见 §15。

---

## 11. 搜索：`search.html` + `searchindex.json`

这个主题的搜索是**纯前端方案**：构建时先生成全站索引 JSON，浏览器加载后用 Fuse.js 做模糊匹配，全程不需要后端。

### 11.1 `searchindex.json`（构建时生成的索引数据）

```html
{{/* 全站搜索索引：导出文章标题、链接、日期、正文纯文本 */}}
{{ $pages := where site.RegularPages "Section" "post" }}
{{ $pages := where $pages "Params.draft" "!=" true }}
[
{{ range $i, $p := $pages }}
  {{ if $i }},{{ end }}
  {
    "title":   {{ $p.Title | jsonify }},
    "url":     {{ $p.RelPermalink | jsonify }},
    "date":    {{ $p.Date.Format "2006.01.02" | jsonify }},
    "section": {{ $p.Section | jsonify }},
    "tags":    {{ $p.Params.tags | default slice | jsonify }},
    "content": {{ $p.Plain | jsonify }}
  }
{{ end }}
]
```

- 模板可以输出**任意文本格式**——这里直接在模板里手写 JSON 结构（注意这不是真 JSON 文件，是模板文件，Hugo 渲染后输出为 `/searchindex.json`）；
- `where ... "Params.draft" "!=" true`：再滤一遍草稿；
- `$p.Plain`：正文的纯文本版本（无 HTML）；
- `jsonify`：把字符串安全转义成 JSON 字面量（防引号破坏 JSON）——手写 JSON 时**必须**用它；
- `{{ if $i }},{{ end }}`：第一行不输出逗号，其余行输出逗号——手写数组时用序号判断逗号的经典技巧。

### 11.2 `search.html`（搜索页）

```html
<input id="search-input" type="search" ... autofocus />
<div class="search-meta" id="search-meta"></div>
<div id="search-results" class="search-results"></div>

<script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js"></script>
```

搜索页是一个"半静态"页面：Hugo 渲染出骨架，Fuse.js 从 CDN 引入（**注意：依赖外网 CDN，离线时搜索不可用**）。

```js
fetch('{{ "searchindex.json" | relURL }}')
  .then(r => r.json())
  .then(data => {
    fuse = new Fuse(data, {
      keys: [
        { name: 'title',   weight: 0.5 },
        { name: 'tags',    weight: 0.3 },
        { name: 'content', weight: 0.2 }
      ],
      includeMatches: true,
      threshold: 0.3,
      location: 0,
      distance: 100,
      minMatchCharLength: 1,
      ignoreLocation: true
    });
    if (input.value.trim()) render(input.value.trim());
  });
```

- `fetch` 索引文件 → 初始化 Fuse 实例；
- `keys` 给三个字段配**权重**：标题命中最值钱（0.5），标签次之（0.3），正文最低（0.2）——这就是"标题匹配排前面"的原理；
- `threshold: 0.3`：模糊度阈值（0 是精确匹配，1 是全部匹配）；`distance: 100` 允许字符间距容错；`ignoreLocation: true` 忽略位置。

```js
function render(q) {
    if (!fuse) return;
    const hits = fuse.search(q);
    meta.textContent = hits.length ? `找到 ${hits.length} 条结果` : '';
    results.innerHTML = hits.map(h => { ... }).join('');
}

function makeSnippet(content, q) {
    if (!content) return '';
    const idx = content.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return content.slice(0, 80) + '…';
    const start = Math.max(0, idx - 30);
    const end = Math.min(content.length, idx + q.length + 60);
    return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '');
}

let timer;
input.addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => render(e.target.value.trim()), 120);
});
```

- `makeSnippet`：手写"命中上下文摘录"——找到关键词位置，前后各截一段，加省略号；
- **防抖（debounce）**：120ms 内只执行最后一次——打字时不会每敲一个字母都搜一次；
- `fuse.search(q)` 返回带 `.item` 的命中对象，`hits.length` 就是结果数。

---

## 12. Partials 组件逐个拆解

### 12.1 `header.html`（顶部导航，baseof 引用）

```html
<header class="site-header">
    <a href="{{ .Site.BaseURL }}" class="logo">{{ .Site.Title }}</a>
    <nav class="nav-menu">
        {{ range .Site.Menus.main }}
        <a href="{{ .URL }}">{{ .Name }}</a>
        {{ end }}
    </nav>
</header>
```

- 左侧 logo = 站点名（CSS 里 `::before` 加了个红色 ♦）；
- 右侧菜单 = `range .Site.Menus.main`——**遍历站点配置 `[menu.main]` 里定义的菜单项**，见 §15；
- 这是"菜单由站点配置驱动、模板只负责渲染"的标准写法。

### 12.2 `footer.html`（页脚，baseof 引用）

```html
<footer class="site-footer">
    <p>赛博后花园 · By:JiangTieZhu</p>
    <p>Copyright {{ now.Year }}. All rights reserved.</p>
</footer>
```

- `now.Year`：当前年份（自动更新）；
- **注意**：作者名是硬编码的——换作者要改模板。这是可维护性上值得改进的点（见 §17）。

### 12.3 `marquee.html`（跑马灯，baseof 引用）

```html
<div class="marquee-wrapper">
    <div class="marquee-content">
        时刻保持空杯心态&nbsp;&nbsp;&nbsp;&nbsp;
        时刻保持空杯心态&nbsp;&nbsp;&nbsp;&nbsp;
    </div>
</div>
```

- 文案重复两遍——CSS 动画 `translateX(-50%)` 让容器左移一半再循环，接缝刚好无缝（见 style.css 的 `@keyframes scroll`）。这是**纯 CSS 无限跑马灯**的标准做法；
- 文案也是硬编码。

### 12.4 `terms.html`（文章标签，page.html 引用）

```html
{{- $page := .page }}
{{- $taxonomy := .taxonomy }}

{{- with $page.GetTerms $taxonomy }}
  {{- $label := (index . 0).Parent.LinkTitle }}
  <div>
    <div>{{ $label }}:</div>
    <ul>
      {{- range . }}
        <li><a href="{{ .RelPermalink }}">{{ .LinkTitle }}</a></li>
      {{- end }}
    </ul>
  </div>
{{- end }}
```

- 这是 **Hugo 官方文档的示例代码**（`hugo new theme` 脚手架自带）：调用方传 `(dict "taxonomy" "tags" "page" .)`，它解包后用 `$page.GetTerms "tags"` 拿到当前页的标签集合；
- `(index . 0).Parent.LinkTitle`：取第一个标签的父级（即分类法本身）的名字当标题（如 "Tags"）；
- 模板里以 `{{-` 开头表示**吃掉前面的空白**——用 Hugo 时常见的小技巧，避免输出多余换行。

### 12.5 `menu.html`（脚手架遗留，未被引用）

Hugo 官方菜单遍历示例（含递归子菜单、`active`/`ancestor` 高亮、i18n 翻译），完整但**当前主题没用它**——`header.html` 自己用 `range .Site.Menus.main` 实现了更简单的菜单。留着它是为了将来做多级菜单/高亮时参考。

### 12.6 `head.html` / `head/css.html` / `head/js.html`（脚手架遗留，未被引用）

`hugo new theme` 生成的"标准头部"三件套，写法很规范：

- `head/css.html`：`resources.Get "css/main.css"` → `css.Build`（用 `hugo.IsDevelopment` 判断开发/生产：开发不压缩、带 sourceMap；生产压缩 + `fingerprint` + `integrity`（SRI 完整性校验））；
- `head/js.html`：同款流程处理 `js/main.js`；
- `head.html`：组装 meta、title、上面两个 partial（用 `partialCached` 缓存）。

**但它们没被 baseof.html 引用**——baseof 直接内联加载了 `css/style.css`，所以这套规范流程是"写了但没接电"。如果你想把 main.js 挂上站点，接法就是：在 baseof.html 的 `<head>` 里加 `{{ partialCached "head/js.html" . }}`（或直接抄它的加载逻辑）。

---

## 13. 样式系统：`assets/css/style.css`

这是主题真正的外貌。全文件约 930 行，按区块组织，可以当"新粗野主义 CSS 参考"来读。

### 13.1 设计令牌（`:root` 变量）

```css
:root {
  --bg-color: #F6F4F0;          /* 米白底色 */
  --text-main: #111111;         /* 主文字近黑 */
  --text-muted: #666666;        /* 次要文字灰 */
  --primary-red: #E53935;       /* 主色：粗野主义红 */
  --highlight-yellow: #FFEB3B;  /* 强调黄（徽章/搜索聚焦） */
  --border-black: #000000;      /* 粗黑描边 */
  --shadow-hard: 5px 5px 0px 0px #000000;  /* 硬阴影：无模糊、纯偏移 */
  --font-sans: 'Inter', -apple-system, ...;
  --font-mono: 'JetBrains Mono', 'Courier New', Courier, monospace;
}
```

**新粗野主义的核心配方就藏在这些变量里**：
- 红 + 黄 + 黑 + 米白的撞色；
- `5px 5px 0 0` 的**硬阴影**（没有 `blur`，像印刷油墨错位）——这是 neo-brutalism 最标志性的手法；
- 正文 sans、日期/数字 mono（等宽字体制造"仪表感"）。

### 13.2 区块速览

| 区块 | 类名 | 关键手法 |
|---|---|---|
| 全局 | `* { box-sizing: border-box; margin:0; padding:0 }` | 重置 |
| 导航 | `.site-header` / `.logo` / `.nav-menu` | flex 两端对齐；logo 用 `::before` 加红色 ♦ |
| 首页 Hero | `.hero-red-box` | 红色底 + 白字 + 硬阴影 + 5rem 超大标题 |
| 硬卡片 | `.brutal-card` | 白底 + 2px 黑边 + 硬阴影（全站通用卡片） |
| 徽章 | `.badge-new` | 黄底 + 黑边，小号加粗 |
| 统计条 | `.stats-bar` | 上下 1px 细线夹住，红字大数字 |
| 板块网格 | `.category-card` | **左侧 8px 红色竖线**（`border-left`）+ 硬卡片 |
| 文章列表项 | `.post-item` | flex：日期固定 `width:135px` 左对齐，标题 `flex-grow` 吃满 + 省略号 |
| 全部文章 | `.all-posts-grid` | 双列网格（`1fr 1fr`） |
| 分页 | `.pagination` | 按钮化：黑边 + `3px 3px 0` 硬阴影，`current` 反红 |
| 页脚 | `.site-footer` | 上细线 + 灰 mono 小字 |
| 跑马灯 | `.marquee-wrapper` | 红底白字，负 margin 通栏，`@keyframes scroll` 无限滚动 |
| 文章页 | `.article-card` / `.article-content` | 杂志排版：大标题 4rem、正文行高 1.9、h2 左侧深绿竖线、代码块深色底、引用块浅灰底+竖线 |
| 文末按钮 | `.nav-btn` | 黑边白底 + `4px 4px 0` 硬阴影，hover 上浮、active 下压（**按下去的手感**） |
| 归档 | `.archive-year` / `.archive-row` | 年份大标题 + 行式列表（日期 / 标题 / 分类） |
| 标签云 | `.tag-btn` | 小按钮 + hover 位移 |
| 分类大卡 | `.taxonomy-card` | 左侧 **8px 深绿**竖线（与红色板块区分） |
| 板块列表 | `.section-post-card` / `.spc-*` | 卡片 + 序号 + 摘要 |

### 13.3 动效哲学（新粗野主义的"物理感"）

```css
.category-card:hover { transform: translate(-3px, -3px); box-shadow: 8px 8px 0 0 var(--border-black); }
.category-card:active { transform: translate(2px, 2px);  box-shadow: 3px 3px 0 0 var(--border-black); }
```

- hover：卡片向左上"浮起"，阴影变大（像被拿起来）；
- active（按下）：卡片向右下"陷落"，阴影变小（像被按下去）；
- 全部过渡 `0.12s ease`——**短、快、硬**，与"粗野"的气质一致；
- 文章列表项 hover：左侧出现红色竖线 + 背景微变——精细的交互反馈。

### 13.4 响应式

- 断点 `@media (max-width: 768px)`（共 3 处）；
- 关键调整：网格全变单列、Hero 标题缩到 2.5rem、`post-item` 改成**上下排列**（日期不再固定宽）、文章卡片内边距收缩、标签按钮缩小；
- 手机上跑马灯/统计条都能换行。

---

## 14. 资源管线与脚手架遗留文件

### 14.1 真正在用的加载链（baseof.html 内联）

```
assets/css/style.css
  → resources.Get "css/style.css"
  → minify（生产压缩）
  → fingerprint（文件名带哈希）
  → <link rel="stylesheet" href="/css/style.<hash>.css">
```

注意：这条链**没有**用 `css.Build`（因为 style.css 没有 `@import`、没有可编译特性，直接用 minify 就够）；也**没有**设 `integrity`（head/css.html 里有，baseof 里没有）。

### 14.2 脚手架遗留（存在但没被加载）

> 说明：以下文件在**优化版中已全部删除**（不影响渲染，已用 v0.163.3 构建验证，输出与原始主题逐字节一致）。本节保留描述，是为了让你了解原始主题里"存在但未生效"的文件长什么样——这是阅读第三方主题时最常见的情况，值得认识。

`hugo new theme` 脚手架默认生成 `assets/css/main.css`、`assets/css/components/header.css`、`assets/css/components/footer.css`、`assets/js/main.js`，以及 `layouts/_partials/head*.html`、`menu.html`。主题作者保留这些文件但**换用了自己的 `style.css` 体系**，于是：

| 文件 | 内容 | 是否生效 |
|---|---|---|
| `main.css` | `@import "components/header.css"` + 基础样式 | ✗ 未被引用 |
| `components/header.css` | `header { border-bottom: ... }` | ✗ 未被引用 |
| `components/footer.css` | `footer { border-top: ... }` | ✗ 未被引用 |
| `main.js` | `console.log('This site was generated by Hugo.')` | ✗ 未被引用 |
| `head.html` / `head/css.html` / `head/js.html` | 规范资源加载 | ✗ baseof 未引用 |
| `menu.html` | 官方菜单示例 | ✗ 未被引用 |

> 目录名小知识：`_partials/` 是 v0.146+ 新系统的**标准** partials 目录名（旧版叫 `partials/`），主题用对了名字；但目录里这些 `head*.html` / `menu.html` 是旧版脚手架的产物，没有被 baseof 引用——属于"目录名正确、文件内容未接线"。

> 学习点：**"文件存在 ≠ 文件生效"**。判断一个资源是否生效，要看有没有模板引用它、且该模板是否真的被渲染。这 6 个文件 + `index.html`、`single.html`、`list.html` 就是本主题的"休眠区"。

### 14.3 `static/` 与 `assets/` 的区别

- `static/`：原样拷贝到 `public/`，不经过任何处理（favicon.ico 就放这里）；
- `assets/`：必须通过 Hugo Pipes（`resources.Get` 等）处理后才输出。

---

## 15. 主题与站点的"配置契约"

主题是"半成品"，它**假定**站点侧提供以下内容才会完整工作。这是读懂该主题必须知道的外部约定。

### 15.1 站点配置 `hugo.toml`（最小可用版）

```toml
baseURL = "https://example.com/"
languageCode = "zh-cn"
title = "赛博花园"
theme = "cybergarden"
paginate = 10                 # list.html 分页大小（默认 10）

[params]
  author = "JiangTieZhu"      # 文章页 "BY 作者" 那一行
  description = "一个赛博花园" # 首页红色大框里的说明文字
  mainSections = ["post"]     # 可选；不设则 Hugo 默认选文章最多的板块

[menu]                        # 顶部导航由这里驱动
  [[menu.main]]
    name = "首页"
    url = "/"
    weight = 1
  [[menu.main]]
    name = "搜索"
    url = "/search/"
    weight = 2
  [[menu.main]]
    name = "归档"
    url = "/archives/"
    weight = 3

# 输出格式：生成 /searchindex.json（搜索页的数据源，必配，否则搜索会 404）
[outputFormats.searchindex]
baseName = "searchindex"
isPlainText = true
mediaType = "application/json"
notAlternative = true

[outputs]
home = ["html", "searchindex"]
```

> **关于 `searchindex.json` 的触发机制**：主题只提供了 `layouts/searchindex.json` 模板，但**它不会自动生成**。Hugo 的输出格式（output format）机制规定：模板文件名里的 `searchindex` 对应一个名为 `searchindex` 的输出格式（上面 `[outputFormats.searchindex]`），并且某类页面的 `outputs` 必须把它包含进来（示例把 `searchindex` 加给了首页）——这样构建时才会在站点根目录产出 `/searchindex.json`。这是**站点侧配置**，属于主题的隐性约定之一；不配的话搜索页的 `fetch('searchindex.json')` 会 404。

### 15.2 内容结构（主题的硬性约定）

```
content/
├── _index.md                     # 首页自身（可选）
├── post/                         # 顶级板块（.Section == "post"）
│   ├── _index.md                 # post 板块页（可选标题）
│   ├── study/_index.md           # ★ 首页"学习"板块的入口页
│   ├── study/xxx.md              # 文章
│   ├── thoughts/_index.md        # ★ "随想"
│   ├── reading/_index.md         # ★ "观影与阅读"
│   └── gaming/_index.md          # ★ "游戏"
├── archives/_index.md            # ★ 归档页，front matter 需写 layout = 'archives'
└── search.md                     # ★ 搜索页，front matter 需写 layout = 'search'
```

**三条硬性约定，缺一不可**：

1. **板块目录必须有 `_index.md`**：Hugo 规定"顶级目录天然是 section，子目录只有含 `_index.md` 才算 section"。`content/post/study/` 没有 `_index.md` 时，`site.GetPage "post/study"` 返回 nil → 首页该板块显示"还没有内容"，且 `/post/study/` 直接 404；
2. **归档页**：`content/archives/_index.md` 里写 `layout = 'archives'`，才会命中 `layouts/archives.html`；不写则落到 `section.html`（板块样式）；
3. **搜索页**：`content/search.md` 里写 `layout = 'search'`，配合根目录的 `layouts/search.html`（主流主题通用做法）。

### 15.3 文章 front matter（由 `archetypes/default.md` 生成）

```toml
+++
date = '{{ .Date }}'
draft = true
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
+++
```

- `hugo new post/study/foo-bar.md` 会自动生成上面这段：`draft = true`（默认草稿，预览要加 `-D`）、标题由文件名 `foo-bar` → 把 `-` 换成空格 → `Title` 大小写格式（变成 `Foo Bar`）；
- 想给文章加标签/分类，手动加：

```toml
+++
title = "..."
date = "..."
draft = false
tags = ["hugo", "css"]
categories = ["学习"]
+++
```

---

## 16. 本主题用到的 Hugo 语法速查

| 语法 | 作用 | 出现位置 |
|---|---|---|
| `{{ .Title }}` / `{{ .Site.Title }}` | 页面标题 / 站点标题 | 各处 |
| `{{ if .IsHome }}` | 判断是否首页 | baseof |
| `{{ block "main" . }}{{ end }}` + `{{ define "main" }}` | 母版插槽机制 | baseof + 所有页面模板 |
| `{{ partial "x.html" . }}` / `{{ partialCached "x.html" . }}` | 引用组件（带缓存） | baseof / head |
| `{{ partial "x.html" (dict "k" "v" "page" .) }}` | 传参给 partial | page.html → terms.html |
| `where site.RegularPages "Section" "post"` | 筛选页面集合 | home / archives / searchindex |
| `first 1 (...)`, `first 4 (...)` | 取前 N 条 | home |
| `len (...)`, `len site.Taxonomies.tags` | 集合长度 | home / section |
| `.Pages.ByDate.Reverse` | 页面按日期倒序 | section / archives |
| `.Paginate (...)` + `$paginator.Prev/Next/Pagers/PageNumber` | 分页 | list |
| `.GroupByDate "2006"` + `.Key` | 按年分组 | archives |
| `.Date.Format "2006.01.02"` | 日期格式化（Go 参考时间） | 各处 |
| `now.Year` / `now.Format` | 当前时间 | footer / index |
| `.ReadingTime` | 阅读分钟数 | 各处 |
| `.Content` / `.Plain` / `.Summary` | 正文 / 纯文本 / 摘要 | page / searchindex / section |
| `plainify`, `truncate 60`, `humanize`, `printf "%02d"`, `add` | 文本与数字管道 | section / list |
| `slice`, `dict`, `index . 0` | 造数组/对象/取元素 | home / taxonomy / section |
| `site.GetPage "post/study"` | 按路径取页面 | home |
| `$page.GetTerms "tags"` | 取页面所属分类条目 | terms |
| `.Data.Singular`, `.Data.Terms.ByCount` | 分类法信息 | taxonomy |
| `with` / `default` / `eq` / `cond` | 控制流与兜底 | 各处 |
| `jsonify` | JSON 转义 | searchindex |
| `relURL` / `.RelPermalink` / `.Site.BaseURL` | URL 处理 | baseof / header / page |
| `resources.Get` / `minify` / `fingerprint` / `css.Build` / `js.Build` | 资源管线 | baseof / head/css / head/js |
| `hugo.IsDevelopment` | 开发/生产判断 | head/css / head/js |
| `site.Params.mainSections` | Hugo 内置主要板块参数 | list |
| `{{-` / `-}}` | 吃掉输出两侧空白 | terms / menu |

---

## 17. 已知问题与改进建议

读完代码后值得知道的坑与可优化点（按重要性排序）：

1. **首页板块写死**：`home.html` 里 4 个板块（title/path/url）是硬编码。加板块要改模板；建议挪到站点配置（`params.boards`）用 `range` 渲染；
2. **`content/post/study/` 必须有 `_index.md`**：否则板块显示"还没有内容"且链接 404。主题没有 README 说明这个约定，是最大的隐性坑；
3. **归档/搜索入口是"隐藏约定"**：需要站点手动建 `content/archives/_index.md`（layout: archives）和 `content/search.md`（layout: search）。主题内两个模板虽然都在，但没有文档说明触发方式；
4. **footer 与 marquee 文案硬编码**："赛博后花园 · By:JiangTieZhu"、跑马灯文字都写死在 partial 里，换站点要改主题源码；建议改用 `site.Params` 或 i18n；
5. **脚手架死代码偏多**：原始主题中 `menu.html`、`head*.html`、`main.css`、`main.js`、`index.html` 都未生效，`single.html`、`list.html` 仅兜底。✅ **已在优化版处理**：删除了完全无效的文件，`single.html`/`list.html` 作为新系统标准兜底布局名保留在 layouts 根目录；
6. **旧版/新版 Hugo 渲染结果不一致**：原始主题中 `index.html` 与 `home.html`、`page.html` 与 `single.html` 并存，v0.146 前后行为不同（首页、标签显示都会变）。✅ **已在优化版处理**：按你确认的 v0.163.3 删除了 `index.html`，并把 `_default/` 下 4 个模板上移到 `layouts/` 根目录（新规范位置），行为与原始主题完全一致（已验证）；
7. **搜索依赖外网 CDN**：Fuse.js 从 jsdelivr 加载，断网/被墙时搜索不可用；可改为本地化（用 `resources.GetRemote` 下载进 `assets/` 或 npm 打包）；
8. **`list.html` 用了 `site.Params.mainSections` 内置参数**：不配置时 Hugo 自动选"文章最多的板块"，行为可能和作者预期不符；
9. **favicon 无 `<link rel="icon">`**：靠浏览器默认约定请求 `/favicon.ico`，通常能用，但无法自定义 MIME/多尺寸；
10. **`.article-content img` 无懒加载/无 alt 兜底**：文章图片建议加 `loading="lazy"` 与 width/height 防止布局抖动；
11. **搜索索引依赖站点输出格式配置**：`layouts/searchindex.json` 模板不会自动生成文件，站点必须定义 `[outputFormats.searchindex]` 并把 `searchindex` 加进某类页面的 `outputs`（示例见 §15.1），否则 `/searchindex.json` 缺失、搜索页请求 404。这属于站点侧配置，优化版未改动（不是主题文件问题）。

---

## 18. 学习路线总结

这份主题是学习 Hugo 的极佳样本，因为它**小而全**：

1. **模板系统**：先看 §3 的 kind 表格 → 读 `baseof.html`（外壳）→ 随便挑一个页面模板（如 `section.html`）看 `define "main"` 如何填槽；理解"外壳 + 插槽 + 组件"三层结构；
2. **数据流**：从 `content/*.md` 出发，跟踪 front matter → 模板变量（`.Title`、`.Date`、`.Params`）→ 输出 HTML 的路径；再反向从 `home.html` 的 `GetPage`/`where` 理解"查询内容"；
3. **Hugo Pipes**：对比 baseof 内联加载（minify+fingerprint）与 `head/css.html` 的完整管线（css.Build + SRI），理解 assets 机制；
4. **前端与样式**：`style.css` 的变量 → 硬阴影/撞色配方 → 交互动效 → 响应式，是一套完整的新粗野主义设计系统；
5. **纯前端搜索**：`searchindex.json`（构建期生成 JSON）→ `search.html`（Fuse.js 模糊检索）→ 防抖 → 摘要截取，可推广到任意静态站点；
6. **工程思维**：从 §17 的问题清单学习"如何 review 一个主题"——硬编码、版本兼容、文档缺失、死代码，都是真实项目里最常见的坑。

**一句话总结**：Cybergarden = 一套新粗野主义设计系统（style.css）+ 一个按 kind 分发的模板骨架（layouts/）+ 一组"站点必须配合"的内容约定（_index.md、layout front matter、菜单与参数配置）。把这三层拆开理解，整个主题就完全读懂了。

---

## 19. 优化变更说明（原主题 → 优化版）

变更目的：让主题完全符合 Hugo v0.146+（你使用的 **v0.163.3**）的新模板系统规范，去掉永不生效的死代码，同时**保证渲染行为 100% 不变**。

| 变更 | 说明 |
|---|---|
| 删除 `layouts/index.html` | v0.146+ 起首页模板不再叫 index.html（官方已移除该概念），属死文件 |
| 删除 `layouts/_partials/menu.html` | 官方菜单示例，未被任何模板引用 |
| 删除 `layouts/_partials/head.html` + `head/css.html` + `head/js.html` | 旧脚手架头部三件套，baseof 未引用 |
| 删除 `assets/css/main.css` + `components/header.css` + `components/footer.css` | 旧脚手架样式，未被加载 |
| 删除 `assets/js/main.js` | 旧脚手架脚本，未被引用 |
| `_default/baseof.html` → `layouts/baseof.html` | v0.146+ 官方移除 `_default` 目录，模板上移到根目录（新规范位置） |
| `_default/archives.html` → `layouts/archives.html` | 同上 |
| `_default/list.html` → `layouts/list.html` | 同上（保留为新系统标准 `list` 布局兜底） |
| `_default/single.html` → `layouts/single.html` | 同上（保留为新系统标准 `single` 布局兜底） |

**验证方式**：用 Hugo v0.163.3（extended）构建同一个测试站点（含 4 个板块、2 篇文章、归档页、搜索页、搜索索引），优化前后 `public/` 输出经 `diff -r` 对比**逐字节一致**（包括 CSS 哈希文件名、RSS 与 JSON 文件）；并逐一确认各页面实际命中的模板符合预期：首页 = `home.html`、文章 = `page.html`（含标签区）、板块 = `section.html`、分类/标签聚合 = `taxonomy.html`、条目 = `term.html`、归档 = `archives.html`（layout 触发）、搜索 = `search.html`、`/searchindex.json` 正常生成。

**未改动的内容**：所有模板文件内容、`style.css`、`static/favicon.ico`、`archetypes/default.md`、`theme.toml` 均保持原样；`content/`、`data/`、`i18n/` 空目录按主题惯例保留。

---

## 参考资料

- Hugo 模板查找顺序（官方文档，含 v0.146 新模板系统说明）：https://gohugo.io/templates/lookup-order/
- Hugo v0.146 新模板系统讨论（page.html/single.html 优先关系）：https://discourse.gohugo.io/t/documentation-of-the-new-template-system-in-hugo-v0-146-0/54686
- Hugo 页面变量（`.Section` 返回顶级板块等）：https://gohugo.io/variables/page/
- Hugo 经典版查找顺序文档镜像（layout 触发链）：https://hugo-docs.netlify.app/templates/lookup-order/
- Fuse.js 模糊搜索库：https://fusejs.io/
