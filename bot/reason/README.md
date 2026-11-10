# reason：danMCai 的搜索（引用自 guandanai）

大厅里选 **danMCai** 时，电脑用的是 guandanai 的搜索机器人 `9001`（guandanai 里叫 danMCai-reason-v000855042）：底座是 danMCai 冠军 `017` 的网络，
外面加一层“从公开信息推断别家暗牌 → 抽 8 种可能的牌分布 → 搜索”。它不是新训练的模型，也不是新的冠军。
这个目录是 guandanai 按 [接入指南](https://github.com/stevensun1005/guandanai/blob/main/web/docs/REASON_BOT_INTEGRATION.md) 第 4.1 节打出来的包，**原样引用，没有任何修改**。

- 打包所用的 guandanai 提交：`bbc7ed657af29c440b56da30daa8f2048cf6f92a`（2026-11-09，电脑出牌时间规则“60 秒出牌、50 秒推理、10 秒回落”；打进包里的网页代码与指南复核版 `2d10594` 相同，`git diff --stat 2d10594 bbc7ed6 -- web/src ai/danMCai ai/shared` 无输出）。
- 打包脚本按指南用 `awk` 从文档取出，SHA-256 `b421f0a3…dbd97` 与指南一致；打包前 `node --test web/tests/search-bot.test.mjs web/tests/turn-timing.test.mjs` 25 项全部通过。
- 上一版（2026-11-09 早些时候，提交 `181c12f`，每步 3／4 秒）的两个打包文件为 `f5d632bf…ba14`、`45c39536…3d36`，已替换；ORT 三个文件和两个网络没有变。

| 文件 | 字节 | SHA-256 |
| --- | --- | --- |
| `assets/search-worker.mjs` | 89,142 | `10079e4bddc771241cdb617ce7dab799a08870b9aca87cb97e77b6d993ba27a4` |
| `assets/reason-client.mjs` | 51,063 | `869ab81e3975e82bb21b8c2e49d73b4a6e57f3d24fce5d8f1493678002e27f0f` |
| `assets/vendor/ort.wasm.min.mjs` | 53,725 | `c21d9c326d453a4a61398270c804d5979e118540597cb0c07f7b3d64e6098234` |
| `assets/vendor/ort-wasm-simd-threaded.mjs` | 24,738 | `30ed0b5cd1182ede931fea448afb567d4dc705ec957af09f108a2be5f770dac3` |
| `assets/vendor/ort-wasm-simd-threaded.wasm` | 14,848,852 | `4b884c203b0fa48d057be3332c65513ff85aa3c5bddd6946acc0fab7ecda001d` |
| `models/bot-017.onnx` | 5,368,650 | `462afc99ee6bcfb788871d7a8f84d4298c008d57465c62d48ca1792cdb11b3f7`（与 `../danmcai/danmcai-v000855042.onnx` 字节相同） |
| `models/belief-v1-16d76783.onnx` | 3,931,285 | `16d767830e4536180fac56d744e95934b7525ab67b18d27df4f33066033d65e9`（推断网络） |

这 7 个文件全部与指南第 4.1 节的表一致；`web/build.py` 每次构建都核对 SHA-256 和字节数，不符就停止。目录结构不能改：Worker 按
`assets/vendor/…` 和 `models/…` 的相对位置加载 onnxruntime-web 和两个网络。

## 接入

接入代码在 `web/src/game/reason-bot.js`（牌桌）和 `web/src/coach/coach.js`（出牌评价）：

- 只有单人页面和房主页面为电脑搜索；一页只建一个 Worker，牌桌优先，出牌评价在后。
- 只发本座位的手牌和公开信息（`searchPayload`），其他三家的牌不进搜索。
- 桌上四家合计剩 40 张以内、出法多于一种、而且不能一手出完时才搜索；否则、或搜索没在时限内完成、或结果对不上本桌的牌，都按 017 出牌；017 也出错才改用 Clint 规则。
- **时间（60／50／10）**：电脑和真人一样，一手最多 60 秒。从回合开始（`botStart`，含思考停顿和第一次加载）算起，搜索最多 50 秒，52 秒还没结果就放弃；017 和搜索同时开始算，搜索回落时立即出 017，留出最后 10 秒。牌桌自己再设一道 53 秒的上限（包住加载客户端在内的整个搜索），`BOT_WAIT_MS` 为 60 秒，只有 017 本身也没算出来才调用 `botFail`。一手回落不影响下一手：下一手照常搜索。
- 牌谱里这类电脑记成 `9001`（`{"id":"9001","sha256":"442d888a…6a24","version":"v000855042-bsearch1-16d76783"}`，`sha256` 是 guandanai 的搜索清单摘要，不是文件 SHA），包括按 017 出的牌。
- 页面上仍叫 danMCai。

`stezer0`（忽略大小写）的出牌评价和 Top 5 不受房主的评价开关影响，使用真实四家手牌运行 danMCai 推理：
`web/build.py` 将校验过的原版 Worker 与 `open-coach-extension.js` 拼接为独立的 `assets/open-coach-worker.mjs`，原版七个文件保持不变。
这个独立评价 Worker 只搜索唯一的真实牌分布，20 张以内精确求解，其余阶段由 017 推演候选出法；未完成搜索时显示评价不可用，不回落为暗牌推荐。
其他用户名继续使用原版评价流程，只有 `stezer0` 的评价请求附带完整手牌。

## 自检

- **构建好的 Worker 与 guandanai 的 Node 参考版逐个比较**（指南第 14 节第 3 条，`web/tools/search-latency.mjs`，种子 731960000–731960059，无头 Chrome 157，
  页面从本仓库 `bot/reason/` 提供）：用 `bbc7ed6` 的打包重做：电脑预算（每步 50 秒）下 93 个决策 **93 个与 Node 完全相同，0 次回落**（耗时中位 0.26 秒、最长 3.2 秒）；
  手机代理（预算的四分之一，每步 12.5 秒、单次求解 0.75 秒）下 92 个相同、1 个回落，完成的决策里与 Node 不同的为 0。结果文件 [reason-latency.json](reason-latency.json)。这是开发种子上的一致性检查，不是棋力结果。
- 本地单人局（桌面浏览器）：电脑和出牌评价都完成了搜索，没有出错。
