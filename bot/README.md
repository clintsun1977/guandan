# bot：电脑玩家

大厅「电脑」的三个选项都在这里，清单见 [models.json](models.json)。

| 目录 | 内容 |
| --- | --- |
| [clint/](clint) | Clint 规则机器人（`clint-bot.js`）和它的残局大脑（`endgame-brain.js`），构建时原样放回页面 |
| [neural/](neural) | 神经网络电脑的浏览器代码：特征编码、候选出牌、两人残局求解、onnxruntime-web 推理 |
| [danmcai/](danmcai) | `danmcai-v000855042.onnx`：guandanai 发布编号 017，danMCai 现任门控冠军。搜索没算完时按它出牌，出牌评价先用它打分 |
| [reason/](reason) | danMCai 的搜索（guandanai 搜索机器人 `9001`）：guandanai 打包的 Worker 和客户端、onnxruntime-web、017 与推断网络，原样引用。大厅里选“danMCai”用的就是它 |
| [guanzero/](guanzero) | `guanzero-adp-io48-303975.onnx`：guandanai 发布编号 023，最新 GuanZero（带 20 步公开出牌历史） |

## 来源：引用 guandanai

除 `clint/` 外，这里的神经网络机器人都**引用自 [stevensun1005/guandanai](https://github.com/stevensun1005/guandanai)**，不是本项目训练的：

- **danMCai**：`danmcai/danmcai-v000855042.onnx` 即 guandanai Release [`web-model-017`](https://github.com/stevensun1005/guandanai/releases/tag/web-model-017)
  的 `bot-017.onnx`（guandanai 网页默认的 danMCai 现任门控冠军），SHA-256 `462afc99…b3f7`。
- **danMCai 的搜索**：`reason/` 按 guandanai 的 [接入指南](https://github.com/stevensun1005/guandanai/blob/main/web/docs/REASON_BOT_INTEGRATION.md)
  打包，未作任何修改，详见 [reason/README](reason/README.md)。
- **GuanZero**：`guanzero/guanzero-adp-io48-303975.onnx` 即 guandanai Release [`web-model-023`](https://github.com/stevensun1005/guandanai/releases/tag/web-model-023)
  的 `bot-023.onnx`，SHA-256 `e02bd26f…d4b`。
- **`neural/neural-bot.js`**：移植自 guandanai `web/src/ai/`（`encoding.mjs`、`history.mjs`、`candidates.js`、`observation.js`、
  `endgame.js`、`policy-inference.mjs`、`table-policy.mjs`）和 `web/src/coach/evaluation.mjs`，基于 guandanai `main` 提交 `fe066bc`（2026-11-07）。

完整来源（训练任务、版本、步数、Release）写在 [models.json](models.json) 每个模型的 `source` 里。

## 工作方式

`neural/neural-bot.js` 的输入与训练时一致：自己的手牌、公开出牌、各家剩余张数和级数，不读其他人的手牌。网络给每个合法出牌（含"过"）打分，
取最高分；两人残局且总牌数不超过 24 张时，先尝试精确搜索必胜走法。进贡和还贡仍用 Clint 规则。

选 danMCai 时，`web/src/game/reason-bot.js` 先把这一手交给 `reason/` 的搜索（只发自己的手牌和公开信息），
搜索没结果就用这里的 017 出牌，017 也出错才改用 Clint 规则。

出牌评价（`web/src/coach/coach.js`）先用这里的 `NeuralBot.rate`：用 danMCai 给本人所有合法出牌打分（不加残局搜索等捷径），
`relativeRating` 换算成 0–100% 的相对分。

## 换模型

新权重请从 guandanai 的 Release 取（不在本项目训练），并在 `source` 里写清 Release 编号与训练版本。

1. 把新的 `.onnx` 放进对应目录（输入 `state [1,513]`、`actions [N,54]`，GuanZero 另有 `history [1,5,216]`，输出 `values [N,1]`）。
2. 在 `models.json` 里改 `path`、`file`、`sha256`、`bytes`、`label` 和 `source`。
3. 运行 `python web/build.py`（会核对 SHA-256），再本地试玩一局。
