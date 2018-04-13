var MPortForwarding;
(function (MPortForwarding) {
    var PortForwarding = (function (_super) {
        __extends(PortForwarding, _super);
        function PortForwarding() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        PortForwarding.prototype.progressOn = function () {
            this.inProgress = true;
        };
        PortForwarding.prototype.progressOff = function () {
            this.inProgress = false;
        };
        PortForwarding.prototype.isInProgress = function () {
            return this.inProgress;
        };
        PortForwarding.prototype.isEnableShow = function () {
            return this.state == 'Disabled';
        };
        PortForwarding.prototype.isDisableShow = function () {
            return this.state == 'Enabled';
        };
        PortForwarding.prototype.isAttachShow = function () {
            return !Utils.notNullnotUndefined(this.vmNicUuid);
        };
        PortForwarding.prototype.isDetachShow = function () {
            return !this.isAttachShow();
        };
        PortForwarding.prototype.stateLabel = function () {
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
        PortForwarding.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('state', inv.state);
            self.set('vmNicUuid', inv.vmNicUuid);
            self.set('vipUuid', inv.vipUuid);
            self.set('vipPortStart', inv.vipPortStart);
            self.set('vipPortEnd', inv.vipPortEnd);
            self.set('privatePortStart', inv.privatePortStart);
            self.set('privatePortEnd', inv.privatePortEnd);
            self.set('protocolType', inv.protocolType);
            self.set('allowedCidr', inv.allowedCidr);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        PortForwarding.prototype.extendVip = function (vip) {
            var self = this;
            this['vipIp'] = vip;
            self.set('vipIp', vip);
        };
        PortForwarding.prototype.extendVmNicIp = function (nicIp) {
            var self = this;
            this['vmNicIp'] = nicIp;
            self.set('vmNicIp', nicIp);
        };
        PortForwarding.wrap = function (obj) {
            var pf = new PortForwarding();
            angular.extend(pf, obj);
            return pf;
        };
        return PortForwarding;
    }(ApiHeader.PortForwardingRuleInventory));
    MPortForwarding.PortForwarding = PortForwarding;
    var PortForwardingManager = (function () {
        function PortForwardingManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        PortForwardingManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        PortForwardingManager.prototype.wrap = function (PortForwarding) {
            return new kendo.data.ObservableObject(PortForwarding);
        };
        PortForwardingManager.prototype.create = function (pf, done) {
            var _this = this;
            var msg = new ApiHeader.APICreatePortForwardingRuleMsg();
            msg.name = pf.name;
            msg.description = pf.description;
            msg.vipUuid = pf.vipUuid;
            msg.vmNicUuid = pf.vmNicUuid;
            msg.vipPortStart = pf.vipPortStart;
            msg.vipPortEnd = pf.vipPortEnd;
            msg.privatePortStart = pf.privatePortStart;
            msg.privatePortEnd = pf.privatePortEnd;
            msg.allowedCidr = pf.allowedCidr;
            msg.protocolType = pf.protocolType;
            this.api.asyncApi(msg, function (ret) {
                var c = new PortForwarding();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Created new port forwarding rule: {0}', c.name),
                    link: Utils.sprintf('/#/portForwarding/{0}', c.uuid)
                });
            });
        };
        PortForwardingManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryPortForwardingRuleMsg();
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
                    var c = new PortForwarding();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        PortForwardingManager.prototype.getAttachableVmNicByPortForwardingUuid = function (uuid, done) {
            var msg = new ApiHeader.APIGetPortForwardingAttachableVmNicsMsg();
            msg.ruleUuid = uuid;
            this.api.syncApi(msg, function (ret) {
                done(ret.inventories);
            });
        };
        PortForwardingManager.prototype.attach = function (pf, vmNicUuid, done) {
            var _this = this;
            pf.progressOn();
            var msg = new ApiHeader.APIAttachPortForwardingRuleMsg();
            msg.ruleUuid = pf.uuid;
            msg.vmNicUuid = vmNicUuid;
            this.api.asyncApi(msg, function (ret) {
                pf.updateObservableObject(ret.inventory);
                pf.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Attached port forwarding rule: {0}', pf.name),
                    link: Utils.sprintf('/#/portForwarding/{0}', pf.uuid)
                });
            });
        };
        PortForwardingManager.prototype.detach = function (pf, done) {
            var _this = this;
            pf.progressOn();
            var msg = new ApiHeader.APIDetachPortForwardingRuleMsg();
            msg.uuid = pf.uuid;
            this.api.asyncApi(msg, function (ret) {
                pf.updateObservableObject(ret.inventory);
                pf.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Detached port forwarding rule: {0}', pf.name),
                    link: Utils.sprintf('/#/portForwarding/{0}', pf.uuid)
                });
            });
        };
        PortForwardingManager.prototype.disable = function (pf) {
            var _this = this;
            pf.progressOn();
            var msg = new ApiHeader.APIChangePortForwardingRuleStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = pf.uuid;
            this.api.asyncApi(msg, function (ret) {
                pf.updateObservableObject(ret.inventory);
                pf.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled port forwarding rule: {0}', pf.name),
                    link: Utils.sprintf('/#/portForwarding/{0}', pf.uuid)
                });
            });
        };
        PortForwardingManager.prototype.enable = function (pf) {
            var _this = this;
            pf.progressOn();
            var msg = new ApiHeader.APIChangePortForwardingRuleStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = pf.uuid;
            this.api.asyncApi(msg, function (ret) {
                pf.updateObservableObject(ret.inventory);
                pf.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled port forwarding rule: {0}', pf.name),
                    link: Utils.sprintf('/#/portForwarding/{0}', pf.uuid)
                });
            });
        };
        PortForwardingManager.prototype["delete"] = function (pf, done) {
            var _this = this;
            pf.progressOn();
            var msg = new ApiHeader.APIDeletePortForwardingRuleMsg();
            msg.uuid = pf.uuid;
            this.api.asyncApi(msg, function (ret) {
                pf.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted EIP: {0}', pf.name)
                });
            });
        };
        return PortForwardingManager;
    }());
    PortForwardingManager.$inject = ['Api', '$rootScope'];
    MPortForwarding.PortForwardingManager = PortForwardingManager;
    var PortForwardingModel = (function (_super) {
        __extends(PortForwardingModel, _super);
        function PortForwardingModel() {
            var _this = _super.call(this) || this;
            _this.current = new PortForwarding();
            return _this;
        }
        return PortForwardingModel;
    }(Utils.Model));
    MPortForwarding.PortForwardingModel = PortForwardingModel;
    var OPortForwardingGrid = (function (_super) {
        __extends(OPortForwardingGrid, _super);
        function OPortForwardingGrid($scope, pfMgr, vmMgr, vipMgr) {
            var _this = _super.call(this) || this;
            _this.pfMgr = pfMgr;
            _this.vmMgr = vmMgr;
            _this.vipMgr = vipMgr;
            _super.prototype.init.call(_this, $scope, $scope.pfGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"portForwarding.ts.NAME" | translate}}',
                    width: '10%',
                    template: '<a href="/\\#/portForwarding/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'state',
                    title: '{{"portForwarding.ts.STATE" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'vipPortStart',
                    title: '{{"portForwarding.ts.VIP PORT START" | translate}}',
                    width: '10%'
                },
                {
                    field: 'vipPortEnd',
                    title: '{{"portForwarding.ts.VIP PORT END" | translate}}',
                    width: '10%'
                },
                {
                    field: 'privatePortStart',
                    title: '{{"portForwarding.ts.GUEST PORT START" | translate}}',
                    width: '10%'
                },
                {
                    field: 'privatePortEnd',
                    title: '{{"portForwarding.ts.GUEST PORT END" | translate}}',
                    width: '10%'
                },
                {
                    field: 'vipIp',
                    title: '{{"portForwarding.ts.VIP IP" | translate}}',
                    width: '20%'
                },
                {
                    field: 'vmNicIp',
                    title: '{{"portForwarding.ts.VM NIC IP" | translate}}',
                    width: '20%'
                },
            ];
            _this.options.dataSource.transport.read = function (options) {
                var chain = new Utils.Chain();
                var pfs = [];
                var vips = {};
                var vmNics = {};
                var composedPortForwarding = [];
                var total = null;
                chain.then(function () {
                    var qobj = new ApiHeader.QueryObject();
                    qobj.limit = options.data.take;
                    qobj.start = options.data.pageSize * (options.data.page - 1);
                    pfMgr.query(qobj, function (ret, amount) {
                        pfs = ret;
                        total = amount;
                        chain.next();
                    });
                }).then(function () {
                    if (pfs.length == 0) {
                        chain.next();
                        return;
                    }
                    var nicUuids = [];
                    angular.forEach(pfs, function (it) {
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
                    if (pfs.length == 0) {
                        chain.next();
                        return;
                    }
                    var vipUuids = [];
                    angular.forEach(pfs, function (it) {
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
                    if (pfs.length == 0) {
                        chain.next();
                        return;
                    }
                    angular.forEach(pfs, function (it) {
                        if (Utils.notNullnotUndefined(it.vmNicUuid)) {
                            var nic = vmNics[it.vmNicUuid];
                            it.extendVmNicIp(nic.ip);
                        }
                        var vip = vips[it.vipUuid];
                        it.extendVip(vip.ip);
                        composedPortForwarding.push(it);
                    });
                    chain.next();
                }).done(function () {
                    options.success({
                        data: composedPortForwarding,
                        total: total
                    });
                }).start();
            };
            return _this;
        }
        return OPortForwardingGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, pfMgr) {
            this.$scope = $scope;
            this.pfMgr = pfMgr;
        }
        Action.prototype.enable = function () {
            this.pfMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.pfMgr.disable(this.$scope.model.current);
        };
        Action.prototype.attach = function () {
            this.$scope.attachPortForwarding.open();
        };
        Action.prototype.detach = function () {
            this.$scope.detachPortForwarding.open();
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
                            name: '{{"portForwarding.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"portForwarding.ts.State" | translate}}',
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
            this.$scope.oPortForwardingGrid.setFilter(this.toKendoFilter());
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
        function DetailsController($scope, pfMgr, $routeParams, tagService, current, vmMgr) {
            var _this = this;
            this.$scope = $scope;
            this.pfMgr = pfMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            this.vmMgr = vmMgr;
            $scope.model = new PortForwardingModel();
            $scope.model.current = current.pf;
            $scope.vip = current.vip;
            $scope.nic = current.nic;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, pfMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeletePortForwarding = {
                title: 'DELETE PORT FORWARDING RULE',
                description: function () {
                    return current.name;
                },
                btnType: 'btn-danger',
                width: '350px',
                confirm: function () {
                    pfMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypePortForwardingRuleVO, function (ret) {
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
            $scope.optionsDetachPortForwarding = {
                pf: current.pf,
                done: function () {
                    $scope.nic = null;
                }
            };
            $scope.optionsAttachPortForwarding = {
                pf: current.pf,
                done: function () {
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = [{
                        name: 'uuid',
                        op: '=',
                        value: current.pf.vmNicUuid
                    }];
                    vmMgr.queryVmNic(qobj, function (nics) {
                        current.pf.extendVmNicIp(nics[0].ip);
                        $scope.nic = nics[0];
                    });
                }
            };
        }
        DetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.pfMgr.query(qobj, function (pfs, total) {
                _this.$scope.model.current = pfs[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'PortForwardingManager', '$routeParams', 'Tag', 'current', 'VmInstanceManager'];
    MPortForwarding.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, pfMgr, $location, vipMgr, vmMgr) {
            this.$scope = $scope;
            this.pfMgr = pfMgr;
            this.$location = $location;
            this.vipMgr = vipMgr;
            this.vmMgr = vmMgr;
            $scope.model = new PortForwardingModel();
            $scope.oPortForwardingGrid = new OPortForwardingGrid($scope, pfMgr, vmMgr, vipMgr);
            $scope.action = new Action($scope, pfMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"portForwarding.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"portForwarding.ts.Description" | translate}}',
                        value: 'description'
                    },
                    {
                        name: '{{"portForwarding.ts.VIP Port Start" | translate}}',
                        value: 'vipPortStart'
                    },
                    {
                        name: '{{"portForwarding.ts.VIP Port End" | translate}}',
                        value: 'vipPortEnd'
                    },
                    {
                        name: '{{"portForwarding.ts.Private Port Start" | translate}}',
                        value: 'privatePortStart'
                    },
                    {
                        name: '{{"portForwarding.ts.Private Port End" | translate}}',
                        value: 'privatePortEnd'
                    },
                    {
                        name: '{{"portForwarding.ts.Protocol" | translate}}',
                        value: 'protocolType'
                    },
                    {
                        name: '{{"portForwarding.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"portForwarding.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"portForwarding.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    pfMgr.setSortBy(ret);
                    $scope.oPortForwardingGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.PortForwardingRuleInventoryQueryable,
                name: 'PortForwarding',
                schema: {
                    state: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['Enabled', 'Disabled']
                    },
                    protocol: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['UDP', 'TCP']
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
                    pfMgr.query(qobj, function (PortForwardings, total) {
                        $scope.oPortForwardingGrid.refresh(PortForwardings);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/portForwarding/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreatePortForwarding = function (win) {
                win.open();
            };
            $scope.funcDeletePortForwarding = function () {
                $scope.deletePortForwarding.open();
            };
            $scope.optionsDeletePortForwarding = {
                title: 'DELETE PORT FORWARDING RULE',
                description: function () {
                    return $scope.model.current.name;
                },
                btnType: 'btn-danger',
                width: '350px',
                confirm: function () {
                    pfMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oPortForwardingGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oPortForwardingGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsAttachPortForwarding = {
                pf: null,
                done: function () {
                    var pf = $scope.optionsAttachPortForwarding.pf;
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = [{
                        name: 'uuid',
                        op: '=',
                        value: pf.vmNicUuid
                    }];
                    vmMgr.queryVmNic(qobj, function (nics) {
                        pf.extendVmNicIp(nics[0].ip);
                    });
                }
            };
            $scope.optionsDetachPortForwarding = {
                pf: null,
                done: function () {
                    $scope.optionsDetachPortForwarding.pf.extendVmNicIp(null);
                }
            };
            $scope.$watch(function () {
                return $scope.model.current;
            }, function () {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    $scope.optionsAttachPortForwarding.pf = $scope.model.current;
                    $scope.optionsDetachPortForwarding.pf = $scope.model.current;
                }
            });
            $scope.optionsCreatePortForwarding = {
                done: function (pf) {
                    var chain = new Utils.Chain();
                    var composedPortForwarding = {};
                    angular.extend(composedPortForwarding, pf);
                    chain.then(function () {
                        var qobj = new ApiHeader.QueryObject();
                        qobj.conditions = [
                            {
                                name: 'uuid',
                                op: '=',
                                value: pf.vipUuid
                            }
                        ];
                        vipMgr.query(qobj, function (ret) {
                            var vip = ret[0];
                            pf.extendVip(vip.ip);
                            chain.next();
                        });
                    }).then(function () {
                        if (!Utils.notNullnotUndefined(pf.vmNicUuid)) {
                            chain.next();
                            return;
                        }
                        var qobj = new ApiHeader.QueryObject();
                        qobj.conditions = [
                            {
                                name: 'uuid',
                                op: '=',
                                value: pf.vmNicUuid
                            }
                        ];
                        vmMgr.queryVmNic(qobj, function (ret) {
                            var nic = ret[0];
                            pf.extendVmNicIp(nic.ip);
                            chain.next();
                        });
                    }).done(function () {
                        $scope.oPortForwardingGrid.add(pf);
                    }).start();
                }
            };
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'PortForwardingManager', '$location', 'VipManager', 'VmInstanceManager'];
    MPortForwarding.Controller = Controller;
    var CreatePortForwarding = (function () {
        function CreatePortForwarding(api, pfMgr, vipMgr, l3Mgr, vmMgr) {
            var _this = this;
            this.api = api;
            this.pfMgr = pfMgr;
            this.vipMgr = vipMgr;
            this.l3Mgr = l3Mgr;
            this.vmMgr = vmMgr;
            this.existingVip = {};
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreatePortForwardingRule;
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
                        return !Utils.notNullnotUndefined(this.vip) && Utils.notNullnotUndefined(this.l3NetworkUuid) && this.method == CreatePortForwarding.CREATE_NEW_VIP;
                    },
                    create: function () {
                        var _this = this;
                        this.isVipCreating = true;
                        vipMgr.create({
                            name: Utils.shortHashName('vip'),
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
                        return (Utils.notNullnotUndefined(this.vipUuid) && this.vipUuid != "") || Utils.notNullnotUndefined(this.vip);
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createPortForwardingVip"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createPortForwardingVip';
                    },
                    hasL3Network: function () {
                        return $scope.l3NetworkListOptions__.dataSource.data().length > 0;
                    },
                    hasVip: function () {
                        return $scope.vipListOptions__.dataSource.data().length > 0;
                    },
                    reset: function () {
                        this.method = CreatePortForwarding.CREATE_NEW_VIP;
                        this.l3NetworkUuid = null;
                        this.vip = null;
                        this.vipUuid = null;
                        this.activeState = false;
                    }
                };
                $scope.vipMethodOptions__ = {
                    dataSource: new kendo.data.DataSource({
                        data: [{
                            name: '{{"portForwarding.ts.Create New VIP" | translate}}',
                            field: CreatePortForwarding.CREATE_NEW_VIP
                        }, {
                            name: '{{"portForwarding.ts.Use Existing VIP" | translate}}',
                            field: CreatePortForwarding.USE_EXISTING_VIP
                        }]
                    }),
                    dataTextField: "name",
                    dataValueField: "field"
                };
                var infoPage = $scope.infoPage = {
                    activeState: true,
                    name: null,
                    description: null,
                    vipPortStart: null,
                    vipPortEnd: null,
                    privatePortEnd: null,
                    privatePortStart: null,
                    protocolType: null,
                    allowedCidr: null,
                    isVipStartPortValid: function () {
                        if (Utils.notNullnotUndefined(this.vipPortStart)) {
                            return Utils.isValidPort(this.vipPortStart);
                        }
                        return true;
                    },
                    isVipEndPortValid: function () {
                        if (Utils.notNullnotUndefined(this.vipPortEnd)) {
                            return Utils.isValidPort(this.vipPortEnd);
                        }
                        return true;
                    },
                    isGuestStartPortValid: function () {
                        if (Utils.notNullnotUndefined(this.privatePortStart)) {
                            return Utils.isValidPort(this.privatePortStart);
                        }
                        return true;
                    },
                    isGuestEndPortValid: function () {
                        if (Utils.notNullnotUndefined(this.privatePortEnd)) {
                            return Utils.isValidPort(this.privatePortEnd);
                        }
                        return true;
                    },
                    isCIDRValid: function () {
                        if (Utils.notNullnotUndefined(this.allowedCidr) && this.allowedCidr != "") {
                            return Utils.isValidCidr(this.allowedCidr);
                        }
                        return true;
                    },
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.vipPortStart) && Utils.notNullnotUndefined(this.vipPortEnd)
                            && Utils.notNullnotUndefined(this.privatePortStart) && Utils.notNullnotUndefined(this.privatePortEnd) && Utils.notNullnotUndefined(this.protocolType)
                            && this.isVipStartPortValid() && this.isVipEndPortValid() && this.isGuestStartPortValid() && this.isGuestEndPortValid() && this.isCIDRValid();
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createPortForwardingInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createPortForwardingInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('pf');
                        this.description = null;
                        this.protocolType = null;
                        this.vipPortStart = null;
                        this.vipPortEnd = null;
                        this.privatePortStart = null;
                        this.privatePortEnd = null;
                        this.allowedCidr = null;
                        this.activeState = false;
                    }
                };
                var attachPage = $scope.attachPage = {
                    activeState: true,
                    vmNic: null,
                    pfRule: null,
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.pfRule);
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
                        return $scope.vmListOptions__.dataSource.data().length > 0;
                    },
                    beforeMoveToNext: function (done) {
                        var _this = this;
                        var vipUuid = null;
                        if (Utils.notNullnotUndefined($scope.vipPage.vip)) {
                            vipUuid = $scope.vipPage.vip.uuid;
                        }
                        else {
                            vipUuid = $scope.vipPage.vipUuid;
                        }
                        var chain = new Utils.Chain();
                        var vmNics = [];
                        var composedVms = [];
                        chain.then(function () {
                            $scope.infoPage.allowedCidr = $scope.infoPage.allowedCidr == "" ? null : $scope.infoPage.allowedCidr;
                            pfMgr.create({
                                vipUuid: vipUuid,
                                name: $scope.infoPage.name,
                                description: $scope.infoPage.description,
                                vipPortStart: $scope.infoPage.vipPortStart,
                                vipPortEnd: $scope.infoPage.vipPortEnd,
                                privatePortStart: $scope.infoPage.privatePortStart,
                                privatePortEnd: $scope.infoPage.privatePortEnd,
                                allowedCidr: $scope.infoPage.allowedCidr == null ? '0.0.0.0/0' : $scope.infoPage.allowedCidr,
                                protocolType: $scope.infoPage.protocolType
                            }, function (ret) {
                                _this.pfRule = ret;
                                chain.next();
                            });
                        }).then(function () {
                            pfMgr.getAttachableVmNicByPortForwardingUuid(_this.pfRule.uuid, function (ret) {
                                vmNics = ret;
                                chain.next();
                            });
                        }).done(function () {
                            if (vmNics.length == 0) {
                                $scope.vmListOptions__.dataSource.data(composedVms);
                                $scope.attachPage.vmNicUuid = null;
                                done();
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
                            vmMgr.query(qobj, function (vms) {
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
                                $scope.vmListOptions__.dataSource.data(composedVms);
                                $scope.attachPage.vmNicUuid = null;
                                done();
                            });
                        }).start();
                    },
                    reset: function () {
                        this.vmNicUuid = null;
                        this.activeState = false;
                        this.pfRule = null;
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
                        if ($scope.vmListOptions__.dataSource.data().length > 0 && Utils.notNullnotUndefinedNotEmptyString($scope.attachPage.vmNicUuid)) {
                            pfMgr.attach($scope.attachPage.pfRule, $scope.attachPage.vmNicUuid, function () {
                                if (Utils.notNullnotUndefined(_this.options.done)) {
                                    _this.options.done($scope.attachPage.pfRule);
                                }
                            });
                        }
                        else {
                            _this.options.done($scope.attachPage.pfRule);
                        }
                        $scope.winCreatePortForwarding__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    vipPage, infoPage, attachPage
                ], mediator);
                $scope.winCreatePortForwardingOptions__ = {
                    width: '700px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.protocolOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [
                        'TCP', 'UDP'
                    ] })
                };
                $scope.vipListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.IP" | translate}}:</span><span>#: ip #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Gateway" | translate}}:</span><span>#: gateway #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Netmask" | translate}}:</span><span>#: netmask #</span></div>'
                };
                $scope.l3NetworkListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Type" | translate}}:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Zone UUID" | translate}}:</span><span>#: zoneUuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.L2 Network UUID" | translate}}:</span><span>#: l2NetworkUuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.vmListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "nicUuid",
                    template: '<div style="color: black"><span class="z-label">{{"portForwarding.ts.VM Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.VM UUID" | translate}}:</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Nic DeviceId" | translate}}:</span><span>#: nicDeviceId #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Nic Ip" | translate}}:</span><span>#: nicIp #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Nic Netmask" | translate}}:</span><span>#: nicNetmask #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Nic Gateway" | translate}}:</span><span>#: nicGateway #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Nic Mac" | translate}}:</span><span>#: nicMac #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.L3 Network UUID" | translate}}:</span><span>#: l3NetworkUuid #</span></div>'
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/portForwarding/createPortForwarding.html';
        }
        CreatePortForwarding.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreatePortForwarding__;
            this.$scope.button.reset();
            var chain = new Utils.Chain();
            this.existingVip = {};
            this.$scope.vipPage.method = CreatePortForwarding.CREATE_NEW_VIP;
            this.$scope.vipPage.isVipCreating = false;
            this.$scope.vipPage.vipUuid = null;
            this.$scope.vipPage.vip = null;
            this.$scope.infoPage.protocolType = 'TCP';
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
                        _this.$scope.vipPage.vipUuid = null;
                    }
                    chain.next();
                });
            }).then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [{
                    name: 'state',
                    op: '=',
                    value: 'Enabled'
                }, {
                    name: 'useFor',
                    op: '=',
                    value: 'PortForwarding'
                }];
                _this.vipMgr.query(qobj, function (ret) {
                    if (ret.length > 0) {
                        angular.forEach(ret, function (it) {
                            _this.$scope.vipListOptions__.dataSource.add(it);
                            _this.existingVip[it.uuid] = it;
                        });
                        _this.$scope.vipPage.vipUuid = null;
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
        return CreatePortForwarding;
    }());
    CreatePortForwarding.USE_EXISTING_VIP = "existing";
    CreatePortForwarding.CREATE_NEW_VIP = "new";
    MPortForwarding.CreatePortForwarding = CreatePortForwarding;
    var AttachPortForwarding = (function () {
        function AttachPortForwarding(pfMgr, vmMgr) {
            var _this = this;
            this.pfMgr = pfMgr;
            this.vmMgr = vmMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/portForwarding/attachPortForwarding.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zPortForwardingAttachVm] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.vmListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "nicUuid",
                    template: '<div style="color: black"><span class="z-label">{{"portForwarding.ts.VM Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.VM UUID" | translate}}:</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Nic DeviceId" | translate}}:</span><span>#: nicDeviceId #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Nic Ip" | translate}}:</span><span>#: nicIp #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Nic Netmask" | translate}}:</span><span>#: nicNetmask #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Nic Gateway" | translate}}:</span><span>#: nicGateway #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.Nic Mac" | translate}}:</span><span>#: nicMac #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"portForwarding.ts.L3 Network UUID" | translate}}:</span><span>#: l3NetworkUuid #</span></div>'
                };
                $scope.hasVm = function () {
                    return $scope.vmListOptions__.dataSource.data().length > 0;
                };
                $scope.canProceed = function () {
                    return Utils.notNullnotUndefined($scope.vmNicUuid);
                };
                $scope.cancel = function () {
                    $scope.attachPortForwarding__.close();
                };
                $scope.done = function () {
                    pfMgr.attach(_this.options.pf, $scope.vmNicUuid, function () {
                        if (Utils.notNullnotUndefined(_this.options.done)) {
                            _this.options.done();
                        }
                    });
                    $scope.attachPortForwarding__.close();
                };
                _this.$scope = $scope;
                $scope.attachPortForwardingOptions__ = {
                    width: '550px'
                };
            };
        }
        AttachPortForwarding.prototype.open = function () {
            var _this = this;
            this.$scope.vmListOptions__.dataSource.data([]);
            var chain = new Utils.Chain();
            var vmNics = [];
            var composedVms = [];
            chain.then(function () {
                _this.pfMgr.getAttachableVmNicByPortForwardingUuid(_this.options.pf.uuid, function (nics) {
                    vmNics = typeof (nics) == 'undefined' ? [] : nics;
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
                _this.$scope.attachPortForwarding__.center();
                _this.$scope.attachPortForwarding__.open();
            }).start();
        };
        return AttachPortForwarding;
    }());
    MPortForwarding.AttachPortForwarding = AttachPortForwarding;
    var DetachPortForwarding = (function () {
        function DetachPortForwarding(pfMgr, vmMgr) {
            var _this = this;
            this.pfMgr = pfMgr;
            this.vmMgr = vmMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/portForwarding/detachPortForwarding.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zPortForwardingDetachVm] = _this;
                _this.options = parent[$attrs.zOptions];
                $scope.cancel = function () {
                    $scope.detachPortForwarding__.close();
                };
                $scope.done = function () {
                    pfMgr.detach(_this.options.pf, function () {
                        if (_this.options.done) {
                            _this.options.done();
                        }
                    });
                    $scope.detachPortForwarding__.close();
                };
                $scope.optionsDetachPortForwarding__ = {
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
        DetachPortForwarding.prototype.open = function () {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            this.$scope.pf = this.options.pf;
            qobj.conditions = [
                {
                    name: 'vmNics.uuid',
                    op: '=',
                    value: this.options.pf.vmNicUuid
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
                _this.$scope.detachPortForwarding__.center();
                _this.$scope.detachPortForwarding__.open();
            });
        };
        return DetachPortForwarding;
    }());
    MPortForwarding.DetachPortForwarding = DetachPortForwarding;
})(MPortForwarding || (MPortForwarding = {}));
angular.module('root').factory('PortForwardingManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MPortForwarding.PortForwardingManager(api, $rootScope);
}]).directive('zCreatePortForwardingRule', ['Api', 'PortForwardingManager', 'VipManager', 'L3NetworkManager', 'VmInstanceManager', function (api, pfMgr, vipMgr, l3Mgr, vmMgr) {
    return new MPortForwarding.CreatePortForwarding(api, pfMgr, vipMgr, l3Mgr, vmMgr);
}]).directive('zPortForwardingAttachVm', ['PortForwardingManager', 'VmInstanceManager', function (pfMgr, vmMgr) {
    return new MPortForwarding.AttachPortForwarding(pfMgr, vmMgr);
}]).directive('zPortForwardingDetachVm', ['PortForwardingManager', 'VmInstanceManager', function (pfMgr, vmMgr) {
    return new MPortForwarding.DetachPortForwarding(pfMgr, vmMgr);
}]).config(['$routeProvider', function (route) {
    route.when('/portForwarding', {
        templateUrl: '/static/templates/portForwarding/portForwarding.html',
        controller: 'MPortForwarding.Controller'
    }).when('/portForwarding/:uuid', {
        templateUrl: '/static/templates/portForwarding/details.html',
        controller: 'MPortForwarding.DetailsController',
        resolve: {
            current: function ($q, $route, PortForwardingManager, VmInstanceManager, VipManager) {
                var defer = $q.defer();
                var uuid = $route.current.params.uuid;
                var ret = {
                    pf: null,
                    nic: null,
                    vip: null
                };
                var chain = new Utils.Chain();
                chain.then(function () {
                    var qobj = new ApiHeader.QueryObject();
                    qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                    PortForwardingManager.query(qobj, function (pfs) {
                        ret.pf = pfs[0];
                        chain.next();
                    });
                }).then(function () {
                    if (!Utils.notNullnotUndefined(ret.pf.vmNicUuid)) {
                        chain.next();
                        return;
                    }
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = [{
                        name: 'uuid',
                        op: '=',
                        value: ret.pf.vmNicUuid
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
                        value: ret.pf.vipUuid
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