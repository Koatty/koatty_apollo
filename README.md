# 介绍
-----

[![npm version](https://badge.fury.io/js/think_apollo.svg)](https://badge.fury.io/js/think_apollo)

Apollo Middleware for ThinkKoa.

# 安装
-----

```
npm i think_apollo
```

# 使用
-----

## Thinkkoa

1、项目中增加中间件 

```
think middleware apollo
```

2、修改 middleware/apollo.js:
```
module.exports = require('think_apollo');
```

3、项目中间件配置 config/middleware.js:
```
list: [...,'apollo'], //加载的中间件列表
config: { //中间件配置
    ...,
    apollo: {
        config_path: process.env.APP_PATH + '/config', //project configs path
        apollo_server: 'http://127.0.0.18080', //your-config-server-url
        apollo_appid: { cache: true }, //your-config-appid
        apollo_cluster: 'default', //default to `default`
        apollo_namespaces: ['application'], //default to `['application']`, this is the namespaces that you want to use or maintain.
        initial_configs: true, //default to true
        apollo_listen_notify: 'default', //default to true
        apollo_fetch_interval: 5 * 60e3, //default to 5 minutes. can be customize but 30s or shorter time are not acceptable.
    }
}
```

## Koatty

1、项目中增加中间件

```shell
koatty middleware apollo;
```

2、修改 middleware/Apollo.ts:

```
import { Middleware } from "../core/Component";
import { Koatty } from "../Koatty";
const apollo = require("think_apollo");

@Middleware()
export class Trace {
    run(options: any, app: Koatty) {
        return apollo(options, app);
    }
}
```

3、项目中间件配置 config/middleware.js:
```
list: [...,'apollo'], //加载的中间件列表
config: { //中间件配置
    ...,
    apollo: {
        config_path: process.env.APP_PATH + '/config', //project configs path
        apollo_server: 'http://127.0.0.18080', //your-config-server-url
        apollo_appid: { cache: true }, //your-config-appid
        apollo_cluster: 'default', //default to `default`
        apollo_namespaces: ['application'], //default to `['application']`, this is the namespaces that you want to use or maintain.
        initial_configs: true, //default to true
        apollo_listen_notify: 'default', //default to true
        apollo_fetch_interval: 5 * 60e3, //default to 5 minutes. can be customize but 30s or shorter time are not acceptable.
    }
}