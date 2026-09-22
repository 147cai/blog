---
title: "macOS 打的 ZIP，Windows 解压文件名全是乱码"
published: 2026-07-14
description: "同事用 Mac 发的 ZIP 在 Windows 上解压后文件名全变乱码，看起来像'少了文件'。排查发现是 macOS 压缩工具的编码 Bug：Local File Header 写错了文件名，Central Directory 写对了。附核心代码和打包好的修复工具。"
image: ""
tags: ["macOS", "ZIP", "编码", "踩坑", "AI 辅助"]
category: "笔记"
draft: false
---

同事用 Mac 给我发了一个项目资料的 ZIP 压缩包，里面是各种格式的测试文件：PDF、Word、Excel、图片。我在 Windows 上右键解压，发现文件夹里只有两个 TXT，其他文件全部"消失"了。

让同事重新打包发过来，确认说"都在里面啊"。我再解压，还是一样。

---

## 第一次排查：ZIP 里到底有什么

用 Python 的 `zipfile` 模块直接读取 ZIP 内部结构：

```python
import zipfile

with zipfile.ZipFile('test_doc.zip', 'r') as z:
    for info in z.infolist():
        print(info.filename, info.file_size)
```

输出：

```
test_doc/.DS_Store                                  6148
test_doc/σà¼τº»ΘçæΦºäσ«Ü.png                      102043
test_doc/σà¼τº»ΘçæµÅÉσÅûΦ»┤µÿÄ.docx               19412
test_doc/σà¼τº»Θçæ.jpeg                            165857
test_doc/Θù«τ¡öσ»╣.xls                             20480
test_doc/ΘÇÇΣ╝æµÅÉσÅû.bmp                          390636
test_doc/τ╝┤σ¡ÿΣ╕Üσèíσè₧Σ║ïµîçσìù.txt             6009
```

文件名全变成了希腊字母和乱码。

Windows 资源管理器看到的也是这样。有些乱码文件名包含 Windows 不允许的字符，直接无法显示——看起来就像文件不存在。这就是"少了文件"的原因。

---

## 第二次排查：同一个 ZIP，文件名存了两份

ZIP 文件格式有一个特点：**文件名存在两个地方**。

| 位置 | 说明 |
|------|------|
| Local File Header | 每个文件数据前面的头部，紧挨着文件内容 |
| Central Directory | 文件末尾的索引区，相当于 ZIP 的"目录" |

大部分解压工具（包括 Windows 自带的）读 Local File Header，macOS 自带的解压读 Central Directory。

我直接从二进制层面读 Central Directory 的原始字节：

```python
import struct

with open('test_doc.zip', 'rb') as f:
    data = f.read()

# Central Directory 的 signature 是 PK\x01\x02（0x02014b50）
pos = 0
while pos < len(data):
    idx = data.find(b'PK\x01\x02', pos)
    if idx == -1:
        break

    # 偏移 28 处是文件名长度，偏移 46 处是文件名内容
    fname_len = struct.unpack('<H', data[idx+28:idx+30])[0]
    fname_bytes = data[idx+46:idx+46+fname_len]

    print(f'原始字节: {fname_bytes}')
    print(f'UTF-8 解码: {fname_bytes.decode("utf-8")}')
    print()

    pos = idx + 46 + fname_len + ...
```

结果：

```
原始字节: b'\xe5\x85\xac\xe7\xa7\xaf\xe9\x87\x91\xe8\xa7\x84\xe5\xae\x9a'
UTF-8 解码: 公积金规定

原始字节: b'\xe5\x85\xac\xe7\xa7\xaf\xe9\x87\x91\xe6\x8f\x90\xe5\x8f\x96\xe8\xaf\xb4\xe6\x98\x8e'
UTF-8 解码: 公积金提取说明
```

**Central Directory 里的文件名是完全正确的 UTF-8。**

同一个 ZIP 文件，Local File Header 里是乱码，Central Directory 里是正确的中文。这是 macOS 自带压缩工具的一个已知 Bug——在某些版本上，创建 ZIP 时把 Local File Header 的文件名编码写错了，但 Central Directory 写对了。

Mac 上解压没问题，因为 macOS 读的是 Central Directory。Windows 上全是乱码，因为 Windows 读的是 Local File Header。所以同一个文件，"Mac 上打开好好的，Windows 上缺文件"。

---

## 解决方案：从 Central Directory 读文件名

既然 Local File Header 是坏的，Central Directory 是好的，那就只读后者：

```python
import zipfile
import struct
import os


def extract_mac_zip(zip_path, extract_to='.'):
    with open(zip_path, 'rb') as f:
        data = f.read()

    # ---- 第一步：从 Central Directory 收集正确的文件名 ----
    cd_names = []
    pos = 0
    while pos < len(data):
        idx = data.find(b'PK\x01\x02', pos)   # Central Directory 签名
        if idx == -1:
            break

        fname_len = struct.unpack('<H', data[idx+28:idx+30])[0]
        extra_len = struct.unpack('<H', data[idx+30:idx+32])[0]
        comment_len = struct.unpack('<H', data[idx+32:idx+34])[0]
        fname_bytes = data[idx+46:idx+46+fname_len]

        if not fname_bytes.startswith(b'__MACOSX'):   # 跳过 macOS 元数据
            cd_names.append(fname_bytes.decode('utf-8'))

        pos = idx + 46 + fname_len + extra_len + comment_len

    # ---- 第二步：用正确的文件名解压 ----
    with zipfile.ZipFile(zip_path, 'r') as z:
        files = [i for i in z.infolist()
                 if not i.filename.startswith('__MACOSX')]

        for idx, info in enumerate(files):
            save_name = cd_names[idx] if idx < len(cd_names) else info.filename
            out_path = os.path.join(extract_to, save_name)

            if info.filename.endswith('/'):
                os.makedirs(out_path, exist_ok=True)
                continue

            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, 'wb') as f:
                f.write(z.read(info.filename))    # 文件内容没有损坏

            print(f'已解压: {save_name}')
```

核心就三行：找到 `PK\x01\x02` 签名，跳到偏移 46 读文件名，用 UTF-8 解码。文件内容本身没有损坏，只需要用正确的文件名保存。

---

## 打包成拖拽工具

为了让不懂代码的同事也能用，打包成了一个 Windows EXE：

```bash
pyinstaller --onefile --console --name mac_zip_extract extract_mac_zip.py
```

使用方式：把 ZIP 文件拖到 `mac_zip_extract.exe` 图标上，自动解压到同目录下的同名文件夹。

```
==================================================
  macOS ZIP 解压修复工具
==================================================

文件: test_doc.zip

检测到 macOS 编码问题，正在修复文件名...
   1. test_doc/公积金规定.png  (99.7 KB)
   2. test_doc/公积金提取说明.docx  (19.0 KB)
   3. test_doc/公积金.jpeg  (162.0 KB)
   ...
  12. test_doc/提取业务办事指南.txt  (2.7 KB)

解压完成! 共 12 个文件
```

---

排查这个问题花了比我预期多得多的时间，因为一开始根本没想到 ZIP 格式里同一个文件名会存两份、而且两份还不一样。后来想想也合理——ZIP 格式是 1989 年设计的，Local File Header 和 Central Directory 本来就是冗余设计，大概是为了支持分卷压缩和损坏恢复。只是没料到 macOS 的压缩工具会在这种基础事情上写错编码。

下次再遇到"同事说文件发齐了但你解压后少东西"的情况，先看看文件名是不是乱码。是的话，大概率就是这个问题。
