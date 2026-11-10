# web：网页端

每个功能一个文件，放在 `src/` 下；主页面 [src/index.html](src/index.html) 只有页面结构，和按顺序列出的要加载的文件：

```text
//@include web/src/core/cards.js      ← 构建时这一行换成该文件的内容
```

运行 `python web/build.py` 把它们按顺序合成仓库根目录的 `index.html`（GitHub Pages 发布的页面）。
所有文件共用同一个作用域（和原来的单文件一样），**顺序有意义**：用到的常量要排在前面，新文件按功能插到合适的位置。

| 目录 | 内容 |
| --- | --- |
| `styles/` | 样式：基础布局、顶栏、牌堆、牌桌、手牌、牌面、弹层、大厅、庆祝动画、电脑宽屏、训练版 |
| `core/` | 规则：牌与花色（`cards.js`）、牌型判断与大小（`combinations.js`）、所有出法（`moves.js`） |
| `game/` | 牌局流程：状态（`state.js`）、整场（`match.js`）、每局（`round.js`）、洗切发牌（`dealing.js`）、进还贡（`tribute.js`）、轮转（`turns.js`）、计时（`clock.js`、`ticker.js`）、电脑选择与神经网络接入（`computer-players.js`）、danMCai 的搜索接入（`reason-bot.js`）、出牌与结算（`play.js`）、事件（`events.js`）、下一局（`next-round.js`）、提示排序（`hint-order.js`） |
| `ui/` | 界面：牌面 HTML（`cards.js`）、桌面出牌区（`pile.js`）、整体刷新（`render.js`）、进贡信息、提示文字、手机布局、操作按钮位置、弹层（结算、暂停）、规则页（`rules.js`：左侧分类、顶部分页、每条规则配牌面示例）、牌背、观战、选项菜单、窗口尺寸与转屏 |
| `hand/` | 手牌：显示（`view.js`）、布局与成组区（`layout.js`）、各种排法的几何（`geometry.js`）、横式／竖式／手持（`views.js`）、同花顺（`straight-flush.js`）、提示（`hints.js`） |
| `input/` | 操作：出牌、过、提示、还贡、出牌需确认（`actions.js`）；点选、扫选、拖动、成组（`hand-input.js`） |
| `effects/`、`audio/` | 洗牌切牌和发牌动画、头游／胜负庆祝、接风；Web Audio 合成音效与音乐 |
| `lobby/` | 大厅：昵称（`lobby.js`）、规则与电脑选择、选级（`rules.js`）、单人／开房间／进房间（`modes.js`） |
| `training/` | 训练版：入口与牌桌、记牌器、出牌记录、单步与撤回、回看、文本导出导入 |
| `network/` | 联机：房间与版本（`connection.js`）、语音（`voice.js`）、房主（`host.js`）、掉线重连（`resume.js`）、加入者与观战（`guest.js`） |
| `coach/` | 出牌评价：danMCai 给你选的牌和上一手打合理性分（`coach.js`，引用 guandanai 的出牌评价，见 [bot/README](../bot/README.md#来源引用-guandanai)） |
| `collection/` | 牌谱采集：记录两名以上真人的每一局（`record.js`），上传到 guandanai 的云端并在失败时重试（`upload.js`），中途关掉后在选级里点「继续上一把」接上同一把的编号（`match-link.js`） |
| `social/` | 表情：送礼物、表情、快捷语，联机经房主转发，电脑回礼（`emotes.js`，引用 guandanai） |
| `app/` | 启动：恢复热更新状态（`boot.js`）、主入口（`main.js`） |

电脑玩家（Clint 规则；以及引用自 [guandanai](https://github.com/stevensun1005/guandanai) 的 danMCai、GuanZero）在仓库的 [bot/](../bot/README.md) 目录，同样由 `index.html` 按顺序引入。
