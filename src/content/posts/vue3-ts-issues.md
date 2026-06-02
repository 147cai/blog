---
title: "vue3 + ts 中遇到的问题"
published: 2023-06-16
description: "记录 vue3 + typescript 开发中的疑难杂症"
image: ""
tags: ["vue", "typescript", "疑难杂症"]
category: "笔记"
draft: false
---

## 

##### vue3+ts 在vscode中引用路径时一直提示爆红

意思是说找不到对应的模块“@/views/xxx.vue”或其相应的类型声明

1.确保你的 tsconfig.json 文件中的 compilerOptions 部分包含了正确的路径映射设置。例如：
```js
json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```
2.确保你的 vue.config.js 文件中的 configureWebpack 部分包含了正确的别名设置。例如：
```js
javascript
const path = require('path');

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  }
};
```
3.确保你的 @/pages/hospital/index.vue 文件实际上存在于 src/pages/hospital/index.vue 路径下，并且文件名大小写匹配。
 
4.最后，也是我遇到的原因  因为ts只能解析 .ts 文件，无法解析 .vue文件 所以导致引用 .vue 文件报错
解决方法很简单，一开始的时候env.d.ts是空文件，我们可以在项目的env.d.ts中引入如下代码：
declare module '*.vue' {
  import { DefineComponent } from "vue"
  const component: DefineComponent<{}, {}, any>
  export default component
}