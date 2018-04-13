var MGlobalConfig;
(function (MGlobalConfig) {
    var GlobalConfigManager = (function () {
        function GlobalConfigManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        GlobalConfigManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        GlobalConfigManager.prototype.query = function (qobj, callback) {
            var msg = new ApiHeader.APIQueryGlobalConfigMsg();
            msg.count = qobj.count === true;
            msg.start = qobj.start;
            msg.limit = qobj.limit;
            msg.replyWithCount = true;
            msg.conditions = qobj.conditions ? qobj.conditions : [];
            if (Utils.notNullnotUndefined(this.sortBy) && this.sortBy.isValid()) {
                msg.sortBy = this.sortBy.field;
                msg.sortDirection = this.sortBy.direction;
            }
            this.api.syncApi(msg, function (ret) {
                callback(ret.inventories, ret.total);
            });
        };
        GlobalConfigManager.prototype.update = function (config, done) {
            var msg = new ApiHeader.APIUpdateGlobalConfigMsg();
            msg.name = config.name;
            msg.category = config.category;
            msg.value = config.value;
            this.api.asyncApi(msg, function (ret) {
                if (Utils.notNullnotUndefined(done)) {
                    done(ret.inventory);
                }
            });
        };
        return GlobalConfigManager;
    }());
    GlobalConfigManager.$inject = ['Api', '$rootScope'];
    MGlobalConfig.GlobalConfigManager = GlobalConfigManager;
    var GlobalConfigModel = (function (_super) {
        __extends(GlobalConfigModel, _super);
        function GlobalConfigModel() {
            var _this = _super.call(this) || this;
            _this.current = null;
            return _this;
        }
        return GlobalConfigModel;
    }(Utils.Model));
    MGlobalConfig.GlobalConfigModel = GlobalConfigModel;
    var OGlobalConfigGrid = (function (_super) {
        __extends(OGlobalConfigGrid, _super);
        function OGlobalConfigGrid($scope, globalConfigMgr) {
            var _this = _super.call(this) || this;
            _this.globalConfigMgr = globalConfigMgr;
            _super.prototype.init.call(_this, $scope, $scope.globalConfigGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"globalConfig.ts.NAME" | translate}}',
                    width: '20%'
                },
                {
                    field: 'category',
                    title: '{{"globalConfig.ts.CATEGORY" | translate}}',
                    width: '20%'
                },
                {
                    field: 'description',
                    title: '{{"globalConfig.ts.DESCRIPTION" | translate}}',
                    width: '40%'
                },
                {
                    field: 'value',
                    title: '{{"globalConfig.ts.VALUE" | translate}}',
                    width: '20%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                globalConfigMgr.query(qobj, function (configs, total) {
                    options.success({
                        data: configs,
                        total: total
                    });
                });
            };
            _this.options.dataSource.pageSize(30);
            return _this;
        }
        return OGlobalConfigGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, globalConfigMgr) {
            this.$scope = $scope;
            this.globalConfigMgr = globalConfigMgr;
        }
        Action.prototype.edit = function () {
            this.$scope.editGlobalConfigWin.open();
        };
        return Action;
    }());
    var FilterBy = (function () {
        function FilterBy($scope, categories) {
            var _this = this;
            this.$scope = $scope;
            this.categories = categories;
            this.fieldList = {
                dataSource: new kendo.data.DataSource({
                    data: [
                        {
                            name: '{{"globalConfig.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"globalConfig.ts.Category" | translate}}',
                            value: FilterBy.CATEGORY
                        }
                    ]
                }),
                dataTextField: 'name',
                dataValueField: 'value'
            };
            this.valueList = {
                dataSource: new kendo.data.DataSource({
                    data: []
                })
            };
            this.field = FilterBy.NONE;
            $scope.$watch(function () {
                return _this.field;
            }, function () {
                if (_this.isFieldNone()) {
                    _this.valueList.dataSource.data([]);
                }
                else if (_this.field == FilterBy.CATEGORY) {
                    _this.valueList.dataSource.data(_this.categories);
                }
            });
        }
        FilterBy.prototype.isFieldNone = function () {
            return this.field == FilterBy.NONE;
        };
        FilterBy.prototype.confirm = function (popover) {
            this.$scope.oGlobalConfigGrid.setFilter(this.toKendoFilter());
            this.name = this.isFieldNone() ? null : Utils.sprintf('{0}:{1}', this.field, this.value);
            popover.toggle();
        };
        FilterBy.prototype.open = function (popover) {
            popover.toggle();
        };
        FilterBy.prototype.isValueListDisabled = function () {
            return !Utils.notNullnotUndefined(this.value);
        };
        FilterBy.prototype.getButtonName = function () {
            return this.name;
        };
        FilterBy.prototype.toKendoFilter = function () {
            if (this.isFieldNone()) {
                return null;
            }
            return {
                field: this.field,
                operator: 'eq',
                value: this.value
            };
        };
        return FilterBy;
    }());
    FilterBy.NONE = 'none';
    FilterBy.CATEGORY = 'category';
    var DetailsController = (function () {
        function DetailsController($scope, gMgr, $routeParams, current) {
            var _this = this;
            this.$scope = $scope;
            this.gMgr = gMgr;
            this.$routeParams = $routeParams;
            $scope.model = new GlobalConfigModel();
            $scope.model.current = current;
            $scope.action = new Action($scope, gMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.editGlobalConfigOptions = {
                config: current,
                done: function (inv) {
                    $scope.model.current = inv;
                }
            };
        }
        DetailsController.prototype.loadSelf = function (current) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.conditions = [
                {
                    name: 'category',
                    op: '=',
                    value: current.category
                },
                {
                    name: 'name',
                    op: '=',
                    value: current.name
                }
            ];
            this.gMgr.query(qobj, function (globalConfigs, total) {
                _this.$scope.model.current = globalConfigs[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'GlobalConfigManager', '$routeParams', 'current'];
    MGlobalConfig.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, gMgr, configs, $location) {
            this.$scope = $scope;
            this.gMgr = gMgr;
            this.configs = configs;
            this.$location = $location;
            $scope.model = new GlobalConfigModel();
            $scope.oGlobalConfigGrid = new OGlobalConfigGrid($scope, gMgr);
            $scope.action = new Action($scope, gMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"globalConfig.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"globalConfig.ts.Category" | translate}}',
                        value: 'category'
                    },
                    {
                        name: '{{"globalConfig.ts.Description" | translate}}',
                        value: 'description'
                    }
                ],
                done: function (ret) {
                    gMgr.setSortBy(ret);
                    $scope.oGlobalConfigGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.GlobalConfigInventoryQueryable,
                name: 'GlobalConfig',
                schema: {
                    createDate: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_TIMESTAMP
                    },
                    lastOpDate: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_TIMESTAMP
                    }
                },
                done: function (ret) {
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = ret;
                    gMgr.query(qobj, function (configs, total) {
                        $scope.oGlobalConfigGrid.refresh(configs);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/globalConfig/{0}/{1}', $scope.model.current.category, $scope.model.current.name);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            var categories = {};
            angular.forEach(configs, function (it) {
                categories[it.category] = it;
            });
            var categoryNames = [];
            for (var k in categories) {
                categoryNames.push(k);
            }
            $scope.filterBy = new FilterBy($scope, categoryNames);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcRefresh = function () {
                $scope.oGlobalConfigGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return !Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.editGlobalConfigOptions = {
                config: null,
                done: function () {
                    $scope.oGlobalConfigGrid.refresh();
                }
            };
            $scope.$watch(function () {
                return $scope.model.current;
            }, function () {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    $scope.editGlobalConfigOptions.config = $scope.model.current;
                }
            });
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'GlobalConfigManager', 'configs', '$location'];
    MGlobalConfig.Controller = Controller;
    var EditGlobalConfig = (function () {
        function EditGlobalConfig(gMgr) {
            var _this = this;
            this.gMgr = gMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/globalConfig/editGlobalConfig.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zEditGlobalConfig] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.name = null;
                $scope.category = null;
                $scope.currentValue = null;
                $scope.newValue = null;
                $scope.canProceed = function () {
                    return Utils.notNullnotUndefined($scope.newValue) && $scope.newValue != $scope.currentValue;
                };
                $scope.cancel = function () {
                    $scope.editGlobalConfig__.close();
                };
                $scope.done = function () {
                    gMgr.update({
                        name: $scope.name,
                        category: $scope.category,
                        value: $scope.newValue
                    }, function (inv) {
                        if (Utils.notNullnotUndefined(_this.options.done)) {
                            _this.options.done(inv);
                        }
                    });
                    $scope.editGlobalConfig__.close();
                };
                _this.$scope = $scope;
                $scope.editGlobalConfigOptions__ = {
                    width: '550px'
                };
            };
        }
        EditGlobalConfig.prototype.open = function () {
            this.$scope.name = this.options.config.name;
            this.$scope.category = this.options.config.category;
            this.$scope.currentValue = this.options.config.value;
            this.$scope.newValue = this.options.config.value;
            this.$scope.editGlobalConfig__.center();
            this.$scope.editGlobalConfig__.open();
        };
        return EditGlobalConfig;
    }());
    MGlobalConfig.EditGlobalConfig = EditGlobalConfig;
})(MGlobalConfig || (MGlobalConfig = {}));
angular.module('root').factory('GlobalConfigManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MGlobalConfig.GlobalConfigManager(api, $rootScope);
}]).directive('zEditGlobalConfig', ['GlobalConfigManager', function (gMgr) {
    return new MGlobalConfig.EditGlobalConfig(gMgr);
}]).config(['$routeProvider', function (route) {
    route.when('/globalConfig', {
        templateUrl: '/static/templates/globalConfig/globalConfig.html',
        controller: 'MGlobalConfig.Controller',
        resolve: {
            configs: function ($q, GlobalConfigManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                GlobalConfigManager.query(qobj, function (configs) {
                    defer.resolve(configs);
                });
                return defer.promise;
            }
        }
    }).when('/globalConfig/:category/:name', {
        templateUrl: '/static/templates/globalConfig/details.html',
        controller: 'MGlobalConfig.DetailsController',
        resolve: {
            current: function ($q, $route, GlobalConfigManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var category = $route.current.params.category;
                var name = $route.current.params.name;
                qobj.conditions = [{
                    name: 'category',
                    op: '=',
                    value: category
                }, {
                    name: 'name',
                    op: '=',
                    value: name
                }];
                GlobalConfigManager.query(qobj, function (globalConfigs) {
                    var globalConfig = globalConfigs[0];
                    defer.resolve(globalConfig);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />
/// <reference path="d.ts/sprintf.d.ts" />