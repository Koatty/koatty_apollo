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
    // cachePath: process.env.APP_PATH + "/config/"
};

module.exports = function (options, app) {
    options = options ? lib.extend(defaultOptions, options, true) : defaultOptions;

    /**
     * 
     *
     * @param {*} key
     * @param {*} newConfig
     * @returns
     */
    const reFreshConfig = function (key, newConfig) {
        if (lib.isEmpty(newConfig)) {
            return;
        }
        let appConfig = app.config(undefined, key);
        appConfig = Object.assign(appConfig, newConfig);
        if (app.setMap) {
            app.setMap(key, appConfig)
        } else if (app._caches.configs) {
            !app._caches.configs[key] && (app._caches.configs[key] = {});
            app._caches.configs[key] = appConfig;
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
                logger.info(`Apollo configuration key ${key} has been refreshed. the new values is ${newValue}`);
                reFreshConfig(opt.config_key, { [key]: newValue });
            });
        }

        const ns = await apolloClient.ready().catch(err => {
            return Promise.reject(err);
        });
        logger.info('Apollo configuration center initialization is complete.');
        const apolloConfigs = await ns.config() || {};
        if (!lib.isEmpty(apolloConfigs)) {
            reFreshConfig(opt.config_key, apolloConfigs);
        }
    }
    app.once('appReady', async () => {
        await initApolo(options, app);
    });

    return function (ctx, next) {
        return next();
    };
};