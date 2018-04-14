var MOneKey;
(function (MOneKey) {
    //集群
    var OnKeyCreateCluster = (function () {
        function OnKeyCreateCluster(api, zoneMgr, clusterMgr, psMgr, l2Mgr) {
            var _this = this;
            this.api = api;
            this.zoneMgr = zoneMgr;
            this.clusterMgr = clusterMgr;
            this.psMgr = psMgr;
            this.l2Mgr = l2Mgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                $scope.model = new MCluster.ClusterModel();
                var instanceName = $attrs.zOneKeyCreateCluster;
                console.info("instanceName->" + instanceName);
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new MCluster.CreateClusterOptions();
                var optionName = $attrs.zOptions;
                if (angular.isDefined(optionName)) {
                    console.info("optionName->" + optionName);
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
                    hypervisorType: null,
                    canMoveToPrevious: function () {
                        return false;
                    },
                    hasZone: function () {
                        return $scope.zoneList.dataSource.data().length > 0;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.zoneUuid)
                            && Utils.notNullnotUndefined(this.hypervisorType);
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createClusterInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createClusterInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName("cluster");
                        this.zoneUuid = null;
                        this.description = null;
                        this.hypervisorType = null;
                        this.activeState = false;
                    }
                };
                var psPage = $scope.psPage = {
                    activeState: false,
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return true;
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createClusterPrimaryStorage"]');
                    },
                    hasPrimaryStorage: function () {
                        return $scope.primaryStorageListOptions__.dataSource.data().length > 0;
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
                        return 'createClusterPrimaryStorage';
                    },
                    reset: function () {
                        this.activeState = false;
                    }
                };
                var l2Page = $scope.l2Page = {
                    activeState: false,
                    hasL2Netwwork: function () {
                        return $scope.l2NetworkListOptions__.dataSource.data().length > 0;
                    },
                    canMoveToPrevious: function () {
                        return true;
                    },
                    canMoveToNext: function () {
                        return true;
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createClusterL2Network"]');
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
                        return 'createClusterL2Network';
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
                        return "Create";
                    },
                    finish: function () {
                        var resultCluster;
                        var chain = new Utils.Chain();
                        chain.then(function () {
                            clusterMgr.create(infoPage, function (ret) {
                                resultCluster = ret;
                                chain.next();
                            });
                        }).then(function () {
                            var pss = $scope.primaryStorageList__.dataItems();
                            angular.forEach(pss, function (ps) {
                                clusterMgr.attachPrimaryStorage(resultCluster, ps);
                            });
                            chain.next();
                        }).then(function () {
                            var l2s = $scope.l2NetworkList__.dataItems();
                            angular.forEach(l2s, function (l2) {
                                clusterMgr.attachL2Network(resultCluster, l2);
                            });
                            chain.next();
                        }).done(function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(resultCluster);
                            }
                        }).start();
                        $scope.winCreateCluster__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage, psPage, l2Page
                ], mediator);
                $scope.$watch(function () {
                    return $scope.infoPage.zoneUuid;
                }, function () {
                    if (Utils.notNullnotUndefined($scope.primaryStorageList__)) {
                        $scope.primaryStorageList__.value([]);
                    }
                    var zuuid = $scope.infoPage.zoneUuid;
                    if (Utils.notNullnotUndefined(zuuid)) {
                        _this.queryPrimaryStorages(zuuid, function (pss) {
                            $scope.primaryStorageListOptions__.dataSource.data(pss);
                        });
                        _this.queryL2Networks(zuuid, function (l2s) {
                            $scope.l2NetworkListOptions__.dataSource.data(l2s);
                        });
                    }
                });
                $scope.zoneList = {
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"cluster.ts.Name" | translate}}</span>: #: name #</div>' + '<div style="color: black"><span class="z-label">{{"cluster.ts.State" | translate}}</span>#: state #</div>' + '<div style="color: black"><span class="z-label">{{"cluster.ts.UUID" | translate}}</span> #: uuid #</div>'
                };
                $scope.hypervisorList = {
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "type",
                    dataValueField: "type"
                };
                $scope.winCreateClusterOptions__ = {
                    width: "700px",
                    //height: "518px",
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.primaryStorageListOptions__ = {
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">Type:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">URL:</span><span>#: url #</span></div>'
                };
                $scope.l2NetworkListOptions__ = {
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>' +
                    '<div style="color: black"><span class="z-label">Type:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">Physical Interface:</span><span>#: physicalInterface #</span></div>'
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/cluster/createCluster.html';
        }

        OnKeyCreateCluster.prototype.queryPrimaryStorages = function (zoneUuid, done) {
            var qobj = new ApiHeader.QueryObject();
            qobj.conditions = [
                {
                    name: 'zoneUuid',
                    op: '=',
                    value: zoneUuid
                }
            ];
            this.psMgr.query(qobj, function (pss) {
                done(pss);
            });
        };
        OnKeyCreateCluster.prototype.queryL2Networks = function (zoneUuid, done) {
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
        OnKeyCreateCluster.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateCluster__;
            this.$scope.primaryStorageList__.value([]);
            this.$scope.l2NetworkList__.value([]);
            this.$scope.button.reset();
            var chain = new Utils.Chain();
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
                _this.api.getHypervisorTypes(function (hvTypes) {
                    var types = [];
                    angular.forEach(hvTypes, function (item) {
                        types.push({type: item});
                    });
                    _this.$scope.hypervisorList.dataSource.data(new kendo.data.ObservableArray(types));
                    _this.$scope.model.hypervisorType = hvTypes[0];
                    chain.next();
                });
            }).done(function () {
                win.center();
                win.open();
            }).start();
        };
        return OnKeyCreateCluster;
    }());
    MOneKey.OnKeyCreateCluster = OnKeyCreateCluster;

    //主机
    var CreateHost = (function () {
        function CreateHost(api, zoneMgr, hostMgr, clusterMgr) {
            var _this = this;
            this.api = api;
            this.zoneMgr = zoneMgr;
            this.hostMgr = hostMgr;
            this.clusterMgr = clusterMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zOneKeyCreateHost;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new MHost.CreateHostOptions();
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
                    clusterUuid: null,
                    description: null,
                    hypervisorType: null,
                    managementIp: null,
                    username: 'root',
                    password: null,
                    canMoveToPrevious: function () {
                        return false;
                    },
                    hasCluster: function () {
                        return $scope.clusterListOptions__.dataSource.data().length > 0;
                    },
                    canMoveToNext: function () {
                        if (this.hypervisorType == 'KVM') {
                            return Utils.notNullnotUndefined(this.name)
                                && Utils.notNullnotUndefined(this.clusterUuid) && Utils.notNullnotUndefined(this.managementIp) &&
                                Utils.notNullnotUndefined(this.username) && Utils.notNullnotUndefined(this.password);
                        }
                        else {
                            return Utils.notNullnotUndefined(this.name)
                                && Utils.notNullnotUndefined(this.clusterUuid) && Utils.notNullnotUndefined(this.managementIp);
                        }
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createHostInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createHostInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('host');
                        this.clusterUuid = null;
                        this.description = null;
                        this.hypervisorType = null;
                        this.username = 'root';
                        this.password = null;
                        this.managementIp = null;
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
                        if (Utils.notNullnotUndefined(_this.options.done)) {
                            _this.options.done($scope.infoPage);
                        }
                        $scope.winCreateHost__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage
                ], mediator);
                $scope.$watch(function () {
                    return $scope.infoPage.zoneUuid;
                }, function () {
                    var zuuid = $scope.infoPage.zoneUuid;
                    if (Utils.notNullnotUndefined(zuuid)) {
                        _this.queryClusters(zuuid, function (clusters) {
                            $scope.clusterListOptions__.dataSource.data(clusters);
                            var c = clusters[0];
                            if (Utils.notNullnotUndefined(c)) {
                                $scope.infoPage.hypervisorType = c.hypervisorType;
                            }
                        });
                    }
                });
                $scope.zoneList = {
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"host.ts.Name" | translate}}</span>: #: name #</div>' + '<div style="color: black"><span class="z-label">{{"host.ts.State" | translate}}</span>#: state #</div>' + '<div style="color: black"><span class="z-label">{{"host.ts.UUID" | translate}}</span> #: uuid #</div>'
                };
                $scope.winCreateHostOptions__ = {
                    width: '700px',
                    //height: '620px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.clusterListOptions__ = {
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"host.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"host.ts.HYPERVISOR" | translate}}</span><span>#: hypervisorType #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"host.ts.UUID" | translate}}</span><span>#: uuid #</span></div>',
                    change: function (e) {
                        var list = e.sender;
                        var cluster = list.dataItem();
                        Utils.safeApply($scope, function () {
                            $scope.infoPage.hypervisorType = cluster.hypervisorType;
                        });
                    }
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/host/createHost.html';
        }

        CreateHost.prototype.queryClusters = function (zoneUuid, done) {
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
        CreateHost.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateHost__;
            var chain = new Utils.Chain();
            this.$scope.clusterListOptions__.dataSource.data([]);
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
                        if (zones) {
                            _this.$scope.infoPage.zoneUuid = zones[0].uuid;
                        }
                        chain.next();
                    });
                }
            }).then(function () {
                if (Utils.notNullnotUndefined(_this.$scope.infoPage.zoneUuid)) {
                    _this.queryClusters(_this.$scope.infoPage.zoneUuid, function (clusters) {
                        _this.$scope.clusterListOptions__.dataSource.data(clusters);
                        var c = clusters[0];
                        if (Utils.notNullnotUndefined(c)) {
                            _this.$scope.infoPage.hypervisorType = c.hypervisorType;
                        }
                        chain.next();
                    });
                }
                else {
                    chain.next();
                }
            }).done(function () {
                win.center();
                win.open();
            }).start();
        };
        return CreateHost;
    }());
    MOneKey.CreateHost = CreateHost;

    //主存储
    var CreatePrimaryStorage = (function () {
        function CreatePrimaryStorage(api, zoneMgr, psMgr, clusterMgr) {
            var _this = this;
            this.api = api;
            this.zoneMgr = zoneMgr;
            this.psMgr = psMgr;
            this.clusterMgr = clusterMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zOneKeyCreatePrimaryStorage;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new MPrimaryStorage.CreatePrimaryStorageOptions();
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
                        $scope.cephMonGrid__.dataSource.insert(0, {url: this.sshUsername + ":" + this.sshPassword + "@" + this.hostname});
                        this.hostname = null;
                        this.sshPassword = null;
                    },
                    addFusionstorMon: function () {
                        $scope.fusionstorMonGrid__.dataSource.insert(0, {url: this.sshUsername + ":" + this.sshPassword + "@" + this.hostname});
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
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"primaryStorage.ts.Name" | translate}}</span>: #: name #</div>' + '<div style="color: black"><span class="z-label">{{"primaryStorage.ts.State" | translate}}:</span>#: state #</div>' + '<div style="color: black"><span class="z-label">UUID:</span> #: uuid #</div>'
                };
                $scope.typeList = {
                    dataSource: new kendo.data.DataSource({data: []}),
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
                    dataSource: new kendo.data.DataSource({data: []}),
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
                        types.push({type: item});
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
    MOneKey.CreatePrimaryStorage = CreatePrimaryStorage;

    //备份存储
    var CreateBackupStorage = (function () {
        function CreateBackupStorage(api, bsMgr, zoneMgr) {
            var _this = this;
            this.api = api;
            this.bsMgr = bsMgr;
            this.zoneMgr = zoneMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zOneKeyCreateBackupStorage;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new MBackupStorage.CreateBackupStorageOptions();
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
                        $scope.cephMonGrid__.dataSource.insert(0, {url: this.username + ":" + this.password + "@" + this.hostname});
                        this.hostname = null;
                        this.password = null;
                    },
                    addFusionstorMon: function () {
                        $scope.fusionstorMonGrid__.dataSource.insert(0, {url: this.username + ":" + this.password + "@" + this.hostname});
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
                    dataSource: new kendo.data.DataSource({data: []}),
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
                    dataSource: new kendo.data.DataSource({data: []}),
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
                        types.push({type: item});
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
    MOneKey.CreateBackupStorage = CreateBackupStorage;

    //镜像
    var CreateImage = (function () {
        function CreateImage(api, bsMgr, imageMgr) {
            var _this = this;
            this.api = api;
            this.bsMgr = bsMgr;
            this.imageMgr = imageMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zOneKeyCreateImage;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new MImage.CreateImageOptions();
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
                    url: null,
                    backupStorageUuids: [],
                    guestOsType: null,
                    format: null,
                    system: false,
                    platform: null,
                    mediaType: null,
                    hasBackup: function () {
                        return $scope.backupStorageListOptions__.dataSource.data().length > 0;
                    },
                    isUrlValid: function () {
                        if (Utils.notNullnotUndefined(this.url)) {
                            return this.url.indexOf('http') == 0 || this.url.indexOf('https') == 0 || this.url.indexOf('file') == 0;
                        }
                        return true;
                    },
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name)
                            && Utils.notNullnotUndefined(this.url)
                            && Utils.notNullnotUndefined(this.platform)
                            && Utils.notNullnotUndefined(this.mediaType)
                            && Utils.notNullnotUndefined(this.format) && this.backupStorageUuids.length > 0 && this.isUrlValid();
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createImageInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createImageInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('image');
                        this.description = null;
                        this.url = null;
                        this.guestOsType = null;
                        this.format = null;
                        this.system = false;
                        this.backupStorageUuids = [];
                        this.activeState = false;
                        this.platform = null;
                        this.mediaType = null;
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
                        _this.options.done(infoPage);
                        $scope.winCreateImage__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage
                ], mediator);
                $scope.winCreateImageOptions__ = {
                    width: '700px',
                    //height: '620px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.formatOptions__ = {
                    dataSource: new kendo.data.DataSource([])
                };
                $scope.mediaTypeOptions__ = {
                    dataSource: CreateImage.MEDIA_TYPES
                };
                $scope.platformOptions__ = {
                    dataSource: new kendo.data.DataSource({
                        data: [
                            'Linux',
                            'Windows',
                            'WindowsVirtio',
                            'Other',
                            'Paravirtualization'
                        ]
                    })
                };
                $scope.bitsOptions__ = {
                    dataSource: new kendo.data.DataSource({
                        data: CreateImage.BITS
                    })
                };
                $scope.hypervisorOptions__ = {
                    dataSource: new kendo.data.DataSource({
                        data: []
                    })
                };
                $scope.backupStorageListOptions__ = {
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    itemTemplate: '<div style="color: black"><span class="z-label">Name:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">Type:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">UUID:</span><span>#: uuid #</span></div>',
                    change: function (e) {
                        Utils.safeApply($scope, function () {
                            var sender = e.sender;
                            var data = sender.dataItems();
                            $scope.infoPage.backupStorageUuids = [];
                            angular.forEach(data, function (it) {
                                $scope.infoPage.backupStorageUuids.push(it.uuid);
                            });
                        });
                    }
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/image/addImage.html';
        }

        CreateImage.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateImage__;
            var chain = new Utils.Chain();
            this.$scope.backupStorageListOptions__.dataSource.data([]);
            this.$scope.formatOptions__.dataSource.data([]);
            this.$scope.button.reset();
            this.$scope.infoPage.mediaType = this.$scope.mediaTypeList__.value();
            this.$scope.infoPage.platform = this.$scope.platformList__.value();
            this.$scope.backupStorageList__.value([]);
            this.$scope.infoPage.backupStorageUuids = [];
            chain.then(function () {
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
                        value: 'Connected'
                    }
                ];
                _this.bsMgr.query(qobj, function (bss) {
                    _this.$scope.backupStorageListOptions__.dataSource.data(bss);
                    chain.next();
                });
            }).then(function () {
                _this.api.getVolumeFormats(function (formats) {
                    var fs = [];
                    angular.forEach(formats, function (it) {
                        fs.push(it.format);
                    });
                    _this.$scope.formatOptions__.dataSource.data(fs);
                    if (formats.length > 0) {
                        _this.$scope.infoPage.format = formats[0];
                    }
                    chain.next();
                });
            }).done(function () {
                win.center();
                win.open();
            }).start();
        };
        return CreateImage;
    }());
    CreateImage.MEDIA_TYPES = ['RootVolumeTemplate', 'DataVolumeTemplate', 'ISO'];
    CreateImage.BITS = [64, 32];
    MOneKey.CreateImage = CreateImage;

    //L2网络
    var CreateL2Network = (function () {
        function CreateL2Network(api, zoneMgr, l2Mgr, clusterMgr) {
            var _this = this;
            this.api = api;
            this.zoneMgr = zoneMgr;
            this.l2Mgr = l2Mgr;
            this.clusterMgr = clusterMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zOneKeyCreateL2Network;
                var parentScope = $scope.$parent;
                $scope.model = new ML2Network.L2NetworkModel();
                parentScope[instanceName] = _this;
                _this.options = new ML2Network.CreateL2NetworkOptions();
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
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"l2Network.ts.Name" | translate}}</span>: #: name #</div>' + '<div style="color: black"><span class="z-label">{{"l2Network.ts.State" | translate}}:</span>#: state #</div>' + '<div style="color: black"><span class="z-label">{{"l2Network.ts.UUID" | translate}}:</span> #: uuid #</div>'
                };
                $scope.typeList = {
                    dataSource: new kendo.data.DataSource({data: []}),
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
                    dataSource: new kendo.data.DataSource({data: []}),
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
                        types.push({type: item});
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
    MOneKey.CreateL2Network = CreateL2Network;

    //L3网络
    var CreateL3Network = (function () {
        function CreateL3Network(api, zoneMgr, l3Mgr, l2Mgr) {
            var _this = this;
            this.api = api;
            this.zoneMgr = zoneMgr;
            this.l3Mgr = l3Mgr;
            this.l2Mgr = l2Mgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zOneKeyCreateL3Network;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new ML3Network.CreateL3NetworkOptions();
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
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"l3Network.ts.Name" | translate}}:</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"l3Network.ts.Type" | translate}}:</span><span>#: type #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"l3Network.ts.UUID" | translate}}:</span><span>#: uuid #</span></div>'
                };
                $scope.optionsZoneList__ = {
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"l3Network.ts.Name" | translate}}</span>: #: name #</div>' + '<div style="color: black"><span class="z-label">{{"l3Network.ts.State" | translate}}:</span>#: state #</div>' + '<div style="color: black"><span class="z-label">{{"l3Network.ts.UUID" | translate}}:</span> #: uuid #</div>'
                };
                $scope.optionsL3NetworkTypeList__ = {
                    dataSource: new kendo.data.DataSource({data: []}),
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
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid"
                };
                $scope.optionsServiceList__ = {
                    dataSource: new kendo.data.DataSource({data: []})
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
                        types.push({type: item});
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
    MOneKey.CreateL3Network = CreateL3Network;

    //计算机规格
    var CreateInstanceOffering = (function () {
        function CreateInstanceOffering(api, instanceOfferingMgr) {
            var _this = this;
            this.api = api;
            this.instanceOfferingMgr = instanceOfferingMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zOneKeyCreateInstanceOffering;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new MInstanceOffering.CreateInstanceOfferingOptions();
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
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.memorySize) && Utils.notNullnotUndefined(this.cpuNum)
                            && this.isCpuNumValid() && this.isMemoryValid();
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createInstanceOfferingInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createInstanceOfferingInfo';
                    },
                    isCpuNumValid: function () {
                        if (Utils.notNullnotUndefinedNotEmptyString(this.cpuNum)) {
                            return !isNaN(this.cpuNum);
                        }
                        return true;
                    },
                    isMemoryValid: function () {
                        if (Utils.notNullnotUndefinedNotEmptyString(this.memorySize)) {
                            return Utils.isValidSizeStr(this.memorySize);
                        }
                        return true;
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('ioffering');
                        this.memorySize = null;
                        this.cpuNum = null;
                        this.allocatorStrategy = null;
                        this.description = null;
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
                        var resultInstanceOffering;
                        var chain = new Utils.Chain();
                        chain.then(function () {
                            if (Utils.notNullnotUndefined($scope.infoPage.allocatorStrategy) && $scope.infoPage.allocatorStrategy == "") {
                                $scope.infoPage.allocatorStrategy = null;
                            }
                            $scope.infoPage.memorySize = Utils.parseSize($scope.infoPage.memorySize);
                            instanceOfferingMgr.create(infoPage, function (ret) {
                                resultInstanceOffering = ret;
                                chain.next();
                            });
                        }).done(function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(resultInstanceOffering);
                            }
                            $scope.winCreateInstanceOffering__.close();
                        }).start();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage
                ], mediator);
                $scope.winCreateInstanceOfferingOptions__ = {
                    width: '700px',
                    //height: '620px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.allocatorStrategyOptions__ = {
                    dataSource: new kendo.data.DataSource({data: []})
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/instanceOffering/addInstanceOffering.html';
        }

        CreateInstanceOffering.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateInstanceOffering__;
            this.$scope.button.reset();
            this.api.getInstanceOfferingAllocatorStrategies(function (ret) {
                ret.unshift("");
                _this.$scope.allocatorStrategyOptions__.dataSource.data(ret);
                win.center();
                win.open();
            });
        };
        return CreateInstanceOffering;
    }());
    MOneKey.CreateInstanceOffering = CreateInstanceOffering;

    //云盘规格
    var CreateDiskOffering = (function () {
        function CreateDiskOffering(api, diskOfferingMgr) {
            var _this = this;
            this.api = api;
            this.diskOfferingMgr = diskOfferingMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zOneKeyCreateDiskOffering;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new MDiskOffering.CreateDiskOfferingOptions();
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
                    diskSize: null,
                    allocatorStrategy: null,
                    canMoveToPrevious: function () {
                        return false;
                    },
                    canMoveToNext: function () {
                        return Utils.notNullnotUndefined(this.name) && Utils.notNullnotUndefined(this.diskSize);
                    },
                    show: function () {
                        this.getAnchorElement().tab('show');
                    },
                    getAnchorElement: function () {
                        return $('.nav a[data-target="#createDiskOfferingInfo"]');
                    },
                    active: function () {
                        this.activeState = true;
                    },
                    isActive: function () {
                        return this.activeState;
                    },
                    getPageName: function () {
                        return 'createDiskOfferingInfo';
                    },
                    reset: function () {
                        this.name = Utils.shortHashName('diskOffering');
                        this.diskSize = null;
                        this.allocatorStrategy = null;
                        this.description = null;
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
                        var resultDiskOffering;
                        var chain = new Utils.Chain();
                        chain.then(function () {
                            if (Utils.notNullnotUndefined($scope.infoPage.allocatorStrategy) && $scope.infoPage.allocatorStrategy == "") {
                                $scope.infoPage.allocatorStrategy = null;
                            }
                            $scope.infoPage.diskSize = Utils.parseSize($scope.infoPage.diskSize);
                            diskOfferingMgr.create(infoPage, function (ret) {
                                resultDiskOffering = ret;
                                chain.next();
                            });
                        }).done(function () {
                            if (Utils.notNullnotUndefined(_this.options.done)) {
                                _this.options.done(resultDiskOffering);
                            }
                        }).start();
                        $scope.winCreateDiskOffering__.close();
                    }
                };
                $scope.button = new Utils.WizardButton([
                    infoPage
                ], mediator);
                $scope.winCreateDiskOfferingOptions__ = {
                    width: '700px',
                    animation: false,
                    modal: true,
                    draggable: false,
                    resizable: false
                };
                $scope.allocatorStrategyOptions__ = {
                    dataSource: new kendo.data.DataSource({data: []})
                };
                _this.$scope = $scope;
            };
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/diskOffering/addDiskOffering.html';
        }

        CreateDiskOffering.prototype.open = function () {
            var _this = this;
            var win = this.$scope.winCreateDiskOffering__;
            this.$scope.button.reset();
            this.api.getDiskOfferingAllocatorStrategies(function (ret) {
                ret.unshift("");
                _this.$scope.allocatorStrategyOptions__.dataSource.data(ret);
                win.center();
                win.open();
            });
        };
        return CreateDiskOffering;
    }());
    MOneKey.CreateDiskOffering = CreateDiskOffering;

    //云主机
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
                var instanceName = $attrs.zOneKeyCreateVmInstance;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new MVmInstance.CreateVmInstanceOptions();
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
                    dataSource: new kendo.data.DataSource({data: []}),
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
                    dataSource: new kendo.data.DataSource({data: []}),
                    optionLabel: "",
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.NAME" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.HYPERVISOR" | translate}}</span><span>#: hypervisorType #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                $scope.hostOptions__ = {
                    dataSource: new kendo.data.DataSource({data: []}),
                    optionLabel: "",
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.State" | translate}}</span><span>#: state #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.Status" | translate}}</span><span>#: status #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                $scope.instanceOfferingOptions__ = {
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.CPU Number" | translate}}</span><span>#: cpuNum #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.Memory" | translate}}</span><span>#: memorySize #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                $scope.diskOfferingOptions__ = {
                    dataSource: new kendo.data.DataSource({data: []}),
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
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.Disk Size" | translate}}</span><span>#: diskSize #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                $scope.l3NetworkOptions__ = {
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                $scope.defaultL3NetworkOptions__ = {
                    dataSource: new kendo.data.DataSource({data: []}),
                    dataTextField: "name",
                    dataValueField: "uuid",
                    template: '<div style="color: black"><span class="z-label">{{"vm.ts.Name" | translate}}</span><span>#: name #</span></div>' +
                    '<div style="color: black"><span class="z-label">{{"vm.ts.UUID" | translate}}</span><span>#: uuid #</span></div>'
                };
                $scope.imageOptions__ = {
                    dataSource: new kendo.data.DataSource({data: []}),
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
    MOneKey.CreateVmInstance = CreateVmInstance;

    var Controller = (function () {
        function Controller($scope, zoneMgr, clusterMgr, psMgr, l2Mgr, hostMgr, bsMgr, imageMgr, vmMgr, api, $location) {
            var _this = this;
            this.$scope = $scope;
            this.zoneMgr = zoneMgr;
            this.clusterMgr = clusterMgr;
            this.psMgr = psMgr;
            this.l2Mgr = l2Mgr;
            this.hostMgr = hostMgr;
            this.bsMgr = bsMgr;
            this.imageMgr = imageMgr;
            this.vmMgr = vmMgr;
            this.api = api;
            this.$location = $location;
            $scope.funcCreateZone = function (win) {
                $scope.modelCreateZone = new MZone.CreateZoneModel();
                win.center();
                win.open();
            };
            $scope.funcCreateZoneDone = function (win) {
                zoneMgr.create($scope.modelCreateZone, function (ret) {
                    $scope.modelCreateZone.resetCurrent();
                    $scope.optionsZoneGrid.dataSource.insert(0, ret);
                });
                win.close();
            };
            $scope.funcCreateZoneCancel = function (win) {
                win.close();
            };

            //集群
            $scope.funcCreateCluster = function (win) {
                console.info('asdadasdas');
                console.info(win);
                win.open();
            };
            $scope.optionsCreateCluster = {
                done: function (cluster) {
                    console.info('optionsCreateCluster');
                    // $scope.oClusterGrid.add(cluster);
                }
            };

            //主机
            $scope.funcCreateHost = function (win) {
                win.open();
            };
            $scope.optionsCreateHost = {
                done: function (infoPage) {
                    infoPage.uuid = infoPage.resourceUuid = Utils.uuid();
                    infoPage.state = 'Enabled';
                    infoPage.status = 'Connecting';
                    var host = new MHost.Host();
                    angular.extend(host, infoPage);
                    // $scope.oHostGrid.add(host);
                    hostMgr.create(infoPage, function (ret) {
                        // $scope.oHostGrid.refresh();
                    });
                }
            };

            //主存储
            $scope.funcCreatePrimaryStorage = function (win) {
                win.open();
            };
            $scope.optionsCreatePrimaryStorage = {
                done: function (ps) {
                    // $scope.oPrimaryStorageGrid.add(ps);
                }
            };

            //备份存储
            $scope.funcCreateBackupStorage = function (win) {
                win.open();
            };
            $scope.optionsCreateBackupStorage = {
                done: function (data) {
                    var resultBs;
                    var chain = new Utils.Chain();
                    chain.then(function () {
                        var placeHolder = new MBackupStorage.BackupStorage();
                        placeHolder.name = data.info.name;
                        placeHolder.uuid = data.info.resourceUuid = Utils.uuid();
                        placeHolder.state = 'Enabled';
                        placeHolder.status = 'Connecting';
                        // $scope.oBackupStorageGrid.add(placeHolder);
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
                        // $scope.oBackupStorageGrid.refresh();
                    }).start();
                }
            };

            //镜像
            $scope.funcCreateImage = function (win) {
                win.open();
            };
            $scope.optionsCreateImage = {
                done: function (info) {
                    var img = new MImage.Image();
                    info.uuid = Utils.uuid();
                    info.status = 'Downloading';
                    angular.extend(img, info);
                    // $scope.oImageGrid.add(img);
                    imageMgr.create(info, function (ret) {
                        // $scope.oImageGrid.refresh();
                    });
                }
            };

            //L2网络
            $scope.funcCreateL2Network = function (win) {
                win.open();
            };
            $scope.optionsCreateL2Network = {
                done: function (l2) {
                    // $scope.oL2NetworkGrid.add(l2);
                }
            };

            //L3网络
            $scope.funcCreateL3Network = function (win) {
                win.open();
            };
            $scope.optionsCreateL3Network = {
                done: function (l3) {
                    // $scope.oL3NetworkGrid.add(l3);
                }
            };

            //计算机规格
            $scope.funcCreateInstanceOffering = function (win) {
                win.open();
            };
            $scope.optionsCreateInstanceOffering = {
                done: function (instanceOffering) {
                    // $scope.oInstanceOfferingGrid.add(instanceOffering);
                }
            };

            //云盘规格
            $scope.funcCreateDiskOffering = function (win) {
                win.open();
            };
            $scope.optionsCreateDiskOffering = {
                done: function (diskOffering) {
                    // $scope.oDiskOfferingGrid.add(diskOffering);
                }
            };

            //云主机
            $scope.funcCreateVmInstance = function (win) {
                win.open();
            };
            $scope.optionsCreateVmInstance = {
                done: function (info) {
                    var vm = new MVmInstance.VmInstance();
                    info.uuid = info.resourceUuid = Utils.uuid();
                    info.state = 'Starting';
                    angular.extend(vm, info);
                    vm = vmMgr.wrap(vm);
                    // $scope.oVmInstanceGrid.add(vm);
                    vmMgr.create(info, function (ret) {
                        // $scope.oVmInstanceGrid.refresh();
                    });
                }
            };

        }

        return Controller;
    }());
    Controller.$inject = ['$scope', 'ZoneManager', 'ClusterManager', 'PrimaryStorageManager', 'L2NetworkManager', 'HostManager', 'BackupStorageManager', 'ImageManager', 'VmInstanceManager', 'Api', '$location'];

    MOneKey.Controller = Controller;
})(MOneKey || (MOneKey = {}));

angular.module('root')
    .directive('zOneKeyCreateCluster', ['Api', 'ZoneManager', 'ClusterManager', 'PrimaryStorageManager', 'L2NetworkManager',
        function (api, zoneMgr, clusterMgr, psMgr, l2Mgr) {
            return new MOneKey.OnKeyCreateCluster(api, zoneMgr, clusterMgr, psMgr, l2Mgr);
        }])
    .directive('zOneKeyCreateHost', ['Api', 'ZoneManager', 'HostManager', 'ClusterManager', function (api, zoneMgr, hostMgr, clusterMgr) {
        return new MOneKey.CreateHost(api, zoneMgr, hostMgr, clusterMgr);
    }])
    .directive('zOneKeyCreatePrimaryStorage', ['Api', 'ZoneManager', 'PrimaryStorageManager', 'ClusterManager', function (api, zoneMgr, psMgr, clusterMgr) {
        return new MOneKey.CreatePrimaryStorage(api, zoneMgr, psMgr, clusterMgr);
    }])
    .directive('zOneKeyCreateBackupStorage', ['Api', 'BackupStorageManager', 'ZoneManager', function (api, bsMgr, zoneMgr) {
        return new MOneKey.CreateBackupStorage(api, bsMgr, zoneMgr);
    }])
    .directive('zOneKeyCreateImage', ['Api', 'BackupStorageManager', 'ImageManager', function (api, bsMgr, imageMgr) {
        return new MOneKey.CreateImage(api, bsMgr, imageMgr);
    }])
    .directive('zOneKeyCreateL2Network', ['Api', 'ZoneManager', 'L2NetworkManager', 'ClusterManager', function (api, zoneMgr, l2Mgr, clusterMgr) {
        return new MOneKey.CreateL2Network(api, zoneMgr, l2Mgr, clusterMgr);
    }])
    .directive('zOneKeyCreateL3Network', ['Api', 'ZoneManager', 'L3NetworkManager', 'L2NetworkManager', function (api, zoneMgr, l3Mgr, l2Mgr) {
        return new MOneKey.CreateL3Network(api, zoneMgr, l3Mgr, l2Mgr);
    }])
    .directive('zOneKeyCreateInstanceOffering', ['Api', 'InstanceOfferingManager', function (api, instanceOfferingMgr) {
        return new MOneKey.CreateInstanceOffering(api, instanceOfferingMgr);
    }])
    .directive('zOneKeyCreateDiskOffering', ['Api', 'DiskOfferingManager', function (api, diskOfferingMgr) {
        return new MOneKey.CreateDiskOffering(api, diskOfferingMgr);
    }])
    .directive('zOneKeyCreateVmInstance', ['Api', 'VmInstanceManager', 'ClusterManager', 'HostManager',
        'ZoneManager', 'InstanceOfferingManager', 'DiskOfferingManager', 'L3NetworkManager', 'ImageManager',
        function (api, vmMgr, clusterMgr, hostMgr, zoneMgr, instOfferingMgr, diskOfferingMgr, l3Mgr, imageMgr) {
            return new MOneKey.CreateVmInstance(api, vmMgr, clusterMgr, hostMgr, zoneMgr, instOfferingMgr, diskOfferingMgr, l3Mgr, imageMgr);
        }])
    .config(['$routeProvider', function (route) {
        route.when('/onekey', {
            templateUrl: '/static/templates/onekey/onekey.html',
            controller: 'MOneKey.Controller'
        });
    }]);