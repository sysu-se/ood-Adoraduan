Q1:如何实现提示功能？
A1:执行提示功能时，对当前棋盘调用 Game 类的 computeHints 辅助实现，先排查掉违反规避规则的格子并显示为红色，后对可修改格求候选数数量并分为 single（唯一候选，绿色）、few（2-3个候选，浅蓝）、many（4+个候选）、empty（无候选）四类，并在UI层面用不同颜色和显示文本表示不同类型的格子候选数集合。需要结束提示界面时仅需通过点击任意可编辑格即可。

Q2:提示功能更属于 Game 还是 Sudoku ?
A2:提示功能更属于 Game ，理由是 Sudoku 只负责掌控棋盘本身并对 redo 、undo、guess 起相应，而该提示功能的实现是需要知道当前棋盘数据即可。

Q3:如何实现探索功能？
A3:探索功能的开发通过在 Game 类里新增独立的 history 来实现，探索主要具有以下功能：
1. __进入探索__：`enterExploreMode()` 保存当前棋盘快照，清空探索历史
2. __探索中操作__：`guess()` 检测到 `this.exploring` 为 true 时，操作记录到 `exploreHistory`/`exploreFuture`，不影响主 history
3. __撤销探索__：`undoExplore()` 用快照恢复棋盘，丢弃所有探索历史
4. __应用探索__：`applyExplore()` 将 `exploreHistory` 中的 move 逐个追加到主 `history` 中
5. __失败检测__：`checkExploreFailed()` 全盘扫描空格，检查是否有格子无候选数
__增加独立的 exploreHistory 和 exploreFuture 的原因？
..通过独立的 exploreHistory 和 exploreFuture 存储探索模式下的 move 操作，可以分隔原模式和探索模式下 redo、undo 操作的关系，避免产生在探索模式下对原有history和future产生不恰当的逻辑影响。
__回溯通过快照而不是记录步骤的原因？
..使用快照将在撤销探索时快速应用原先状态，而探索模式下的 exploreHistory 和 exploreFuture 仅需要简单清空即可。
__探索模式下对UI层面优化：
.增加进入探索模式下的探索按钮。打开探索按钮时无法直接通过再次点击关闭，并出现应用探索与撤销探索按钮，在应用探索或撤销探索后返回原模式，探索模式按钮变回 OFF 状态。
.探索模式下的修改数字均用蓝色文本显示，与原模式填入文本区分
.在探索失败时弹窗并提示撤销探索或者撤回此步操作

Q4:主局面与探索局面的关系是什么？
A4:主局面与探索局面共用同一个 Sudoku 棋盘，各占有不同的 history 和 future 动作存储栈。在撤销探索时放出探索模式启用前的棋盘状态快照，在应用探索时将探索模式下的 history 和 future 压入原 history 和 future 中。

Q5:你的 history 结构在本次作业中是否发生了变化？
A5:未发生变化，但为了增设探索功能增加了探索模式下独立于原 history 结构，属于探索模式的 history 结构。

Q6:Homework 1 中的哪些设计，在 Homework 2 中暴露出了局限？
A6:未发现

Q7:如果重做一次 Homework 1，你会如何修改原设计？
A7:可能会在 Game 类里内置可用于探索模式和提示模式的辅助获取候选数的方法，但似乎无关紧要

Q8:本次作业的 AI agent 使用情况？
A8:本次作业必须承认的是几乎代码全由AI实现，我仅提供了实现提示探索模式功能的逻辑要求，以及由我对UI层面的直观感觉和应有功能的推测对AI agent提出实现功能的建议

Q9:本次作业的UI层面优化？
A9:除了探索模式和提示功能中增设的相关UI，对Homework 1中棋盘将初始固定格变灰，使其符合认知逻辑。