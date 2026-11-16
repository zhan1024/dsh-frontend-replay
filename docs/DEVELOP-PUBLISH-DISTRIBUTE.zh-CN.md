# 前端验修台 · Frontend Replay：开发、发布、市场收录与安装

包名：`dsh-frontend-replay`。本轮版本：`0.2.0`。

本次由 Repro / `dsh-repro` 更名，目的是让名称直接表达前端故障录制、回放和修复验收的用途。历史发布不覆盖、不删除；[0.1.0 操作记录](./DEVELOP-PUBLISH-DISTRIBUTE-0.1.0.zh-CN.md)和[历史校验记录](./PUBLISHED-VERIFICATION-0.1.0.md)保持独立。

## 1. 本轮分发状态

| 渠道 | 实际状态 | 入口 |
| --- | --- | --- |
| npm | 0.2.0 更名包待发布和匿名下载复验 | https://www.npmjs.com/package/dsh-frontend-replay |
| GitHub | 仓库已更名并保留原创建时间；0.2.0 标签和 Release 待发布 | https://github.com/zhan1024/dsh-frontend-replay |
| DSHMarket / awesome-dsh-plugin | 继续更新原 PR #15772，待审核与索引 | https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/15772 |
| DeepseekPlugin | 旧名条目已上线，新名待提交和核验 | https://deepseekplugin.org/en/submit |
| dshplugin.io | 更新原投稿 #50，待维护者处理 | https://github.com/tjsdyy/dshplugin/issues/50 |

公开发布的实际证据记录在 [PUBLISHED-VERIFICATION.md](./PUBLISHED-VERIFICATION.md)。提交申请不等于市场已收录。

GitHub 原仓库创建于 `2026-11-16T03:54:47Z`。本轮使用原仓库更名，保留仓库历史和创建时间，预计于 **2026 年 11 月 17 日 11:54:47（北京时间）**达到上游要求的 24 小时门槛。年龄检查可以自动刷新，无需空提交、重开 PR 或重复投稿。

## 2. 核心开发

Harness 提供 Agent 循环、工具注册和生命周期。插件通过 `inject = ['tools']` 获取工具服务，在 `apply()` 注册工具，并通过 `ctx.effect()` 清理浏览器和本地工作台。

| 文件 | 作用 |
| --- | --- |
| `src/model.ts` | 用例、步骤、验收条件、输入校验和脱敏 |
| `src/browser.ts` | Chromium 录制、回放及浏览器证据 |
| `src/engine.ts` | 执行互斥、基线和验收、不可变运行快照 |
| `src/store.ts` | 本地用例、运行与截图持久化 |
| `src/report.ts` | HTML、Markdown、JSON 和 Playwright 导出 |
| `src/server.ts` | 回环 HTTP/API、启动令牌、Host/Origin 校验 |
| `src/index.ts` | DSH 插件入口和九个 `repro_*` 工具 |
| `src/cli.ts`、`ui/` | 独立 CLI 和中英文工作台 |

只有所有步骤和验收条件都通过才能显示通过；没有验收条件显示尚未验证。每次运行使用独立浏览器上下文，保存当时的用例快照。修复真实应用由开发者或 Agent 完成，插件负责证据与验收。

安装入口必须同时配置：

```json
{
  "name": "dsh-frontend-replay",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": { "dsh-frontend-replay": "./dist/cli.js", "dsh-repro": "./dist/cli.js" },
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } },
  "scripts": { "prepack": "npm run build" }
}
```

`cordis.patch.yml` 使用 `id: dsh-frontend-replay` 和 `name: dsh-frontend-replay`。为兼容旧用例，数据目录仍默认 `.dsh-repro`，环境变量仍为 `DSH_REPRO_DIR`、`DSH_REPRO_HEADLESS`；工具仍为 `repro_open` 等九个原有名称。

## 3. 本地开发与验证

独立模式要求 Node.js 22.15+；已验证的 DSH 0.2.2-rc.1 要求 Node.js 24.9+，profile 安装需 pnpm 10+。建议开发环境使用 Node 24 LTS。

```sh
git clone https://github.com/zhan1024/dsh-frontend-replay.git
cd dsh-frontend-replay
npm ci
npm run browsers
npm run typecheck
npm test
npm run test:e2e
npm run test:dsh
npm pack --dry-run --json
git diff --check
```

测试验证真实 Chromium 录制、修复前失败/修复后通过、无断言和执行失败状态、异常与网络证据、UI、中英文名称、窄屏与报告导出。DSH 测试从打包产物装入独立 profile，通过确定性的本地模型服务调用创建、回放和报告工具；这不代表模型推理质量测评。

可用 `DSH_BIN=/path/to/dsh` 复用宿主。若 npm 全局启用了 `legacy-peer-deps=true`，安装测试宿主时局部传入 `--legacy-peer-deps=false`。本地启动：`npm start -- --open`，依次体验示例、基线、示例修复、验收和导出。

## 4. npm 和 GitHub 发布

先完成代码、README、版本号和 `repository` 元数据，再运行上面的验证。将代码提交后固定标签，不移动已有标签。`0.2.0` 仅用于本轮更名，后续请选择未被占用的新版本。

