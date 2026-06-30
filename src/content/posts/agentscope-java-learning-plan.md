---
title: "给自己排一份 AgentScope-Java 通关计划"
published: 2026-06-30
description: "Java 只懂简单语法，Java的agentscope框架比较陌生，因为公司需要用 AgentScope-Java 搭一个知识库。这是我给自己排的分阶段学习计划，每一步都锚定仓库里的真实源码、真实示例和官方文档。"
image: ""
tags: ["AgentScope", "Agent", "Java", "RAG", "AI 辅助"]
category: "笔记"
draft: false
---

因为这边业务的问题，需要从Python转成Java（难绷），框架也是，因此我得学习大概的实现，虽然代码实现是靠AI，但是至少得知道整体框架，把握方向。

目标这么明确，学法就不能是从头啃文档。官方文档我翻了，看不下去——它是参考手册的写法，默认你已经懂整个框架的心智模型，在那讲一个个 API 的细节。对我这种人来说，等于拿字典学英语。

所以我换了个思路：**边跑代码边学，文档当字典查，源码当教材读**。这篇就是我给自己排的作战地图。它有两条死规矩：

- 每个阶段都锚定仓库里**真实存在的示例文件和源码包**，不空谈概念
- 每个阶段结束有一个**动手自测题**，做不出来就别往下走

终点只有一个：先简单搭出一个能跑的 RAG 知识库。中间短期用不到的高级特性（多 Agent 辩论、上生产那套），先跳过。

后面学习完了再去实践，搭建企业级的知识库。

> 说明一下版本。我拉的是最新代码，示例在 `agentscope-examples/documentation` 模块里，包名是 `documentation2`，对应的是**官方 v2 文档**。网上能搜到的一些教程是 v1 结构（带狼人杀、MsgHub 那套），别拿来对着这套代码看，会对不上。下面所有文档链接我都给的 v2 中文版。

---

## 阶段 0 · 环境与第一个 Agent

这步我已经走完了，但还是写下来，因为踩的坑值得记。

**装什么**：JDK 17、Maven、配阿里云 Maven 镜像（不配的话下依赖能慢到 18 kB/s，配完几十倍速）、申请 DashScope 的 API Key。

**跑通的第一个示例**：

```
agentscope-examples/documentation/src/main/java/io/agentscope/examples/documentation2/quickstart/BasicChatExample.java
```

构建和运行命令：

```powershell
# 只编译这个示例 + 它依赖的上游模块，不编整个项目
mvn install -pl agentscope-examples/documentation -am "-DskipTests"

# 运行（-D 参数在 PowerShell 里必须加引号，否则会被拆错）
mvn exec:java -pl agentscope-examples/documentation "-Dexec.mainClass=io.agentscope.examples.documentation2.quickstart.BasicChatExample"
```

**那个最大的坑**：在 Windows 上改完用户环境变量（JAVA_HOME、API Key 这些），所有**已经开着的**程序——IDEA、终端——都读不到新值。必须把那个程序**整个关掉重开**，它才会重新读环境变量。我在 IDEA 里折腾了半天 `mvn` 找不到，最后就是重启 IDEA 解决的。

> 记死这条：以后遇到"我明明配了为什么找不到"，第一反应就是重启对应的程序。操作系统级的变量只有新启动的进程才继承。

**对应文档**：

