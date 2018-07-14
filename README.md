
# 柚子极客文化传媒网站
[网站链接](http://www.qxiao.cn:8080/)

---

## 项目简介
* 青岛柚子极客文化传媒是一家专业提供游戏类校园推广、校园媒体投放、品牌校园公关活动的策划执行服务公司。
* 使用Maven对项目进行模块化管理，提高项目的易开发性、扩展性。
* 系统包括分布式配置、eureka注册中心、服务中心、zipkin分布式跟踪等。
* 每个模块服务多系统部署，注册到同一个eureka集群服务注册中心，实现集群部署。

## 主要功能
* 登录、退出登录
* 修改密码、记住密码
* 菜单管理
* 系统参数
* 权限节点
* 岗位管理
* 部门管理
* 用户组管理
* 用户管理

## 依赖
### java后端依赖环境
* Maven 3
* Java 8
* MySQL + Redis

## 工程说明
* cloud-config-server：配置中心。
* cloud-eureka-server：注册中心。
* cloud-simple-service：自定义的微服务。
* cloud-zipkin-ui：分布式链路调用监控系统，聚合各业务系统调用延迟数据，达到链路调用监控跟踪。
* cloud-vue : vue（Vue2.x + Vue-router2.x + Vuex)的前端项目

## 效果图
![登录](./pic/登录.png)

![部门管理](./pic/部门管理.png)

![部门管理](./pic/部门管理.png)

![菜单管理](./pic/菜单管理.png)

![岗位管理](./pic/岗位管理.png)

![权限规则管理](./pic/权限规则管理.png)

![用户组管理](./pic/用户组管理.png)

![注册中心](./pic/注册中心.png)

![swagger](./pic/swagger.png)

![zipkin](./pic/zipkin.png)




