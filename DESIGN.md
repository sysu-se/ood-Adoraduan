# oo数独作业设计文档

## 1. Sudoku 和 Game 的职责边界是什么？

Sudoku主要用于执行某一步具体的操作，而Game负责记录每一把的history，future序列和当前的Sudoku的状态。

## 2. Move 是值对象还是实体对象？为什么？

Move是值对象，因为Move仅仅是为了记录一次操作所需三个参数而产生的三元组，不需要对其有修改操作

## 3. history 中存储的是什么？为什么？

存储的是历史move三元数组，特别要注意的是其中的value存的是修改棋盘前的数字。理由：相对于存Grid的深拷贝序列，存储三元组能节省大量内存。

## 4. 你的复制策略是什么？哪些地方需要深拷贝？

由于采用move作为序列存储单位，故对棋盘极少进行深拷贝操作，仅在一开始构造Sudoku时为保险不破坏外来grid参数而采用深拷贝构造Grid

## 5. 你的序列化/反序列化设计是什么？

序列化：Sudoku 类提供 toJSON() 方法，返回 { grid: this.getGrid() }，其中 getGrid() 返回棋盘数据的深拷贝。Game 类的 toJSON() 返回 { sudoku: this.current.toJSON() }。这样调用 JSON.stringify() 时会自动调用这些方法，得到可序列化的普通对象。
反序列化：createSudokuFromJSON(json) 接收 { grid: [...] } 结构，用 json.grid 创建新的 Sudoku 实例。createGameFromJSON(json) 先调用 createSudokuFromJSON(json.sudoku) 重建 Sudoku，再创建 Game 实例。

## 6. 你的外表化接口是什么？为什么这样设计？

外表化接口：Sudoku 类提供 toString() 方法，返回用空格分隔数字、用换行分隔行的字符串格式。
理由：使得输出结果一目了然，可直接用于调试打印