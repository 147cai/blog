---
title: "浏览器性能优化"
published: 2023-02-10
description: "记录浏览器性能优化相关问题"
image: ""
tags: ["性能优化"]
category: "笔记"
draft: false
---

## 
##### 1.html渲染过程详解

用户输入url地址，浏览器根据域名寻找IP地址
浏览器向服务器发送http请求，如果服务器段返回以301之类的重定向，浏览器根据相应头中的location再次发送请求
服务器端接受请求，处理请求生成html代码，返回给浏览器，这时的html页面代码可能是经过压缩的
浏览器接收服务器响应结果，如果有压缩则首先进行解压处理，紧接着就是页面解析渲染

**解析渲染该过程主要分为以下步骤：**

1. **解析HTML**
2. **构建DOM树**
3. **DOM树与CSS样式进行附着构造呈现树**
4. **布局**
5. **绘制**

##### 2.一个页面从输入URL到页面加载显示完成，这个过程发生的事。

[(112条消息) HTML页面渲染的过程_zhcinit0的博客-CSDN博客_html渲染页面的过程](https://blog.csdn.net/zhcinit0/article/details/107250614/?ops_request_misc=&request_id=&biz_id=102&utm_term=页面渲染html的过程&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduweb~default-4-107250614.142^v73^insert_down1,201^v4^add_ask,239^v2^insert_chatgpt&spm=1018.2226.3001.4187)

1.浏览器查找域名获得对应ip地址

2.浏览器向web服务器发送一个http请求

3.服务器重定向

4.浏览器跟踪重定向地址，请求相应资源

5.服务器处理请求

6.服务器返回一个http响应

7.浏览器进行html的解析以及渲染绘制制图
