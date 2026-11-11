# 掼蛋

两副牌的四人掼蛋网页游戏：进入大厅输入昵称，可以一个人和三位电脑玩家打，也可以开房间和朋友一起打。
包含洗牌切牌、进贡还贡、升级打 A、出牌计时、音效和背景音乐。

在线玩：https://clintsun1977.github.io/guandan/

## 和朋友一起打

1. 一个人在大厅点「开房间」，屏幕上会出现 4 位房间号，把它告诉朋友。
2. 朋友打开同一个网址，点「加入房间」，输入房间号，选一个空座位。
3. 大家坐好后，房主点「开始」。没人坐的座位由电脑来打。

房主的页面要一直开着，房主刷新或关掉页面，这局就结束了。
朋友中途掉线，他的座位由电脑接着打；点「回到游戏」或重新输入房间号、选回原座位，就回到当时的牌桌（手牌和出过的牌都在）。
联机是浏览器之间直接连接（PeerJS），个别网络环境可能连不上。
iPad 或手机锁屏、切到别的应用，或者网页在后台放久了，和配对服务器的连接可能会断。网页会自动重新连上，房间号不变，新朋友照样能进来。
房主刚关掉或刷新页面后，服务器常常要一分钟左右才放出这个房间号；这段时间进房间，15 秒没有回应就会提示「房间没有回应」，稍后再试就行。

## 电脑

大厅「电脑模型」一行选择电脑怎么打，由单人玩家或房主选定，进房间的朋友只能看：

