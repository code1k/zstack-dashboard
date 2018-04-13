var MBackupStorage;
(function (MBackupStorage) {
    var BackupStorage = (function (_super) {
        __extends(BackupStorage, _super);
        function BackupStorage() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        BackupStorage.prototype.progressOn = function () {
            this.inProgress = true;
        };
        BackupStorage.prototype.progressOff = function () {
            this.inProgress = false;
        };
        BackupStorage.prototype.isInProgress = function () {
            return this.inProgress;
        };
        BackupStorage.prototype.isEnableShow = function () {
            return this.state == 'Disabled';
        };
        BackupStorage.prototype.isDisableShow = function () {
            return this.state == 'Enabled';
        };
        BackupStorage.prototype.stateLabel = function () {
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
        BackupStorage.prototype.statusLabel = function () {
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
        BackupStorage.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('url', inv.url);
            self.set('totalCapacity', inv.totalCapacity);
            self.set('availableCapacity', inv.availableCapacity);
            self.set('type', inv.type);
            self.set('state', inv.state);
            self.set('status', inv.status);
            self.set('attachedZoneUuids', inv.attachedZoneUuids);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
            self.set('sshPort', inv.sshPort);
        };
        return BackupStorage;
    }(ApiHeader.BackupStorageInventory));
    MBackupStorage.BackupStorage = BackupStorage;
    var BackupStorageManager = (function () {
        function BackupStorageManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        BackupStorageManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        BackupStorageManager.prototype.wrap = function (bs) {
            return new kendo.data.ObservableObject(bs);
        };
        BackupStorageManager.prototype.create = function (bs, done) {
            var _this = this;
            var msg = null;
            if (bs.type == 'SftpBackupStorage') {
                msg = new ApiHeader.APIAddSftpBackupStorageMsg();
                msg.hostname = bs.hostname;
                msg.username = bs.username;
                msg.password = bs.password;
                msg.sshPort = bs.port;
                msg.type = 'SftpBackupStorage';
            }
            else if (bs.type == 'SimulatorBackupStorage') {
                msg = new ApiHeader.APIAddSimulatorBackupStorageMsg();
                msg.type = 'SimulatorBackupStorage';
            }
            else if (bs.type == 'Ceph') {
                msg = new ApiHeader.APIAddCephBackupStorageMsg();
                msg.type = 'Ceph';
                msg.monUrls = bs.cephMonUrls;
            }
            else if (bs.type == 'SS100-Storage' || bs.type == 'Fusionstor') {
                msg = new ApiHeader.APIAddFusionstorBackupStorageMsg();
                msg.type = bs.type;
                msg.monUrls = bs.fusionstorMonUrls;
            }
            if (Utils.notNullnotUndefined(bs.resourceUuid)) {
                msg.resourceUuid = bs.resourceUuid;
            }
            msg.name = bs.name;
            msg.description = bs.description;
            msg.url = bs.url;
            this.api.asyncApi(msg, function (ret) {
                var c = new BackupStorage();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Created new Backup Storage: {0}', c.name),
                    link: Utils.sprintf('/#/backupStorage/{0}', c.uuid)
                });
            });
        };
        BackupStorageManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryBackupStorageMsg();
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
                    var c = new BackupStorage();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        BackupStorageManager.prototype.disable = function (bs) {
            var _this = this;
            bs.progressOn();
            var msg = new ApiHeader.APIChangeBackupStorageStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = bs.uuid;
            this.api.asyncApi(msg, function (ret) {
                bs.updateObservableObject(ret.inventory);
                bs.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled Backup Storage: {0}', bs.name),
                    link: Utils.sprintf('/#/backupStorage/{0}', bs.uuid)
                });
            });
        };
        BackupStorageManager.prototype.enable = function (bs) {
            var _this = this;
            bs.progressOn();
            var msg = new ApiHeader.APIChangeBackupStorageStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = bs.uuid;
            this.api.asyncApi(msg, function (ret) {
                bs.updateObservableObject(ret.inventory);
                bs.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled Backup Storage: {0}', bs.name),
                    link: Utils.sprintf('/#/backupStorage/{0}', bs.uuid)
                });
            });
        };
        BackupStorageManager.prototype.attach = function (bs, zone, done) {
            var _this = this;
            if (done === void 0) { done = null; }
            bs.progressOn();
            var msg = new ApiHeader.APIAttachBackupStorageToZoneMsg();
            msg.zoneUuid = zone.uuid;
            msg.backupStorageUuid = bs.uuid;
            this.api.asyncApi(msg, function (ret) {
                bs.updateObservableObject(ret.inventory);
                bs.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Attached Backup Storage: {0} to Zone: {1}', bs.name, zone.name),
                    link: Utils.sprintf('/#/backupStorage/{0}', bs.uuid)
                });
            });
        };
        BackupStorageManager.prototype.detach = function (bs, zone, done) {
            var _this = this;
            if (done === void 0) { done = null; }
            bs.progressOn();
            var msg = new ApiHeader.APIDetachBackupStorageFromZoneMsg();
            msg.zoneUuid = zone.uuid;
            msg.backupStorageUuid = bs.uuid;
            this.api.asyncApi(msg, function (ret) {
                bs.updateObservableObject(ret.inventory);
                bs.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Detached Backup Storage: {0} from zone: {1}', bs.name, zone.name),
                    link: Utils.sprintf('/#/backupStorage/{0}', bs.uuid)
                });
            });
        };
        BackupStorageManager.prototype.reconnect = function (bs, done) {
            var _this = this;
            if (done === void 0) { done = null; }
            if (bs.type != 'SftpBackupStorage') {
                return;
            }
            bs.progressOn();
            var msg = new ApiHeader.APIReconnectSftpBackupStorageMsg();
            msg.uuid = bs.uuid;
            bs.status = 'Connecting';
            this.api.asyncApi(msg, function (ret) {
                bs.updateObservableObject(ret.inventory);
                bs.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Reconnected SFtp Backup Storage: {0}', bs.name),
                    link: Utils.sprintf('/#/backupStorage/{0}', bs.uuid)
                });
            });
        };
        BackupStorageManager.prototype["delete"] = function (bs, done) {
            var _this = this;
            bs.progressOn();
            var msg = new ApiHeader.APIDeleteBackupStorageMsg();
            msg.uuid = bs.uuid;
            this.api.asyncApi(msg, function (ret) {
                bs.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted Backup Storage: {0}', bs.name)
                });
            });
        };
        return BackupStorageManager;
    }());
    BackupStorageManager.$inject = ['Api', '$rootScope'];
    MBackupStorage.BackupStorageManager = BackupStorageManager;
    var BackupStorageModel = (function (_super) {
        __extends(BackupStorageModel, _super);
        function BackupStorageModel() {
            var _this = _super.call(this) || this;
            _this.current = new BackupStorage();
            return _this;
        }
        return BackupStorageModel;
    }(Utils.Model));
    MBackupStorage.BackupStorageModel = BackupStorageModel;
    var OBackupStorageGrid = (function (_super) {
        __extends(OBackupStorageGrid, _super);
        function OBackupStorageGrid($scope, bsMgr) {
            var _this = _super.call(this) || this;
            _this.bsMgr = bsMgr;
            _super.prototype.init.call(_this, $scope, $scope.backupStorageGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"backupStorage.ts.NAME" | translate}}',
                    width: '10%',
                    template: '<a href="/\\#/backupStorage/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'description',
                    title: '{{"backupStorage.ts.DESCRIPTION" | translate}}',
                    width: '10%'
                },
                {
                    field: 'url',
                    title: '{{"backupStorage.ts.URL" | translate}}',
                    width: '16%'
                },
                {
                    field: 'totalCapacity',
                    title: '{{"backupStorage.ts.TOTAL CAPACITY" | translate}}',
                    width: '8%',
                    template: '<span>{{dataItem.totalCapacity | size}}</span>'
                },
                {
                    field: 'availableCapacity',
                    title: '{{"backupStorage.ts.AVAILABLE CAPACITY" | translate}}',
                    width: '8%',
                    template: '<span>{{dataItem.availableCapacity | size}}</span>'
                },
                {
                    field: 'type',
                    title: '{{"backupStorage.ts.TYPE" | translate}}',
                    width: '10%'
                },
                {
                    field: 'state',
                    title: '{{"backupStorage.ts.STATE" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'status',
                    title: '{{"backupStorage.ts.STATUS" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.statusLabel()}}">{{dataItem.status}}</span>'
                },
                {
                    field: 'uuid',
                    title: '{{"backupStorage.ts.UUID" | translate}}',
                    width: '20%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                bsMgr.query(qobj, function (bss, total) {
                    options.success({
                        data: bss,
                        total: total
                    });
                });
            };
            return _this;
        }
        return OBackupStorageGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, bsMgr) {
            this.$scope = $scope;
            this.bsMgr = bsMgr;
        }
        Action.prototype.enable = function () {
            this.bsMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.bsMgr.disable(this.$scope.model.current);
        };
        Action.prototype.reconnect = function () {
            this.bsMgr.reconnect(this.$scope.model.current);
        };
        Action.prototype.addHost = function () {
        };
        Action.prototype.attachL2Network = function () {
        };
        Action.prototype.detachL2Network = function () {
        };
        Action.prototype.attachZone = function () {
            this.$scope.attachZone.open();
        };
        Action.prototype.detachZone = function () {
            this.$scope.detachZone.open();
        };
        Action.prototype.isReconnectShow = function () {
            if (!Utils.notNullnotUndefined(this.$scope.model.current)) {
                return false;
            }
            return true;
        };
        return Action;
    }());
    var FilterBy = (function () {
        function FilterBy($scope, bsTypes) {
            var _this = this;
            this.$scope = $scope;
            this.bsTypes = bsTypes;
            this.fieldList = {
                dataSource: new kendo.data.DataSource({
                    data: [
                        {
                            name: '{{"backupStorage.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"backupStorage.ts.State" | translate}}',
                            value: FilterBy.STATE
                        },
                        {
                            name: '{{"backupStorage.ts.Status" | translate}}',
                            value: FilterBy.STATUS
                        },
                        {
                            name: '{{"backupStorage.ts.Type" | translate}}',
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
                else if (_this.field == FilterBy.STATUS) {
                    _this.valueList.dataSource.data(['Connecting', 'Connected', 'Disconnected']);
                }
                else if (_this.field == FilterBy.TYPE) {
                    _this.valueList.dataSource.data(_this.bsTypes);
                }
            });
        }
        FilterBy.prototype.confirm = function (popover) {
            this.$scope.oBackupStorageGrid.setFilter(this.toKendoFilter());
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
    FilterBy.TYPE = 'type';
    var DetailsController = (function () {
        function DetailsController($scope, bsMgr, $routeParams, tagService, current, zoneMgr) {
            var _this = this;
            this.$scope = $scope;
            this.bsMgr = bsMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            $scope.model = new BackupStorageModel();
            $scope.model.current = current;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, bsMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteBackupStorage = {
                title: 'DELETE BACKUP STORAGE',
                html: '<strong><p>Deleting Backup Storage will cause:</p></strong>' +
                '<ul><li><strong>Zones to which this backup storage has attached will be detached</strong></li>' +
                '<strong><p>those results are not recoverable</p></strong>',
                confirm: function () {
                    bsMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeBackupStorageVO, function (ret) {
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
            $scope.optionsAttachZone = {
                backupStorage: $scope.model.current,
                done: function (zone) {
                    $scope.optionsZoneGrid.dataSource.insert(0, zone);
                }
            };
            $scope.optionsDetachZone = {
                backupStorage: $scope.model.current,
                done: function (zone) {
                    var ds = $scope.optionsZoneGrid.dataSource;
                    var cs = ds.data();
                    for (var i = 0; i < cs.length; i++) {
                        var tcs = cs[i];
                        if (zone.uuid == tcs.uuid) {
                            var row = ds.getByUid(tcs.uid);
                            ds.remove(row);
                            break;
                        }
                    }
                }
            };
            $scope.funcLoadZones = function () {
                $scope.optionsZoneGrid.dataSource.read();
            };
            $scope.optionsZoneGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'name',
                        title: '{{"backupStorage.ts.NAME" | translate}}',
                        width: '25%',
                        template: '<a href="/\\#/zone/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                    },
                    {
                        field: 'description',
                        title: '{{"backupStorage.ts.DESCRIPTION" | translate}}',
                        width: '30%'
                    },
                    {
                        field: 'state',
                        title: '{{"backupStorage.ts.STATE" | translate}}',
                        width: '20%',
                        template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                    },
                    {
                        field: 'uuid',
                        title: '{{"backupStorage.ts.UUID" | translate}}',
                        width: '25%'
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
                                value: $scope.model.current.attachedZoneUuids.join()
                            });
                            zoneMgr.query(qobj, function (zones, total) {
                                options.success({
                                    data: zones,
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
            this.bsMgr.query(qobj, function (bss, total) {
                _this.$scope.model.current = bss[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'BackupStorageManager', '$routeParams', 'Tag', 'current', 'ZoneManager'];
    MBackupStorage.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, bsMgr, backupStorageTypes, $location) {
            this.$scope = $scope;
            this.bsMgr = bsMgr;
            this.backupStorageTypes = backupStorageTypes;
            this.$location = $location;
            $scope.model = new BackupStorageModel();
            $scope.oBackupStorageGrid = new OBackupStorageGrid($scope, bsMgr);
            $scope.action = new Action($scope, bsMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"backupStorage.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"backupStorage.ts.Description" | translate}}',
                        value: 'Description'
                    },
                    {
                        name: '{{"backupStorage.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"backupStorage.ts.Status" | translate}}',
                        value: 'status'
                    },
                    {
                        name: '{{"backupStorage.ts.Total Capacity" | translate}}',
                        value: 'totalCapacity'
                    },
                    {
                        name: '{{"backupStorage.ts.Available Capacity" | translate}}',
                        value: 'availableCapacity'
                    },
                    {
                        name: '{{"backupStorage.ts.Type" | translate}}',
                        value: 'type'
                    },
                    {
                        name: '{{"backupStorage.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"backupStorage.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    bsMgr.setSortBy(ret);
                    $scope.oBackupStorageGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.BackupStorageInventoryQueryable,
                name: 'BackupStorage',
                schema: {
                    state: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['Enabled', 'Disabled']
                    },
                    status: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['Connecting', 'Connected', 'Disconnected']
                    },
                    type: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: this.backupStorageTypes
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
                    bsMgr.query(qobj, function (BackupStorages, total) {
                        $scope.oBackupStorageGrid.refresh(BackupStorages);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/backupStorage/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope, this.backupStorageTypes);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateBackupStorage = function (win) {
                win.open();
            };
            $scope.funcDeleteBackupStorage = function () {
                $scope.deleteBackupStorage.open();
            };
            $scope.optionsDeleteBackupStorage = {
                title: 'DELETE BACKUP STORAGE',
                html: '<strong><p>Deleting Backup Storage will cause:</p></strong>' +
                '<ul><li><strong>Zones to which this backup storage has attached will be detached</strong></li>' +
                '<strong><p>those results are not recoverable</p></strong>',
                confirm: function () {
                    bsMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oBackupStorageGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oBackupStorageGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateBackupStorage = {
                done: function (data) {
                    var resultBs;
                    var chain = new Utils.Chain();
                    chain.then(function () {
                        var placeHolder = new BackupStorage();
                        placeHolder.name = data.info.name;
                        placeHolder.uuid = data.info.resourceUuid = Utils.uuid();
                        placeHolder.state = 'Enabled';
                        placeHolder.status = 'Connecting';
                        $scope.oBackupStorageGrid.add(placeHolder);
                        bsMgr.create(data.info, function (ret) {
                            resultBs = ret;
                            chain.next();
                        });
                    }).then(function () {
                        angular.forEach(data.zones, function (zone) {
                            bsMgr.attach(resultBs, zone);
                        });
                        chain.next();
                    }).done(function () {
                        $scope.oBackupStorageGrid.refresh();
                    }).start();
                }
            };
            $scope.optionsAttachZone = {
                backupStorage: $scope.model.current,
                done: function (zone) {
                }
            };
            $scope.optionsDetachZone = {
                backupStorage: $scope.model.current,
                done: function (zone) {
                }
            };
            $scope.$watch(function () {
                return $scope.model.current;
            }, function () {
                $scope.optionsAttachZone.backupStorage = $scope.model.current;
                $scope.optionsDetachZone.backupStorage = $scope.model.current;
            });
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'BackupStorageManager', 'backupStorageTypes', '$location'];
    MBackupStorage.Controller = Controller;
    var CreateBackupStorageOptions = (function () {
        function CreateBackupStorageOptions() {
        }
        return CreateBackupStorageOptions;
    }());
    MBackupStorage.CreateBackupStorageOptions = CreateBackupStorageOptions;
    var CreateBackupStorageModel = (function () {
        function CreateBackupStorageModel() {
        }
        CreateBackupStorageModel.prototype.canCreate = function () {
            return angular.isDefined(this.name) && angular.isDefined(this.type) &&
                Utils.notNullnotUndefined(this.url);
        };
        return CreateBackupStorageModel;
    }());
    MBackupStorage.CreateBackupStorageModel = CreateBackupStorageModel;
    var CreateBackupStorage = (function () {
        function CreateBackupStorage(api, bsMgr, zoneMgr) {
            var _this = this;
            this.api = api;
            this.bsMgr = bsMgr;
            this.zoneMgr = zoneMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateBackupStorage;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new CreateBackupStorageOptions();
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
                            title: '{{"backupStorage.ts.MON URL" | translate}}',
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
                            title: '{{"backupStorage.ts.MON URL" | translate}}',
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
                    description: null,
                    type: null,
                    url: null,
                    hostname: null,
                    username: 'root',
                    password: null,
                    cephMonUrls: [],
                    fusionstorMonUrls: [],
                    isUrlValid: function () {
                        if (this.type == 'SftpBackupStorage' && Utils.notNullnotUndefined(this.url)) {
                            return this.url.indexOf('/') == 0;
                        }
                        return true;
                    },
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        if (this.type == 'SftpBackupStorage') {
                            return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.type)
                                && Utils.notNullnotUndefined(this.url) && Utils.notNullnotUndefined(this.hostname)
                                && Utils.notNullnotUndefined(this.username) && Utils.notNullnotUndefined(this.password)
                                && this.isUrlValid();
                        }
                        else if (this.type == 'Ceph') {
                            return $scope.cephMonGrid__.dataSource.data().length > 0;
                        }
                        else if (this.type == 'SS100-Storage' || this.type == 'Fusionstor') {
                            return $scope.fusionstorMonGrid__.dataSource.data().length > 0;
                        }
                        else {
                            return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.type)
                                && Utils.notNullnotUndefined(this.url);
                        }
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createBackupStorageInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createBackupStorageInfo';
                    },
                    addCephMon: function () {
                        $scope.cephMonGrid__.dataSource.insert(0, { url: this.username + ":" + this.password + "@" + this.hostname });
                        this.hostname = null;
                        this.password = null;
                    },
                    addFusionstorMon: function () {
                        $scope.fusionstorMonGrid__.dataSource.insert(0, { url: this.username + ":" + this.password + "@" + this.hostname });
                        this.hostname = null;
                        this.password = null;
                    },
                    canAddMon: function () {
                        return Utils.notNullnotUndefined(this.username) && Utils.notNullnotUndefined(this.hostname)
                            && Utils.notNullnotUndefined(this.password);
                    },
                    delCephMon: function (uid) {
                        var row = $scope.cephMonGrid__.dataSource.getByUid(uid);
                        $scope.cephMonGrid__.dataSource.remove(row);
                    },
                    delFusionstorMon: function (uid) {
                        var row = $scope.fusionstorMonGrid__.dataSource.getByUid(uid);
                        $scope.fusionstorMonGrid__.dataSource.remove(row);
                    },
                    reset: function () {
                        this.name = Utils.shortHashName("bs");
                        this.description = null;
                        this.type = null;
                        this.hostname = null;
                        this.username = 'root';
                        this.password = null;
                        this.url = null;
                        this.activeState = false;
                        this.cephMonUrls = [];
                        this.fusionstorMonUrls = [];
                    }
                };
                var zonePage = $scope.zonePage = {
                    activeState: false,
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return true;
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createBackupStorageZone"]');
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
                        return 'createBackupStorageZone';
                    },
                    reset: function () {
                        this.activeState = false;
                    },
                    hasZone: function () {
                        return $scope.zoneListOptions__.dataSource.data().length > 0;
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
                            angular.forEach($scope.cephMonGrid__.dataSource.data(), function (it) {
                                $scope.infoPage.cephMonUrls.push(it.url);
                            });
                            angular.forEach($scope.fusionstorMonGrid__.dataSource.data(), function (it) {
                                $scope.infoPage.fusionstorMonUrls.push(it.url);
                            });
                            _this.options.done({
                                info: infoPage,
                                zones: $scope.zoneList__.dataItems()
                            });
                        }
                        $scope.winCreateBackupStorage__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage, zonePage
                ], mediator);
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
                $scope.winCreateBackupStorageOptions__ = {
                    width: '750px',
                    //height: '780px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.zoneListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">Type:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">URL:</span><span>#: url #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>'
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/backupStorage/createBackupStorage.html';
        }
        CreateBackupStorage.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateBackupStorage__;
            var chain = new Utils.Chain();
            this.$scope.zoneList__.value([]);
            this.$scope.button.reset();
            this.$scope.cephMonGrid__.dataSource.data([]);
            this.$scope.fusionstorMonGrid__.dataSource.data([]);
            chain.then(function () {
                _this.api.getBackupStorageTypes(function (bsTypes) {
                    var types = [];
                    angular.forEach(bsTypes, function (item) {
                        types.push({ type: item });
                    });
                    _this.$scope.typeList.dataSource.data(new kendo.data.ObservableArray(types));
                    _this.$scope.infoPage.type = bsTypes[0];
                    chain.next();
                });
            }).then(function () {
                if (Utils.notNullnotUndefined(_this.options.zone)) {
                    _this.$scope.zoneListOptions__.dataSource.data(new kendo.data.ObservableArray([_this.options.zone]));
                    chain.next();
                }
                else {
                    _this.zoneMgr.query(new ApiHeader.QueryObject(), function (zones, total) {
                        _this.$scope.zoneListOptions__.dataSource.data(zones);
                        chain.next();
                    });
                }
            }).done(function () {
                win.center();
                win.open();
            }).start();
        };
        return CreateBackupStorage;
    }());
    MBackupStorage.CreateBackupStorage = CreateBackupStorage;
    var AttachZone = (function () {
        function AttachZone(zoneMgr, bsMgr) {
            var _this = this;
            this.zoneMgr = zoneMgr;
            this.bsMgr = bsMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/backupStorage/attachZone.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zBackupStorageAttachZone] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.zoneListOptions__ = {
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
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.attachZone__.close();
                };
                $scope.done = function () {
                    var zones = $scope.zoneList__.dataItems();
                    angular.forEach(zones, function (zone) {
                        bsMgr.attach(_this.options.backupStorage, zone, function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(zone);
                            }
                        });
                    });
                    $scope.attachZone__.close();
                };
                _this.$scope = $scope;
            };
        }
        AttachZone.prototype.open = function () {
            var _this = this;
            this.$scope.zoneList__.value([]);
            var chain = new Utils.Chain();
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'uuid',
                        op: 'not in',
                        value: _this.options.backupStorage.attachedZoneUuids.join()
                    }
                ];
                _this.zoneMgr.query(qobj, function (zones) {
                    _this.$scope.zoneListOptions__.dataSource.data(zones);
                    chain.next();
                });
            }).done(function () {
                _this.$scope.attachZone__.center();
                _this.$scope.attachZone__.open();
            }).start();
        };
        return AttachZone;
    }());
    MBackupStorage.AttachZone = AttachZone;
    var DetachZoneOptions = (function () {
        function DetachZoneOptions() {
        }
        return DetachZoneOptions;
    }());
    MBackupStorage.DetachZoneOptions = DetachZoneOptions;
    var DetachZone = (function () {
        function DetachZone(bsMgr, zoneMgr) {
            var _this = this;
            this.bsMgr = bsMgr;
            this.zoneMgr = zoneMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/backupStorage/detachZone.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zBackupStorageDetachZone] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.uuid = null;
                $scope.zoneListOptions__ = {
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
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.detachZone__.close();
                };
                $scope.done = function () {
                    var zones = $scope.zoneList__.dataItems();
                    angular.forEach(zones, function (zone) {
                        bsMgr.detach(_this.options.backupStorage, zone, function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(zone);
                            }
                        });
                    });
                    $scope.detachZone__.close();
                };
                $scope.detachZoneOptions__ = {
                    width: '600px'
                };
            };
        }
        DetachZone.prototype.open = function () {
            var _this = this;
            this.$scope.zoneList__.value([]);
            var chain = new Utils.Chain();
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'uuid',
                        op: 'in',
                        value: _this.options.backupStorage.attachedZoneUuids.join()
                    }
                ];
                _this.zoneMgr.query(qobj, function (zones) {
                    _this.$scope.zoneListOptions__.dataSource.data(zones);
                    chain.next();
                });
            }).done(function () {
                _this.$scope.detachZone__.center();
                _this.$scope.detachZone__.open();
            }).start();
        };
        return DetachZone;
    }());
    MBackupStorage.DetachZone = DetachZone;
})(MBackupStorage || (MBackupStorage = {}));
angular.module('root').factory('BackupStorageManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MBackupStorage.BackupStorageManager(api, $rootScope);
}]).directive('zCreateBackupStorage', ['Api', 'BackupStorageManager', 'ZoneManager', function (api, bsMgr, zoneMgr) {
    return new MBackupStorage.CreateBackupStorage(api, bsMgr, zoneMgr);
}]).directive('zBackupStorageAttachZone', ['ZoneManager', 'BackupStorageManager', function (zoneMgr, bsMgr) {
    return new MBackupStorage.AttachZone(zoneMgr, bsMgr);
}]).directive('zBackupStorageDetachZone', ['BackupStorageManager', 'ZoneManager', function (bsMgr, zoneMgr) {
    return new MBackupStorage.DetachZone(bsMgr, zoneMgr);
}]).config(['$routeProvider', function (route) {
    route.when('/backupStorage', {
        templateUrl: '/static/templates/backupStorage/backupStorage.html',
        controller: 'MBackupStorage.Controller',
        resolve: {
            backupStorageTypes: function ($q, Api) {
                var defer = $q.defer();
                Api.getBackupStorageTypes(function (bsTypes) {
                    defer.resolve(bsTypes);
                });
                return defer.promise;
            }
        }
    }).when('/backupStorage/:uuid', {
        templateUrl: '/static/templates/backupStorage/details.html',
        controller: 'MBackupStorage.DetailsController',
        resolve: {
            current: function ($q, $route, BackupStorageManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var uuid = $route.current.params.uuid;
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                BackupStorageManager.query(qobj, function (bss) {
                    var bs = bss[0];
                    defer.resolve(bs);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />