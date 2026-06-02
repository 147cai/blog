---
title: "mysql 常用命令"
published: 2023-06-16
description: "mysql 常用命令速查"
image: ""
tags: ["mysql", "tool"]
category: "笔记"
draft: false
---

## 
##### mysql常用命令记录



在学习node建立后端的过程中，发现之前学的mysql数据库忘记的差不多了，现做个记录



1. 基础命令
默认端口号：3306
查看服务器版本：select version(); 或者 cmd命令 mysql -verison
登录数据库：mysql -uroot -p
退出数据库：exit/quit
查看当前系统下的数据库：show databases;
创建数据库：create 库名;
使用数据库：use 库名;
查看表：show tables;
建表：create table 表名 (字段名+空格+数据类型);
查看表结构：desc 表名;
添值：insert into 表名 (列名) values (值);
查看表中所有数据：select * from 表名;
查询建表时的结构：show create table 表名;
删除字段中的值：delete from 表名 where 条件;
删除表中的字段：delete from 表名 drop column 字段名;或者alter table 表名 drop 字段名
删除表：drop table 表名;
删除库：drop database 库名;
主键约束：primary key
唯一约束：unique
非空约束：not null
默认约束：default
外键约束：foreign key（外键）references主表（主键）
查看别的数据库的表格：show tables from 表名;
2. where条件查询
精确查询：=、!=、>、<、>=、<=
模糊查询：like（像）、not like（不像）
通配符：%：任意字符、-：单个字符
逻辑运算符：
and：同时满足（优先级大于or）
or：满足任意条件即可
区间运算：between a and b （闭区间）
集合运算：in 、not in
非空运算：is null 、is not null
3. 针对表内数据的操作
增加：insert into 表名 (列名) values (值);
删除：delete from 表名 where 条件;
查看：select * from 表名 where 条件;
修改：update 表名 set 字段=新值 where 条件;
排序：order by 字段名;（asc 升序、desc降序）
例：select * from 表名 order by 列名1 asc ,列名2 desc;
聚合函数：
sum() 函数：求累加和
例：select sum(字段名) as ‘别名’/别名 from 表名;
count() 函数：同级行数数量
（1）count(*)：表示计算表中总的行数，不管某列是否有数值或者是为空
select count(*) from 表名；
（2）count(字段名)：表示计算指定列下总的行数，计算或将忽略空值
select count(字段名) from 表名;
avg() 函数：返回一个平均值函数
例：select avg(字段名) as 别名 from 表名;
max() 函数：返回指定列中的最大值
select max(字段名) as 别名 from 表名;
min() 函数： 返回最小值
例：select min(字段名) as 别名 from 表名;
分组：
group by 字段 ：将查询结果按一列/多列的值分组，值相等为一列
having 字段：二次判断，用到聚合函数后，又需筛选条件时，having和group by组合用
例：select 列名1 ,count(列名2) 别名 from 表名 group by 列名1 having 别名 >2;
限制查询结果输出条数：limit 数字
传一个参数（输出前五条数据）
select * from 表名 limit 5;
传两个参数（输出6-15）
select * from 表名 limit 5,10;
:5：从5后开始，10：条数
修改表名：alter table 旧表名 rename 新表名;
修改表中id字段为sid：alter table 表名 change id sid char;
去掉某列：alter table 表名 drop 列名;
添加某列：alter table 表名 add 列名 char;
修改列为字符型：alter table 表名 modify 列名 char(20);
增加多列：alter table 表名 add(xh int(4),zc char(8),ads char(50),);
删除多列：alter table 表名 drop xh,zc,ads;
添加一个字段设主键约束：alter table 表名 add id sm unsigned primary key auto_increment;
关联查询-等值查询：select * from 表名 where a.id=b.id and 条件
内连接：select * from 表名1 inner join 表名2 on 表名1.xh=表名2.xh where 条件;
左连接：select * from 表名1 left join 表名2 on 表名1.xh=表名2.xh where 条件;
右连接：select * from 表名1 right join 表名2 on 表名1.xh=表名2.xh where 条件;
4. 创建索引

1.要尽量避免全表扫描，首先应考虑在 where 及 order by 涉及的列上建立索引
2.在经常需要进行检索的字段上创建索引，比如要按照表字段username进行检索
3.一个表的索引数最好不要超过6个，若太多则应考虑一些不常使用到的列上建的索引是否有必要
普通索引（INDEX）
这是最基本的索引，它没有任何限制，比如上文中为title字段创建的索引就是一个普通索引，MyIASM中默认的BTREE类型的索引，也是我们大多数情况下用到的索引。
直接创建索引
CREATE INDEX index_name ON table(column(length));

修改表结构的方式添加索引
ALTER TABLE table_name ADD INDEX index_name ON (column(length));

创建表的时候同时创建索引
CREATE TABLE `table` (
	`id` int(11) NOT NULL AUTO_INCREMENT ,
	`title` char(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,
	`content` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL ,
	`time` int(10) NULL DEFAULT NULL ,
	PRIMARY KEY (`id`), //主键索引
	INDEX index_name (title(length)) //普通索引
);

唯一索引（UNIQUE）
与普通索引类似，不同的就是：索引列的值必须唯一，但允许有空值。如果是组合索引，则列值的组合必须是唯一的，创建方法和普通索引类似。
创建唯一索引
CREATE UNIQUE INDEX index_name ON table(column(length)); 

修改表结构
ALTER TABLE table_name ADD UNIQUE INDEX index_name ON (column(length));

创建表时同时创建索引
CREATE TABLE `table` (
`id` int(11) NOT NULL AUTO_INCREMENT ,
`title` char(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,
`content` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL ,
`time` int(10) NULL DEFAULT NULL ,
PRIMARY KEY (`id`),
UNIQUE indexName (title(length))
);
	
	多列索引
	语句一般都有比较多的限制条件，所以为了进一步榨取MySQL的效率，就要考虑建立组合索引。例如上表中针对title和time建立一个组合
	ALTER TABLE article ADD INDEX index_titme_time (title(50),time(10));
	
	ALTER TABLE `table_name` ADD INDEX index_name ( `column1`, `column2`, `column3` );

全文索引（FULLTEXT）
ALTER TABLE `table_name` ADD FULLTEXT ( `column`); 

主键索引（PRIMARY KEY）
ALTER TABLE `table_name` ADD PRIMARY KEY ( `column` );

|      |      |
| ---- | ---- |
|      |      |
