---
title: "Vue 面试题"
published: 2023-02-10
description: "记录 Vue 的一些记录"
image: ""
tags: ["Vue", "vite"]
category: "笔记"
draft: false
---

## 
##### 1.说一说对vue的理解？

1、MVVM是核心特性之一,其中M表示Model数据，V表示View视图，VM表示ViewMode视图模型层，主要用来连接Model和View

2、组件化开发思想:在vue中可以把图形和非图形的各种逻辑抽象为一个统一得到概念来实现开发模式，每个.vue文件就代表着一个组件

组件化的优势:

   降低了耦合度，可以通过组件快速完成需求

   调试方便，页面上很多地方使用同一个组件，在出问题时只需要调试这个地方就行了

   提高了可维护性，组件的维护成本低

3、vue有着特色的指令系统

 比如条件渲染v-if，列表渲染v-for，属性绑定v-bind，双向绑定v-model，事件绑定v-on等等，在没有这些指令之前，我们获取需要通过操作dom的形式进行一些操作，比较麻烦

##### 2.**谈谈对生命周期的理解**

1、beforeCreate组件实例被创建之前

- 初始化vue实例，进行数据观测

2、created组件实例已经被完全创建

- 完成数据观测，属性与方法的运算，watch、event事件回调的配置
- 可调用methods中的方法，访问和修改data数据触发响应式渲染dom，可通过computed和watch完成数据计算
- 此时vm.$el 并没有被创建

3、beforeMount组件挂载之前

- 在此阶段可获取到vm.el
- 此阶段vm.el虽已完成DOM初始化，但并未挂载在el选项上

4、mounted组件挂载到实例上去之后

- vm.el已完成DOM的挂载与渲染，此刻打印vm.$el，发现之前的挂载点及内容已被替换成新的DOM

5、beforeupdated组件更新之前

- 更新的数据必须是被渲染在模板上的（el、template、render之一）
- 此时view层还未更新
- 若在beforeUpdate中再次修改数据，不会再次触发更新方法

6、updated组件数据更新之后

- 完成view层的更新
- 若在updated中再次修改数据，会再次触发更新方法（beforeUpdate、updated）

7、beforedestroy组件实例被销毁之前

- 实例被销毁前调用，此时实例属性与方法仍可访问

8、destoryed组件实例被销毁之后

- 完全销毁一个实例。可清理它与其它实例的连接，解绑它的全部指令及事件监听器
- 并不能清除DOM，仅仅销毁实例

9、activated，keepalive缓存组件激活时

10、deactivated，keepalive缓存的组件停止调用时



##### 3.**数据请求在created和mounted中的区别**

1、created的时候页面的dom还未生成，mounted的时候页面dom已经生成了

2、created获取数据比mounted更早，两者的相同点：都能拿到实例对象的属性和方法。

3、放在mounted中的请求有可能导致页面闪动(因为dom已经生成了)

##### 4**vue里组件间通信的方式有哪些**



1、vuex全局状态管理(pinia)

2、父组件通过标签进行值的传递，子组件通过props接收

3、eventbus来进行传递

4、子组件通过emit来进行发布事件

5、通过$parent和$children来进行传递

6、通过provide和inject来进行注入

7、通过ref进行传值

8.自定义事件

9.pubsub-js

10.插槽

11vuex
