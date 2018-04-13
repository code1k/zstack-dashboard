var MInstanceOffering;
(function (MInstanceOffering) {
    var InstanceOffering = (function (_super) {
        __extends(InstanceOffering, _super);
        function InstanceOffering() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        InstanceOffering.prototype.progressOn = function () {
            this.inProgress = true;
        };
        InstanceOffering.prototype.progressOff = function () {
            this.inProgress = false;
        };
        InstanceOffering.prototype.isInProgress = function () {
            return this.inProgress;
        };
        InstanceOffering.prototype.isEnableShow = function () {
            return this.state == 'Disabled';
        };
        InstanceOffering.prototype.isDisableShow = function () {
            return this.state == 'Enabled';
        };
        InstanceOffering.prototype.stateLabel = function () {
            if (this.state == 'Enabled') {
                return 'label label-success';
            }
            else if (this.state == 'Disabled') {
                return 'label label-danger';
            }
            else {
                return 'label label-default';
            }
        };
        InstanceOffering.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('state', inv.state);
            self.set('cpuNum', inv.cpuNum);
            self.set('cpuSpeed', inv.cpuSpeed);
            self.set('memorySize', inv.memorySize);
            self.set('allocatorStrategy', inv.allocatorStrategy);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        return InstanceOffering;
    }(ApiHeader.InstanceOfferingInventory));
    MInstanceOffering.InstanceOffering = InstanceOffering;
    var InstanceOfferingManager = (function () {
        function InstanceOfferingManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        InstanceOfferingManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        InstanceOfferingManager.prototype.wrap = function (InstanceOffering) {
            return new kendo.data.ObservableObject(InstanceOffering);
        };
        InstanceOfferingManager.prototype.create = function (instanceOffering, done) {
            var _this = this;
            var msg = new ApiHeader.APICreateInstanceOfferingMsg();
            msg.name = instanceOffering.name;
            msg.description = instanceOffering.description;
            msg.cpuNum = instanceOffering.cpuNum;
            msg.cpuSpeed = 1;
            msg.memorySize = instanceOffering.memorySize;
            msg.allocatorStrategy = instanceOffering.allocatorStrategy;
            this.api.asyncApi(msg, function (ret) {
                var c = new InstanceOffering();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Added new Instance Offering: {0}', c.name),
                    link: Utils.sprintf('/#/instanceOffering/{0}', c.uuid)
                });
            });
        };
        InstanceOfferingManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryInstanceOfferingMsg();
            msg.count = qobj.count === true;
            msg.start = qobj.start;
            msg.limit = qobj.limit;
            msg.replyWithCount = true;
            msg.conditions = qobj.conditions ? qobj.conditions : [];
            if (Utils.notNullnotUndefined(this.sortBy) && this.sortBy.isValid()) {
                msg.sortBy = this.sortBy.field;
                msg.sortDirection = this.sortBy.direction;
            }
            msg.conditions.push({
                name: 'type',
                op: '=',
                value: 'UserVm'
            });
            this.api.syncApi(msg, function (ret) {
                var pris = [];
                ret.inventories.forEach(function (inv) {
                    var c = new InstanceOffering();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        InstanceOfferingManager.prototype.disable = function (instanceOffering) {
            var _this = this;
            instanceOffering.progressOn();
            var msg = new ApiHeader.APIChangeInstanceOfferingStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = instanceOffering.uuid;
            this.api.asyncApi(msg, function (ret) {
                instanceOffering.updateObservableObject(ret.inventory);
                instanceOffering.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled Instance Offering: {0}', instanceOffering.name),
                    link: Utils.sprintf('/#/instanceOffering/{0}', instanceOffering.uuid)
                });
            });
        };
        InstanceOfferingManager.prototype.enable = function (instanceOffering) {
            var _this = this;
            instanceOffering.progressOn();
            var msg = new ApiHeader.APIChangeInstanceOfferingStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = instanceOffering.uuid;
            this.api.asyncApi(msg, function (ret) {
                instanceOffering.updateObservableObject(ret.inventory);
                instanceOffering.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled Instance Offering: {0}', instanceOffering.name),
                    link: Utils.sprintf('/#/instanceOffering/{0}', instanceOffering.uuid)
                });
            });
        };
        InstanceOfferingManager.prototype["delete"] = function (instanceOffering, done) {
            var _this = this;
            instanceOffering.progressOn();
            var msg = new ApiHeader.APIDeleteInstanceOfferingMsg();
            msg.uuid = instanceOffering.uuid;
            this.api.asyncApi(msg, function (ret) {
                instanceOffering.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted Instance Offering: {0}', instanceOffering.name)
                });
            });
        };
        return InstanceOfferingManager;
    }());
    InstanceOfferingManager.$inject = ['Api', '$rootScope'];
    MInstanceOffering.InstanceOfferingManager = InstanceOfferingManager;
    var InstanceOfferingModel = (function (_super) {
        __extends(InstanceOfferingModel, _super);
        function InstanceOfferingModel() {
            var _this = _super.call(this) || this;
            _this.current = new InstanceOffering();
            return _this;
        }
        return InstanceOfferingModel;
    }(Utils.Model));
    MInstanceOffering.InstanceOfferingModel = InstanceOfferingModel;
    var OInstanceOfferingGrid = (function (_super) {
        __extends(OInstanceOfferingGrid, _super);
        function OInstanceOfferingGrid($scope, instanceOfferingMgr) {
            var _this = _super.call(this) || this;
            _this.instanceOfferingMgr = instanceOfferingMgr;
            _super.prototype.init.call(_this, $scope, $scope.instanceOfferingGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"instanceOffering.ts.NAME" | translate}}',
                    width: '10%',
                    template: '<a href="/\\#/instanceOffering/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'description',
                    title: '{{"instanceOffering.ts.DESCRIPTION" | translate}}',
                    width: '20%'
                },
                {
                    field: 'cpuNum',
                    title: '{{"instanceOffering.ts.CPU NUMBER" | translate}}',
                    width: '10%'
                },
                {
                    field: 'memorySize',
                    title: '{{"instanceOffering.ts.MEMORY" | translate}}',
                    width: '15%',
                    template: '<span>{{dataItem.memorySize | size}}</span>'
                },
                {
                    field: 'state',
                    title: '{{"instanceOffering.ts.STATE" | translate}}',
                    width: '15%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'uuid',
                    title: '{{"instanceOffering.ts.UUID" | translate}}',
                    width: '20%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                instanceOfferingMgr.query(qobj, function (instanceOfferings, total) {
                    options.success({
                        data: instanceOfferings,
                        total: total
                    });
                });
            };
            return _this;
        }
        return OInstanceOfferingGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, instanceOfferingMgr) {
            this.$scope = $scope;
            this.instanceOfferingMgr = instanceOfferingMgr;
        }
        Action.prototype.enable = function () {
            this.instanceOfferingMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.instanceOfferingMgr.disable(this.$scope.model.current);
        };
        return Action;
    }());
    var FilterBy = (function () {
        function FilterBy($scope, hypervisorTypes) {
            var _this = this;
            this.$scope = $scope;
            this.hypervisorTypes = hypervisorTypes;
            this.fieldList = {
                dataSource: new kendo.data.DataSource({
                    data: [
                        {
                            name: '{{"instanceOffering.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"instanceOffering.ts.State" | translate}}',
                            value: FilterBy.STATE
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
                if (_this.field == FilterBy.NONE) {
                    _this.valueList.dataSource.data([]);
                    _this.value = null;
                }
                else if (_this.field == FilterBy.STATE) {
                    _this.valueList.dataSource.data(['Enabled', 'Disabled']);
                }
            });
        }
        FilterBy.prototype.confirm = function (popover) {
            this.$scope.oInstanceOfferingGrid.setFilter(this.toKendoFilter());
            this.name = !Utils.notNullnotUndefined(this.value) ? null : Utils.sprintf('{0}:{1}', this.field, this.value);
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
            if (!Utils.notNullnotUndefined(this.value)) {
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
    FilterBy.STATE = 'state';
    var DetailsController = (function () {
        function DetailsController($scope, instanceOfferingMgr, $routeParams, tagService, current) {
            var _this = this;
            this.$scope = $scope;
            this.instanceOfferingMgr = instanceOfferingMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            $scope.model = new InstanceOfferingModel();
            $scope.model.current = current;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, instanceOfferingMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteInstanceOffering = {
                title: 'DELETE INSTANCE OFFERING',
                btnType: 'btn-danger',
                width: '350px',
                description: function () {
                    return current.name;
                },
                confirm: function () {
                    instanceOfferingMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeInstanceOfferingVO, function (ret) {
                        angular.forEach($scope.optionsTag.tags, function (it) {
                            if (it.tag === item.tag) {
                                angular.extend(it, ret);
                            }
                        });
                    });
                },
                deleteTag: function (item) {
                    _this.tagService.deleteTag(item.uuid);
                },
                isShow: function () {
                    return Utils.notNullnotUndefined($scope.model.current);
                }
            };
            this.tagService.queryTag($scope.model.current.uuid, function (tags) {
                $scope.optionsTag.tags = tags;
            });
        }
        DetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.instanceOfferingMgr.query(qobj, function (instanceOfferings, total) {
                _this.$scope.model.current = instanceOfferings[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'InstanceOfferingManager', '$routeParams', 'Tag', 'current'];
    MInstanceOffering.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, instanceOfferingMgr, hypervisorTypes, $location) {
            this.$scope = $scope;
            this.instanceOfferingMgr = instanceOfferingMgr;
            this.hypervisorTypes = hypervisorTypes;
            this.$location = $location;
            $scope.model = new InstanceOfferingModel();
            $scope.oInstanceOfferingGrid = new OInstanceOfferingGrid($scope, instanceOfferingMgr);
            $scope.action = new Action($scope, instanceOfferingMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"instanceOffering.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"instanceOffering.ts.Description" | translate}}',
                        value: 'description'
                    },
                    {
                        name: '{{"instanceOffering.ts.CPU Number" | translate}}',
                        value: 'cpuNum'
                    },
                    {
                        name: '{{"instanceOffering.ts.Memory" | translate}}',
                        value: 'memorySize'
                    },
                    {
                        name: '{{"instanceOffering.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"instanceOffering.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"instanceOffering.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    instanceOfferingMgr.setSortBy(ret);
                    $scope.oInstanceOfferingGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.InstanceOfferingInventoryQueryable,
                name: 'InstanceOffering',
                schema: {
                    state: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['Enabled', 'Disabled']
                    },
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
                    instanceOfferingMgr.query(qobj, function (InstanceOfferings, total) {
                        $scope.oInstanceOfferingGrid.refresh(InstanceOfferings);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/instanceOffering/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope, this.hypervisorTypes);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateInstanceOffering = function (win) {
                win.open();
            };
            $scope.funcDeleteInstanceOffering = function () {
                $scope.deleteInstanceOffering.open();
            };
            $scope.optionsDeleteInstanceOffering = {
                title: 'DELETE INSTANCE OFFERING',
                btnType: 'btn-danger',
                width: '350px',
                description: function () {
                    return $scope.model.current.name;
                },
                confirm: function () {
                    instanceOfferingMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oInstanceOfferingGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oInstanceOfferingGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateInstanceOffering = {
                done: function (instanceOffering) {
                    $scope.oInstanceOfferingGrid.add(instanceOffering);
                }
            };
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'InstanceOfferingManager', 'hypervisorTypes', '$location'];
    MInstanceOffering.Controller = Controller;
    var CreateInstanceOfferingOptions = (function () {
        function CreateInstanceOfferingOptions() {
        }
        return CreateInstanceOfferingOptions;
    }());
    MInstanceOffering.CreateInstanceOfferingOptions = CreateInstanceOfferingOptions;
    var CreateInstanceOfferingModel = (function () {
        function CreateInstanceOfferingModel() {
        }
        CreateInstanceOfferingModel.prototype.canCreate = function () {
            return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.cpuNum) &&
                Utils.notNullnotUndefined(this.memorySize);
        };
        return CreateInstanceOfferingModel;
    }());
    MInstanceOffering.CreateInstanceOfferingModel = CreateInstanceOfferingModel;
    var CreateInstanceOffering = (function () {
        function CreateInstanceOffering(api, instanceOfferingMgr) {
            var _this = this;
            this.api = api;
            this.instanceOfferingMgr = instanceOfferingMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateInstanceOffering;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new CreateInstanceOfferingOptions();
                var optionName = $attrs.zOptions;
                if (angular.isDefined(optionName)) {
                    _this.options = parentScope[optionName];
                    $scope.$watch(function () {
                        return parentScope[optionName];
                    }, function () {
                        _this.options = parentScope[optionName];
                    });
                }
                var infoPage = $scope.infoPage = {
                    activeState: true,
                    name: null,
                    description: null,
                    memorySize: null,
                    cpuNum: null,
                    allocatorStrategy: null,
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.memorySize) && Utils.notNullnotUndefined(this.cpuNum)
                            && this.isCpuNumValid() && this.isMemoryValid();
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createInstanceOfferingInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createInstanceOfferingInfo';
                    },
                    isCpuNumValid: function () {
                        if (Utils.notNullnotUndefinedNotEmptyString(this.cpuNum)) {
                            return !isNaN(this.cpuNum);
                        }
                        return true;
                    },
                    isMemoryValid: function () {
                        if (Utils.notNullnotUndefinedNotEmptyString(this.memorySize)) {
                            return Utils.isValidSizeStr(this.memorySize);
                        }
                        return true;
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('ioffering');
                        this.memorySize = null;
                        this.cpuNum = null;
                        this.allocatorStrategy = null;
                        this.description = null;
                        this.activeState = false;
                    }
                };
                var mediator = $scope.mediator = {
                    currentPage: infoPage,
                    movedToPage: function (page) {
                        $scope.mediator.currentPage = page;
                    },
                    finishButtonName: function () {
                        return "Create";
                    },
                    finish: function () {
                        var resultInstanceOffering;
                        var chain = new Utils.Chain();
                        chain.then(function () {
                            if (Utils.notNullnotUndefined($scope.infoPage.allocatorStrategy) && $scope.infoPage.allocatorStrategy == "") {
                                $scope.infoPage.allocatorStrategy = null;
                            }
                            $scope.infoPage.memorySize = Utils.parseSize($scope.infoPage.memorySize);
                            instanceOfferingMgr.create(infoPage, function (ret) {
                                resultInstanceOffering = ret;
                                chain.next();
                            });
                        }).done(function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(resultInstanceOffering);
                            }
                            $scope.winCreateInstanceOffering__.close();
                        }).start();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage
                ], mediator);
                $scope.winCreateInstanceOfferingOptions__ = {
                    width: '700px',
                    //height: '620px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.allocatorStrategyOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] })
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/instanceOffering/addInstanceOffering.html';
        }
        CreateInstanceOffering.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateInstanceOffering__;
            this.$scope.button.reset();
            this.api.getInstanceOfferingAllocatorStrategies(function (ret) {
                ret.unshift("");
                _this.$scope.allocatorStrategyOptions__.dataSource.data(ret);
                win.center();
                win.open();
            });
        };
        return CreateInstanceOffering;
    }());
    MInstanceOffering.CreateInstanceOffering = CreateInstanceOffering;
})(MInstanceOffering || (MInstanceOffering = {}));
angular.module('root').factory('InstanceOfferingManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MInstanceOffering.InstanceOfferingManager(api, $rootScope);
}]).directive('zCreateInstanceOffering', ['Api', 'InstanceOfferingManager', function (api, instanceOfferingMgr) {
    return new MInstanceOffering.CreateInstanceOffering(api, instanceOfferingMgr);
}]).config(['$routeProvider', function (route) {
    route.when('/instanceOffering', {
        templateUrl: '/static/templates/instanceOffering/instanceOffering.html',
        controller: 'MInstanceOffering.Controller',
        resolve: {
            hypervisorTypes: function ($q, Api) {
                var defer = $q.defer();
                Api.getHypervisorTypes(function (hypervisorTypes) {
                    defer.resolve(hypervisorTypes);
                });
                return defer.promise;
            }
        }
    }).when('/instanceOffering/:uuid', {
        templateUrl: '/static/templates/instanceOffering/details.html',
        controller: 'MInstanceOffering.DetailsController',
        resolve: {
            current: function ($q, $route, InstanceOfferingManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var uuid = $route.current.params.uuid;
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                InstanceOfferingManager.query(qobj, function (instanceOfferings) {
                    var instanceOffering = instanceOfferings[0];
                    defer.resolve(instanceOffering);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />