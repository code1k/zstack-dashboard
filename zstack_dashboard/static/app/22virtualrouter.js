var MVirtualRouter;
(function (MVirtualRouter) {
    var VmNic = (function (_super) {
        __extends(VmNic, _super);
        function VmNic() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        VmNic.prototype.progressOn = function () {
            this.inProgress = true;
        };
        VmNic.prototype.progressOff = function () {
            this.inProgress = false;
        };
        VmNic.prototype.isInProgress = function () {
            return this.inProgress;
        };
        VmNic.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('vmInstanceUuid', inv.vmInstanceUuid);
            self.set('l3NetworkUuid', inv.l3NetworkUuid);
            self.set('ip', inv.ip);
            self.set('mac', inv.mac);
            self.set('netmask', inv.netmask);
            self.set('gateway', inv.gateway);
            self.set('metaData', inv.metaData);
            self.set('deviceId', inv.deviceId);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        return VmNic;
    }(ApiHeader.VmNicInventory));
    MVirtualRouter.VmNic = VmNic;
    var VirtualRouter = (function (_super) {
        __extends(VirtualRouter, _super);
        function VirtualRouter() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        VirtualRouter.prototype.progressOn = function () {
            this.inProgress = true;
        };
        VirtualRouter.prototype.progressOff = function () {
            this.inProgress = false;
        };
        VirtualRouter.prototype.isInProgress = function () {
            return this.inProgress;
        };
        VirtualRouter.prototype.stateLabel = function () {
            if (this.state == 'Running') {
                return 'label label-success';
            }
            else if (this.state == 'Stopped') {
                return 'label label-danger';
            }
            else if (this.state == 'Unknown') {
                return 'label label-warning';
            }
            else {
                return 'label label-default';
            }
        };
        VirtualRouter.prototype.statusLabel = function () {
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
        VirtualRouter.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('zoneUuid', inv.zoneUuid);
            self.set('clusterUuid', inv.clusterUuid);
            self.set('hypervisorType', inv.hypervisorType);
            self.set('state', inv.state);
            self.set('status', inv.status);
            self.set('hostUuid', inv.hostUuid);
            self.set('lastHostUuid', inv.lastHostUuid);
            self.set('rootVolumeUuid', inv.rootVolumeUuid);
            self.set('vmNics', inv.vmNics);
            self.set('type', inv.type);
            self.set('imageUuid', inv.imageUuid);
            self.set('allVolumes', inv.allVolumes);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        return VirtualRouter;
    }(ApiHeader.ApplianceVmInventory));
    VirtualRouter.STATES = ['Running', 'Starting', 'Stopping', 'Stopped', 'Rebooting', 'Migrating', 'Unknown', 'Created'];
    MVirtualRouter.VirtualRouter = VirtualRouter;
    var VirtualRouterManager = (function () {
        function VirtualRouterManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        VirtualRouterManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        VirtualRouterManager.prototype.wrap = function (obj) {
            return new kendo.data.ObservableObject(obj);
        };
        VirtualRouterManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryApplianceVmMsg();
            msg.count = qobj.count === true;
            msg.start = qobj.start;
            msg.limit = qobj.limit;
            msg.replyWithCount = true;
            msg.conditions = qobj.conditions ? qobj.conditions : [];
            msg.conditions.push({
                name: "type",
                op: "=",
                value: "ApplianceVm"
            });
            if (Utils.notNullnotUndefined(this.sortBy) && this.sortBy.isValid()) {
                msg.sortBy = this.sortBy.field;
                msg.sortDirection = this.sortBy.direction;
            }
            this.api.syncApi(msg, function (ret) {
                var pris = [];
                ret.inventories.forEach(function (inv) {
                    var c = new VirtualRouter();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        VirtualRouterManager.prototype.getConsole = function (vm, done) {
            var msg = new ApiHeader.APIRequestConsoleAccessMsg();
            msg.vmInstanceUuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                done(ret.inventory);
            });
        };
        VirtualRouterManager.prototype.stop = function (vm) {
            var _this = this;
            vm.progressOn();
            vm.state = 'Stopping';
            var msg = new ApiHeader.APIStopVmInstanceMsg();
            msg.uuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                vm.updateObservableObject(ret.inventory);
                vm.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Stopped virtual router: {0}', vm.name),
                    link: Utils.sprintf('/#/virtualRouter/{0}', vm.uuid)
                });
            });
        };
        VirtualRouterManager.prototype.start = function (vm) {
            var _this = this;
            vm.progressOn();
            vm.state = 'Starting';
            var msg = new ApiHeader.APIStartVmInstanceMsg();
            msg.uuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                vm.updateObservableObject(ret.inventory);
                vm.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Started virtual router: {0}', vm.name),
                    link: Utils.sprintf('/#/virtualRouter/{0}', vm.uuid)
                });
            });
        };
        VirtualRouterManager.prototype.reboot = function (vm) {
            var _this = this;
            vm.progressOn();
            vm.state = 'Rebooting';
            var msg = new ApiHeader.APIRebootVmInstanceMsg();
            msg.uuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                vm.updateObservableObject(ret.inventory);
                vm.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Rebooted virtual router: {0}', vm.name),
                    link: Utils.sprintf('/#/virtualRouter/{0}', vm.uuid)
                });
            }, function () {
                vm.progressOff();
            });
        };
        VirtualRouterManager.prototype["delete"] = function (vm, done) {
            var _this = this;
            vm.progressOn();
            vm.state = 'Destroying';
            var msg = new ApiHeader.APIDestroyVmInstanceMsg();
            msg.uuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                vm.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted virtual router: {0}', vm.name)
                });
            });
        };
        VirtualRouterManager.prototype.migrate = function (vm, hostUuid, done) {
            var _this = this;
            vm.progressOn();
            vm.state = 'Migrating';
            var msg = new ApiHeader.APIMigrateVmMsg();
            msg.hostUuid = hostUuid;
            msg.vmInstanceUuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                vm.updateObservableObject(ret.inventory);
                vm.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Migrated virtual router: {0}', vm.name),
                    link: Utils.sprintf('/#/virtualRouter/{0}', vm.uuid)
                });
            });
        };
        VirtualRouterManager.prototype.reconnect = function (vm, done) {
            var _this = this;
            vm.progressOn();
            vm.status = 'Connecting';
            var msg = new ApiHeader.APIReconnectVirtualRouterMsg();
            msg.vmInstanceUuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                vm.updateObservableObject(ret.inventory);
                vm.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Reconnected virtual router: {0}', vm.name),
                    link: Utils.sprintf('/#/virtualRouter/{0}', vm.uuid)
                });
            });
        };
        return VirtualRouterManager;
    }());
    VirtualRouterManager.$inject = ['Api', '$rootScope'];
    MVirtualRouter.VirtualRouterManager = VirtualRouterManager;
    var VirtualRouterModel = (function (_super) {
        __extends(VirtualRouterModel, _super);
        function VirtualRouterModel() {
            var _this = _super.call(this) || this;
            _this.current = new VirtualRouter();
            return _this;
        }
        return VirtualRouterModel;
    }(Utils.Model));
    MVirtualRouter.VirtualRouterModel = VirtualRouterModel;
    var OVirtualRouterGrid = (function (_super) {
        __extends(OVirtualRouterGrid, _super);
        function OVirtualRouterGrid($scope, vmMgr) {
            var _this = _super.call(this) || this;
            _this.vmMgr = vmMgr;
            _super.prototype.init.call(_this, $scope, $scope.vmGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"virtualRouter.ts.NAME" | translate}}',
                    width: '20%',
                    template: '<a href="/\\#/virtualRouter/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'description',
                    title: '{{"virtualRouter.ts.DESCRIPTION" | translate}}',
                    width: '20%'
                },
                {
                    field: 'hypervisorType',
                    title: '{{"virtualRouter.ts.HYPERVISOR" | translate}}',
                    width: '20%'
                },
                {
                    field: 'state',
                    title: '{{"virtualRouter.ts.STATE" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'status',
                    title: '{{"virtualRouter.ts.STATUS" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.statusLabel()}}">{{dataItem.status}}</span>'
                },
                {
                    field: 'uuid',
                    title: '{{"virtualRouter.ts.UUID" | translate}}',
                    width: '20%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                vmMgr.query(qobj, function (vms, total) {
                    options.success({
                        data: vms,
                        total: total
                    });
                });
            };
            return _this;
        }
        return OVirtualRouterGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, vmMgr) {
            this.$scope = $scope;
            this.vmMgr = vmMgr;
        }
        Action.prototype.start = function () {
            this.vmMgr.start(this.$scope.model.current);
        };
        Action.prototype.stop = function () {
            this.vmMgr.stop(this.$scope.model.current);
        };
        Action.prototype.reboot = function () {
            this.vmMgr.reboot(this.$scope.model.current);
        };
        Action.prototype.migrate = function () {
            this.$scope.migrateVm.open();
        };
        Action.prototype["delete"] = function () {
            this.$scope.deleteVirtualRouter.open();
        };
        Action.prototype.reconnect = function () {
            this.$scope.reconnectVirtualRouter.open();
        };
        Action.prototype.console = function () {
            this.$scope.console();
        };
        Action.prototype.isActionShow = function (action) {
            if (!Utils.notNullnotUndefined(this.$scope.model.current) || Utils.isEmptyObject(this.$scope.model.current)) {
                return false;
            }
            if (action == 'start') {
                return this.$scope.model.current.state == 'Stopped';
            }
            else if (action == 'stop') {
                return this.$scope.model.current.state == 'Running';
            }
            else if (action == 'reboot') {
                return this.$scope.model.current.state == 'Running';
            }
            else if (action == 'migrate') {
                return this.$scope.model.current.state == 'Running';
            }
            else if (action == 'reconnect') {
                return this.$scope.model.current.state == 'Running';
            }
            else if (action == 'console' && Utils.notNullnotUndefined(this.$scope.model.current)) {
                return this.$scope.model.current.state == 'Starting' || this.$scope.model.current.state == 'Running' || this.$scope.model.current.state == 'Rebooting' || this.$scope.model.current.state == 'Stopping';
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
                            name: '{{"virtualRouter.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"virtualRouter.ts.State" | translate}}',
                            value: FilterBy.STATE
                        },
                        {
                            name: '{{"virtualRouter.ts.HypervisorType" | translate}}',
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
                else if (_this.field == FilterBy.STATE) {
                    _this.valueList.dataSource.data(VirtualRouter.STATES);
                }
                else if (_this.field == FilterBy.TYPE) {
                    _this.valueList.dataSource.data(_this.hypervisorTypes);
                }
            });
        }
        FilterBy.prototype.confirm = function (popover) {
            this.$scope.oVirtualRouterGrid.setFilter(this.toKendoFilter());
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
    FilterBy.TYPE = 'hypervisorType';
    var DetailsController = (function () {
        function DetailsController($scope, vmMgr, $routeParams, tagService, current, clusterMgr, $rootScope, $window) {
            var _this = this;
            this.$scope = $scope;
            this.vmMgr = vmMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            this.$rootScope = $rootScope;
            this.$window = $window;
            $scope.model = new VirtualRouterModel();
            $scope.model.current = current;
            $scope.console = function () {
                var current = $scope.model.current;
                vmMgr.getConsole(current, function (inv) {
                    var windowName = current.name + current.uuid;
                    $window.open(Utils.sprintf('/static/templates/console/vnc_auto.html?host={0}&port={1}&token={2}&title={3}', inv.hostname, inv.port, inv.token, current.name), windowName);
                });
            };
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, vmMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteVirtualRouter = {
                title: 'DELETE VIRTUAL ROUTER',
                confirm: function () {
                    vmMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeApplianceVmVO, function (ret) {
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
            $scope.optionsMigrateVm = {
                vm: current
            };
            $scope.optionsNicGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'deviceId',
                        title: '{{"virtualRouter.ts.DEVICE ID" | translate}}',
                        width: '4%'
                    },
                    {
                        field: 'l3NetworkUuid',
                        title: '{{"virtualRouter.ts.L3 Network" | translate}}',
                        width: '20%',
                        template: '<a href="/\\#/l3Network/{{dataItem.l3NetworkUuid}}">{{dataItem.l3NetworkUuid}}</a>'
                    },
                    {
                        field: 'ip',
                        title: '{{"virtualRouter.ts.IP" | translate}}',
                        width: '14%'
                    },
                    {
                        field: 'netmask',
                        title: '{{"virtualRouter.ts.NETMASK" | translate}}',
                        width: '14%'
                    },
                    {
                        field: 'gateway',
                        title: '{{"virtualRouter.ts.GATEWAY" | translate}}',
                        width: '14%'
                    },
                    {
                        field: 'mac',
                        title: '{{"virtualRouter.ts.MAC" | translate}}',
                        width: '14%'
                    },
                    {
                        field: 'uuid',
                        title: '{{"virtualRouter.ts.UUID" | translate}}',
                        width: '20%'
                    }
                ],
                dataBound: function (e) {
                    var grid = e.sender;
                    if (grid.dataSource.totalPages() == 1) {
                        grid.pager.element.hide();
                    }
                },
                dataSource: new kendo.data.DataSource({
                    data: current.vmNics
                })
            };
            $scope.optionsVolumeGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'deviceId',
                        title: '{{"virtualRouter.ts.DEVICE ID" | translate}}',
                        width: '10%',
                        template: '<a href="/\\#/volume/{{dataItem.uuid}}">{{dataItem.deviceId}}</a>'
                    },
                    {
                        field: 'name',
                        title: '{{"virtualRouter.ts.NAME" | translate}}',
                        width: '18%'
                    },
                    {
                        field: 'type',
                        title: '{{"virtualRouter.ts.TYPE" | translate}}',
                        width: '18%'
                    },
                    {
                        field: 'state',
                        title: '{{"virtualRouter.ts.STATE" | translate}}',
                        width: '18%'
                    },
                    {
                        field: 'status',
                        title: '{{"virtualRouter.ts.STATUS" | translate}}',
                        width: '18%'
                    },
                    {
                        field: 'uuid',
                        title: '{{"virtualRouter.ts.UUID" | translate}}',
                        width: '18%'
                    }
                ],
                dataBound: function (e) {
                    var grid = e.sender;
                    if (grid.dataSource.totalPages() == 1) {
                        grid.pager.element.hide();
                    }
                },
                dataSource: new kendo.data.DataSource({
                    data: current.allVolumes
                })
            };
            $scope.optionsReconnectVirtualRouter = {
                title: '{{"virtualRouter.ts.RECONNECT VIRTUAL ROUTER" | translate}}',
                btnType: 'btn-primary',
                width: '350px',
                description: function () {
                    return "Reconnect agent on virtual router: " + current.name;
                },
                confirm: function () {
                    vmMgr.reconnect($scope.model.current, function () {
                        $scope.model.resetCurrent();
                    });
                }
            };
        }
        DetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.vmMgr.query(qobj, function (vms, total) {
                _this.$scope.model.current = vms[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'VirtualRouterManager', '$routeParams', 'Tag', 'current', 'ClusterManager', '$rootScope', '$window'];
    MVirtualRouter.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, vmMgr, hypervisorTypes, $location, $rootScope, $window) {
            this.$scope = $scope;
            this.vmMgr = vmMgr;
            this.hypervisorTypes = hypervisorTypes;
            this.$location = $location;
            this.$rootScope = $rootScope;
            this.$window = $window;
            $scope.model = new VirtualRouterModel();
            $scope.oVirtualRouterGrid = new OVirtualRouterGrid($scope, vmMgr);
            $scope.action = new Action($scope, vmMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"virtualRouter.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"virtualRouter.ts.Description" | translate}}',
                        value: 'Description'
                    },
                    {
                        name: '{{"virtualRouter.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"virtualRouter.ts.Hypervisor" | translate}}',
                        value: 'hypervisorType'
                    },
                    {
                        name: '{{"virtualRouter.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"virtualRouter.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    vmMgr.setSortBy(ret);
                    $scope.oVirtualRouterGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.ApplianceVmInventoryQueryable,
                name: 'VirtualRouter',
                schema: {
                    state: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: VirtualRouter.STATES
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
                    vmMgr.query(qobj, function (VirtualRouters, total) {
                        $scope.oVirtualRouterGrid.refresh(VirtualRouters);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/virtualRouter/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope, this.hypervisorTypes);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateVirtualRouter = function (win) {
                win.open();
            };
            $scope.funcDeleteVirtualRouter = function () {
                $scope.deleteVirtualRouter.open();
            };
            $scope.optionsDeleteVirtualRouter = {
                title: 'DELETE VIRTUAL ROUTER',
                confirm: function () {
                    vmMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oVirtualRouterGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oVirtualRouterGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateVirtualRouter = {
                done: function (vm) {
                    $scope.oVirtualRouterGrid.add(vm);
                }
            };
            $scope.optionsMigrateVm = {
                vm: null
            };
            $scope.$watch(function () {
                return $scope.model.current;
            }, function () {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    $scope.optionsMigrateVm.vm = $scope.model.current;
                }
            });
            $scope.optionsReconnectVirtualRouter = {
                title: 'RECONNECT VIRTUAL ROUTER',
                btnType: 'btn-primary',
                width: '350px',
                description: function () {
                    return "Reconnect agent on virtual router: " + $scope.model.current.name;
                },
                confirm: function () {
                    vmMgr.reconnect($scope.model.current, function () {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.console = function () {
                var current = $scope.model.current;
                vmMgr.getConsole(current, function (inv) {
                    var windowName = current.name + current.uuid;
                    $window.open(Utils.sprintf('/static/templates/console/vnc_auto.html?host={0}&port={1}&token={2}&title={3}', inv.hostname, inv.port, inv.token, current.name), windowName);
                });
            };
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'VirtualRouterManager', 'hypervisorTypes', '$location', '$rootScope', '$window'];
    MVirtualRouter.Controller = Controller;
})(MVirtualRouter || (MVirtualRouter = {}));
angular.module('root').factory('VirtualRouterManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MVirtualRouter.VirtualRouterManager(api, $rootScope);
}]).config(['$routeProvider', function (route) {
    route.when('/virtualRouter', {
        templateUrl: '/static/templates/virtualRouter/virtualRouter.html',
        controller: 'MVirtualRouter.Controller',
        resolve: {
            hypervisorTypes: function ($q, Api) {
                var defer = $q.defer();
                Api.getHypervisorTypes(function (hypervisorTypes) {
                    defer.resolve(hypervisorTypes);
                });
                return defer.promise;
            }
        }
    }).when('/virtualRouter/:uuid', {
        templateUrl: '/static/templates/virtualRouter/details.html',
        controller: 'MVirtualRouter.DetailsController',
        resolve: {
            current: function ($q, $route, VirtualRouterManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var uuid = $route.current.params.uuid;
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                VirtualRouterManager.query(qobj, function (vms) {
                    var vm = vms[0];
                    defer.resolve(vm);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />