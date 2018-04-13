var MEip;
(function (MEip) {
    var Eip = (function (_super) {
        __extends(Eip, _super);
        function Eip() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Eip.prototype.progressOn = function () {
            this.inProgress = true;
        };
        Eip.prototype.progressOff = function () {
            this.inProgress = false;
        };
        Eip.prototype.isInProgress = function () {
            return this.inProgress;
        };
        Eip.prototype.isEnableShow = function () {
            return this.state == 'Disabled';
        };
        Eip.prototype.isDisableShow = function () {
            return this.state == 'Enabled';
        };
        Eip.prototype.isAttachShow = function () {
            return !Utils.notNullnotUndefined(this.vmNicUuid);
        };
        Eip.prototype.isDetachShow = function () {
            return !this.isAttachShow();
        };
        Eip.prototype.stateLabel = function () {
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
        Eip.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('state', inv.state);
            self.set('vmNicUuid', inv.vmNicUuid);
            self.set('vipUuid', inv.vipUuid);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        Eip.prototype.extendVip = function (vip) {
            var self = this;
            this['vipIp'] = vip;
            self.set('vipIp', vip);
        };
        Eip.prototype.extendVmNicIp = function (nicIp) {
            var self = this;
            this['vmNicIp'] = nicIp;
            self.set('vmNicIp', nicIp);
        };
        Eip.wrap = function (obj) {
            var eip = new Eip();
            angular.extend(eip, obj);
            return eip;
        };
        return Eip;
    }(ApiHeader.EipInventory));
    MEip.Eip = Eip;
    var EipManager = (function () {
        function EipManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        EipManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        EipManager.prototype.wrap = function (Eip) {
            return new kendo.data.ObservableObject(Eip);
        };
        EipManager.prototype.create = function (eip, done) {
            var _this = this;
            var msg = new ApiHeader.APICreateEipMsg();
            msg.name = eip.name;
            msg.description = eip.description;
            msg.vipUuid = eip.vipUuid;
            msg.vmNicUuid = eip.vmNicUuid;
            this.api.asyncApi(msg, function (ret) {
                var c = new Eip();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Created new EIP: {0}', c.name),
                    link: Utils.sprintf('/#/eip/{0}', c.uuid)
                });
            });
        };
        EipManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryEipMsg();
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
                    var c = new Eip();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        EipManager.prototype.getAttachableVmNicByEipUuid = function (uuid, done) {
            var msg = new ApiHeader.APIGetEipAttachableVmNicsMsg();
            msg.eipUuid = uuid;
            this.api.syncApi(msg, function (ret) {
                done(ret.inventories);
            });
        };
        EipManager.prototype.getAttachableVmNicByVipUuid = function (uuid, done) {
            var msg = new ApiHeader.APIGetEipAttachableVmNicsMsg();
            msg.vipUuid = uuid;
            this.api.syncApi(msg, function (ret) {
                done(ret.inventories);
            });
        };
        EipManager.prototype.attach = function (eip, vmNicUuid, done) {
            var _this = this;
            eip.progressOn();
            var msg = new ApiHeader.APIAttachEipMsg();
            msg.eipUuid = eip.uuid;
            msg.vmNicUuid = vmNicUuid;
            this.api.asyncApi(msg, function (ret) {
                eip.updateObservableObject(ret.inventory);
                eip.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Attached EIP: {0}', eip.name),
                    link: Utils.sprintf('/#/eip/{0}', eip.uuid)
                });
            });
        };
        EipManager.prototype.detach = function (eip, done) {
            var _this = this;
            eip.progressOn();
            var msg = new ApiHeader.APIDetachEipMsg();
            msg.uuid = eip.uuid;
            this.api.asyncApi(msg, function (ret) {
                eip.updateObservableObject(ret.inventory);
                eip.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Detached EIP: {0}', eip.name),
                    link: Utils.sprintf('/#/eip/{0}', eip.uuid)
                });
            });
        };
        EipManager.prototype.disable = function (eip) {
            var _this = this;
            eip.progressOn();
            var msg = new ApiHeader.APIChangeEipStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = eip.uuid;
            this.api.asyncApi(msg, function (ret) {
                eip.updateObservableObject(ret.inventory);
                eip.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled EIP: {0}', eip.name),
                    link: Utils.sprintf('/#/eip/{0}', eip.uuid)
                });
            });
        };
        EipManager.prototype.enable = function (eip) {
            var _this = this;
            eip.progressOn();
            var msg = new ApiHeader.APIChangeEipStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = eip.uuid;
            this.api.asyncApi(msg, function (ret) {
                eip.updateObservableObject(ret.inventory);
                eip.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled EIP: {0}', eip.name),
                    link: Utils.sprintf('/#/eip/{0}', eip.uuid)
                });
            });
        };
        EipManager.prototype["delete"] = function (eip, done) {
            var _this = this;
            eip.progressOn();
            var msg = new ApiHeader.APIDeleteEipMsg();
            msg.uuid = eip.uuid;
            this.api.asyncApi(msg, function (ret) {
                eip.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted EIP: {0}', eip.name)
                });
            });
        };
        return EipManager;
    }());
    EipManager.$inject = ['Api', '$rootScope'];
    MEip.EipManager = EipManager;
    var EipModel = (function (_super) {
        __extends(EipModel, _super);
        function EipModel() {
            var _this = _super.call(this) || this;
            _this.current = new Eip();
            return _this;
        }
        return EipModel;
    }(Utils.Model));
    MEip.EipModel = EipModel;
    var OEipGrid = (function (_super) {
        __extends(OEipGrid, _super);
        function OEipGrid($scope, eipMgr, vmMgr, vipMgr) {
            var _this = _super.call(this) || this;
            _this.eipMgr = eipMgr;
            _this.vmMgr = vmMgr;
            _this.vipMgr = vipMgr;
            _super.prototype.init.call(_this, $scope, $scope.eipGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"eip.ts.NAME" | translate}}',
                    width: '25%',
                    template: '<a href="/\\#/eip/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'state',
                    title: '{{"eip.ts.STATE" | translate}}',
                    width: '25%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'vipIp',
                    title: '{{"eip.ts.VIP IP" | translate}}',
                    width: '25%'
                },
                {
                    field: 'vmNicIp',
                    title: '{{"eip.ts.VM NIC IP" | translate}}',
                    width: '25%'
                },
            ];
            _this.options.dataSource.transport.read = function (options) {
                var chain = new Utils.Chain();
                var eips = [];
                var vips = {};
                var vmNics = {};
                var composedEip = [];
                var total = null;
                chain.then(function () {
                    var qobj = new ApiHeader.QueryObject();
                    qobj.limit = options.data.take;
                    qobj.start = options.data.pageSize * (options.data.page - 1);
                    eipMgr.query(qobj, function (ret, amount) {
                        eips = ret;
                        total = amount;
                        chain.next();
                    });
                }).then(function () {
                    if (eips.length == 0) {
                        chain.next();
                        return;
                    }
                    var nicUuids = [];
                    angular.forEach(eips, function (it) {
                        if (Utils.notNullnotUndefined(it.vmNicUuid)) {
                            nicUuids.push(it.vmNicUuid);
                        }
                    });
                    if (nicUuids.length == 0) {
                        chain.next();
                        return;
                    }
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = [
                        {
                            name: 'uuid',
                            op: 'in',
                            value: nicUuids.join()
                        }
                    ];
                    vmMgr.queryVmNic(qobj, function (ns) {
                        angular.forEach(ns, function (it) {
                            vmNics[it.uuid] = it;
                        });
                        chain.next();
                    });
                }).then(function () {
                    if (eips.length == 0) {
                        chain.next();
                        return;
                    }
                    var vipUuids = [];
                    angular.forEach(eips, function (it) {
                        vipUuids.push(it.vipUuid);
                    });
                    if (vipUuids.length == 0) {
                        chain.next();
                        return;
                    }
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = [
                        {
                            name: 'uuid',
                            op: 'in',
                            value: vipUuids.join()
                        }
                    ];
                    vipMgr.query(qobj, function (vs) {
                        angular.forEach(vs, function (it) {
                            vips[it.uuid] = it;
                        });
                        chain.next();
                    });
                }).then(function () {
                    if (eips.length == 0) {
                        chain.next();
                        return;
                    }
                    angular.forEach(eips, function (it) {
                        if (Utils.notNullnotUndefined(it.vmNicUuid)) {
                            var nic = vmNics[it.vmNicUuid];
                            it.extendVmNicIp(nic.ip);
                        }
                        var vip = vips[it.vipUuid];
                        it.extendVip(vip.ip);
                        composedEip.push(it);
                    });
                    chain.next();
                }).done(function () {
                    options.success({
                        data: composedEip,
                        total: total
                    });
                }).start();
            };
            return _this;
        }
        return OEipGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, eipMgr) {
            this.$scope = $scope;
            this.eipMgr = eipMgr;
        }
        Action.prototype.enable = function () {
            this.eipMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.eipMgr.disable(this.$scope.model.current);
        };
        Action.prototype.attach = function () {
            this.$scope.attachEip.open();
        };
        Action.prototype.detach = function () {
            this.$scope.detachEip.open();
        };
        return Action;
    }());
    var FilterBy = (function () {
        function FilterBy($scope) {
            var _this = this;
            this.$scope = $scope;
            this.fieldList = {
                dataSource: new kendo.data.DataSource({
                    data: [
                        {
                            name: '{{"eip.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"eip.ts.STATE" | translate}}',
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
                else if (_this.field == FilterBy.STATE) {
                    _this.valueList.dataSource.data(['Enabled', 'Disabled']);
                }
            });
        }
        FilterBy.prototype.confirm = function (popover) {
            this.$scope.oEipGrid.setFilter(this.toKendoFilter());
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
    var DetailsController = (function () {
        function DetailsController($scope, eipMgr, $routeParams, tagService, current, vmMgr) {
            var _this = this;
            this.$scope = $scope;
            this.eipMgr = eipMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            this.vmMgr = vmMgr;
            $scope.model = new EipModel();
            $scope.model.current = current.eip;
            $scope.vip = current.vip;
            $scope.nic = current.nic;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, eipMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteEip = {
                title: 'DELETE EIP',
                btnType: 'btn-danger',
                width: '350px',
                description: function () {
                    return current.name;
                },
                confirm: function () {
                    eipMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeEipVO, function (ret) {
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
            $scope.optionsDetachEip = {
                eip: current.eip,
                done: function () {
                    $scope.nic = null;
                }
            };
            $scope.optionsAttachEip = {
                eip: current.eip,
                done: function () {
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = [{
                        name: 'uuid',
                        op: '=',
                        value: current.eip.vmNicUuid
                    }];
                    vmMgr.queryVmNic(qobj, function (nics) {
                        current.eip.extendVmNicIp(nics[0].ip);
                        $scope.nic = nics[0];
                    });
                }
            };
        }
        DetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.eipMgr.query(qobj, function (eips, total) {
                _this.$scope.model.current = eips[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'EipManager', '$routeParams', 'Tag', 'current', 'VmInstanceManager'];
    MEip.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, eipMgr, $location, vipMgr, vmMgr) {
            this.$scope = $scope;
            this.eipMgr = eipMgr;
            this.$location = $location;
            this.vipMgr = vipMgr;
            this.vmMgr = vmMgr;
            $scope.model = new EipModel();
            $scope.oEipGrid = new OEipGrid($scope, eipMgr, vmMgr, vipMgr);
            $scope.action = new Action($scope, eipMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"eip.ts.NAME" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"eip.ts.Description" | translate}}',
                        value: 'description'
                    },
                    {
                        name: '{{"eip.ts.STATE" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"eip.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"eip.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    eipMgr.setSortBy(ret);
                    $scope.oEipGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.EipInventoryQueryable,
                name: 'Eip',
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
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = ret;
                    eipMgr.query(qobj, function (Eips, total) {
                        $scope.oEipGrid.refresh(Eips);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/eip/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateEip = function (win) {
                win.open();
            };
            $scope.funcDeleteEip = function () {
                $scope.deleteEip.open();
            };
            $scope.optionsDeleteEip = {
                title: 'DELETE EIP',
                btnType: 'btn-danger',
                width: '350px',
                description: function () {
                    return $scope.model.current.name;
                },
                confirm: function () {
                    eipMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oEipGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oEipGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsAttachEip = {
                eip: null,
                done: function () {
                    var eip = $scope.optionsAttachEip.eip;
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = [{
                        name: 'uuid',
                        op: '=',
                        value: eip.vmNicUuid
                    }];
                    vmMgr.queryVmNic(qobj, function (nics) {
                        eip.extendVmNicIp(nics[0].ip);
                    });
                }
            };
            $scope.optionsDetachEip = {
                eip: null,
                done: function () {
                    $scope.optionsDetachEip.eip.extendVmNicIp(null);
                }
            };
            $scope.$watch(function () {
                return $scope.model.current;
            }, function () {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    $scope.optionsAttachEip.eip = $scope.model.current;
                    $scope.optionsDetachEip.eip = $scope.model.current;
                }
            });
            $scope.optionsCreateEip = {
                done: function (eip) {
                    var chain = new Utils.Chain();
                    var composedEip = {};
                    angular.extend(composedEip, eip);
                    chain.then(function () {
                        var qobj = new ApiHeader.QueryObject();
                        qobj.conditions = [
                            {
                                name: 'uuid',
                                op: '=',
                                value: eip.vipUuid
                            }
                        ];
                        vipMgr.query(qobj, function (ret) {
                            var vip = ret[0];
                            eip.extendVip(vip.ip);
                            chain.next();
                        });
                    }).then(function () {
                        if (!Utils.notNullnotUndefined(eip.vmNicUuid)) {
                            chain.next();
                            return;
                        }
                        var qobj = new ApiHeader.QueryObject();
                        qobj.conditions = [
                            {
                                name: 'uuid',
                                op: '=',
                                value: eip.vmNicUuid
                            }
                        ];
                        vmMgr.queryVmNic(qobj, function (ret) {
                            var nic = ret[0];
                            eip.extendVmNicIp(nic.ip);
                            chain.next();
                        });
                    }).done(function () {
                        $scope.oEipGrid.add(eip);
                    }).start();
                }
            };
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'EipManager', '$location', 'VipManager', 'VmInstanceManager'];
    MEip.Controller = Controller;
    var CreateEip = (function () {
        function CreateEip(api, eipMgr, vipMgr, l3Mgr, vmMgr) {
            var _this = this;
            this.api = api;
            this.eipMgr = eipMgr;
            this.vipMgr = vipMgr;
            this.l3Mgr = l3Mgr;
            this.vmMgr = vmMgr;
            this.existingVip = {};
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateEip;
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
                var vipPage = $scope.vipPage = {
                    activeState: true,
                    method: null,
                    vipUuid: null,
                    l3NetworkUuid: null,
                    vip: null,
                    isVipCreating: false,
                    canCreate: function () {
                        return !Utils.notNullnotUndefined(this.vip) && $scope.l3NetworkListOptions__.dataSource.data().length > 0 && this.method == CreateEip.CREATE_NEW_VIP;
                    },
                    hasL3Network: function () {
                        return $scope.l3NetworkListOptions__.dataSource.data().length > 0;
                    },
                    hasVip: function () {
                        return $scope.vipListOptions__.dataSource.data().length > 0;
                    },
                    create: function () {
                        var _this = this;
                        this.isVipCreating = true;
                        vipMgr.create({
                            name: Utils.sprintf('vip-{0}', Utils.uuid()),
                            l3NetworkUuid: this.l3NetworkUuid
                        }, function (ret) {
                            _this.vip = ret;
                            _this.isVipCreating = false;
                        });
                    },
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.vipUuid) || Utils.notNullnotUndefined(this.vip);
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createEipVip"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createEipVip';
                    },
                    reset: function () {
                        this.method = CreateEip.CREATE_NEW_VIP;
                        this.l3NetworkUuid = null;
                        this.vip = null;
                        this.vipUuid = null;
                        this.activeState = false;
                    }
                };
                $scope.vipMethodOptions__ = {
                    dataSource: new kendo.data.DataSource({
                        data: [{
                            name: '{{"eip.ts.Create New VIP" | translate}}',
                            field: CreateEip.CREATE_NEW_VIP
                        }, {
                            name: '{{"eip.ts.Use Existing VIP" | translate}}',
                            field: CreateEip.USE_EXISTING_VIP
                        }]
                    }),
                    dataTextField: "name",
                    dataValueField: "field"
                };
                var infoPage = $scope.infoPage = {
                    activeState: true,
                    name: null,
                    description: null,
                    vmNicUuid: null,
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name);
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createEipInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createEipInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('eip');
                        this.description = null;
                        this.vmNicUuid = null;
                        this.activeState = false;
                    },
                    hasVm: function () {
                        return $scope.vmListOptions__.dataSource.data().length > 0;
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
                        var resultEip;
                        var chain = new Utils.Chain();
                        chain.then(function () {
                            var vipUuid = null;
                            if (Utils.notNullnotUndefined($scope.vipPage.vip)) {
                                vipUuid = $scope.vipPage.vip.uuid;
                            }
                            else {
                                vipUuid = $scope.vipPage.vipUuid;
                            }
                            eipMgr.create({
                                vipUuid: vipUuid,
                                vmNicUuid: $scope.infoPage.vmNicUuid == "" ? null : $scope.infoPage.vmNicUuid,
                                name: $scope.infoPage.name,
                                description: $scope.infoPage.description
                            }, function (ret) {
                                resultEip = ret;
                                chain.next();
                            });
                        }).done(function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(resultEip);
                            }
                        }).start();
                        $scope.winCreateEip__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    vipPage, infoPage
                ], mediator);
                $scope.winCreateEipOptions__ = {
                    width: '700px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.vipListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"eip.ts.NAME" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.IP" | translate}}:</span><span>#: ip #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Gateway" | translate}}:</span><span>#: gateway #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Netmask" | translate}}:</span><span>#: netmask #</span></div>'
                };
                $scope.l3NetworkListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"eip.ts.NAME" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Type" | translate}}:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Zone UUID" | translate}}:</span><span>#: zoneUuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.L2 Network UUID" | translate}}:</span><span>#: l2NetworkUuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.vmListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "nicUuid",
                    template: '<div style="color: black"><span class="z-label">{{"eip.ts.VM Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.VM UUID" | translate}}:</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Nic DeviceId" | translate}}:</span><span>#: nicDeviceId #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Nic Ip" | translate}}:</span><span>#: nicIp #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Nic Netmask" | translate}}:</span><span>#: nicNetmask #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Nic Gateway" | translate}}:</span><span>#: nicGateway #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Nic Mac" | translate}}:</span><span>#: nicMac #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.L3 Network UUID" | translate}}:</span><span>#: l3NetworkUuid #</span></div>'
                };
                $scope.$watch(function () {
                    return [$scope.vipPage.vipUuid, $scope.vipPage.vip];
                }, function () {
                    var vip = null;
                    if (Utils.notNullnotUndefined($scope.vipPage.vip)) {
                        vip = $scope.vipPage.vip;
                    }
                    else if (Utils.notNullnotUndefined($scope.vipPage.vipUuid)) {
                        vip = _this.existingVip[$scope.vipPage.vipUuid];
                    }
                    if (!Utils.notNullnotUndefined(vip)) {
                        $scope.vipPage.vipUuid = null;
                        $scope.vipPage.vip = null;
                        return;
                    }
                    var chain = new Utils.Chain();
                    var vmNics = [];
                    var composedVms = [];
                    chain.then(function () {
                        _this.eipMgr.getAttachableVmNicByVipUuid(vip.uuid, function (nics) {
                            vmNics = nics;
                            chain.next();
                        });
                    }).done(function () {
                        if (vmNics.length == 0) {
                            $scope.vmListOptions__.dataSource.data(composedVms);
                            $scope.infoPage.vmNicUuid = null;
                            return;
                        }
                        var nicUuids = [];
                        angular.forEach(vmNics, function (it) {
                            nicUuids.push(it.uuid);
                        });
                        var qobj = new ApiHeader.QueryObject();
                        qobj.conditions = [{
                            name: 'vmNics.uuid',
                            op: 'in',
                            value: nicUuids.join()
                        }];
                        _this.vmMgr.query(qobj, function (vms) {
                            angular.forEach(vms, function (it) {
                                angular.forEach(it.vmNics, function (nic) {
                                    if (nic.l3NetworkUuid == vip.l3NetworkUuid) {
                                        return;
                                    }
                                    composedVms.push({
                                        name: it.name,
                                        uuid: it.uuid,
                                        nicDeviceId: nic.deviceId,
                                        nicIp: nic.ip,
                                        nicNetmask: nic.netmask,
                                        nicGateway: nic.gateway,
                                        nicMac: nic.mac,
                                        l3NetworkUuid: nic.l3NetworkUuid,
                                        nicUuid: nic.uuid
                                    });
                                });
                            });
                            $scope.vmListOptions__.dataSource.data(composedVms);
                            $scope.infoPage.vmNicUuid = null;
                        });
                    }).start();
                }, true);
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/eip/createEip.html';
        }
        CreateEip.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateEip__;
            this.$scope.button.reset();
            var chain = new Utils.Chain();
            this.existingVip = {};
            this.$scope.vipPage.method = CreateEip.CREATE_NEW_VIP;
            this.$scope.vipPage.isVipCreating = false;
            this.$scope.vipPage.vipUuid = null;
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [{
                    name: 'state',
                    op: '=',
                    value: 'Enabled'
                }, {
                    name: 'useFor',
                    op: 'is null',
                    value: null
                }];
                _this.vipMgr.query(qobj, function (ret) {
                    _this.$scope.vipListOptions__.dataSource.data(ret);
                    if (ret.length > 0) {
                        angular.forEach(ret, function (it) {
                            _this.existingVip[it.uuid] = it;
                        });
                        //this.$scope.vipPage.vipUuid = ret[0].uuid;
                    }
                    chain.next();
                });
            }).then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [];
                _this.l3Mgr.query(qobj, function (ret) {
                    _this.$scope.l3NetworkListOptions__.dataSource.data(ret);
                    if (ret.length > 0) {
                        _this.$scope.vipPage.l3NetworkUuid = ret[0].uuid;
                    }
                    chain.next();
                });
            }).done(function () {
                win.center();
                win.open();
            }).start();
        };
        return CreateEip;
    }());
    CreateEip.USE_EXISTING_VIP = "existing";
    CreateEip.CREATE_NEW_VIP = "new";
    MEip.CreateEip = CreateEip;
    var AttachEip = (function () {
        function AttachEip(eipMgr, vmMgr) {
            var _this = this;
            this.eipMgr = eipMgr;
            this.vmMgr = vmMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/eip/attachEip.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zEipAttachVm] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.vmListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "nicUuid",
                    template: '<div style="color: black"><span class="z-label">{{"eip.ts.VM Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.VM UUID" | translate}}:</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Nic DeviceId" | translate}}:</span><span>#: nicDeviceId #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Nic Ip" | translate}}:</span><span>#: nicIp #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Nic Netmask" | translate}}:</span><span>#: nicNetmask #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Nic Gateway" | translate}}:</span><span>#: nicGateway #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.Nic Mac" | translate}}:</span><span>#: nicMac #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"eip.ts.L3 Network UUID" | translate}}:</span><span>#: l3NetworkUuid #</span></div>'
                };
                $scope.hasVm = function () {
                    return $scope.vmListOptions__.dataSource.data().length > 0;
                };
                $scope.canProceed = function () {
                    return Utils.notNullnotUndefined($scope.vmNicUuid);
                };
                $scope.cancel = function () {
                    $scope.attachEip__.close();
                };
                $scope.done = function () {
                    eipMgr.attach(_this.options.eip, $scope.vmNicUuid, function () {
                        if (Utils.notNullnotUndefined(_this.options.done)) {
                            _this.options.done();
                        }
                    });
                    $scope.attachEip__.close();
                };
                _this.$scope = $scope;
                $scope.attachEipOptions__ = {
                    width: '550px'
                };
            };
        }
        AttachEip.prototype.open = function () {
            var _this = this;
            this.$scope.vmListOptions__.dataSource.data([]);
            var chain = new Utils.Chain();
            var vmNics = [];
            var composedVms = [];
            chain.then(function () {
                _this.eipMgr.getAttachableVmNicByEipUuid(_this.options.eip.uuid, function (nics) {
                    vmNics = nics;
                    chain.next();
                });
            }).then(function () {
                if (vmNics.length == 0) {
                    _this.$scope.vmListOptions__.dataSource.data(composedVms);
                    _this.$scope.vmNicUuid = null;
                    chain.next();
                    return;
                }
                var nicUuids = [];
                angular.forEach(vmNics, function (it) {
                    nicUuids.push(it.uuid);
                });
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [{
                    name: 'vmNics.uuid',
                    op: 'in',
                    value: nicUuids.join()
                }];
                _this.vmMgr.query(qobj, function (vms) {
                    angular.forEach(vms, function (it) {
                        angular.forEach(it.vmNics, function (nic) {
                            if (nicUuids.indexOf(nic.uuid) == -1) {
                                return;
                            }
                            composedVms.push({
                                name: it.name,
                                uuid: it.uuid,
                                nicDeviceId: nic.deviceId,
                                nicIp: nic.ip,
                                nicNetmask: nic.netmask,
                                nicGateway: nic.gateway,
                                nicMac: nic.mac,
                                l3NetworkUuid: nic.l3NetworkUuid,
                                nicUuid: nic.uuid
                            });
                        });
                    });
                    _this.$scope.vmListOptions__.dataSource.data(composedVms);
                    if (composedVms.length > 0) {
                        _this.$scope.vmNicUuid = composedVms[0].nicUuid;
                    }
                    chain.next();
                });
            }).done(function () {
                _this.$scope.attachEip__.center();
                _this.$scope.attachEip__.open();
            }).start();
        };
        return AttachEip;
    }());
    MEip.AttachEip = AttachEip;
    var DetachEip = (function () {
        function DetachEip(eipMgr, vmMgr) {
            var _this = this;
            this.eipMgr = eipMgr;
            this.vmMgr = vmMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/eip/detachEip.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zEipDetachVm] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.cancel = function () {
                    $scope.detachEip__.close();
                };
                $scope.done = function () {
                    eipMgr.detach(_this.options.eip, function () {
                        if (_this.options.done) {
                            _this.options.done();
                        }
                    });
                    $scope.detachEip__.close();
                };
                $scope.optionsDetachEip__ = {
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
        DetachEip.prototype.open = function () {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.conditions = [
                {
                    name: 'vmNics.uuid',
                    op: '=',
                    value: this.options.eip.vmNicUuid
                }
            ];
            this.vmMgr.query(qobj, function (vms) {
                if (vms.length > 0) {
                    var vm = vms[0];
                    _this.$scope.vm = vm;
                    angular.forEach(vm.vmNics, function (it) {
                        _this.$scope.vm['nicDeviceId'] = it.deviceId;
                        _this.$scope.vm['nicMac'] = it.mac;
                        _this.$scope.vm['nicIp'] = it.ip;
                        _this.$scope.vm['nicNetmask'] = it.netmask;
                        _this.$scope.vm['nicGateway'] = it.gateway;
                    });
                }
                _this.$scope.detachEip__.center();
                _this.$scope.detachEip__.open();
            });
        };
        return DetachEip;
    }());
    MEip.DetachEip = DetachEip;
})(MEip || (MEip = {}));
angular.module('root').factory('EipManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MEip.EipManager(api, $rootScope);
}]).directive('zCreateEip', ['Api', 'EipManager', 'VipManager', 'L3NetworkManager', 'VmInstanceManager', function (api, eipMgr, vipMgr, l3Mgr, vmMgr) {
    return new MEip.CreateEip(api, eipMgr, vipMgr, l3Mgr, vmMgr);
}]).directive('zEipAttachVm', ['EipManager', 'VmInstanceManager', function (eipMgr, vmMgr) {
    return new MEip.AttachEip(eipMgr, vmMgr);
}]).directive('zEipDetachVm', ['EipManager', 'VmInstanceManager', function (eipMgr, vmMgr) {
    return new MEip.DetachEip(eipMgr, vmMgr);
}]).config(['$routeProvider', function (route) {
    route.when('/eip', {
        templateUrl: '/static/templates/eip/eip.html',
        controller: 'MEip.Controller'
    }).when('/eip/:uuid', {
        templateUrl: '/static/templates/eip/details.html',
        controller: 'MEip.DetailsController',
        resolve: {
            current: function ($q, $route, EipManager, VmInstanceManager, VipManager) {
                var defer = $q.defer();
                var uuid = $route.current.params.uuid;
                var ret = {
                    eip: null,
                    nic: null,
                    vip: null
                };
                var chain = new Utils.Chain();
                chain.then(function () {
                    var qobj = new ApiHeader.QueryObject();
                    qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                    EipManager.query(qobj, function (eips) {
                        ret.eip = eips[0];
                        chain.next();
                    });
                }).then(function () {
                    if (!Utils.notNullnotUndefined(ret.eip.vmNicUuid)) {
                        chain.next();
                        return;
                    }
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = [{
                        name: 'uuid',
                        op: '=',
                        value: ret.eip.vmNicUuid
                    }];
                    VmInstanceManager.queryVmNic(qobj, function (nics) {
                        ret.nic = nics[0];
                        chain.next();
                    });
                }).then(function () {
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = [{
                        name: 'uuid',
                        op: '=',
                        value: ret.eip.vipUuid
                    }];
                    VipManager.query(qobj, function (vips) {
                        ret.vip = vips[0];
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