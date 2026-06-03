---
title: "git 常用命令"
published: 2023-06-16
description: "git 常用命令速查"
image: "/cdn/anime/anime-01.jpg"
tags: ["git", "tool"]
category: "笔记"
draft: false
---

## 

##### 第一次建立仓库时git操作

```git
echo "# 147cai" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:147cai/147cai.git
git push -u origin main
```

配置正常，只需提交代码git操作

```
git stash save 'first'
git stash pop 0
git pull
解决文件冲突
git add ./
git status
git commit -m "图标优化代码提交v-1.0.1"
git push origin main 
git log
记录commit号以及提交标注
```



将代码提交到其他分支上

```
git branch 查看分支
git branch -a 查看所有远程仓库
git branch 本地自定义仓库名称 origin/远程仓库   创建本地仓库链接远程分支/R1.8.3z.nsp.20210115
git branch R3.1.0.release origin/R3.1.0.release   
git checkout "本地分支名称"     切换分支
git checkout R3.1.0.release
git cherry-pick fad28fd284d95ecb6702d0179e5ee5577b9e1aa5
```



![image-20230213224807631](/cdn/life/image-20230404091816652.png)