- [快速上手](https://java.agentscope.io/v2/zh/docs/quickstart.html)
- [什么是 AgentScope 2.0](https://java.agentscope.io/v2/zh/docs/index.html)

**自测**：把 `BasicChatExample` 里的 `sysPrompt` 改成"你是一个只会用文言文回答的助手"，重新跑，看它说话变没变。改完能跑通，说明环境和"改代码→重新运行"的循环你通了。

预计 2 小时（大头在装环境和申请 Key）。

---

## 阶段 1 · 核心三件套：消息、Agent、模型

这是整个框架的地基。一个 Agent 说白了就是**大模型 + 三个挂件**：人设（sysPrompt）、工具箱（toolkit）、记忆（memory）。先把"消息怎么进、Agent 怎么转、模型怎么接"这条主干吃透。

**三个要搞清的东西**：

| 概念 | 是什么 | 锚定源码包 |
|---|---|---|
| Message | Agent 收发的消息，分 User / Assistant / System 三种角色，和大模型 API 的 role 一一对应 | `agentscope-core/src/main/java/io/agentscope/core/message` |
| Agent | `ReActAgent`，那个会"想—调工具—回答"的本体，ReAct = Reasoning + Acting | `agentscope-core/.../core/agent` |
| Model | 大模型的接入层，`"dashscope:qwen-plus"` 这种字符串会被自动解析成对应厂商的实现 | `agentscope-core/.../core/model` |

**重点读的示例**：

```
quickstart/BasicChatExample.java          # 最小对话，streamEvents 流式输出
model/ModelRegistryExample.java           # 模型字符串是怎么被解析的
streaming/StreamingConsoleExample.java    # 流式输出的几种姿势
streaming/AgentEventStreamExample.java    # 事件流里到底有哪些类型的事件
```

这里有个一开始会绕的点——**流式（streamEvents）和非流式（call）的区别**：

```java
// 流式：模型每生成一小段就发一个事件，一个字一个字蹦出来，适合给人看
agent.streamEvents(userMsg)
     .doOnNext(event -> {
         if (event instanceof TextBlockDeltaEvent e) { // delta = 新增的那一小段
             System.out.print(e.getDelta());
         }
     })
     .blockLast();   // 阻塞等整条流结束

// 非流式：等模型全部生成完，一次性返回，适合程序内部拿完整结果再处理
agent.call(userMsg).block();
```

**对应文档**：

- [智能体 Agent](https://java.agentscope.io/v2/zh/docs/building-blocks/agent.html)
- [消息与事件](https://java.agentscope.io/v2/zh/docs/building-blocks/message-and-event.html)
- [模型 Model](https://java.agentscope.io/v2/zh/docs/building-blocks/model.html)

**自测**：把 `BasicChatExample` 里的模型从 `qwen-plus` 换成 `qwen-max`，再把 `streamEvents` 那段改成 `agent.call(userMsg).block()`，对比两种输出在体感上的差别。能讲清楚"为什么聊天界面要用流式"，这阶段就过了。

预计 3~4 小时。

---

## 阶段 2 · 工具系统：让 Agent 会"动手"

到这一步 Agent 还只会聊天，因为工具箱是空的（`new Toolkit()`）。工具系统是它从"只会说"变成"会做事"的关键，也是通往知识库的必经之路——知识库的本质，就是给 Agent 装一个"查资料"的工具。

**ReAct 循环讲清楚**：你问"现在东京几点"，模型本身不知道实时时间，但它能决定**调用一个工具**去查。流程是——模型说"我要调 get_current_time，参数 Asia/Tokyo" → 框架真正执行那个 Java 方法 → 把结果喂回模型 → 模型组织成人话回答你。

**关键：模型不执行代码，它只是"说出"要调哪个工具、传什么参数。真正干活的是框架。**

工具的定义优雅到离谱，普通 Java 方法加两个注解就行：

```java
@Tool(name = "get_current_time",
      description = "Get the current time in a specific timezone") // 这段描述会原样发给模型，它靠这个判断何时该用
public String getCurrentTime(
    @ToolParam(name = "timezone",
               description = "Timezone name, e.g., 'Asia/Tokyo'")  // 参数描述也发给模型
    String timezone) {
    // 正常写 Java 就行
}
```

`@Tool` 和 `@ToolParam` 里的 `description` 就是工具的说明书。**写得越清楚，模型调得越准。** 这是后面调 RAG 检索效果的一个隐形开关。

**重点读的示例**：

```
tool/ToolBaseExample.java        # 工具的最小形态
tool/ToolCallingExample.java     # 三个工具（时间/计算/搜索）的完整例子，注意那个 search 是"假"搜索
tool/ToolGroupExample.java       # 工具多了之后怎么分组管理
```

`ToolCallingExample` 里那个 `search` 工具返回的是写死的假数据。**记住这个位置——你的 RAG 知识库，本质就是把这个 `search` 换成"去向量库里查真资料"。** 终点和起点，在这里第一次照面。

**对应源码包**：`agentscope-core/.../core/tool`（注意里面还有 `builtin`、`mcp` 等子包，是框架自带的工具和扩展机制）

**对应文档**：[工具 Tool](https://java.agentscope.io/v2/zh/docs/building-blocks/tool.html)

**自测**：照着 `ToolCallingExample` 里 `SimpleTools` 的样子，自己写一个新工具——比如 `get_weather(city)`，先返回写死的假天气。注册进 toolkit，跑起来问 Agent"北京天气怎么样"，看它会不会自动调你这个工具。**能独立写出一个工具并被正确调用，这是整个学习里最有成就感的一关。**

预计 4~5 小时。

---

## 阶段 3 · 记忆、状态、会话：多轮和持久化

前面的 Agent 是"金鱼记忆"——每次对话都是全新的，记不住上一句。这阶段解决两件事：**多轮对话里怎么记住上下文**，以及**怎么把对话存下来下次接着聊**。

| 概念 | 解决什么 | 锚定源码 |
|---|---|---|
| Memory | 一轮对话内的上下文记忆 | `core/memory` |
| State / Context | Agent 的运行时状态、上下文 | `core/state`、`core/agent/config` |
| Session | 把会话持久化（存盘 / 存数据库），下次恢复 | `core/state`，集成在 extensions |
| Compaction | 上下文太长了自动压缩，省 token | `harness` 的 compaction |

**重点读的示例**：

```
quickstart/UserIsolatedMultiTurnsExample.java   # 多用户隔离的多轮对话
state/StateExample.java                         # 状态的存与取
state/StateAutoSaveExample.java                 # 自动存档
harness/memory/MemoryCompactionExample.java     # 上下文压缩
```

这块对知识库的意义：一个能用的知识库助手，得记得住你**这轮**问过什么（"接着上一个问题"才有意义），重启后最好还能恢复。Memory 和 Session 就是干这个的。

**对应文档**：

- [上下文与 AgentState](https://java.agentscope.io/v2/zh/docs/building-blocks/context.html)
- [Harness · 记忆](https://java.agentscope.io/v2/zh/docs/harness/memory.html)
- [集成 · Agent 状态存储](https://java.agentscope.io/v2/zh/integration/session/overview.html)

**自测**：跑 `UserIsolatedMultiTurnsExample`，先告诉 Agent"我叫张三"，下一句问"我叫什么"，看它记不记得。再故意用两个不同用户 ID 问同样的问题，验证记忆是隔离的。

预计 3~4 小时。

---

## 阶段 4 · MCP 与中间件：给 Agent 接外部世界

这阶段是"扩展能力"的总集，对知识库不是全都必需，但 MCP 那块值得懂，因为它是接外部数据/工具的标准方式。

**四个东西，按重要性排**：

- **MCP（Model Context Protocol）**：一套标准协议，让 Agent 能接入外部的工具服务器。比如别人写好的一个"查数据库"MCP 服务，你不用动代码就能挂上。示例在 `mcp/McpStdioExample.java`、`mcp/McpSseExample.java`、`mcp/McpStreamableHttpExample.java`（三种连接方式）。
- **Middleware（中间件）**：像插件一样挂在 Agent 执行流程的前后，能改输入、改输出、打日志。`middleware/SystemPromptMiddlewareExample.java`、`ModelCallMiddlewareExample.java`。学习阶段强推 `AgentTraceMiddleware`，它把 Agent 每一步（思考、调工具、结果）都打印出来，ReAct 循环肉眼可见。
- **Hook（钩子）**：在 Agent 生命周期的特定节点插回调。`hitl/HookStopAgentExample.java`。
- **HITL（Human-in-the-Loop，人工介入）**：让 Agent 在关键操作前停下来等人确认。`hitl/PermissionHITLExample.java`、`hitl/InterruptionExample.java`。

| 能力 | 一句话 | 对知识库 |
|---|---|---|
| MCP | 接标准化的外部工具服务器 | 可选，但接外部数据源时很顺手 |
| Middleware | 流程前后插逻辑 | 调试必备（看 ReAct 过程）|
| Hook | 生命周期回调 | 可选 |
| HITL | 人工确认/打断 | 可选 |

**对应文档**：

- [Middleware](https://java.agentscope.io/v2/zh/docs/building-blocks/middleware.html)
- [Harness · 架构](https://java.agentscope.io/v2/zh/docs/harness/architecture.html)
- [集成 · 智能体协议](https://java.agentscope.io/v2/zh/integration/protocol/overview.html)

**自测**：给阶段 2 的 Agent 挂上 `AgentTraceMiddleware`，再问一个需要调工具的问题，把打印出来的执行轨迹看一遍——你应该能清楚看到"模型决定调工具→工具返回→模型继续"这个 ReAct 循环。看懂这个轨迹，比看十遍文档都管用。

预计 4 小时（MCP 那块如果暂时用不上可以略读）。

---

## 阶段 5 · RAG 知识库：终点

前面四个阶段都是为这里铺路。现在把所有零件拼起来，搭一个真正的知识库。

**先把 RAG 这条链路讲清楚**（标准流程）：

```
建库阶段：文档 → 切分(chunk) → 向量化(embedding) → 存进向量库
查询阶段：你的问题 → 向量化 → 检索 top-k 相关片段 → 拼进 prompt → 喂给模型 → 基于事实回答
```

一句话——**RAG 就是"回答前先查资料"**，治模型的幻觉和时效问题。回头看阶段 2 那个假的 `search` 工具，现在它要被换成"去向量库里查真资料"。

**框架里 RAG 的位置**：

核心抽象在 `core/rag` 包，几个关键类先认脸：

```
agentscope-core/src/main/java/io/agentscope/core/rag/
├── Knowledge.java                 # 知识库的核心抽象，检索入口
├── KnowledgeRetrievalTools.java   # 把"检索"包装成 Agent 能调的工具（这就是新版的 search！）
├── GenericRAGHook.java            # 用 Hook 的方式把检索自动挂进对话流程
├── RAGMode.java                   # 检索模式
└── model/
    ├── Document.java              # 文档片段
    ├── DocumentMetadata.java      # 元数据
    └── RetrieveConfig.java        # 检索配置（top-k 等）
```

具体的后端实现都在扩展模块 `agentscope-extensions/agentscope-extensions-rag/` 下，五选一：

| 实现 | 适合 | 模块 |
|---|---|---|
| **simple** | 入门、本地、不依赖外部服务 | `agentscope-extensions-rag-simple` |
| **bailian** | 阿里百炼的托管知识库，和 DashScope 一套账号 | `agentscope-extensions-rag-bailian` |
| **dify** | 已经在用 Dify 平台 | `agentscope-extensions-rag-dify` |
| **haystack** | 接 Haystack 生态 | `agentscope-extensions-rag-haystack` |
| **ragflow** | 接 RAGFlow | `agentscope-extensions-rag-ragflow` |

**我的路线**：先用 **simple** 在本地跑通整条链路（理解原理），再考虑上 **bailian**（托管的省心，和我已有的 DashScope Key 同一套账号，最顺）。

这几个扩展模块里没有 `main` 示例，但每个都有**测试代码**可以当例子读，比如：

```
agentscope-extensions-rag-bailian/src/test/.../BailianKnowledgeE2ETest.java   # 端到端，最接近真实用法
agentscope-extensions-rag-dify/src/test/.../DifyKnowledgeTest.java
```

**对应文档**（这章是重点，全读）：

- [集成 · RAG 知识库 · 概览](https://java.agentscope.io/v2/zh/integration/rag/overview.html)
- [RAG · Simple](https://java.agentscope.io/v2/zh/integration/rag/simple.html)
- [RAG · 百炼知识库](https://java.agentscope.io/v2/zh/integration/rag/bailian.html)

**自测 / 最终产出**：用 simple 实现，把几篇我自己的文档（比如这个博客的几篇 md）灌进去建库，然后让 Agent 基于这些文档回答问题——问一个文档里有、但模型本身不知道的细节，看它能不能答对。**能跑通这一步，这个学习计划就算结业了。** 后面的复杂知识库，就是在这个最小可用版本上加东西，那部分我打算让 AI 帮我写——但因为前面五个阶段我都亲手过了一遍，AI 写出来的代码我能看懂、能判断对错、能改。这才是学这套东西的真正目的。

预计 6~8 小时。

---

## 附录

**常用命令速查**

```powershell
# 构建示例模块（含上游依赖）
mvn install -pl agentscope-examples/documentation -am "-DskipTests"

# 运行某个示例（换 mainClass 即可）
mvn exec:java -pl agentscope-examples/documentation "-Dexec.mainClass=<全类名>"

# 拉官方最新代码（origin 直接指向官方仓库，不用 fork）
git pull origin main
```

**读源码的方法**：在 IDEA 里按住 Ctrl 点类名就能跳到定义。看不懂一个类时，先看它的 `import` 和构造函数参数，那决定了它依赖什么。包名 = 目录路径（点换斜杠），`-Dexec.mainClass=io.xxx.Foo` 反推就是 `io/xxx/Foo.java`。

**AI 辅助怎么用才不废人**：让 AI 写之前，我得先有心智模型——知道大概要哪些零件、它们怎么拼。这样 AI 给的代码我能验、能改，而不是囫囵复制跑通就完。前五个阶段亲手做，就是为了攒这个判断力。

**踩坑清单**：

- 改环境变量后程序读不到 → 重启那个程序（不是重启电脑）
- PowerShell 里 `mvn` 的 `-D` 参数报错 → 给整个参数加引号
- 依赖下载龟速 → 配阿里云 Maven 镜像
- 网上教程对不上代码 → 大概率是 v1 教程配 v2 代码，认准 v2 文档

---

对我来说，可能Java语法的不熟悉可能更多一点，agent相关的概念我都比较熟悉，我只需要熟悉agentscope-java怎么使用的即可。

学一个框架，脑子里面要有那张"零件怎么拼"的图。图建起来了，具体的类名、方法名忘了都能查回来；图没建起来，背得再多也是散的。这份计划真正想给我自己的，就是这张图。