| 选项 | 说明 |
| --- | --- |
| **默认** | Clint 的规则机器人（本项目自己的），开局默认选中。四家都只剩 12 张以内时换上**残局大脑**：把没见过的牌随机发给另外三家（按他们出牌、过牌的表现加权，最多 40 种），每种用精确求解器算每个出法的结果，只有别的出法明显比规则的出法好（≥0.2 级）才改；一次出牌最多算 30 秒，来不及就用规则的出法；只用公开信息和自己的手牌，不偷看别人的牌 |
| **danMCai** | **引用自 [guandanai](https://github.com/stevensun1005/guandanai)**：danMCai 冠军 `017` 的网络，加上 guandanai 的搜索（编号 `9001`）。桌上四家合计剩 40 张以内时，先从公开出牌推断别家可能的暗牌、抽 8 种牌分布；21–40 张把 017 估值前 6 的出法和"过"在每种分布里都打到本局结束比较，20 张以内对每种出法精确求解。超过 40 张、只有一种出法或一手能出完时直接按 017 出。电脑和真人一样每手最多 60 秒：从轮到它起最多搜索 50 秒，没算完就出同时算好的 017，留 10 秒余量；这一手没算完不影响下一手照常搜索（多数决策不到 1 秒） |
| GuanZero | 神经网络 `guanzero-adp-io48-303975`，**引用自 guandanai** 最新发布的 GuanZero |

神经网络和搜索在房主的浏览器里运行（onnxruntime-web；danMCai 的搜索在单独的 Worker 线程里，不卡页面），只看自己的手牌和公开信息；进贡、还贡仍按 Clint 规则。
模型加载失败时，牌桌会提示一次，电脑改用 Clint 规则继续打。

## 出牌评价

大厅「出牌评价」默认是关；单人玩家或房主选「开」后，轮到你出牌，左下角会显示 danMCai 对你选的牌的**合理性**：这一手所有能出的牌（含"过"）里，
模型值最高的算 100%，最低的算 0%。出牌后保留**上一手**的评分，到这一局结束。只用你自己的手牌和公开信息；
这是相对分，不是胜率。手机上显示在顶栏右侧。点 × 本场不再显示。
桌上剩 40 张以内时，评价用和电脑同样的搜索（在你自己的浏览器里算，电脑出牌优先），算完才显示数字（之前显示「评价中…」）；
21–40 张时只有最有希望的几种出法有分，其他显示「不评分」；搜索没算完就显示 017 网络自己的分。
评价固定用 danMCai 打分，和大厅「电脑模型」选的是「默认」、danMCai 还是 GuanZero 无关。

## 表情（引用自 guandanai）

对局中点右下角「复原」右边的圆形 😊 按钮，弹出「表情」「快捷语」两页，**只能从预设里选，不能输入文字**；同一个人两次发送至少隔 2.5 秒。

- **送礼物**：卡布奇诺、鲜花、炸弹，选好再点送给哪一家，礼物从你的名字牌飞到对方名字牌（炸弹会爆炸、对方座位震动）。
- **表情**：墨镜、哭，显示在你自己的名字旁。
- **快捷语**：8 句寒暄（不含提示出牌的话），在名字旁弹出，并由浏览器的中文朗读念出（跟随「音效」开关）。
- **电脑会回礼**：送礼物给电脑座位，电脑约 1–2 秒后回送礼物、戴墨镜或哭；每个电脑 6 秒内只回一次，不影响出牌。
- 面板底部「屏蔽他人表情」只对你自己的浏览器生效。联机时只传预设编号，由房主核对后转发；表情不进出牌记录、牌谱或云端采集。训练版和观战不显示。

代码在 `web/src/social/emotes.js`，样式 `web/src/styles/emotes.css`，移植自 guandanai 的 `web/src/social/` 和 `styles/social.css`。

## 牌谱采集（上传到 guandanai）

房间里**发牌和开打时至少有两名真人**，每局打完后房主的页面会把这一局的牌谱上传到
[guandanai](https://github.com/stevensun1005/guandanai) 的真人牌谱云端（同一个 Cloudflare Worker + D1 数据库），和 guandanai 自己网站的牌谱放在一起，
供之后 AI 训练使用。单人局、只有一名真人的房间、训练版、观战，以及房主转为单机之后，都不上传。

- 内容：发牌、进还贡、每一手出牌和过牌（标明真人／电脑／超时托管、用的哪个电脑、是否看过出牌评价）、名次。格式与 guandanai 的
  [采集说明](https://github.com/stevensun1005/guandanai/blob/main/web/collector/README.md) 完全相同，服务端会重放整局核对。
- 包含房间号和每位真人的昵称（电脑座位没有昵称）；不含聊天、语音或 IP。四个座位另有只在本场有效的随机 ID。「选项」里显示上传状态。
- **每一小局打完立刻上传**，中途关掉网页也不影响已经打完的小局；只有关掉时正在打、没打完的那一小局传不了（云端只收能完整核对的小局）。
- **同一把（从 2 打到 A 的整场）的所有小局用同一个 `matchId`**，`round` 依次编号。导出后按 `matchId` 把小局合成一把；
  打完整把的那一小局，云端算出的 `result` 里 `win` 或 `draw` 为真。
- **中途关掉、回来接着打仍算同一把**：房主的浏览器记住这一把停在哪（双方级数、打谁的级、上局名次、打 A 次数）。
  回来后打开「选级」，点里面的「继续上一把」，自动选好级并接上同一个 `matchId`、接着编号；自己在选级里设成完全一样的状态也会接上。
  整把打完（打过 A 或平局）后就不再提示。需要同一台电脑、同一个浏览器开房。
- 断网或上传失败时先存在房主浏览器里（IndexedDB），之后自动重试，收到云端确认才删除。
- 本项目上传的牌谱 `appVersion` 以 `c1977` 开头，可与 guandanai 自己网站的牌谱区分；电脑 ID 用 guandanai 的发布编号
  （danMCai 记 guandanai 搜索机器人 `9001`，没搜索、按 017 出的牌也记 `9001`；GuanZero `023`），Clint 规则为 `clint-rule`、版本 `clintsun1977-…`。
- 网址加 `?test=1` 时上传为测试局（`kind=test`），guandanai 默认导出时不包含。

代码在 `web/src/collection/`（移植自 guandanai 的 `web/src/collection/`）。

## 引用 guandanai 的机器人

danMCai（含它的搜索）、GuanZero 两个神经网络机器人和出牌评价**不是本项目训练或原创的**，引用自
[stevensun1005/guandanai](https://github.com/stevensun1005/guandanai)（Steven Sun 的掼蛋 AI 项目）：

| 引用的内容 | 来自 guandanai | 在本项目 |
| --- | --- | --- |
| danMCai 权重 | Release [`web-model-017`](https://github.com/stevensun1005/guandanai/releases/tag/web-model-017)（训练任务 `mac-20261105`，版本 `v000855042`） | `bot/danmcai/danmcai-v000855042.onnx` |
| GuanZero 权重 | Release [`web-model-023`](https://github.com/stevensun1005/guandanai/releases/tag/web-model-023)（训练任务 `guanzero-adp-io48`，步数 303975） | `bot/guanzero/guanzero-adp-io48-303975.onnx` |
| 浏览器推理代码 | `web/src/ai/` 的 `encoding.mjs`、`history.mjs`、`candidates.js`、`observation.js`、`endgame.js`、`policy-inference.mjs`、`table-policy.mjs` | 移植为 `bot/neural/neural-bot.js` |
| danMCai 的搜索（`9001`） | 按 [`web/docs/REASON_BOT_INTEGRATION.md`](https://github.com/stevensun1005/guandanai/blob/main/web/docs/REASON_BOT_INTEGRATION.md) 第 4.1 节打包（提交 `bbc7ed6`），推断网络来自 Release [`web-belief-v1-16d76783`](https://github.com/stevensun1005/guandanai/releases/tag/web-belief-v1-16d76783) | `bot/reason/`（原样，SHA-256 见 [bot/reason/README](bot/reason/README.md)），接入代码 `web/src/game/reason-bot.js` |
| 出牌评价 | `web/src/coach/evaluation.mjs`、`controller.js` | `bot/neural/neural-bot.js`（017 打分）、`bot/reason/`（搜索值）、`web/src/coach/coach.js`（显示） |

权重文件和 guandanai 发布的完全相同（SHA-256 记录在 `bot/models.json`，构建时核对）；代码移植自 guandanai `main`
（提交 `fe066bc`，2026-11-07），只改成本项目单文件页面的写法，输入编码与候选出牌经逐局比对与原代码一致。
模型的训练、评测和冠军选择都在 guandanai 完成，详见其 [模型研究报告](https://github.com/stevensun1005/guandanai/blob/main/ai/research/MODEL_STUDY.md)
和 [网页模型说明](https://github.com/stevensun1005/guandanai/blob/main/web/docs/WEB_MODELS.md)。更新模型请从 guandanai 的新发布取，不要在这里改权重。

## 目录

```text
index.html          网站页面（由 web/build.py 生成，GitHub Pages 直接发布）
web/                网页端（每个功能一个文件，见 web/README.md）
  src/index.html    主页面：页面结构 + 按顺序引入各功能文件
  src/core/ game/ ui/ hand/ input/ lobby/ training/ network/ ...
  build.py          把 web/src 和 bot/ 合成根目录的 index.html
bot/                电脑玩家
  models.json       大厅里可选的电脑：名称、文件、SHA-256、来源
  clint/            Clint 规则机器人与残局大脑（精确求解器）
  neural/           神经网络电脑：特征编码、候选出牌、残局求解、ONNX 推理（移植自 guandanai）
  danmcai/          danMCai 权重（引用自 guandanai）
  reason/           danMCai 的搜索：guandanai 打包的 Worker、客户端、onnxruntime-web 和两个网络（原样引用）
  guanzero/         GuanZero 权重（引用自 guandanai）
```

修改 `web/` 或 `bot/` 后运行：

```bash
python web/build.py
```

本地试玩（模型需要通过 http 加载）：在仓库根目录运行 `python -m http.server 8000`，打开 http://localhost:8000/ 。
