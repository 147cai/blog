---
title: "计算机网络面试题"
published: 2023-02-10
description: "记录在面试中遇到的计算机网络的问题"
image: ""
tags: ["http", "计算机网络"]
category: "笔记"
draft: false
---

## 
##### 1.说一下http的请求方法

总共有8种，

HTTP1.0定义了三种请求方法： GET, POST 和 HEAD方法。
HTTP1.1新增了五种请求方法：OPTIONS, PUT, DELETE, TRACE 和 CONNECT 方法

**最常用的四种请求方法：GET, POST, PUT, DELETE**

1、get请求：
get：可以理解 为 取 的意思，对应select操作
用来获取数据的，只是用来查询数据，不对服务器的数据做任何的修改，新增，删除等操作。
说明：
get请求会把请求的参数附加在URL后面，这样是不安全的，在处理敏感数据时不用，或者参数做加密处理。
get请求其实本身HTTP协议并没有限制它的URL大小，但是不同的浏览器对其有不同的大小长度限制
2.post请求

数据发送到服务器以创建或更新资源，侧重于更新数据，对应update操作
说明：
post请求的请求参数都是请求body中

3、put请求：

put：可以理解为 放 的意思

4、delete请求：

delete：字面意思删除，即删除数据，对应delete操作
用来删除指定的资源，它会删除URI给出的目标资源的所有当前内容数据发送到服务器以创建或更新资源，侧重于创建数据，对应insert操作

##### 2.get和post区别

get和post本质上都是一样的，都是http请求的基本方法

1.主要的区别在于：

GET 就发送了一个TCP数据包给服务器而POST发送了两次TCP数据包给服务器

2.GET 是将数据中的hearder 和 data 一起发送给服务端，返回200code；

POST 是先将hearder发给服务器返回100continue，再发送data给到服务器，返回200

3.：GET请求在浏览器刷新或者回退的时候是无害的。POST的话数据会被重新提交。

4.可见性 参数在URL用户可以看见，POST的参数在REQUSET BODY中不会被用户看见

5.安全性 GET相对不安全 POST相对安全些
