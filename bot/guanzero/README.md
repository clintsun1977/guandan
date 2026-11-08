# GuanZero（引用自 guandanai）

`guanzero-adp-io48-303975.onnx` 来自 [stevensun1005/guandanai](https://github.com/stevensun1005/guandanai) 的 Release [`web-model-023`](https://github.com/stevensun1005/guandanai/releases/tag/web-model-023)（原文件名 `bot-023.onnx`），
本项目没有修改或重新训练。

| 项目 | 值 |
| --- | --- |
| 训练任务 | `guanzero-adp-io48` |
| 版本 | `model-000000303975` |
| 步数 | 303975 |
| SHA-256 | `e02bd26f3d90cb9ef90f7075ad1acd845c709bebac734611c44eb66d48fdbd4b` |
| 大小 | 6,346,014 字节 |
| 网络输入 | `state [1,513]`、`actions [N,54]`、`history [1,5,216]`，输出 `values [N,1]` |

guandanai 本机 io48 训练每 12 小时冻结、对 Clint 与 danMCai 冠军各评测 500 场后发布的最新一代。训练、评测与结论见 guandanai 的 [模型研究报告](https://github.com/stevensun1005/guandanai/blob/main/ai/research/MODEL_STUDY.md) 和
[网页模型说明](https://github.com/stevensun1005/guandanai/blob/main/web/docs/WEB_MODELS.md)。浏览器里怎么用见 [bot/README](../README.md)。
