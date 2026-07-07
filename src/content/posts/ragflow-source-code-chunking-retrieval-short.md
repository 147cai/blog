---
title: "RAGFlow 源码拆解：两个能直接抄进 Java RAG 里的设计"
published: 2026-07-07
description: "我在搭自己的 Java RAG 项目，把「传统 RAG 心智模型」「agentscope-java 框架自带的简易 RAG」「RAGFlow 这种专业 RAG 平台」的处理方式挨个读了一遍源码，记一下这三者的真实差距，以及我打算怎么抄。"
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

## 证据二：连框架作者自己都放弃了，转头去接 RAGFlow

更有意思的是 `agentscope-extensions-rag-ragflow` 这个模块。它没有重新实现一套解析和切分，`RAGFlowKnowledge.addDocuments()` 直接甩了个异常：

```java
@Override
public Mono<Void> addDocuments(List<Document> documents) {
    return Mono.error(new UnsupportedOperationException(
        "Document upload is not supported via this plugin. "
        + "Please use RAGFlow console to manage documents. "
        + "This design keeps the plugin focused on retrieval and "
        + "compatible with Bailian and Dify RAG plugins."));
}
```

`retrieve()` 也只是转发调用 RAGFlow 的 `POST /api/v1/datasets/{id}/retrieve-chunks` 接口，拿到结果转换格式就完事：

```java
return client.retrieve(query, topK, similarityThreshold, null)
        .map(response -> RAGFlowDocumentConverter.convertToDocuments(response.getData().getChunks()));
```

也就是说：**文档怎么解析、怎么切分、怎么混合检索，agentscope-java 完全不管，全权交给 RAGFlow 去做，自己只当一个"取数客户端"**。同一个模块目录下还躺着 Dify、Bailian、Haystack 三个类似的适配器——这不是孤例，是这个框架明确的策略：把"专业 RAG 能力"当成一个可插拔的外部服务，而不是自己在框架层再造一遍。

这跟前面 `RetrieveConfig` 被标记废弃是同一个判断的两面：**框架层的简易 RAG 拿来做 demo 够用，真要交付质量，就得接一个像 RAGFlow 这样专门做这件事的系统**。

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

读完这三份代码，我最大的感触是：agentscope-java 团队没有硬撑着把 RAG 做成框架亮点，反而诚实地把它标成 deprecated、转头去接专业系统——这种"知道自己不擅长什么、就别硬造轮子"的判断，比它自己写一套多华丽的 RAG 模块更值得学。
