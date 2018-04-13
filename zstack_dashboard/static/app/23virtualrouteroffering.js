var MVirtualRouterOffering;
(function (MVirtualRouterOffering) {
    var VirtualRouterOffering = (function (_super) {
        __extends(VirtualRouterOffering, _super);
        function VirtualRouterOffering() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        VirtualRouterOffering.prototype.progressOn = function () {
            this.inProgress = true;
        };
        VirtualRouterOffering.prototype.progressOff = function () {
            this.inProgress = false;
        };
        VirtualRouterOffering.prototype.isInProgress = function () {
            return this.inProgress;
        };
        VirtualRouterOffering.prototype.isEnableShow = function () {
            return this.state == 'Disabled';
        };
        VirtualRouterOffering.prototype.isDisableShow = function () {
            return this.state == 'Enabled';
        };
        VirtualRouterOffering.prototype.stateLabel = function () {
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
        VirtualRouterOffering.prototype.isDefaultLabel = function () {
            if (this.isDefault) {
                return 'label label-primary';
            }
            return null;
        };
        VirtualRouterOffering.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('state', inv.state);
            self.set('cpuNum', inv.cpuNum);
            self.set('cpuSpeed', inv.cpuSpeed);
            self.set('memorySize', inv.memorySize);
            self.set('allocatorStrategy', inv.allocatorStrategy);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
            self.set('publicNetworkUuid', inv.publicNetworkUuid);
            self.set('managementL3NetworkUuid', inv.managementNetworkUuid);
            self.set('zoneUuid', inv.zoneUuid);
            self.set('isDefault', inv.isDefault);
            self.set('imageUuid', inv.imageUuid);
        };
        return VirtualRouterOffering;
    }(ApiHeader.VirtualRouterOfferingInventory));
    MVirtualRouterOffering.VirtualRouterOffering = VirtualRouterOffering;
    var VirtualRouterOfferingManager = (function () {
        function VirtualRouterOfferingManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        VirtualRouterOfferingManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        VirtualRouterOfferingManager.prototype.wrap = function (VirtualRouterOffering) {
            return new kendo.data.ObservableObject(VirtualRouterOffering);
        };
        VirtualRouterOfferingManager.prototype.create = function (virtualRouterOffering, done) {
            var _this = this;
            var msg = new ApiHeader.APICreateVirtualRouterOfferingMsg();
            msg.name = virtualRouterOffering.name;
            msg.description = virtualRouterOffering.description;
            msg.cpuNum = virtualRouterOffering.cpuNum;
            msg.cpuSpeed = 1;
            msg.memorySize = virtualRouterOffering.memorySize;
            msg.allocatorStrategy = virtualRouterOffering.allocatorStrategy;
            msg.managementNetworkUuid = virtualRouterOffering.managementNetworkUuid;
            msg.publicNetworkUuid = virtualRouterOffering.publicNetworkUuid;
            msg.zoneUuid = virtualRouterOffering.zoneUuid;
            msg.isDefault = virtualRouterOffering.isDefault;
            msg.imageUuid = virtualRouterOffering.imageUuid;
            this.api.asyncApi(msg, function (ret) {
                var c = new VirtualRouterOffering();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Added new virtual router offering: {0}', c.name),
                    link: Utils.sprintf('/#/virtualRouterOffering/{0}', c.uuid)
                });
            });
        };
        VirtualRouterOfferingManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryVirtualRouterOfferingMsg();
            msg.count = qobj.count === true;
            msg.start = qobj.start;
            msg.limit = qobj.limit;
            msg.replyWithCount = true;
            msg.conditions = qobj.conditions ? qobj.conditions : [];
            msg.conditions.push({
                name: "type",
                op: "=",
                value: "VirtualRouterOffering"
            });
            if (Utils.notNullnotUndefined(this.sortBy) && this.sortBy.isValid()) {
                msg.sortBy = this.sortBy.field;
                msg.sortDirection = this.sortBy.direction;
            }
            this.api.syncApi(msg, function (ret) {
                var pris = [];
                ret.inventories.forEach(function (inv) {
                    var c = new VirtualRouterOffering();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        VirtualRouterOfferingManager.prototype.disable = function (virtualRouterOffering) {
            var _this = this;
            virtualRouterOffering.progressOn();
            var msg = new ApiHeader.APIChangeInstanceOfferingStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = virtualRouterOffering.uuid;
            this.api.asyncApi(msg, function (ret) {
                virtualRouterOffering.updateObservableObject(ret.inventory);
                virtualRouterOffering.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled Instance Offering: {0}', virtualRouterOffering.name),
                    link: Utils.sprintf('/#/virtualRouterOffering/{0}', virtualRouterOffering.uuid)
                });
            });
        };
        VirtualRouterOfferingManager.prototype.enable = function (virtualRouterOffering) {
            var _this = this;
            virtualRouterOffering.progressOn();
            var msg = new ApiHeader.APIChangeInstanceOfferingStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = virtualRouterOffering.uuid;
            this.api.asyncApi(msg, function (ret) {
                virtualRouterOffering.updateObservableObject(ret.inventory);
                virtualRouterOffering.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled virtual router offering: {0}', virtualRouterOffering.name),
                    link: Utils.sprintf('/#/virtualRouterOffering/{0}', virtualRouterOffering.uuid)
                });
            });
        };
        VirtualRouterOfferingManager.prototype["delete"] = function (virtualRouterOffering, done) {
            var _this = this;
            virtualRouterOffering.progressOn();
            var msg = new ApiHeader.APIDeleteInstanceOfferingMsg();
            msg.uuid = virtualRouterOffering.uuid;
            this.api.asyncApi(msg, function (ret) {
                virtualRouterOffering.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted virtual router offering: {0}', virtualRouterOffering.name)
                });
            });
        };
        return VirtualRouterOfferingManager;
    }());
    VirtualRouterOfferingManager.$inject = ['Api', '$rootScope'];
    MVirtualRouterOffering.VirtualRouterOfferingManager = VirtualRouterOfferingManager;
    var VirtualRouterOfferingModel = (function (_super) {
        __extends(VirtualRouterOfferingModel, _super);
        function VirtualRouterOfferingModel() {
            var _this = _super.call(this) || this;
            _this.current = new VirtualRouterOffering();
            return _this;
        }
        return VirtualRouterOfferingModel;
    }(Utils.Model));
    MVirtualRouterOffering.VirtualRouterOfferingModel = VirtualRouterOfferingModel;
    var OVirtualRouterOfferingGrid = (function (_super) {
        __extends(OVirtualRouterOfferingGrid, _super);
        function OVirtualRouterOfferingGrid($scope, virtualRouterOfferingMgr) {
            var _this = _super.call(this) || this;
            _this.virtualRouterOfferingMgr = virtualRouterOfferingMgr;
            _super.prototype.init.call(_this, $scope, $scope.virtualRouterOfferingGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"virtualRouterOffering.ts.NAME" | translate}}',
                    width: '10%',
                    template: '<a href="/\\#/virtualRouterOffering/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'description',
                    title: '{{"virtualRouterOffering.ts.DESCRIPTION" | translate}}',
                    width: '15%'
                },
                {
                    field: 'cpuNum',
                    title: '{{"virtualRouterOffering.ts.CPU NUMBER" | translate}}',
                    width: '10%'
                },
                {
                    field: 'memorySize',
                    title: '{{"virtualRouterOffering.ts.MEMORY" | translate}}',
                    width: '15%',
                    template: '<span>{{dataItem.memorySize | size}}</span>'
                },
                {
                    field: 'state',
                    title: '{{"virtualRouterOffering.ts.STATE" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'isDefault',
                    title: '{{"virtualRouterOffering.ts.DEFAULT OFFERING" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.isDefaultLabel()}}">{{dataItem.isDefault ? "TRUE" : "" }}</span>'
                },
                {
                    field: 'uuid',
                    title: '{{"virtualRouterOffering.ts.UUID" | translate}}',
                    width: '20%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                virtualRouterOfferingMgr.query(qobj, function (virtualRouterOfferings, total) {
                    options.success({
                        data: virtualRouterOfferings,
                        total: total
                    });
                });
            };
            return _this;
        }
        return OVirtualRouterOfferingGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, virtualRouterOfferingMgr) {
            this.$scope = $scope;
            this.virtualRouterOfferingMgr = virtualRouterOfferingMgr;
        }
        Action.prototype.enable = function () {
            this.virtualRouterOfferingMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.virtualRouterOfferingMgr.disable(this.$scope.model.current);
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
                            name: '{{"virtualRouterOffering.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"virtualRouterOffering.ts.State" | translate}}',
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
            this.$scope.oVirtualRouterOfferingGrid.setFilter(this.toKendoFilter());
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
        function DetailsController($scope, virtualRouterOfferingMgr, $routeParams, tagService, current) {
            var _this = this;
            this.$scope = $scope;
            this.virtualRouterOfferingMgr = virtualRouterOfferingMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            $scope.model = new VirtualRouterOfferingModel();
            $scope.model.current = current.offering;
            $scope.mgmtL3 = current.mgmtL3;
            $scope.pubL3 = current.pubL3;
            $scope.funcDelete = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, virtualRouterOfferingMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteVirtualRouterOffering = {
                title: 'DELETE VIRTUAL ROUTER OFFERING',
                btnType: 'btn-danger',
                description: function () {
                    return $scope.model.current.name;
                },
                width: '400px',
                confirm: function () {
                    virtualRouterOfferingMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeVirtualRouterOfferingVO, function (ret) {
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
        }
        DetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.virtualRouterOfferingMgr.query(qobj, function (virtualRouterOfferings, total) {
                _this.$scope.model.current = virtualRouterOfferings[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'VirtualRouterOfferingManager', '$routeParams', 'Tag', 'current'];
    MVirtualRouterOffering.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, virtualRouterOfferingMgr, hypervisorTypes, $location) {
            this.$scope = $scope;
            this.virtualRouterOfferingMgr = virtualRouterOfferingMgr;
            this.hypervisorTypes = hypervisorTypes;
            this.$location = $location;
            $scope.model = new VirtualRouterOfferingModel();
            $scope.oVirtualRouterOfferingGrid = new OVirtualRouterOfferingGrid($scope, virtualRouterOfferingMgr);
            $scope.action = new Action($scope, virtualRouterOfferingMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"virtualRouterOffering.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"virtualRouterOffering.ts.Description" | translate}}',
                        value: 'description'
                    },
                    {
                        name: '{{"virtualRouterOffering.ts.CPU Number" | translate}}',
                        value: 'cpuNum'
                    },
                    {
                        name: '{{"virtualRouterOffering.ts.Memory" | translate}}',
                        value: 'memorySize'
                    },
                    {
                        name: '{{"virtualRouterOffering.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"virtualRouterOffering.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"virtualRouterOffering.ts.Last Updated Date" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    virtualRouterOfferingMgr.setSortBy(ret);
                    $scope.oVirtualRouterOfferingGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.VirtualRouterOfferingInventoryQueryable,
                name: 'VirtualRouterOffering',
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
                    virtualRouterOfferingMgr.query(qobj, function (VirtualRouterOfferings, total) {
                        $scope.oVirtualRouterOfferingGrid.refresh(VirtualRouterOfferings);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/virtualRouterOffering/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope, this.hypervisorTypes);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateVirtualRouterOffering = function (win) {
                win.open();
            };
            $scope.funcDeleteVirtualRouterOffering = function () {
                $scope.deleteVirtualRouterOffering.open();
            };
            $scope.optionsDeleteVirtualRouterOffering = {
                title: 'DELETE VIRTUAL ROUTER OFFERING',
                btnType: 'btn-danger',
                description: function () {
                    return $scope.model.current.name;
                },
                width: '400px',
                confirm: function () {
                    virtualRouterOfferingMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oVirtualRouterOfferingGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oVirtualRouterOfferingGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateVirtualRouterOffering = {
                done: function (virtualRouterOffering) {
                    $scope.oVirtualRouterOfferingGrid.refresh();
                }
            };
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'VirtualRouterOfferingManager', 'hypervisorTypes', '$location'];
    MVirtualRouterOffering.Controller = Controller;
    var CreateVirtualRouterOfferingOptions = (function () {
        function CreateVirtualRouterOfferingOptions() {
        }
        return CreateVirtualRouterOfferingOptions;
    }());
    MVirtualRouterOffering.CreateVirtualRouterOfferingOptions = CreateVirtualRouterOfferingOptions;
    var CreateVirtualRouterOffering = (function () {
        function CreateVirtualRouterOffering(api, virtualRouterOfferingMgr, l3Mgr, imgMgr, zoneMgr, bsMgr) {
            var _this = this;
            this.api = api;
            this.virtualRouterOfferingMgr = virtualRouterOfferingMgr;
            this.l3Mgr = l3Mgr;
            this.imgMgr = imgMgr;
            this.zoneMgr = zoneMgr;
            this.bsMgr = bsMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateVirtualRouterOffering;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new CreateVirtualRouterOfferingOptions();
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
                    memorySize: null,
                    cpuNum: null,
                    allocatorStrategy: null,
                    zoneUuid: null,
                    managementNetworkUuid: null,
                    publicNetworkUuid: null,
                    imageUuid: null,
                    system: null,
                    hasZone: function () {
                        return $scope.zoneOptions__.dataSource.data().length > 0;
                    },
                    hasL3Network: function () {
                        return $scope.mgmtL3Options__.dataSource.data().length > 0;
                    },
                    hasImage: function () {
                        return $scope.imageOptions__.dataSource.data().length > 0;
                    },
                    isCpuNumValid: function () {
                        if (Utils.notNullnotUndefined(this.cpuNum)) {
                            return !isNaN(this.cpuNum);
                        }
                        return true;
                    },
                    isMemoryValid: function () {
                        if (Utils.notNullnotUndefined(this.memorySize)) {
                            return Utils.isValidSizeStr(this.memorySize);
                        }
                        return true;
                    },
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.memorySize) && Utils.notNullnotUndefined(this.cpuNum)
                            && Utils.notNullnotUndefined(this.zoneUuid) && Utils.notNullnotUndefined(this.managementNetworkUuid)
                            && Utils.notNullnotUndefined(this.publicNetworkUuid) && Utils.notNullnotUndefined(this.imageUuid)
                            && this.isCpuNumValid() && this.isMemoryValid();
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createVirtualRouterOfferingInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createVirtualRouterOfferingInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('vrOffering');
                        this.memorySize = null;
                        this.cpuNum = null;
                        this.allocatorStrategy = null;
                        this.description = null;
                        this.managementNetworkUuid = null;
                        this.publicNetworkUuid = null;
                        this.system = false;
                        this.imageUuid = null;
                        this.zoneUuid = null;
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
                        if (Utils.notNullnotUndefined($scope.infoPage.allocatorStrategy) && $scope.infoPage.allocatorStrategy == "") {
                            $scope.infoPage.allocatorStrategy = null;
                        }
                        $scope.infoPage.memorySize = Utils.parseSize($scope.infoPage.memorySize);
                        virtualRouterOfferingMgr.create(infoPage, function (ret) {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(ret);
                            }
                        });
                        $scope.winCreateVirtualRouterOffering__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage
                ], mediator);
                $scope.winCreateVirtualRouterOfferingOptions__ = {
                    width: '700px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.allocatorStrategyOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] })
                };
                $scope.mgmtL3Options__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"virtualRouterOffering.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"virtualRouterOffering.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.pubL3Options__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"virtualRouterOffering.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"virtualRouterOffering.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.imageOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"virtualRouterOffering.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"virtualRouterOffering.ts.Format" | translate}}:</span><span>#: format #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"virtualRouterOffering.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.zoneOptions__ = {
                    dataSource: new kendo.data.DataSource({ data: [] }),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"virtualRouterOffering.ts.Name" | translate}}</span>: #: name #</div>' + '<div style="color: black"><span class="z-label">{{"virtualRouterOffering.ts.state" | translate}}:</span>#: state #</div>' + '<div style="color: black"><span class="z-label">{{"virtualRouterOffering.ts.UUID" | translate}}:</span> #: uuid #</div>'
                };
                $scope.$watch(function () {
                    return $scope.infoPage.zoneUuid;
                }, function () {
                    var zoneUuid = $scope.infoPage.zoneUuid;
                    if (!Utils.notNullnotUndefined(zoneUuid)) {
                        return;
                    }
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = [
                        {
                            name: 'zoneUuid',
                            op: '=',
                            value: zoneUuid
                        }
                    ];
                    l3Mgr.query(qobj, function (l3s) {
                        $scope.mgmtL3Options__.dataSource.data(l3s);
                        $scope.pubL3Options__.dataSource.data(l3s);
                        if (l3s.length > 0) {
                            $scope.infoPage.publicNetworkUuid = l3s[0].uuid;
                            $scope.infoPage.managementNetworkUuid = l3s[0].uuid;
                        }
                    });
                    var chain = new Utils.Chain();
                    var bsUuids = [];
                    chain.then(function () {
                        qobj = new ApiHeader.QueryObject();
                        qobj.conditions = [
                            {
                                name: 'attachedZoneUuids',
                                op: 'in',
                                value: zoneUuid
                            }
                        ];
                        bsMgr.query(qobj, function (bss) {
                            angular.forEach(bss, function (it) {
                                bsUuids.push(it.uuid);
                            });
                            chain.next();
                        });
                    }).then(function () {
                        if (bsUuids.length == 0) {
                            chain.next();
                            return;
                        }
                        qobj = new ApiHeader.QueryObject();
                        qobj.conditions = [
                            {
                                name: 'backupStorageRefs.backupStorageUuid',
                                op: 'in',
                                value: bsUuids.join()
                            },
                            {
                                name: 'status',
                                op: '=',
                                value: 'Ready'
                            }
                        ];
                        imgMgr.query(qobj, function (imgs) {
                            $scope.imageOptions__.dataSource.data(imgs);
                            if (imgs.length > 0) {
                                $scope.infoPage.imageUuid = imgs[0].uuid;
                            }
                            chain.next();
                        });
                    }).start();
                });
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/virtualRouterOffering/addVirtualRouterOffering.html';
        }
        CreateVirtualRouterOffering.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateVirtualRouterOffering__;
            this.$scope.button.reset();
            var chain = new Utils.Chain();
            chain.then(function () {
                _this.api.getInstanceOfferingAllocatorStrategies(function (ret) {
                    ret.unshift("");
                    _this.$scope.allocatorStrategyOptions__.dataSource.data(ret);
                    chain.next();
                });
            }).then(function () {
                var qobj = new ApiHeader.QueryObject();
                qobj.conditions = [];
                _this.zoneMgr.query(qobj, function (zones) {
                    _this.$scope.zoneOptions__.dataSource.data(zones);
                    if (zones.length > 0) {
                        _this.$scope.infoPage.zoneUuid = zones[0].uuid;
                    }
                    chain.next();
                });
            }).done(function () {
                win.center();
                win.open();
            }).start();
        };
        return CreateVirtualRouterOffering;
    }());
    MVirtualRouterOffering.CreateVirtualRouterOffering = CreateVirtualRouterOffering;
})(MVirtualRouterOffering || (MVirtualRouterOffering = {}));
angular.module('root').factory('VirtualRouterOfferingManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MVirtualRouterOffering.VirtualRouterOfferingManager(api, $rootScope);
}]).directive('zCreateVirtualRouterOffering', ['Api', 'VirtualRouterOfferingManager', 'L3NetworkManager', 'ImageManager', 'ZoneManager', 'BackupStorageManager',
    function (api, virtualRouterOfferingMgr, l3Mgr, imgMgr, zoneMgr, bsMgr) {
        return new MVirtualRouterOffering.CreateVirtualRouterOffering(api, virtualRouterOfferingMgr, l3Mgr, imgMgr, zoneMgr, bsMgr);
    }]).config(['$routeProvider', function (route) {
    route.when('/virtualRouterOffering', {
        templateUrl: '/static/templates/virtualRouterOffering/virtualRouterOffering.html',
        controller: 'MVirtualRouterOffering.Controller',
        resolve: {
            hypervisorTypes: function ($q, Api) {
                var defer = $q.defer();
                Api.getHypervisorTypes(function (hypervisorTypes) {
                    defer.resolve(hypervisorTypes);
                });
                return defer.promise;
            }
        }
    }).when('/virtualRouterOffering/:uuid', {
        templateUrl: '/static/templates/virtualRouterOffering/details.html',
        controller: 'MVirtualRouterOffering.DetailsController',
        resolve: {
            current: function ($q, $route, VirtualRouterOfferingManager, L3NetworkManager) {
                var defer = $q.defer();
                var chain = new Utils.Chain();
                var ret = {
                    offering: null,
                    mgmtL3: null,
                    pubL3: null
                };
                chain.then(function () {
                    var qobj = new ApiHeader.QueryObject();
                    var uuid = $route.current.params.uuid;
                    qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                    VirtualRouterOfferingManager.query(qobj, function (virtualRouterOfferings) {
                        ret.offering = virtualRouterOfferings[0];
                        chain.next();
                    });
                }).then(function () {
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = [{
                        name: "uuid",
                        op: "=",
                        value: ret.offering.managementNetworkUuid
                    }];
                    L3NetworkManager.query(qobj, function (l3s) {
                        ret.mgmtL3 = l3s[0];
                        chain.next();
                    });
                }).then(function () {
                    var qobj = new ApiHeader.QueryObject();
                    qobj.conditions = [{
                        name: "uuid",
                        op: "=",
                        value: ret.offering.publicNetworkUuid
                    }];
                    L3NetworkManager.query(qobj, function (l3s) {
                        ret.pubL3 = l3s[0];
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