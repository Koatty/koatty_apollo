/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2017 - <richenlin(at)gmail.com>
 * @license    MIT
 * @version    17/6/12
 */
const apollo = require('node-apollo-client')
const globby = require("globby");

/**
 * default options
 */
const defaultOptions = {
    config_path: process.env.APP_PATH + '/config', //project configs path
    apollo_server: 'http://127.0.0.18080', //your-config-server-url
    apollo_appid: { cache: true }, //your-config-appid
    apollo_cluster: 'default', //default to `default`
    apollo_namespaces: ['application'], //default to `['application']`, this is the namespaces that you want to use or maintain.
    initial_configs: true, //default to true
    apollo_listen_notify: 'default', //default to true
    apollo_fetch_interval: 5 * 60e3, //default to 5 minutes. can be customize but 30s or shorter time are not acceptable.
};

module.exports = function (options, app) {
    options = options ? lib.extend(defaultOptions, options, true) : defaultOptions;
    const apolloConifgs = {
        configServerUrl: options.apollo_server,
        appId: options.apollo_appid,
        cluster: options.apollo_cluster, // [optional] default to `default`
        listenOnNotification: options.apollo_listen_notify, // [optional] default to true
        fetchCacheInterval: options.apollo_fetch_interval, // [optional] default to 5 minutes. can be customize but 30s or shorter time are not acceptable.
    };
    if (options.initial_configs) {
        const fileResults = globby.sync(['**/**.js', '**/**.ts'], {
            cwd: options.config_path
        });
        apolloConifgs.namespaces = [];
        apolloConifgs.initialConfigs = {};
        for (let name of fileResults) {
            if (name.indexOf('/') > -1) {
                name = name.slice(name.lastIndexOf('/') + 1);
            }
            const fileName = name.slice(0, -3);
            apolloConifgs.namespaces.push(fileName);
            apolloConifgs.initialConfigs[fileName] = app.config(undefined, fileName);
        }
    }
    apolloConifgs.namespaces = [];
    apolloConifgs.initialConfigs = {
        application: {}
    };

    const initApolo = async function (opt, app) {
        // Instantiate Apollo
        const apolloClient = new apollo(opt);
        const ps = [];
        opt.apollo_namespaces.map(item => {
            ps.push(apolloClient.fetchConfigsFromCache(item).then(res => {
                if (app.setMap) {
                    app.setMap(item, res);
                } else if (app._caches.configs) {
                    app._caches.configs = res;
                }
            }));
        });
        return Promise.all(ps);
    }
    app.once('appReady', () => {
        initApolo();
    });

    return function (ctx, next) {
        return next();
    };
};