---
title: "JavaScript 面试题"
published: 2023-02-10
description: "记录 JavaScript 问题"
image: ""
tags: ["JavaScript"]
category: "笔记"
draft: false
---

##
###### **1.什么是闭包？**

内层函数+引用的外层函数变量 = 闭包

闭包的主要应用就是进行数据的私用化，减少全局变量

闭包的内存泄露：

![image-20230213220712311](/cdn/note/image-20230213220712311.png)

###### **2.宏任务和微任务？**

- 宏任务：setTimeout，setInterval，Ajax，DOM事件

- 微任务：Promise，process.nextTick

  宏任务在异步任务中不需要连贯执行，微任务在异步任务中需要连贯执行

微任务的执行时机要比宏任务早！（可以先记一哈，后面会继续说这点）

Dom事件不是异步操作，但是它依赖了eventloop机制，所以也归在这点里了

```js
console.log(100)
setTimeout(()=>{
    console.log(200)
})
Promise.resolve().then(()=>{
    console.log(300)
})
console.log(400)
// 答案为： 100 400 300 200
```

###### 3.防抖和节流

![image-20230213224807631](/cdn/note/image-20230213224807631.png)

###### 4.js函数的几种声明方式

![image-20230213225234423](/cdn/note/image-20230213225234423.png)

###### 5.谈谈你对原型的理解？

1、所有的引用类型（数组、函数、对象）可以自由扩展属性（除null以外）。

2、所有的引用类型都有一个’_ _ proto_ _'属性(也叫隐式原型，它是一个普通的对象)。

3、所有的函数都有一个’prototype’属性(这也叫显式原型，它也是一个普通的对象)。

4、所有引用类型，它的’_ _ proto_ _'属性指向它的构造函数的’prototype’属性。

5、当试图得到一个对象的属性时，如果这个对象本身不存在这个属性，那么就会去它的’_ _ proto_ _'属性(也就是它的构造函数的’prototype’属性)中去寻找。

###### 6.箭头函数和普通函数的区别？

1.箭头函数比普通函数更简洁

2.箭头函数没有this指针

3.箭头函数继承的this指针永远不会改变，因此call，apply,bind等方法不能改变箭头函数中的

 this指向

4.箭头函数不能作为构造函数使用

由于箭头函数时没有自己的this，且this指向外层的执行环境，且不能改变指向，所以不能当做构造函数使用。

5.箭头函数没有自己的arguments

箭头函数没有自己的arguments对象。在箭头函数中访问arguments实际上获得的是它外层函数的arguments值。

6. 箭头函数没有prototype

##### 7.说一说跨域是什么，如何解决跨域问题？

跨域的概念：浏览器不能执行其它的网站的脚本，这由浏览器的同源策略造成的，也是浏览器施加安全的限制

 跨域解决方案： - jsonp - 前端proxy后端cors - 线上Nginx - websockt

##### 8.js类型

7种基本数据类型  

undefined

null

number

string

boolean

symbol

bigint

3种引用数据类型

object

function

array

##### 9.数据类型的检查方式有那些

1.typeof

2.instanceof

3.constructor

4.object.prototype.toString.call()

##### 10 es6新增了那些新语法

1.let const 

2.解构赋值

3.模板字符串

4.map set 数组新方法如forEach find map() filter() Array.from()

5.箭头函数

6.类

7.promise和proxy

8.模块化


