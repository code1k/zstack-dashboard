var MVip;
(function (MVip) {
    var Vip = (function (_super) {
        __extends(Vip, _super);
        function Vip() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Vip.prototype.progressOn = function () {
            this.inProgress = true;
        };
        Vip.prototype.progressOff = function () {
            this.inProgress = false;
        };
        Vip.prototype.isInProgress = function () {
            return this.inProgress;
        };
        Vip.prototype.isEnableShow = function () {
            return this.state == 'Disabled';
        };
        Vip.prototype.isDisableShow = function () {
            return this.state == 'Enabled';
        };
        Vip.prototype.stateLabel = function () {
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
        Vip.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('state', inv.state);
            self.set('ip', inv.ip);
            self.set('l3NetworkUuid', inv.l3NetworkUuid);
            self.set('netmask', inv.netmask);
            self.set('serviceProvider', inv.serviceProvider);
            self.set('peerL3NetworkUuid', inv.peerL3NetworkUuid);
            self.set('useFor', inv.useFor);
            self.set('gateway', inv.gateway);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        return Vip;
    }(ApiHeader.VipInventory));
    MVip.Vip = Vip;
    var VipManager = (function () {
        function VipManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        VipManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        VipManager.prototype.wrap = function (Vip) {
            return new kendo.data.ObservableObject(Vip);
        };
        VipManager.prototype.create = function (vip, done) {
            var _this = this;
            var msg = new ApiHeader.APICreateVipMsg();
            msg.name = vip.name;
            msg.description = vip.description;
            msg.l3NetworkUuid = vip.l3NetworkUuid;
            msg.allocatorStrategy = vip.allocatorStrategy;
            msg.requiredIp = vip.requiredIp;
            this.api.asyncApi(msg, function (ret) {
                var c = new Vip();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Created new VIP: {0}', c.name),
                    link: Utils.sprintf('/#/vip/{0}', c.uuid)
                });
            });
        };
        VipManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryVipMsg();
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
                    var c = new Vip();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        VipManager.prototype.disable = function (vip) {
            var _this = this;
            vip.progressOn();
            var msg = new ApiHeader.APIChangeVipStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = vip.uuid;
            this.api.asyncApi(msg, function (ret) {
                vip.updateObservableObject(ret.inventory);
                vip.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled VIP: {0}', vip.name),
                    link: Utils.sprintf('/#/vip/{0}', vip.uuid)
                });
            });
        };
        VipManager.prototype.enable = function (vip) {
            var _this = this;
            vip.progressOn();
            var msg = new ApiHeader.APIChangeVipStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = vip.uuid;
            this.api.asyncApi(msg, function (ret) {
                vip.updateObservableObject(ret.inventory);
                vip.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled VIP: {0}', vip.name),
                    link: Utils.sprintf('/#/vip/{0}', vip.uuid)
                });
            });
        };
        VipManager.prototype["delete"] = function (vip, done) {
            var _this = this;
            vip.progressOn();
            var msg = new ApiHeader.APIDeleteVipMsg();
            msg.uuid = vip.uuid;
            this.api.asyncApi(msg, function (ret) {
                vip.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted VIP: {0}', vip.name)
                });
            });
        };
        return VipManager;
    }());
    VipManager.$inject = ['Api', '$rootScope'];
    MVip.VipManager = VipManager;
    var VipModel = (function (_super) {
        __extends(VipModel, _super);
        function VipModel() {
            var _this = _super.call(this) || this;
            _this.current = new Vip();
            return _this;
        }
        return VipModel;
    }(Utils.Model));
    MVip.VipModel = VipModel;
    var OVipGrid = (function (_super) {
        __extends(OVipGrid, _super);
        function OVipGrid($scope, vipMgr) {
            var _this = _super.call(this) || this;
            _this.vipMgr = vipMgr;
            _super.prototype.init.call(_this, $scope, $scope.vipGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"vip.ts.NAME" | translate}}',
                    width: '10%',
                    template: '<a href="/\\#/vip/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'state',
                    title: '{{"vip.ts.STATE" | translate}}',
                    width: '6%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'ip',
                    title: '{{"vip.ts.IP" | translate}}',
                    width: '14%'
                },
                {
                    field: 'netmask',
                    title: '{{"vip.ts.NETMASK" | translate}}',
                    width: '14%'
                },
                {
                    field: 'gateway',
                    title: '{{"vip.ts.GATEWAY" | translate}}',
                    width: '14%'
                },
                {
                    field: 'l3NetworkUuid',
                    title: '{{"vip.ts.L3 NETWORK UUID" | translate}}',
                    width: '%14',
                    template: '<a href="/\\#/l3Network/{{dataItem.l3NetworkUuid}}">{{dataItem.l3NetworkUuid}}</a>'
                },
                {
                    field: 'useFor',
                    title: '{{"vip.ts.USE" | translate}}',
                    width: '14%'
                },
                {
                    field: 'serviceProvider',
                    title: '{{"vip.ts.SERVICE PROVIDER" | translate}}',
                    width: '14%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                vipMgr.query(qobj, function (vips, total) {
                    options.success({
                        data: vips,
                        total: total
                    });
                });
            };
            return _this;
        }
        return OVipGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, vipMgr) {
            this.$scope = $scope;
            this.vipMgr = vipMgr;
        }
        Action.prototype.enable = function () {
            this.vipMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.vipMgr.disable(this.$scope.model.current);
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
                            name: '{{"vip.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"vip.ts.State" | translate}}',
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
            this.$scope.oVipGrid.setFilter(this.toKendoFilter());
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
        function DetailsController($scope, vipMgr, $routeParams, tagService, current) {
            var _this = this;
            this.$scope = $scope;
            this.vipMgr = vipMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            $scope.model = new VipModel();
            $scope.model.current = current;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, vipMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteVip = {
                title: 'DELETE VIP',
                description: 'Deleting will delete all network services that this VIP is used for. For example, if the VIP is used for EIP, the EIP will be deleted as well',
                confirm: function () {
                    vipMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeVipVO, function (ret) {
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
            this.vipMgr.query(qobj, function (vips, total) {
                _this.$scope.model.current = vips[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'VipManager', '$routeParams', 'Tag', 'current'];
    MVip.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, vipMgr, $location) {
            this.$scope = $scope;
            this.vipMgr = vipMgr;
            this.$location = $location;
            $scope.model = new VipModel();
            $scope.oVipGrid = new OVipGrid($scope, vipMgr);
            $scope.action = new Action($scope, vipMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"vip.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"vip.ts.Description" | translate}}',
                        value: 'description'
                    },
                    {
                        name: '{{"vip.ts.IP" | translate}}',
                        value: 'ip'
                    },
                    {
                        name: '{{"vip.ts.NETMASK" | translate}}',
                        value: 'netmask'
                    },
                    {
                        name: '{{"vip.ts.GATEWAY" | translate}}',
                        value: 'gateway'
                    },
                    {
                        name: '{{"vip.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"vip.ts.USE" | translate}}',
                        value: 'useFor'
                    },
                    {
                        name: '{{"vip.ts.SERVICE PROVIDER" | translate}}',
                        value: 'serviceProvider'
                    },
                    {
                        name: '{{"vip.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"vip.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    vipMgr.setSortBy(ret);
                    $scope.oVipGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.VipInventoryQueryable,
                name: 'Vip',
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
                    vipMgr.query(qobj, function (Vips, total) {
                        $scope.oVipGrid.refresh(Vips);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/vip/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateVip = function (win) {
                win.open();
            };
            $scope.funcDeleteVip = function () {
                $scope.deleteVip.open();
            };
            $scope.optionsDeleteVip = {
                title: 'DELETE VIP',
                description: 'Deleting will delete all network services that this VIP is used for. For example, if the VIP is used for EIP, the EIP will be deleted as well',
                confirm: function () {
                    vipMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oVipGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oVipGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateVip = {
                done: function (vip) {
                    $scope.oVipGrid.add(vip);
                }
            };
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'VipManager', '$location'];
    MVip.Controller = Controller;
    var CreateVipOptions = (function () {
        function CreateVipOptions() {
        }
        return CreateVipOptions;
    }());
    MVip.CreateVipOptions = CreateVipOptions;
    var CreateVip = (function () {
        function CreateVip(api, vipMgr, zoneMgr, l3Mgr) {
            var _this = this;
            this.api = api;
            this.vipMgr = vipMgr;
            this.zoneMgr = zoneMgr;
            this.l3Mgr = l3Mgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateVip;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new CreateVipOptions();
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
                    l3NetworkUuid: null,
                    requiredIp: null,
                    isVipValid: function () {
                        if (Utils.notNullnotUndefined(this.requiredIp) && this.requiredIp != "") {
                            return Utils.isIpv4Address(this.requiredIp);
                        }
                        return true;
                    },
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.l3NetworkUuid) && this.isVipValid();
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createVipInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createVipInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('vip');
                        this.description = null;
                        this.requiredIp = null;
                        this.l3NetworkUuid = null;
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
                        var resultVip;
                        var chain = new Utils.Chain();
                        chain.then(function () {
                            $scope.infoPage.requiredIp = $scope.infoPage.requiredIp == "" ? null : $scope.infoPage.requiredIp;
                            vipMgr.create(infoPage, function (ret) {
                                resultVip = ret;
                                chain.next();
                            });
                        }).done(function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(resultVip);
                            }
                        }).start();
                        $scope.winCreateVip__.close();
                    }
                };
                $scope.hasL3Network = function () {
                    return $scope.l3NetworkListOptions__.dataSource.data().length > 0;
                };
                $scope.button = new Utils.WizardButton([
                    infoPage
                ], mediator);
                $scope.winCreateVipOptions__ = {
                    width: '700px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.zoneOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vip.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vip.ts.State" | translate}}:</span><span>#: state #</span></div>'
                };
                $scope.l3NetworkListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vip.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vip.ts.Type" | translate}}:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vip.ts.Zone UUID" | translate}}:</span><span>#: zoneUuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vip.ts.L2 Network UUID" | translate}}:</span><span>#: l2NetworkUuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vip.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.$watch(function () {
                    return $scope.zoneUuid;
                }, function () {
                    if (Utils.notNullnotUndefined($scope.zoneUuid)) {
                        var qobj = new ApiHeader.QueryObject();
                        qobj.conditions = [
                            {
                                name: 'zoneUuid',
                                op: '=',
                                value: $scope.zoneUuid
                            }
                        ];
                        _this.l3Mgr.query(qobj, function (l3s) {
                            $scope.l3NetworkListOptions__.dataSource.data(l3s);
                            if (l3s.length > 0) {
                                $scope.infoPage.l3NetworkUuid = l3s[0].uuid;
                            }
                        });
                    }
                });
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/vip/createVip.html';
        }
        CreateVip.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateVip__;
            this.$scope.button.reset();
            var qobj = new ApiHeader.QueryObject();
            qobj.conditions = [];
            this.$scope.zoneUuid = null;
            this.zoneMgr.query(qobj, function (zones) {
                _this.$scope.zoneOptions__.dataSource.data(zones);
                if (zones.length > 0) {
                    _this.$scope.infoPage.zoneUuid = zones[0].uuid;
                }
                win.center();
                win.open();
            });
        };
        return CreateVip;
    }());
    MVip.CreateVip = CreateVip;
})(MVip || (MVip = {}));
angular.module('root').factory('VipManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MVip.VipManager(api, $rootScope);
}]).directive('zCreateVip', ['Api', 'VipManager', 'ZoneManager', 'L3NetworkManager', function (api, vipMgr, zoneMgr, l3Mgr) {
    return new MVip.CreateVip(api, vipMgr, zoneMgr, l3Mgr);
}]).config(['$routeProvider', function (route) {
    route.when('/vip', {
        templateUrl: '/static/templates/vip/vip.html',
        controller: 'MVip.Controller'
    }).when('/vip/:uuid', {
        templateUrl: '/static/templates/vip/details.html',
        controller: 'MVip.DetailsController',
        resolve: {
            current: function ($q, $route, VipManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var uuid = $route.current.params.uuid;
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                VipManager.query(qobj, function (vips) {
                    var vip = vips[0];
                    defer.resolve(vip);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />