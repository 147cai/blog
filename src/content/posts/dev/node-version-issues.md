---
title: "node 版本问题"
published: 2023-06-16
description: "node 版本管理相关问题"
image: "/cdn/anime/anime-05.jpg"
tags: ["node", "tool"]
category: "笔记"
draft: false
---

## 
##### 今天在运行网上的一个项目时，又一次遇到了node版本过高导致无法npm install问题，因此做个记录



nvm是一个Node.js版本管理器 ，为了解决Node各种版本存在不兼容问题，Nvm其实是让你在同一台机器上根据需要，安装 或 切换项目所对应的Node版本来适配项目。



nvm安装等可以自行百度

命令	说明
nvm version	查看nvm版本
nvm ls	查看所有已经安装的Nodejs版本
nvm list installed	查看所有已经安装的Nodejs版本
nvm ls available	查看运程线上所有版本(列出所有可以安装的node版本号)
nvm root	查看nvm安装路径
nvm arch	查看节点是否以32位或64位模式运行
nvm current	查看当前node版本
nvm proxy	查看设置与代理



安装不同node版本：

| nvm install latest    | 安装最新稳定版Nodejs |
| --------------------- | -------------------- |
| nvm install 12.18.0   | 安装指定版本         |
| nvm uninstall 12.18.0 | 卸载指定 12.18.0版本 |

| nvm use 版本号  | 切换版本（这个是全局的） |
| --------------- | ------------------------ |
| nvm use 12.18.0 | 切换到2.18.0版本         |
