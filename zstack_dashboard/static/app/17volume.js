var MVolume;
(function (MVolume) {
    var VolumeSnapshot = (function (_super) {
        __extends(VolumeSnapshot, _super);
        function VolumeSnapshot() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        VolumeSnapshot.prototype.progressOn = function () {
            this.inProgress = true;
        };
        VolumeSnapshot.prototype.progressOff = function () {
            this.inProgress = false;
        };
        VolumeSnapshot.prototype.isInProgress = function () {
            return this.inProgress;
        };
        VolumeSnapshot.prototype.isRevertShow = function () {
            return Utils.notNullnotUndefined(this.volumeUuid) && this.status == 'Ready';
        };
        VolumeSnapshot.prototype.isBackupShow = function () {
            return Utils.notNullnotUndefined(this.primaryStorageUuid);
        };
        VolumeSnapshot.prototype.isDeleteFromBackupStorageShow = function () {
            return this.backupStorageRefs.length > 0;
        };
        VolumeSnapshot.prototype.statusLabel = function () {
            if (this.status == 'Ready') {
                return 'label label-success';
            }
            else if (this.status == 'NotInstantiated') {
                return 'label label-warning';
            }
            else {
                return 'label label-default';
            }
        };
        VolumeSnapshot.prototype.updateObservableObject = function (inv) {
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('type', inv.type);
            self.set('volumeUuid', inv.volumeUuid);
            self.set('treeUuid', inv.treeUuid);
            self.set('format', inv.format);
            self.set('parentUuid', inv.parentUuid);
            self.set('primaryStorageUuid', inv.primaryStorageUuid);
            self.set('primaryStorageInstallPath', inv.primaryStorageInstallPath);
            self.set('volumeType', inv.volumeType);
            self.set('latest', inv.latest);
            self.set('size', inv.size);
            self.set('state', inv.state);
            self.set('status', inv.status);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
            self.set('backupStorageRefs', inv.backupStorageRefs);
        };
        VolumeSnapshot.wrap = function (obj) {
            var sp = new VolumeSnapshot();
            angular.extend(sp, obj);
            return new kendo.data.ObservableObject(sp);
        };
        return VolumeSnapshot;
    }(ApiHeader.VolumeSnapshotInventory));
    MVolume.VolumeSnapshot = VolumeSnapshot;
    var Volume = (function (_super) {
        __extends(Volume, _super);
        function Volume() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Volume.prototype.progressOn = function () {
            this.inProgress = true;
        };
        Volume.prototype.progressOff = function () {
            this.inProgress = false;
        };
        Volume.prototype.isInProgress = function () {
            return this.inProgress;
        };
        Volume.prototype.isDetachShow = function () {
            return this.type == 'Data' && Utils.notNullnotUndefined(this.vmInstanceUuid);
        };
        Volume.prototype.isAttachShow = function () {
            return this.type == 'Data' && this.state == 'Enabled' && this.status != 'Creating' && !this.isDetachShow();
        };
        Volume.prototype.isSnapshotShow = function () {
            return this.status == 'Ready';
        };
        Volume.prototype.isBackupShow = function () {
            return this.type == 'Data' && this.status == 'Ready';
        };
        Volume.prototype.isCreateTemplateShow = function () {
            return this.type == 'Root' && this.status == 'Ready';
        };
        Volume.prototype.isDeleteShow = function () {
            return this.type == 'Data' && this.status != 'Deleted';
        };
        Volume.prototype.isExpungeShow = function () {
            return this.status == 'Deleted' && this.type == 'Data';
        };
        Volume.prototype.isRecoverShow = function () {
            return this.status == 'Deleted' && this.type == 'Data';
        };
        Volume.prototype.isEnableShow = function () {
            return this.state == 'Disabled';
        };
        Volume.prototype.isDisableShow = function () {
            return this.state == 'Enabled';
        };
        Volume.prototype.stateLabel = function () {
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
        Volume.prototype.statusLabel = function () {
            if (this.status == 'Ready') {
                return 'label label-success';
            }
            else if (this.status == 'NotInstantiated') {
                return 'label label-warning';
            }
            else {
                return 'label label-default';
            }
        };
        Volume.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('primaryStorageUuid', inv.primaryStorageUuid);
            self.set('vmInstanceUuid', inv.vmInstanceUuid);
            self.set('diskOfferingUuid', inv.diskOfferingUuid);
            self.set('rootImageUuid', inv.rootImageUuid);
            self.set('installPath', inv.installPath);
            self.set('type', inv.type);
            self.set('status', inv.status);
            self.set('format', inv.format);
            self.set('size', inv.size);
            self.set('state', inv.state);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        return Volume;
    }(ApiHeader.VolumeInventory));
    MVolume.Volume = Volume;
    var VolumeManager = (function () {
        function VolumeManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        VolumeManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        VolumeManager.prototype.wrap = function (Volume) {
            return new kendo.data.ObservableObject(Volume);
        };
        VolumeManager.prototype.backup = function (volume, bsUuid, done) {
            var _this = this;
            var msg = new ApiHeader.APIBackupDataVolumeMsg();
            msg.backupStorageUuid = bsUuid;
            msg.uuid = volume.uuid;
            this.api.asyncApi(msg, function (ret) {
                volume.updateObservableObject(ret.inventory);
                volume.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Backup Data Volume: {0}', volume.name),
                    link: Utils.sprintf('/#/volume/{0}', volume.uuid)
                });
            });
        };
        VolumeManager.prototype.create = function (volume, done) {
            var _this = this;
            var msg = new ApiHeader.APICreateDataVolumeMsg();
            msg.name = volume.name;
            msg.description = volume.description;
            msg.diskOfferingUuid = volume.diskOfferingUuid;
            this.api.asyncApi(msg, function (ret) {
                var c = new Volume();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Created new Data Volume: {0}', c.name),
                    link: Utils.sprintf('/#/volume/{0}', c.uuid)
                });
            });
        };
        VolumeManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryVolumeMsg();
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
                    var c = new Volume();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        VolumeManager.prototype.disable = function (volume) {
            var _this = this;
            volume.progressOn();
            var msg = new ApiHeader.APIChangeVolumeStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = volume.uuid;
            this.api.asyncApi(msg, function (ret) {
                volume.updateObservableObject(ret.inventory);
                volume.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled Data Volume: {0}', volume.name),
                    link: Utils.sprintf('/#/volume/{0}', volume.uuid)
                });
            });
        };
        VolumeManager.prototype.enable = function (volume) {
            var _this = this;
            volume.progressOn();
            var msg = new ApiHeader.APIChangeVolumeStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = volume.uuid;
            this.api.asyncApi(msg, function (ret) {
                volume.updateObservableObject(ret.inventory);
                volume.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled Data Volume: {0}', volume.name),
                    link: Utils.sprintf('/#/volume/{0}', volume.uuid)
                });
            });
        };
        VolumeManager.prototype.attach = function (volume, vmUuid, done) {
            var _this = this;
            volume.progressOn();
            var msg = new ApiHeader.APIAttachDataVolumeToVmMsg();
            msg.vmInstanceUuid = vmUuid;
            msg.volumeUuid = volume.uuid;
            this.api.asyncApi(msg, function (ret) {
                volume.progressOff();
                volume.updateObservableObject(ret.inventory);
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Attached Data Volume: {0}', volume.name),
                    link: Utils.sprintf('/#/volume/{0}', volume.uuid)
                });
            });
        };
        VolumeManager.prototype.detach = function (volume, done) {
            var _this = this;
            volume.progressOn();
            var msg = new ApiHeader.APIDetachDataVolumeFromVmMsg();
            msg.uuid = volume.uuid;
            this.api.asyncApi(msg, function (ret) {
                volume.progressOff();
                volume.updateObservableObject(ret.inventory);
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Detached Data Volume: {0}', volume.name),
                    link: Utils.sprintf('/#/volume/{0}', volume.uuid)
                });
            });
        };
        VolumeManager.prototype["delete"] = function (volume, done) {
            var _this = this;
            volume.progressOn();
            var msg = new ApiHeader.APIDeleteDataVolumeMsg();
            msg.uuid = volume.uuid;
            this.api.asyncApi(msg, function (ret) {
                volume.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted Data Volume: {0}', volume.name)
                });
            });
        };
        VolumeManager.prototype.expunge = function (volume, done) {
            var _this = this;
            volume.progressOn();
            var msg = new ApiHeader.APIExpungeDataVolumeMsg();
            msg.uuid = volume.uuid;
            this.api.asyncApi(msg, function (ret) {
                volume.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Expunged Data Volume: {0}', volume.name)
                });
            });
        };
        VolumeManager.prototype.recover = function (volume) {
            var _this = this;
            volume.progressOn();
            var msg = new ApiHeader.APIRecoverDataVolumeMsg();
            msg.uuid = volume.uuid;
            this.api.asyncApi(msg, function (ret) {
                volume.updateObservableObject(ret.inventory);
                volume.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Recovered Data Volume: {0}', volume.name),
                    link: Utils.sprintf('/#/volume/{0}', volume.uuid)
                });
            });
        };
        VolumeManager.prototype.takeSnapshot = function (volume, snapshot, done) {
            var _this = this;
            volume.progressOn();
            var msg = new ApiHeader.APICreateVolumeSnapshotMsg();
            msg.name = snapshot.name;
            msg.description = snapshot.description;
            msg.volumeUuid = volume.uuid;
            this.api.asyncApi(msg, function (ret) {
                volume.progressOff();
                var sp = VolumeSnapshot.wrap(ret.inventory);
                if (Utils.notNullnotUndefined(done)) {
                    done(sp);
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Create snapshot from volume: {0}', volume.name),
                    link: Utils.sprintf('/#/volume/{0}', volume.uuid)
                });
            });
        };
        VolumeManager.prototype.createTemplate = function (volume, info, done) {
            var _this = this;
            volume.progressOn();
            var msg = new ApiHeader.APICreateRootVolumeTemplateFromRootVolumeMsg();
            msg.name = info.name;
            if (Utils.notNullnotUndefined(info.backupStorageUuid)) {
                msg.backupStorageUuids = [info.backupStorageUuid];
            }
            msg.description = info.description;
            msg.guestOsType = info.guestOsType;
            msg.platform = info.platform;
            msg.rootVolumeUuid = volume.uuid;
            this.api.asyncApi(msg, function (ret) {
                volume.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Create template from root volume: {0}', volume.name),
                    link: Utils.sprintf('/#/image/{0}', ret.inventory.uuid)
                });
            });
        };
        VolumeManager.prototype.querySnapshotTree = function (qobj, done) {
            var msg = new ApiHeader.APIQueryVolumeSnapshotTreeMsg();
            msg.count = qobj.count === true;
            msg.start = qobj.start;
            msg.limit = qobj.limit;
            msg.replyWithCount = true;
            msg.conditions = qobj.conditions ? qobj.conditions : [];
            this.api.syncApi(msg, function (ret) {
                done(ret.inventories);
            });
        };
        return VolumeManager;
    }());
    VolumeManager.$inject = ['Api', '$rootScope'];
    MVolume.VolumeManager = VolumeManager;
    var VolumeModel = (function (_super) {
        __extends(VolumeModel, _super);
        function VolumeModel() {
            var _this = _super.call(this) || this;
            _this.current = new Volume();
            return _this;
        }
        return VolumeModel;
    }(Utils.Model));
    MVolume.VolumeModel = VolumeModel;
    var SnapshotManager = (function () {
        function SnapshotManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        SnapshotManager.prototype.queryTree = function (qobj, done) {
            var msg = new ApiHeader.APIQueryVolumeSnapshotTreeMsg();
            msg.count = qobj.count === true;
            msg.start = qobj.start;
            msg.limit = qobj.limit;
            msg.replyWithCount = true;
            msg.conditions = qobj.conditions ? qobj.conditions : [];
            this.api.syncApi(msg, function (ret) {
                done(ret.inventories);
            });
        };
        SnapshotManager.prototype.query = function (qobj, callback) {
            var msg = new ApiHeader.APIQueryVolumeSnapshotMsg();
            msg.count = qobj.count === true;
            msg.start = qobj.start;
            msg.limit = qobj.limit;
            msg.replyWithCount = true;
            msg.conditions = qobj.conditions ? qobj.conditions : [];
            this.api.syncApi(msg, function (ret) {
                var pris = [];
                ret.inventories.forEach(function (inv) {
                    pris.push(VolumeSnapshot.wrap(inv));
                });
                callback(pris, ret.total);
            });
        };
        SnapshotManager.prototype["delete"] = function (sp, done) {
            var msg = new ApiHeader.APIDeleteVolumeSnapshotMsg();
            msg.uuid = sp.uuid;
            this.api.asyncApi(msg, function (ret) {
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
            });
        };
        SnapshotManager.prototype.revert = function (sp, done) {
            var _this = this;
            var msg = new ApiHeader.APIRevertVolumeFromSnapshotMsg();
            msg.uuid = sp.uuid;
            this.api.asyncApi(msg, function (ret) {
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Reverted volume: {0} to a snapshot', sp.volumeUuid),
                    link: Utils.sprintf('/#/volume/{0}', sp.volumeUuid)
                });
            });
        };
        SnapshotManager.prototype.backup = function (sp, bsUuid, done) {
            var _this = this;
            var msg = new ApiHeader.APIBackupVolumeSnapshotMsg();
            msg.backupStorageUuid = bsUuid;
            msg.uuid = sp.uuid;
            this.api.asyncApi(msg, function (ret) {
                sp.updateObservableObject(ret.inventory);
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Backup volume snapshot: {0} to a backup storage', sp.uuid)
                });
            });
        };
        SnapshotManager.prototype.deleteFromBackupStorage = function (sp, bsUuid, done) {
            var _this = this;
            var msg = new ApiHeader.APIDeleteVolumeSnapshotFromBackupStorageMsg();
            msg.backupStorageUuids = [bsUuid];
            msg.uuid = sp.uuid;
            this.api.asyncApi(msg, function (ret) {
                sp.updateObservableObject(ret.inventory);
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted volume snapshot: {0} to a backup storage', sp.uuid)
                });
            });
        };
        return SnapshotManager;
    }());
    MVolume.SnapshotManager = SnapshotManager;
    var OVolumeGrid = (function (_super) {
        __extends(OVolumeGrid, _super);
        function OVolumeGrid($scope, volumeMgr) {
            var _this = _super.call(this) || this;
            _this.volumeMgr = volumeMgr;
            _super.prototype.init.call(_this, $scope, $scope.volumeGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"volume.ts.NAME" | translate}}',
                    width: '10%',
                    template: '<a href="/\\#/volume/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'hypervisorType',
                    title: '{{"volume.ts.HYPERVISOR" | translate}}',
                    width: '10%'
                },
                {
                    field: 'type',
                    title: '{{"volume.ts.TYPE" | translate}}',
                    width: '10%'
                },
                {
                    field: 'state',
                    title: '{{"volume.ts.STATE" | translate}}',
                    width: '15%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'status',
                    title: '{{"volume.ts.STATUS" | translate}}',
                    width: '15%',
                    template: '<span class="{{dataItem.statusLabel()}}">{{dataItem.status}}</span>'
                },
                {
                    field: 'vmInstanceUuid',
                    title: 'VM INSTANCE UUID',
                    width: '20%',
                    template: '<a href="/\\#/vmInstance/{{dataItem.vmInstanceUuid}}">{{dataItem.vmInstanceUuid}}</a>'
                },
                {
                    field: 'uuid',
                    title: 'UUID',
                    width: '20%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                volumeMgr.query(qobj, function (volumes, total) {
                    options.success({
                        data: volumes,
                        total: total
                    });
                });
            };
            return _this;
        }
        return OVolumeGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, volumeMgr) {
            this.$scope = $scope;
            this.volumeMgr = volumeMgr;
        }
        Action.prototype.enable = function () {
            this.volumeMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.volumeMgr.disable(this.$scope.model.current);
        };
        Action.prototype.recover = function () {
            this.volumeMgr.recover(this.$scope.model.current);
        };
        Action.prototype.attach = function () {
            this.$scope.attachVm.open();
        };
        Action.prototype.detach = function () {
            this.$scope.detachVm.open();
        };
        Action.prototype.takeSnapshot = function () {
            this.$scope.takeSnapshot.open();
        };
        Action.prototype.backup = function () {
            this.$scope.backupDataVolumeWin.open();
        };
        Action.prototype.createTemplate = function () {
            this.$scope.createTemplateWin.open();
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
                            name: '{{"volume.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"volume.ts.State" | translate}}',
                            value: FilterBy.STATE
                        },
                        {
                            name: '{{"volume.ts.Status" | translate}}',
                            value: FilterBy.STATUS
                        },
                        {
                            name: '{{"volume.ts.Type" | translate}}',
                            value: FilterBy.TYPE
                        },
                        {
                            name: '{{"volume.ts.HypervisorType" | translate}}',
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
                    _this.valueList.dataSource.data(['Creating', 'Ready', 'NotInstantiated']);
                }
                else if (_this.field == FilterBy.STATE) {
                    _this.valueList.dataSource.data(['Enabled', 'Disabled']);
                }
                else if (_this.field == FilterBy.HYPERVISOR) {
                    _this.valueList.dataSource.data(_this.hypervisorTypes);
                }
                else if (_this.field == FilterBy.TYPE) {
                    _this.valueList.dataSource.data(['Root', 'Data']);
                }
            });
        }
        FilterBy.prototype.confirm = function (popover) {
            this.$scope.oVolumeGrid.setFilter(this.toKendoFilter());
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
    FilterBy.HYPERVISOR = 'hypervisorType';
    var SnapshotAction = (function () {
        function SnapshotAction($scope, spMgr) {
            this.$scope = $scope;
            this.spMgr = spMgr;
        }
        SnapshotAction.prototype.revert = function () {
            this.$scope.revertSnapshot.open();
        };
        SnapshotAction.prototype["delete"] = function () {
            this.$scope.deleteSnapshotWin.open();
        };
        SnapshotAction.prototype.backup = function () {
            this.$scope.backupSnapshotWin.open();
        };
        SnapshotAction.prototype.deleteFromBackupStorage = function () {
            this.$scope.deleteSnapshotFromBackupStorageWin.open();
        };
        return SnapshotAction;
    }());
    var SnapshotDetailsController = (function () {
        function SnapshotDetailsController($scope, spMgr, $routeParams, tagService, current, vmMgr, bsMgr) {
            var _this = this;
            this.$scope = $scope;
            this.spMgr = spMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            this.bsMgr = bsMgr;
            $scope.model = new VolumeModel();
            $scope.model.current = current;
            this.marshalBackupStorage(current);
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new SnapshotAction($scope, spMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteSnapshot = {
                title: 'DELETE VOLUME SNAPSHOT',
                description: "All descendants of this snapshot will be deleted as well",
                confirm: function () {
                    spMgr["delete"]($scope.model.current, function () {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeVolumeVO, function (ret) {
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
            $scope.optionsRevertSnapshot = {
                snapshot: current,
                done: function () {
                    _this.loadSelf(current.uuid);
                }
            };
            $scope.optionsBackupSnapshot = {
                snapshot: current,
                done: function () {
                    _this.loadSelf(current.uuid);
                }
            };
            $scope.optionsDeleteSnapshotFromBackupStorage = {
                snapshot: current,
                done: function () {
                    _this.loadSelf(current.uuid);
                }
            };
            $scope.optionsBackupStorageGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'name',
                        title: '{{"volume.ts.BACKUP STORAGE NAME" | translate}}',
                        width: '20%',
                        template: '<a href="/\\#/backupStorage/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                    },
                    {
                        field: 'installPath',
                        title: '{{"volume.ts.INSTALL PATH" | translate}}',
                        width: '80%'
                    },
                ],
                dataBound: function (e) {
                    var grid = e.sender;
                    if (grid.dataSource.totalPages() == 1) {
                        grid.pager.element.hide();
                    }
                },
                dataSource: new kendo.data.DataSource([])
            };
        }
        SnapshotDetailsController.prototype.marshalBackupStorage = function (sp) {
            var _this = this;
            if (sp.backupStorageRefs.length == 0) {
                if (Utils.notNullnotUndefined(this.$scope.optionsBackupStorageGrid)) {
                    this.$scope.optionsBackupStorageGrid.dataSource.data([]);
                }
                return;
            }
            var bsUuids = [];
            angular.forEach(sp.backupStorageRefs, function (it) {
                bsUuids.push(it.backupStorageUuid);
            });
            var qobj = new ApiHeader.QueryObject();
            qobj.conditions = [{
                name: 'uuid',
                op: 'in',
                value: bsUuids.join()
            }];
            this.bsMgr.query(qobj, function (bss) {
                var bsMap = {};
                angular.forEach(bss, function (it) {
                    bsMap[it.uuid] = it;
                });
                var bsRef = [];
                angular.forEach(sp.backupStorageRefs, function (it) {
                    var bs = bsMap[it.backupStorageUuid];
                    bsRef.push({
                        uuid: it.backupStorageUuid,
                        name: bs.name,
                        installPath: it.installPath
                    });
                });
                _this.$scope.optionsBackupStorageGrid.dataSource.data(bsRef);
            });
        };
        SnapshotDetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.spMgr.query(qobj, function (sps, total) {
                _this.$scope.model.current = sps[0];
                _this.marshalBackupStorage(sps[0]);
            });
        };
        return SnapshotDetailsController;
    }());
    SnapshotDetailsController.$inject = ['$scope', 'SnapshotManager', '$routeParams', 'Tag', 'current', 'VmInstanceManager', 'BackupStorageManager'];
    MVolume.SnapshotDetailsController = SnapshotDetailsController;
    var DetailsController = (function () {
        function DetailsController($scope, volumeMgr, $routeParams, tagService, vol, vmMgr, spMgr, bsMgr) {
            var _this = this;
            this.$scope = $scope;
            this.volumeMgr = volumeMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            this.spMgr = spMgr;
            this.bsMgr = bsMgr;
            $scope.model = new VolumeModel();
            var current = vol.volume;
            $scope.model.current = current;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, volumeMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.funcDeleteVolume = function () {
                $scope.deleteVolume.open();
            };
            $scope.funcExpungeVolume = function (e) {
                e.open();
            };
            $scope.optionsDeleteVolume = {
                title: 'DELETE VOLUME',
                description: function () {
                    return Utils.sprintf("The volume[{0}] will be detached from vm if attached. Confirm delete?", $scope.model.current.name);
                },
                btnType: 'btn-danger',
                confirm: function () {
                    volumeMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsExpungeVolume = {
                title: 'EXPUNGE VOLUME',
                btnType: 'btn-danger',
                confirm: function () {
                    volumeMgr.expunge($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsDeleteSnapshot = {
                title: 'DELETE VOLUME SNAPSHOT',
                description: "All descendants of this snapshot will be deleted as well",
                confirm: function () {
                    spMgr["delete"]($scope.model.snapshot, function () {
                        _this.reloadSnapshot(current.uuid);
                        $scope.model.snapshot = null;
                    });
                }
            };
            $scope.deleteSnapshot = function (sp) {
                $scope.model.snapshot = sp;
                $scope.deleteSnapshotWin.open();
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeVolumeVO, function (ret) {
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
            $scope.optionsAttachVm = {
                volume: current
            };
            $scope.optionsDetachVm = {
                volume: current
            };
            $scope.optionsTakeSnapshot = {
                volume: current,
                done: function (sp) {
                    _this.reloadSnapshot(sp.volumeUuid);
                }
            };
            $scope.optionsRevertSnapshot = {
                snapshot: null,
                done: function () {
                    _this.loadSelf(current.uuid);
                }
            };
            $scope.revertToSnapshot = function (sp) {
                $scope.optionsRevertSnapshot.snapshot = sp;
                $scope.revertSnapshot.open();
            };
            $scope.optionsBackupSnapshot = {
                snapshot: null
            };
            $scope.backupSnapshot = function (sp) {
                $scope.optionsBackupSnapshot.snapshot = sp;
                $scope.backupSnapshotWin.open();
            };
            $scope.optionsDeleteSnapshotFromBackupStorage = {
                snapshot: null
            };
            $scope.deleteSnapshotFromBackupStorage = function (sp) {
                $scope.optionsDeleteSnapshotFromBackupStorage.snapshot = sp;
                $scope.deleteSnapshotFromBackupStorageWin.open();
            };
            $scope.optionsSnapshotTree = {
                template: '#: item.text #' +
                '<div class="btn-group" ng-show="dataItem.notChain == true">' +
                '<button type="button" class="btn btn-xs dropdown-toggle" data-toggle="dropdown">' +
                '<span class="caret"></span>' +
                '</button>' +
                '<ul class="dropdown-menu" role="menu">' +
                '<li><a href="/\\#/volumeSnapshot/{{dataItem.inventory.uuid}}">{{"volume.ts.See details" | translate}}</a></li>' +
                '<li><a href ng-click="revertToSnapshot(dataItem.inventory)" ng-show="dataItem.inventory.isRevertShow()">{{"volume.ts.Revert volume to this snapshot" | translate}}</a></li>' +
                '<li><a href ng-click="backupSnapshot(dataItem.inventory)" ng-show="dataItem.inventory.isBackupShow()">{{"volume.ts.Backup" | translate}}</a></li>' +
                '<li><a href ng-click="deleteSnapshotFromBackupStorage(dataItem.inventory)" ng-show="dataItem.inventory.isDeleteFromBackupStorageShow()">{{"volume.ts.Delete From Backup Storage" | translate}}</a></li>' +
                '<li><a href style="color:red" ng-click="deleteSnapshot(dataItem.inventory)">{{"volume.ts.Delete" | translate}}</a></li>' +
                '</ul>' +
                '</div>',
                dataSource: new kendo.data.HierarchicalDataSource({
                    data: []
                })
            };
            if (vol.snapshotTree.length > 0) {
                this.buildSnapshotTree(vol.snapshotTree);
            }
            $scope.optionsCreateTemplate = {
                volume: current
            };
            $scope.optionsBackupDataVolume = {
                volume: current,
                done: function () {
                    _this.loadSelf(current.uuid);
                }
            };
        }
        DetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.volumeMgr.query(qobj, function (volumes, total) {
                _this.$scope.model.current = volumes[0];
            });
        };
        DetailsController.prototype.reloadSnapshot = function (volUuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'volumeUuid', op: '=', value: volUuid });
            this.spMgr.queryTree(qobj, function (trees) {
                _this.buildSnapshotTree(trees);
            });
        };
        DetailsController.prototype.buildSnapshotTree = function (trees) {
            var treeToItems = function (leaf) {
                var ret = {};
                ret['text'] = leaf.inventory.name;
                ret['inventory'] = VolumeSnapshot.wrap(leaf.inventory);
                ret['notChain'] = true;
                if (leaf.children.length > 0) {
                    ret['items'] = [];
                    angular.forEach(leaf.children, function (it) {
                        ret['items'].push(treeToItems(it));
                    });
                }
                return ret;
            };
            var strees = [];
            angular.forEach(trees, function (it) {
                strees.push({
                    text: it.current ? 'TREE-' + it.uuid + ' (CURRENT)' : 'TREE-' + it.uuid,
                    items: [
                        treeToItems(it.tree)
                    ]
                });
            });
            this.$scope.optionsSnapshotTree.dataSource.data(strees);
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'VolumeManager', '$routeParams', 'Tag', 'current', 'VmInstanceManager', 'SnapshotManager', 'BackupStorageManager'];
    MVolume.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, volumeMgr, hypervisorTypes, $location) {
            this.$scope = $scope;
            this.volumeMgr = volumeMgr;
            this.hypervisorTypes = hypervisorTypes;
            this.$location = $location;
            $scope.model = new VolumeModel();
            $scope.oVolumeGrid = new OVolumeGrid($scope, volumeMgr);
            $scope.action = new Action($scope, volumeMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"volume.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"volume.ts.Description" | translate}}',
                        value: 'description'
                    },
                    {
                        name: '{{"volume.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"volume.ts.Status" | translate}}',
                        value: 'status'
                    },
                    {
                        name: '{{"volume.ts.Type" | translate}}',
                        value: 'type'
                    },
                    {
                        name: '{{"volume.ts.Format" | translate}}',
                        value: 'format'
                    },
                    {
                        name: '{{"volume.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"volume.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    volumeMgr.setSortBy(ret);
                    $scope.oVolumeGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.VolumeInventoryQueryable,
                name: 'Volume',
                schema: {
                    state: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['Enabled', 'Disabled']
                    },
                    status: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['Connecting', 'Connected', 'Disconnected']
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
                    volumeMgr.query(qobj, function (Volumes, total) {
                        $scope.oVolumeGrid.refresh(Volumes);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/volume/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope, this.hypervisorTypes);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateVolume = function (win) {
                win.open();
            };
            $scope.funcDeleteVolume = function () {
                $scope.deleteVolume.open();
            };
            $scope.funcExpungeVolume = function (e) {
                e.open();
            };
            $scope.optionsDeleteVolume = {
                title: 'DELETE DATA VOLUME',
                description: function () {
                    return Utils.sprintf("The volume[{0}] will be detached from vm if attached. Confirm delete?", $scope.model.current.name);
                },
                btnType: 'btn-danger',
                confirm: function () {
                    volumeMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oVolumeGrid.deleteCurrent();
                    });
                }
            };
            $scope.optionsExpungeVolume = {
                title: 'EXPUNGE DATA VOLUME',
                btnType: 'btn-danger',
                confirm: function () {
                    volumeMgr.expunge($scope.model.current, function (ret) {
                        $scope.oVolumeGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oVolumeGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateVolume = {
                done: function (volume) {
                    $scope.oVolumeGrid.add(volume);
                }
            };
            $scope.optionsAttachVm = {
                volume: null
            };
            $scope.optionsDetachVm = {
                volume: null
            };
            $scope.optionsTakeSnapshot = {
                volume: null
            };
            $scope.optionsBackupDataVolume = {
                volume: null
            };
            $scope.optionsCreateTemplate = {
                volume: null
            };
            $scope.$watch(function () {
                return $scope.model.current;
            }, function () {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    $scope.optionsAttachVm.volume = $scope.model.current;
                    $scope.optionsDetachVm.volume = $scope.model.current;
                    $scope.optionsTakeSnapshot.volume = $scope.model.current;
                    $scope.optionsBackupDataVolume.volume = $scope.model.current;
                    $scope.optionsCreateTemplate.volume = $scope.model.current;
                }
            });
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'VolumeManager', 'hypervisorTypes', '$location'];
    MVolume.Controller = Controller;
    var CreateVolume = (function () {
        function CreateVolume(api, diskOfferingMgr, volumeMgr, vmMgr) {
            var _this = this;
            this.api = api;
            this.diskOfferingMgr = diskOfferingMgr;
            this.volumeMgr = volumeMgr;
            this.vmMgr = vmMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateVolume;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = {};
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
                    diskOfferingUuid: null,
                    hasDiskOffering: function () {
                        return $scope.diskOfferingOptions__.dataSource.data().length > 0;
                    },
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.diskOfferingUuid);
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createVolumeInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createVolumeInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('volume');
                        this.description = null;
                        this.diskOfferingUuid = null;
                        this.activeState = false;
                    }
                };
                var attachPage = $scope.attachPage = {
                    activeState: true,
                    vmInstanceUuid: null,
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return true;
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#attachVm"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'attachVm';
                    },
                    hasVm: function () {
                        return $scope.vmOptions__.dataSource.data().length > 0;
                    },
                    reset: function () {
                        this.vmInstanceUuid = null;
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
                        var resultVolume;
                        var chain = new Utils.Chain();
                        chain.then(function () {
                            volumeMgr.create(infoPage, function (ret) {
                                resultVolume = ret;
                                chain.next();
                            });
                        }).then(function () {
                            if (Utils.notNullnotUndefined($scope.attachPage.vmInstanceUuid) && $scope.attachPage.vmInstanceUuid != '') {
                                volumeMgr.attach(resultVolume, $scope.attachPage.vmInstanceUuid, function () {
                                    chain.next();
                                });
                            }
                            else {
                                chain.next();
                            }
                        }).done(function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(resultVolume);
                            }
                        }).start();
                        $scope.winCreateVolume__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage, attachPage
                ], mediator);
                $scope.winCreateVolumeOptions__ = {
                    width: '700px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.diskOfferingOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"volume.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.DISK SIZE" | translate}}:</span><span>#: diskSize #</span></div>'
                };
                $scope.vmOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    optionLabel: "",
                    template: '<div style="color: black"><span class="z-label">{{"volume.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.Hypervisor" | translate}}:</span><span>#: hypervisorType #</span></div>'
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/volume/createVolume.html';
        }
        CreateVolume.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateVolume__;
            var chain = new Utils.Chain();
            this.$scope.diskOfferingOptions__.dataSource.data([]);
            this.$scope.button.reset();
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                _this.diskOfferingMgr.query(qobj, function (dss, total) {
                    _this.$scope.diskOfferingOptions__.dataSource.data(dss);
                    if (dss.length > 0) {
                        _this.$scope.infoPage.diskOfferingUuid = dss[0].uuid;
                    }
                    chain.next();
                });
            }).then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'state',
                        op: 'in',
                        value: ['Running', 'Stopped'].join()
                    }
                ];
                _this.vmMgr.query(qobj, function (vms) {
                    _this.$scope.vmOptions__.dataSource.data(vms);
                    _this.$scope.attachPage.vmInstanceUuid = null;
                    chain.next();
                });
            }).done(function () {
                win.center();
                win.open();
            }).start();
        };
        return CreateVolume;
    }());
    MVolume.CreateVolume = CreateVolume;
    var AttachVm = (function () {
        function AttachVm(api, volMgr) {
            var _this = this;
            this.api = api;
            this.volMgr = volMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/volume/attachVm.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zVolumeAttachVm] = _this;
                _this.options = parent[$attrs.zOptions];
                var onSelect = function (e) {
                    $scope.vmInstanceUuid = e.item.context.children[3].children[1].innerText;
                };
                $scope.vmInstanceListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    select: onSelect,
                    template: '<div style="color: black"><span class="z-label">{{"volume.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.Hypervisor" | translate}}:</span><span>#: hypervisorType #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.State" | translate}}:</span><span>#: state #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.hasVm = function () {
                    return $scope.vmInstanceListOptions__.dataSource.data().length > 0;
                };
                $scope.vmInstanceUuid = null;
                $scope.canProceed = function () {
                    return Utils.notNullnotUndefined($scope.vmInstanceUuid);
                };
                $scope.cancel = function () {
                    $scope.attachVmInstance__.close();
                };
                $scope.done = function () {
                    volMgr.attach(_this.options.volume, $scope.vmInstanceUuid, function () {
                        if (_this.options.done) {
                            _this.options.done();
                        }
                    });
                    $scope.attachVmInstance__.close();
                };
                _this.$scope = $scope;
            };
        }
        AttachVm.prototype.open = function () {
            var _this = this;
            this.$scope.vmInstanceListOptions__.dataSource.data([]);
            var chain = new Utils.Chain();
            chain.then(function () {
                _this.api.getDataVolumeAttachableVm(_this.options.volume.uuid, function (vms) {
                    _this.$scope.vmInstanceListOptions__.dataSource.data(vms);
                    if (vms.length > 0) {
                        _this.$scope.vmInstanceUuid = vms[0].uuid;
                    }
                    chain.next();
                });
            }).done(function () {
                _this.$scope.attachVmInstance__.center();
                _this.$scope.attachVmInstance__.open();
            }).start();
        };
        return AttachVm;
    }());
    MVolume.AttachVm = AttachVm;
    var DetachVm = (function () {
        function DetachVm(volMgr, vmMgr) {
            var _this = this;
            this.volMgr = volMgr;
            this.vmMgr = vmMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/volume/detachVm.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zVolumeDetachVm] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.cancel = function () {
                    $scope.detachVmInstance__.close();
                };
                $scope.done = function () {
                    volMgr.detach(_this.options.volume, function () {
                        if (_this.options.done) {
                            _this.options.done();
                        }
                    });
                    $scope.detachVmInstance__.close();
                };
                $scope.optionsDetachVm__ = {
                    width: '500px'
                };
                $scope.vmStateLabel = function () {
                    if (!Utils.notNullnotUndefined($scope.vm)) {
                        return '';
                    }
                    var vm = $scope.vm;
                    if (vm.state == 'Running') {
                        return 'label label-success';
                    }
                    else if (vm.state == 'Stopped') {
                        return 'label label-danger';
                    }
                    else if (vm.state == 'Unknown') {
                        return 'label label-warning';
                    }
                    else {
                        return 'label label-default';
                    }
                };
                $scope.isVmInCorrectState = function () {
                    if (!Utils.notNullnotUndefined($scope.vm)) {
                        return true;
                    }
                    return $scope.vm.state == 'Running' || $scope.vm.state == 'Stopped';
                };
                $scope.canProceed = function () {
                    if (!Utils.notNullnotUndefined($scope.vm)) {
                        return false;
                    }
                    return $scope.isVmInCorrectState();
                };
                _this.$scope = $scope;
            };
        }
        DetachVm.prototype.open = function () {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.conditions = [
                {
                    name: 'uuid',
                    op: '=',
                    value: this.options.volume.vmInstanceUuid
                }
            ];
            this.vmMgr.query(qobj, function (vms) {
                if (vms.length > 0) {
                    _this.$scope.vm = vms[0];
                }
                _this.$scope.detachVmInstance__.center();
                _this.$scope.detachVmInstance__.open();
            });
        };
        return DetachVm;
    }());
    MVolume.DetachVm = DetachVm;
    var TakeSnapshot = (function () {
        function TakeSnapshot(volMgr) {
            var _this = this;
            this.volMgr = volMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/volume/takeSnapshot.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zVolumeTakeSnapshot] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.canProceed = function () {
                    return Utils.notNullnotUndefined($scope.name);
                };
                $scope.cancel = function () {
                    $scope.takeSnapshot__.close();
                };
                $scope.done = function () {
                    volMgr.takeSnapshot(_this.options.volume, {
                        name: $scope.name,
                        description: $scope.description
                    }, function (sp) {
                        if (_this.options.done) {
                            _this.options.done(sp);
                        }
                    });
                    $scope.takeSnapshot__.close();
                };
                _this.$scope = $scope;
            };
        }
        TakeSnapshot.prototype.open = function () {
            this.$scope.name = null;
            this.$scope.description = null;
            this.$scope.takeSnapshot__.center();
            this.$scope.takeSnapshot__.open();
        };
        return TakeSnapshot;
    }());
    MVolume.TakeSnapshot = TakeSnapshot;
    var RevertSnapshot = (function () {
        function RevertSnapshot(spMgr, volMgr, vmMgr) {
            var _this = this;
            this.spMgr = spMgr;
            this.volMgr = volMgr;
            this.vmMgr = vmMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/volume/revertSnapshot.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zVolumeRevertToSnapshot] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.cancel = function () {
                    $scope.revertSnapshot__.close();
                };
                $scope.done = function () {
                    spMgr.revert(_this.options.snapshot, function () {
                        if (_this.options.done) {
                            _this.options.done();
                        }
                    });
                    $scope.revertSnapshot__.close();
                };
                $scope.optionsRevertSnapshot__ = {
                    width: '500px'
                };
                $scope.isVmInCorrectState = function () {
                    if (!Utils.notNullnotUndefined($scope.vm)) {
                        return true;
                    }
                    return $scope.vm.state == 'Stopped';
                };
                $scope.canProceed = function () {
                    return $scope.isVmInCorrectState();
                };
                _this.$scope = $scope;
            };
        }
        RevertSnapshot.prototype.open = function () {
            var _this = this;
            this.$scope.snapshot = this.options.snapshot;
            var chain = new Utils.Chain();
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'allVolumes.snapshot.uuid',
                        op: '=',
                        value: _this.options.snapshot.uuid
                    }
                ];
                _this.vmMgr.query(qobj, function (vms) {
                    if (vms.length > 0) {
                        _this.$scope.vm = vms[0];
                    }
                    chain.next();
                });
            }).then(function () {
                if (!Utils.notNullnotUndefined(_this.options.snapshot.volumeUuid)) {
                    chain.next();
                    return;
                }
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [{
                    name: 'uuid',
                    op: '=',
                    value: _this.options.snapshot.volumeUuid
                }];
                _this.volMgr.query(qobj, function (vols) {
                    _this.$scope.volume = vols[0];
                    chain.next();
                });
            }).done(function () {
                _this.$scope.revertSnapshot__.center();
                _this.$scope.revertSnapshot__.open();
            }).start();
        };
        return RevertSnapshot;
    }());
    MVolume.RevertSnapshot = RevertSnapshot;
    var BackupSnapshot = (function () {
        function BackupSnapshot(spMgr, psMgr, bsMgr) {
            var _this = this;
            this.spMgr = spMgr;
            this.psMgr = psMgr;
            this.bsMgr = bsMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/volume/backupSnapshot.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zBackupSnapshot] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.backupStorageOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"volume.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.Type" | translate}}:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.State" | translate}}:</span><span>#: state #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.hasBackupStorage = function () {
                    return $scope.backupStorageOptions__.dataSource.data().length > 0;
                };
                $scope.bsUuid = null;
                $scope.canProceed = function () {
                    return Utils.notNullnotUndefined($scope.bsUuid);
                };
                $scope.cancel = function () {
                    $scope.backupSnapshot__.close();
                };
                $scope.done = function () {
                    spMgr.backup(_this.options.snapshot, $scope.bsUuid, function () {
                        if (_this.options.done) {
                            _this.options.done();
                        }
                    });
                    $scope.backupSnapshot__.close();
                };
                $scope.backupSnapshotOptions__ = {
                    width: '500px'
                };
                _this.$scope = $scope;
            };
        }
        BackupSnapshot.prototype.open = function () {
            var _this = this;
            var chain = new Utils.Chain();
            var ps = null;
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [{
                    name: 'uuid',
                    op: '=',
                    value: _this.options.snapshot.primaryStorageUuid
                }];
                _this.psMgr.query(qobj, function (pss) {
                    ps = pss[0];
                    chain.next();
                });
            }).then(function () {
                var bsUuidsAlreadyOn = [];
                angular.forEach(_this.options.snapshot.backupStorageRefs, function (it) {
                    bsUuidsAlreadyOn.push(it.backupStorageUuid);
                });
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [{
                    name: 'uuid',
                    op: 'not in',
                    value: bsUuidsAlreadyOn.join()
                }, {
                    name: 'attachedZoneUuids',
                    op: 'in',
                    value: [ps.zoneUuid].join()
                }];
                _this.bsMgr.query(qobj, function (bss) {
                    _this.$scope.backupStorageOptions__.dataSource.data(bss);
                    if (bss.length > 0) {
                        _this.$scope.bsUuid = bss[0].uuid;
                    }
                    chain.next();
                });
            }).done(function () {
                _this.$scope.backupSnapshot__.center();
                _this.$scope.backupSnapshot__.open();
            }).start();
        };
        return BackupSnapshot;
    }());
    MVolume.BackupSnapshot = BackupSnapshot;
    var BackupDataVolume = (function () {
        function BackupDataVolume(volMgr, psMgr, bsMgr) {
            var _this = this;
            this.volMgr = volMgr;
            this.psMgr = psMgr;
            this.bsMgr = bsMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/volume/backupVolume.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zBackupDataVolume] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.backupStorageOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"volume.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.Type" | translate}}:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.State" | translate}}:</span><span>#: state #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.hasBackupStorage = function () {
                    return $scope.backupStorageOptions__.dataSource.data().length > 0;
                };
                $scope.bsUuid = null;
                $scope.canProceed = function () {
                    return $scope.hasBackupStorage();
                };
                $scope.cancel = function () {
                    $scope.backupDataVolume__.close();
                };
                $scope.done = function () {
                    volMgr.backup(_this.options.volume, $scope.bsUuid, function () {
                        if (_this.options.done) {
                            _this.options.done();
                        }
                    });
                    $scope.backupDataVolume__.close();
                };
                $scope.backupDataVolumeOptions__ = {
                    width: '500px'
                };
                _this.$scope = $scope;
            };
        }
        BackupDataVolume.prototype.open = function () {
            var _this = this;
            var chain = new Utils.Chain();
            var ps = null;
            this.$scope.bsUuid = null;
            this.$scope.backupStorageOptions__.dataSource.data([]);
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [{
                    name: 'uuid',
                    op: '=',
                    value: _this.options.volume.primaryStorageUuid
                }];
                _this.psMgr.query(qobj, function (pss) {
                    ps = pss[0];
                    chain.next();
                });
            }).then(function () {
                var bsUuidsAlreadyOn = [];
                angular.forEach(_this.options.volume.backupStorageRefs, function (it) {
                    bsUuidsAlreadyOn.push(it.backupStorageUuid);
                });
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [{
                    name: 'uuid',
                    op: 'not in',
                    value: bsUuidsAlreadyOn.join()
                }, {
                    name: 'attachedZoneUuids',
                    op: 'in',
                    value: [ps.zoneUuid].join()
                }];
                _this.bsMgr.query(qobj, function (bss) {
                    _this.$scope.backupStorageOptions__.dataSource.data(bss);
                    if (bss.length > 0) {
                        _this.$scope.bsUuid = bss[0].uuid;
                    }
                    chain.next();
                });
            }).done(function () {
                _this.$scope.backupDataVolume__.center();
                _this.$scope.backupDataVolume__.open();
            }).start();
        };
        return BackupDataVolume;
    }());
    MVolume.BackupDataVolume = BackupDataVolume;
    var DeleteDataVolumeFromBackupStorage = (function () {
        function DeleteDataVolumeFromBackupStorage(volMgr, psMgr, bsMgr) {
            var _this = this;
            this.volMgr = volMgr;
            this.psMgr = psMgr;
            this.bsMgr = bsMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/volume/deleteVolumeFromBackupStorage.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zDeleteDataVolumeFromBackupStorage] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.backupStorageOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"volume.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.Type" | translate}}:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.State" | translate}}:</span><span>#: state #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.bsUuid = null;
                $scope.canProceed = function () {
                    return Utils.notNullnotUndefined($scope.bsUuid);
                };
                $scope.cancel = function () {
                    $scope.deleteDataVolumeFromBackupStorage__.close();
                };
                $scope.done = function () {
                    volMgr.backup(_this.options.volume, $scope.bsUuid, function () {
                        if (_this.options.done) {
                            _this.options.done();
                        }
                    });
                    $scope.deleteDataVolumeFromBackupStorage__.close();
                };
                $scope.deleteDataVolumeFromBackupStorageOptions__ = {
                    width: '500px'
                };
                _this.$scope = $scope;
            };
        }
        DeleteDataVolumeFromBackupStorage.prototype.open = function () {
            var _this = this;
            var bsUuidsAlreadyOn = [];
            angular.forEach(this.options.volume.backupStorageRefs, function (it) {
                bsUuidsAlreadyOn.push(it.backupStorageUuid);
            });
            var qobj = new ApiHeader.QueryObject();
            qobj.conditions = [{
                name: 'uuid',
                op: 'in',
                value: bsUuidsAlreadyOn.join()
            }];
            this.bsMgr.query(qobj, function (bss) {
                _this.$scope.backupStorageOptions__.dataSource.data(bss);
                if (bss.length > 0) {
                    _this.$scope.bsUuid = bss[0].uuid;
                }
                _this.$scope.deleteDataVolumeFromBackupStorage__.center();
                _this.$scope.deleteDataVolumeFromBackupStorage__.open();
            });
        };
        return DeleteDataVolumeFromBackupStorage;
    }());
    MVolume.DeleteDataVolumeFromBackupStorage = DeleteDataVolumeFromBackupStorage;
    var CreateTemplateFromRootVolume = (function () {
        function CreateTemplateFromRootVolume(volMgr, bsMgr, psMgr, vmMgr, api) {
            var _this = this;
            this.volMgr = volMgr;
            this.bsMgr = bsMgr;
            this.psMgr = psMgr;
            this.vmMgr = vmMgr;
            this.api = api;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/volume/createTemplateFromVolume.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zCreateTemplateFromRootVolume] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.backupStorageOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"volume.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.Type" | translate}}:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.State" | translate}}:</span><span>#: state #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.hasBackupStorage = function () {
                    return $scope.backupStorageOptions__.dataSource.data().length > 0;
                };
                $scope.platformOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [
                        'Linux',
                        'Windows',
                        'WindowsVirtio',
                        'Other',
                        'Paravirtualization'
                    ] })
                };
                $scope.bitsOptions__ = {
                    dataSource: new kendo.data.DataSource({
                        data: [64, 32]
                    })
                };
                $scope.isVmInCorrectState = function () {
                    if (!Utils.notNullnotUndefined($scope.vm)) {
                        return false;
                    }
                    return $scope.vm.state == 'Stopped';
                };
                $scope.canProceed = function () {
                    return Utils.notNullnotUndefined($scope.bsUuid) && $scope.isVmInCorrectState();
                };
                $scope.cancel = function () {
                    $scope.createTemplateFromRootVolume__.close();
                };
                $scope.done = function () {
                    volMgr.createTemplate(_this.options.volume, {
                        backupStorageUuid: $scope.bsUuid,
                        name: $scope.name,
                        description: $scope.description,
                        platform: $scope.platform,
                        guestOsType: $scope.guestOsType,
                        bits: $scope.bits,
                        system: $scope.system
                    }, function () {
                        if (_this.options.done) {
                            _this.options.done();
                        }
                    });
                    $scope.createTemplateFromRootVolume__.close();
                };
                $scope.createTemplateFromRootVolumeOptions__ = {
                    width: '600px'
                };
                _this.$scope = $scope;
            };
        }
        CreateTemplateFromRootVolume.prototype.open = function () {
            var _this = this;
            this.$scope.platform = 'Linux';
            this.$scope.bits = 64;
            this.$scope.name = null;
            this.$scope.description = null;
            this.$scope.system = false;
            this.$scope.guestOsType = null;
            this.$scope.vm = null;
            var chain = new Utils.Chain();
            var ps = null;
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [{
                    name: 'uuid',
                    op: '=',
                    value: _this.options.volume.primaryStorageUuid
                }];
                _this.psMgr.query(qobj, function (pss) {
                    ps = pss[0];
                    chain.next();
                });
            }).then(function () {
                var bsUuidsAlreadyOn = [];
                angular.forEach(_this.options.volume.backupStorageRefs, function (it) {
                    bsUuidsAlreadyOn.push(it.backupStorageUuid);
                });
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [{
                    name: 'attachedZoneUuids',
                    op: 'in',
                    value: [ps.zoneUuid].join()
                }];
                _this.bsMgr.query(qobj, function (bss) {
                    _this.$scope.backupStorageOptions__.dataSource.data(bss);
                    if (bss.length > 0) {
                        _this.$scope.bsUuid = bss[0].uuid;
                    }
                    chain.next();
                });
            }).then(function () {
                var msg = new ApiHeader.APIQueryVmInstanceMsg();
                msg.conditions = [{
                    name: 'allVolumes.uuid',
                    op: '=',
                    value: _this.options.volume.uuid
                }];
                _this.api.syncApi(msg, function (ret) {
                    _this.$scope.vm = ret.inventories[0];
                    chain.next();
                });
            }).done(function () {
                _this.$scope.createTemplateFromRootVolume__.center();
                _this.$scope.createTemplateFromRootVolume__.open();
            }).start();
        };
        return CreateTemplateFromRootVolume;
    }());
    MVolume.CreateTemplateFromRootVolume = CreateTemplateFromRootVolume;
    var DeleteSnapshotFromBackupStorage = (function () {
        function DeleteSnapshotFromBackupStorage(spMgr, bsMgr) {
            var _this = this;
            this.spMgr = spMgr;
            this.bsMgr = bsMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/volume/deleteSnapshotFromBackupStorage.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zDeleteSnapshotFromBackupStorage] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.backupStorageOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"volume.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.Type" | translate}}:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.State" | translate}}:</span><span>#: state #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"volume.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.bsUuid = null;
                $scope.canProceed = function () {
                    return Utils.notNullnotUndefined($scope.bsUuid);
                };
                $scope.cancel = function () {
                    $scope.deleteSnapshotFromBackupStorage__.close();
                };
                $scope.done = function () {
                    spMgr.deleteFromBackupStorage(_this.options.snapshot, $scope.bsUuid, function () {
                        if (_this.options.done) {
                            _this.options.done();
                        }
                    });
                    $scope.deleteSnapshotFromBackupStorage__.close();
                };
                $scope.deleteSnapshotFromBackupStorageOptions__ = {
                    width: '500px'
                };
                _this.$scope = $scope;
            };
        }
        DeleteSnapshotFromBackupStorage.prototype.open = function () {
            var _this = this;
            var bsUuidsAlreadyOn = [];
            angular.forEach(this.options.snapshot.backupStorageRefs, function (it) {
                bsUuidsAlreadyOn.push(it.backupStorageUuid);
            });
            var qobj = new ApiHeader.QueryObject();
            qobj.conditions = [{
                name: 'uuid',
                op: 'in',
                value: bsUuidsAlreadyOn.join()
            }];
            this.bsMgr.query(qobj, function (bss) {
                _this.$scope.backupStorageOptions__.dataSource.data(bss);
                if (bss.length > 0) {
                    _this.$scope.bsUuid = bss[0].uuid;
                }
                _this.$scope.deleteSnapshotFromBackupStorage__.center();
                _this.$scope.deleteSnapshotFromBackupStorage__.open();
            });
        };
        return DeleteSnapshotFromBackupStorage;
    }());
    MVolume.DeleteSnapshotFromBackupStorage = DeleteSnapshotFromBackupStorage;
})(MVolume || (MVolume = {}));
angular.module('root').factory('VolumeManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MVolume.VolumeManager(api, $rootScope);
}]).factory('SnapshotManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MVolume.SnapshotManager(api, $rootScope);
}]).directive('zCreateVolume', ['Api', 'DiskOfferingManager', 'VolumeManager', 'VmInstanceManager', function (api, diskOfferingMgr, volumeMgr, vmMgr) {
    return new MVolume.CreateVolume(api, diskOfferingMgr, volumeMgr, vmMgr);
}]).directive('zVolumeAttachVm', ['Api', 'VolumeManager', function (api, volMgr) {
    return new MVolume.AttachVm(api, volMgr);
}]).directive('zVolumeDetachVm', ['VolumeManager', 'VmInstanceManager', function (volMgr, vmMgr) {
    return new MVolume.DetachVm(volMgr, vmMgr);
}]).directive('zVolumeTakeSnapshot', ['VolumeManager', function (volMgr) {
    return new MVolume.TakeSnapshot(volMgr);
}]).directive('zVolumeRevertToSnapshot', ['SnapshotManager', 'VolumeManager', 'VmInstanceManager', function (spMgr, volMgr, vmMgr) {
    return new MVolume.RevertSnapshot(spMgr, volMgr, vmMgr);
}]).directive('zBackupSnapshot', ['SnapshotManager', 'PrimaryStorageManager', 'BackupStorageManager', function (spMgr, psMgr, bsMgr) {
    return new MVolume.BackupSnapshot(spMgr, psMgr, bsMgr);
}]).directive('zBackupDataVolume', ['VolumeManager', 'PrimaryStorageManager', 'BackupStorageManager', function (volMgr, psMgr, bsMgr) {
    return new MVolume.BackupDataVolume(volMgr, psMgr, bsMgr);
}]).directive('zDeleteSnapshotFromBackupStorage', ['SnapshotManager', 'BackupStorageManager', function (spMgr, bsMgr) {
    return new MVolume.DeleteSnapshotFromBackupStorage(spMgr, bsMgr);
}]).directive('zCreateTemplateFromRootVolume', ['VolumeManager', 'BackupStorageManager', 'PrimaryStorageManager', 'VmInstanceManager', 'Api', function (volMgr, bsMgr, psMgr, vmMgr, api) {
    return new MVolume.CreateTemplateFromRootVolume(volMgr, bsMgr, psMgr, vmMgr, api);
}]).config(['$routeProvider', function (route) {
    route.when('/volume', {
        templateUrl: '/static/templates/volume/volume.html',
        controller: 'MVolume.Controller',
        resolve: {
            hypervisorTypes: function ($q, Api) {
                var defer = $q.defer();
                Api.getHypervisorTypes(function (hypervisorTypes) {
                    defer.resolve(hypervisorTypes);
                });
                return defer.promise;
            }
        }
    }).when('/volume/:uuid', {
        templateUrl: '/static/templates/volume/details.html',
        controller: 'MVolume.DetailsController',
        resolve: {
            current: function ($q, $route, VolumeManager) {
                var defer = $q.defer();
                var chain = new Utils.Chain();
                var uuid = $route.current.params.uuid;
                var ret = {
                    volume: null,
                    snapshotTree: null
                };
                chain.then(function () {
                    var qobj = new ApiHeader.QueryObject();
                    qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                    VolumeManager.query(qobj, function (volumes) {
                        ret.volume = volumes[0];
                        chain.next();
                    });
                }).then(function () {
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = [{
                        name: 'volumeUuid',
                        op: '=',
                        value: uuid
                    }];
                    VolumeManager.querySnapshotTree(qobj, function (trees) {
                        ret.snapshotTree = trees;
                        chain.next();
                    });
                }).done(function () {
                    defer.resolve(ret);
                }).start();
                return defer.promise;
            }
        }
    }).when('/volumeSnapshot/:uuid', {
        templateUrl: '/static/templates/volume/snapshotDetails.html',
        controller: 'MVolume.SnapshotDetailsController',
        resolve: {
            current: function ($q, $route, SnapshotManager) {
                var defer = $q.defer();
                var uuid = $route.current.params.uuid;
                var qobj = new ApiHeader.QueryObject();
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                SnapshotManager.query(qobj, function (sps) {
                    defer.resolve(sps[0]);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />