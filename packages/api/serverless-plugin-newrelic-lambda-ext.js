'use strict';
exports.__esModule = true;
var NewRelicLambdaExtPlugin = /** @class */ (function () {
    function NewRelicLambdaExtPlugin(serverless) {
        var _this = this;
        this.serverless = serverless;
        this.hooks = {
            initialize: function () { return _this.init(); },
            'before:package:createDeploymentArtifacts': function () { return _this.beforePackage(); }
        };
    }
    NewRelicLambdaExtPlugin.prototype.init = function () {};

    NewRelicLambdaExtPlugin.prototype.beforePackage = function () {
        this.serverless.cli.log('Replacing function handlers with New Relic layer');
        var funcs = this.serverless.service.functions;
        for (var _i = 0, _a = Object.keys(funcs); _i < _a.length; _i++) {
            var funcName = _a[_i];
            var funcDef = funcs[funcName];
            funcDef.environment = {};
            // @ts-ignore
            funcDef.environment.NEW_RELIC_LAMBDA_HANDLER = funcDef.handler;
            // @ts-ignore
            funcDef.handler = 'newrelic-lambda-wrapper.handler';
        }
    };
    return NewRelicLambdaExtPlugin;
}());
module.exports = NewRelicLambdaExtPlugin;