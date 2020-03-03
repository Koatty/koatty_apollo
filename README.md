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
        config_key: 'db', // Apollo configuration will overwrite the configuration key, the default value is 'db', corresponding to the configuration file 'db.ts'
        host: 'http://127.0.0.1:8080', //your-config-server-url
        appId: 'test', //your-config-appId
        clusterName: 'default', //cluster-name
        namespace: 'application', //your-config-namespace
        enableUpdateNotification: true, // boolean=true set to false to disable update notification.
        enableFetch: true, //boolean=false set to true to enable the feature
        fetchTimeout: 30000, // number=30000 timeout in milliseconds before the initial fetch or interval fetch result in an FETCH_TIMEOUT error.
        fetchInterval: 5 * 60 * 1000, // number = 5 * 60 * 1000 interval in milliseconds to pull the new configurations.Defaults to 5 minutes.Setting this option to 0 will disable the feature.
        fetchCachedConfig: true, // boolean = true whether refresh configurations by fetching the restful API with caches.Defaults to true.If you want to always fetch the latest configurations(not recommend), set the option to false
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
export class Apollo {
    run(options: any, app: Koatty) {
        return apollo(options, app);
    }
}
```

3、项目中间件配置 config/middleware.ts:
```
list: [...,'Apollo'], //加载的中间件列表
config: { //中间件配置
    ...,
    Apollo: {
        config_key: 'db', // Apollo configuration will overwrite the configuration key, the default value is 'db', corresponding to the configuration file 'db.ts'
        host: 'http://127.0.0.1:8080', //your-config-server-url
        appId: 'test', //your-config-appId
        clusterName: 'default', //cluster-name
        namespace: 'application', //your-config-namespace
        enableUpdateNotification: true, // boolean=true set to false to disable update notification.
        enableFetch: true, //boolean=false set to true to enable the feature
        fetchTimeout: 30000, // number=30000 timeout in milliseconds before the initial fetch or interval fetch result in an FETCH_TIMEOUT error.
        fetchInterval: 5 * 60 * 1000, // number = 5 * 60 * 1000 interval in milliseconds to pull the new configurations.Defaults to 5 minutes.Setting this option to 0 will disable the feature.
        fetchCachedConfig: true, // boolean = true whether refresh configurations by fetching the restful API with caches.Defaults to true.If you want to always fetch the latest configurations(not recommend), set the option to false
    }
}