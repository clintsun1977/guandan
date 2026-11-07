# bot：电脑玩家

大厅「电脑」的三个选项都在这里，清单见 [models.json](models.json)。

| 目录 | 内容 |
| --- | --- |
| [clint/](clint) | Clint 规则机器人（`clint-bot.js`）和残局用的蒙特卡洛搜索（`endgame-search.js`），构建时原样放回页面 |
| [neural/](neural) | 神经网络电脑的浏览器代码：特征编码、候选出牌、两人残局求解、onnxruntime-web 推理 |
| [danmcai/](danmcai) | `danmcai-v000855042.onnx`：guandanai 发布编号 017，danMCai 现任门控冠军（默认电脑） |
| [guanzero/](guanzero) | `guanzero-adp-io48-229609.onnx`：guandanai 发布编号 021，最新 GuanZero（带 20 步公开出牌历史） |

`neural/neural-bot.js` 移植自 [stevensun1005/guandanai](https://github.com/stevensun1005/guandanai) 的 `web/src/ai`，
输入与训练时一致：自己的手牌、公开出牌、各家剩余张数和级数，不读其他人的手牌。网络给每个合法出牌（含"过"）打分，
取最高分；两人残局且总牌数不超过 24 张时，先尝试精确搜索必胜走法。进贡和还贡仍用 Clint 规则。

## 换模型

1. 把新的 `.onnx` 放进对应目录（输入 `state [1,513]`、`actions [N,54]`，GuanZero 另有 `history [1,5,216]`，输出 `values [N,1]`）。
2. 在 `models.json` 里改 `path`、`file`、`sha256`、`bytes`、`label` 和 `source`。
3. 运行 `python web/build.py`（会核对 SHA-256），再本地试玩一局。