```sh
FP_VERSION=0.2.0
git add package.json package-lock.json src ui test docs README.md README.zh-CN.md cordis.patch.yml CHANGELOG.md .github
git commit -m "feat: rename plugin to Frontend Replay"
git tag "v$FP_VERSION"
git push origin main
git push origin "v$FP_VERSION"
FP_ASSETS=$(mktemp -d)
npm pack --pack-destination "$FP_ASSETS"
(cd "$FP_ASSETS" && shasum -a 256 "dsh-frontend-replay-$FP_VERSION.tgz" > SHA256SUMS)
```

首次或授权失效时：`npm login --auth-type=web --registry=https://registry.npmjs.org/`。账号登录、CLI 授权和发布二次验证都在 npm 官方页面完成，不在文档、代码或聊天中保存密码、Token 或验证码。

```sh
npm whoami --registry=https://registry.npmjs.org/
npm publish "$FP_ASSETS/dsh-frontend-replay-$FP_VERSION.tgz" --access public --registry=https://registry.npmjs.org/
npm view "dsh-frontend-replay@$FP_VERSION" version dist.tarball dist.integrity --json --registry=https://registry.npmjs.org/
gh release create "v$FP_VERSION" "$FP_ASSETS/dsh-frontend-replay-$FP_VERSION.tgz" "$FP_ASSETS/SHA256SUMS" --repo zhan1024/dsh-frontend-replay --verify-tag --title "Frontend Replay · 前端验修台 v$FP_VERSION" --notes-file release-notes.md
```

`release-notes.md` 应在发布前写好实际改动、迁移方法和验证结果。npm 和 GitHub 上传同一份 `.tgz`。之后分别匿名下载，核对 SHA-256 与 npm integrity，在新 profile 安装并跑 DSH 测试。可用 `REPRO_PLUGIN_SPEC=dsh-frontend-replay@0.2.0 npm run test:dsh` 指定公开包；也可填 GitHub Release tarball URL。

在独立空目录执行 `npm exec --yes --package=dsh-frontend-replay@0.2.0 -- dsh-frontend-replay --help`，验证真实下载及新命令。包名更换需发布一个新 npm 包；旧包和旧版本不会自动改名或迁移统计。仅当新包确认可下载后，才在旧包添加迁移提示。

## 5. 市场上传与审核

DSHMarket 的收录源是 `awesome-dsh-plugin/awesome-dsh-plugin`。更新现有 PR，只保留一个当前名称的 `data/plugins/zhan1024__dsh-frontend-replay.yml`，按上游 schema 设置仓库 URL、名称、`browser` 分类、中英文描述、固定版本 tarball 和图标。不要修改自动生成的 README，也不要添加 `npm:` 字段；npm 包通过 `repository` 自动关联。用上游 `readEntries()` / `validateEntries()` 校验。

插件自己的 `screenshots.json` 声明 `docs/workbench.jpg`。图标用 `docs/icon.png`；截图与图标随源码公开。合并后还要在 DSHMarket 搜索 `dsh-frontend-replay`，核对作者、版本、安装命令及实际下载，才能确认收录完成。

DeepseekPlugin 在提交页填新仓库 URL 并执行其发布操作；核验公开详情及匿名查询结果。dshplugin.io 通过原 Issue #50 更新名称、仓库、包版本、双语说明、截图及安装命令。人工审核状态如实保留，避免重复创建同一插件的投稿。

## 6. 用户下载安装与升级

旧版用户先执行 `dsh plugin --profile web remove dsh-repro`，然后安装新包：

```sh
dsh plugin --profile web add dsh-frontend-replay@0.2.0
npm exec --yes --package=dsh-frontend-replay@0.2.0 -- dsh-frontend-replay install-browser
dsh web
```

在 DSH 中输入：“打开前端验修台，我要录制一个前端故障并验收修复。”打开 `repro_open` 返回的完整地址（包含启动令牌）。旧用例继续从同一个 `.dsh-repro/` 读取，跨启动目录可设置绝对路径 `DSH_REPRO_DIR`。

Release 安装：

```sh
dsh plugin --profile web add https://github.com/zhan1024/dsh-frontend-replay/releases/download/v0.2.0/dsh-frontend-replay-0.2.0.tgz
```

独立使用或只下载包：

```sh
npm exec --yes --package=dsh-frontend-replay@0.2.0 -- dsh-frontend-replay --open
npm pack dsh-frontend-replay@0.2.0 --registry=https://registry.npmjs.org/
```

Release Assets 还提供 `.tgz` 和 `SHA256SUMS`。工作流：创建用例 → 录制 → 添加验收条件 → 基线 → 修复应用 → 用相同步骤验收 → 导出报告。卸载新版：`dsh plugin --profile web remove dsh-frontend-replay`；用例与证据仍保存在本地数据目录。

后续每轮执行：代码验证 → 版本与标签 → npm/Release → 匿名下载和安装 → 更新现有市场条目 → 核验索引。npm 下载事件、GitHub 附件下载和实际用户量分别统计。
