var MDiskOffering;
(function (MDiskOffering) {
    var DiskOffering = (function (_super) {
        __extends(DiskOffering, _super);
        function DiskOffering() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DiskOffering.prototype.progressOn = function () {
            this.inProgress = true;
        };
        DiskOffering.prototype.progressOff = function () {
            this.inProgress = false;
        };
        DiskOffering.prototype.isInProgress = function () {
            return this.inProgress;
        };
        DiskOffering.prototype.isEnableShow = function () {
            return this.state == 'Disabled';
        };
        DiskOffering.prototype.isDisableShow = function () {
            return this.state == 'Enabled';
        };
        DiskOffering.prototype.stateLabel = function () {
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
        DiskOffering.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('state', inv.state);
            self.set('diskSize', inv.diskSize);
            self.set('allocatorStrategy', inv.allocatorStrategy);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        return DiskOffering;
    }(ApiHeader.DiskOfferingInventory));
    MDiskOffering.DiskOffering = DiskOffering;
    var DiskOfferingManager = (function () {
        function DiskOfferingManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        DiskOfferingManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        DiskOfferingManager.prototype.wrap = function (DiskOffering) {
            return new kendo.data.ObservableObject(DiskOffering);
        };
        DiskOfferingManager.prototype.create = function (diskOffering, done) {
            var _this = this;
            var msg = new ApiHeader.APICreateDiskOfferingMsg();
            msg.name = diskOffering.name;
            msg.description = diskOffering.description;
            msg.diskSize = diskOffering.diskSize;
            msg.allocatorStrategy = diskOffering.allocatorStrategy;
            this.api.asyncApi(msg, function (ret) {
                var c = new DiskOffering();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Added new Disk Offering: {0}', c.name),
                    link: Utils.sprintf('/#/diskOffering/{0}', c.uuid)
                });
            });
        };
        DiskOfferingManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryDiskOfferingMsg();
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
                var pris = [];
                ret.inventories.forEach(function (inv) {
                    var c = new DiskOffering();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        DiskOfferingManager.prototype.disable = function (diskOffering) {
            var _this = this;
            diskOffering.progressOn();
            var msg = new ApiHeader.APIChangeDiskOfferingStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = diskOffering.uuid;
            this.api.asyncApi(msg, function (ret) {
                diskOffering.updateObservableObject(ret.inventory);
                diskOffering.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled Disk Offering: {0}', diskOffering.name),
                    link: Utils.sprintf('/#/diskOffering/{0}', diskOffering.uuid)
                });
            });
        };
        DiskOfferingManager.prototype.enable = function (diskOffering) {
            var _this = this;
            diskOffering.progressOn();
            var msg = new ApiHeader.APIChangeDiskOfferingStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = diskOffering.uuid;
            this.api.asyncApi(msg, function (ret) {
                diskOffering.updateObservableObject(ret.inventory);
                diskOffering.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled Disk Offering: {0}', diskOffering.name),
                    link: Utils.sprintf('/#/diskOffering/{0}', diskOffering.uuid)
                });
            });
        };
        DiskOfferingManager.prototype["delete"] = function (diskOffering, done) {
            var _this = this;
            diskOffering.progressOn();
            var msg = new ApiHeader.APIDeleteDiskOfferingMsg();
            msg.uuid = diskOffering.uuid;
            this.api.asyncApi(msg, function (ret) {
                diskOffering.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted Disk Offering: {0}', diskOffering.name)
                });
            });
        };
        return DiskOfferingManager;
    }());
    DiskOfferingManager.$inject = ['Api', '$rootScope'];
    MDiskOffering.DiskOfferingManager = DiskOfferingManager;
    var DiskOfferingModel = (function (_super) {
        __extends(DiskOfferingModel, _super);
        function DiskOfferingModel() {
            var _this = _super.call(this) || this;
            _this.current = new DiskOffering();
            return _this;
        }
        return DiskOfferingModel;
    }(Utils.Model));
    MDiskOffering.DiskOfferingModel = DiskOfferingModel;
    var ODiskOfferingGrid = (function (_super) {
        __extends(ODiskOfferingGrid, _super);
        function ODiskOfferingGrid($scope, diskOfferingMgr) {
            var _this = _super.call(this) || this;
            _this.diskOfferingMgr = diskOfferingMgr;
            _super.prototype.init.call(_this, $scope, $scope.diskOfferingGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"diskOffering.ts.NAME" | translate}}',
                    width: '20%',
                    template: '<a href="/\\#/diskOffering/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'description',
                    title: '{{"diskOffering.ts.DESCRIPTION" | translate}}',
                    width: '20%'
                },
                {
                    field: 'diskSize',
                    title: '{{"diskOffering.ts.DISK SIZE" | translate}}',
                    width: '20%',
                    template: '<span>{{dataItem.diskSize | size}}</span>'
                },
                {
                    field: 'state',
                    title: '{{"diskOffering.ts.STATE" | translate}}',
                    width: '20%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'uuid',
                    title: '{{"diskOffering.ts.UUID" | translate}}',
                    width: '20%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                diskOfferingMgr.query(qobj, function (diskOfferings, total) {
                    options.success({
                        data: diskOfferings,
                        total: total
                    });
                });
            };
            return _this;
        }
        return ODiskOfferingGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, diskOfferingMgr) {
            this.$scope = $scope;
            this.diskOfferingMgr = diskOfferingMgr;
        }
        Action.prototype.enable = function () {
            this.diskOfferingMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.diskOfferingMgr.disable(this.$scope.model.current);
        };
        return Action;
    }());
    var FilterBy = (function () {
        function FilterBy($scope) {
            var _this = this;
            this.$scope = $scope;
            this.fieldList = {
                dataSource: new kendo.data.DataSource({
                    data: [
                        {
                            name: '{{"diskOffering.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"diskOffering.ts.State" | translate}}',
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
            this.$scope.oDiskOfferingGrid.setFilter(this.toKendoFilter());
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
        function DetailsController($scope, diskOfferingMgr, $routeParams, tagService, current) {
            var _this = this;
            this.$scope = $scope;
            this.diskOfferingMgr = diskOfferingMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            $scope.model = new DiskOfferingModel();
            $scope.model.current = current;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, diskOfferingMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteDiskOffering = {
                title: 'DELETE DISK OFFERING',
                description: function () {
                    return current.name;
                },
                btnType: 'btn-danger',
                width: '350px',
                confirm: function () {
                    diskOfferingMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeDiskOfferingVO, function (ret) {
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
            this.diskOfferingMgr.query(qobj, function (diskOfferings, total) {
                _this.$scope.model.current = diskOfferings[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'DiskOfferingManager', '$routeParams', 'Tag', 'current'];
    MDiskOffering.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, diskOfferingMgr, $location) {
            this.$scope = $scope;
            this.diskOfferingMgr = diskOfferingMgr;
            this.$location = $location;
            $scope.model = new DiskOfferingModel();
            $scope.oDiskOfferingGrid = new ODiskOfferingGrid($scope, diskOfferingMgr);
            $scope.action = new Action($scope, diskOfferingMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"diskOffering.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"diskOffering.ts.Description" | translate}}',
                        value: 'description'
                    },
                    {
                        name: '{{"diskOffering.ts.Disk Size" | translate}}',
                        value: 'diskSize'
                    },
                    {
                        name: '{{"diskOffering.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"diskOffering.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"diskOffering.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    diskOfferingMgr.setSortBy(ret);
                    $scope.oDiskOfferingGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.DiskOfferingInventoryQueryable,
                name: 'DiskOffering',
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
                    diskOfferingMgr.query(qobj, function (DiskOfferings, total) {
                        $scope.oDiskOfferingGrid.refresh(DiskOfferings);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/diskOffering/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateDiskOffering = function (win) {
                win.open();
            };
            $scope.funcDeleteDiskOffering = function () {
                $scope.deleteDiskOffering.open();
            };
            $scope.optionsDeleteDiskOffering = {
                title: 'DELETE DISK OFFERING',
                description: function () {
                    return $scope.model.current.name;
                },
                btnType: 'btn-danger',
                width: '350px',
                confirm: function () {
                    diskOfferingMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oDiskOfferingGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oDiskOfferingGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateDiskOffering = {
                done: function (diskOffering) {
                    $scope.oDiskOfferingGrid.add(diskOffering);
                }
            };
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'DiskOfferingManager', '$location'];
    MDiskOffering.Controller = Controller;
    var CreateDiskOfferingOptions = (function () {
        function CreateDiskOfferingOptions() {
        }
        return CreateDiskOfferingOptions;
    }());
    MDiskOffering.CreateDiskOfferingOptions = CreateDiskOfferingOptions;
    var CreateDiskOfferingModel = (function () {
        function CreateDiskOfferingModel() {
        }
        CreateDiskOfferingModel.prototype.canCreate = function () {
            return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.diskSize);
        };
        return CreateDiskOfferingModel;
    }());
    MDiskOffering.CreateDiskOfferingModel = CreateDiskOfferingModel;
    var CreateDiskOffering = (function () {
        function CreateDiskOffering(api, diskOfferingMgr) {
            var _this = this;
            this.api = api;
            this.diskOfferingMgr = diskOfferingMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateDiskOffering;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new CreateDiskOfferingOptions();
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
                    diskSize: null,
                    allocatorStrategy: null,
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.diskSize);
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createDiskOfferingInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createDiskOfferingInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('diskOffering');
                        this.diskSize = null;
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
                        var resultDiskOffering;
                        var chain = new Utils.Chain();
                        chain.then(function () {
                            if (Utils.notNullnotUndefined($scope.infoPage.allocatorStrategy) && $scope.infoPage.allocatorStrategy == "") {
                                $scope.infoPage.allocatorStrategy = null;
                            }
                            $scope.infoPage.diskSize = Utils.parseSize($scope.infoPage.diskSize);
                            diskOfferingMgr.create(infoPage, function (ret) {
                                resultDiskOffering = ret;
                                chain.next();
                            });
                        }).done(function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(resultDiskOffering);
                            }
                        }).start();
                        $scope.winCreateDiskOffering__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage
                ], mediator);
                $scope.winCreateDiskOfferingOptions__ = {
                    width: '700px',
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
            this.templateUrl = '/static/templates/diskOffering/addDiskOffering.html';
        }
        CreateDiskOffering.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateDiskOffering__;
            this.$scope.button.reset();
            this.api.getDiskOfferingAllocatorStrategies(function (ret) {
                ret.unshift("");
                _this.$scope.allocatorStrategyOptions__.dataSource.data(ret);
                win.center();
                win.open();
            });
        };
        return CreateDiskOffering;
    }());
    MDiskOffering.CreateDiskOffering = CreateDiskOffering;
})(MDiskOffering || (MDiskOffering = {}));
angular.module('root').factory('DiskOfferingManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MDiskOffering.DiskOfferingManager(api, $rootScope);
}]).directive('zCreateDiskOffering', ['Api', 'DiskOfferingManager', function (api, diskOfferingMgr) {
    return new MDiskOffering.CreateDiskOffering(api, diskOfferingMgr);
}]).config(['$routeProvider', function (route) {
    route.when('/diskOffering', {
        templateUrl: '/static/templates/diskOffering/diskOffering.html',
        controller: 'MDiskOffering.Controller'
    }).when('/diskOffering/:uuid', {
        templateUrl: '/static/templates/diskOffering/details.html',
        controller: 'MDiskOffering.DetailsController',
        resolve: {
            current: function ($q, $route, DiskOfferingManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var uuid = $route.current.params.uuid;
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                DiskOfferingManager.query(qobj, function (diskOfferings) {
                    var diskOffering = diskOfferings[0];
                    defer.resolve(diskOffering);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />