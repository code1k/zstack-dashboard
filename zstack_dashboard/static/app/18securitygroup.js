var MSecurityGroup;
(function (MSecurityGroup) {
    var SecurityGroup = (function (_super) {
        __extends(SecurityGroup, _super);
        function SecurityGroup() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SecurityGroup.prototype.progressOn = function () {
            this.inProgress = true;
        };
        SecurityGroup.prototype.progressOff = function () {
            this.inProgress = false;
        };
        SecurityGroup.prototype.isInProgress = function () {
            return this.inProgress;
        };
        SecurityGroup.prototype.isEnableShow = function () {
            return this.state == 'Disabled';
        };
        SecurityGroup.prototype.isDisableShow = function () {
            return this.state == 'Enabled';
        };
        SecurityGroup.prototype.stateLabel = function () {
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
        SecurityGroup.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('state', inv.state);
            self.set('rules', inv.rules);
            self.set('attachedL3NetworkUuids', inv.attachedL3NetworkUuids);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        return SecurityGroup;
    }(ApiHeader.SecurityGroupInventory));
    MSecurityGroup.SecurityGroup = SecurityGroup;
    var SecurityGroupManager = (function () {
        function SecurityGroupManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        SecurityGroupManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        SecurityGroupManager.prototype.wrap = function (sg) {
            return new kendo.data.ObservableObject(sg);
        };
        SecurityGroupManager.prototype.disable = function (sg) {
            var _this = this;
            sg.progressOn();
            var msg = new ApiHeader.APIChangeSecurityGroupStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = sg.uuid;
            this.api.asyncApi(msg, function (ret) {
                sg.updateObservableObject(ret.inventory);
                sg.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled Security Group: {0}', sg.name),
                    link: Utils.sprintf('/#/securityGroup/{0}', sg.uuid)
                });
            });
        };
        SecurityGroupManager.prototype.enable = function (sg) {
            var _this = this;
            sg.progressOn();
            var msg = new ApiHeader.APIChangeSecurityGroupStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = sg.uuid;
            this.api.asyncApi(msg, function (ret) {
                sg.updateObservableObject(ret.inventory);
                sg.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled Security Group: {0}', sg.name),
                    link: Utils.sprintf('/#/securityGroup/{0}', sg.uuid)
                });
            });
        };
        SecurityGroupManager.prototype.attachL3Network = function (sg, l3Uuid, done) {
            var _this = this;
            sg.progressOn();
            var msg = new ApiHeader.APIAttachSecurityGroupToL3NetworkMsg();
            msg.l3NetworkUuid = l3Uuid;
            msg.securityGroupUuid = sg.uuid;
            this.api.asyncApi(msg, function (ret) {
                sg.updateObservableObject(ret.inventory);
                sg.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Attached l3Network to Security Group: {0}', sg.name),
                    link: Utils.sprintf('/#/securityGroup/{0}', sg.uuid)
                });
            });
        };
        SecurityGroupManager.prototype.detachL3Network = function (sg, l3Uuid, done) {
            var _this = this;
            sg.progressOn();
            var msg = new ApiHeader.APIDetachSecurityGroupFromL3NetworkMsg();
            msg.l3NetworkUuid = l3Uuid;
            msg.securityGroupUuid = sg.uuid;
            this.api.asyncApi(msg, function (ret) {
                sg.updateObservableObject(ret.inventory);
                sg.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Detached l3Network from Security Group: {0}', sg.name),
                    link: Utils.sprintf('/#/securityGroup/{0}', sg.uuid)
                });
            });
        };
        SecurityGroupManager.prototype.addRule = function (sg, rules, done) {
            var _this = this;
            sg.progressOn();
            var msg = new ApiHeader.APIAddSecurityGroupRuleMsg();
            msg.rules = rules;
            msg.securityGroupUuid = sg.uuid;
            this.api.asyncApi(msg, function (ret) {
                sg.updateObservableObject(ret.inventory);
                sg.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Added rule Security Group: {0}', sg.name),
                    link: Utils.sprintf('/#/securityGroup/{0}', sg.uuid)
                });
            });
        };
        SecurityGroupManager.prototype.deleteRule = function (sg, ruleUuids, done) {
            var _this = this;
            sg.progressOn();
            var msg = new ApiHeader.APIDeleteSecurityGroupRuleMsg();
            msg.ruleUuids = ruleUuids;
            this.api.asyncApi(msg, function (ret) {
                sg.updateObservableObject(ret.inventory);
                sg.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted rule from Security Group: {0}', sg.name),
                    link: Utils.sprintf('/#/securityGroup/{0}', sg.uuid)
                });
            });
        };
        SecurityGroupManager.prototype.create = function (sg, done) {
            var _this = this;
            var msg = null;
            msg = new ApiHeader.APICreateSecurityGroupMsg();
            msg.name = sg.name;
            msg.description = sg.description;
            this.api.asyncApi(msg, function (ret) {
                var c = new SecurityGroup();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Created new Security Group: {0}', c.name),
                    link: Utils.sprintf('/#/securityGroup/{0}', c.uuid)
                });
            });
        };
        SecurityGroupManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQuerySecurityGroupMsg();
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
                    var c = new SecurityGroup();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        SecurityGroupManager.prototype["delete"] = function (sg, done) {
            var _this = this;
            sg.progressOn();
            var msg = new ApiHeader.APIDeleteSecurityGroupMsg();
            msg.uuid = sg.uuid;
            this.api.asyncApi(msg, function (ret) {
                sg.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted Security Group: {0}', sg.name)
                });
            });
        };
        SecurityGroupManager.prototype.getCandidateVmNic = function (sg, done) {
            var msg = new ApiHeader.APIGetCandidateVmNicForSecurityGroupMsg();
            msg.securityGroupUuid = sg.uuid;
            this.api.syncApi(msg, function (ret) {
                done(ret.inventories);
            });
        };
        SecurityGroupManager.prototype.addVmNic = function (sg, nicUuids, done) {
            var _this = this;
            sg.progressOn();
            var msg = new ApiHeader.APIAddVmNicToSecurityGroupMsg();
            msg.securityGroupUuid = sg.uuid;
            msg.vmNicUuids = nicUuids;
            this.api.asyncApi(msg, function (ret) {
                sg.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Added vm nics to security group: {0}', sg.name)
                });
            });
        };
        SecurityGroupManager.prototype.removeVmNic = function (sg, nicUuids, done) {
            var _this = this;
            sg.progressOn();
            var msg = new ApiHeader.APIDeleteVmNicFromSecurityGroupMsg();
            msg.securityGroupUuid = sg.uuid;
            msg.vmNicUuids = nicUuids;
            this.api.asyncApi(msg, function (ret) {
                sg.progressOff();
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Removed vm nics from security group: {0}', sg.name)
                });
            });
        };
        return SecurityGroupManager;
    }());
    SecurityGroupManager.$inject = ['Api', '$rootScope'];
    MSecurityGroup.SecurityGroupManager = SecurityGroupManager;
    var SecurityGroupModel = (function (_super) {
        __extends(SecurityGroupModel, _super);
        function SecurityGroupModel() {
            var _this = _super.call(this) || this;
            _this.current = new SecurityGroup();
            return _this;
        }
        return SecurityGroupModel;
    }(Utils.Model));
    MSecurityGroup.SecurityGroupModel = SecurityGroupModel;
    var OSecurityGroupGrid = (function (_super) {
        __extends(OSecurityGroupGrid, _super);
        function OSecurityGroupGrid($scope, sgMgr) {
            var _this = _super.call(this) || this;
            _this.sgMgr = sgMgr;
            _super.prototype.init.call(_this, $scope, $scope.securityGroupGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"securityGroup.ts.NAME" | translate}}',
                    width: '25%',
                    template: '<a href="/\\#/securityGroup/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'description',
                    title: '{{"securityGroup.ts.DESCRIPTION" | translate}}',
                    width: '25%'
                },
                {
                    field: 'state',
                    title: '{{"securityGroup.ts.STATE" | translate}}',
                    width: '25%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'uuid',
                    title: '{{"securityGroup.ts.UUID" | translate}}',
                    width: '25%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                sgMgr.query(qobj, function (sgs, total) {
                    options.success({
                        data: sgs,
                        total: total
                    });
                });
            };
            return _this;
        }
        return OSecurityGroupGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, sgMgr) {
            this.$scope = $scope;
            this.sgMgr = sgMgr;
        }
        Action.prototype.enable = function () {
            this.sgMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.sgMgr.disable(this.$scope.model.current);
        };
        Action.prototype.addRule = function () {
            this.$scope.addRule.open();
        };
        Action.prototype.deleteRule = function () {
            this.$scope.deleteRule.open();
        };
        Action.prototype.attachL3Network = function () {
            this.$scope.attachL3Network.open();
        };
        Action.prototype.detachL3Network = function () {
            this.$scope.detachL3Network.open();
        };
        Action.prototype.addNic = function () {
            this.$scope.addVmNic.open();
        };
        Action.prototype.removeNic = function () {
            this.$scope.removeVmNic.open();
        };
        Action.prototype.isDeleteRuleShow = function () {
            if (Utils.notNullnotUndefined(this.$scope.model.current.rules)) {
                return this.$scope.model.current.rules.length > 0;
            }
            return false;
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
                            name: '{{"securityGroup.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"securityGroup.ts.STATE" | translate}}',
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
            this.$scope.oSecurityGroupGrid.setFilter(this.toKendoFilter());
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
        function DetailsController($scope, sgMgr, $routeParams, tagService, current, l3Mgr, api) {
            var _this = this;
            this.$scope = $scope;
            this.sgMgr = sgMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            this.l3Mgr = l3Mgr;
            this.api = api;
            $scope.model = new SecurityGroupModel();
            $scope.model.current = current;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, sgMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteSecurityGroup = {
                title: 'DELETE SECURITY GROUP',
                html: '<strong><p>Deleting security group will cause:</p></strong>' +
                '<ul><li><strong>All rules in this security group will be deleted</strong></li>' +
                '<li><strong>All l3Networks this security group has attached will be detached</strong></li>' +
                '<strong><p>those results are not recoverable</p></strong>',
                confirm: function () {
                    sgMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeSecurityGroupVO, function (ret) {
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
            $scope.optionsRuleGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: ' ',
                        title: '{{"securityGroup.ts.TYPE" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'startPort',
                        title: '{{"securityGroup.ts.PORT START" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'endPort',
                        title: '{{"securityGroup.ts.PORT END" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'protocol',
                        title: '{{"securityGroup.ts.PROTOCOL" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'allowedCidr',
                        title: '{{"securityGroup.ts.ALLOWED CIDR" | translate}}',
                        width: '20%'
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
            $scope.optionsRuleGrid.dataSource.data(current.rules);
            $scope.optionsL3NetworkGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'name',
                        title: '{{"securityGroup.ts.NAME" | translate}}',
                        width: '20%',
                        template: '<a href="/\\#/l3Network/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                    },
                    {
                        field: 'description',
                        title: '{{"securityGroup.ts.DESCRIPTION" | translate}}',
                        width: '25%'
                    },
                    {
                        field: 'state',
                        title: '{{"securityGroup.ts.STATE" | translate}}',
                        width: '10%',
                        template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                    },
                    {
                        field: 'type',
                        title: '{{"securityGroup.ts.TYPE" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'uuid',
                        title: '{{"securityGroup.ts.UUID" | translate}}',
                        width: '25%'
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
            if (current.attachedL3NetworkUuids.length > 0) {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'uuid',
                        op: 'in',
                        value: current.attachedL3NetworkUuids.join()
                    }
                ];
                l3Mgr.query(qobj, function (l3s) {
                    $scope.optionsL3NetworkGrid.dataSource.data(l3s);
                });
            }
            $scope.optionsRulesGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'type',
                        title: '{{"securityGroup.ts.TYPE" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'startPort',
                        title: '{{"securityGroup.ts.PORT START" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'endPort',
                        title: '{{"securityGroup.ts.PORT END" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'protocol',
                        title: '{{"securityGroup.ts.PROTOCOL" | translate}}',
                        width: '20%'
                    },
                    {
                        field: 'allowedCidr',
                        title: '{{"securityGroup.ts.ALLOWED CIDR" | translate}}',
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
                    data: current.rules
                })
            };
            $scope.optionsVmNicGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'ip',
                        title: '{{"securityGroup.ts.IP" | translate}}',
                        width: '25%'
                    },
                    {
                        field: 'deviceId',
                        title: '{{"securityGroup.ts.DEVICE ID" | translate}}',
                        width: '25%'
                    },
                    {
                        field: 'uuid',
                        title: '{{"securityGroup.ts.UUID" | translate}}',
                        width: '25%',
                        template: '{{dataItem.uuid}}'
                    },
                    {
                        field: 'vmInstanceUuid',
                        title: '{{"securityGroup.ts.VM" | translate}}',
                        width: '25%',
                        template: '<a href="/\\#/vmInstance/{{dataItem.vmInstanceUuid}}">{{dataItem.vmInstanceUuid}}</a>'
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
                            var msg = new ApiHeader.APIQueryVmNicMsg();
                            msg.conditions = [{
                                name: "securityGroup.uuid",
                                op: '=',
                                value: current.uuid
                            }];
                            msg.replyWithCount = true;
                            _this.api.syncApi(msg, function (reply) {
                                options.success({
                                    data: reply.inventories,
                                    total: reply.total
                                });
                            });
                        }
                    }
                })
            };
            $scope.optionsAttachL3Network = {
                sg: current,
                done: function (l3) {
                    $scope.optionsL3NetworkGrid.dataSource.insert(0, l3);
                }
            };
            $scope.optionsAddRule = {
                sg: current,
                done: function (rules) {
                    angular.forEach(rules, function (it) {
                        $scope.optionsRulesGrid.dataSource.insert(0, it);
                    });
                }
            };
            $scope.optionsDeleteRule = {
                sg: current,
                done: function (rules) {
                    var ds = $scope.optionsRulesGrid.dataSource;
                    var cs = ds.data();
                    angular.forEach(rules, function (it) {
                        for (var i = 0; i < cs.length; i++) {
                            var tcs = cs[i];
                            if (it.uuid == tcs.uuid) {
                                var row = ds.getByUid(tcs.uid);
                                ds.remove(row);
                                break;
                            }
                        }
                    });
                }
            };
            $scope.optionsDetachL3Network = {
                sg: current,
                done: function (l3) {
                    var ds = $scope.optionsL3NetworkGrid.dataSource;
                    var cs = ds.data();
                    for (var i = 0; i < cs.length; i++) {
                        var tcs = cs[i];
                        if (l3.uuid == tcs.uuid) {
                            var row = ds.getByUid(tcs.uid);
                            ds.remove(row);
                            break;
                        }
                    }
                }
            };
            $scope.optionsAddVmNic = {
                sg: current,
                done: function () {
                    $scope.optionsVmNicGrid.dataSource.read();
                }
            };
            $scope.optionsRemoveVmNic = {
                sg: current,
                done: function () {
                    $scope.optionsVmNicGrid.dataSource.read();
                }
            };
        }
        DetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.sgMgr.query(qobj, function (sgs, total) {
                _this.$scope.model.current = sgs[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'SecurityGroupManager', '$routeParams', 'Tag', 'current', 'L3NetworkManager', 'Api'];
    MSecurityGroup.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, sgMgr, $location) {
            this.$scope = $scope;
            this.sgMgr = sgMgr;
            this.$location = $location;
            $scope.model = new SecurityGroupModel();
            $scope.oSecurityGroupGrid = new OSecurityGroupGrid($scope, sgMgr);
            $scope.action = new Action($scope, sgMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"securityGroup.ts.NAME" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"securityGroup.ts.DESCRIPTION" | translate}}',
                        value: 'description'
                    },
                    {
                        name: '{{"securityGroup.ts.STATE" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"securityGroup.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"securityGroup.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    sgMgr.setSortBy(ret);
                    $scope.oSecurityGroupGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.SecurityGroupInventoryQueryable,
                name: 'SecurityGroup',
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
                    sgMgr.query(qobj, function (sgs, total) {
                        $scope.oSecurityGroupGrid.refresh(sgs);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/securityGroup/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateSecurityGroup = function (win) {
                win.open();
            };
            $scope.funcDeleteSecurityGroup = function () {
                $scope.deleteSecurityGroup.open();
            };
            $scope.optionsDeleteSecurityGroup = {
                title: 'DELETE L3 NETWORK',
                html: '<strong><p>Deleting security group will cause:</p></strong>' +
                '<ul><li><strong>All rules in this security group will be deleted</strong></li>' +
                '<li><strong>All l3Networks this security group has attached will be detached</strong></li>' +
                '<strong><p>those results are not recoverable</p></strong>',
                confirm: function () {
                    sgMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oSecurityGroupGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oSecurityGroupGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateSecurityGroup = {
                done: function (sg) {
                    $scope.oSecurityGroupGrid.add(sg);
                }
            };
            $scope.optionsAddRule = {
                sg: null
            };
            $scope.optionsDeleteRule = {
                sg: null
            };
            $scope.optionsAttachL3Network = {
                sg: null
            };
            $scope.optionsDetachL3Network = {
                sg: null
            };
            $scope.optionsAddVmNic = {
                sg: null
            };
            $scope.optionsRemoveVmNic = {
                sg: null
            };
            $scope.$watch(function () {
                return $scope.model.current;
            }, function () {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    $scope.optionsAddRule.sg = $scope.model.current;
                    $scope.optionsDeleteRule.sg = $scope.model.current;
                    $scope.optionsAttachL3Network.sg = $scope.model.current;
                    $scope.optionsDetachL3Network.sg = $scope.model.current;
                    $scope.optionsAddVmNic.sg = $scope.model.current;
                    $scope.optionsRemoveVmNic.sg = $scope.model.current;
                }
            });
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'SecurityGroupManager', '$location'];
    MSecurityGroup.Controller = Controller;
    var AddRule = (function () {
        function AddRule(sgMgr) {
            var _this = this;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zSecurityGroupAddRule;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = {};
                var optionName = $attrs.zOptions;
                _this.options = parentScope[optionName];
                $scope.optionsAddRuleGrid__ = {
                    pageSize: 20,
                    resizable: true,
                    scrollable: true,
                    pageable: true,
                    columns: [
                        {
                            field: 'startPort',
                            title: '{{"securityGroup.ts.START" | translate}}',
                            width: '13%'
                        },
                        {
                            field: 'endPort',
                            title: '{{"securityGroup.ts.END" | translate}}',
                            width: '13%'
                        },
                        {
                            field: 'type',
                            title: '{{"securityGroup.ts.TYPE" | translate}}',
                            width: '16%'
                        },
                        {
                            field: 'protocol',
                            title: '{{"securityGroup.ts.PROTOCOL" | translate}}',
                            width: '16%'
                        },
                        {
                            field: 'allowedCidr',
                            title: '{{"securityGroup.ts.ALLOWED CIDR" | translate}}',
                            width: '22%'
                        },
                        {
                            width: '10%',
                            title: '',
                            template: '<button type="button" class="btn btn-xs btn-default" ng-show="dataItem.deleteable == true" ng-click="del(dataItem.uid)"><i class="fa fa-times"></i></button>'
                        }
                    ],
                    dataBound: function (e) {
                        var grid = e.sender;
                        if (grid.dataSource.totalPages() == 1) {
                            grid.pager.element.hide();
                        }
                    },
                    dataSource: new kendo.data.DataSource({
                        data: []
                    })
                };
                $scope.$watch(function () {
                    return _this.options.sg;
                }, function () {
                    if (Utils.notNullnotUndefined(_this.options.sg)) {
                        var rules = [];
                        angular.extend(rules, _this.options.sg.rules);
                        $scope.optionsAddRuleGrid__.dataSource.data(rules);
                    }
                });
                $scope.optionsAddRule__ = {
                    width: 500
                };
                $scope.ruleTypeOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [
                        'Ingress', 'Egress'
                    ] })
                };
                $scope.type = 'Ingress';
                $scope.ruleProtocolOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [
                        'TCP', 'UDP', 'ICMP'
                    ] })
                };
                $scope.protocol = 'TCP';
                function getNewRules() {
                    var allRules = $scope.optionsAddRuleGrid__.dataSource.data();
                    var newRules = [];
                    angular.forEach(allRules, function (it) {
                        if (Utils.notNullnotUndefined(it.deleteable)) {
                            newRules.push(it);
                        }
                    });
                    return newRules;
                }
                $scope.canProceed = function () {
                    return getNewRules().length > 0;
                };
                $scope.cancel = function () {
                    $scope.addRule__.close();
                };
                $scope.done = function () {
                    var nrules = getNewRules();
                    angular.forEach(nrules, function (it) {
                        delete it['deleteable'];
                    });
                    sgMgr.addRule(_this.options.sg, nrules, function () {
                        if (Utils.notNullnotUndefined(_this.options.done)) {
                            _this.options.done(nrules);
                        }
                    });
                    $scope.addRule__.close();
                };
                $scope.isDuplicateRule = function () {
                    var rs = $scope.optionsAddRuleGrid__.dataSource.data();
                    for (var i = 0; i < rs.length; i++) {
                        var r = rs[i];
                        if ($scope.startPort == r.startPort && $scope.endPort == r.endPort && $scope.protocol == r.protocol
                            && $scope.type == r.type) {
                            if (r.allowedCidr == $scope.allowedCidr) {
                                return true;
                            }
                        }
                    }
                    return false;
                };
                $scope.canAdd = function () {
                    if (Utils.notNullnotUndefined($scope.startPort) && Utils.notNullnotUndefined($scope.endPort)
                        && Utils.notNullnotUndefined($scope.type) && Utils.notNullnotUndefined($scope.protocol)
                        && $scope.isStartPortValid()
                        && $scope.isEndPortValid()
                        && $scope.isCIDRValid()) {
                        return !$scope.isDuplicateRule();
                    }
                    else {
                        return false;
                    }
                };
                $scope.add = function () {
                    $scope.allowedCidr = $scope.allowedCidr == "" ? null : $scope.allowedCidr;
                    var rule = {
                        securityGroupUuid: $scope.securityGroupUuid,
                        startPort: $scope.startPort,
                        endPort: $scope.endPort,
                        allowedCidr: !Utils.notNullnotUndefined($scope.allowedCidr) ? '0.0.0.0/0' : $scope.allowedCidr,
                        type: $scope.type,
                        protocol: $scope.protocol,
                        deleteable: true
                    };
                    $scope.optionsAddRuleGrid__.dataSource.insert(0, rule);
                    $scope.startPort = null;
                    $scope.endPort = null;
                    $scope.allowedCidr = null;
                };
                $scope.isGridShow = function () {
                    return _this.$scope.optionsAddRuleGrid__.dataSource.data().length > 0;
                };
                _this.$scope = $scope;
                $scope.del = function (uid) {
                    var row = $scope.optionsAddRuleGrid__.dataSource.getByUid(uid);
                    $scope.optionsAddRuleGrid__.dataSource.remove(row);
                };
                $scope.isStartPortValid = function () {
                    if (Utils.notNullnotUndefined($scope.startPort)) {
                        if ($scope.protocol == 'UDP' || $scope.protocol == 'TCP') {
                            return Utils.isValidPort($scope.startPort);
                        }
                    }
                    return true;
                };
                $scope.isEndPortValid = function () {
                    if (Utils.notNullnotUndefined($scope.endPort)) {
                        if ($scope.protocol == 'UDP' || $scope.protocol == 'TCP') {
                            return Utils.isValidPort($scope.endPort);
                        }
                    }
                    return true;
                };
                $scope.isCIDRValid = function () {
                    if (Utils.notNullnotUndefined($scope.allowedCidr) && $scope.allowedCidr != "") {
                        return Utils.isValidCidr($scope.allowedCidr);
                    }
                    return true;
                };
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/securityGroup/addRule.html';
        }
        AddRule.prototype.open = function () {
            this.$scope.startPort = null;
            this.$scope.endPort = null;
            this.$scope.allowedCidr = null;
            this.$scope.addRule__.center();
            this.$scope.addRule__.open();
        };
        return AddRule;
    }());
    MSecurityGroup.AddRule = AddRule;
    var CreateSecurityGroup = (function () {
        function CreateSecurityGroup(api, sgMgr, l3Mgr) {
            var _this = this;
            this.api = api;
            this.sgMgr = sgMgr;
            this.l3Mgr = l3Mgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateSecurityGroup;
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
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name);
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createSecurityGroupInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createSecurityGroupInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('sg');
                        this.description = null;
                        this.activeState = false;
                    }
                };
                var rulePage = $scope.rulePage = {
                    activeState: false,
                    startPort: null,
                    endPort: null,
                    type: null,
                    allowedCidr: null,
                    protocol: null,
                    isStartPortValid: function () {
                        if (Utils.notNullnotUndefined(this.startPort)) {
                            if (this.protocol == 'UDP' || this.protocol == 'TCP') {
                                return Utils.isValidPort(this.startPort);
                            }
                        }
                        return true;
                    },
                    isEndPortValid: function () {
                        if (Utils.notNullnotUndefined(this.endPort)) {
                            if (this.protocol == 'UDP' || this.protocol == 'TCP') {
                                return Utils.isValidPort(this.endPort);
                            }
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
                        return true;
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createSecurityGroupRule"]');
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
                        return 'createSecurityGroupRule';
                    },
                    reset: function () {
                        this.activeState = false;
                    },
                    add: function () {
                        this.allowedCidr = this.allowedCidr == "" ? null : this.allowedCidr;
                        $scope.optionsRuleGrid__.dataSource.insert(0, {
                            startPort: this.startPort,
                            endPort: this.endPort,
                            type: this.type,
                            protocol: this.protocol,
                            allowedCidr: this.allowedCidr == null ? '0.0.0.0/0' : this.allowedCidr
                        });
                        this.startPort = null;
                        this.endPort = null;
                        this.allowedCidr = null;
                    },
                    canAdd: function () {
                        return Utils.notNullnotUndefined(this.startPort)
                            && Utils.notNullnotUndefined(this.endPort)
                            && Utils.notNullnotUndefined(this.type)
                            && Utils.notNullnotUndefined(this.protocol)
                            && this.isStartPortValid()
                            && this.isEndPortValid()
                            && this.isCIDRValid();
                    },
                    isGridShow: function () {
                        return $scope.optionsRuleGrid__.dataSource.data().length > 0;
                    },
                    del: function (uid) {
                        var row = $scope.optionsRuleGrid__.dataSource.getByUid(uid);
                        $scope.optionsRuleGrid__.dataSource.remove(row);
                    }
                };
                var l3Page = $scope.l3Page = {
                    activeState: false,
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return true;
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createSecurityGroupRuleL3Network"]');
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
                        return 'createSecurityGroupRuleL3Network';
                    },
                    reset: function () {
                        this.activeState = false;
                    },
                    canAdd: function () {
                        return Utils.notNullnotUndefined(this.dns);
                    },
                    hasL3Network: function () {
                        return $scope.l3NetworkListOptions__.dataSource.data().length > 0;
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
                        var resultSg;
                        var chain = new Utils.Chain();
                        chain.then(function () {
                            sgMgr.create(infoPage, function (ret) {
                                resultSg = ret;
                                chain.next();
                            });
                        }).then(function () {
                            var rules = $scope.optionsRuleGrid__.dataSource.data();
                            if (rules.length == 0) {
                                chain.next();
                                return;
                            }
                            sgMgr.addRule(resultSg, rules, function () {
                                chain.next();
                            });
                        }).then(function () {
                            var l3s = $scope.l3NetworkList__.dataItems();
                            if (l3s.length == 0) {
                                chain.next();
                                return;
                            }
                            var attach = function () {
                                var l3 = l3s.shift();
                                if (!Utils.notNullnotUndefined(l3)) {
                                    chain.next();
                                    return;
                                }
                                _this.sgMgr.attachL3Network(resultSg, l3.uuid, function () {
                                    attach();
                                });
                            };
                            attach();
                        }).done(function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(resultSg);
                            }
                        }).start();
                        $scope.winCreateSecurityGroup__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage, rulePage, l3Page
                ], mediator);
                $scope.l3NetworkListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">{{"securityGroup.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"securityGroup.ts.TYPE" | translate}}:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"securityGroup.ts.Zone UUID" | translate}}:</span><span>#: zoneUuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"securityGroup.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.ruleTypeOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [
                        'Ingress', 'Egress'
                    ] })
                };
                $scope.rulePage.type = 'Ingress';
                $scope.ruleProtocolOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [
                        'TCP', 'UDP', 'ICMP'
                    ] })
                };
                $scope.rulePage.protocol = 'TCP';
                $scope.optionsRuleGrid__ = {
                    pageSize: 20,
                    resizable: true,
                    scrollable: true,
                    pageable: true,
                    columns: [
                        {
                            field: 'startPort',
                            title: '{{"securityGroup.ts.START" | translate}}',
                            width: '16%'
                        },
                        {
                            field: 'endPort',
                            title: '{{"securityGroup.ts.END" | translate}}',
                            width: '16%'
                        },
                        {
                            field: 'type',
                            title: '{{"securityGroup.ts.TYPE" | translate}}',
                            width: '16%'
                        },
                        {
                            field: 'protocol',
                            title: '{{"securityGroup.ts.PROTOCOL" | translate}}',
                            width: '16%'
                        },
                        {
                            field: 'allowedCidr',
                            title: '{{"securityGroup.ts.ALLOWED CIDR" | translate}}',
                            width: '16%'
                        },
                        {
                            width: '10%',
                            title: '',
                            template: '<button type="button" class="btn btn-xs btn-default" ng-click="rulePage.del(dataItem.uid)"><i class="fa fa-times"></i></button>'
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
                $scope.winCreateSecurityGroupOptions__ = {
                    width: '800px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/securityGroup/createSecurityGroup.html';
        }
        CreateSecurityGroup.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateSecurityGroup__;
            this.$scope.button.reset();
            this.$scope.l3NetworkListOptions__.dataSource.data([]);
            this.$scope.optionsRuleGrid__.dataSource.data([]);
            var qobj = new ApiHeader.QueryObject();
            qobj.conditions = [];
            this.l3Mgr.query(qobj, function (l3s) {
                _this.$scope.l3NetworkListOptions__.dataSource.data(l3s);
                win.center();
                win.open();
            });
        };
        return CreateSecurityGroup;
    }());
    MSecurityGroup.CreateSecurityGroup = CreateSecurityGroup;
    var DeleteRule = (function () {
        function DeleteRule(sgMgr) {
            var _this = this;
            this.sgMgr = sgMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/securityGroup/deleteRule.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zSecurityGroupDeleteRule] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.uuid = null;
                $scope.ruleOptions__ = {
                    pageSize: 20,
                    resizable: true,
                    scrollable: true,
                    pageable: true,
                    columns: [
                        {
                            width: '10%',
                            title: '',
                            template: '<input type="checkbox" ng-model="dataItem.toDelete">'
                        },
                        {
                            field: 'startPort',
                            title: '{{"securityGroup.ts.START" | translate}}',
                            width: '16%'
                        },
                        {
                            field: 'endPort',
                            title: '{{"securityGroup.ts.END" | translate}}',
                            width: '16%'
                        },
                        {
                            field: 'type',
                            title: '{{"securityGroup.ts.TYPE" | translate}}',
                            width: '16%'
                        },
                        {
                            field: 'protocol',
                            title: '{{"securityGroup.ts.PROTOCOL" | translate}}',
                            width: '16%'
                        },
                        {
                            field: 'allowedCidr',
                            title: '{{"securityGroup.ts.ALLOWED CIDR" | translate}}',
                            width: '16%'
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
                function getSelectedItems() {
                    var rules = $scope.ruleOptions__.dataSource.data();
                    var ruleToDelete = [];
                    angular.forEach(rules, function (it) {
                        if (it.toDelete == true) {
                            ruleToDelete.push(it);
                        }
                    });
                    return ruleToDelete;
                }
                $scope.canProceed = function () {
                    return getSelectedItems().length > 0;
                };
                $scope.cancel = function () {
                    $scope.deleteRule__.close();
                };
                $scope.done = function () {
                    var ruleUuids = [];
                    var rules = getSelectedItems();
                    angular.forEach(rules, function (rule) {
                        ruleUuids.push(rule.uuid);
                    });
                    sgMgr.deleteRule(_this.options.sg, ruleUuids, function () {
                        if (Utils.notNullnotUndefined(_this.options.done)) {
                            _this.options.done(rules);
                        }
                    });
                    $scope.deleteRule__.close();
                };
                $scope.deleteRuleOptions__ = {
                    width: '550px'
                };
                $scope.$watch(function () {
                    return _this.options.sg;
                }, function () {
                    if (Utils.notNullnotUndefined(_this.options.sg)) {
                        var rules = [];
                        angular.extend(rules, _this.options.sg.rules);
                        $scope.ruleOptions__.dataSource.data(rules);
                    }
                });
            };
        }
        DeleteRule.prototype.open = function () {
            this.$scope.ruleOptions__.dataSource.data(this.options.sg.rules);
            this.$scope.deleteRule__.center();
            this.$scope.deleteRule__.open();
        };
        return DeleteRule;
    }());
    MSecurityGroup.DeleteRule = DeleteRule;
    var AddVmNic = (function () {
        function AddVmNic(sgMgr, vmMgr) {
            var _this = this;
            this.sgMgr = sgMgr;
            this.vmMgr = vmMgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/securityGroup/addVmNic.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zSecurityGroupAddVmNic] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.uuid = null;
                $scope.vmNicListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "id",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">VM Name:</span><span>#: vm.name #</span></div>' +
                    '<div style="color: black"><span class="z-label">Nic IP:</span><span>#: nic.ip #</span></div>' +
                    '<div style="color: black"><span class="z-label">Nic Device ID:</span><span>#: nic.deviceId #</span></div>' +
                    '<div style="color: black"><span class="z-label">Nic UUID:</span><span>#: nic.uuid #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.hasVmNic = function () {
                    return $scope.vmNicListOptions__.dataSource.data().length > 0;
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.addVmNic__.close();
                };
                $scope.done = function () {
                    var nics = $scope.vmNicList__.dataItems();
                    var nicUuids = [];
                    angular.forEach(nics, function (it) {
                        nicUuids.push(it.nic.uuid);
                    });
                    sgMgr.addVmNic(_this.options.sg, nicUuids, function () {
                        if (Utils.notNullnotUndefined(_this.options.done)) {
                            _this.options.done();
                        }
                    });
                    $scope.addVmNic__.close();
                };
                $scope.addVmNicOptions__ = {
                    width: '550px'
                };
            };
        }
        AddVmNic.prototype.open = function () {
            var _this = this;
            this.$scope.vmNicListOptions__.dataSource.data([]);
            this.$scope.securityGroupName = this.options.sg.name;
            var chain = new Utils.Chain();
            var nics = [];
            var candidates = [];
            chain.then(function () {
                _this.sgMgr.getCandidateVmNic(_this.options.sg, function (ret) {
                    nics = ret;
                    chain.next();
                });
            }).then(function () {
                if (nics.length == 0) {
                    chain.next();
                    return;
                }
                var nicUuids = [];
                angular.forEach(nics, function (it) {
                    nicUuids.push(it.uuid);
                });
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'vmNics.uuid',
                        op: 'in',
                        value: nicUuids.join()
                    }
                ];
                _this.vmMgr.query(qobj, function (vms) {
                    angular.forEach(nics, function (nic) {
                        for (var i = 0; i < vms.length; i++) {
                            var vm = vms[i];
                            for (var j = 0; j < vm.vmNics.length; j++) {
                                var vnic = vm.vmNics[j];
                                if (vnic.uuid == nic.uuid) {
                                    var tvm = vm;
                                    break;
                                }
                            }
                        }
                        candidates.push({
                            id: tvm.name + ' - ' + nic.ip,
                            vm: tvm,
                            nic: nic
                        });
                    });
                    chain.next();
                });
            }).done(function () {
                _this.$scope.vmNicListOptions__.dataSource.data(candidates);
                _this.$scope.addVmNic__.center();
                _this.$scope.addVmNic__.open();
            }).start();
        };
        return AddVmNic;
    }());
    MSecurityGroup.AddVmNic = AddVmNic;
    var RemoveVmNic = (function () {
        function RemoveVmNic(sgMgr, vmMgr, api) {
            var _this = this;
            this.sgMgr = sgMgr;
            this.vmMgr = vmMgr;
            this.api = api;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/securityGroup/removeVmNic.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zSecurityGroupRemoveVmNic] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.uuid = null;
                $scope.vmNicListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "id",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">VM Name:</span><span>#: vm.name #</span></div>' +
                    '<div style="color: black"><span class="z-label">Nic IP:</span><span>#: nic.ip #</span></div>' +
                    '<div style="color: black"><span class="z-label">Nic Device ID:</span><span>#: nic.deviceId #</span></div>' +
                    '<div style="color: black"><span class="z-label">Nic UUID:</span><span>#: nic.uuid #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.hasVmNic = function () {
                    return $scope.vmNicListOptions__.dataSource.data().length > 0;
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.removeVmNic__.close();
                };
                $scope.done = function () {
                    var nics = $scope.vmNicList__.dataItems();
                    var nicUuids = [];
                    angular.forEach(nics, function (it) {
                        nicUuids.push(it.nic.uuid);
                    });
                    sgMgr.removeVmNic(_this.options.sg, nicUuids, function () {
                        if (Utils.notNullnotUndefined(_this.options.done)) {
                            _this.options.done();
                        }
                    });
                    $scope.removeVmNic__.close();
                };
                $scope.addVmNicOptions__ = {
                    width: '550px'
                };
            };
        }
        RemoveVmNic.prototype.open = function () {
            var _this = this;
            this.$scope.vmNicListOptions__.dataSource.data([]);
            this.$scope.securityGroupName = this.options.sg.name;
            var chain = new Utils.Chain();
            var nics = [];
            var candidates = [];
            chain.then(function () {
                var msg = new ApiHeader.APIQueryVmNicMsg();
                msg.conditions = [{
                    name: 'securityGroup.uuid',
                    op: '=',
                    value: _this.options.sg.uuid
                }];
                _this.api.syncApi(msg, function (reply) {
                    nics = reply.inventories;
                    chain.next();
                });
            }).then(function () {
                if (nics.length == 0) {
                    chain.next();
                    return;
                }
                var nicUuids = [];
                angular.forEach(nics, function (it) {
                    nicUuids.push(it.uuid);
                });
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'vmNics.uuid',
                        op: 'in',
                        value: nicUuids.join()
                    }
                ];
                _this.vmMgr.query(qobj, function (vms) {
                    angular.forEach(nics, function (nic) {
                        for (var i = 0; i < vms.length; i++) {
                            var vm = vms[i];
                            for (var j = 0; j < vm.vmNics.length; j++) {
                                var vnic = vm.vmNics[j];
                                if (vnic.uuid == nic.uuid) {
                                    var tvm = vm;
                                    break;
                                }
                            }
                        }
                        candidates.push({
                            id: tvm.name + ' - ' + nic.ip,
                            vm: tvm,
                            nic: nic
                        });
                    });
                    chain.next();
                });
            }).done(function () {
                _this.$scope.vmNicListOptions__.dataSource.data(candidates);
                _this.$scope.removeVmNic__.center();
                _this.$scope.removeVmNic__.open();
            }).start();
        };
        return RemoveVmNic;
    }());
    MSecurityGroup.RemoveVmNic = RemoveVmNic;
    var AttachL3Network = (function () {
        function AttachL3Network(sgMgr, l3Mgr) {
            var _this = this;
            this.sgMgr = sgMgr;
            this.l3Mgr = l3Mgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/securityGroup/attachL3Network.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zSecurityGroupAttachL3Network] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.uuid = null;
                $scope.l3NetworkListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">TYPE:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">Zone UUID:</span><span>#: zoneUuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">L2 Network UUID:</span><span>#: l2NetworkUuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.hasL3Network = function () {
                    return $scope.l3NetworkListOptions__.dataSource.data().length > 0;
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.attachL3Network__.close();
                };
                $scope.done = function () {
                    var l3s = $scope.l3NetworkList__.dataItems();
                    angular.forEach(l3s, function (it) {
                        sgMgr.attachL3Network(_this.options.sg, it.uuid, function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(it);
                            }
                        });
                    });
                    $scope.attachL3Network__.close();
                };
            };
        }
        AttachL3Network.prototype.open = function () {
            var _this = this;
            this.$scope.l3NetworkListOptions__.dataSource.data([]);
            var chain = new Utils.Chain();
            chain.then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'uuid',
                        op: 'not in',
                        value: _this.options.sg.attachedL3NetworkUuids.join()
                    },
                ];
                _this.l3Mgr.query(qobj, function (l3s) {
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
    MSecurityGroup.AttachL3Network = AttachL3Network;
    var DetachL3Network = (function () {
        function DetachL3Network(sgMgr, l3Mgr) {
            var _this = this;
            this.sgMgr = sgMgr;
            this.l3Mgr = l3Mgr;
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/securityGroup/detachL3Network.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zSecurityGroupDetachL3Network] = _this;
                _this.options = parent[$attrs.zOptions];
                _this.$scope = $scope;
                $scope.uuid = null;
                $scope.l3NetworkListOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">TYPE:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">Zone UUID:</span><span>#: zoneUuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">L2 Network UUID:</span><span>#: l2NetworkUuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>',
                    change: function (e) {
                        var select = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.selectItemNum = select.dataItems().length;
                        });
                    }
                };
                $scope.hasL3Network = function () {
                    return $scope.l3NetworkListOptions__.dataSource.data().length > 0;
                };
                $scope.selectItemNum = 0;
                $scope.canProceed = function () {
                    return $scope.selectItemNum > 0;
                };
                $scope.cancel = function () {
                    $scope.detachL3Network__.close();
                };
                $scope.done = function () {
                    var l3s = $scope.l3NetworkList__.dataItems();
                    angular.forEach(l3s, function (l3) {
                        sgMgr.detachL3Network(_this.options.sg, l3.uuid, function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(l3);
                            }
                        });
                    });
                    $scope.detachL3Network__.close();
                };
                $scope.detachL3NetworkOptions__ = {
                    width: '600px'
                };
            };
        }
        DetachL3Network.prototype.open = function () {
            var _this = this;
            this.$scope.l3NetworkList__.value([]);
            this.$scope.ok = null;
            var chain = new Utils.Chain();
            chain.then(function () {
                if (_this.options.sg.attachedL3NetworkUuids.length == 0) {
                    chain.next();
                    return;
                }
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [
                    {
                        name: 'uuid',
                        op: 'in',
                        value: _this.options.sg.attachedL3NetworkUuids.join()
                    }
                ];
                _this.l3Mgr.query(qobj, function (l3s) {
                    _this.$scope.l3NetworkListOptions__.dataSource.data(l3s);
                    chain.next();
                });
            }).done(function () {
                _this.$scope.detachL3Network__.center();
                _this.$scope.detachL3Network__.open();
            }).start();
        };
        return DetachL3Network;
    }());
    MSecurityGroup.DetachL3Network = DetachL3Network;
})(MSecurityGroup || (MSecurityGroup = {}));
angular.module('root').factory('SecurityGroupManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MSecurityGroup.SecurityGroupManager(api, $rootScope);
}]).directive('zCreateSecurityGroup', ['Api', 'SecurityGroupManager', 'L3NetworkManager', function (api, sgMgr, l3Mgr) {
    return new MSecurityGroup.CreateSecurityGroup(api, sgMgr, l3Mgr);
}]).directive('zSecurityGroupAddRule', ['SecurityGroupManager', function (sgMgr) {
    return new MSecurityGroup.AddRule(sgMgr);
}]).directive('zSecurityGroupDeleteRule', ['SecurityGroupManager', function (sgMgr) {
    return new MSecurityGroup.DeleteRule(sgMgr);
}]).directive('zSecurityGroupAttachL3Network', ['SecurityGroupManager', 'L3NetworkManager', function (sgMgr, l3Mgr) {
    return new MSecurityGroup.AttachL3Network(sgMgr, l3Mgr);
}]).directive('zSecurityGroupDetachL3Network', ['SecurityGroupManager', 'L3NetworkManager', function (sgMgr, l3Mgr) {
    return new MSecurityGroup.DetachL3Network(sgMgr, l3Mgr);
}]).directive('zSecurityGroupAddVmNic', ['SecurityGroupManager', 'VmInstanceManager', function (sgMgr, vmMgr) {
    return new MSecurityGroup.AddVmNic(sgMgr, vmMgr);
}]).directive('zSecurityGroupRemoveVmNic', ['SecurityGroupManager', 'VmInstanceManager', 'Api', function (sgMgr, vmMgr, api) {
    return new MSecurityGroup.RemoveVmNic(sgMgr, vmMgr, api);
}]).config(['$routeProvider', function (route) {
    route.when('/securityGroup', {
        templateUrl: '/static/templates/securityGroup/securityGroup.html',
        controller: 'MSecurityGroup.Controller'
    }).when('/securityGroup/:uuid', {
        templateUrl: '/static/templates/securityGroup/details.html',
        controller: 'MSecurityGroup.DetailsController',
        resolve: {
            current: function ($q, $route, SecurityGroupManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var uuid = $route.current.params.uuid;
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                SecurityGroupManager.query(qobj, function (sgs) {
                    var sg = sgs[0];
                    defer.resolve(sg);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />