var MVmInstance;
(function (MVmInstance) {
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
    MVmInstance.VmNic = VmNic;
    var VmInstance = (function (_super) {
        __extends(VmInstance, _super);
        function VmInstance() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        VmInstance.prototype.progressOn = function () {
            this.inProgress = true;
        };
        VmInstance.prototype.progressOff = function () {
            this.inProgress = false;
        };
        VmInstance.prototype.isInProgress = function () {
            return this.inProgress;
        };
        VmInstance.prototype.stateLabel = function () {
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
        VmInstance.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('zoneUuid', inv.zoneUuid);
            self.set('clusterUuid', inv.clusterUuid);
            self.set('hypervisorType', inv.hypervisorType);
            self.set('state', inv.state);
            self.set('hostUuid', inv.hostUuid);
            self.set('lastHostUuid', inv.lastHostUuid);
            self.set('rootVolumeUuid', inv.rootVolumeUuid);
            self.set('defaultL3NetworkUuid', inv.defaultL3NetworkUuid);
            self.set('vmNics', inv.vmNics);
            self.set('type', inv.type);
            self.set('imageUuid', inv.imageUuid);
            self.set('allVolumes', inv.allVolumes);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
            self.set('cpuSpeed', inv.cpuSpeed);
            self.set('cpuNum', inv.cpuNum);
            self.set('allocatorStrategy', inv.allocatorStrategy);
        };
        return VmInstance;
    }(ApiHeader.VmInstanceInventory));
    VmInstance.STATES = ['Running', 'Starting', 'Stopping', 'Stopped', 'Rebooting', 'Migrating', 'Unknown', 'Created'];
    MVmInstance.VmInstance = VmInstance;
    var VmInstanceManager = (function () {
        function VmInstanceManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        VmInstanceManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        VmInstanceManager.prototype.wrap = function (obj) {
            return new kendo.data.ObservableObject(obj);
        };
        VmInstanceManager.prototype.create = function (vm, done) {
            var _this = this;
            var msg = new ApiHeader.APICreateVmInstanceMsg();
            msg.name = vm.name;
            msg.description = vm.description;
            msg.instanceOfferingUuid = vm.instanceOfferingUuid;
            msg.imageUuid = vm.imageUuid;
            msg.l3NetworkUuids = vm.l3NetworkUuids;
            msg.rootDiskOfferingUuid = vm.rootDiskOfferingUuid;
            msg.dataDiskOfferingUuids = vm.dataDiskOfferingUuids;
            msg.zoneUuid = vm.zoneUuid;
            msg.clusterUuid = vm.clusterUuid;
            msg.hostUuid = vm.hostUuid;
            msg.resourceUuid = vm.resourceUuid;
            msg.defaultL3NetworkUuid = vm.defaultL3NetworkUuid;
            msg.systemTags = [];
            for (var i = 0; i < vm.l3NetworkStaticIps.length; ++i) {
                msg.systemTags.push('staticIp::' + vm.l3NetworkStaticIps[i].uuid + '::' + vm.l3NetworkStaticIps[i].staticIp);
            }
            if (Utils.notNullnotUndefined(vm.hostname)) {
                msg.systemTags.push('hostname::' + vm.hostname);
            }
            this.api.asyncApi(msg, function (ret) {
                var c = new VmInstance();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Created new VmInstance: {0}', c.name),
                    link: Utils.sprintf('/#/vm/{0}', c.uuid)
                });
            });
        };
        VmInstanceManager.prototype.getConsole = function (vm, done) {
            var msg = new ApiHeader.APIRequestConsoleAccessMsg();
            msg.vmInstanceUuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                done(ret.inventory);
            });
        };
        VmInstanceManager.prototype.query = function (qobj, callback, allVm) {
            var _this = this;
            if (allVm === void 0) { allVm = false; }
            var msg = new ApiHeader.APIQueryVmInstanceMsg();
            msg.count = qobj.count === true;
            msg.start = qobj.start;
            msg.limit = qobj.limit;
            msg.replyWithCount = true;
            msg.conditions = qobj.conditions ? qobj.conditions : [];
            if (!allVm) {
                msg.conditions.push({
                    name: "type",
                    op: "=",
                    value: "UserVm"
                });
            }
            if (Utils.notNullnotUndefined(this.sortBy) && this.sortBy.isValid()) {
                msg.sortBy = this.sortBy.field;
                msg.sortDirection = this.sortBy.direction;
            }
            this.api.syncApi(msg, function (ret) {
                var pris = [];
                ret.inventories.forEach(function (inv) {
                    var c = new VmInstance();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        VmInstanceManager.prototype.expunge = function (vm, done) {
            var _this = this;
            vm.progressOn();
            vm.state = "Expunging";
            var msg = new ApiHeader.APIExpungeVmInstanceMsg();
            msg.uuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                vm.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Expunged VmInstance: {0}', vm.name)
                });
            });
        };
        VmInstanceManager.prototype.recover = function (vm) {
            var _this = this;
            vm.progressOn();
            var msg = new ApiHeader.APIRecoverVmInstanceMsg();
            msg.uuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                vm.updateObservableObject(ret.inventory);
                vm.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Recovered VmInstance: {0}', vm.name),
                    link: Utils.sprintf('/#/vmInstance/{0}', vm.uuid)
                });
            });
        };
        VmInstanceManager.prototype.stop = function (vm) {
            var _this = this;
            vm.progressOn();
            vm.state = 'Stopping';
            var msg = new ApiHeader.APIStopVmInstanceMsg();
            msg.uuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                vm.updateObservableObject(ret.inventory);
                vm.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Stopped VmInstance: {0}', vm.name),
                    link: Utils.sprintf('/#/vmInstance/{0}', vm.uuid)
                });
            });
        };
        VmInstanceManager.prototype.start = function (vm) {
            var _this = this;
            vm.progressOn();
            vm.state = 'Starting';
            var msg = new ApiHeader.APIStartVmInstanceMsg();
            msg.uuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                vm.updateObservableObject(ret.inventory);
                vm.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Started VmInstance: {0}', vm.name),
                    link: Utils.sprintf('/#/vmInstance/{0}', vm.uuid)
                });
            });
        };
        VmInstanceManager.prototype.reboot = function (vm) {
            var _this = this;
            vm.progressOn();
            vm.state = 'Rebooting';
            var msg = new ApiHeader.APIRebootVmInstanceMsg();
            msg.uuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                vm.updateObservableObject(ret.inventory);
                vm.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Rebooted VmInstance: {0}', vm.name),
                    link: Utils.sprintf('/#/vmInstance/{0}', vm.uuid)
                });
            }, function () {
                vm.progressOff();
            });
        };
        VmInstanceManager.prototype["delete"] = function (vm, done) {
            var _this = this;
            vm.progressOn();
            vm.state = 'Destroying';
            var msg = new ApiHeader.APIDestroyVmInstanceMsg();
            msg.uuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                vm.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted VmInstance: {0}', vm.name)
                });
            });
        };
        VmInstanceManager.prototype.migrate = function (vm, hostUuid, done) {
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
                    msg: Utils.sprintf('Migrated VmInstance: {0}', vm.name),
                    link: Utils.sprintf('/#/vmInstance/{0}', vm.uuid)
                });
            });
        };
        VmInstanceManager.prototype.attachL3Network = function (vm, l3Uuid, done) {
            var _this = this;
            vm.progressOn();
            var msg = new ApiHeader.APIAttachL3NetworkToVmMsg();
            msg.l3NetworkUuid = l3Uuid;
            msg.vmInstanceUuid = vm.uuid;
            this.api.asyncApi(msg, function (ret) {
                vm.updateObservableObject(ret.inventory);
                vm.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Attached a L3 network to the VM: {0}', vm.name),
                    link: Utils.sprintf('/#/vmInstance/{0}', vm.uuid)
                });
            });
        };
        VmInstanceManager.prototype.detachL3Network = function (vm, nicUuid, done) {
            var _this = this;
            vm.progressOn();
            var msg = new ApiHeader.APIDetachL3NetworkFromVmMsg();
            msg.vmNicUuid = nicUuid;
            this.api.asyncApi(msg, function (ret) {
                vm.updateObservableObject(ret.inventory);
                vm.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Detached a L3 network from the VM: {0}', vm.name),
                    link: Utils.sprintf('/#/vmInstance/{0}', vm.uuid)
                });
            });
        };
        VmInstanceManager.prototype.attachVolume = function (vm, volUuid, done) {
            var _this = this;
            vm.progressOn();
            var msg = new ApiHeader.APIAttachDataVolumeToVmMsg();
            msg.vmInstanceUuid = vm.uuid;
            msg.volumeUuid = volUuid;
            this.api.asyncApi(msg, function (ret) {
                vm.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done(ret.inventory);
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Attached data volume to vm instance: {0}', vm.name),
                    link: Utils.sprintf('/#/vmInstance/{0}', vm.uuid)
                });
            });
        };
        VmInstanceManager.prototype.detachVolume = function (vm, volUuid, done) {
            var _this = this;
            vm.progressOn();
            var msg = new ApiHeader.APIDetachDataVolumeFromVmMsg();
            msg.uuid = volUuid;
            this.api.asyncApi(msg, function (ret) {
                vm.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Detached data volume from vm instance: {0}', vm.name),
                    link: Utils.sprintf('/#/vmInstance/{0}', vm.uuid)
                });
            });
        };
        VmInstanceManager.prototype.changeInstanceOffering = function (vm, insUuid, done) {
            var _this = this;
            vm.progressOn();
            var msg = new ApiHeader.APIChangeInstanceOfferingMsg();
            msg.vmInstanceUuid = vm.uuid;
            msg.instanceOfferingUuid = insUuid;
            this.api.asyncApi(msg, function (ret) {
                vm.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Changed the instance offering of the VM instance: {0}; you may need to stop/start the VM', vm.name),
                    link: Utils.sprintf('/#/vmInstance/{0}', vm.uuid)
                });
            });
        };
        VmInstanceManager.prototype.queryVmNic = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryVmNicMsg();
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
                    var c = new VmNic();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        return VmInstanceManager;
    }());
    VmInstanceManager.$inject = ['Api', '$rootScope'];
    MVmInstance.VmInstanceManager = VmInstanceManager;
    var VmInstanceModel = (function (_super) {
        __extends(VmInstanceModel, _super);
        function VmInstanceModel() {
            var _this = _super.call(this) || this;
            _this.current = new VmInstance();
            return _this;
        }
        return VmInstanceModel;
    }(Utils.Model));
    MVmInstance.VmInstanceModel = VmInstanceModel;
    var OVmInstanceGrid = (function (_super) {
        __extends(OVmInstanceGrid, _super);
        function OVmInstanceGrid($scope, vmMgr, hostMgr) {
            var _this = _super.call(this) || this;
            _this.vmMgr = vmMgr;
            _this.hostMgr = hostMgr;
            _super.prototype.init.call(_this, $scope, $scope.vmGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"vm.ts.NAME" | translate}}',
                    width: '20%',
                    template: '<a href="/\\#/vmInstance/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'description',
                    title: '{{"vm.ts.DESCRIPTION" | translate}}',
                    width: '20%'
                },
                {
                    field: 'defaultIp',
                    title: '{{"vm.ts.DEFAULT IP" | translate}}',
                    width: '20%',
                    template: '{{dataItem.defaultIp}}'
                },
                {
                    field: 'hostIp',
                    title: '{{"vm.ts.HOST IP" | translate}}',
                    width: '20%',
                    template: '<a href="/\\#/host/{{dataItem.hostUuid}}">{{dataItem.managementIp}}</a>'
                },
                {
                    field: 'state',
                    title: '{{"vm.ts.STATE" | translate}}',
                    width: '20%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'uuid',
                    title: '{{"vm.ts.UUID" | translate}}',
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
                    for (var i in vms) {
                        var defaultL3NetworkUuid = vms[i].defaultL3NetworkUuid;
                        for (var j in vms[i].vmNics) {
                            if (defaultL3NetworkUuid == vms[i].vmNics[j].l3NetworkUuid) {
                                vms[i].defaultIp = vms[i].vmNics[j].ip;
                                break;
                            }
                        }
                    }
                    var hostUuids = [];
                    for (var j in vms) {
                        var vm = vms[j];
                        if (vm.state == 'Running') {
                            hostUuids.push(vm.hostUuid);
                        }
                    }
                    if (hostUuids.length > 0) {
                        var qobj = new ApiHeader.QueryObject();
                        qobj.addCondition({ name: 'uuid', op: 'in', value: hostUuids.join() });
                        _this.hostMgr.query(qobj, function (hosts, total) {
                            for (var i in vms) {
                                for (var j in hosts) {
                                    if (vms[i].hostUuid == hosts[j].uuid) {
                                        vms[i].managementIp = hosts[j].managementIp;
                                    }
                                }
                            }
                        });
                    }
                });
            };
            return _this;
        }
        return OVmInstanceGrid;
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
        Action.prototype.recover = function () {
            this.vmMgr.recover(this.$scope.model.current);
        };
        Action.prototype.migrate = function () {
            this.$scope.migrateVm.open();
        };
        Action.prototype.attachVolume = function () {
            this.$scope.attachVolume.open();
        };
        Action.prototype.detachVolume = function () {
            this.$scope.detachVolume.open();
        };
        Action.prototype.attachL3Network = function () {
            this.$scope.attachL3Network.open();
        };
        Action.prototype.detachL3Network = function () {
            this.$scope.detachL3Network.open();
        };
        Action.prototype.console = function () {
            this.$scope.console();
        };
        Action.prototype.changeInstanceOffering = function () {
            this.$scope.changeInstanceOffering.open();
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
            else if (action == 'attachVolume') {
                return this.$scope.model.current.state == 'Running' || this.$scope.model.current.state == 'Stopped';
            }
            else if (action == 'detachVolume' && Utils.notNullnotUndefined(this.$scope.model.current)) {
                return this.$scope.model.current.allVolumes.length > 0 && (this.$scope.model.current.state == 'Running' || this.$scope.model.current.state == 'Stopped');
            }
            else if (action == 'console' && Utils.notNullnotUndefined(this.$scope.model.current)) {
                return this.$scope.model.current.state == 'Starting' || this.$scope.model.current.state == 'Running' || this.$scope.model.current.state == 'Rebooting' || this.$scope.model.current.state == 'Stopping';
            }
            else if (action == 'attachL3Network' && Utils.notNullnotUndefined(this.$scope.model.current)) {
                return this.$scope.model.current.state == 'Running' || this.$scope.model.current.state == 'Stopped';
            }
            else if (action == 'detachL3Network' && Utils.notNullnotUndefined(this.$scope.model.current)) {
                return (this.$scope.model.current.state == 'Running' || this.$scope.model.current.state == 'Stopped') &&
                    this.$scope.model.current.vmNics.length > 0;
            }
            else if (action == 'changeInstanceOffering' && Utils.notNullnotUndefined(this.$scope.model.current)) {
                return this.$scope.model.current.state == 'Running' || this.$scope.model.current.state == 'Stopped';
            }
            else if (action == 'recoverVm' && Utils.notNullnotUndefined(this.$scope.model.current)) {
                return this.$scope.model.current.state == 'Destroyed';
            }
            else if (action == 'expungeVm' && Utils.notNullnotUndefined(this.$scope.model.current)) {
                return this.$scope.model.current.state == 'Destroyed';
            }
            else if (action == 'delete' && Utils.notNullnotUndefined(this.$scope.model.current)) {
                return this.$scope.model.current.state != 'Destroyed';
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
                            name: '{{"vm.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"vm.ts.State" | translate}}',
                            value: FilterBy.STATE
                        },
                        {
                            name: '{{"vm.ts.HypervisorType" | translate}}',
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
                    _this.valueList.dataSource.data(VmInstance.STATES);
                }
                else if (_this.field == FilterBy.TYPE) {
                    _this.valueList.dataSource.data(_this.hypervisorTypes);
                }
            });
        }
        FilterBy.prototype.confirm = function (popover) {
            this.$scope.oVmInstanceGrid.setFilter(this.toKendoFilter());
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
        function DetailsController($scope, vmMgr, $routeParams, tagService, vm, clusterMgr, $rootScope, $window) {
            var _this = this;
            this.$scope = $scope;
            this.vmMgr = vmMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            var current = vm.vm;
            $scope.model = new VmInstanceModel();
            $scope.model.current = current;
            $scope.hostname = vm.hostname;
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
            $scope.funcDeleteVmInstance = function () {
                $scope.deleteVmInstance.open();
            };
            $scope.funcExpungeVmInstance = function () {
                $scope.expungeVmInstance.open();
            };
            $scope.optionsDeleteVmInstance = {
                title: 'DELETE VM INSTANCE',
                btnType: 'btn-danger',
                width: '350px',
                description: function () {
                    return current.name;
                },
                confirm: function () {
                    vmMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsExpungeVmInstance = {
                title: 'EXPUNGE VM INSTANCE',
                btnType: 'btn-danger',
                width: '350px',
                description: function () {
                    return current.name;
                },
                confirm: function () {
                    vmMgr.expunge($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.console = function () {
                vmMgr.getConsole(current, function (inv) {
                    var windowName = current.name + current.uuid;
                    $window.open(Utils.sprintf('/static/templates/console/vnc_auto.html?host={0}&port={1}&token={2}&title={3}', inv.hostname, inv.port, inv.token, current.name), windowName);
                });
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeVmInstanceVO, function (ret) {
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
            $scope.optionsChangeInstanceOffering = {
                vm: current
            };
            $scope.optionsAttachL3Network = {
                vm: current,
                done: function () {
                    $scope.funcRefresh();
                }
            };
            $scope.optionsDetachL3Network = {
                vm: current,
                done: function () {
                    $scope.funcRefresh();
                }
            };
            $scope.optionsAttachVolume = {
                vm: current,
                done: function (vol) {
                    $scope.optionsVolumeGrid.dataSource.insert(0, vol);
                }
            };
            $scope.optionsDetachVolume = {
                vm: current,
                done: function (vol) {
                    var ds = $scope.optionsVolumeGrid.dataSource;
                    var cs = ds.data();
                    for (var i = 0; i < cs.length; i++) {
                        var tcs = cs[i];
                        if (vol.uuid == tcs.uuid) {
                            var row = ds.getByUid(tcs.uid);
                            ds.remove(row);
                            break;
                        }
                    }
                }
            };
            $scope.optionsNicGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'deviceId',
                        title: '{{"vm.ts.DEVICE ID" | translate}}',
                        width: '4%'
                    },
                    {
                        field: 'l3NetworkUuid',
                        title: '{{"vm.ts.L3 Network" | translate}}',
                        width: '20%',
                        template: '<a href="/\\#/l3Network/{{dataItem.l3NetworkUuid}}">{{dataItem.l3NetworkUuid}}</a>'
                    },
                    {
                        field: 'ip',
                        title: '{{"vm.ts.IP" | translate}}',
                        width: '14%'
                    },
                    {
                        field: 'netmask',
                        title: '{{"vm.ts.NETMASK" | translate}}',
                        width: '14%'
                    },
                    {
                        field: 'gateway',
                        title: '{{"vm.ts.GATEWAY" | translate}}',
                        width: '14%'
                    },
                    {
                        field: 'mac',
                        title: '{{"vm.ts.MAC" | translate}}',
                        width: '14%'
                    },
                    {
                        field: 'uuid',
                        title: '{{"vm.ts.UUID" | translate}}',
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
                        title: '{{"vm.ts.DEVICE ID" | translate}}',
                        width: '10%',
                        template: '<a href="/\\#/volume/{{dataItem.uuid}}">{{dataItem.deviceId}}</a>'
                    },
                    {
                        field: 'name',
                        title: '{{"vm.ts.NAME" | translate}}',
                        width: '18%'
                    },
                    {
                        field: 'type',
                        title: '{{"vm.ts.TYPE" | translate}}',
                        width: '18%'
                    },
                    {
                        field: 'state',
                        title: '{{"vm.ts.STATE" | translate}}',
                        width: '18%'
                    },
                    {
                        field: 'status',
                        title: '{{"vm.ts.STATUS" | translate}}',
                        width: '18%'
                    },
                    {
                        field: 'uuid',
                        title: '{{"vm.ts.UUID" | translate}}',
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
        }
        DetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.vmMgr.query(qobj, function (vms, total) {
                Utils.safeApply(_this.$scope, function () {
                    var c = _this.$scope.model.current = vms[0];
                    _this.$scope.optionsNicGrid.dataSource.data(c.vmNics);
                    _this.$scope.optionsVolumeGrid.dataSource.data(c.allVolumes);
                });
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'VmInstanceManager', '$routeParams', 'Tag', 'current', 'ClusterManager', '$rootScope', '$window'];
    MVmInstance.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, vmMgr, hostMgr, hypervisorTypes, $location, $rootScope, $window, Translator, $translate) {
            this.$scope = $scope;
            this.vmMgr = vmMgr;
            this.hostMgr = hostMgr;
            this.hypervisorTypes = hypervisorTypes;
            this.$location = $location;
            this.$rootScope = $rootScope;
            this.$window = $window;
            this.Translator = Translator;
            this.$translate = $translate;
            $scope.model = new VmInstanceModel();
            $scope.oVmInstanceGrid = new OVmInstanceGrid($scope, vmMgr, hostMgr);
            $scope.action = new Action($scope, vmMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"vm.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"vm.ts.Description" | translate}}',
                        value: 'Description'
                    },
                    {
                        name: '{{"vm.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"vm.ts.Hypervisor" | translate}}',
                        value: 'hypervisorType'
                    },
                    {
                        name: '{{"vm.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"vm.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    vmMgr.setSortBy(ret);
                    $scope.oVmInstanceGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.VmInstanceInventoryQueryable,
                name: 'VmInstance',
                schema: {
                    state: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: VmInstance.STATES
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
                    vmMgr.query(qobj, function (VmInstances, total) {
                        $scope.oVmInstanceGrid.refresh(VmInstances);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/vmInstance/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope, this.hypervisorTypes);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateVmInstance = function (win) {
                win.open();
            };
            $scope.funcDeleteVmInstance = function () {
                $scope.deleteVmInstance.open();
            };
            $scope.funcExpungeVmInstance = function () {
                $scope.expungeVmInstance.open();
            };
            $scope.optionsDeleteVmInstance = {
                title: 'DELETE VM INSTANCE',
                btnType: 'btn-danger',
                width: '350px',
                description: function () {
                    return $scope.model.current.name;
                },
                confirm: function () {
                    vmMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oVmInstanceGrid.deleteCurrent();
                    });
                }
            };
            $scope.optionsExpungeVmInstance = {
                title: 'EXPUNGE VM INSTANCE',
                btnType: 'btn-danger',
                width: '350px',
                description: function () {
                    return $scope.model.current.name;
                },
                confirm: function () {
                    vmMgr.expunge($scope.model.current, function (ret) {
                        $scope.oVmInstanceGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oVmInstanceGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateVmInstance = {
                done: function (info) {
                    var vm = new VmInstance();
                    info.uuid = info.resourceUuid = Utils.uuid();
                    info.state = 'Starting';
                    angular.extend(vm, info);
                    vm = vmMgr.wrap(vm);
                    $scope.oVmInstanceGrid.add(vm);
                    vmMgr.create(info, function (ret) {
                        $scope.oVmInstanceGrid.refresh();
                    });
                }
            };
            $scope.console = function () {
                vmMgr.getConsole($scope.model.current, function (inv) {
                    var windowName = $scope.model.current.name + $scope.model.current.uuid;
                    $window.open(Utils.sprintf('/static/templates/console/vnc_auto.html?host={0}&port={1}&token={2}&title={3}', inv.hostname, inv.port, inv.token, $scope.model.current.name), windowName);
                });
            };
            $scope.optionsMigrateVm = {
                vm: null
            };
            $scope.optionsChangeInstanceOffering = {
                vm: null
            };
            $scope.optionsAttachVolume = {
                vm: null
            };
            $scope.optionsDetachVolume = {
                vm: null
            };
            $scope.optionsAttachL3Network = {
                vm: null
            };
            $scope.optionsDetachL3Network = {
                vm: null
            };
            $scope.$watch(function () {
                return $scope.model.current;
            }, function () {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    $scope.optionsMigrateVm.vm = $scope.model.current;
                    $scope.optionsChangeInstanceOffering.vm = $scope.model.current;
                    $scope.optionsAttachVolume.vm = $scope.model.current;
                    $scope.optionsDetachVolume.vm = $scope.model.current;
                    $scope.optionsAttachL3Network.vm = $scope.model.current;
                    $scope.optionsDetachL3Network.vm = $scope.model.current;
                }
            });
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'VmInstanceManager', 'HostManager', 'hypervisorTypes', '$location', '$rootScope', '$window', 'Translator', '$translate'];
    MVmInstance.Controller = Controller;
    var ChangeInstanceOffering = (function () {
        function ChangeInstanceOffering(api, vmMgr, insMgr) {
            var _this = this;
            this.api = api;
            this.vmMgr = vmMgr;
            this.insMgr = insMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/vm/changeInstanceOffering.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zChangeInstanceOffering] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.instanceOfferingUuid = null;
                $scope.instanceOfferingOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.CPU Number" | translate}}</span><span>#: cpuNum #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.Memory" | translate}}</span><span>#: memorySize #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                $scope.canProceed = function () {
                    return Utils.notNullnotUndefined($scope.instanceOfferingUuid);
                };
                $scope.cancel = function () {
                    $scope.changeInstanceOffering__.close();
                };
                $scope.done = function () {
                    vmMgr.changeInstanceOffering(_this.options.vm, $scope.instanceOfferingUuid, function () {
                        if (_this.options.done) {
                            _this.options.done();
                        }
                    });
                    $scope.changeInstanceOffering__.close();
                };
            };
        }
        ChangeInstanceOffering.prototype.open = function () {
            var _this = this;
            this.$scope.instanceOfferingOptions__.dataSource.data([]);
            this.$scope.instanceOfferingUuid = null;
            var chain = new Utils.Chain();
            chain.then(function () {
                var q = new ApiHeader.QueryObject();
                q.addCondition({ name: 'state', op: '=', value: 'Enabled' });
                if (_this.options.vm.instanceOfferingUuid) {
                    q.addCondition({ name: 'uuid', op: '!=', value: _this.options.vm.instanceOfferingUuid });
                }
                _this.insMgr.query(q, function (ins) {
                    _this.$scope.instanceOfferingOptions__.dataSource.data(ins);
                    chain.next();
                });
            }).done(function () {
                _this.$scope.changeInstanceOffering__.center();
                _this.$scope.changeInstanceOffering__.open();
            }).start();
        };
        return ChangeInstanceOffering;
    }());
    MVmInstance.ChangeInstanceOffering = ChangeInstanceOffering;
    var MigrateVm = (function () {
        function MigrateVm(api, vmMgr) {
            var _this = this;
            this.api = api;
            this.vmMgr = vmMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/vm/migrateVm.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zMigrateVmInstance] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.hostUuid = null;
                $scope.hostOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.Cluster UUID" | translate}}</span><span>#: clusterUuid #</span></div>'
                };
                $scope.canProceed = function () {
                    return Utils.notNullnotUndefined($scope.hostUuid);
                };
                $scope.cancel = function () {
                    $scope.migrateVm__.close();
                };
                $scope.done = function () {
                    vmMgr.migrate(_this.options.vm, $scope.hostUuid, function () {
                        if (_this.options.done) {
                            _this.options.done();
                        }
                    });
                    $scope.migrateVm__.close();
                };
                $scope.migrateVmOptions__ = {
                    width: '600px'
                };
            };
        }
        MigrateVm.prototype.open = function () {
            var _this = this;
            this.$scope.hostOptions__.dataSource.data([]);
            this.$scope.hostUuid = null;
            var chain = new Utils.Chain();
            chain.then(function () {
                _this.api.getVmMigrationCandidateHosts(_this.options.vm.uuid, function (hosts) {
                    _this.$scope.hostOptions__.dataSource.data(hosts);
                    if (hosts.length > 0) {
                        _this.$scope.hostUuid = hosts[0].uuid;
                    }
                    chain.next();
                });
            }).done(function () {
                _this.$scope.migrateVm__.center();
                _this.$scope.migrateVm__.open();
            }).start();
        };
        return MigrateVm;
    }());
    MVmInstance.MigrateVm = MigrateVm;
    var CreateVmInstanceOptions = (function () {
        function CreateVmInstanceOptions() {
        }
        return CreateVmInstanceOptions;
    }());
    MVmInstance.CreateVmInstanceOptions = CreateVmInstanceOptions;
    var CreateVmInstance = (function () {
        function CreateVmInstance(api, vmMgr, clusterMgr, hostMgr, zoneMgr, instOfferingMgr, diskOfferingMgr, l3Mgr, imageMgr) {
            var _this = this;
            this.api = api;
            this.vmMgr = vmMgr;
            this.clusterMgr = clusterMgr;
            this.hostMgr = hostMgr;
            this.zoneMgr = zoneMgr;
            this.instOfferingMgr = instOfferingMgr;
            this.diskOfferingMgr = diskOfferingMgr;
            this.l3Mgr = l3Mgr;
            this.imageMgr = imageMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateVmInstance;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new CreateVmInstanceOptions();
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
                    instanceOfferingUuid: null,
                    imageUuid: null,
                    l3NetworkUuid: null,
                    l3NetworkIp: null,
                    l3NetworkUuids: [],
                    l3NetworkStaticIps: [],
                    dataDiskOfferingUuids: [],
                    rootDiskOfferingUuid: null,
                    imageMediaType: null,
                    images: {},
                    defaultL3NetworkUuid: null,
                    hostname: null,
                    hasImage: function () {
                        return $scope.imageOptions__.dataSource.data().length > 0;
                    },
                    hasInstanceOffering: function () {
                        return $scope.instanceOfferingOptions__.dataSource.data().length > 0;
                    },
                    hasL3Network: function () {
                        return $scope.l3NetworkGrid__.dataSource.data().length > 0;
                    },
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        if (this.imageMediaType == 'RootVolumeTemplate') {
                            return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.instanceOfferingUuid)
                                && Utils.notNullnotUndefined(this.imageUuid) && this.hasL3Network();
                        }
                        else {
                            return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.instanceOfferingUuid)
                                && Utils.notNullnotUndefined(this.imageUuid) && this.hasL3Network() && Utils.notNullnotUndefined(this.rootDiskOfferingUuid);
                        }
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createVmInstanceInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    syncL3NetworkDataFromView: function () {
                        var l3NetworkGridRawData = $scope.l3NetworkGrid__.dataSource.data();
                        this.l3NetworkUuids = [];
                        this.l3NetworkStaticIps = [];
                        for (var i = 0; i < l3NetworkGridRawData.length; ++i) {
                            this.l3NetworkUuids.push(l3NetworkGridRawData[i].uuid);
                            if (Utils.notNullnotUndefined(this.l3NetworkIp) && this.l3NetworkIp != "") {
                                this.l3NetworkStaticIps.push({
                                    uuid: l3NetworkGridRawData[i].uuid,
                                    staticIp: l3NetworkGridRawData[i].staticIp
                                });
                            }
                        }
                    },
                    addL3Network: function () {
                        if (!this.isStaticIpValid())
                            return;
                        var l3NetworkOptionsRawData = $scope.l3NetworkOptions__.dataSource.data();
                        var l3Network = null;
                        for (var i = 0; i < l3NetworkOptionsRawData.length; ++i) {
                            if (l3NetworkOptionsRawData[i].uuid == this.l3NetworkUuid) {
                                l3Network = l3NetworkOptionsRawData[i];
                                break;
                            }
                        }
                        if (Utils.notNullnotUndefined(this.l3NetworkIp)) {
                            l3Network.staticIp = this.l3NetworkIp.trim();
                        }
                        var l3NetworkGridRawData = $scope.l3NetworkGrid__.dataSource.data();
                        var updated = false;
                        for (var i = 0; i < l3NetworkGridRawData.length; ++i) {
                            if (l3NetworkGridRawData[i].uuid == l3Network.uuid) {
                                l3NetworkGridRawData[i].staticIp = l3Network.staticIp;
                                updated = true;
                                break;
                            }
                        }
                        if (!updated) {
                            $scope.l3NetworkGrid__.dataSource.pushCreate(l3Network);
                        }
                        this.syncL3NetworkDataFromView();
                        $scope.defaultL3NetworkOptions__.dataSource.data($scope.l3NetworkGrid__.dataSource.data());
                        this.l3NetworkIp = "";
                    },
                    delL3Network: function (uid) {
                        var row = $scope.l3NetworkGrid__.dataSource.getByUid(uid);
                        $scope.l3NetworkGrid__.dataSource.remove(row);
                        this.syncL3NetworkDataFromView();
                    },
                    isStaticIpValid: function () {
                        if (Utils.notNullnotUndefined(this.l3NetworkIp)) {
                            if (this.l3NetworkIp.trim() == "")
                                return true;
                            else
                                return Utils.isIpv4Address(this.l3NetworkIp);
                        }
                        return true;
                    },
                    getPageName: function () {
                        return 'createVmInstanceInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('vm');
                        this.description = null;
                        this.imageUuid = null;
                        this.dataDiskOfferingUuids = [];
                        this.l3NetworkIp = null;
                        this.l3NetworkUuids = [];
                        this.instanceOfferingUuid = null;
                        this.activeState = false;
                        this.rootDiskOfferingUuid = null;
                        this.defaultL3NetworkUuid = null;
                        this.images = {};
                        this.hostname = null;
                    }
                };
                $scope.l3NetworkGrid__ = {
                    pageSize: 20,
                    resizable: true,
                    scrollable: true,
                    pageable: true,
                    columns: [
                        {
                            width: '12%',
                            title: '',
                            template: '<button type="button" class="btn btn-xs btn-default" ng-click="infoPage.delL3Network(dataItem.uid)"><i class="fa fa-times"></i></button>'
                        },
                        {
                            field: 'name',
                            title: '{{"vm.ts.NAME" | translate}}',
                            width: '44%'
                        },
                        {
                            field: 'staticIp',
                            title: '{{"vm.ts.STATIC IP" | translate}}',
                            width: '44%'
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
                var locationPage = $scope.locationPage = {
                    activeState: false,
                    zoneUuid: null,
                    clusterUuid: null,
                    hostUuid: null,
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return true;
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createVmInstanceLocation"]');
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
                        return 'createVmInstanceLocation';
                    },
                    reset: function () {
                        this.activeState = false;
                        this.zoneUuid = null;
                        this.clusterUuid = null;
                        this.hostUuid = null;
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
                        $scope.infoPage.hostUuid = $scope.locationPage.hostUuid;
                        $scope.infoPage.clusterUuid = $scope.locationPage.clusterUuid;
                        $scope.infoPage.zoneUuid = $scope.locationPage.zoneUuid;
                        _this.options.done(infoPage);
                        $scope.winCreateVmInstance__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage, locationPage
                ], mediator);
                $scope.$watch(function () {
                    return $scope.locationPage.zoneUuid;
                }, function () {
                    var zuuid = $scope.locationPage.zoneUuid;
                    if (Utils.notNullnotUndefined(zuuid)) {
                        var qobj = new ApiHeader.QueryObject();
                        qobj.conditions = [
                            {
                                name: 'zoneUuid',
                                op: '=',
                                value: zuuid
                            }
                        ];
                        _this.clusterMgr.query(qobj, function (clusters) {
                            _this.$scope.clusterOptions__.dataSource.data(clusters);
                        });
                    }
                });
                $scope.$watch(function () {
                    return $scope.locationPage.clusterUuid;
                }, function () {
                    var clusterUuid = $scope.locationPage.clusterUuid;
                    if (Utils.notNullnotUndefined(clusterUuid)) {
                        var qobj = new ApiHeader.QueryObject();
                        qobj.conditions = [
                            {
                                name: 'clusterUuid',
                                op: '=',
                                value: clusterUuid
                            }
                        ];
                        _this.hostMgr.query(qobj, function (hosts) {
                            _this.$scope.hostOptions__.dataSource.data(hosts);
                        });
                    }
                });
                $scope.$watch(function () {
                    return $scope.infoPage.imageUuid;
                }, function () {
                    if (!Utils.notNullnotUndefined($scope.infoPage.imageUuid)) {
                        return;
                    }
                    var img = $scope.infoPage.images[$scope.infoPage.imageUuid];
                    if (Utils.notNullnotUndefined(img)) {
                        $scope.infoPage.imageMediaType = img.mediaType;
                    }
                });
                $scope.zoneOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span>: #: name #</div>' + '<div style="color: black"><span class="z-label">{{"vm.ts.State" | translate}}</span>#: state #</div>' + '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span> #: uuid #</div>',
                    optionLabel: ""
                };
                $scope.winCreateVmInstanceOptions__ = {
                    width: '700px',
                    //height: '620px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.clusterOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    optionLabel: "",
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.NAME" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.HYPERVISOR" | translate}}</span><span>#: hypervisorType #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                $scope.hostOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    optionLabel: "",
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.State" | translate}}</span><span>#: state #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.Status" | translate}}</span><span>#: status #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                $scope.instanceOfferingOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.CPU Number" | translate}}</span><span>#: cpuNum #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.Memory" | translate}}</span><span>#: memorySize #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                $scope.diskOfferingOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.Disk Size" | translate}}</span><span>#: diskSize #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>',
                    change: function (e) {
                        Utils.safeApply($scope, function () {
                            var list = e.sender;
                            $scope.infoPage.dataDiskOfferingUuids = [];
                            angular.forEach(list.dataItems(), function (it) {
                                $scope.infoPage.dataDiskOfferingUuids.push(it.uuid);
                            });
                        });
                    }
                };
                $scope.rootDiskOfferingOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.Disk Size" | translate}}</span><span>#: diskSize #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                $scope.l3NetworkOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                $scope.defaultL3NetworkOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                $scope.imageOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.Platform" | translate}}</span><span>#: platform #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.Media Type" | translate}}</span><span>#= mediaType #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.Format" | translate}}</span><span>#: format #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/vm/createVm.html';
        }
        CreateVmInstance.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateVmInstance__;
            var chain = new Utils.Chain();
            this.$scope.clusterOptions__.dataSource.data([]);
            this.$scope.hostOptions__.dataSource.data([]);
            this.$scope.l3NetworkOptions__.dataSource.data([]);
            this.$scope.l3NetworkGrid__.dataSource.data([]);
            this.$scope.diskOfferingOptions__.dataSource.data([]);
            this.$scope.diskOfferingList__.value([]);
            this.$scope.button.reset();
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'state',
                        op: '=',
                        value: 'Enabled'
                    }
                ];
                _this.instOfferingMgr.query(qobj, function (instanceOfferings) {
                    _this.$scope.instanceOfferingOptions__.dataSource.data(instanceOfferings);
                    chain.next();
                });
            }).then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'state',
                        op: '=',
                        value: 'Enabled'
                    }
                ];
                _this.diskOfferingMgr.query(qobj, function (diskOfferings) {
                    _this.$scope.diskOfferingOptions__.dataSource.data(diskOfferings);
                    _this.$scope.rootDiskOfferingOptions__.dataSource.data(diskOfferings);
                    chain.next();
                });
            }).then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'state',
                        op: '=',
                        value: 'Enabled'
                    },
                    {
                        name: 'system',
                        op: '=',
                        value: 'false'
                    }
                ];
                _this.l3Mgr.query(qobj, function (l3s) {
                    _this.$scope.l3NetworkOptions__.dataSource.data(l3s);
                    chain.next();
                });
            }).then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [];
                _this.zoneMgr.query(qobj, function (zones) {
                    //var zs = [{uuid: 'none'}];
                    //zs = zs.concat(zones);
                    _this.$scope.zoneOptions__.dataSource.data(zones);
                    chain.next();
                });
            }).then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'state',
                        op: '=',
                        value: 'Enabled'
                    },
                    {
                        name: 'status',
                        op: '=',
                        value: 'Ready'
                    },
                    {
                        name: 'system',
                        op: '=',
                        value: 'false'
                    },
                    {
                        name: 'mediaType',
                        op: 'in',
                        value: ['RootVolumeTemplate', 'ISO'].join()
                    }
                ];
                _this.imageMgr.query(qobj, function (images) {
                    angular.forEach(images, function (it) {
                        if (!Utils.notNullnotUndefined(it.guestOsType)) {
                            it.guestOsType = "";
                        }
                        _this.$scope.infoPage.images[it.uuid] = it;
                    });
                    _this.$scope.imageOptions__.dataSource.data(images);
                    chain.next();
                });
            }).done(function () {
                win.center();
                win.open();
            }).start();
        };
        return CreateVmInstance;
    }());
    MVmInstance.CreateVmInstance = CreateVmInstance;
    var AttachL3Network = (function () {
        function AttachL3Network(api, vmMgr) {
            var _this = this;
            this.api = api;
            this.vmMgr = vmMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/vm/attachL3Network.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zVmAttachL3Network] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.l3NetworkListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">State:</span><span>#: state #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.cancel = function () {
                    $scope.attachL3Network__.close();
                };
                $scope.done = function () {
                    var vols = $scope.l3NetworkList__.dataItems();
                    angular.forEach(vols, function (it) {
                        vmMgr.attachL3Network(_this.options.vm, it.uuid, function () {
                            if (_this.options.done) {
                                _this.options.done();
                            }
                        });
                    });
                    $scope.attachL3Network__.close();
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                _this.$scope = $scope;
            };
        }
        AttachL3Network.prototype.open = function () {
            var _this = this;
            this.$scope.l3NetworkList__.value([]);
            var chain = new Utils.Chain();
            chain.then(function () {
                _this.api.getVmAttachableL3Networks(_this.options.vm.uuid, function (l3s) {
                    _this.$scope.l3NetworkListOptions__.dataSource.data(l3s);
                    chain.next();
                });
            }).done(function () {
                _this.$scope.attachL3Network__.center();
                _this.$scope.attachL3Network__.open();
            }).start();
        };
        return AttachL3Network;
    }());
    MVmInstance.AttachL3Network = AttachL3Network;
    var DetachL3Network = (function () {
        function DetachL3Network(api, vmMgr, l3Mgr) {
            var _this = this;
            this.api = api;
            this.vmMgr = vmMgr;
            this.l3Mgr = l3Mgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/vm/detachL3Network.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zVmDetachL3Network] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.l3NetworkListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "l3NetworkName",
                    dataValueField: "nicUuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">L3 Network:</span><span>#: l3NetworkName #</span></div>' +
                    '<div style="color: black"><span class="z-label">Nic Device ID:</span><span>#: deviceId #</span></div>' +
                    '<div style="color: black"><span class="z-label">Nic UUID:</span><span>#: nicUuid #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.cancel = function () {
                    $scope.detachL3Network__.close();
                };
                $scope.done = function () {
                    var vols = $scope.l3NetworkList__.dataItems();
                    angular.forEach(vols, function (it) {
                        vmMgr.detachL3Network(_this.options.vm, it.nicUuid, function () {
                            if (_this.options.done) {
                                _this.options.done();
                            }
                        });
                    });
                    $scope.detachL3Network__.close();
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                _this.$scope = $scope;
            };
        }
        DetachL3Network.prototype.open = function () {
            var _this = this;
            this.$scope.l3NetworkList__.value([]);
            var chain = new Utils.Chain();
            var l3Uuids = [];
            chain.then(function () {
                angular.forEach(_this.options.vm.vmNics, function (it) {
                    l3Uuids.push(it.l3NetworkUuid);
                });
                chain.next();
            }).then(function () {
                var l3Networks = [];
                var qobj = new ApiHeader.QueryObject();
                qobj.addCondition({ name: "uuid", op: "in", value: l3Uuids.join() });
                _this.l3Mgr.query(qobj, function (l3s) {
                    angular.forEach(l3s, function (l3) {
                        angular.forEach(_this.options.vm.vmNics, function (nic) {
                            if (l3.uuid == nic.l3NetworkUuid) {
                                var l3obj = {
                                    l3NetworkName: l3.name,
                                    deviceId: nic.deviceId,
                                    nicUuid: nic.uuid
                                };
                                l3Networks.push(l3obj);
                            }
                        });
                    });
                    _this.$scope.l3NetworkListOptions__.dataSource.data(l3Networks);
                    chain.next();
                });
            }).done(function () {
                _this.$scope.detachL3Network__.center();
                _this.$scope.detachL3Network__.open();
            }).start();
        };
        return DetachL3Network;
    }());
    MVmInstance.DetachL3Network = DetachL3Network;
    var AttachVolume = (function () {
        function AttachVolume(api, vmMgr) {
            var _this = this;
            this.api = api;
            this.vmMgr = vmMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/vm/attachVolume.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zVmAttachVolume] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.volumeListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">State:</span><span>#: state #</span></div>' +
                    '<div style="color: black"><span class="z-label">Status:</span><span>#: status #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.cancel = function () {
                    $scope.attachVolume__.close();
                };
                $scope.done = function () {
                    var vols = $scope.volumeList__.dataItems();
                    angular.forEach(vols, function (it) {
                        vmMgr.attachVolume(_this.options.vm, it.uuid, function (vol) {
                            if (_this.options.done) {
                                _this.options.done(vol);
                            }
                        });
                    });
                    $scope.attachVolume__.close();
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                _this.$scope = $scope;
            };
        }
        AttachVolume.prototype.open = function () {
            var _this = this;
            this.$scope.volumeList__.value([]);
            var chain = new Utils.Chain();
            chain.then(function () {
                _this.api.getVmAttachableVolume(_this.options.vm.uuid, function (vols) {
                    _this.$scope.volumeListOptions__.dataSource.data(vols);
                    chain.next();
                });
            }).done(function () {
                _this.$scope.attachVolume__.center();
                _this.$scope.attachVolume__.open();
            }).start();
        };
        return AttachVolume;
    }());
    MVmInstance.AttachVolume = AttachVolume;
    var DetachVolume = (function () {
        function DetachVolume(api, vmMgr) {
            var _this = this;
            this.api = api;
            this.vmMgr = vmMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/vm/detachVolume.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zVmDetachVolume] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.volumeListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">State:</span><span>#: state #</span></div>' +
                    '<div style="color: black"><span class="z-label">Status:</span><span>#: status #</span></div>' +
                    '<div style="color: black"><span class="z-label">Size:</span><span>#: size #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.cancel = function () {
                    $scope.detachVolume__.close();
                };
                $scope.done = function () {
                    var vols = $scope.volumeList__.dataItems();
                    angular.forEach(vols, function (it) {
                        vmMgr.detachVolume(_this.options.vm, it.uuid, function () {
                            if (_this.options.done) {
                                _this.options.done(it);
                            }
                        });
                    });
                    $scope.detachVolume__.close();
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                _this.$scope = $scope;
            };
        }
        DetachVolume.prototype.open = function () {
            var dvols = [];
            this.$scope.volumeList__.value(dvols);
            angular.forEach(this.options.vm.allVolumes, function (it) {
                if (it.type != 'Root') {
                    dvols.push(it);
                }
            });
            this.$scope.volumeListOptions__.dataSource.data(dvols);
            this.$scope.detachVolume__.center();
            this.$scope.detachVolume__.open();
        };
        return DetachVolume;
    }());
    MVmInstance.DetachVolume = DetachVolume;
})(MVmInstance || (MVmInstance = {}));
angular.module('root').factory('VmInstanceManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MVmInstance.VmInstanceManager(api, $rootScope);
}]).directive('zCreateVmInstance', ['Api', 'VmInstanceManager', 'ClusterManager', 'HostManager',
    'ZoneManager', 'InstanceOfferingManager', 'DiskOfferingManager', 'L3NetworkManager', 'ImageManager',
    function (api, vmMgr, clusterMgr, hostMgr, zoneMgr, instOfferingMgr, diskOfferingMgr, l3Mgr, imageMgr) {
        return new MVmInstance.CreateVmInstance(api, vmMgr, clusterMgr, hostMgr, zoneMgr, instOfferingMgr, diskOfferingMgr, l3Mgr, imageMgr);
    }]).directive('zMigrateVmInstance', ['Api', 'VmInstanceManager', function (api, vmMgr) {
    return new MVmInstance.MigrateVm(api, vmMgr);
}]).directive('zChangeInstanceOffering', ['Api', 'VmInstanceManager', 'InstanceOfferingManager', function (api, vmMgr, insMgr) {
    return new MVmInstance.ChangeInstanceOffering(api, vmMgr, insMgr);
}]).directive('zVmAttachVolume', ['Api', 'VmInstanceManager', function (api, vmMgr) {
    return new MVmInstance.AttachVolume(api, vmMgr);
}]).directive('zVmDetachVolume', ['Api', 'VmInstanceManager', function (api, vmMgr) {
    return new MVmInstance.DetachVolume(api, vmMgr);
}]).directive('zVmAttachL3Network', ['Api', 'VmInstanceManager', function (api, vmMgr) {
    return new MVmInstance.AttachL3Network(api, vmMgr);
}]).directive('zVmDetachL3Network', ['Api', 'VmInstanceManager', 'L3NetworkManager', function (api, vmMgr, l3Mgr) {
    return new MVmInstance.DetachL3Network(api, vmMgr, l3Mgr);
}]).config(['$routeProvider', function (route) {
    route.when('/vmInstance', {
        templateUrl: '/static/templates/vm/vm.html',
        controller: 'MVmInstance.Controller',
        resolve: {
            hypervisorTypes: function ($q, Api) {
                var defer = $q.defer();
                Api.getHypervisorTypes(function (hypervisorTypes) {
                    defer.resolve(hypervisorTypes);
                });
                return defer.promise;
            }
        }
    }).when('/vmInstance/:uuid', {
        templateUrl: '/static/templates/vm/details.html',
        controller: 'MVmInstance.DetailsController',
        resolve: {
            current: function ($q, $route, VmInstanceManager, Api) {
                var defer = $q.defer();
                var chain = new Utils.Chain();
                var ret = {
                    vm: null,
                    hostname: null
                };
                chain.then(function () {
                    var qobj = new ApiHeader.QueryObject();
                    var uuid = $route.current.params.uuid;
                    qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                    VmInstanceManager.query(qobj, function (vms) {
                        ret.vm = vms[0];
                        chain.next();
                    }, true);
                }).then(function () {
                    var msg = new ApiHeader.APIQuerySystemTagMsg();
                    msg.conditions = [{
                        name: 'resourceUuid',
                        op: '=',
                        value: $route.current.params.uuid
                    }, {
                        name: 'tag',
                        op: 'like',
                        value: 'hostname::%'
                    }];
                    Api.syncApi(msg, function (reply) {
                        var invs = reply.inventories;
                        if (invs.length > 0) {
                            var pair = invs[0].tag.split('::');
                            ret.hostname = pair[1];
                        }
                        chain.next();
                    });
                }).done(function () {
                    defer.resolve(ret);
                }).start();
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />