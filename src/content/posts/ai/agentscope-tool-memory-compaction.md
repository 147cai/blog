---
title: "AgentScope 上手第二天：工具调用、记忆和压缩，我把源码翻了一遍"
published: 2026-07-01
description: "跟着示例读 AgentScope-Java 的源码，搞清楚三件事：工具调用的 ReAct 循环到底在转什么、对话记忆怎么存、以及我一度理解错的地方——它到底是死板的全量重发，还是也有 GAM 那种带索引的按需检索。"
tags: ["AgentScope", "Agent", "Java", "记忆系统", "AI 辅助"]
category: "笔记"
draft: true
---

上手第二天。还是那套学法：边跑示例边读源码，文档当字典查。

今天啃了三块：工具调用、对话记忆、记忆压缩。

---

## 工具调用：给 Agent 装一双手

第一天那个 Agent 只会聊天。你问它现在东京几点，它会瞎编——因为它没法真的去查系统时间，只能凭训练数据猜。

工具调用就是给它装一双手。你把一个普通的 Java 方法，方法上加个注解，它就变成 Agent 能调用的"工具"：

```java
@Tool(name = "get_current_time", description = "Get the current time in a specific timezone")
public String getCurrentTime(
        @ToolParam(name = "timezone", description = "Timezone name, e.g. 'Asia/Tokyo'")
        String timezone) {
    // ...真的去查这个时区的时间，返回字符串
}
```

这里最关键的字段是 `description`。它会**原封不动发给模型**。模型读了这段描述，才知道"这个工具能干什么、什么时候该用它"。描述写得越清楚，模型调用得越准。参数上的 `@ToolParam` 同理，是告诉模型"这个位置该填什么"。

然后把带工具的类塞进工具箱，工具箱再交给 Agent：

```java
Toolkit toolkit = new Toolkit();
toolkit.registerTool(new SimpleTools());   // 扫描这个类里所有 @Tool 方法，全注册进来
```

到这，Agent 就从"只会说话"变成"能做事"了。

---

## ReAct 循环：看清楚它脑子里在转什么

光会调工具还不够，我想看清楚它内部到底怎么决策的。示例里挂了一个中间件 `AgentTraceMiddleware`，它会把每一步都打到控制台。我问了句"查询新加坡的当前时间"，日志长这样（我把它翻成人话）：

```
PRE_CALL        → 你的话进来了
PRE_REASONING   → 第 1 次思考，把消息交给模型（messages=2：系统提示 + 你的问题）
POST_REASONING  → 模型说"我不知道几点，我要调 get_current_time 这个工具"
PRE_ACTING      → 准备真的去执行这个工具
POST_ACTING     → 工具跑完，拿到结果（result_len=53, SUCCESS）
PRE_REASONING   → 第 2 次思考（messages=4！多出来的两条是"我要调工具"的记录 + 工具返回的结果）
POST_REASONING  → 这次模型有答案了，直接给文本："新加坡当前时间是..."
POST_CALL       → 最终答案返回给你
```

规律很清晰：**`REASONING`（想）→ 如果想的结果是"调工具"就走 `ACTING`（做）→ 然后回到 `REASONING` 再想一轮**（因为多了工具结果这条新信息）→ 直到某次模型不再调工具、直接给文本，循环结束。

这个"想→做→再想→…→回答"的往复，就是 ReAct（Reasoning + Acting）名字的由来。如果一个问题要连调两个工具，你会看到这组 `REASONING → ACTING` 重复两轮。

注意那个从 `messages=2` 到 `messages=4` 的变化。工具结果不是凭空消失的，它被 append 进了对话历史，下一轮连同历史一起重新发给模型。这个细节，是理解后面记忆机制的钥匙。

---

## 记忆怎么存：换个 sessionId 就是失忆

单次运行里，Agent 内部有个 list 一直在攒消息，所以多轮对话它记得。但程序一重启，这份记忆就没了。

要让它"重启还能接着聊"，加两样东西：一个 `stateStore`（存记忆的仓库），一个 `sessionId`（这份记忆的档案名）。

```java
AgentStateStore stateStore = new JsonFileAgentStateStore(sessionPath);
ReActAgent agent = ReActAgent.builder()
        .stateStore(stateStore)          // 记忆存到哪
        .defaultSessionId(sessionId)     // 用哪个档案名
        // ...
        .build();
```

配好之后，框架自动干两件事：**构建 Agent 时按 sessionId 去仓库里找有没有存过，有就加载；每次 `call()` 结束，自动把最新历史存回去。** 你一行"保存/加载"的代码都不用写。

`JsonFileAgentStateStore` 就是把对话状态序列化成 JSON 存到磁盘，每个 sessionId 一个独立文件。我实测：第一次跟它说"我叫小明"，退出，用同一个 sessionId 再进去问"我叫什么"，它答得出来；换个 sessionId，它就失忆了。

到这为止都好理解。真正让我卡住的是下一个问题。

---

## 卡住我的问题：新对话怎么找到旧消息？

我盯着这个存储看了半天，冒出一个疑问：

> 我只看到"对话消息被存起来"，以及"下次把旧消息列表展示出来"。但新的一轮对话，到底是**怎么找到**之前那些旧消息的？是全部都读回来，还是像 skill 那样——存的时候带一段描述，让大模型自己判断该不该调用某段旧记忆？

我当时是真觉得后者更"高级"、更像那么回事。毕竟 skill 就是"一堆带描述的能力，模型自己挑要不要用"。记忆按理也可以这么搞：给每段旧对话打个摘要标签，模型觉得相关才捞回来。

带着这个猜想去翻源码，结果被打脸了。答案是：**没有那回事。这一层就是"全部读、全部塞回去"。**

分两块看。

**加载阶段——纯 key-value 查找，跟大模型半点关系没有。**

`JsonFileAgentStateStore.get(userId, sessionId, "agent_state", ...)` 干的事就是：按 `(userId, sessionId)` 拼出一个文件路径，文件在就把整个 JSON 反序列化成 `AgentState` 对象，不在就返回空。纯 I/O。没有任何"判断哪部分该加载"的逻辑——**要么整份加载，要么啥都没有。**

**使用阶段——每次请求把整个历史列表原样塞给模型。**

关键在 `ReActAgent` 的 `reasoning()` 方法里，每一轮思考都是这么起手的：

```java
hookDispatcher.firePreReasoning(state.contextMutable(), systemMsg, model.getModelName());
//                              ^^^^^^^^^^^^^^^^^^^^^^^ 这就是那份完整的历史消息 List<Msg>
```

`state.contextMutable()` 就是完整的历史。每一轮 `PRE_REASONING`，框架都把这**整个列表原封不动**当对话历史发出去。这也解释了前面那个 `messages=2 → 4`：工具调完，新消息 append 进这个 list，下一轮连着一起再发一遍。

跟 skill 完全是两回事。skill 是"把一堆描述给模型，模型自己选要不要调";这里是**没得选**，历史消息无脑全量重发。

---

## 全量重发的代价，逼出了压缩

全量重发有个显而易见的问题：**聊得越久，列表越长，每次请求发的 token 越多，迟早撑爆模型的上下文窗口。**

这就是"记忆压缩"（Compaction）存在的理由。我一开始以为压缩会是那种聪明的"选择性检索"，翻完源码发现——它不是。它的思路朴素得多：**列表长到一定程度，就把旧的那截摘要压掉，只留最近几条 + 一段摘要文本。** 本质还是全量发送，只是发之前先"瘦身"过。

`CompactionMiddleware` 挂在每次思考之前，够长了就触发。触发之后 `ConversationCompactor` 干这么几件事：

1. **找安全切分点**——粗略按"保留最近 N 条"算个切点，但绝不能把"模型发起的工具调用"和"对应的工具结果"从中间切开，否则模型会看到一个调了工具却没结果的诡异历史。
2. **抽长期记忆**（可选，默认开）——真丢弃旧消息前，先把里面的关键事实抽出来，写进 `memory/2026-07-01.md` 这种按日期命名的文件兜底。
3. **原始消息离线存档**（可选，默认开）——把旧消息一字不改写进一个 JSONL 文件，路径记进摘要里。**原始记录没消失，只是不再每次都发给模型了。**
4. **一次 LLM 摘要**——把旧消息塞进一个结构化 prompt，让模型输出四段式摘要（这次会话想干嘛 / 关键上下文 / 涉及的文件 / 还没做完的事）。

最后 `[一大堆旧消息]` 变成 `[一条摘要] + [最近几条]`，列表瞬间变短，但语义上"没丢东西"——细节在磁盘文件里，事实在 memory 日志里，脉络在摘要里。

写到这我以为记忆这块讲完了。结果第二天回头一想，觉得不对劲，又把自己绕回去了。

---

## 我把结论说早了：其实是两层记忆，不是一层

我当时是这么想的：既然全量重发是"活跃对话"里的机制，那压缩掉的旧消息虽然写进了 `memory/*.md` 和离线归档，但**这些文件写进去之后就没人管了吧？** 顶多算个人工翻查用的日志。

我把这个疑问原样抛出去：AgentScope 的记忆存储，真的完全就是全量加载吗？我新开一个对话，会自己跑去读之前的历史对话吗？我总觉得不太合理——我了解的 GAM 论文，是那种"带目录的书"，先查小索引定位，再去捞具体内容的全部关键内容。是不是我把概念记混了？

结果一查源码，发现是我自己把话说得太满了。`agentscope-harness` 模块里，明晃晃地放着这几个工具类：`MemorySearchTool`、`SessionSearchTool`、`MemoryGetTool`、`MemorySaveTool`。`MemorySearchTool` 上的工具描述写得很直白：

```java
@Tool(
        name = "memory_search",
        readOnly = true,
        description =
                "Search through long-term memory files (MEMORY.md and memory/*.md) for"
                        + " relevant information. Use before answering questions about prior"
                        + " work, decisions, dates, people, preferences, or todos.")
```

翻译一下：**"回答关于过往工作/决定/日期/人物/偏好的问题之前，先搜一下。"** 这就是我一开始设想的"skill 那种描述，模型自己判断该不该调用"——只不过它不作用在"活跃对话"这一层，而是**专门服务于长期记忆这一层**。回头再看那次工具调用的 trace 日志，里面有一条 `tool_call: name=memory_save`——原来那时候它已经在往这一层写东西了，只是我当时没往这上面想。

所以准确的说法应该拆成两层：

**第一层：活跃对话的工作上下文（我之前讲的那套）**

- 靠 `sessionId` 当钥匙精确开一个抽屉，**不会主动跨会话乱翻**——换个 sessionId 就是干净的新对话，这点我之前讲得没错。
- 同一个 sessionId 内，全量加载、全量重发、超长就压缩摘要——这套也没讲错。

**第二层：长期记忆（我漏掉的部分）**

- `MEMORY.md`：策展过的精炼事实，**每次都常驻注入**，跟 Claude Code 的 `CLAUDE.md`是一个思路。
- `memory/*.md` 日志 + 会话归档：海量原始细节，**平时不进上下文**，靠模型自己调 `memory_search` / `session_search` **按需**捞回来。

两层是接起来的：压缩发生时，"抽长期记忆"那一步会把关键事实写进第二层的 `memory/*.md`，"离线存档"把原始对话整段写进归档。**旧对话从第一层的工作上下文里被压缩掉，细节没有真的丢，是沉到了第二层，需要的时候能靠搜索捞回来。**

对照一下会更清楚：

| 维度 | AgentScope（HarnessAgent） | Claude Code | GAM（我另一个项目参考的论文） |
|---|---|---|---|
| 活跃会话 | 工作上下文全量重发，超长压缩摘要 | 当前窗口 + `/compact` 压缩 | Working Memory |
| 常驻长期记忆 | `MEMORY.md` 每次注入 | `CLAUDE.md` 每次注入 | —— |
| 按需检索 | `memory_search` 关键词搜 | Read/Grep 按需读文件 | 向量 + BM25 混合检索，还带反思迭代 |
| 检索精细度 | 低，纯关键词匹配 | 中，agentic 读文件 | 高，先查索引定位再捞原文，不够就换角度再查（最多几轮） |

原来这三个东西是**同一个骨架的三种精细度**，不是三套互不相干的设计。AgentScope 的 `memory_search` 相当于 GAM 的简配版——都是"先有个轻量的东西能定位，再去捞完整内容"，只是 AgentScope 目前只做到关键词匹配，没有向量、没有反思循环。GAM 那套"书+目录"的直觉我并没有记混，只是我一开始只看到了 AgentScope 的第一层，就急着下结论说"这里没有这套东西"。

---

所以这次学习最后的结论要改一版：AgentScope 的对话记忆不是单一的"全量加载 + 全量重发"，而是**活跃对话全量重发（用压缩控制长度）+ 长期记忆按需检索（用关键词工具捞取）**，两层各司其职。全量重发那层负责"当前在聊的这件事"，按需检索那层才负责"很久以前聊过的事"。

我原来的猜测方向是对的，只是问错了层——不是"活跃对话该不该按需检索"，而是"框架有没有另开一层来做按需检索"。答案是有。这算是我这两天学习里，最值得记一笔的一次纠偏。
