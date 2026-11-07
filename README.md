# 掼蛋

两副牌的四人掼蛋网页游戏：进入大厅输入昵称，可以一个人和三位电脑玩家打，也可以开房间和朋友一起打。
包含洗牌切牌、进贡还贡、升级打 A、出牌计时、音效和背景音乐。

在线玩：https://clintsun1977.github.io/guandan/

## 和朋友一起打

1. 一个人在大厅点「开房间」，屏幕上会出现 4 位房间号，把它告诉朋友。
2. 朋友打开同一个网址，点「加入房间」，输入房间号，选一个空座位。
3. 大家坐好后，房主点「开始」。没人坐的座位由电脑来打。

房主的页面要一直开着，房主关掉页面，这局就结束了。朋友中途掉线，他的座位由电脑接着打。
联机是浏览器之间直接连接（PeerJS），个别网络环境可能连不上。

## 电脑

大厅「电脑」一行选择电脑怎么打，由单人玩家或房主选定，进房间的朋友只能看：

| 选项 | 说明 |
| --- | --- |
| **danMCai**（默认） | 神经网络 `danMCai-v000855042`，来自 [guandanai](https://github.com/stevensun1005/guandanai) 的 danMCai 现任冠军 |
| Clint | Clint 的规则机器人 |
| GuanZero | 神经网络 `guanzero-adp-io48-229609`，guandanai 最新发布的 GuanZero |

神经网络在房主的浏览器里运行（onnxruntime-web），只看自己的手牌和公开信息；进贡、还贡仍按 Clint 规则。
模型加载失败时，牌桌会提示一次，电脑改用 Clint 规则继续打。

## 出牌评价

大厅「出牌评价」开（默认）时，轮到你出牌，左下角会显示 danMCai 对你选的牌的**合理性**：这一手所有能出的牌（含"过"）里，
模型值最高的算 100%，最低的算 0%。出牌后保留**上一手**的评分，到这一局结束。只用你自己的手牌和公开信息；
这是相对分，不是胜率。手机上显示在顶栏右侧。点 × 本场不再显示。

## 目录

```text
index.html          网站页面（由 web/build.py 生成，GitHub Pages 直接发布）
web/                网页端（每个功能一个文件，见 web/README.md）
  src/index.html    主页面：页面结构 + 按顺序引入各功能文件
  src/core/ game/ ui/ hand/ input/ lobby/ training/ network/ ...
  build.py          把 web/src 和 bot/ 合成根目录的 index.html
bot/                电脑玩家
  models.json       大厅里可选的电脑：名称、文件、SHA-256、来源
  clint/            Clint 规则机器人与残局搜索
  neural/           神经网络电脑：特征编码、候选出牌、残局求解、ONNX 推理
  danmcai/          danMCai 权重
  guanzero/         GuanZero 权重
```

修改 `web/` 或 `bot/` 后运行：

```bash
python web/build.py
```

本地试玩（模型需要通过 http 加载）：在仓库根目录运行 `python -m http.server 8000`，打开 http://localhost:8000/ 。
