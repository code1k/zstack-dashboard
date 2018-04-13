var ML3Network;
(function (ML3Network) {
    var L3Network = (function (_super) {
        __extends(L3Network, _super);
        function L3Network() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        L3Network.prototype.progressOn = function () {
            this.inProgress = true;
        };
        L3Network.prototype.progressOff = function () {
            this.inProgress = false;
        };
        L3Network.prototype.isInProgress = function () {
            return this.inProgress;
        };
        L3Network.prototype.isEnableShow = function () {
            return this.state == 'Disabled' || this.state == 'Maintenance' || this.state == 'PreMaintenance';
        };
        L3Network.prototype.isDisableShow = function () {
            return this.state == 'Enabled' || this.state == 'Maintenance' || this.state == 'PreMaintenance';
        };
        L3Network.prototype.stateLabel = function () {
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
        L3Network.prototype.systemLabel = function () {
            if (this.system) {
                return 'label label-primary';
            }
            return null;
        };
        L3Network.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('state', inv.state);
            self.set('zoneUuid', inv.zoneUuid);
            self.set('l2NetworkUuid', inv.l2NetworkUuid);
            self.set('dnsDomain', inv.dnsDomain);
            self.set('type', inv.type);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
            self.set('dns', inv.dns);
            self.set('ipRanges', inv.ipRanges);
            self.set('system', inv.system);
            self.set('networkServices', inv.networkServices);
        };
        return L3Network;
    }(ApiHeader.L3NetworkInventory));
    ML3Network.L3Network = L3Network;
    var L3NetworkManager = (function () {
        function L3NetworkManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        L3NetworkManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        L3NetworkManager.prototype.wrap = function (l3) {
            return new kendo.data.ObservableObject(l3);
        };
        L3NetworkManager.prototype.disable = function (l3) {
            var _this = this;
            l3.progressOn();
            var msg = new ApiHeader.APIChangeL3NetworkStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = l3.uuid;
            this.api.asyncApi(msg, function (ret) {
                l3.updateObservableObject(ret.inventory);
                l3.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled L3Network: {0}', l3.name),
                    link: Utils.sprintf('/#/l3/{0}', l3.uuid)
                });
            });
        };
        L3NetworkManager.prototype.enable = function (l3) {
            var _this = this;
            l3.progressOn();
            var msg = new ApiHeader.APIChangeL3NetworkStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = l3.uuid;
            this.api.asyncApi(msg, function (ret) {
                l3.updateObservableObject(ret.inventory);
                l3.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled L3Network: {0}', l3.name),
                    link: Utils.sprintf('/#/l3/{0}', l3.uuid)
                });
            });
        };
        L3NetworkManager.prototype.queryNetworkServiceProvider = function (providerUuids, done) {
            var msg = new ApiHeader.APIQueryNetworkServiceProviderMsg();
            if (providerUuids.length != 0) {
                msg.conditions = [
                    {
                        name: 'uuid',
                        op: 'in',
                        value: providerUuids.join()
                    }
                ];
            }
            else {
                msg.conditions = [];
            }
            this.api.syncApi(msg, function (ret) {
                done(ret.inventories);
            });
        };
        L3NetworkManager.prototype.addDns = function (l3, dns, done) {
            var _this = this;
            var msg = new ApiHeader.APIAddDnsToL3NetworkMsg();
            msg.dns = dns;
            msg.l3NetworkUuid = l3.uuid;
            this.api.asyncApi(msg, function (ret) {
                done();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Added DNS{0} to L3 Network: {1}', dns, l3.name),
                    link: Utils.sprintf('/#/l3Network/{0}', l3.uuid)
                });
            });
        };
        L3NetworkManager.prototype.deleteDns = function (l3, dns, done) {
            var _this = this;
            var msg = new ApiHeader.APIRemoveDnsFromL3NetworkMsg();
            msg.l3NetworkUuid = l3.uuid;
            msg.dns = dns;
            this.api.asyncApi(msg, function (ret) {
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Removed ip DNS{0} from L3 Network: {1}', dns, l3.name),
                    link: Utils.sprintf('/#/l3Network/{0}', l3.uuid)
                });
            });
        };
        L3NetworkManager.prototype.addIpRangeByCidr = function (l3, ipr, done) {
            var _this = this;
            var msg = new ApiHeader.APIAddIpRangeByNetworkCidrMsg();
            msg.l3NetworkUuid = l3.uuid;
            msg.name = ipr.name;
            msg.description = ipr.description;
            msg.networkCidr = ipr.networkCidr;
            this.api.asyncApi(msg, function (ret) {
                done(ret.inventory);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Add ip range to L3 Network: {0}', l3.name),
                    link: Utils.sprintf('/#/l3Network/{0}', l3.uuid)
                });
            });
        };
        L3NetworkManager.prototype.addIpRange = function (l3, ipr, done) {
            var _this = this;
            var msg = new ApiHeader.APIAddIpRangeMsg();
            msg.l3NetworkUuid = l3.uuid;
            msg.startIp = ipr.startIp;
            msg.endIp = ipr.endIp;
            msg.gateway = ipr.gateway;
            msg.netmask = ipr.netmask;
            msg.name = ipr.name;
            msg.description = ipr.description;
            this.api.asyncApi(msg, function (ret) {
                done(ret.inventory);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Add ip range to L3 Network: {0}', l3.name),
                    link: Utils.sprintf('/#/l3Network/{0}', l3.uuid)
                });
            });
        };
        L3NetworkManager.prototype.deleteIpRange = function (ipr, done) {
            var _this = this;
            var msg = new ApiHeader.APIDeleteIpRangeMsg();
            msg.uuid = ipr.uuid;
            this.api.asyncApi(msg, function (ret) {
                if (Utils.notNullnotUndefined(done)) {
                    done();
                    _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                        msg: Utils.sprintf('Deleted ip range: {0}', ipr.name),
                        link: Utils.sprintf('/#/l3Network/{0}', ipr.l3NetworkUuid)
                    });
                }
            });
        };
        L3NetworkManager.prototype.attachNetworkService = function (l3, ns, done) {
            var _this = this;
            var msg = new ApiHeader.APIAttachNetworkServiceToL3NetworkMsg();
            msg.l3NetworkUuid = l3.uuid;
            msg.networkServices = ns;
            this.api.asyncApi(msg, function (ret) {
                done();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Attached network services to L3 Network: {0}', l3.name),
                    link: Utils.sprintf('/#/l3Network/{0}', l3.uuid)
                });
            });
        };
        L3NetworkManager.prototype.create = function (l3, done) {
            var _this = this;
            var msg = null;
            msg = new ApiHeader.APICreateL3NetworkMsg();
            msg.type = 'L3BasicNetwork';
            msg.name = l3.name;
            msg.description = l3.description;
            msg.l2NetworkUuid = l3.l2NetworkUuid;
            msg.system = l3.system;
            msg.dnsDomain = l3.dnsDomain;
            this.api.asyncApi(msg, function (ret) {
                var c = new L3Network();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Created new L3 Network: {0}', c.name),
                    link: Utils.sprintf('/#/l3Network/{0}', c.uuid)
                });
            });
        };
        L3NetworkManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryL3NetworkMsg();
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
                    var c = new L3Network();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        L3NetworkManager.prototype["delete"] = function (l3, done) {
            var _this = this;
            l3.progressOn();
            var msg = new ApiHeader.APIDeleteL3NetworkMsg();
            msg.uuid = l3.uuid;
            this.api.asyncApi(msg, function (ret) {
                l3.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted L2 Network: {0}', l3.name)
                });
            });
        };
        return L3NetworkManager;
    }());
    L3NetworkManager.$inject = ['Api', '$rootScope'];
    ML3Network.L3NetworkManager = L3NetworkManager;
    var L3NetworkModel = (function (_super) {
        __extends(L3NetworkModel, _super);
        function L3NetworkModel() {
            var _this = _super.call(this) || this;
            _this.current = new L3Network();
            return _this;
        }
        return L3NetworkModel;
    }(Utils.Model));
    ML3Network.L3NetworkModel = L3NetworkModel;
    var OL3NetworkGrid = (function (_super) {
        __extends(OL3NetworkGrid, _super);
        function OL3NetworkGrid($scope, l3Mgr) {
            var _this = _super.call(this) || this;
            _this.l3Mgr = l3Mgr;
            _super.prototype.init.call(_this, $scope, $scope.l3NetworkGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"l3Network.ts.NAME" | translate}}',
                    width: '15%',
                    template: '<a href="/\\#/l3Network/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'description',
                    title: '{{"l3Network.ts.DESCRIPTION" | translate}}',
                    width: '20%'
                },
                {
                    field: 'state',
                    title: '{{"l3Network.ts.STATE" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'type',
                    title: '{{"l3Network.ts.TYPE" | translate}}',
                    width: '15%'
                },
                {
                    field: 'system',
                    title: '{{"l3Network.ts.SYSTEM NETWORK" | translate}}',
                    width: '15%',
                    template: '<span class="{{dataItem.systemLabel()}}">{{dataItem.system ? "TRUE" : "" }}</span>'
                },
                {
                    field: 'uuid',
                    title: '{{"l3Network.ts.UUID" | translate}}',
                    width: '25%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                l3Mgr.query(qobj, function (l3s, total) {
                    options.success({
                        data: l3s,
                        total: total
                    });
                });
            };
            return _this;
        }
        return OL3NetworkGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, l3Mgr) {
            this.$scope = $scope;
            this.l3Mgr = l3Mgr;
        }
        Action.prototype.enable = function () {
            this.l3Mgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.l3Mgr.disable(this.$scope.model.current);
        };
        Action.prototype.addIpRange = function () {
            this.$scope.winAddIpRange.open();
        };
        Action.prototype.deleteIpRange = function () {
            this.$scope.winDeleteIpRange.open();
        };
        Action.prototype.addDns = function () {
            this.$scope.winAddDns.open();
        };
        Action.prototype.deleteDns = function () {
            this.$scope.winDeleteDns.open();
        };
        return Action;
    }());
    var FilterBy = (function () {
        function FilterBy($scope, l3Types) {
            var _this = this;
            this.$scope = $scope;
            this.l3Types = l3Types;
            this.fieldList = {
                dataSource: new kendo.data.DataSource({
                    data: [
                        {
                            name: '{{"l3Network.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"l3Network.ts.Type" | translate}}',
                            value: FilterBy.TYPE
                        },
                        {
                            name: '{{"l3Network.ts.State" | translate}}',
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
                else if (_this.field == FilterBy.TYPE) {
                    _this.valueList.dataSource.data(_this.l3Types);
                }
                else if (_this.field == FilterBy.STATE) {
                    _this.valueList.dataSource.data(['Enabled', 'Disabled']);
                }
            });
        }
        FilterBy.prototype.confirm = function (popover) {
            this.$scope.oL3NetworkGrid.setFilter(this.toKendoFilter());
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
    FilterBy.TYPE = 'type';
    FilterBy.STATE = 'state';
    var DetailsController = (function () {
        function DetailsController($scope, l3Mgr, $routeParams, tagService, current) {
            var _this = this;
            this.$scope = $scope;
            this.l3Mgr = l3Mgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            $scope.model = new L3NetworkModel();
            $scope.model.current = current;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, l3Mgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteL3Network = {
                title: 'DELETE L3 NETWORK',
                html: '<strong><p>Deleting L2 Network will cause:</p></strong>' +
                '<ul><li><strong>Ip ranges on this l3Network will be deleted</strong></li>' +
                '<li><strong>DNS on this l3Network will be deleted</strong></li>' +
                '<li><strong>Virtual Router on this l3Network will be deleted</strong></li>' +
                '<li><strong>VMs whose nic belongs to this l3Network will be stopped</strong></li></ul>' +
                '<strong><p>those results are not recoverable</p></strong>',
                confirm: function () {
                    l3Mgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeL3NetworkVO, function (ret) {
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
            $scope.optionsIpRangeGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'name',
                        title: '{{"l3Network.ts.NAME" | translate}}',
                        width: '10%'
                    },
                    {
                        field: 'startIp',
                        title: '{{"l3Network.ts.START IP" | translate}}',
                        width: '18%'
                    },
                    {
                        field: 'endIp',
                        title: '{{"l3Network.ts.END IP" | translate}}',
                        width: '18%'
                    },
                    {
                        field: 'netmask',
                        title: '{{"l3Network.ts.NETMASK" | translate}}',
                        width: '18%'
                    },
                    {
                        field: 'gateway',
                        title: '{{"l3Network.ts.GATEWAY" | translate}}',
                        width: '18%'
                    },
                    {
                        field: 'networkCidr',
                        title: '{{"l3Network.ts.NETWORK CIDR" | translate}}',
                        width: '18%'
                    }
                ],
                dataBound: function (e) {
                    var grid = e.sender;
                    if (grid.dataSource.totalPages() == 1) {
                        grid.pager.element.hide();
                    }
                },
                dataSource: new kendo.data.DataSource([])
            };
            $scope.optionsIpRangeGrid.dataSource.data(current.ipRanges);
            $scope.optionsDnsGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'dns',
                        title: 'DNS',
                        width: '100%'
                    }
                ],
                dataBound: function (e) {
                    var grid = e.sender;
                    if (grid.dataSource.totalPages() == 1) {
                        grid.pager.element.hide();
                    }
                },
                dataSource: new kendo.data.DataSource([])
            };
            var dns = [];
            angular.forEach(current.dns, function (it) {
                dns.push({
                    dns: it
                });
            });
            $scope.optionsDnsGrid.dataSource.data(dns);
            $scope.optionsNetworkServiceGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'service',
                        title: '{{"l3Network.ts.SERVICE" | translate}}',
                        width: '50%'
                    },
                    {
                        field: 'provider',
                        title: '{{"l3Network.ts.PROVIDER" | translate}}',
                        width: '50%'
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
                            if (!Utils.notNullnotUndefined(current.uuid)) {
                                options.success({
                                    data: [],
                                    total: 0
                                });
                                return;
                            }
                            var providerUuids = [];
                            angular.forEach(current.networkServices, function (nws) {
                                providerUuids.push(nws.networkServiceProviderUuid);
                            });
                            l3Mgr.queryNetworkServiceProvider(providerUuids, function (providers) {
                                var names = {};
                                angular.forEach(providers, function (it) {
                                    names[it.uuid] = it;
                                });
                                var data = [];
                                angular.forEach(current.networkServices, function (it) {
                                    data.push({
                                        service: it.networkServiceType,
                                        provider: names[it.networkServiceProviderUuid].name
                                    });
                                });
                                options.success({
                                    data: data,
                                    total: data.length
                                });
                            });
                        }
                    }
                })
            };
            $scope.optionsAddDns = {
                l3Network: current,
                done: function (dns) {
                    $scope.optionsDnsGrid.dataSource.insert(0, { dns: dns });
                }
            };
            $scope.optionsAddIpRange = {
                l3Network: current,
                done: function (ipr) {
                    $scope.optionsIpRangeGrid.dataSource.insert(0, ipr);
                }
            };
            $scope.optionsDeleteIpRange = {
                l3Network: current,
                done: function (ipr) {
                    var ds = $scope.optionsIpRangeGrid.dataSource;
                    var cs = ds.data();
                    for (var i = 0; i < cs.length; i++) {
                        var tcs = cs[i];
                        if (ipr.uuid == tcs.uuid) {
                            var row = ds.getByUid(tcs.uid);
                            ds.remove(row);
                            break;
                        }
                    }
                }
            };
            $scope.optionsDeleteDns = {
                l3Network: current,
                done: function (dns) {
                    var ds = $scope.optionsDnsGrid.dataSource;
                    var cs = ds.data();
                    for (var i = 0; i < cs.length; i++) {
                        var tcs = cs[i];
                        if (dns == tcs.dns) {
                            var row = ds.getByUid(tcs.uid);
                            ds.remove(row);
                            break;
                        }
                    }
                }
            };
        }
        DetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.l3Mgr.query(qobj, function (l3s, total) {
                _this.$scope.model.current = l3s[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'L3NetworkManager', '$routeParams', 'Tag', 'current'];
    ML3Network.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, l3Mgr, l3NetworkTypes, $location) {
            this.$scope = $scope;
            this.l3Mgr = l3Mgr;
            this.l3NetworkTypes = l3NetworkTypes;
            this.$location = $location;
            $scope.model = new L3NetworkModel();
            $scope.oL3NetworkGrid = new OL3NetworkGrid($scope, l3Mgr);
            $scope.action = new Action($scope, l3Mgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"l3Network.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"l3Network.ts.Description" | translate}}',
                        value: 'description'
                    },
                    {
                        name: '{{"l3Network.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"l3Network.ts.Type" | translate}}',
                        value: 'type'
                    },
                    {
                        name: '{{"l3Network.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"l3Network.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    l3Mgr.setSortBy(ret);
                    $scope.oL3NetworkGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.L3NetworkInventoryQueryable,
                name: 'L3Network',
                schema: {
                    type: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: this.l3NetworkTypes
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
                    l3Mgr.query(qobj, function (l3s, total) {
                        $scope.oL3NetworkGrid.refresh(l3s);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/l3Network/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope, this.l3NetworkTypes);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateL3Network = function (win) {
                win.open();
            };
            $scope.funcDeleteL3Network = function () {
                $scope.deleteL3Network.open();
            };
            $scope.optionsDeleteL3Network = {
                title: 'DELETE L3 NETWORK',
                html: '<strong><p>Deleting L2 Network will cause:</p></strong>' +
                '<ul><li><strong>Ip ranges on this l3Network will be deleted</strong></li>' +
                '<li><strong>DNS on this l3Network will be deleted</strong></li>' +
                '<li><strong>Virtual Router on this l3Network will be deleted</strong></li>' +
                '<li><strong>VMs whose nic belongs to this l3Network will be stopped</strong></li></ul>' +
                '<strong><p>those results are not recoverable</p></strong>',
                confirm: function () {
                    l3Mgr["delete"]($scope.model.current, function (ret) {
                        $scope.oL3NetworkGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oL3NetworkGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateL3Network = {
                done: function (l3) {
                    $scope.oL3NetworkGrid.add(l3);
                }
            };
            $scope.optionsAddIpRange = {
                l3Network: null
            };
            $scope.optionsDeleteIpRange = {
                l3Network: null
            };
            $scope.optionsAddDns = {
                l3Network: null,
                done: function (dns) {
                    $scope.model.current.dns.push(dns);
                }
            };
            $scope.optionsDeleteDns = {
                l3Network: null
            };
            $scope.$watch(function () {
                return $scope.model.current;
            }, function () {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    $scope.optionsAddIpRange.l3Network = $scope.model.current;
                    $scope.optionsDeleteIpRange.l3Network = $scope.model.current;
                    $scope.optionsAddDns.l3Network = $scope.model.current;
                    $scope.optionsDeleteDns.l3Network = $scope.model.current;
                }
            });
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'L3NetworkManager', 'l3NetworkTypes', '$location'];
    ML3Network.Controller = Controller;
    var AddDnsOptions = (function () {
        function AddDnsOptions() {
        }
        return AddDnsOptions;
    }());
    ML3Network.AddDnsOptions = AddDnsOptions;
    var AddDns = (function () {
        function AddDns(l3Mgr) {
            var _this = this;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zAddDns;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new AddDnsOptions();
                var optionName = $attrs.zOptions;
                if (angular.isDefined(optionName)) {
                    _this.options = parentScope[optionName];
                    $scope.$watch(function () {
                        return parentScope[optionName];
                    }, function () {
                        _this.options = parentScope[optionName];
                    });
                }
                $scope.optionsAddDns__ = {
                    width: 500
                };
                $scope.canProceed = function () {
                    return Utils.notNullnotUndefined($scope.dns);
                };
                $scope.cancel = function () {
                    $scope.addDns__.close();
                };
                $scope.done = function () {
                    l3Mgr.addDns(_this.options.l3Network, $scope.dns, function () {
                        if (Utils.notNullnotUndefined(_this.options.done)) {
                            _this.options.done($scope.dns);
                        }
                    });
                    $scope.addDns__.close();
                };
                $scope.isDnsValid = function () {
                    if (Utils.notNullnotUndefined($scope.dns)) {
                        return Utils.isIpv4Address($scope.dns);
                    }
                    return true;
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/l3Network/addDns.html';
        }
        AddDns.prototype.open = function () {
            this.$scope.dns = null;
            this.$scope.addDns__.center();
            this.$scope.addDns__.open();
        };
        return AddDns;
    }());
    ML3Network.AddDns = AddDns;
    var AddIpRangeOptions = (function () {
        function AddIpRangeOptions() {
        }
        return AddIpRangeOptions;
    }());
    ML3Network.AddIpRangeOptions = AddIpRangeOptions;
    var AddIpRange = (function () {
        function AddIpRange(l3Mgr) {
            var _this = this;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zAddIpRange;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new AddIpRangeOptions();
                var optionName = $attrs.zOptions;
                if (angular.isDefined(optionName)) {
                    _this.options = parentScope[optionName];
                    $scope.$watch(function () {
                        return parentScope[optionName];
                    }, function () {
                        _this.options = parentScope[optionName];
                    });
                }
                $scope.info = {
                    name: null,
                    description: null,
                    startIp: null,
                    endIp: null,
                    gateway: null,
                    netmask: null,
                    method: 'cidr',
                    cidr: null
                };
                $scope.optionsAddIpRange__ = {
                    width: "500px"
                };
                $scope.methodOptions__ = {
                    dataSource: new kendo.data.DataSource({
                        data: [{
                            name: "Add By CIDR",
                            field: "cidr"
                        }, {
                            name: "Add By IP Range",
                            field: "range"
                        }]
                    }),
                    dataTextField: "name",
                    dataValueField: "field"
                };
                $scope.isNetworkCidrValid = function () {
                    if (Utils.notNullnotUndefined($scope.info.cidr)) {
                        return Utils.isValidCidr($scope.info.cidr);
                    }
                    return true;
                };
                $scope.canProceed = function () {
                    if ($scope.info.method == 'range') {
                        return Utils.notNullnotUndefined($scope.info.name) && Utils.notNullnotUndefined($scope.info.startIp)
                            && Utils.notNullnotUndefined($scope.info.endIp) && Utils.notNullnotUndefined($scope.info.netmask)
                            && Utils.notNullnotUndefined($scope.info.gateway) && $scope.isStartIpValid()
                            && $scope.isEndIpValid() && $scope.isNetmaskValid() && $scope.isGatewayValid();
                    }
                    else {
                        return Utils.notNullnotUndefined($scope.info.cidr) && $scope.isNetworkCidrValid();
                    }
                };
                $scope.cancel = function () {
                    $scope.addIpRange__.close();
                };
                $scope.done = function () {
                    if ($scope.info.method == 'range') {
                        l3Mgr.addIpRange(_this.options.l3Network, {
                            name: $scope.info.name,
                            description: $scope.info.description,
                            startIp: $scope.info.startIp,
                            endIp: $scope.info.endIp,
                            netmask: $scope.info.netmask,
                            gateway: $scope.info.gateway
                        }, function (ipr) {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(ipr);
                            }
                        });
                    }
                    else {
                        l3Mgr.addIpRangeByCidr(_this.options.l3Network, {
                            name: $scope.info.name,
                            description: $scope.info.description,
                            networkCidr: $scope.info.cidr
                        }, function (ipr) {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(ipr);
                            }
                        });
                    }
                    $scope.addIpRange__.close();
                };
                $scope.isStartIpValid = function () {
                    if (Utils.notNullnotUndefined($scope.info.startIp)) {
                        return Utils.isIpv4Address($scope.info.startIp);
                    }
                    return true;
                },
                    $scope.isEndIpValid = function () {
                        if (Utils.notNullnotUndefined($scope.info.endIp)) {
                            return Utils.isIpv4Address($scope.info.endIp);
                        }
                        return true;
                    },
                    $scope.isNetmaskValid = function () {
                        if (Utils.notNullnotUndefined($scope.info.netmask)) {
                            return Utils.isIpv4Address($scope.info.netmask);
                        }
                        return true;
                    },
                    $scope.isGatewayValid = function () {
                        if (Utils.notNullnotUndefined($scope.info.gateway)) {
                            return Utils.isIpv4Address($scope.info.gateway);
                        }
                        return true;
                    },
                    _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/l3Network/addIpRange.html';
        }
        AddIpRange.prototype.open = function () {
            this.$scope.info = {};
            this.$scope.info.startIp = null;
            this.$scope.info.description = null;
            this.$scope.info.name = Utils.shortHashName('ipr');
            this.$scope.info.endIp = null;
            this.$scope.info.netmask = null;
            this.$scope.info.gateway = null;
            this.$scope.info.method = 'cidr';
            this.$scope.info.cidr = null;
            this.$scope.addIpRange__.center();
            this.$scope.addIpRange__.open();
        };
        return AddIpRange;
    }());
    ML3Network.AddIpRange = AddIpRange;
    var CreateL3NetworkOptions = (function () {
        function CreateL3NetworkOptions() {
        }
        return CreateL3NetworkOptions;
    }());
    ML3Network.CreateL3NetworkOptions = CreateL3NetworkOptions;
    var CreateL3NetworkModel = (function () {
        function CreateL3NetworkModel() {
        }
        CreateL3NetworkModel.prototype.canCreate = function () {
            return angular.isDefined(this.name) && angular.isDefined(this.type) &&
                angular.isDefined(this.l2NetworkUuid);
        };
        return CreateL3NetworkModel;
    }());
    ML3Network.CreateL3NetworkModel = CreateL3NetworkModel;
    var CreateL3Network = (function () {
        function CreateL3Network(api, zoneMgr, l3Mgr, l2Mgr) {
            var _this = this;
            this.api = api;
            this.zoneMgr = zoneMgr;
            this.l3Mgr = l3Mgr;
            this.l2Mgr = l2Mgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateL3Network;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new CreateL3NetworkOptions();
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
                    type: null,
                    l2NetworkUuid: null,
                    system: false,
                    dnsDomain: null,
                    hasL2Network: function () {
                        return $scope.optionsL2NetworkList__.dataSource.data().length > 0;
                    },
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.l2NetworkUuid)
                            && Utils.notNullnotUndefined(this.type);
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createL3NetworkInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createL3NetworkInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('l3');
                        this.l2NetworkUuid = null;
                        this.description = null;
                        this.type = null;
                        this.system = false;
                        this.activeState = false;
                        this.dnsDomain = null;
                    }
                };
                var ipRangePage = $scope.ipRangePage = {
                    activeState: false,
                    startIp: null,
                    endIp: null,
                    netmask: null,
                    gateway: null,
                    name: null,
                    description: null,
                    cidr: null,
                    method: 'cidr',
                    isStartIpValid: function () {
                        if (Utils.notNullnotUndefined(this.startIp)) {
                            return Utils.isIpv4Address(this.startIp);
                        }
                        return true;
                    },
                    isEndIpValid: function () {
                        if (Utils.notNullnotUndefined(this.endIp)) {
                            return Utils.isIpv4Address(this.endIp);
                        }
                        return true;
                    },
                    isNetmaskValid: function () {
                        if (Utils.notNullnotUndefined(this.netmask)) {
                            return Utils.isIpv4Address(this.netmask);
                        }
                        return true;
                    },
                    isGatewayValid: function () {
                        if (Utils.notNullnotUndefined(this.gateway)) {
                            return Utils.isIpv4Address(this.gateway);
                        }
                        return true;
                    },
                    isCidrValid: function () {
                        if (Utils.notNullnotUndefined(this.cidr)) {
                            return Utils.isValidCidr(this.cidr);
                        }
                        return true;
                    },
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return true;
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createL3NetworkIpRange"]');
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
                        return 'createL3NetworkIpRange';
                    },
                    reset: function () {
                        this.activeState = false;
                        this.startIp = null;
                        this.endIp = null;
                        this.netmask = null;
                        this.gateway = null;
                        this.name = Utils.shortHashName('ipr');
                        this.description = null;
                        this.method = 'cidr';
                        this.cidr = null;
                    },
                    add: function () {
                        $scope.optionsIpRangeGrid__.dataSource.insert(0, {
                            startIp: this.startIp,
                            endIp: this.endIp,
                            netmask: this.netmask,
                            gateway: this.gateway,
                            name: this.name,
                            description: this.description,
                            networkCidr: this.cidr
                        });
                        this.startIp = null;
                        this.endIp = null;
                        this.netmask = null;
                        this.gateway = null;
                        this.name = Utils.shortHashName('ipr');
                        this.description = null;
                        this.cidr = null;
                    },
                    canAdd: function () {
                        if (this.method == 'range') {
                            return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.startIp)
                                && Utils.notNullnotUndefined(this.endIp) && Utils.notNullnotUndefined(this.netmask)
                                && Utils.notNullnotUndefined(this.gateway) && this.isStartIpValid()
                                && this.isEndIpValid() && this.isNetmaskValid() && this.isGatewayValid();
                        }
                        else {
                            return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefinedNotEmptyString(this.cidr) && this.isCidrValid();
                        }
                    },
                    isGridShow: function () {
                        return $scope.optionsIpRangeGrid__.dataSource.data().length > 0;
                    },
                    del: function (uid) {
                        var row = $scope.optionsIpRangeGrid__.dataSource.getByUid(uid);
                        $scope.optionsIpRangeGrid__.dataSource.remove(row);
                    }
                };
                var dnsPage = $scope.dnsPage = {
                    activeState: false,
                    dns: null,
                    isDnsValid: function () {
                        if (Utils.notNullnotUndefined(this.dns)) {
                            return Utils.isIpv4Address(this.dns);
                        }
                        return true;
                    },
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return true;
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createL3NetworkDns"]');
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
                        return 'createL3NetworkDns';
                    },
                    reset: function () {
                        this.activeState = false;
                        this.dns = null;
                    },
                    add: function () {
                        $scope.optionsDnsGrid__.dataSource.insert(0, {
                            dns: this.dns
                        });
                        this.dns = null;
                    },
                    canAdd: function () {
                        return Utils.notNullnotUndefined(this.dns) && this.isDnsValid();
                    },
                    isGridShow: function () {
                        return $scope.optionsDnsGrid__.dataSource.data().length > 0;
                    },
                    del: function (uid) {
                        var row = $scope.optionsDnsGrid__.dataSource.getByUid(uid);
                        $scope.optionsDnsGrid__.dataSource.remove(row);
                    }
                };
                var self = _this;
                var servicePage = $scope.servicePage = {
                    activeState: false,
                    providerUuid: null,
                    serviceType: null,
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return true;
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createL3NetworkService"]');
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
                        return 'createL3NetworkService';
                    },
                    reset: function () {
                        this.activeState = false;
                    },
                    add: function () {
                        var pro = self.networkServiceProviders[this.providerUuid];
                        var data = $scope.optionsNetworkServiceGrid__.dataSource.data();
                        for (var i = 0; i < data.length; i++) {
                            var item = data[i];
                            if (item.providerUuid == this.providerUuid && item.serviceType == this.serviceType) {
                                return;
                            }
                        }
                        $scope.optionsNetworkServiceGrid__.dataSource.insert(0, {
                            providerName: pro.name,
                            providerUuid: pro.uuid,
                            serviceType: this.serviceType
                        });
                    },
                    canAdd: function () {
                        return Utils.notNullnotUndefined(this.providerUuid) && Utils.notNullnotUndefined(this.serviceType);
                    },
                    isGridShow: function () {
                        return $scope.optionsNetworkServiceGrid__.dataSource.data().length > 0;
                    },
                    del: function (uid) {
                        var row = $scope.optionsNetworkServiceGrid__.dataSource.getByUid(uid);
                        $scope.optionsNetworkServiceGrid__.dataSource.remove(row);
                    }
                };
                $scope.$watch(function () {
                    return $scope.servicePage.providerUuid;
                }, function () {
                    if (Utils.notNullnotUndefined($scope.servicePage.providerUuid)) {
                        var pro = _this.networkServiceProviders[$scope.servicePage.providerUuid];
                        if (Utils.notNullnotUndefined(pro)) {
                            $scope.optionsServiceList__.dataSource.data(pro.networkServiceTypes);
                        }
                    }
                });
                var mediator = $scope.mediator = {
                    currentPage: infoPage,
                    movedToPage: function (page) {
                        $scope.mediator.currentPage = page;
                    },
                    finishButtonName: function () {
                        return "Create";
                    },
                    finish: function () {
                        var resultL3;
                        var chain = new Utils.Chain();
                        chain.then(function () {
                            l3Mgr.create(infoPage, function (ret) {
                                resultL3 = ret;
                                chain.next();
                            });
                        }).then(function () {
                            var iprs = $scope.optionsIpRangeGrid__.dataSource.data();
                            if (iprs.length == 0) {
                                chain.next();
                                return;
                            }
                            var add = function () {
                                var ipr = iprs.shift();
                                if (!Utils.notNullnotUndefined(ipr)) {
                                    chain.next();
                                    return;
                                }
                                if (Utils.notNullnotUndefined(ipr.networkCidr)) {
                                    _this.l3Mgr.addIpRangeByCidr(resultL3, ipr, function () {
                                        add();
                                    });
                                }
                                else {
                                    _this.l3Mgr.addIpRange(resultL3, ipr, function () {
                                        add();
                                    });
                                }
                            };
                            add();
                        }).then(function () {
                            var dns = $scope.optionsDnsGrid__.dataSource.data();
                            if (dns.length == 0) {
                                chain.next();
                                return;
                            }
                            var add = function () {
                                var d = dns.shift();
                                if (!Utils.notNullnotUndefined(d)) {
                                    chain.next();
                                    return;
                                }
                                _this.l3Mgr.addDns(resultL3, d.dns, function () {
                                    add();
                                });
                            };
                            add();
                        }).then(function () {
                            var nws = $scope.optionsNetworkServiceGrid__.dataSource.data();
                            if (nws.length == 0) {
                                chain.next();
                                return;
                            }
                            var networkServices = {};
                            angular.forEach(nws, function (n) {
                                var providerUuid = n.providerUuid;
                                var services = networkServices[providerUuid];
                                if (!Utils.notNullnotUndefined(services)) {
                                    services = [];
                                    networkServices[providerUuid] = services;
                                }
                                services.push(n.serviceType);
                            });
                            _this.l3Mgr.attachNetworkService(resultL3, networkServices, function () {
                                chain.next();
                            });
                        }).done(function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(resultL3);
                            }
                        }).start();
                        $scope.winCreateL3Network__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage, ipRangePage, dnsPage, servicePage
                ], mediator);
                $scope.$watch(function () {
                    return $scope.infoPage.zoneUuid;
                }, function () {
                    var zuuid = $scope.infoPage.zoneUuid;
                    if (Utils.notNullnotUndefined(zuuid)) {
                        _this.queryL2Networks(zuuid, function (l2s) {
                            $scope.optionsL2NetworkList__.dataSource.data(l2s);
                            var l2 = l2s[0];
                            if (Utils.notNullnotUndefined(l2)) {
                                $scope.infoPage.l2NetworkUuid = l2.uuid;
                            }
                        });
                    }
                });
                $scope.methodOptions__ = {
                    dataSource: new kendo.data.DataSource({
                        data: [{
                            name: "Add By CIDR",
                            field: "cidr"
                        }, {
                            name: "Add By IP Range",
                            field: "range"
                        }]
                    }),
                    dataTextField: "name",
                    dataValueField: "field"
                };
                $scope.optionsL2NetworkList__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"l3Network.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"l3Network.ts.Type" | translate}}:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"l3Network.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.optionsZoneList__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"l3Network.ts.Name" | translate}}</span>: #: name #</div>' + '<div style="color: black"><span class="z-label">{{"l3Network.ts.State" | translate}}:</span>#: state #</div>' + '<div style="color: black"><span class="z-label">{{"l3Network.ts.UUID" | translate}}:</span> #: uuid #</div>'
                };
                $scope.optionsL3NetworkTypeList__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "type",
                    dataValueField: "type"
                };
                $scope.optionsIpRangeGrid__ = {
                    pageSize: 20,
                    resizable: true,
                    scrollable: true,
                    pageable: true,
                    columns: [
                        {
                            width: '12%',
                            title: '',
                            template: '<button type="button" class="btn btn-xs btn-default" ng-click="ipRangePage.del(dataItem.uid)"><i class="fa fa-times"></i></button>'
                        },
                        {
                            field: 'networkCidr',
                            title: '{{"l3Network.ts.CIDR" | translate}}',
                            width: '22%'
                        },
                        {
                            field: 'startIp',
                            title: '{{"l3Network.ts.START IP" | translate}}',
                            width: '22%'
                        },
                        {
                            field: 'endIp',
                            title: '{{"l3Network.ts.END IP" | translate}}',
                            width: '22%'
                        },
                        {
                            field: 'gateway',
                            title: '{{"l3Network.ts.GATEWAY" | translate}}',
                            width: '22%'
                        }
                    ],
                    dataBound: function (e) {
                        var grid = e.sender;
                        if (grid.dataSource.totalPages() == 1) {
                            grid.pager.element.hide();
                        }
                    },
                    dataSource: new kendo.data.DataSource([])
                };
                $scope.optionsDnsGrid__ = {
                    pageSize: 20,
                    resizable: true,
                    scrollable: true,
                    pageable: true,
                    columns: [
                        {
                            field: 'dns',
                            title: '{{"l3Network.ts.DNS" | translate}}',
                            width: '80%'
                        },
                        {
                            width: '20%',
                            title: '',
                            template: '<button type="button" class="btn btn-xs btn-default" ng-click="dnsPage.del(dataItem.uid)"><i class="fa fa-times"></i></button>'
                        }
                    ],
                    dataBound: function (e) {
                        var grid = e.sender;
                        if (grid.dataSource.totalPages() == 1) {
                            grid.pager.element.hide();
                        }
                    },
                    dataSource: new kendo.data.DataSource([])
                };
                $scope.optionsProviderList__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid"
                };
                $scope.optionsServiceList__ = {
                    dataSource: new kendo.data.DataSource({ data: [] })
                };
                $scope.optionsNetworkServiceGrid__ = {
                    pageSize: 20,
                    resizable: true,
                    scrollable: true,
                    pageable: true,
                    columns: [
                        {
                            field: 'providerName',
                            title: '{{"l3Network.ts.PROVIDER" | translate}}',
                            width: '40%'
                        },
                        {
                            field: 'serviceType',
                            title: '{{"l3Network.ts.SERVICE" | translate}}',
                            width: '40%'
                        },
                        {
                            width: '10%',
                            title: '',
                            template: '<button type="button" class="btn btn-xs btn-default" ng-click="servicePage.del(dataItem.uid)"><i class="fa fa-times"></i></button>'
                        }
                    ],
                    dataBound: function (e) {
                        var grid = e.sender;
                        if (grid.dataSource.totalPages() == 1) {
                            grid.pager.element.hide();
                        }
                    },
                    dataSource: new kendo.data.DataSource([])
                };
                $scope.winCreateL3NetworkOptions__ = {
                    width: '800px',
                    //height: '680px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/l3Network/createL3Network.html';
        }
        CreateL3Network.prototype.queryL2Networks = function (zoneUuid, done) {
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
        CreateL3Network.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateL3Network__;
            var chain = new Utils.Chain();
            this.$scope.infoPage.zoneUuid = null;
            this.$scope.optionsL2NetworkList__.dataSource.data([]);
            this.$scope.optionsIpRangeGrid__.dataSource.data([]);
            this.$scope.button.reset();
            chain.then(function () {
                if (Utils.notNullnotUndefined(_this.options.zone)) {
                    _this.$scope.optionsZoneList__.dataSource.data(new kendo.data.ObservableArray([_this.options.zone]));
                    _this.$scope.infoPage.zoneUuid = _this.options.zone.uuid;
                    chain.next();
                }
                else {
                    _this.zoneMgr.query(new ApiHeader.QueryObject(), function (zones, total) {
                        _this.$scope.optionsZoneList__.dataSource.data(zones);
                        if (zones.length > 0) {
                            _this.$scope.infoPage.zoneUuid = zones[0].uuid;
                        }
                        chain.next();
                    });
                }
            }).then(function () {
                _this.api.getL3NetworkTypes(function (l3Types) {
                    var types = [];
                    angular.forEach(l3Types, function (item) {
                        types.push({ type: item });
                    });
                    _this.$scope.optionsL3NetworkTypeList__.dataSource.data(types);
                    _this.$scope.infoPage.type = l3Types[0];
                    chain.next();
                });
            }).then(function () {
                _this.l3Mgr.queryNetworkServiceProvider([], function (providers) {
                    _this.networkServiceProviders = {};
                    angular.forEach(providers, function (pro) {
                        if ((pro.type == "vrouter") && (pro.networkServiceTypes.indexOf("IPsec") > -1)) {
                            pro.networkServiceTypes.splice(pro.networkServiceTypes.indexOf("IPsec"), 1);
                        }
                        _this.networkServiceProviders[pro.uuid] = pro;
                    });
                    _this.$scope.optionsProviderList__.dataSource.data(providers);
                    var cpro = providers[0];
                    _this.$scope.optionsServiceList__.dataSource.data(cpro.networkServiceTypes);
                    chain.next();
                });
            }).done(function () {
                win.center();
                win.open();
            }).start();
        };
        return CreateL3Network;
    }());
    ML3Network.CreateL3Network = CreateL3Network;
    var DeleteIpRangeOptions = (function () {
        function DeleteIpRangeOptions() {
        }
        return DeleteIpRangeOptions;
    }());
    ML3Network.DeleteIpRangeOptions = DeleteIpRangeOptions;
    var DeleteIpRange = (function () {
        function DeleteIpRange(l3Mgr) {
            var _this = this;
            this.l3Mgr = l3Mgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/l3Network/deleteIpRange.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zDeleteIpRange] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.uuid = null;
                $scope.ipRangeListOptions__ = {
                    dataSource: new kendo.data.DataSource([]),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">Start IP:</span><span>#: startIp #</span></div>' +
                    '<div style="color: black"><span class="z-label">End IP:</span><span>#: endIp #</span></div>' +
                    '<div style="color: black"><span class="z-label">Netmask:</span><span>#: netmask #</span></div>' +
                    '<div style="color: black"><span class="z-label">Gateway:</span><span>#: gateway #</span></div>',
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
                    $scope.deleteIpRange__.close();
                };
                $scope.done = function () {
                    var iprs = $scope.ipRangeList__.dataItems();
                    angular.forEach(iprs, function (ipr) {
                        l3Mgr.deleteIpRange(ipr, function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(ipr);
                            }
                        });
                    });
                    $scope.deleteIpRange__.close();
                };
                $scope.deleteIpRangeOptions__ = {
                    width: '550px'
                };
            };
        }
        DeleteIpRange.prototype.open = function () {
            this.$scope.ipRangeListOptions__.dataSource.data(this.options.l3Network.ipRanges);
            this.$scope.deleteIpRange__.center();
            this.$scope.deleteIpRange__.open();
        };
        return DeleteIpRange;
    }());
    ML3Network.DeleteIpRange = DeleteIpRange;
    var DeleteDnsOptions = (function () {
        function DeleteDnsOptions() {
        }
        return DeleteDnsOptions;
    }());
    ML3Network.DeleteDnsOptions = DeleteDnsOptions;
    var DeleteDns = (function () {
        function DeleteDns(l3Mgr) {
            var _this = this;
            this.l3Mgr = l3Mgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/l3Network/deleteDns.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zDeleteDns] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.uuid = null;
                $scope.dnsOptions__ = {
                    dataSource: new kendo.data.DataSource([]),
                    dataTextField: "dns",
                    dataValueField: "dns",
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
                    $scope.deleteDns__.close();
                };
                $scope.done = function () {
                    var dnss = $scope.dnsList__.dataItems();
                    angular.forEach(dnss, function (it) {
                        l3Mgr.deleteDns(_this.options.l3Network, it.dns, function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(it.dns);
                            }
                        });
                    });
                    $scope.deleteDns__.close();
                };
                $scope.deleteDnsOptions__ = {
                    width: '550px'
                };
            };
        }
        DeleteDns.prototype.open = function () {
            var _this = this;
            this.$scope.dnsOptions__.dataSource.data((function () {
                var dns = [];
                angular.forEach(_this.options.l3Network.dns, function (it) {
                    dns.push({ dns: it });
                });
                return dns;
            })());
            this.$scope.deleteDns__.center();
            this.$scope.deleteDns__.open();
        };
        return DeleteDns;
    }());
    ML3Network.DeleteDns = DeleteDns;
})(ML3Network || (ML3Network = {}));
angular.module('root').factory('L3NetworkManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new ML3Network.L3NetworkManager(api, $rootScope);
}]).directive('zCreateL3Network', ['Api', 'ZoneManager', 'L3NetworkManager', 'L2NetworkManager', function (api, zoneMgr, l3Mgr, l2Mgr) {
    return new ML3Network.CreateL3Network(api, zoneMgr, l3Mgr, l2Mgr);
}]).directive('zAddIpRange', ['L3NetworkManager', function (l3Mgr) {
    return new ML3Network.AddIpRange(l3Mgr);
}]).directive('zDeleteIpRange', ['L3NetworkManager', function (l3Mgr) {
    return new ML3Network.DeleteIpRange(l3Mgr);
}]).directive('zAddDns', ['L3NetworkManager', function (l3Mgr) {
    return new ML3Network.AddDns(l3Mgr);
}]).directive('zDeleteDns', ['L3NetworkManager', function (l3Mgr) {
    return new ML3Network.DeleteDns(l3Mgr);
}]).config(['$routeProvider', function (route) {
    route.when('/l3Network', {
        templateUrl: '/static/templates/l3Network/l3Network.html',
        controller: 'ML3Network.Controller',
        resolve: {
            l3NetworkTypes: function ($q, Api) {
                var defer = $q.defer();
                Api.getL3NetworkTypes(function (l3Types) {
                    defer.resolve(l3Types);
                });
                return defer.promise;
            }
        }
    }).when('/l3Network/:uuid', {
        templateUrl: '/static/templates/l3Network/details.html',
        controller: 'ML3Network.DetailsController',
        resolve: {
            current: function ($q, $route, L3NetworkManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var uuid = $route.current.params.uuid;
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                L3NetworkManager.query(qobj, function (l3s) {
                    var l3 = l3s[0];
                    defer.resolve(l3);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />