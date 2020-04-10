/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2017 - <richenlin(at)gmail.com>
 * @license    MIT
 * @version    17/6/12
 */
const apollo = require('ctrip-apollo')
const lib = require("think_lib");
const logger = require("think_logger");

/**
 * default options
 */
const defaultOptions = {
    host: 'http://127.0.0.1:8080', //your-config-server-url
    appId: 'test', //your-config-appId
    clusterName: 'default', //cluster-name
    namespace: 'application', //your-config-namespace
    enableUpdateNotification: true, // boolean=true set to false to disable update notification.
    enableFetch: true, //boolean=false set to true to enable the feature
    fetchTimeout: 30000, // number=30000 timeout in milliseconds before the initial fetch or interval fetch result in an FETCH_TIMEOUT error.
    fetchInterval: 3 * 60 * 1000, // number = 3 * 60 * 1000 interval in milliseconds to pull the new configurations.Defaults to 5 minutes.Setting this option to 0 will disable the feature.
    fetchCachedConfig: true, // boolean = true whether refresh configurations by fetching the restful API with caches.Defaults to true.If you want to always fetch the latest configurations(not recommend), set the option to false
};

module.exports = async function (options, app) {
    options = options ? lib.extend(defaultOptions, options, true) : defaultOptions;

    /**
     * 
     *
     * @param {*} newConfig
     * @returns
     */
    const reFreshConfig = function (newConfig) {
        if (lib.isEmpty(newConfig)) {
            return;
        }
        try {
            let typeConfig = {};
            for (const n in newConfig) {
                if (n.includes(".")) {
                    let type = n.slice(0, n.indexOf("."));
                    let key = n.slice(n.indexOf(".") + 1);
                    if (type && key) {
                        !typeConfig[type] && (typeConfig[type] = {});
                        if (lib.isJSONStr(newConfig[n])) {
                            typeConfig[type][key] = JSON.parse(newConfig[n]);
                        } else {
                            typeConfig[type][key] = newConfig[n];
                        }
                    }
                } else {
                    !typeConfig["config"] && (typeConfig["config"] = {});
                    if (lib.isJSONStr(newConfig[n])) {
                        typeConfig["config"][n] = JSON.parse(newConfig[n]);
                    } else {
                        typeConfig["config"][n] = newConfig[n];
                    }
                }
            }
            let appConfigs = {};
            if (app.setMap) {
                appConfigs = app.getMap("configs") || {};
                appConfigs = lib.extend(appConfigs, typeConfig, true);
                app.setMap("configs", appConfigs);
            } else if (app._caches.configs) {
                appConfigs = app._caches.configs || {};
                appConfigs = lib.extend(appConfigs, typeConfig, true);
                app._caches.configs = appConfigs;
            }
        } catch (err) {
            logger.error(err.stack || err);
        }
    }

    /**
     *
     *
     * @param {*} opt
     * @param {*} app
     */
    const initApolo = async function (opt, app) {
        // Instantiate Apollo
        const apolloClient = apollo(opt).namespace(opt.namespace, 'JSON');

        if (opt.enableUpdateNotification) {
            apolloClient.on('change', ({
                key,
                oldValue,
                newValue
            }) => {
                logger.info(`Apollo configuration key ${key} has been refreshed.`);
                reFreshConfig({ [key]: newValue });
            });
        }

        const ns = await apolloClient.ready().catch(err => {
            return Promise.reject(err);
        });
        logger.info('Apollo configuration center initialization is complete.');
        const apolloConfigs = await ns.config() || {};
        if (!lib.isEmpty(apolloConfigs)) {
            reFreshConfig(apolloConfigs);
        }

        return apolloClient;
    }
    // app.once('appReady', async () => {
    //     const client = await initApolo(options, app);
    //     lib.define(app, "apolloClient", client, true);
    // });

    const client = await initApolo(options, app);
    lib.define(app, "apolloClient", client, true);

    return async function (ctx, next) {
        if (!app.apolloClient || !app.apolloClient._ready) {
            const client = await initApolo(options, app);
            lib.define(app, "apolloClient", client, true);
        }
        return next();
    };
};