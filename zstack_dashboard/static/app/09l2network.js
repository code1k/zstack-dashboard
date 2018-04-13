var ML2Network;
(function (ML2Network) {
    var L2Network = (function (_super) {
        __extends(L2Network, _super);
        function L2Network() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        L2Network.prototype.progressOn = function () {
            this.inProgress = true;
        };
        L2Network.prototype.progressOff = function () {
            this.inProgress = false;
        };
        L2Network.prototype.isInProgress = function () {
            return this.inProgress;
        };
        L2Network.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('zoneUuid', inv.zoneUuid);
            self.set('physicalInterface', inv.physicalInterface);
            self.set('type', inv.type);
            self.set('attachedClusterUuids', inv.attachedClusterUuids);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        return L2Network;
    }(ApiHeader.L2NetworkInventory));
    ML2Network.L2Network = L2Network;
    var L2NetworkManager = (function () {
        function L2NetworkManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        L2NetworkManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        L2NetworkManager.prototype.wrap = function (l2) {
            return new kendo.data.ObservableObject(l2);
        };
        L2NetworkManager.prototype.create = function (l2, done) {
            var _this = this;
            var msg = null;
            if (l2.type == 'L2NoVlanNetwork') {
                msg = new ApiHeader.APICreateL2NoVlanNetworkMsg();
                msg.type = 'L2NoVlanNetwork';
            }
            else if (l2.type == 'L2VlanNetwork') {
                msg = new ApiHeader.APICreateL2VlanNetworkMsg();
                msg.type = 'L2VlanNetwork';
                msg.vlan = l2.vlan;
            }
            msg.name = l2.name;
            msg.description = l2.description;
            msg.zoneUuid = l2.zoneUuid;
            msg.physicalInterface = l2.physicalInterface;
            this.api.asyncApi(msg, function (ret) {
                var c = new L2Network();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Created new L2 Network: {0}', c.name),
                    link: Utils.sprintf('/#/l2Network/{0}', c.uuid)
                });
            });
        };
        L2NetworkManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryL2NetworkMsg();
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
                    var c = new L2Network();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        L2NetworkManager.prototype.attach = function (l2, cluster, done) {
            var _this = this;
            if (done === void 0) { done = null; }
            l2.progressOn();
            var msg = new ApiHeader.APIAttachL2NetworkToClusterMsg();
            msg.clusterUuid = cluster.uuid;
            msg.l2NetworkUuid = l2.uuid;
            this.api.asyncApi(msg, function (ret) {
                l2.updateObservableObject(ret.inventory);
                l2.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Attached L2 Network: {0} to Cluster: {1}', l2.name, cluster.name),
                    link: Utils.sprintf('/#/l2Network/{0}', l2.uuid)
                });
            });
        };
        L2NetworkManager.prototype.detach = function (l2, cluster, done) {
            var _this = this;
            if (done === void 0) { done = null; }
            l2.progressOn();
            var msg = new ApiHeader.APIDetachL2NetworkFromClusterMsg();
            msg.clusterUuid = cluster.uuid;
            msg.l2NetworkUuid = l2.uuid;
            this.api.asyncApi(msg, function (ret) {
                l2.updateObservableObject(ret.inventory);
                l2.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Detached L2 Network: {0} from Cluster: {1}', l2.name, cluster.name),
                    link: Utils.sprintf('/#/l2Network/{0}', l2.uuid)
                });
            });
        };
        L2NetworkManager.prototype["delete"] = function (l2, done) {
            var _this = this;
            l2.progressOn();
            var msg = new ApiHeader.APIDeleteL2NetworkMsg();
            msg.uuid = l2.uuid;
            this.api.asyncApi(msg, function (ret) {
                l2.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted L2 Network: {0}', l2.name)
                });
            });
        };
        return L2NetworkManager;
    }());
    L2NetworkManager.$inject = ['Api', '$rootScope'];
    ML2Network.L2NetworkManager = L2NetworkManager;
    var L2NetworkModel = (function (_super) {
        __extends(L2NetworkModel, _super);
        function L2NetworkModel() {
            var _this = _super.call(this) || this;
            _this.current = new L2Network();
            return _this;
        }
        return L2NetworkModel;
    }(Utils.Model));
    ML2Network.L2NetworkModel = L2NetworkModel;
    var OL2NetworkGrid = (function (_super) {
        __extends(OL2NetworkGrid, _super);
        function OL2NetworkGrid($scope, l2Mgr) {
            var _this = _super.call(this) || this;
            _this.l2Mgr = l2Mgr;
            _super.prototype.init.call(_this, $scope, $scope.l2NetworkGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"l2Network.ts.NAME" | translate}}',
                    width: '10%',
                    template: '<a href="/\\#/l2Network/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'description',
                    title: '{{"l2Network.ts.DESCRIPTION" | translate}}',
                    width: '25%'
                },
                {
                    field: 'physicalInterface',
                    title: '{{"l2Network.ts.PHYSICAL INTERFACE" | translate}}',
                    width: '25%'
                },
                {
                    field: 'type',
                    title: '{{"l2Network.ts.TYPE" | translate}}',
                    width: '20%'
                },
                {
                    field: 'uuid',
                    title: '{{"l2Network.ts.UUID" | translate}}',
                    width: '20%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                l2Mgr.query(qobj, function (l2s, total) {
                    options.success({
                        data: l2s,
                        total: total
                    });
                });
            };
            return _this;
        }
        return OL2NetworkGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, l2Mgr) {
            this.$scope = $scope;
            this.l2Mgr = l2Mgr;
        }
        Action.prototype.attachCluster = function () {
            this.$scope.attachCluster.open();
        };
        Action.prototype.detachCluster = function () {
            this.$scope.detachCluster.open();
        };
        return Action;
    }());
    var FilterBy = (function () {
        function FilterBy($scope, l2Types) {
            var _this = this;
            this.$scope = $scope;
            this.l2Types = l2Types;
            this.fieldList = {
                dataSource: new kendo.data.DataSource({
                    data: [
                        {
                            name: '{{"l2Network.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"l2Network.ts.Type" | translate}}',
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
                else if (_this.field == FilterBy.TYPE) {
                    _this.valueList.dataSource.data(_this.l2Types);
                }
            });
        }
        FilterBy.prototype.confirm = function (popover) {
            this.$scope.oL2NetworkGrid.setFilter(this.toKendoFilter());
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
    var DetailsController = (function () {
        function DetailsController($scope, l2Mgr, $routeParams, tagService, current, clusterMgr) {
            var _this = this;
            this.$scope = $scope;
            this.l2Mgr = l2Mgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            $scope.model = new L2NetworkModel();
            $scope.model.current = current;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, l2Mgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteL2Network = {
                title: 'DELETE L2 NETWORK',
                html: '<strong><p>Deleting L2 Network will cause:</p></strong>' +
                '<ul><li><strong>Clusters to which this l2Network has attached will be detached</strong></li>' +
                '<li><strong>l3Networks on this l2Network will be detached</strong></li>' +
                '<li><strong>VMs whose nic on l3Network belonging to this l2Network will be stopped</strong></li></ul>' +
                '<strong><p>those results are not recoverable</p></strong>',
                confirm: function () {
                    l2Mgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeL2NetworkVO, function (ret) {
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
                l2Network: $scope.model.current,
                done: function (cluster) {
                    $scope.optionsClusterGrid.dataSource.insert(0, cluster);
                }
            };
            $scope.optionsDetachCluster = {
                l2Network: $scope.model.current,
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
                        title: '{{"l2Network.ts.NAME" | translate}}',
                        width: '20%',
                        template: '<a href="/\\#/cluster/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                    },
                    {
                        field: 'description',
                        title: '{{"l2Network.ts.DESCRIPTION" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'state',
                        title: '{{"l2Network.ts.STATE" | translate}}',
                        width: '20%',
                        template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                    },
                    {
                        field: 'hypervisorType',
                        title: '{{"l2Network.ts.HYPERVISOR" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'uuid',
                        title: '{{"l2Network.ts.UUID" | translate}}',
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
            this.l2Mgr.query(qobj, function (l2s, total) {
                _this.$scope.model.current = l2s[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'L2NetworkManager', '$routeParams', 'Tag', 'current', 'ClusterManager'];
    ML2Network.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, l2Mgr, l2NetworkTypes, $location) {
            this.$scope = $scope;
            this.l2Mgr = l2Mgr;
            this.l2NetworkTypes = l2NetworkTypes;
            this.$location = $location;
            $scope.model = new L2NetworkModel();
            $scope.oL2NetworkGrid = new OL2NetworkGrid($scope, l2Mgr);
            $scope.action = new Action($scope, l2Mgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"l2Network.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"l2Network.ts.Description" | translate}}',
                        value: 'Description'
                    },
                    {
                        name: '{{"l2Network.ts.Physical Interface" | translate}}',
                        value: 'physicalInterface'
                    },
                    {
                        name: '{{"l2Network.ts.Type" | translate}}',
                        value: 'type'
                    },
                    {
                        name: '{{"l2Network.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"l2Network.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    l2Mgr.setSortBy(ret);
                    $scope.oL2NetworkGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.L2NetworkInventoryQueryable,
                name: 'L2Network',
                schema: {
                    type: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: this.l2NetworkTypes,
                        getQueryableFields: function (value) {
                            if (value == 'L2VlanNetwork') {
                                return ApiHeader.L2VlanNetworkInventoryQueryable;
                            }
                            else if (value == 'L2NoVlanNetwork') {
                                return ApiHeader.L2VlanNetworkInventoryQueryable;
                            }
                        },
                        removeCascade: {
                            type: ['vlan']
                        }
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
                    l2Mgr.query(qobj, function (l2s, total) {
                        $scope.oL2NetworkGrid.refresh(l2s);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/l2Network/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope, this.l2NetworkTypes);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateL2Network = function (win) {
                win.open();
            };
            $scope.funcDeleteL2Network = function () {
                $scope.deleteL2Network.open();
            };
            $scope.optionsDeleteL2Network = {
                title: 'DELETE L2 NETWORK',
                html: '<strong><p>Deleting L2 Network will cause:</p></strong>' +
                '<ul><li><strong>Clusters to which this l2Network has attached will be detached</strong></li>' +
                '<li><strong>l3Networks on this l2Network will be detached</strong></li>' +
                '<li><strong>VMs whose nic on l3Network belonging to this l2Network will be stopped</strong></li></ul>' +
                '<strong><p>those results are not recoverable</p></strong>',
                confirm: function () {
                    l2Mgr["delete"]($scope.model.current, function (ret) {
                        $scope.oL2NetworkGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oL2NetworkGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateL2Network = {
                done: function (l2) {
                    $scope.oL2NetworkGrid.add(l2);
                }
            };
            $scope.optionsAttachCluster = {
                l2Network: $scope.model.current,
                done: function (cluster) {
                }
            };
            $scope.optionsDetachCluster = {
                l2Network: $scope.model.current,
                done: function (cluster) {
                }
            };
            $scope.$watch(function () {
                return $scope.model.current;
            }, function () {
                $scope.optionsAttachCluster.l2Network = $scope.model.current;
                $scope.optionsDetachCluster.l2Network = $scope.model.current;
            });
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'L2NetworkManager', 'l2NetworkTypes', '$location'];
    ML2Network.Controller = Controller;
    var CreateL2NetworkOptions = (function () {
        function CreateL2NetworkOptions() {
        }
        return CreateL2NetworkOptions;
    }());
    ML2Network.CreateL2NetworkOptions = CreateL2NetworkOptions;
    var CreateL2NetworkModel = (function () {
        function CreateL2NetworkModel() {
        }
        CreateL2NetworkModel.prototype.canCreate = function () {
            return angular.isDefined(this.name) && angular.isDefined(this.type) &&
                angular.isDefined(this.zoneUuid) && Utils.notNullnotUndefined(this.physicalInterface);
        };
        return CreateL2NetworkModel;
    }());
    ML2Network.CreateL2NetworkModel = CreateL2NetworkModel;
    var CreateL2Network = (function () {
        function CreateL2Network(api, zoneMgr, l2Mgr, clusterMgr) {
            var _this = this;
            this.api = api;
            this.zoneMgr = zoneMgr;
            this.l2Mgr = l2Mgr;
            this.clusterMgr = clusterMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateL2Network;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new CreateL2NetworkOptions();
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
                    type: null,
                    physicalInterface: null,
                    vlan: null,
                    hasZone: function () {
                        return $scope.zoneList.dataSource.data().length > 0;
                    },
                    isVlanValid: function () {
                        if (this.type == 'L2VlanNetwork' && Utils.notNullnotUndefined(this.vlan)) {
                            if (isNaN(this.vlan)) {
                                return false;
                            }
                            var vlan = parseInt(this.vlan);
                            return vlan >= 0 && vlan <= 4095;
                        }
                        return true;
                    },
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        if (this.type == 'L2NoVlanNetwork') {
                            return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.zoneUuid)
                                && Utils.notNullnotUndefined(this.type) && Utils.notNullnotUndefined(this.physicalInterface);
                        }
                        else if (this.type == 'L2VlanNetwork') {
                            return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.zoneUuid)
                                && Utils.notNullnotUndefined(this.type) && Utils.notNullnotUndefined(this.physicalInterface)
                                && Utils.notNullnotUndefined(this.vlan) && this.isVlanValid();
                        }
                        else {
                            return false;
                        }
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createL2NetworkInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createL2NetworkInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('l2');
                        this.zoneUuid = null;
                        this.description = null;
                        this.type = null;
                        this.physicalInterface = null;
                        this.vlan = null;
                        this.activeState = false;
                    },
                    normalize: function () {
                        if (this.type == 'L2NoVlanNetwork') {
                            this.vlan = null;
                        }
                        else {
                            this.vlan = parseInt(this.vlan);
                        }
                    }
                };
                var clusterPage = $scope.clusterPage = {
                    activeState: false,
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return true;
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createL2NetworkCluster"]');
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
                        return 'createL2NetworkCluster';
                    },
                    reset: function () {
                        this.activeState = false;
                    },
                    hasCluster: function () {
                        return $scope.clusterListOptions__.dataSource.data().length > 0;
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
                        var resultPs;
                        var chain = new Utils.Chain();
                        chain.then(function () {
                            $scope.infoPage.normalize();
                            l2Mgr.create(infoPage, function (ret) {
                                resultPs = ret;
                                chain.next();
                            });
                        }).then(function () {
                            var clusters = $scope.clusterList__.dataItems();
                            angular.forEach(clusters, function (cluster) {
                                l2Mgr.attach(resultPs, cluster);
                            });
                            chain.next();
                        }).done(function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(resultPs);
                            }
                        }).start();
                        $scope.winCreateL2Network__.close();
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
                    template: '<div style="color: black"><span class="z-label">{{"l2Network.ts.Name" | translate}}</span>: #: name #</div>' + '<div style="color: black"><span class="z-label">{{"l2Network.ts.State" | translate}}:</span>#: state #</div>' + '<div style="color: black"><span class="z-label">{{"l2Network.ts.UUID" | translate}}:</span> #: uuid #</div>'
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
                $scope.winCreateL2NetworkOptions__ = {
                    width: '700px',
                    //height: '680px',
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
            this.templateUrl = '/static/templates/l2Network/createL2Network.html';
        }
        CreateL2Network.prototype.queryClusters = function (zoneUuid, done) {
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
        CreateL2Network.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateL2Network__;
            var chain = new Utils.Chain();
            this.$scope.clusterList__.value([]);
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
                        if (zones && zones.length > 0) {
                            _this.$scope.infoPage.zoneUuid = zones[0].uuid;
                        }
                        chain.next();
                    });
                }
            }).then(function () {
                _this.api.getL2NetworkTypes(function (l2Types) {
                    var types = [];
                    angular.forEach(l2Types, function (item) {
                        types.push({ type: item });
                    });
                    _this.$scope.typeList.dataSource.data(new kendo.data.ObservableArray(types));
                    _this.$scope.infoPage.type = l2Types[0];
                    chain.next();
                });
            }).done(function () {
                win.center();
                win.open();
            }).start();
        };
        return CreateL2Network;
    }());
    ML2Network.CreateL2Network = CreateL2Network;
    var AttachCluster = (function () {
        function AttachCluster(clusterMgr, l2Mgr) {
            var _this = this;
            this.clusterMgr = clusterMgr;
            this.l2Mgr = l2Mgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/l2Network/attachCluster.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zL2NetworkAttachCluster] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.clusterListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">HYPERVISOR:</span><span>#: hypervisorType #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.selectItemNum = 0;
                $scope.hasCluster = function () {
                    return $scope.clusterListOptions__.dataSource.data().length > 0;
                };
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.attachCluster__.close();
                };
                $scope.done = function () {
                    var clusters = $scope.clusterList__.dataItems();
                    angular.forEach(clusters, function (cluster) {
                        l2Mgr.attach(_this.options.l2Network, cluster, function () {
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
                        value: _this.options.l2Network.attachedClusterUuids.join()
                    },
                    {
                        name: 'zoneUuid',
                        op: '=',
                        value: _this.options.l2Network.zoneUuid
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
    ML2Network.AttachCluster = AttachCluster;
    var DetachClusterOptions = (function () {
        function DetachClusterOptions() {
        }
        return DetachClusterOptions;
    }());
    ML2Network.DetachClusterOptions = DetachClusterOptions;
    var DetachCluster = (function () {
        function DetachCluster(l2Mgr, clusterMgr) {
            var _this = this;
            this.l2Mgr = l2Mgr;
            this.clusterMgr = clusterMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/l2Network/detachCluster.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zL2NetworkDetachCluster] = _this;
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
                $scope.selectItemNum = 0;
                $scope.hasCluster = function () {
                    return $scope.clusterListOptions__.dataSource.data().length > 0;
                };
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.detachCluster__.close();
                };
                $scope.done = function () {
                    var clusters = $scope.clusterList__.dataItems();
                    angular.forEach(clusters, function (cluster) {
                        l2Mgr.detach(_this.options.l2Network, cluster, function () {
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
                        value: _this.options.l2Network.attachedClusterUuids.join()
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
    ML2Network.DetachCluster = DetachCluster;
})(ML2Network || (ML2Network = {}));
angular.module('root').factory('L2NetworkManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new ML2Network.L2NetworkManager(api, $rootScope);
}]).directive('zCreateL2Network', ['Api', 'ZoneManager', 'L2NetworkManager', 'ClusterManager', function (api, zoneMgr, l2Mgr, clusterMgr) {
    return new ML2Network.CreateL2Network(api, zoneMgr, l2Mgr, clusterMgr);
}]).directive('zL2NetworkAttachCluster', ['ClusterManager', 'L2NetworkManager', function (clusterMgr, l2Mgr) {
    return new ML2Network.AttachCluster(clusterMgr, l2Mgr);
}]).directive('zL2NetworkDetachCluster', ['L2NetworkManager', 'ClusterManager', function (l2Mgr, clusterMgr) {
    return new ML2Network.DetachCluster(l2Mgr, clusterMgr);
}]).config(['$routeProvider', function (route) {
    route.when('/l2Network', {
        templateUrl: '/static/templates/l2Network/l2Network.html',
        controller: 'ML2Network.Controller',
        resolve: {
            l2NetworkTypes: function ($q, Api) {
                var defer = $q.defer();
                Api.getL2NetworkTypes(function (l2Types) {
                    defer.resolve(l2Types);
                });
                return defer.promise;
            }
        }
    }).when('/l2Network/:uuid', {
        templateUrl: '/static/templates/l2Network/details.html',
        controller: 'ML2Network.DetailsController',
        resolve: {
            current: function ($q, $route, L2NetworkManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var uuid = $route.current.params.uuid;
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                L2NetworkManager.query(qobj, function (l2s) {
                    var l2 = l2s[0];
                    defer.resolve(l2);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />