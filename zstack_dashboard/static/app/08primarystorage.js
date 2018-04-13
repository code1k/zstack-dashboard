var MPrimaryStorage;
(function (MPrimaryStorage) {
    var PrimaryStorage = (function (_super) {
        __extends(PrimaryStorage, _super);
        function PrimaryStorage() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        PrimaryStorage.prototype.progressOn = function () {
            this.inProgress = true;
        };
        PrimaryStorage.prototype.progressOff = function () {
            this.inProgress = false;
        };
        PrimaryStorage.prototype.isInProgress = function () {
            return this.inProgress;
        };
        PrimaryStorage.prototype.isEnableShow = function () {
            return this.state == 'Disabled';
        };
        PrimaryStorage.prototype.isDisableShow = function () {
            return this.state == 'Enabled';
        };
        PrimaryStorage.prototype.stateLabel = function () {
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
        PrimaryStorage.prototype.statusLabel = function () {
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
        PrimaryStorage.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('zoneUuid', inv.zoneUuid);
            self.set('url', inv.url);
            self.set('totalCapacity', inv.totalCapacity);
            self.set('availableCapacity', inv.availableCapacity);
            self.set('type', inv.type);
            self.set('state', inv.state);
            self.set('status', inv.status);
            self.set('mountPath', inv.mountPath);
            self.set('attachedClusterUuids', inv.attachedClusterUuids);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        return PrimaryStorage;
    }(ApiHeader.PrimaryStorageInventory));
    MPrimaryStorage.PrimaryStorage = PrimaryStorage;
    var PrimaryStorageManager = (function () {
        function PrimaryStorageManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        PrimaryStorageManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        PrimaryStorageManager.prototype.wrap = function (PrimaryStorage) {
            return new kendo.data.ObservableObject(PrimaryStorage);
        };
        PrimaryStorageManager.prototype.create = function (ps, done) {
            var _this = this;
            var msg = null;
            if (ps.type == 'NFS') {
                msg = new ApiHeader.APIAddNfsPrimaryStorageMsg();
                msg.type = 'NFS';
            }
            else if (ps.type == 'SimulatorPrimaryStorage') {
                msg = new ApiHeader.APIAddSimulatorPrimaryStorageMsg();
                msg.type = 'SimulatorPrimaryStorage';
            }
            else if (ps.type == 'IscsiFileSystemBackendPrimaryStorage') {
                msg = new ApiHeader.APIAddIscsiFileSystemBackendPrimaryStorageMsg();
                msg.chapPassword = ps.chapPassword;
                msg.chapUsername = ps.chapUsername;
                msg.sshUsername = ps.sshUsername;
                msg.sshPassword = ps.sshPassword;
                msg.hostname = ps.hostname;
            }
            else if (ps.type == 'LocalStorage') {
                msg = new ApiHeader.APIAddLocalPrimaryStorageMsg();
                msg.type = 'LocalStorage';
            }
            else if (ps.type == 'Ceph') {
                msg = new ApiHeader.APIAddCephPrimaryStorageMsg();
                msg.type = 'Ceph';
                msg.monUrls = ps.cephMonUrls;
            }
            else if (ps.type == 'SS100-Storage' || ps.type == 'Fusionstor') {
                msg = new ApiHeader.APIAddFusionstorPrimaryStorageMsg();
                msg.type = ps.type;
                msg.monUrls = ps.fusionstorMonUrls;
            }
            else if (ps.type == 'SharedMountPoint') {
                msg = new ApiHeader.APIAddSharedMountPointPrimaryStorageMsg();
            }
            msg.name = ps.name;
            msg.description = ps.description;
            msg.zoneUuid = ps.zoneUuid;
            msg.url = ps.url;
            this.api.asyncApi(msg, function (ret) {
                var c = new PrimaryStorage();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Created new Primary Storage: {0}', c.name),
                    link: Utils.sprintf('/#/primaryStorage/{0}', c.uuid)
                });
            });
        };
        PrimaryStorageManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryPrimaryStorageMsg();
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
                    var c = new PrimaryStorage();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        PrimaryStorageManager.prototype.disable = function (ps) {
            var _this = this;
            ps.progressOn();
            var msg = new ApiHeader.APIChangePrimaryStorageStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = ps.uuid;
            this.api.asyncApi(msg, function (ret) {
                ps.updateObservableObject(ret.inventory);
                ps.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled Primary Storage: {0}', ps.name),
                    link: Utils.sprintf('/#/primaryStorage/{0}', ps.uuid)
                });
            });
        };
        PrimaryStorageManager.prototype.reconnect = function (ps) {
            var _this = this;
            ps.progressOn();
            var msg = new ApiHeader.APIReconnectPrimaryStorageMsg();
            msg.uuid = ps.uuid;
            ps.status = 'Connecting';
            this.api.asyncApi(msg, function (ret) {
                ps.updateObservableObject(ret.inventory);
                ps.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Reconnected Primary Storage: {0}', ps.name),
                    link: Utils.sprintf('/#/primaryStorage/{0}', ps.uuid)
                });
            });
        };
        PrimaryStorageManager.prototype.enable = function (ps) {
            var _this = this;
            ps.progressOn();
            var msg = new ApiHeader.APIChangePrimaryStorageStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = ps.uuid;
            this.api.asyncApi(msg, function (ret) {
                ps.updateObservableObject(ret.inventory);
                ps.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled Primary Storage: {0}', ps.name),
                    link: Utils.sprintf('/#/primaryStorage/{0}', ps.uuid)
                });
            });
        };
        PrimaryStorageManager.prototype.attach = function (ps, cluster, done) {
            var _this = this;
            if (done === void 0) { done = null; }
            ps.progressOn();
            var msg = new ApiHeader.APIAttachPrimaryStorageToClusterMsg();
            msg.clusterUuid = cluster.uuid;
            msg.primaryStorageUuid = ps.uuid;
            this.api.asyncApi(msg, function (ret) {
                ps.updateObservableObject(ret.inventory);
                ps.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Attached Primary Storage: {0} to Cluster: {1}', ps.name, cluster.name),
                    link: Utils.sprintf('/#/primaryStorage/{0}', ps.uuid)
                });
            });
        };
        PrimaryStorageManager.prototype.detach = function (ps, cluster, done) {
            var _this = this;
            if (done === void 0) { done = null; }
            ps.progressOn();
            var msg = new ApiHeader.APIDetachPrimaryStorageFromClusterMsg();
            msg.clusterUuid = cluster.uuid;
            msg.primaryStorageUuid = ps.uuid;
            this.api.asyncApi(msg, function (ret) {
                ps.updateObservableObject(ret.inventory);
                ps.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Detached Primary Storage: {0} from Cluster: {1}', ps.name, cluster.name),
                    link: Utils.sprintf('/#/primaryStorage/{0}', ps.uuid)
                });
            });
        };
        PrimaryStorageManager.prototype["delete"] = function (ps, done) {
            var _this = this;
            ps.progressOn();
            var msg = new ApiHeader.APIDeletePrimaryStorageMsg();
            msg.uuid = ps.uuid;
            this.api.asyncApi(msg, function (ret) {
                ps.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted Primary Storage: {0}', ps.name)
                });
            });
        };
        return PrimaryStorageManager;
    }());
    PrimaryStorageManager.$inject = ['Api', '$rootScope'];
    MPrimaryStorage.PrimaryStorageManager = PrimaryStorageManager;
    var PrimaryStorageModel = (function (_super) {
        __extends(PrimaryStorageModel, _super);
        function PrimaryStorageModel() {
            var _this = _super.call(this) || this;
            _this.current = new PrimaryStorage();
            return _this;
        }
        return PrimaryStorageModel;
    }(Utils.Model));
    MPrimaryStorage.PrimaryStorageModel = PrimaryStorageModel;
    var OPrimaryStorageGrid = (function (_super) {
        __extends(OPrimaryStorageGrid, _super);
        function OPrimaryStorageGrid($scope, psMgr) {
            var _this = _super.call(this) || this;
            _this.psMgr = psMgr;
            _super.prototype.init.call(_this, $scope, $scope.primaryStorageGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"primaryStorage.ts.NAME" | translate}}',
                    width: '10%',
                    template: '<a href="/\\#/primaryStorage/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'description',
                    title: '{{"primaryStorage.ts.DESCRIPTION" | translate}}',
                    width: '10%'
                },
                {
                    field: 'url',
                    title: 'URL',
                    width: '16%'
                },
                {
                    field: 'totalCapacity',
                    title: '{{"primaryStorage.ts.TOTAL CAPACITY" | translate}}',
                    width: '8%',
                    template: '<span>{{dataItem.totalCapacity | size}}</span>'
                },
                {
                    field: 'availableCapacity',
                    title: '{{"primaryStorage.ts.AVAILABLE CAPACITY" | translate}}',
                    width: '8%',
                    template: '<span>{{dataItem.availableCapacity | size}}</span>'
                },
                {
                    field: 'type',
                    title: '{{"primaryStorage.ts.TYPE" | translate}}',
                    width: '10%'
                },
                {
                    field: 'state',
                    title: '{{"primaryStorage.ts.STATE" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'status',
                    title: '{{"primaryStorage.ts.STATUS" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.statusLabel()}}">{{dataItem.status}}</span>'
                },
                {
                    field: 'uuid',
                    title: '{{"primaryStorage.ts.UUID" | translate}}',
                    width: '20%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                psMgr.query(qobj, function (pss, total) {
                    options.success({
                        data: pss,
                        total: total
                    });
                });
            };
            return _this;
        }
        return OPrimaryStorageGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, psMgr) {
            this.$scope = $scope;
            this.psMgr = psMgr;
        }
        Action.prototype.enable = function () {
            this.psMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.psMgr.disable(this.$scope.model.current);
        };
        Action.prototype.addHost = function () {
        };
        Action.prototype.reconnect = function () {
            this.psMgr.reconnect(this.$scope.model.current);
        };
        Action.prototype.attachL2Network = function () {
        };
        Action.prototype.detachL2Network = function () {
        };
        Action.prototype.attachCluster = function () {
            this.$scope.attachCluster.open();
        };
        Action.prototype.detachCluster = function () {
            this.$scope.detachCluster.open();
        };
        return Action;
    }());
    var FilterBy = (function () {
        function FilterBy($scope, psTypes) {
            var _this = this;
            this.$scope = $scope;
            this.psTypes = psTypes;
            this.fieldList = {
                dataSource: new kendo.data.DataSource({
                    data: [
                        {
                            name: '{{"primaryStorage.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"primaryStorage.ts.State" | translate}}',
                            value: FilterBy.STATE
                        },
                        {
                            name: '{{"primaryStorage.ts.Type" | translate}}',
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
                    _this.valueList.dataSource.data(['Enabled', 'Disabled']);
                }
                else if (_this.field == FilterBy.TYPE) {
                    _this.valueList.dataSource.data(_this.psTypes);
                }
            });
        }
        FilterBy.prototype.confirm = function (popover) {
            this.$scope.oPrimaryStorageGrid.setFilter(this.toKendoFilter());
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
    FilterBy.TYPE = 'type';
    var DetailsController = (function () {
        function DetailsController($scope, psMgr, $routeParams, tagService, current, clusterMgr) {
            var _this = this;
            this.$scope = $scope;
            this.psMgr = psMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            $scope.model = new PrimaryStorageModel();
            $scope.model.current = current;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, psMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeletePrimaryStorage = {
                title: 'DELETE PRIMARY STORAGE',
                html: '<strong><p>Deleting Primary Storage will cause:</p></strong>' +
                '<ul><li><strong>Clusters to which this primary storage has attached will be detached</strong></li>' +
                '<li><strong>VMs which has volumes on this primary storage will be deleted</strong></li></ul>' +
                '<strong><p>those results are not recoverable</p></strong>',
                confirm: function () {
                    psMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypePrimaryStorageVO, function (ret) {
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
            $scope.optionsAttachCluster = {
                primaryStorage: $scope.model.current,
                done: function (cluster) {
                    $scope.optionsClusterGrid.dataSource.insert(0, cluster);
                }
            };
            $scope.optionsDetachCluster = {
                primaryStorage: $scope.model.current,
                done: function (cluster) {
                    var ds = $scope.optionsClusterGrid.dataSource;
                    var cs = ds.data();
                    for (var i = 0; i < cs.length; i++) {
                        var tcs = cs[i];
                        if (cluster.uuid == tcs.uuid) {
                            var row = ds.getByUid(tcs.uid);
                            ds.remove(row);
                            break;
                        }
                    }
                }
            };
            $scope.funcLoadClusters = function () {
                $scope.optionsClusterGrid.dataSource.read();
            };
            $scope.optionsClusterGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'name',
                        title: '{{"primaryStorage.ts.NAME" | translate}}',
                        width: '20%',
                        template: '<a href="/\\#/cluster/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                    },
                    {
                        field: 'description',
                        title: '{{"primaryStorage.ts.DESCRIPTION" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'state',
                        title: '{{"primaryStorage.ts.STATE" | translate}}',
                        width: '20%',
                        template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                    },
                    {
                        field: 'hypervisorType',
                        title: '{{"primaryStorage.ts.HYPERVISOR" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'uuid',
                        title: '{{"primaryStorage.ts.UUID" | translate}}',
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
                                name: 'uuid',
                                op: 'in',
                                value: $scope.model.current.attachedClusterUuids.join()
                            });
                            clusterMgr.query(qobj, function (clusters, total) {
                                options.success({
                                    data: clusters,
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
            this.psMgr.query(qobj, function (pss, total) {
                _this.$scope.model.current = pss[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'PrimaryStorageManager', '$routeParams', 'Tag', 'current', 'ClusterManager'];
    MPrimaryStorage.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, psMgr, primaryStorageTypes, $location) {
            this.$scope = $scope;
            this.psMgr = psMgr;
            this.primaryStorageTypes = primaryStorageTypes;
            this.$location = $location;
            $scope.model = new PrimaryStorageModel();
            $scope.oPrimaryStorageGrid = new OPrimaryStorageGrid($scope, psMgr);
            $scope.action = new Action($scope, psMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"primaryStorage.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"primaryStorage.ts.Description" | translate}}',
                        value: 'Description'
                    },
                    {
                        name: '{{"primaryStorage.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"primaryStorage.ts.Total Capacity" | translate}}',
                        value: 'totalCapacity'
                    },
                    {
                        name: '{{"primaryStorage.ts.Available Capacity" | translate}}',
                        value: 'availableCapacity'
                    },
                    {
                        name: '{{"primaryStorage.ts.Type" | translate}}',
                        value: 'type'
                    },
                    {
                        name: '{{"primaryStorage.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"primaryStorage.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    psMgr.setSortBy(ret);
                    $scope.oPrimaryStorageGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.PrimaryStorageInventoryQueryable,
                name: 'PrimaryStorage',
                schema: {
                    state: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['Enabled', 'Disabled']
                    },
                    type: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: this.primaryStorageTypes
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
                    psMgr.query(qobj, function (PrimaryStorages, total) {
                        $scope.oPrimaryStorageGrid.refresh(PrimaryStorages);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/primaryStorage/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope, this.primaryStorageTypes);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreatePrimaryStorage = function (win) {
                win.open();
            };
            $scope.funcDeletePrimaryStorage = function () {
                $scope.deletePrimaryStorage.open();
            };
            $scope.optionsDeletePrimaryStorage = {
                title: 'DELETE PRIMARY STORAGE',
                html: '<strong><p>Deleting Primary Storage will cause:</p></strong>' +
                '<ul><li><strong>Clusters to which this primary storage has attached will be detached</strong></li>' +
                '<li><strong>VMs which has volumes on this primary storage will be deleted</strong></li></ul>' +
                '<strong><p>those results are not recoverable</p></strong>',
                confirm: function () {
                    psMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oPrimaryStorageGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oPrimaryStorageGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreatePrimaryStorage = {
                done: function (ps) {
                    $scope.oPrimaryStorageGrid.add(ps);
                }
            };
            $scope.optionsAttachCluster = {
                primaryStorage: $scope.model.current,
                done: function (cluster) {
                }
            };
            $scope.optionsDetachCluster = {
                primaryStorage: $scope.model.current,
                done: function (cluster) {
                }
            };
            $scope.$watch(function () {
                return $scope.model.current;
            }, function () {
                $scope.optionsAttachCluster.primaryStorage = $scope.model.current;
                $scope.optionsDetachCluster.primaryStorage = $scope.model.current;
            });
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'PrimaryStorageManager', 'primaryStorageTypes', '$location'];
    MPrimaryStorage.Controller = Controller;
    var CreatePrimaryStorageOptions = (function () {
        function CreatePrimaryStorageOptions() {
        }
        return CreatePrimaryStorageOptions;
    }());
    MPrimaryStorage.CreatePrimaryStorageOptions = CreatePrimaryStorageOptions;
    var CreatePrimaryStorage = (function () {
        function CreatePrimaryStorage(api, zoneMgr, psMgr, clusterMgr) {
            var _this = this;
            this.api = api;
            this.zoneMgr = zoneMgr;
            this.psMgr = psMgr;
            this.clusterMgr = clusterMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreatePrimaryStorage;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new CreatePrimaryStorageOptions();
                var optionName = $attrs.zOptions;
                if (angular.isDefined(optionName)) {
                    _this.options = parentScope[optionName];
                    $scope.$watch(function () {
                        return parentScope[optionName];
                    }, function () {
                        _this.options = parentScope[optionName];
                    });
                }
                $scope.cephMonGrid__ = {
                    pageSize: 20,
                    resizable: true,
                    scrollable: true,
                    pageable: true,
                    columns: [
                        {
                            width: '20%',
                            title: '',
                            template: '<button type="button" class="btn btn-xs btn-default" ng-click="infoPage.delCephMon(dataItem.uid)"><i class="fa fa-times"></i></button>'
                        },
                        {
                            field: 'url',
                            title: '{{"primaryStorage.ts.MON URL" | translate}}',
                            width: '80%'
                        }
                    ],
                    dataBound: function (e) {
                        var grid = e.sender;
                        if (grid.dataSource.total() == 0 || grid.dataSource.totalPages() == 1) {
                            grid.pager.element.hide();
                        }
                    },
                    dataSource: new kendo.data.DataSource([])
                };
                $scope.fusionstorMonGrid__ = {
                    pageSize: 20,
                    resizable: true,
                    scrollable: true,
                    pageable: true,
                    columns: [
                        {
                            width: '20%',
                            title: '',
                            template: '<button type="button" class="btn btn-xs btn-default" ng-click="infoPage.delFusionstorMon(dataItem.uid)"><i class="fa fa-times"></i></button>'
                        },
                        {
                            field: 'url',
                            title: '{{"primaryStorage.ts.MON URL" | translate}}',
                            width: '80%'
                        }
                    ],
                    dataBound: function (e) {
                        var grid = e.sender;
                        if (grid.dataSource.total() == 0 || grid.dataSource.totalPages() == 1) {
                            grid.pager.element.hide();
                        }
                    },
                    dataSource: new kendo.data.DataSource([])
                };
                var infoPage = $scope.infoPage = {
                    activeState: true,
                    name: null,
                    zoneUuid: null,
                    description: null,
                    type: null,
                    url: null,
                    chapUsername: null,
                    chapPassword: null,
                    hostname: null,
                    sshUsername: 'root',
                    sshPassword: null,
                    cephMonUrls: [],
                    fusionstorMonUrls: [],
                    addCephMon: function () {
                        $scope.cephMonGrid__.dataSource.insert(0, { url: this.sshUsername + ":" + this.sshPassword + "@" + this.hostname });
                        this.hostname = null;
                        this.sshPassword = null;
                    },
                    addFusionstorMon: function () {
                        $scope.fusionstorMonGrid__.dataSource.insert(0, { url: this.sshUsername + ":" + this.sshPassword + "@" + this.hostname });
                        this.hostname = null;
                        this.sshPassword = null;
                    },
                    canAddMon: function () {
                        return Utils.notNullnotUndefined(this.sshUsername) && Utils.notNullnotUndefined(this.hostname)
                            && Utils.notNullnotUndefined(this.sshPassword);
                    },
                    delCephMon: function (uid) {
                        var row = $scope.cephMonGrid__.dataSource.getByUid(uid);
                        $scope.cephMonGrid__.dataSource.remove(row);
                    },
                    delFusionstorMon: function (uid) {
                        var row = $scope.fusionstorMonGrid__.dataSource.getByUid(uid);
                        $scope.fusionstorMonGrid__.dataSource.remove(row);
                    },
                    hasZone: function () {
                        return $scope.zoneList.dataSource.data().length > 0;
                    },
                    isUrlValid: function () {
                        if (this.type == 'NFS' && Utils.notNullnotUndefined(this.url)) {
                            var paths = this.url.split(":");
                            if (paths.length != 2) {
                                return false;
                            }
                            var abspath = paths[1];
                            if (abspath.indexOf('/') != 0) {
                                return false;
                            }
                            return true;
                        }
                        else if (this.type == 'SharedMountPoint' || this.type == 'IscsiFileSystemBackendPrimaryStorage' || this.type == 'LocalStorage' && Utils.notNullnotUndefined(this.url)) {
                            if (!!this.url) {
                                if (this.url.indexOf('/') != 0) {
                                    return false;
                                }
                            }
                            return true;
                        }
                        return true;
                    },
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        if (this.type == 'Ceph') {
                            return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.zoneUuid) &&
                                $scope.cephMonGrid__.dataSource.data().length > 0;
                        }
                        else if (this.type == 'SS100-Storage' || this.type == 'Fusionstor') {
                            return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.zoneUuid) &&
                                $scope.fusionstorMonGrid__.dataSource.data().length > 0;
                        }
                        else {
                            return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.zoneUuid)
                                && Utils.notNullnotUndefined(this.type) && Utils.notNullnotUndefined(this.url) && this.isUrlValid();
                        }
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createPrimaryStorageInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createPrimaryStorageInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('ps');
                        this.zoneUuid = null;
                        this.description = null;
                        this.type = null;
                        this.activeState = false;
                        this.chapPassword = null;
                        this.chapUsername = null;
                        this.sshPassword = null;
                        this.sshUsername = 'root';
                        this.hostname = null;
                        this.cephMonUrls = [];
                        this.fusionstorMonUrls = [];
                    }
                };
                var clusterPage = $scope.clusterPage = {
                    activeState: false,
                    hasCluster: function () {
                        return $scope.clusterListOptions__.dataSource.data().length > 0;
                    },
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return true;
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createPrimaryStorageCluster"]');
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
                        return 'createPrimaryStorageCluster';
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
                        return "Add";
                    },
                    finish: function () {
                        var resultPs;
                        var chain = new Utils.Chain();
                        chain.then(function () {
                            angular.forEach($scope.cephMonGrid__.dataSource.data(), function (it) {
                                $scope.infoPage.cephMonUrls.push(it.url);
                            });
                            angular.forEach($scope.fusionstorMonGrid__.dataSource.data(), function (it) {
                                $scope.infoPage.fusionstorMonUrls.push(it.url);
                            });
                            psMgr.create(infoPage, function (ret) {
                                resultPs = ret;
                                chain.next();
                            });
                        }).then(function () {
                            var clusters = $scope.clusterList__.dataItems();
                            angular.forEach(clusters, function (cluster) {
                                psMgr.attach(resultPs, cluster);
                            });
                            chain.next();
                        }).done(function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(resultPs);
                            }
                        }).start();
                        $scope.winCreatePrimaryStorage__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage, clusterPage
                ], mediator);
                $scope.$watch(function () {
                    return $scope.infoPage.zoneUuid;
                }, function () {
                    if (Utils.notNullnotUndefined($scope.clusterList__)) {
                        $scope.clusterList__.value([]);
                    }
                    var zuuid = $scope.infoPage.zoneUuid;
                    if (Utils.notNullnotUndefined(zuuid)) {
                        _this.queryClusters(zuuid, function (clusters) {
                            $scope.clusterListOptions__.dataSource.data(clusters);
                        });
                    }
                });
                $scope.zoneList = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"primaryStorage.ts.Name" | translate}}</span>: #: name #</div>' + '<div style="color: black"><span class="z-label">{{"primaryStorage.ts.State" | translate}}:</span>#: state #</div>' + '<div style="color: black"><span class="z-label">UUID:</span> #: uuid #</div>'
                };
                $scope.typeList = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "type",
                    dataValueField: "type",
                    change: function (e) {
                        var list = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.model.type = list.value();
                        });
                    }
                };
                $scope.winCreatePrimaryStorageOptions__ = {
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
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">HYPERVISOR:</span><span>#: hypervisorType #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>'
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/primaryStorage/createPrimaryStorage.html';
        }
        CreatePrimaryStorage.prototype.queryClusters = function (zoneUuid, done) {
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
        CreatePrimaryStorage.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreatePrimaryStorage__;
            var chain = new Utils.Chain();
            this.$scope.clusterList__.value([]);
            this.$scope.cephMonGrid__.dataSource.data([]);
            this.$scope.fusionstorMonGrid__.dataSource.data([]);
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
                        if (zones.length > 0) {
                            _this.$scope.infoPage.zoneUuid = zones[0].uuid;
                        }
                        chain.next();
                    });
                }
            }).then(function () {
                _this.api.getPrimaryStorageTypes(function (psTypes) {
                    var types = [];
                    angular.forEach(psTypes, function (item) {
                        types.push({ type: item });
                    });
                    _this.$scope.typeList.dataSource.data(new kendo.data.ObservableArray(types));
                    _this.$scope.infoPage.type = psTypes[0];
                    chain.next();
                });
            }).done(function () {
                win.center();
                win.open();
            }).start();
        };
        return CreatePrimaryStorage;
    }());
    MPrimaryStorage.CreatePrimaryStorage = CreatePrimaryStorage;
    var AttachCluster = (function () {
        function AttachCluster(clusterMgr, psMgr) {
            var _this = this;
            this.clusterMgr = clusterMgr;
            this.psMgr = psMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/primaryStorage/attachCluster.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zPrimaryStorageAttachCluster] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.clusterListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.hasCluster = function () {
                    return $scope.clusterListOptions__.dataSource.data().length > 0;
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.attachCluster__.close();
                };
                $scope.done = function () {
                    var clusters = $scope.clusterList__.dataItems();
                    angular.forEach(clusters, function (cluster) {
                        psMgr.attach(_this.options.primaryStorage, cluster, function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(cluster);
                            }
                        });
                    });
                    $scope.attachCluster__.close();
                };
                _this.$scope = $scope;
            };
        }
        AttachCluster.prototype.open = function () {
            var _this = this;
            this.$scope.clusterList__.value([]);
            var chain = new Utils.Chain();
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'uuid',
                        op: 'not in',
                        value: _this.options.primaryStorage.attachedClusterUuids.join()
                    },
                    {
                        name: 'zoneUuid',
                        op: '=',
                        value: _this.options.primaryStorage.zoneUuid
                    }
                ];
                _this.clusterMgr.query(qobj, function (clusters) {
                    _this.$scope.clusterListOptions__.dataSource.data(clusters);
                    chain.next();
                });
            }).done(function () {
                _this.$scope.attachCluster__.center();
                _this.$scope.attachCluster__.open();
            }).start();
        };
        return AttachCluster;
    }());
    MPrimaryStorage.AttachCluster = AttachCluster;
    var DetachClusterOptions = (function () {
        function DetachClusterOptions() {
        }
        return DetachClusterOptions;
    }());
    MPrimaryStorage.DetachClusterOptions = DetachClusterOptions;
    var DetachCluster = (function () {
        function DetachCluster(psMgr, clusterMgr) {
            var _this = this;
            this.psMgr = psMgr;
            this.clusterMgr = clusterMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/primaryStorage/detachCluster.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zPrimaryStorageDetachCluster] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.uuid = null;
                $scope.clusterListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">Hypervisor:</span><span>#: hypervisorType #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.hasCluster = function () {
                    return $scope.clusterListOptions__.dataSource.data().length > 0;
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.detachCluster__.close();
                };
                $scope.done = function () {
                    var clusters = $scope.clusterList__.dataItems();
                    angular.forEach(clusters, function (cluster) {
                        psMgr.detach(_this.options.primaryStorage, cluster, function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(cluster);
                            }
                        });
                    });
                    $scope.detachCluster__.close();
                };
                $scope.detachClusterOptions__ = {
                    width: '600px'
                };
            };
        }
        DetachCluster.prototype.open = function () {
            var _this = this;
            this.$scope.clusterList__.value([]);
            var chain = new Utils.Chain();
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'uuid',
                        op: 'in',
                        value: _this.options.primaryStorage.attachedClusterUuids.join()
                    }
                ];
                _this.clusterMgr.query(qobj, function (clusters) {
                    _this.$scope.clusterListOptions__.dataSource.data(clusters);
                    chain.next();
                });
            }).done(function () {
                _this.$scope.detachCluster__.center();
                _this.$scope.detachCluster__.open();
            }).start();
        };
        return DetachCluster;
    }());
    MPrimaryStorage.DetachCluster = DetachCluster;
})(MPrimaryStorage || (MPrimaryStorage = {}));
angular.module('root').factory('PrimaryStorageManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MPrimaryStorage.PrimaryStorageManager(api, $rootScope);
}]).directive('zCreatePrimaryStorage', ['Api', 'ZoneManager', 'PrimaryStorageManager', 'ClusterManager', function (api, zoneMgr, psMgr, clusterMgr) {
    return new MPrimaryStorage.CreatePrimaryStorage(api, zoneMgr, psMgr, clusterMgr);
}]).directive('zPrimaryStorageAttachCluster', ['ClusterManager', 'PrimaryStorageManager', function (clusterMgr, psMgr) {
    return new MPrimaryStorage.AttachCluster(clusterMgr, psMgr);
}]).directive('zPrimaryStorageDetachCluster', ['PrimaryStorageManager', 'ClusterManager', function (psMgr, clusterMgr) {
    return new MPrimaryStorage.DetachCluster(psMgr, clusterMgr);
}]).config(['$routeProvider', function (route) {
    route.when('/primaryStorage', {
        templateUrl: '/static/templates/primaryStorage/primaryStorage.html',
        controller: 'MPrimaryStorage.Controller',
        resolve: {
            primaryStorageTypes: function ($q, Api) {
                var defer = $q.defer();
                Api.getPrimaryStorageTypes(function (psTypes) {
                    defer.resolve(psTypes);
                });
                return defer.promise;
            }
        }
    }).when('/primaryStorage/:uuid', {
        templateUrl: '/static/templates/primaryStorage/details.html',
        controller: 'MPrimaryStorage.DetailsController',
        resolve: {
            current: function ($q, $route, PrimaryStorageManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var uuid = $route.current.params.uuid;
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                PrimaryStorageManager.query(qobj, function (pss) {
                    var ps = pss[0];
                    defer.resolve(ps);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />