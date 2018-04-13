var MHost;
(function (MHost) {
    var Host = (function (_super) {
        __extends(Host, _super);
        function Host() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Host.prototype.progressOn = function () {
            this.inProgress = true;
        };
        Host.prototype.progressOff = function () {
            this.inProgress = false;
        };
        Host.prototype.isInProgress = function () {
            return this.inProgress;
        };
        Host.prototype.isEnableShow = function () {
            return this.state == 'Disabled' || this.state == 'Maintenance' || this.state == 'PreMaintenance';
        };
        Host.prototype.isDisableShow = function () {
            return this.state == 'Enabled' || this.state == 'Maintenance' || this.state == 'PreMaintenance';
        };
        Host.prototype.stateLabel = function () {
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
        Host.prototype.statusLabel = function () {
            if (this.status == 'Connected') {
                return 'label label-success';
            }
            else if (this.status == 'Disconnected') {
                return 'label label-danger';
            }
            else {
                return 'label label-default';
            }
        };
        Host.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('zoneUuid', inv.zoneUuid);
            self.set('hypervisorType', inv.hypervisorType);
            self.set('managementIp', inv.managementIp);
            self.set('state', inv.state);
            self.set('clusterUuid', inv.clusterUuid);
            self.set('zoneUuid', inv.zoneUuid);
            self.set('status', inv.status);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
            self.set('sshPort', inv.sshPort);
        };
        return Host;
    }(ApiHeader.HostInventory));
    MHost.Host = Host;
    var HostManager = (function () {
        function HostManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        HostManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        HostManager.prototype.wrap = function (Host) {
            return new kendo.data.ObservableObject(Host);
        };
        HostManager.prototype.create = function (host, done) {
            var _this = this;
            var msg = null;
            if (host.hypervisorType == 'KVM') {
                msg = new ApiHeader.APIAddKVMHostMsg();
                msg.username = host.username;
                msg.password = host.password;
                msg.sshPort = host.port;
            }
            else if (host.hypervisorType == 'Simulator') {
                msg = new ApiHeader.APIAddSimulatorHostMsg();
            }
            msg.name = host.name;
            msg.description = host.description;
            msg.clusterUuid = host.clusterUuid;
            msg.managementIp = host.managementIp;
            this.api.asyncApi(msg, function (ret) {
                var c = new Host();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Added new Host: {0}', c.name),
                    link: Utils.sprintf('/#/host/{0}', c.uuid)
                });
            });
        };
        HostManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryHostMsg();
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
                    var c = new Host();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        HostManager.prototype.disable = function (host) {
            var _this = this;
            host.progressOn();
            var msg = new ApiHeader.APIChangeHostStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = host.uuid;
            this.api.asyncApi(msg, function (ret) {
                host.updateObservableObject(ret.inventory);
                host.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled Host: {0}', host.name),
                    link: Utils.sprintf('/#/host/{0}', host.uuid)
                });
            });
        };
        HostManager.prototype.enable = function (host) {
            var _this = this;
            host.progressOn();
            var msg = new ApiHeader.APIChangeHostStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = host.uuid;
            this.api.asyncApi(msg, function (ret) {
                host.updateObservableObject(ret.inventory);
                host.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled Host: {0}', host.name),
                    link: Utils.sprintf('/#/host/{0}', host.uuid)
                });
            });
        };
        HostManager.prototype.maintain = function (host) {
            var _this = this;
            host.progressOn();
            var msg = new ApiHeader.APIChangeHostStateMsg();
            msg.stateEvent = 'maintain';
            msg.uuid = host.uuid;
            this.api.asyncApi(msg, function (ret) {
                host.updateObservableObject(ret.inventory);
                host.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Put Host into maintenance mode: {0}', host.name),
                    link: Utils.sprintf('/#/host/{0}', host.uuid)
                });
            }, function () {
                host.progressOff();
            });
        };
        HostManager.prototype.reconnect = function (host) {
            var _this = this;
            host.progressOn();
            var msg = new ApiHeader.APIReconnectHostMsg();
            msg.uuid = host.uuid;
            host.status = 'Connecting';
            this.api.asyncApi(msg, function (ret) {
                host.updateObservableObject(ret.inventory);
                host.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Reconnected Host: {0}', host.name),
                    link: Utils.sprintf('/#/host/{0}', host.uuid)
                });
            });
        };
        HostManager.prototype["delete"] = function (host, done) {
            var _this = this;
            host.progressOn();
            var msg = new ApiHeader.APIDeleteHostMsg();
            msg.uuid = host.uuid;
            this.api.asyncApi(msg, function (ret) {
                host.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted Host: {0}', host.name)
                });
            });
        };
        return HostManager;
    }());
    HostManager.$inject = ['Api', '$rootScope'];
    MHost.HostManager = HostManager;
    var HostModel = (function (_super) {
        __extends(HostModel, _super);
        function HostModel() {
            var _this = _super.call(this) || this;
            _this.current = new Host();
            return _this;
        }
        return HostModel;
    }(Utils.Model));
    MHost.HostModel = HostModel;
    var OHostGrid = (function (_super) {
        __extends(OHostGrid, _super);
        function OHostGrid($scope, hostMgr) {
            var _this = _super.call(this) || this;
            _this.hostMgr = hostMgr;
            _super.prototype.init.call(_this, $scope, $scope.hostGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"host.ts.NAME" | translate}}',
                    width: '10%',
                    template: '<a href="/\\#/host/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'description',
                    title: '{{"host.ts.DESCRIPTION" | translate}}',
                    width: '20%'
                },
                {
                    field: 'managementIp',
                    title: '{{"host.ts.MANAGEMENT IP" | translate}}',
                    width: '15%'
                },
                {
                    field: 'hypervisorType',
                    title: '{{"host.ts.HYPERVISOR" | translate}}',
                    width: '15%'
                },
                {
                    field: 'state',
                    title: '{{"host.ts.STATE" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'status',
                    title: '{{"host.ts.STATUS" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.statusLabel()}}">{{dataItem.status}}</span>'
                },
                {
                    field: 'uuid',
                    title: '{{"host.ts.UUID" | translate}}',
                    width: '20%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                hostMgr.query(qobj, function (hosts, total) {
                    options.success({
                        data: hosts,
                        total: total
                    });
                });
            };
            return _this;
        }
        return OHostGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, hostMgr) {
            this.$scope = $scope;
            this.hostMgr = hostMgr;
        }
        Action.prototype.enable = function () {
            this.hostMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.hostMgr.disable(this.$scope.model.current);
        };
        Action.prototype.reconnect = function () {
            this.hostMgr.reconnect(this.$scope.model.current);
        };
        Action.prototype.maintain = function () {
            this.hostMgr.maintain(this.$scope.model.current);
        };
        Action.prototype.isMaintainShow = function () {
            if (Utils.notNullnotUndefined(this.$scope.model.current)) {
                return this.$scope.model.current.state != 'PreMaintenance' && this.$scope.model.current.state != 'Maintenance';
            }
            else {
                return false;
            }
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
                            name: '{{"host.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"host.ts.State" | translate}}',
                            value: FilterBy.STATE
                        },
                        {
                            name: '{{"host.ts.Status" | translate}}',
                            value: FilterBy.STATUS
                        },
                        {
                            name: '{{"host.ts.HypervisorType" | translate}}',
                            value: FilterBy.TYPE
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
                else if (_this.field == FilterBy.STATUS) {
                    _this.valueList.dataSource.data(['Connecting', 'Connected', 'Disconnected']);
                }
                else if (_this.field == FilterBy.STATE) {
                    _this.valueList.dataSource.data(['Enabled', 'Disabled', 'PreMaintenance', 'Maintenance']);
                }
                else if (_this.field == FilterBy.TYPE) {
                    _this.valueList.dataSource.data(_this.hypervisorTypes);
                }
            });
        }
        FilterBy.prototype.confirm = function (popover) {
            this.$scope.oHostGrid.setFilter(this.toKendoFilter());
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
    FilterBy.STATUS = 'status';
    FilterBy.TYPE = 'hypervisorType';
    var DetailsController = (function () {
        function DetailsController($scope, hostMgr, $routeParams, tagService, current, clusterMgr, api) {
            var _this = this;
            this.$scope = $scope;
            this.hostMgr = hostMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            this.api = api;
            $scope.model = new HostModel();
            $scope.model.current = current;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, hostMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteHost = {
                title: 'DELETE HOST',
                description: "Deleting Host will cause all VMs on this host being stopped",
                confirm: function () {
                    hostMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeHostVO, function (ret) {
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
            $scope.systemTags = [];
            this.api.getSystemTags('HostVO', current.uuid, function (tags) {
                $scope.systemTags = tags;
            });
        }
        DetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.hostMgr.query(qobj, function (hosts, total) {
                _this.$scope.model.current = hosts[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'HostManager', '$routeParams', 'Tag', 'current', 'ClusterManager', 'Api'];
    MHost.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, hostMgr, hypervisorTypes, $location) {
            this.$scope = $scope;
            this.hostMgr = hostMgr;
            this.hypervisorTypes = hypervisorTypes;
            this.$location = $location;
            $scope.model = new HostModel();
            $scope.oHostGrid = new OHostGrid($scope, hostMgr);
            $scope.action = new Action($scope, hostMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"host.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"host.ts.Description" | translate}}',
                        value: 'description'
                    },
                    {
                        name: '{{"host.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"host.ts.Status" | translate}}',
                        value: 'status'
                    },
                    {
                        name: '{{"host.ts.Hypervisor" | translate}}',
                        value: 'hypervisorType'
                    },
                    {
                        name: '{{"host.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"host.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    hostMgr.setSortBy(ret);
                    $scope.oHostGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.HostInventoryQueryable,
                name: 'Host',
                schema: {
                    state: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['Enabled', 'Disabled', 'PreMaintenance', 'Maintenance']
                    },
                    status: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['Connecting', 'Connected', 'Disconnected']
                    },
                    hypervisorType: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: this.hypervisorTypes
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
                    hostMgr.query(qobj, function (Hosts, total) {
                        $scope.oHostGrid.refresh(Hosts);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/host/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope, this.hypervisorTypes);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateHost = function (win) {
                win.open();
            };
            $scope.funcDeleteHost = function () {
                $scope.deleteHost.open();
            };
            $scope.optionsDeleteHost = {
                title: 'DELETE HOST',
                description: "Deleting Host will cause all VMs on this host being stopped",
                confirm: function () {
                    hostMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oHostGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oHostGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateHost = {
                done: function (infoPage) {
                    infoPage.uuid = infoPage.resourceUuid = Utils.uuid();
                    infoPage.state = 'Enabled';
                    infoPage.status = 'Connecting';
                    var host = new Host();
                    angular.extend(host, infoPage);
                    $scope.oHostGrid.add(host);
                    hostMgr.create(infoPage, function (ret) {
                        $scope.oHostGrid.refresh();
                    });
                }
            };
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'HostManager', 'hypervisorTypes', '$location'];
    MHost.Controller = Controller;
    var CreateHostOptions = (function () {
        function CreateHostOptions() {
        }
        return CreateHostOptions;
    }());
    MHost.CreateHostOptions = CreateHostOptions;
    var CreateHostModel = (function () {
        function CreateHostModel() {
        }
        CreateHostModel.prototype.canCreate = function () {
            if (this.hypervisorType == 'KVM') {
                return angular.isDefined(this.name) && angular.isDefined(this.description) &&
                    angular.isDefined(this.clusterUuid) && Utils.notNullnotUndefined(this.managementIp) &&
                    Utils.notNullnotUndefined(this.username) && Utils.notNullnotUndefined(this.password);
            }
            else {
                return angular.isDefined(this.name) && angular.isDefined(this.description) &&
                    angular.isDefined(this.clusterUuid) && Utils.notNullnotUndefined(this.managementIp);
            }
        };
        return CreateHostModel;
    }());
    MHost.CreateHostModel = CreateHostModel;
    var CreateHost = (function () {
        function CreateHost(api, zoneMgr, hostMgr, clusterMgr) {
            var _this = this;
            this.api = api;
            this.zoneMgr = zoneMgr;
            this.hostMgr = hostMgr;
            this.clusterMgr = clusterMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateHost;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new CreateHostOptions();
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
                    clusterUuid: null,
                    description: null,
                    hypervisorType: null,
                    managementIp: null,
                    username: 'root',
                    password: null,
                    canMoveToPrevious: function () {
                        return false;
                    },
                    hasCluster: function () {
                        return $scope.clusterListOptions__.dataSource.data().length > 0;
                    },
                    canMoveToNext: function () {
                        if (this.hypervisorType == 'KVM') {
                            return Utils.notNullnotUndefined(this.name)
                                && Utils.notNullnotUndefined(this.clusterUuid) && Utils.notNullnotUndefined(this.managementIp) &&
                                Utils.notNullnotUndefined(this.username) && Utils.notNullnotUndefined(this.password);
                        }
                        else {
                            return Utils.notNullnotUndefined(this.name)
                                && Utils.notNullnotUndefined(this.clusterUuid) && Utils.notNullnotUndefined(this.managementIp);
                        }
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createHostInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createHostInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('host');
                        this.clusterUuid = null;
                        this.description = null;
                        this.hypervisorType = null;
                        this.username = 'root';
                        this.password = null;
                        this.managementIp = null;
                        this.activeState = false;
                    }
                };
                var mediator = $scope.mediator = {
                    currentPage: infoPage,
                    movedToPage: function (page) {
                        $scope.mediator.currentPage = page;
                    },
                    finishButtonName: function () {
                        return "Add";
                    },
                    finish: function () {
                        if (Utils.notNullnotUndefined(_this.options.done)) {
                            _this.options.done($scope.infoPage);
                        }
                        $scope.winCreateHost__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage
                ], mediator);
                $scope.$watch(function () {
                    return $scope.infoPage.zoneUuid;
                }, function () {
                    var zuuid = $scope.infoPage.zoneUuid;
                    if (Utils.notNullnotUndefined(zuuid)) {
                        _this.queryClusters(zuuid, function (clusters) {
                            $scope.clusterListOptions__.dataSource.data(clusters);
                            var c = clusters[0];
                            if (Utils.notNullnotUndefined(c)) {
                                $scope.infoPage.hypervisorType = c.hypervisorType;
                            }
                        });
                    }
                });
                $scope.zoneList = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"host.ts.Name" | translate}}</span>: #: name #</div>' + '<div style="color: black"><span class="z-label">{{"host.ts.State" | translate}}</span>#: state #</div>' + '<div style="color: black"><span class="z-label">{{"host.ts.UUID" | translate}}</span> #: uuid #</div>'
                };
                $scope.winCreateHostOptions__ = {
                    width: '700px',
                    //height: '620px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.clusterListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"host.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"host.ts.HYPERVISOR" | translate}}</span><span>#: hypervisorType #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"host.ts.UUID" | translate}}</span><span>#: uuid #</span></div>',
                    change: function (e) {
                        var list = e.sender;
                        var cluster = list.dataItem();
                        Utils.safeApply($scope, function () {
                            $scope.infoPage.hypervisorType = cluster.hypervisorType;
                        });
                    }
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/host/createHost.html';
        }
        CreateHost.prototype.queryClusters = function (zoneUuid, done) {
            var qobj = new ApiHeader.QueryObject();
            qobj.conditions = [
                {
                    name: 'zoneUuid',
                    op: '=',
                    value: zoneUuid
                }
            ];
            this.clusterMgr.query(qobj, function (clusters) {
                done(clusters);
            });
        };
        CreateHost.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateHost__;
            var chain = new Utils.Chain();
            this.$scope.clusterListOptions__.dataSource.data([]);
            this.$scope.button.reset();
            chain.then(function () {
                if (Utils.notNullnotUndefined(_this.options.zone)) {
                    _this.$scope.zoneList.dataSource.data(new kendo.data.ObservableArray([_this.options.zone]));
                    _this.$scope.infoPage.zoneUuid = _this.options.zone.uuid;
                    chain.next();
                }
                else {
                    _this.zoneMgr.query(new ApiHeader.QueryObject(), function (zones, total) {
                        _this.$scope.zoneList.dataSource.data(zones);
                        if (zones) {
                            _this.$scope.infoPage.zoneUuid = zones[0].uuid;
                        }
                        chain.next();
                    });
                }
            }).then(function () {
                if (Utils.notNullnotUndefined(_this.$scope.infoPage.zoneUuid)) {
                    _this.queryClusters(_this.$scope.infoPage.zoneUuid, function (clusters) {
                        _this.$scope.clusterListOptions__.dataSource.data(clusters);
                        var c = clusters[0];
                        if (Utils.notNullnotUndefined(c)) {
                            _this.$scope.infoPage.hypervisorType = c.hypervisorType;
                        }
                        chain.next();
                    });
                }
                else {
                    chain.next();
                }
            }).done(function () {
                win.center();
                win.open();
            }).start();
        };
        return CreateHost;
    }());
    MHost.CreateHost = CreateHost;
})(MHost || (MHost = {}));
angular.module('root').factory('HostManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MHost.HostManager(api, $rootScope);
}]).directive('zCreateHost', ['Api', 'ZoneManager', 'HostManager', 'ClusterManager', function (api, zoneMgr, hostMgr, clusterMgr) {
    return new MHost.CreateHost(api, zoneMgr, hostMgr, clusterMgr);
}]).config(['$routeProvider', function (route) {
    route.when('/host', {
        templateUrl: '/static/templates/host/host.html',
        controller: 'MHost.Controller',
        resolve: {
            hypervisorTypes: function ($q, Api) {
                var defer = $q.defer();
                Api.getHypervisorTypes(function (hypervisorTypes) {
                    defer.resolve(hypervisorTypes);
                });
                return defer.promise;
            }
        }
    }).when('/host/:uuid', {
        templateUrl: '/static/templates/host/details.html',
        controller: 'MHost.DetailsController',
        resolve: {
            current: function ($q, $route, HostManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var uuid = $route.current.params.uuid;
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                HostManager.query(qobj, function (hosts) {
                    var host = hosts[0];
                    defer.resolve(host);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />