var MZone;
(function (MZone) {
    var Zone = (function (_super) {
        __extends(Zone, _super);
        function Zone() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Zone.prototype.progressOn = function () {
            this.inProgress = true;
        };
        Zone.prototype.progressOff = function () {
            this.inProgress = false;
        };
        Zone.prototype.isInProgress = function () {
            return this.inProgress;
        };
        Zone.prototype.isEnableShow = function () {
            return this.state == 'Disabled';
        };
        Zone.prototype.isDisableShow = function () {
            return this.state == 'Enabled';
        };
        Zone.prototype.stateLabel = function () {
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
        Zone.prototype.gridColumnLabel = function () {
            if (this.state == 'Enabled') {
                return 'z-color-box-green';
            }
            else if (this.state == 'Disabled') {
                return 'z-color-box-red';
            }
        };
        Zone.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('state', inv.state);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        return Zone;
    }(ApiHeader.ZoneInventory));
    MZone.Zone = Zone;
    var ZoneManager = (function () {
        function ZoneManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        ZoneManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        ZoneManager.prototype.query = function (qobj, callback) {
            var msg = new ApiHeader.APIQueryZoneMsg();
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
                var zones = [];
                ret.inventories.forEach(function (inv) {
                    var z = new Zone();
                    angular.extend(z, inv);
                    zones.push(new kendo.data.ObservableObject(z));
                });
                callback(zones, ret.total);
            });
        };
        ZoneManager.prototype.create = function (zone, done) {
            var _this = this;
            var msg = new ApiHeader.APICreateZoneMsg();
            msg.name = zone.name;
            msg.description = zone.description;
            this.api.asyncApi(msg, function (ret) {
                var z = new Zone();
                angular.extend(z, ret.inventory);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Created new zone: {0}', z.name),
                    link: Utils.sprintf('/#/zone/{0}', z.uuid)
                });
                done(new kendo.data.ObservableObject(z));
            });
        };
        ZoneManager.prototype.disable = function (zone) {
            var _this = this;
            zone.progressOn();
            var msg = new ApiHeader.APIChangeZoneStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = zone.uuid;
            this.api.asyncApi(msg, function (ret) {
                zone.updateObservableObject(ret.inventory);
                zone.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled zone: {0}', zone.name),
                    link: Utils.sprintf('/#/zone/{0}', zone.uuid)
                });
            });
        };
        ZoneManager.prototype.enable = function (zone) {
            var _this = this;
            zone.progressOn();
            var msg = new ApiHeader.APIChangeZoneStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = zone.uuid;
            this.api.asyncApi(msg, function (ret) {
                zone.updateObservableObject(ret.inventory);
                zone.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled zone: {0}', zone.name),
                    link: Utils.sprintf('/#/zone/{0}', zone.uuid)
                });
            });
        };
        ZoneManager.prototype["delete"] = function (zone, done) {
            var _this = this;
            zone.progressOn();
            var msg = new ApiHeader.APIDeleteZoneMsg();
            msg.uuid = zone.uuid;
            this.api.asyncApi(msg, function (ret) {
                zone.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted zone: {0}', zone.name)
                });
                done(ret);
            });
        };
        return ZoneManager;
    }());
    ZoneManager.$inject = ['Api'];
    MZone.ZoneManager = ZoneManager;
    var ZoneModel = (function () {
        function ZoneModel() {
            this.current = new Zone();
        }
        ZoneModel.prototype.resetCurrent = function () {
            this.current = null;
        };
        ZoneModel.prototype.setCurrent = function ($scope, zone) {
            this.current = zone;
        };
        return ZoneModel;
    }());
    MZone.ZoneModel = ZoneModel;
    var CreateZoneModel = (function () {
        function CreateZoneModel() {
            this.name = Utils.shortHashName('zone');
        }
        CreateZoneModel.prototype.canCreate = function () {
            return angular.isDefined(this.name);
        };
        return CreateZoneModel;
    }());
    MZone.CreateZoneModel = CreateZoneModel;
    var Action = (function () {
        function Action($scope, zoneMgr) {
            this.$scope = $scope;
            this.zoneMgr = zoneMgr;
        }
        Action.prototype.enable = function () {
            this.zoneMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.zoneMgr.disable(this.$scope.model.current);
        };
        Action.prototype.createCluster = function (win) {
            this.$scope.optionsCreateCluster.zone = this.$scope.model.current;
            win.open();
        };
        Action.prototype.createL2Network = function () {
            this.$scope.optionsCreateL2Network.zone = this.$scope.model.current;
            this.$scope.winNewL2Network.open();
        };
        Action.prototype.addPrimaryStorage = function () {
            this.$scope.winNewPrimaryStorage.open();
        };
        Action.prototype.attachBackupStorage = function () {
        };
        return Action;
    }());
    var DetailsController = (function () {
        function DetailsController($scope, zoneMgr, api, clusterMgr, $location, $routeParams, tagService, psMgr, current, l2Mgr, bsMgr) {
            var _this = this;
            this.$scope = $scope;
            this.zoneMgr = zoneMgr;
            this.api = api;
            this.clusterMgr = clusterMgr;
            this.$location = $location;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            this.psMgr = psMgr;
            this.l2Mgr = l2Mgr;
            this.bsMgr = bsMgr;
            $scope.model = new ZoneModel();
            $scope.model.current = current;
            $scope.optionsCreateCluster = new MCluster.CreateClusterOptions();
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, zoneMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.funcLoadClusters = function () {
                if (!Utils.notNullnotUndefined($scope.model.current)) {
                    return;
                }
                var qobj = new ApiHeader.QueryObject();
                qobj.addCondition({ name: 'zoneUuid', op: '=', value: $scope.model.current.uuid });
                _this.clusterMgr.query(qobj, function (clusters) {
                    $scope.optionsClusterGrid.dataSource.data(new kendo.data.ObservableArray(clusters));
                });
            };
            $scope.optionsDeleteZone = {
                confirm: function () {
                    zoneMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.current = null;
                    });
                },
                title: 'DELETE ZONE',
                description: 'Deleting zone will cause all sub resources(e.g Cluster, Host, VM) being deleted and no way to recover'
            };
            $scope.optionsCreateL2Network = {
                zone: null,
                done: function (l2) {
                    $scope.optionsL2NetworkGrid.dataSource.insert(0, l2);
                }
            };
            $scope.optionsClusterGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'name',
                        title: '{{"zone.ts.NAME" | translate}}',
                        width: '20%',
                        template: '<a href="/\\#/cluster/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                    },
                    {
                        field: 'description',
                        title: '{{"zone.ts.DESCRIPTION" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'state',
                        title: '{{"zone.ts.STATE" | translate}}',
                        width: '20%',
                        template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                    },
                    {
                        field: 'hypervisorType',
                        title: '{{"zone.ts.HYPERVISOR" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'uuid',
                        title: '{{"zone.ts.UUID" | translate}}',
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
                    data: new kendo.data.ObservableArray([])
                })
            };
            $scope.optionsCreatePrimaryStorage = {
                zone: current,
                done: function (ps) {
                    $scope.optionsPrimaryStorageGrid.dataSource.insert(0, ps);
                }
            };
            $scope.funcLoadPrimaryStorage = function () {
                $scope.optionsPrimaryStorageGrid.dataSource.read();
            };
            $scope.optionsPrimaryStorageGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'name',
                        title: '{{"zone.ts.NAME" | translate}}',
                        width: '10%',
                        template: '<a href="/\\#/primaryStorage/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                    },
                    {
                        field: 'description',
                        title: '{{"zone.ts.DESCRIPTION" | translate}}',
                        width: '15%'
                    },
                    {
                        field: 'url',
                        title: '{{"zone.ts.URL" | translate}}',
                        width: '16%'
                    },
                    {
                        field: 'totalCapacity',
                        title: '{{"zone.ts.TOTAL CAPACITY" | translate}}',
                        width: '8%'
                    },
                    {
                        field: 'availableCapacity',
                        title: '{{"zone.ts.AVAILABLE CAPACITY" | translate}}',
                        width: '8%'
                    },
                    {
                        field: 'type',
                        title: '{{"zone.ts.TYPE" | translate}}',
                        width: '10%'
                    },
                    {
                        field: 'state',
                        title: '{{"zone.ts.STATE" | translate}}',
                        width: '15%',
                        template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                    },
                    {
                        field: 'uuid',
                        title: '{{"zone.ts.UUID" | translate}}',
                        width: '20%'
                    }
                ],
                dataBound: function (e) {
                    var grid = e.sender;
                    if (grid.dataSource.totalPages() <= 1) {
                        grid.pager.element.hide();
                    }
                },
                dataSource: new kendo.data.DataSource({
                    schema: {
                        data: 'data',
                        total: 'total'
                    },
                    transport: {
                        read: function (options) {
                            if (!Utils.notNullnotUndefined($scope.model.current.uuid)) {
                                options.success({
                                    data: [],
                                    total: 0
                                });
                                return;
                            }
                            var qobj = new ApiHeader.QueryObject();
                            qobj.limit = options.data.take;
                            qobj.start = options.data.pageSize * (options.data.page - 1);
                            qobj.addCondition({
                                name: 'zoneUuid',
                                op: '=',
                                value: $scope.model.current.uuid
                            });
                            psMgr.query(qobj, function (pss, total) {
                                options.success({
                                    data: pss,
                                    total: total
                                });
                            });
                        }
                    }
                })
            };
            $scope.optionsL2NetworkGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'name',
                        title: '{{"zone.ts.NAME" | translate}}',
                        width: '10%',
                        template: '<a href="/\\#/l2Network/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                    },
                    {
                        field: 'description',
                        title: '{{"zone.ts.DESCRIPTION" | translate}}',
                        width: '25%'
                    },
                    {
                        field: 'physicalInterface',
                        title: '{{"zone.ts.PHYSICAL INTERFACE" | translate}}',
                        width: '25%'
                    },
                    {
                        field: 'type',
                        title: '{{"zone.ts.TYPE" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'uuid',
                        title: '{{"zone.ts.UUID" | translate}}',
                        width: '20%'
                    }
                ],
                dataBound: function (e) {
                    var grid = e.sender;
                    if (grid.dataSource.totalPages() <= 1) {
                        grid.pager.element.hide();
                    }
                },
                dataSource: new kendo.data.DataSource({
                    schema: {
                        data: 'data',
                        total: 'total'
                    },
                    transport: {
                        read: function (options) {
                            if (!Utils.notNullnotUndefined($scope.model.current.uuid)) {
                                options.success({
                                    data: [],
                                    total: 0
                                });
                                return;
                            }
                            var qobj = new ApiHeader.QueryObject();
                            qobj.limit = options.data.take;
                            qobj.start = options.data.pageSize * (options.data.page - 1);
                            qobj.addCondition({
                                name: 'zoneUuid',
                                op: '=',
                                value: $scope.model.current.uuid
                            });
                            l2Mgr.query(qobj, function (l2s, total) {
                                options.success({
                                    data: l2s,
                                    total: total
                                });
                            });
                        }
                    }
                })
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeZoneVO, function (ret) {
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
            $scope.optionsBackupStorageGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'name',
                        title: '{{"zone.ts.NAME" | translate}}',
                        width: '10%',
                        template: '<a href="/\\#/backupStorage/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                    },
                    {
                        field: 'totalCapacity',
                        title: '{{"zone.ts.TOTAL CAPACITY" | translate}}',
                        width: '10%'
                    },
                    {
                        field: 'availableCapacity',
                        title: '{{"zone.ts.AVAILABLE CAPACITY" | translate}}',
                        width: '10%'
                    },
                    {
                        field: 'type',
                        title: '{{"zone.ts.TYPE" | translate}}',
                        width: '10%'
                    },
                    {
                        field: 'state',
                        title: '{{"zone.ts.STATE" | translate}}',
                        width: '20%',
                        template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                    },
                    {
                        field: 'status',
                        title: '{{"zone.ts.STATUS" | translate}}',
                        width: '20%',
                        template: '<span class="{{dataItem.statusLabel()}}">{{dataItem.status}}</span>'
                    },
                    {
                        field: 'uuid',
                        title: '{{"zone.ts.UUID" | translate}}',
                        width: '20%'
                    }
                ],
                dataBound: function (e) {
                    var grid = e.sender;
                    if (grid.dataSource.totalPages() <= 1) {
                        grid.pager.element.hide();
                    }
                },
                dataSource: new kendo.data.DataSource({
                    schema: {
                        data: 'data',
                        total: 'total'
                    },
                    transport: {
                        read: function (options) {
                            var qobj = new ApiHeader.QueryObject();
                            qobj.limit = options.data.take;
                            qobj.start = options.data.pageSize * (options.data.page - 1);
                            qobj.addCondition({
                                name: 'attachedZoneUuids',
                                op: 'in',
                                value: [current.uuid].join()
                            });
                            bsMgr.query(qobj, function (bss, total) {
                                options.success({
                                    data: bss,
                                    total: total
                                });
                            });
                        }
                    }
                })
            };
        }
        DetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.zoneMgr.query(qobj, function (zones, total) {
                _this.$scope.model.current = zones[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'ZoneManager', 'Api', 'ClusterManager', '$location', '$routeParams', 'Tag',
        'PrimaryStorageManager', 'current', 'L2NetworkManager', 'BackupStorageManager'];
    MZone.DetailsController = DetailsController;
    var FilterBy = (function () {
        function FilterBy() {
            this.state = 'All';
        }
        FilterBy.prototype.useState = function () {
            if (this.state == 'All') {
                this.buttonName = 'state:all';
            }
            else if (this.state == 'Enabled') {
                this.buttonName = 'state:Enabled';
            }
            else if (this.state == 'Disabled') {
                this.buttonName = 'state:Disabled';
            }
            return this.state;
        };
        return FilterBy;
    }());
    MZone.FilterBy = FilterBy;
    var Controller = (function () {
        function Controller($scope, zoneMgr, api, $location) {
            var _this = this;
            this.$scope = $scope;
            this.zoneMgr = zoneMgr;
            this.api = api;
            this.$location = $location;
            $scope.action = new Action($scope, zoneMgr);
            $scope.funcCreateZone = function (win) {
                $scope.modelCreateZone = new CreateZoneModel();
                win.center();
                win.open();
            };
            $scope.funcCreateZoneDone = function (win) {
                zoneMgr.create($scope.modelCreateZone, function (ret) {
                    $scope.model.resetCurrent();
                    $scope.optionsZoneGrid.dataSource.insert(0, ret);
                });
                win.close();
            };
            $scope.funcCreateZoneCancel = function (win) {
                win.close();
            };
            $scope.funcRefresh = function () {
                var grid = $scope.zoneGrid;
                grid.dataSource.read();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                if ($scope.model.current == null) {
                    return true;
                }
                return $scope.model.current.isInProgress();
            };
            $scope.funcShowPopoverSortedBy = function (popover) {
                popover.toggle();
            };
            $scope.filterBy = new FilterBy();
            $scope.filterBy.useState();
            $scope.funcShowPopoverFilterBy = function (popover) {
                popover.toggle();
            };
            $scope.funcFilterByConfirm = function (popover) {
                var grid = $scope.zoneGrid;
                var state = $scope.filterBy.useState();
                if (state === 'All') {
                    grid.dataSource.filter(null);
                }
                else {
                    grid.dataSource.filter({
                        field: 'state',
                        operator: 'eq',
                        value: state
                    });
                }
                popover.toggle();
            };
            $scope.popoverFilterBy = function (popover) {
                popover.toggle();
            };
            $scope.funcSearch = function (search) {
                search.open();
            };
            $scope.optionsCreateL2Network = {
                zone: null,
                done: function (l2) {
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.ZoneInventoryQueryable,
                name: 'ZONE',
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
                    console.log(JSON.stringify(ret));
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = ret;
                    zoneMgr.query(qobj, function (zones, total) {
                        $scope.model.resetCurrent();
                        $scope.optionsZoneGrid.dataSource.data(zones);
                    });
                }
            };
            $scope.optionsCreatePrimaryStorage = {
                zone: null,
                done: function (ps) {
                }
            };
            $scope.$watch(function () {
                return $scope.model.current;
            }, function () {
                $scope.optionsCreatePrimaryStorage.zone = $scope.model.current;
            });
            $scope.optionsNewZone = {
                width: "480px",
                animation: false,
                modal: true,
                draggable: false,
                resizable: false
            };
            $scope.model = new ZoneModel();
            $scope.optionsDeleteZone = {
                confirm: function () {
                    zoneMgr["delete"]($scope.model.current, function (ret) {
                        var row = $scope.optionsZoneGrid.dataSource.getByUid(_this.$scope.model.current.uid);
                        $scope.model.resetCurrent();
                        $scope.optionsZoneGrid.dataSource.remove(row);
                    });
                },
                title: 'DELETE ZONE',
                description: 'Deleting zone will cause all sub resources(e.g Cluster, Host, VM) being deleted and no way to recover'
            };
            $scope.funcDeleteZone = function (win) {
                win.open();
            };
            $scope.optionsCreateCluster = new MCluster.CreateClusterOptions();
            $scope.optionsSortBy = {
                done: function (ret) {
                    zoneMgr.setSortBy(ret);
                    $scope.optionsZoneGrid.dataSource.read();
                    $scope.model.resetCurrent();
                },
                fields: [
                    {
                        name: '{{"zone.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"zone.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"zone.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"zone.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ]
            };
            $scope.funcZoneGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/zone/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.optionsZoneGrid = {
                change: function (e) {
                    var grid = e.sender;
                    var selected = grid.select();
                    Utils.safeApply($scope, function () {
                        $scope.model.setCurrent($scope, grid.dataItem(selected));
                    });
                },
                columns: [
                    {
                        field: 'name',
                        title: '{{"zone.ts.NAME" | translate}}',
                        width: '20%',
                        template: '<span><div class="{{dataItem.gridColumnLabel()}}"></div><i class="fa fa-spinner fa-spin" ng-show="dataItem.isInProgress()"></i><a href="/\\#/zone/{{dataItem.uuid}}"><span>#: name #</span></a></span>'
                    },
                    {
                        field: 'description',
                        title: '{{"zone.ts.DESCRIPTION" | translate}}',
                        width: '30%'
                    },
                    {
                        field: 'state',
                        title: '{{"zone.ts.STATE" | translate}}',
                        width: '20%',
                        template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                    },
                    {
                        field: 'uuid',
                        title: '{{"zone.ts.UUID" | translate}}',
                        width: '30%'
                    }
                ],
                resizable: true,
                scrollable: true,
                selectable: true,
                pageable: true,
                dataBound: function (e) {
                    var grid = e.sender;
                    if (grid.dataSource.totalPages() == 1) {
                        grid.pager.element.hide();
                    }
                    var selected = null;
                    if ($scope.model.current) {
                        selected = $scope.model.current;
                    }
                    else {
                        selected = grid.dataSource.data()[0];
                    }
                    if (selected) {
                        var row = grid.table.find('tr[data-uid="' + selected.uid + '"]');
                        grid.select(row);
                    }
                },
                dataSource: new kendo.data.DataSource({
                    transport: {
                        read: function (options) {
                            console.log(JSON.stringify(options));
                            var qobj = new ApiHeader.QueryObject();
                            qobj.limit = options.data.take;
                            qobj.start = options.data.pageSize * (options.data.page - 1);
                            zoneMgr.query(qobj, function (zones, total) {
                                options.success({
                                    data: zones,
                                    total: total
                                });
                            });
                        }
                    },
                    serverPaging: true,
                    pageSize: 20,
                    schema: {
                        data: 'data',
                        total: 'total'
                    }
                })
            };
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'ZoneManager', 'Api', '$location'];
    MZone.Controller = Controller;
})(MZone || (MZone = {}));
angular.module('root').factory('ZoneManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MZone.ZoneManager(api, $rootScope);
}]).config(['$routeProvider', function (route) {
    route.when('/zone', {
        templateUrl: '/static/templates/zone/zone.html',
        controller: 'MZone.Controller'
    }).when('/zone/:uuid', {
        templateUrl: '/static/templates/zone/details.html',
        controller: 'MZone.DetailsController',
        resolve: {
            current: function ($q, $route, ZoneManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var uuid = $route.current.params.uuid;
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                ZoneManager.query(qobj, function (zones) {
                    var z = zones[0];
                    defer.resolve(z);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />