/*
 * @Author: richen
 * @Date: 2020-07-27 11:32:15
 * @LastEditTime: 2020-12-24 15:28:13
 * @Description:
 * @Copyright (c) - <richenlin(at)gmail.com>
 */
import * as helper from 'koatty_lib';
import { DefaultLogger as logger } from 'koatty_logger';
const apollo = require("ctrip-apollo");

interface PluginOptions {
    host: string;
    appId: string;
    clusterName: string;
    namespace: string;
    enableUpdateNotification: boolean;
    enableFetch: boolean;
    fetchTimeout: number;
    fetchInterval: number;
    fetchCachedConfig: boolean;
}

interface UpdateNotification {
    key: string;
    oldValue: any;
    newValue: any;
}

/**
 * default options
 */
const defaultOptions: PluginOptions = {
    host: 'http://127.0.0.1:8080', //your-config-server-url
    appId: 'test', //your-config-appId
    clusterName: 'default', //cluster-name
    namespace: 'application', //your-config-namespace
    enableUpdateNotification: true, // boolean=true set to false to disable update notification.
    enableFetch: true, //boolean=false set to true to enable the feature
    fetchTimeout: 30000, // number=30000 timeout in milliseconds before the initial fetch or interval fetch result in an FETCH_TIMEOUT error.
    fetchInterval: 3 * 60 * 1000, // number = 3 * 60 * 1000 interval in milliseconds to pull the new configurations.Defaults to 5 minutes.Setting this option to 0 will disable the feature.
    fetchCachedConfig: true // boolean = true whether refresh configurations by fetching the restful API with caches.Defaults to true.If you want to always fetch the latest configurations(not recommend), set the option to false
};

/**
 * Wait for a period of time (ms)
 *
 * @param {number} ms
 * @returns
 */
const delay = function (ms = 1000) {
    return new Promise((resolve: Function) => setTimeout(() => resolve(), ms));
};

/**
 *
 *
 * @export
 * @param {PluginOptions} options
 * @param {Koatty} app Koatty or Koa instance
 */
export async function PluginApollo(options: PluginOptions, app: any) {
    const opt = { ...defaultOptions, ...options };

    /**
     * 
     *
     * @param {*} newConfig
     * @returns
     */
    const reFreshConfig = function (newConfig: any) {
        if (helper.isEmpty(newConfig)) {
            return;
        }
        try {
            const typeConfig: any = {};
            for (const n in newConfig) {
                if (n.includes(".")) {
                    const type = n.slice(0, n.indexOf("."));
                    const key = n.slice(n.indexOf(".") + 1);
                    if (type && key) {
                        // tslint:disable-next-line: no-unused-expression
                        !typeConfig[type] && (typeConfig[type] = {});
                        if (helper.isJSONStr(newConfig[n])) {
                            typeConfig[type][key] = JSON.parse(newConfig[n]);
                        } else {
                            typeConfig[type][key] = newConfig[n];
                        }
                    }
                } else {
                    // tslint:disable-next-line: no-unused-expression
                    !typeConfig.config && (typeConfig.config = {});
                    if (helper.isJSONStr(newConfig[n])) {
                        typeConfig.config[n] = JSON.parse(newConfig[n]);
                    } else {
                        typeConfig.config[n] = newConfig[n];
                    }
                }
            }
            let appConfigs = {};
            if (app.setMap) {
                appConfigs = app.getMap("configs") || {};
                appConfigs = helper.extend(appConfigs, typeConfig, true);
                app.setMap("configs", appConfigs);
            }
        } catch (err) {
            logger.Error(err.stack || err);
        }
    };

    /**
     *
     *
     * @param {*} opt
     * @param {*} app
     */
    const initApollo = async function (opt: any, app: any) {
        // Instantiate Apollo
        const apolloClient = apollo(opt).namespace(opt.namespace, 'JSON');
        if (opt.enableUpdateNotification) {
            apolloClient.on('change', ({ key, oldValue, newValue }: UpdateNotification) => {
                logger.Info(`Apollo configuration key ${key} has been refreshed.`);
                reFreshConfig({ [key]: newValue });
            });
        }

        const ns = await apolloClient.ready().catch((err: Error) => {
            return Promise.reject(err);
        });

        const apolloConfigs = await ns.config() || {};
        if (!helper.isEmpty(apolloConfigs)) {
            reFreshConfig(apolloConfigs);
        }
        logger.Info('Apollo configuration center initialization is complete.');
        helper.define(app, "apolloClient", apolloClient, true);


        return apolloClient;
    };
    helper.define(app, "initApollo", initApollo, true);

    const client = await initApollo(opt, app).catch((err: any) => {
        logger.Error("Apollo configuration center initialization error.", err);
        // app.emit("apolloRetry");
    });

    // retry
    client.on("fetch-error", async function () {
        // await delay(5000);
        return initApollo(opt, app);
    });
}