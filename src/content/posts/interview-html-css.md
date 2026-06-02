---
title: "HTML + CSS 面试题"
published: 2023-02-10
description: "记录 HTML 和 CSS 的问题"
image: ""
tags: ["HTML", "CSS"]
category: "笔记"
draft: false
---

##
##### 1.说一下浮动？

浮动是脱离文档的普通流存在的（可以看作是漂浮在普通流上），它可以左右浮动，直到它的外边缘遇到包含框或者另一个浮动框为止，**脱离文档流，盒子塌陷，影响其他元素排版**

##### 2.html语义化是什么？

1. 有利于SEO，搜索引擎根据标签确定上下文和各个关键字的权重。
2. 利于用户阅读，样式文件未加载时页面结构清晰。
3. 利于屏幕阅读器解析，如盲人阅读器会根据语义渲染网页。
4. 利于开发和维护，代码更具可读性、更易于维护。

##### 3.说一说CSS尺寸设置的单位

1.px 绝对像素

2.rem 相对于根元素像素，

3.em 相对于父元素像素

4.vw 视口宽度

5.vh 视口高度



##### 4.过渡transition有哪些属性

transition-property ：规定设置过渡效果的css属性名称，常用值 “all”全部css属性进行动画效果添加
transition-duration ：规定完成过渡效果需要多少秒或毫秒
transition-timing-function ：指定过渡函数，规定速度效果的速度曲线 常用值：关键字描述：linear ease-in ease-in-out
transition-delay ：指定开始出现的延迟时间



##### 5.css3新特性

圆角 （border-radius:8px）

文字特效 （text-shadow）

文字渲染 （Text-decoration）

box-shadow

线性渐变 （gradient）

转换 （transform）

transition

animation动画

增加了旋转,缩放,定位,倾斜,动画,多背景




