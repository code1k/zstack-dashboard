var MCluster;
(function (MCluster) {
    var Cluster = (function (_super) {
        __extends(Cluster, _super);
        function Cluster() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Cluster.prototype.progressOn = function () {
            this.inProgress = true;
        };
        Cluster.prototype.progressOff = function () {
            this.inProgress = false;
        };
        Cluster.prototype.isInProgress = function () {
            return this.inProgress;
        };
        Cluster.prototype.isEnableShow = function () {
            return this.state == 'Disabled';
        };
        Cluster.prototype.isDisableShow = function () {
            return this.state == 'Enabled';
        };
        Cluster.prototype.stateLabel = function () {
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
        Cluster.prototype.gridColumnLabel = function () {
            if (this.state == 'Enabled') {
                return 'z-color-box-green';
            }
            else if (this.state == 'Disabled') {
                return 'z-color-box-red';
            }
        };
        Cluster.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('hypervisorType', inv.hypervisorType);
            self.set('state', inv.state);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        return Cluster;
    }(ApiHeader.ClusterInventory));
    MCluster.Cluster = Cluster;
    var ClusterManager = (function () {
        function ClusterManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        ClusterManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        ClusterManager.prototype.wrap = function (cluster) {
            return new kendo.data.ObservableObject(cluster);
        };
        ClusterManager.prototype.create = function (cluster, done) {
            var _this = this;
            var msg = new ApiHeader.APICreateClusterMsg();
            msg.name = cluster.name;
            msg.description = cluster.description;
            msg.hypervisorType = cluster.hypervisorType;
            msg.zoneUuid = cluster.zoneUuid;
            this.api.asyncApi(msg, function (ret) {
                var c = new Cluster();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Created new cluster: {0}', c.name),
                    link: Utils.sprintf('/#/cluster/{0}', c.uuid)
                });
            });
        };
        ClusterManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryClusterMsg();
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
                var clusters = [];
                ret.inventories.forEach(function (inv) {
                    var c = new Cluster();
                    angular.extend(c, inv);
                    clusters.push(_this.wrap(c));
                });
                callback(clusters, ret.total);
            });
        };
        ClusterManager.prototype.detachPrimaryStorage = function (cluster, ps, done) {
            var _this = this;
            if (done === void 0) { done = null; }
            cluster.progressOn();
            var msg = new ApiHeader.APIDetachPrimaryStorageFromClusterMsg();
            msg.primaryStorageUuid = ps.uuid;
            msg.clusterUuid = cluster.uuid;
            this.api.asyncApi(msg, function (ret) {
                cluster.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Detached cluster: {0} from primary storage: {1}', cluster.name, ps.name),
                    link: Utils.sprintf('/#/cluster/{0}', cluster.uuid)
                });
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
            });
        };
        ClusterManager.prototype.attachPrimaryStorage = function (cluster, ps, callback) {
            var _this = this;
            if (callback === void 0) { callback = null; }
            cluster.progressOn();
            var msg = new ApiHeader.APIAttachPrimaryStorageToClusterMsg();
            msg.clusterUuid = cluster.uuid;
            msg.primaryStorageUuid = ps.uuid;
            this.api.asyncApi(msg, function (ret) {
                cluster.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Attached cluster: {0} to primary storage: {1}', cluster.name, ps.name),
                    link: Utils.sprintf('/#/cluster/{0}', cluster.uuid)
                });
                if (Utils.notNullnotUndefined(callback)) {
                    callback();
                }
            });
        };
        ClusterManager.prototype.attachL2Network = function (cluster, l2, done) {
            var _this = this;
            if (done === void 0) { done = null; }
            cluster.progressOn();
            var msg = new ApiHeader.APIAttachL2NetworkToClusterMsg();
            msg.clusterUuid = cluster.uuid;
            msg.l2NetworkUuid = l2.uuid;
            this.api.asyncApi(msg, function (ret) {
                cluster.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Attached cluster: {0} to l2 network: {1}', cluster.name, l2.name),
                    link: Utils.sprintf('/#/cluster/{0}', cluster.uuid)
                });
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
            });
        };
        ClusterManager.prototype.detachL2Network = function (cluster, l2, done) {
            var _this = this;
            if (done === void 0) { done = null; }
            cluster.progressOn();
            var msg = new ApiHeader.APIDetachL2NetworkFromClusterMsg();
            msg.clusterUuid = cluster.uuid;
            msg.l2NetworkUuid = l2.uuid;
            this.api.asyncApi(msg, function (ret) {
                cluster.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Detached cluster: {0} from l2 network: {1}', cluster.name, l2.name),
                    link: Utils.sprintf('/#/cluster/{0}', cluster.uuid)
                });
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
            });
        };
        ClusterManager.prototype.disable = function (cluster) {
            var _this = this;
            cluster.progressOn();
            var msg = new ApiHeader.APIChangeClusterStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = cluster.uuid;
            this.api.asyncApi(msg, function (ret) {
                cluster.updateObservableObject(ret.inventory);
                cluster.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled cluster: {0}', cluster.name),
                    link: Utils.sprintf('/#/cluster/{0}', cluster.uuid)
                });
            });
        };
        ClusterManager.prototype.enable = function (cluster) {
            var _this = this;
            cluster.progressOn();
            var msg = new ApiHeader.APIChangeClusterStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = cluster.uuid;
            this.api.asyncApi(msg, function (ret) {
                cluster.updateObservableObject(ret.inventory);
                cluster.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled cluster: {0}', cluster.name),
                    link: Utils.sprintf('/#/cluster/{0}', cluster.uuid)
                });
            });
        };
        ClusterManager.prototype["delete"] = function (cluster, done) {
            var _this = this;
            cluster.progressOn();
            var msg = new ApiHeader.APIDeleteClusterMsg();
            msg.uuid = cluster.uuid;
            this.api.asyncApi(msg, function (ret) {
                cluster.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted cluster: {0}', cluster.name)
                });
            });
        };
        return ClusterManager;
    }());
    ClusterManager.$inject = ['Api', '$rootScope'];
    MCluster.ClusterManager = ClusterManager;
    var ClusterModel = (function (_super) {
        __extends(ClusterModel, _super);
        function ClusterModel() {
            var _this = _super.call(this) || this;
            _this.current = new Cluster();
            return _this;
        }
        return ClusterModel;
    }(Utils.Model));
    MCluster.ClusterModel = ClusterModel;
    var OClusterGrid = (function (_super) {
        __extends(OClusterGrid, _super);
        function OClusterGrid($scope, clusterMgr) {
            var _this = _super.call(this) || this;
            _this.clusterMgr = clusterMgr;
            _super.prototype.init.call(_this, $scope, $scope.clusterGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"cluster.ts.NAME" | translate}}',
                    width: '15%',
                    template: '<a href="/\\#/cluster/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'description',
                    title: '{{"cluster.ts.DESCRIPTION" | translate}}',
                    width: '25%'
                },
                {
                    field: 'hypervisorType',
                    title: '{{"cluster.ts.HYPERVISOR" | translate}}',
                    width: '15%'
                },
                {
                    field: 'state',
                    title: '{{"cluster.ts.STATE" | translate}}',
                    width: '15%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'uuid',
                    title: '{{"cluster.ts.UUID" | translate}}',
                    width: '30%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                clusterMgr.query(qobj, function (clusters, total) {
                    options.success({
                        data: clusters,
                        total: total
                    });
                });
            };
            return _this;
        }
        return OClusterGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, clusterMgr) {
            this.$scope = $scope;
            this.clusterMgr = clusterMgr;
        }
        Action.prototype.enable = function () {
            this.clusterMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.clusterMgr.disable(this.$scope.model.current);
        };
        Action.prototype.addHost = function () {
            this.$scope.winNewHost.open();
        };
        Action.prototype.attachL2Network = function () {
            this.$scope.winAttachL2Network.open();
        };
        Action.prototype.detachL2Network = function () {
            this.$scope.winDetachL2Network.open();
        };
        Action.prototype.attachPrimaryStorage = function () {
            this.$scope.winAttachPrimaryStorage.open();
        };
        Action.prototype.detachPrimaryStorage = function () {
            this.$scope.winDetachPrimaryStorage.open();
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
                            name: '{{"cluster.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"cluster.ts.State" | translate}}',
                            value: FilterBy.STATE
                        },
                        {
                            name: '{{"cluster.ts.Hypervisor" | translate}}',
                            value: FilterBy.HYPERVISOR
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
                else if (_this.field == FilterBy.HYPERVISOR) {
                    _this.valueList.dataSource.data(_this.hypervisorTypes);
                }
            });
        }
        FilterBy.prototype.confirm = function (popover) {
            console.log(JSON.stringify(this.toKendoFilter()));
            this.$scope.oClusterGrid.setFilter(this.toKendoFilter());
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
    FilterBy.HYPERVISOR = 'hypervisorType';
    var DetailsController = (function () {
        function DetailsController($scope, clusterMgr, $routeParams, tagService, psMgr, current, l2Mgr, hostMgr) {
            var _this = this;
            this.$scope = $scope;
            this.clusterMgr = clusterMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            this.psMgr = psMgr;
            this.current = current;
            this.l2Mgr = l2Mgr;
            this.hostMgr = hostMgr;
            $scope.model = new ClusterModel();
            $scope.model.current = current;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, clusterMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteCluster = {
                title: 'DELETE CLUSTER',
                description: 'Deleting cluster will cause all sub resources(e.g Host, VM) being deleted and no way to recover',
                confirm: function () {
                    clusterMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeClusterVO, function (ret) {
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
            $scope.optionsAttachL2Network = {
                cluster: $scope.model.current,
                done: function (l2) {
                    $scope.optionsL2NetworkGrid.dataSource.insert(0, l2);
                }
            };
            $scope.optionsDetachL2Network = {
                cluster: $scope.model.current,
                done: function (l2) {
                    var ds = $scope.optionsL2NetworkGrid.dataSource;
                    var l2s = ds.data();
                    for (var i = 0; i < l2s.length; i++) {
                        var tl2 = l2s[i];
                        if (l2.uuid == tl2.uuid) {
                            var row = ds.getByUid(tl2.uid);
                            ds.remove(row);
                            break;
                        }
                    }
                }
            };
            $scope.optionsAttachPrimaryStorage = {
                cluster: $scope.model.current,
                done: function (ps) {
                    $scope.optionsPrimaryStorageGrid.dataSource.insert(0, ps);
                }
            };
            $scope.optionsDetachPrimaryStorage = {
                cluster: $scope.model.current,
                done: function (ps) {
                    var ds = $scope.optionsPrimaryStorageGrid.dataSource;
                    var pss = ds.data();
                    for (var i = 0; i < pss.length; i++) {
                        var tps = pss[i];
                        if (ps.uuid == tps.uuid) {
                            var row = ds.getByUid(tps.uid);
                            ds.remove(row);
                            break;
                        }
                    }
                }
            };
            $scope.optionsCreateHost = {
                done: function (info) {
                    hostMgr.create(info, function (ret) {
                        $scope.optionsHostGrid.dataSource.read();
                    });
                }
            };
            $scope.optionsHostGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'name',
                        title: '{{"cluster.ts.NAME" | translate}}',
                        width: '25%',
                        template: '<a href="/\\#/host/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                    },
                    {
                        field: 'description',
                        title: '{{"cluster.ts.DESCRIPTION" | translate}}',
                        width: '25%'
                    },
                    {
                        field: 'managementIp',
                        title: '{{"cluster.ts.MANAGEMENT IP" | translate}}',
                        width: '25%'
                    },
                    {
                        field: 'uuid',
                        title: '{{"cluster.ts.UUID" | translate}}',
                        width: '25%'
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
                                name: 'clusterUuid',
                                op: '=',
                                value: $scope.model.current.uuid
                            });
                            hostMgr.query(qobj, function (hosts, total) {
                                options.success({
                                    data: hosts,
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
                        title: '{{"cluster.ts.NAME" | translate}}',
                        width: '10%',
                        template: '<a href="/\\#/l2Network/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                    },
                    {
                        field: 'description',
                        title: '{{"cluster.ts.DESCRIPTION" | translate}}',
                        width: '25%'
                    },
                    {
                        field: 'physicalInterface',
                        title: '{{"cluster.ts.PHYSICAL INTERFACE" | translate}}',
                        width: '25%'
                    },
                    {
                        field: 'type',
                        title: '{{"cluster.ts.TYPE" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'uuid',
                        title: '{{"cluster.ts.UUID" | translate}}',
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
                                name: 'attachedClusterUuids',
                                op: 'in',
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
                        title: '{{"cluster.ts.NAME" | translate}}',
                        width: '10%',
                        template: '<a href="/\\#/primaryStorage/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                    },
                    {
                        field: 'description',
                        title: '{{"cluster.ts.DESCRIPTION" | translate}}',
                        width: '15%'
                    },
                    {
                        field: 'url',
                        title: '{{"cluster.ts.URL" | translate}}',
                        width: '16%'
                    },
                    {
                        field: 'totalCapacity',
                        title: '{{"cluster.ts.TOTAL CAPACITY" | translate}}',
                        width: '8%'
                    },
                    {
                        field: 'availableCapacity',
                        title: '{{"cluster.ts.AVAILABLE CAPACITY" | translate}}',
                        width: '8%'
                    },
                    {
                        field: 'type',
                        title: '{{"cluster.ts.TYPE" | translate}}',
                        width: '10%'
                    },
                    {
                        field: 'state',
                        title: '{{"cluster.ts.STATE" | translate}}',
                        width: '15%',
                        template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                    },
                    {
                        field: 'uuid',
                        title: '{{"cluster.ts.UUID" | translate}}',
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
                                name: 'attachedClusterUuids',
                                op: 'in',
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
        }
        DetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.clusterMgr.query(qobj, function (clusters, total) {
                _this.$scope.model.current = clusters[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'ClusterManager', '$routeParams', 'Tag', 'PrimaryStorageManager', 'current', 'L2NetworkManager', 'HostManager'];
    MCluster.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, clusterMgr, hypervisorTypes, $location, hostMgr) {
            this.$scope = $scope;
            this.clusterMgr = clusterMgr;
            this.hypervisorTypes = hypervisorTypes;
            this.$location = $location;
            this.hostMgr = hostMgr;
            $scope.model = new ClusterModel();
            $scope.oClusterGrid = new OClusterGrid($scope, clusterMgr);
            $scope.action = new Action($scope, clusterMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"cluster.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"cluster.ts.Description" | translate}}',
                        value: 'Description'
                    },
                    {
                        name: '{{"cluster.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"cluster.ts.Hypervisor" | translate}}',
                        value: 'hypervisorType'
                    },
                    {
                        name: '{{"cluster.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"cluster.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    clusterMgr.setSortBy(ret);
                    $scope.oClusterGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.ClusterInventoryQueryable,
                name: 'CLUSTER',
                schema: {
                    state: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['Enabled', 'Disabled']
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
                    clusterMgr.query(qobj, function (clusters, total) {
                        $scope.oClusterGrid.refresh(clusters);
                    });
                }
            };
            $scope.optionsAttachPrimaryStorage = {
                cluster: $scope.model.current,
                done: function (ps) {
                }
            };
            $scope.optionsDetachPrimaryStorage = {
                cluster: $scope.model.current,
                done: function (ps) {
                }
            };
            $scope.optionsAttachL2Network = {
                cluster: $scope.model.current,
                done: function (l2) {
                }
            };
            $scope.optionsDetachL2Network = {
                cluster: $scope.model.current,
                done: function (l2) {
                }
            };
            $scope.$watch(function () {
                return $scope.model.current;
            }, function () {
                $scope.optionsAttachPrimaryStorage.cluster = $scope.model.current;
                $scope.optionsDetachPrimaryStorage.cluster = $scope.model.current;
                $scope.optionsAttachL2Network.cluster = $scope.model.current;
                $scope.optionsDetachL2Network.cluster = $scope.model.current;
            });
            $scope.funcClusterGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/cluster/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope, this.hypervisorTypes);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateCluster = function (win) {
                win.open();
            };
            $scope.funcDeleteCluster = function (win) {
                $scope.deleteCluster.open();
            };
            $scope.optionsDeleteCluster = {
                title: 'DELETE CLUSTER',
                description: 'Deleting cluster will cause all sub resources(e.g Host, VM) being deleted and no way to recover',
                confirm: function () {
                    clusterMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oClusterGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oClusterGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateCluster = {
                done: function (cluster) {
                    $scope.oClusterGrid.add(cluster);
                }
            };
            $scope.optionsCreateHost = {
                done: function (info) {
                    hostMgr.create(info, function (ret) {
                    });
                }
            };
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'ClusterManager', 'hypervisorTypes', '$location', 'HostManager'];
    MCluster.Controller = Controller;
    var CreateClusterOptions = (function () {
        function CreateClusterOptions() {
        }
        return CreateClusterOptions;
    }());
    MCluster.CreateClusterOptions = CreateClusterOptions;
    var CreateCluster = (function () {
        function CreateCluster(api, zoneMgr, clusterMgr, psMgr, l2Mgr) {
            var _this = this;
            this.api = api;
            this.zoneMgr = zoneMgr;
            this.clusterMgr = clusterMgr;
            this.psMgr = psMgr;
            this.l2Mgr = l2Mgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateCluster;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new CreateClusterOptions();
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
                    zoneUuid: null,
                    description: null,
                    hypervisorType: null,
                    canMoveToPrevious: function () {
                        return false;
                    },
                    hasZone: function () {
                        return $scope.zoneList.dataSource.data().length > 0;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.zoneUuid)
                            && Utils.notNullnotUndefined(this.hypervisorType);
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createClusterInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createClusterInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName("cluster");
                        this.zoneUuid = null;
                        this.description = null;
                        this.hypervisorType = null;
                        this.activeState = false;
                    }
                };
                var psPage = $scope.psPage = {
                    activeState: false,
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return true;
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createClusterPrimaryStorage"]');
                    },
                    hasPrimaryStorage: function () {
                        return $scope.primaryStorageListOptions__.dataSource.data().length > 0;
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createClusterPrimaryStorage';
                    },
                    reset: function () {
                        this.activeState = false;
                    }
                };
                var l2Page = $scope.l2Page = {
                    activeState: false,
                    hasL2Netwwork: function () {
                        return $scope.l2NetworkListOptions__.dataSource.data().length > 0;
                    },
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return true;
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createClusterL2Network"]');
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createClusterL2Network';
                    },
                    reset: function () {
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
                        var resultCluster;
                        var chain = new Utils.Chain();
                        chain.then(function () {
                            clusterMgr.create(infoPage, function (ret) {
                                resultCluster = ret;
                                chain.next();
                            });
                        }).then(function () {
                            var pss = $scope.primaryStorageList__.dataItems();
                            angular.forEach(pss, function (ps) {
                                clusterMgr.attachPrimaryStorage(resultCluster, ps);
                            });
                            chain.next();
                        }).then(function () {
                            var l2s = $scope.l2NetworkList__.dataItems();
                            angular.forEach(l2s, function (l2) {
                                clusterMgr.attachL2Network(resultCluster, l2);
                            });
                            chain.next();
                        }).done(function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(resultCluster);
                            }
                        }).start();
                        $scope.winCreateCluster__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage, psPage, l2Page
                ], mediator);
                $scope.$watch(function () {
                    return $scope.infoPage.zoneUuid;
                }, function () {
                    if (Utils.notNullnotUndefined($scope.primaryStorageList__)) {
                        $scope.primaryStorageList__.value([]);
                    }
                    var zuuid = $scope.infoPage.zoneUuid;
                    if (Utils.notNullnotUndefined(zuuid)) {
                        _this.queryPrimaryStorages(zuuid, function (pss) {
                            $scope.primaryStorageListOptions__.dataSource.data(pss);
                        });
                        _this.queryL2Networks(zuuid, function (l2s) {
                            $scope.l2NetworkListOptions__.dataSource.data(l2s);
                        });
                    }
                });
                $scope.zoneList = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"cluster.ts.Name" | translate}}</span>: #: name #</div>' + '<div style="color: black"><span class="z-label">{{"cluster.ts.State" | translate}}</span>#: state #</div>' + '<div style="color: black"><span class="z-label">{{"cluster.ts.UUID" | translate}}</span> #: uuid #</div>'
                };
                $scope.hypervisorList = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "type",
                    dataValueField: "type"
                };
                $scope.winCreateClusterOptions__ = {
                    width: "700px",
                    //height: "518px",
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.primaryStorageListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">Type:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">URL:</span><span>#: url #</span></div>'
                };
                $scope.l2NetworkListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">Type:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">Physical Interface:</span><span>#: physicalInterface #</span></div>'
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/cluster/createCluster.html';
        }
        CreateCluster.prototype.queryPrimaryStorages = function (zoneUuid, done) {
            var qobj = new ApiHeader.QueryObject();
            qobj.conditions = [
                {
                    name: 'zoneUuid',
                    op: '=',
                    value: zoneUuid
                }
            ];
            this.psMgr.query(qobj, function (pss) {
                done(pss);
            });
        };
        CreateCluster.prototype.queryL2Networks = function (zoneUuid, done) {
            var qobj = new ApiHeader.QueryObject();
            qobj.conditions = [
                {
                    name: 'zoneUuid',
                    op: '=',
                    value: zoneUuid
                }
            ];
            this.l2Mgr.query(qobj, function (l2s) {
                done(l2s);
            });
        };
        CreateCluster.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateCluster__;
            this.$scope.primaryStorageList__.value([]);
            this.$scope.l2NetworkList__.value([]);
            this.$scope.button.reset();
            var chain = new Utils.Chain();
            chain.then(function () {
                if (Utils.notNullnotUndefined(_this.options.zone)) {
                    _this.$scope.zoneList.dataSource.data(new kendo.data.ObservableArray([_this.options.zone]));
                    _this.$scope.infoPage.zoneUuid = _this.options.zone.uuid;
                    chain.next();
                }
                else {
                    _this.zoneMgr.query(new ApiHeader.QueryObject(), function (zones, total) {
                        _this.$scope.zoneList.dataSource.data(zones);
                        if (zones.length > 0) {
                            _this.$scope.infoPage.zoneUuid = zones[0].uuid;
                        }
                        chain.next();
                    });
                }
            }).then(function () {
                _this.api.getHypervisorTypes(function (hvTypes) {
                    var types = [];
                    angular.forEach(hvTypes, function (item) {
                        types.push({ type: item });
                    });
                    _this.$scope.hypervisorList.dataSource.data(new kendo.data.ObservableArray(types));
                    _this.$scope.model.hypervisorType = hvTypes[0];
                    chain.next();
                });
            }).done(function () {
                win.center();
                win.open();
            }).start();
        };
        return CreateCluster;
    }());
    MCluster.CreateCluster = CreateCluster;
    var AttachL2NetworkOptions = (function () {
        function AttachL2NetworkOptions() {
        }
        return AttachL2NetworkOptions;
    }());
    MCluster.AttachL2NetworkOptions = AttachL2NetworkOptions;
    var ClusterAttachL2Network = (function () {
        function ClusterAttachL2Network(l2Mgr, clusterMgr) {
            var _this = this;
            this.l2Mgr = l2Mgr;
            this.clusterMgr = clusterMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/cluster/attachL2Network.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zClusterAttachL2Network] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.uuid = null;
                _this.l2NetworkListOptions = $scope.l2NetworkListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">Type:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">Physical Interface:</span><span>#: physicalInterface #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.hasL2Network = function () {
                    return $scope.l2NetworkListOptions__.dataSource.data().length > 0;
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.attachL2Network__.close();
                };
                $scope.done = function () {
                    var l2s = $scope.l2NetworkList__.dataItems();
                    angular.forEach(l2s, function (l2) {
                        clusterMgr.attachL2Network(_this.options.cluster, l2, function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(l2);
                            }
                        });
                    });
                    $scope.attachL2Network__.close();
                };
            };
        }
        ClusterAttachL2Network.prototype.open = function () {
            var _this = this;
            this.$scope.l2NetworkList__.value([]);
            var chain = new Utils.Chain();
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'zoneUuid',
                        op: '=',
                        value: _this.options.cluster.zoneUuid
                    },
                    {
                        name: 'attachedClusterUuids',
                        op: 'not in',
                        value: _this.options.cluster.uuid
                    }
                ];
                _this.l2Mgr.query(qobj, function (l2s) {
                    _this.l2NetworkListOptions.dataSource.data(l2s);
                    chain.next();
                });
            }).done(function () {
                _this.$scope.attachL2Network__.center();
                _this.$scope.attachL2Network__.open();
            }).start();
        };
        return ClusterAttachL2Network;
    }());
    MCluster.ClusterAttachL2Network = ClusterAttachL2Network;
    var DetachL2NetworkOptions = (function () {
        function DetachL2NetworkOptions() {
        }
        return DetachL2NetworkOptions;
    }());
    MCluster.DetachL2NetworkOptions = DetachL2NetworkOptions;
    var ClusterDetachL2Network = (function () {
        function ClusterDetachL2Network(l2Mgr, clusterMgr) {
            var _this = this;
            this.l2Mgr = l2Mgr;
            this.clusterMgr = clusterMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/cluster/detachL2Network.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zClusterDetachL2Network] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.uuid = null;
                $scope.l2NetworkListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">Type:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">Physical Interface:</span><span>#: physicalInterface #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.hasL2Network = function () {
                    return $scope.l2NetworkListOptions__.dataSource.data().length > 0;
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.detachL2Network__.close();
                };
                $scope.done = function () {
                    var l2s = $scope.l2NetworkList__.dataItems();
                    angular.forEach(l2s, function (l2) {
                        clusterMgr.detachL2Network(_this.options.cluster, l2, function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(l2);
                            }
                        });
                    });
                    $scope.detachL2Network__.close();
                };
                $scope.detachL2NetworkOptions__ = {
                    width: '600px'
                };
            };
        }
        ClusterDetachL2Network.prototype.open = function () {
            var _this = this;
            this.$scope.l2NetworkList__.value([]);
            var chain = new Utils.Chain();
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'attachedClusterUuids',
                        op: 'in',
                        value: _this.options.cluster.uuid
                    }
                ];
                _this.l2Mgr.query(qobj, function (l2s) {
                    _this.$scope.l2NetworkListOptions__.dataSource.data(l2s);
                    chain.next();
                });
            }).done(function () {
                _this.$scope.detachL2Network__.center();
                _this.$scope.detachL2Network__.open();
            }).start();
        };
        return ClusterDetachL2Network;
    }());
    MCluster.ClusterDetachL2Network = ClusterDetachL2Network;
    var AttachPrimaryStorageOptions = (function () {
        function AttachPrimaryStorageOptions() {
        }
        return AttachPrimaryStorageOptions;
    }());
    MCluster.AttachPrimaryStorageOptions = AttachPrimaryStorageOptions;
    var ClusterAttachPrimaryStorage = (function () {
        function ClusterAttachPrimaryStorage(psMgr, clusterMgr) {
            var _this = this;
            this.psMgr = psMgr;
            this.clusterMgr = clusterMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/cluster/attachPrimaryStorage.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zClusterAttachPrimaryStorage] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.uuid = null;
                _this.primaryStorageListOptions = $scope.primaryStorageListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">Type:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">URL:</span><span>#: url #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.hasPrimaryStorage = function () {
                    return $scope.primaryStorageListOptions__.dataSource.data().length > 0;
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.attachPrimaryStorage__.close();
                };
                $scope.done = function () {
                    var pss = $scope.primaryStorageList__.dataItems();
                    angular.forEach(pss, function (ps) {
                        clusterMgr.attachPrimaryStorage(_this.options.cluster, ps, function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(ps);
                            }
                        });
                    });
                    $scope.attachPrimaryStorage__.close();
                };
            };
        }
        ClusterAttachPrimaryStorage.prototype.open = function () {
            var _this = this;
            this.$scope.primaryStorageList__.value([]);
            var chain = new Utils.Chain();
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'zoneUuid',
                        op: '=',
                        value: _this.options.cluster.zoneUuid
                    },
                    {
                        name: 'attachedClusterUuids',
                        op: 'not in',
                        value: _this.options.cluster.uuid
                    }
                ];
                _this.psMgr.query(qobj, function (pss) {
                    _this.primaryStorageListOptions.dataSource.data(pss);
                    chain.next();
                });
            }).done(function () {
                _this.$scope.attachPrimaryStorage__.center();
                _this.$scope.attachPrimaryStorage__.open();
            }).start();
        };
        return ClusterAttachPrimaryStorage;
    }());
    MCluster.ClusterAttachPrimaryStorage = ClusterAttachPrimaryStorage;
    var DetachPrimaryStorageOptions = (function () {
        function DetachPrimaryStorageOptions() {
        }
        return DetachPrimaryStorageOptions;
    }());
    MCluster.DetachPrimaryStorageOptions = DetachPrimaryStorageOptions;
    var ClusterDetachPrimaryStorage = (function () {
        function ClusterDetachPrimaryStorage(psMgr, clusterMgr) {
            var _this = this;
            this.psMgr = psMgr;
            this.clusterMgr = clusterMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/cluster/detachPrimaryStorage.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zClusterDetachPrimaryStorage] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.uuid = null;
                $scope.primaryStorageListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">Type:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">URL:</span><span>#: url #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.hasPrimaryStorage = function () {
                    return $scope.primaryStorageListOptions__.dataSource.data().length > 0;
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.detachPrimaryStorage__.close();
                };
                $scope.done = function () {
                    var pss = $scope.primaryStorageList__.dataItems();
                    angular.forEach(pss, function (ps) {
                        clusterMgr.detachPrimaryStorage(_this.options.cluster, ps, function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(ps);
                            }
                        });
                    });
                    $scope.detachPrimaryStorage__.close();
                };
                $scope.detachPrimaryStorageOptions__ = {
                    width: '600px'
                };
            };
        }
        ClusterDetachPrimaryStorage.prototype.open = function () {
            var _this = this;
            this.$scope.primaryStorageList__.value([]);
            var chain = new Utils.Chain();
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'attachedClusterUuids',
                        op: 'in',
                        value: _this.options.cluster.uuid
                    }
                ];
                _this.psMgr.query(qobj, function (pss) {
                    _this.$scope.primaryStorageListOptions__.dataSource.data(pss);
                    chain.next();
                });
            }).done(function () {
                _this.$scope.detachPrimaryStorage__.center();
                _this.$scope.detachPrimaryStorage__.open();
            }).start();
        };
        return ClusterDetachPrimaryStorage;
    }());
    MCluster.ClusterDetachPrimaryStorage = ClusterDetachPrimaryStorage;
})(MCluster || (MCluster = {}));
angular.module('root').factory('ClusterManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MCluster.ClusterManager(api, $rootScope);
}]).directive('zCreateCluster', ['Api', 'ZoneManager', 'ClusterManager', 'PrimaryStorageManager', 'L2NetworkManager',
    function (api, zoneMgr, clusterMgr, psMgr, l2Mgr) {
        return new MCluster.CreateCluster(api, zoneMgr, clusterMgr, psMgr, l2Mgr);
    }]).directive('zClusterAttachPrimaryStorage', ['PrimaryStorageManager', 'ClusterManager', function (psMgr, clusterMgr) {
    return new MCluster.ClusterAttachPrimaryStorage(psMgr, clusterMgr);
}]).directive('zClusterDetachPrimaryStorage', ['PrimaryStorageManager', 'ClusterManager', function (psMgr, clusterMgr) {
    return new MCluster.ClusterDetachPrimaryStorage(psMgr, clusterMgr);
}]).directive('zClusterDetachL2Network', ['L2NetworkManager', 'ClusterManager', function (l2Mgr, clusterMgr) {
    return new MCluster.ClusterDetachL2Network(l2Mgr, clusterMgr);
}]).directive('zClusterAttachL2Network', ['L2NetworkManager', 'ClusterManager', function (l2Mgr, clusterMgr) {
    return new MCluster.ClusterAttachL2Network(l2Mgr, clusterMgr);
}]).config(['$routeProvider', function (route) {
    route.when('/cluster', {
        templateUrl: '/static/templates/cluster/cluster.html',
        controller: 'MCluster.Controller',
        resolve: {
            hypervisorTypes: function ($q, Api) {
                var defer = $q.defer();
                Api.getHypervisorTypes(function (hvTypes) {
                    defer.resolve(hvTypes);
                });
                return defer.promise;
            }
        }
    }).when('/cluster/:uuid', {
        templateUrl: '/static/templates/cluster/details.html',
        controller: 'MCluster.DetailsController',
        resolve: {
            current: function ($q, ClusterManager, $route) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var uuid = $route.current.params.uuid;
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                ClusterManager.query(qobj, function (clusters, total) {
                    defer.resolve(clusters[0]);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />