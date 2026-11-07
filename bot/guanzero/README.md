# GuanZero（引用自 guandanai）

`guanzero-adp-io48-229609.onnx` 来自 [stevensun1005/guandanai](https://github.com/stevensun1005/guandanai) 的 Release [`web-model-021`](https://github.com/stevensun1005/guandanai/releases/tag/web-model-021)（原文件名 `bot-021.onnx`），
本项目没有修改或重新训练。

| 项目 | 值 |
| --- | --- |
| 训练任务 | `guanzero-adp-io48` |
| 版本 | `model-000000229609` |
| 步数 | 229609 |
| SHA-256 | `43d72b65e773fb5acb6b8f86baed16a69a1977a97fb6fddf4fe5f23ee25261bc` |
| 大小 | 6,346,014 字节 |
| 网络输入 | `state [1,513]`、`actions [N,54]`、`history [1,5,216]`，输出 `values [N,1]` |

guandanai 本机 io48 训练每 12 小时冻结、对 Clint 与 danMCai 冠军各评测 500 场后发布的最新一代。训练、评测与结论见 guandanai 的 [模型研究报告](https://github.com/stevensun1005/guandanai/blob/main/ai/research/MODEL_STUDY.md) 和
[网页模型说明](https://github.com/stevensun1005/guandanai/blob/main/web/docs/WEB_MODELS.md)。浏览器里怎么用见 [bot/README](../README.md)。
