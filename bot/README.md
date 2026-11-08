# bot：电脑玩家

大厅「电脑」的三个选项都在这里，清单见 [models.json](models.json)。

| 目录 | 内容 |
| --- | --- |
| [clint/](clint) | Clint 规则机器人（`clint-bot.js`），构建时原样放回页面 |
| [neural/](neural) | 神经网络电脑的浏览器代码：特征编码、候选出牌、两人残局求解、onnxruntime-web 推理 |
| [danmcai/](danmcai) | `danmcai-v000855042.onnx`：guandanai 发布编号 017，danMCai 现任门控冠军（大厅里选“danMCai”） |
| [guanzero/](guanzero) | `guanzero-adp-io48-303975.onnx`：guandanai 发布编号 023，最新 GuanZero（带 20 步公开出牌历史） |

## 来源：引用 guandanai

除 `clint/` 外，这里的神经网络机器人都**引用自 [stevensun1005/guandanai](https://github.com/stevensun1005/guandanai)**，不是本项目训练的：

- **danMCai**：`danmcai/danmcai-v000855042.onnx` 即 guandanai Release [`web-model-017`](https://github.com/stevensun1005/guandanai/releases/tag/web-model-017)
  的 `bot-017.onnx`（guandanai 网页默认的 danMCai 现任门控冠军），SHA-256 `462afc99…b3f7`。
- **GuanZero**：`guanzero/guanzero-adp-io48-303975.onnx` 即 guandanai Release [`web-model-023`](https://github.com/stevensun1005/guandanai/releases/tag/web-model-023)
  的 `bot-023.onnx`，SHA-256 `e02bd26f…d4b`。
- **`neural/neural-bot.js`**：移植自 guandanai `web/src/ai/`（`encoding.mjs`、`history.mjs`、`candidates.js`、`observation.js`、
  `endgame.js`、`policy-inference.mjs`、`table-policy.mjs`）和 `web/src/coach/evaluation.mjs`，基于 guandanai `main` 提交 `fe066bc`（2026-11-07）。

完整来源（训练任务、版本、步数、Release）写在 [models.json](models.json) 每个模型的 `source` 里。

## 工作方式

`neural/neural-bot.js` 的输入与训练时一致：自己的手牌、公开出牌、各家剩余张数和级数，不读其他人的手牌。网络给每个合法出牌（含"过"）打分，
取最高分；两人残局且总牌数不超过 24 张时，先尝试精确搜索必胜走法。进贡和还贡仍用 Clint 规则。

出牌评价（`web/src/coach/coach.js`）也用这里的 `NeuralBot.rate`：用 danMCai 给本人所有合法出牌打分（不加残局搜索等捷径），
`relativeRating` 换算成 0–100% 的相对分。

## 换模型

新权重请从 guandanai 的 Release 取（不在本项目训练），并在 `source` 里写清 Release 编号与训练版本。

1. 把新的 `.onnx` 放进对应目录（输入 `state [1,513]`、`actions [N,54]`，GuanZero 另有 `history [1,5,216]`，输出 `values [N,1]`）。
2. 在 `models.json` 里改 `path`、`file`、`sha256`、`bytes`、`label` 和 `source`。
3. 运行 `python web/build.py`（会核对 SHA-256），再本地试玩一局。
