---
title: "RAGFlow 源码拆解：两个能直接抄进 Java RAG 里的设计（详细版）"
published: 2026-07-07
description: "我在搭一个 Java RAG 项目，把「传统 RAG 心智模型」「agentscope-java 框架自带的简易 RAG」「RAGFlow 这种专业 RAG 平台」的处理方式挨个读了一遍源码，记一下这三者的真实差距，以及我打算怎么抄。"
image: ""
tags: ["RAG", "RAGFlow", "架构", "检索", "AI 辅助"]
category: "笔记"
draft: false
---

我最近在搭自己的 RAG 项目，本来只是想读读 RAGFlow 的源码，抄两个设计过来。结果顺手翻了一眼 `agentscope-java` 自己带的 RAG 模块，愣了一下——它的核心配置类 `RetrieveConfig` 上面标着：

```java
/**
 * @deprecated since 2.0.0. The rag package is removed; integrate retrieval at the application
 *     layer.
 */
@Deprecated(forRemoval = true, since = "2.0.0")
public class RetrieveConfig {
```

翻译一下：框架作者自己在框架里糊了一套 RAG，现在又打算把它删掉，理由是"这事不该框架管，去应用层自己接"。这比我读的任何一篇 RAGFlow 介绍都更有说服力，我索性把这三份东西摆在一起看：**我原来对 RAG 的心智模型**、**agentscope-java 自己写的简易实现**、**RAGFlow 这种专业系统的实现**。

---

## 先破一个误区：RAG 的及格线和专业线，差的不是模型

我原来对 RAG 的理解就是四步走完就算完工：

```
文档 → 切分(固定窗口) → 向量化 → 向量库 → Top-K检索(纯向量) → Prompt拼接 → LLM生成
```

四步都对，模型也能选最好的，但把三份真实代码摆一起看才发现：**及格线和专业线之间的差距，不在"用不用得起好模型"，在这四步里的两步——"切分"和"检索"——被做到了什么精细度**。前者决定了喂给模型的原料质量，后者决定了在一堆候选里挑得准不准。这两步做糙了，模型再强也是"垫脚料喂饱嘴，但没吃对东西"。

---

## 证据一：agentscope-java 自己写的简易 RAG，基本就是我原来的心智模型

`agentscope-extensions-rag-simple` 模块里有一个 `TextChunker`，切分策略只有四种（`SplitStrategy`）：

```java
return switch (strategy) {
    case CHARACTER -> chunkByCharacter(text, chunkSize, overlapSize);  // 纯字符数切
    case PARAGRAPH -> chunkByParagraph(text, chunkSize, overlapSize);  // 按空行分段，超长再回退字符切
    case TOKEN -> chunkByToken(text, chunkSize, overlapSize);          // token≈4字符的粗略换算，本质还是字符切
    case SEMANTIC -> chunkBySemantic(text, chunkSize, overlapSize);    // 名字叫语义切分，其实是……
};

private static List<String> chunkBySemantic(String text, int chunkSize, int overlapSize) {
    // For now, fall back to paragraph-based chunking
    // A full implementation would use sentence segmentation
    return chunkByParagraph(text, chunkSize, overlapSize);   // 占位实现，还没做
}
```

`SEMANTIC` 这个策略名字取得最有野心，实现却是个占位——注释自己承认"完整实现应该用句子分割"，但现在就是 `PARAGRAPH` 的别名。这行代码基本证明了一件事：**"按语义切"这句话说起来容易，真正实现起来是个没人抄近路的硬骨头**，连框架自己都还没填这个坑。

检索侧同理，`VDBStoreBase` 接口只有一种能力：

```java
Mono<List<Document>> search(SearchDocumentDto searchDocumentDto);
// 内部走 DistanceCalculator.cosineSimilarity() 或 euclideanDistance()，单路向量检索，没有关键词检索、没有混合、没有rerank
```

`RetrieveConfig` 里能配的参数也就 `limit`（默认5）和 `scoreThreshold`（默认0.5），单路向量 Top-K，仅此而已。**这基本就是我原来传统 pipeline 的 Java 实现**，别人已经把参照物写好了。

---

## 证据二：agentscope-java 到底是怎么处理 RAG 的

这部分我读得最细，因为最开始那个 `@Deprecated` 只是冰山一角，扒下去发现是一整套设计，值得完整讲。

### 先看废弃前的设计：两种"接入方式" × 任意"检索来源"

`core/rag` 包里除了 `RetrieveConfig`，`Knowledge` 接口、`RAGMode` 枚举、`GenericRAGHook`、`KnowledgeRetrievalTools`、`DocumentMetadata` 全部标了同一行 `@Deprecated(forRemoval=true, since="2.0.0")`。也就是说不是某一个类的问题，是**整个 RAG 子系统**要被拿掉。但拿掉之前，这套设计其实挺讲道理，值得先看懂再看它为什么被砍。

`RAGMode` 定义了两种把检索结果"喂"给 Agent 的方式：

```java
public enum RAGMode {
    GENERIC,  // 每次推理前自动检索并注入，Agent感知不到，无脑喂
    AGENTIC,  // Agent自己决定要不要检索，通过Tool调用
    NONE
}
```

`GENERIC` 模式靠 `GenericRAGHook` 实现，钩在 `PreCallEvent` 上，每次调用模型前先摸一把最后一条用户消息去检索，检索失败就**静默降级**、不阻塞主流程：

```java
return knowledge.retrieve(query, defaultConfig)
        .flatMap(retrievedDocs -> { /* 把结果包成一条 <retrieved_knowledge> 消息插进去 */ })
        .onErrorResume(error -> {
            log.warn("Generic RAG retrieval failed: {}", error.getMessage(), error);
            return Mono.just(event);   // 挂了就当没检索过，继续走原流程
        });
```

`AGENTIC` 模式靠 `KnowledgeRetrievalTools` 实现，本质是注册一个叫 `retrieve_knowledge` 的工具，让 Agent 自己判断"这轮要不要查知识库"，还顺手把 Agent 当前的对话历史自动塞进检索配置，给支持多轮上下文改写的知识库（比如百炼）用：

```java
@Tool(name = "retrieve_knowledge", description = "...Use this tool when you need to find specific information...")
public String retrieveKnowledge(String query, Integer limit, Agent agent, RuntimeContext ctx) {
    List<Msg> conversationHistory = ...; // 从agent当前状态里顺手带出对话历史
    RetrieveConfig config = defaultConfig.mutate().limit(limit).conversationHistory(conversationHistory).build();
    return knowledge.retrieve(query, config).map(this::formatDocumentsForTool).block();
}
```

这个设计好在哪：**"怎么接入 Agent 循环"（自动注入 vs 主动调用）和"谁来做检索"（自建向量库 / RAGFlow / Dify / Bailian / Haystack）被拆成了两个独立维度**。`Knowledge` 只是个接口，`SimpleKnowledge`、`RAGFlowKnowledge`、`DifyKnowledge`、`BailianKnowledge`、`HayStackKnowledge` 都实现它——换检索来源只是换一个 `Knowledge` 实现，`GenericRAGHook`/`KnowledgeRetrievalTools` 这层代码完全不用碰。这跟我在 RAGFlow 里看到的 `DocStoreConnection` 抽象是同一种思路：把易变的部分（谁来检索）藏在接口后面，稳定的部分（怎么接进主流程）不动。

### 再看为什么要砍：不是否定 RAG，是否定"RAG 该有专属子系统"

我去翻了这几个类的提交记录，找到那次打上 `forRemoval=true` 的 commit，说明写得很直白：

```
Stage E: mark legacy modules @Deprecated(forRemoval=true, since="2.0.0")

- core/memory/* → use AgentState.context + ContextCompressor
- core/pipeline/* → use Reactor Flux composition + middleware
- core/plan/*     → use state/TaskContext
- core/rag/*      → integrate via middleware/tool layer
- core/session/*  → use storage/StorageBase + state/AgentState.sessionId
- core/hook/*      → use MiddlewareBase hooks
```

这次不是单独针对 RAG 下的判断，是**一次性把 7 个自成一派的子系统（memory/pipeline/plan/rag/session/hook/tracing）全部拆掉，统一收进一套通用的 middleware/tool 组合模型**里。`core/rag` 只是这次"大扫除"里的一个受害者，判词是"integrate via middleware/tool layer"——翻译过来就是：**RAG 不该在框架里长出自己专属的 Hook 类型（`GenericRAGHook`）、自己专属的 Tool 类（`KnowledgeRetrievalTools`）、自己专属的 Config 类（`RetrieveConfig`），它就应该是通用 middleware/tool 机制的一个普通用例**，跟做限流、做重试、做压缩没有本质区别，不值得框架为它单开一整套抽象。

有个细节能佐证这个判断没有反悔：`RAGFlowKnowledge`、`DifyKnowledge`、`BailianKnowledge` 这几个平台适配器类本身**没有**被标 `@Deprecated`——它们只是实现了一个快要被移除的接口，等新的 middleware/tool 层落地后，大概率是把 `retrieve()` 这行调用平移过去，"该把解析和检索外包给专业平台"这个判断本身完好保留，被否定的只是"框架要不要为它单独造一套接入机制"。我又去翻了 `agentscope-harness` 模块，那边已经有一堆 `CompactionMiddleware`、`MemoryFlushMiddleware`、`AsyncToolMiddleware`，但还没看到专门的 RAG middleware——说明这条迁移路径写在了 commit 里，但工程上还没走完，是个正在进行时的重构。

这件事让我对"专业分工"这四个字有了更具体的认知：**agentscope-java 判断"文档解析+切分+混合检索"这活儿它自己不该管，交给 RAGFlow/Dify/Bailian 这类专门系统去做；同时它也判断"RAG 怎么接进 Agent 循环"这活儿也不该有专属抽象，交给框架统一的 middleware/tool 机制去做**——两层判断加起来，才是"该交给专业系统的交给专业系统，该收归统一机制的收归统一机制"，而不是我一开始简单理解的"RAG 不做了"。

---

## 那"专业"具体专业在哪：三方对比

把三者的处理方式摆成一张表：

| 维度 | 我原来的心智模型 | agentscope-java（rag-simple） | RAGFlow |
|---|---|---|---|
| 切分依据 | 固定窗口滑动切 | 4 种策略，其中"语义切"是段落切的占位别名 | 按文档类型分派策略：表格逐行切、QA整体保留、标题层级树切 |
| chunk 位置信息 | 通常没有 | `docId`+`chunkId`，位置要自己塞进自定义 `payload` | 内置页码+像素坐标，可裁图，前端能跳转高亮原文 |
| 检索方式 | 单路向量 Top-K | 单路向量 Top-K（cosine/euclidean二选一） | 全文关键词+向量两阶段混合，应用层统一公式重新算分 |
| 检索融合公式 | 无 | 无（只有一个 scoreThreshold 过滤） | `score = (1-w)*词项相似度 + w*向量或rerank分数` |
| Rerank | 无 | 无 | 独立可插拔模型槙位，分数强制 min-max 归一化后再参与融合 |
| 文档管理 | 自己实现 | 自己实现（内存/Milvus/PgVector/Qdrant/ES 多后端） | 交给 RAGFlow 平台（解析/OCR/版面分析/切分全包） |

看完这张表我更确定一件事：**"传统 RAG"和"专业 RAG"的分界线，就卡在"切分"和"检索"这两格**。剩下的（多种向量库支持、embedding模型接入）三者其实做得都还行，没有本质差距。

---

## 我打算怎么抄：三档优先级

对照我自己在建的 Java 项目，我把要抄的东西按投入产出排了个序：

**P0，这周就改**
- chunk 落库时带上原文位置（哪怕只是字符区间 `[start, end]`，不需要像素坐标），成本几乎为零，换来的是"可追溯引用"。
- 检索改成两阶段：全文索引（Lucene/ES 的 BM25）和向量库分别取 Top-N，应用层用 `score=(1-w)*text_sim+w*vector_sim` 统一重排——这一步不需要向量库原生支持混合查询，纯代码逻辑。
- Rerank 做成可插拔开关：接一个现成的 cross-encoder 服务，分数**必须先归一化**再进融合公式，不然不同 rerank 模型的分数量纲对不上，白接。

**P1，做完 P0 再上**
- 切分按文档类型分派策略（至少区分：通用固定窗口 / 表格逐行 / QA整体保留），不再是所有文档一套参数。
- 向量库访问抽一层接口，学 `VDBStoreBase` 这种"结构化查询对象"的思路，别让具体 SDK 的 Query 对象直接漏到业务层。

**P2，先不碰**
- DeepDoc 级别的版面分析+OCR+表格结构识别——工程量陡增，只有扫描件/复杂排版 PDF 场景才值得投入。
- 知识图谱增强、Agent 编排——和我现在要解决的问题关系不大，先放着。

---

读完这三份代码，我最大的感触是：agentscope-java 没有硬撑着把 RAG 做成框架亮点，也没有简单粗暴地"删了就完事"——它把"检索该外包给专业平台"和"RAG 不该在框架里长专属抽象"这两件事分开判断、分开处理。这种肯拆分问题、不含糊各打五十大板的态度，比它自己写一套多华丽的 RAG 模块更值得学。
