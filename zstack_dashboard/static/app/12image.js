var MImage;
(function (MImage) {
    var Image = (function (_super) {
        __extends(Image, _super);
        function Image() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Image.prototype.progressOn = function () {
            this.inProgress = true;
        };
        Image.prototype.progressOff = function () {
            this.inProgress = false;
        };
        Image.prototype.isInProgress = function () {
            return this.inProgress;
        };
        Image.prototype.isEnableShow = function () {
            return this.state == 'Disabled' || this.state == 'Maintenance' || this.state == 'PreMaintenance';
        };
        Image.prototype.isDisableShow = function () {
            return this.state == 'Enabled' || this.state == 'Maintenance' || this.state == 'PreMaintenance';
        };
        Image.prototype.isExpungeShow = function () {
            return this.status == 'Deleted';
        };
        Image.prototype.isRecoverShow = function () {
            return this.status == 'Deleted';
        };
        Image.prototype.isDeleteShow = function () {
            return this.status != 'Deleted';
        };
        Image.prototype.stateLabel = function () {
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
        Image.prototype.statusLabel = function () {
            if (this.status == 'Ready') {
                return 'label label-success';
            }
            else {
                return 'label label-default';
            }
        };
        Image.prototype.updateObservableObject = function (inv) {
            // self : ObservableObject
            var self = this;
            self.set('uuid', inv.uuid);
            self.set('name', inv.name);
            self.set('description', inv.description);
            self.set('state', inv.state);
            self.set('status', inv.status);
            self.set('url', inv.url);
            self.set('format', inv.format);
            self.set('mediaType', inv.mediaType);
            self.set('guestOsType', inv.guestOsType);
            self.set('backupStorageRefs', inv.backupStorageRefs);
            self.set('type', inv.type);
            self.set('createDate', inv.createDate);
            self.set('lastOpDate', inv.lastOpDate);
        };
        return Image;
    }(ApiHeader.ImageInventory));
    MImage.Image = Image;
    var ImageManager = (function () {
        function ImageManager(api, $rootScope) {
            this.api = api;
            this.$rootScope = $rootScope;
        }
        ImageManager.prototype.setSortBy = function (sortBy) {
            this.sortBy = sortBy;
        };
        ImageManager.prototype.wrap = function (Image) {
            return new kendo.data.ObservableObject(Image);
        };
        ImageManager.prototype.create = function (image, done) {
            var _this = this;
            var msg = new ApiHeader.APIAddImageMsg();
            if (Utils.notNullnotUndefined(image.resourceUuid)) {
                msg.resourceUuid = image.resourceUuid;
            }
            msg.system = image.system;
            msg.name = image.name;
            msg.description = image.description;
            msg.mediaType = image.mediaType;
            msg.url = image.url;
            msg.format = image.format;
            msg.guestOsType = image.guestOsType;
            msg.backupStorageUuids = image.backupStorageUuids;
            msg.platform = image.platform;
            this.api.asyncApi(msg, function (ret) {
                var c = new Image();
                angular.extend(c, ret.inventory);
                done(_this.wrap(c));
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Added new Image: {0}', c.name),
                    link: Utils.sprintf('/#/image/{0}', c.uuid)
                });
            });
        };
        ImageManager.prototype.query = function (qobj, callback) {
            var _this = this;
            var msg = new ApiHeader.APIQueryImageMsg();
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
                    var c = new Image();
                    angular.extend(c, inv);
                    pris.push(_this.wrap(c));
                });
                callback(pris, ret.total);
            });
        };
        ImageManager.prototype.disable = function (image) {
            var _this = this;
            image.progressOn();
            var msg = new ApiHeader.APIChangeImageStateMsg();
            msg.stateEvent = 'disable';
            msg.uuid = image.uuid;
            this.api.asyncApi(msg, function (ret) {
                image.updateObservableObject(ret.inventory);
                image.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Disabled Image: {0}', image.name),
                    link: Utils.sprintf('/#/image/{0}', image.uuid)
                });
            });
        };
        ImageManager.prototype.enable = function (image) {
            var _this = this;
            image.progressOn();
            var msg = new ApiHeader.APIChangeImageStateMsg();
            msg.stateEvent = 'enable';
            msg.uuid = image.uuid;
            this.api.asyncApi(msg, function (ret) {
                image.updateObservableObject(ret.inventory);
                image.progressOff();
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Enabled Image: {0}', image.name),
                    link: Utils.sprintf('/#/image/{0}', image.uuid)
                });
            });
        };
        ImageManager.prototype["delete"] = function (image, done) {
            var _this = this;
            image.progressOn();
            var msg = new ApiHeader.APIDeleteImageMsg();
            msg.uuid = image.uuid;
            this.api.asyncApi(msg, function (ret) {
                image.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Deleted Image: {0}', image.name)
                });
            });
        };
        ImageManager.prototype.expunge = function (image, done) {
            var _this = this;
            image.progressOn();
            var msg = new ApiHeader.APIExpungeImageMsg();
            msg.imageUuid = image.uuid;
            this.api.asyncApi(msg, function (ret) {
                image.progressOff();
                done(ret);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Expunged Image: {0}', image.name)
                });
            });
        };
        ImageManager.prototype.recover = function (image) {
            var _this = this;
            image.progressOn();
            var msg = new ApiHeader.APIRecoverImageMsg();
            msg.imageUuid = image.uuid;
            this.api.asyncApi(msg, function (ret) {
                image.progressOff();
                image.updateObservableObject(ret.inventory);
                _this.$rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                    msg: Utils.sprintf('Recovered Image: {0}', image.name)
                });
            });
        };
        return ImageManager;
    }());
    ImageManager.$inject = ['Api', '$rootScope'];
    MImage.ImageManager = ImageManager;
    var ImageModel = (function (_super) {
        __extends(ImageModel, _super);
        function ImageModel() {
            var _this = _super.call(this) || this;
            _this.current = new Image();
            return _this;
        }
        return ImageModel;
    }(Utils.Model));
    MImage.ImageModel = ImageModel;
    var OImageGrid = (function (_super) {
        __extends(OImageGrid, _super);
        function OImageGrid($scope, imageMgr) {
            var _this = _super.call(this) || this;
            _this.imageMgr = imageMgr;
            _super.prototype.init.call(_this, $scope, $scope.imageGrid);
            _this.options.columns = [
                {
                    field: 'name',
                    title: '{{"image.ts.NAME" | translate}}',
                    width: '10%',
                    template: '<a href="/\\#/image/{{dataItem.uuid}}">{{dataItem.name}}</a>'
                },
                {
                    field: 'mediaType',
                    title: '{{"image.ts.MEIDA TYPE" | translate}}',
                    width: '15%'
                },
                {
                    field: 'state',
                    title: '{{"image.ts.STATE" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.stateLabel()}}">{{dataItem.state}}</span>'
                },
                {
                    field: 'status',
                    title: '{{"image.ts.STATUS" | translate}}',
                    width: '10%',
                    template: '<span class="{{dataItem.statusLabel()}}">{{dataItem.status}}</span>'
                },
                {
                    field: 'guestOsType',
                    title: '{{"image.ts.GUEST OS" | translate}}',
                    width: '15%'
                },
                {
                    field: 'size',
                    title: '{{"image.ts.SIZE" | translate}}',
                    width: '10%',
                    template: '<span>{{dataItem.size | size}}</span>'
                },
                {
                    field: 'format',
                    title: '{{"image.ts.FORMAT" | translate}}',
                    width: '10%'
                },
                {
                    field: 'uuid',
                    title: '{{"image.ts.UUID" | translate}}',
                    width: '20%'
                }
            ];
            _this.options.dataSource.transport.read = function (options) {
                var qobj = new ApiHeader.QueryObject();
                qobj.limit = options.data.take;
                qobj.start = options.data.pageSize * (options.data.page - 1);
                imageMgr.query(qobj, function (images, total) {
                    options.success({
                        data: images,
                        total: total
                    });
                });
            };
            return _this;
        }
        return OImageGrid;
    }(Utils.OGrid));
    var Action = (function () {
        function Action($scope, imageMgr) {
            this.$scope = $scope;
            this.imageMgr = imageMgr;
        }
        Action.prototype.enable = function () {
            this.imageMgr.enable(this.$scope.model.current);
        };
        Action.prototype.disable = function () {
            this.imageMgr.disable(this.$scope.model.current);
        };
        Action.prototype.recover = function () {
            this.imageMgr.recover(this.$scope.model.current);
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
                            name: '{{"image.ts.None" | translate}}',
                            value: FilterBy.NONE
                        },
                        {
                            name: '{{"image.ts.State" | translate}}',
                            value: FilterBy.STATE
                        },
                        {
                            name: '{{"image.ts.Status" | translate}}',
                            value: FilterBy.STATUS
                        },
                        {
                            name: '{{"image.ts.MediaType" | translate}}',
                            value: FilterBy.TYPE
                        },
                        {
                            name: '{{"image.ts.Format" | translate}}',
                            value: FilterBy.FORMAT
                        },
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
                    _this.valueList.dataSource.data(['Creating', 'Downloading', 'Ready']);
                }
                else if (_this.field == FilterBy.STATE) {
                    _this.valueList.dataSource.data(['Enabled', 'Disabled']);
                }
                else if (_this.field == FilterBy.FORMAT) {
                    _this.valueList.dataSource.data('qcow2', 'raw', 'simulator');
                }
                else if (_this.field == FilterBy.TYPE) {
                    _this.valueList.dataSource.data(['RootVolumeTemplate', 'DataVolumeTemplate', 'ISO']);
                }
            });
        }
        FilterBy.prototype.confirm = function (popover) {
            this.$scope.oImageGrid.setFilter(this.toKendoFilter());
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
    FilterBy.TYPE = 'mediaType';
    FilterBy.FORMAT = 'format';
    var DetailsController = (function () {
        function DetailsController($scope, imageMgr, $routeParams, tagService, current, bsMgr) {
            var _this = this;
            this.$scope = $scope;
            this.imageMgr = imageMgr;
            this.$routeParams = $routeParams;
            this.tagService = tagService;
            $scope.model = new ImageModel();
            $scope.model.current = current;
            $scope.funcDeleteImage = function (win) {
                win.open();
            };
            $scope.funcExpungeImage = function (win) {
                win.open();
            };
            $scope.action = new Action($scope, imageMgr);
            $scope.funcRefresh = function () {
                _this.loadSelf($scope.model.current.uuid);
            };
            $scope.funcToolbarShow = function () {
                return Utils.notNullnotUndefined($scope.model.current);
            };
            $scope.optionsDeleteImage = {
                title: 'DELETE IMAGE',
                width: '350px',
                btnType: 'btn-danger',
                description: function () {
                    return $scope.model.current.name;
                },
                confirm: function () {
                    imageMgr["delete"]($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsExpungeImage = {
                title: 'EXPUNGE IMAGE',
                width: '350px',
                btnType: 'btn-danger',
                description: function () {
                    return $scope.model.current.name;
                },
                confirm: function () {
                    imageMgr.expunge($scope.model.current, function (ret) {
                        $scope.model.resetCurrent();
                    });
                }
            };
            $scope.optionsTag = {
                tags: [],
                createTag: function (item) {
                    _this.tagService.createTag(item.tag, $scope.model.current.uuid, ApiHeader.TagResourceTypeImageVO, function (ret) {
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
            $scope.optionsBackupStorageGrid = {
                pageSize: 20,
                resizable: true,
                scrollable: true,
                pageable: true,
                columns: [
                    {
                        field: 'name',
                        title: '{{"image.ts.BACKUP STORAGE NAME" | translate}}',
                        width: '20%',
                        template: '<a href="/\\#/backupStorage/{{dataItem.bsUuid}}">{{dataItem.name}}</a>'
                    },
                    {
                        field: 'installPath',
                        title: '{{"image.ts.INSTALL PATH" | translate}}',
                        width: '80%'
                    }
                ],
                dataBound: function (e) {
                    var grid = e.sender;
                    if (grid.dataSource.totalPages() <= 1) {
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
                            var chain = new Utils.Chain();
                            var bss = [];
                            var refs = [];
                            chain.then(function () {
                                var bsUuids = [];
                                angular.forEach(current.backupStorageRefs, function (it) {
                                    bsUuids.push(it.backupStorageUuid);
                                });
                                var qobj = new ApiHeader.QueryObject();
                                qobj.limit = options.data.take;
                                qobj.start = options.data.pageSize * (options.data.page - 1);
                                qobj.addCondition({
                                    name: 'uuid',
                                    op: 'in',
                                    value: bsUuids.join()
                                });
                                bsMgr.query(qobj, function (ret, total) {
                                    bss = ret;
                                    chain.next();
                                });
                            }).then(function () {
                                angular.forEach(current.backupStorageRefs, function (it) {
                                    for (var i = 0; i < bss.length; i++) {
                                        if (it.backupStorageUuid == bss[i].uuid) {
                                            var bs = bss[i];
                                            break;
                                        }
                                    }
                                    refs.push({
                                        name: bs.name,
                                        bsUuid: bs.uuid,
                                        installPath: it.installPath
                                    });
                                });
                                chain.next();
                            }).done(function () {
                                options.success({
                                    data: refs,
                                    total: refs.length
                                });
                            }).start();
                        }
                    }
                })
            };
        }
        DetailsController.prototype.loadSelf = function (uuid) {
            var _this = this;
            var qobj = new ApiHeader.QueryObject();
            qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
            this.imageMgr.query(qobj, function (images, total) {
                _this.$scope.model.current = images[0];
            });
        };
        return DetailsController;
    }());
    DetailsController.$inject = ['$scope', 'ImageManager', '$routeParams', 'Tag', 'current', 'BackupStorageManager'];
    MImage.DetailsController = DetailsController;
    var Controller = (function () {
        function Controller($scope, imageMgr, hypervisorTypes, $location) {
            this.$scope = $scope;
            this.imageMgr = imageMgr;
            this.hypervisorTypes = hypervisorTypes;
            this.$location = $location;
            $scope.model = new ImageModel();
            $scope.oImageGrid = new OImageGrid($scope, imageMgr);
            $scope.action = new Action($scope, imageMgr);
            $scope.optionsSortBy = {
                fields: [
                    {
                        name: '{{"image.ts.Name" | translate}}',
                        value: 'name'
                    },
                    {
                        name: '{{"image.ts.Description" | translate}}',
                        value: 'Description'
                    },
                    {
                        name: '{{"image.ts.State" | translate}}',
                        value: 'state'
                    },
                    {
                        name: '{{"image.ts.Status" | translate}}',
                        value: 'status'
                    },
                    {
                        name: '{{"image.ts.Hypervisor" | translate}}',
                        value: 'hypervisorType'
                    },
                    {
                        name: '{{"image.ts.Bits" | translate}}',
                        value: 'bits'
                    },
                    {
                        name: '{{"image.ts.Format" | translate}}',
                        value: 'format'
                    },
                    {
                        name: '{{"image.ts.Size" | translate}}',
                        value: 'size'
                    },
                    {
                        name: '{{"image.ts.Guest OS Type" | translate}}',
                        value: 'guestOsType'
                    },
                    {
                        name: '{{"image.ts.Created Date" | translate}}',
                        value: 'createDate'
                    },
                    {
                        name: '{{"image.ts.None" | translate}}',
                        value: 'lastOpDate'
                    }
                ],
                done: function (ret) {
                    imageMgr.setSortBy(ret);
                    $scope.oImageGrid.refresh();
                }
            };
            $scope.optionsSearch = {
                fields: ApiHeader.ImageInventoryQueryable,
                name: 'Image',
                schema: {
                    state: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['Enabled', 'Disabled']
                    },
                    status: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['Creating', 'Downloading', 'Ready']
                    },
                    hypervisorType: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: this.hypervisorTypes
                    },
                    format: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['Template', 'ISO']
                    },
                    bits: {
                        type: Directive.SearchBoxSchema.VALUE_TYPE_LIST,
                        list: ['64', '32']
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
                    imageMgr.query(qobj, function (Images, total) {
                        $scope.oImageGrid.refresh(Images);
                    });
                }
            };
            $scope.funcGridDoubleClick = function (e) {
                if (Utils.notNullnotUndefined($scope.model.current)) {
                    var url = Utils.sprintf('/image/{0}', $scope.model.current.uuid);
                    $location.path(url);
                    e.preventDefault();
                }
            };
            $scope.filterBy = new FilterBy($scope, this.hypervisorTypes);
            $scope.funcSearch = function (win) {
                win.open();
            };
            $scope.funcCreateImage = function (win) {
                win.open();
            };
            $scope.funcDeleteImage = function (win) {
                win.open();
            };
            $scope.funcExpungeImage = function (win) {
                win.open();
            };
            $scope.optionsDeleteImage = {
                title: 'DELETE IMAGE',
                width: '350px',
                btnType: 'btn-danger',
                description: function () {
                    return $scope.model.current.name;
                },
                confirm: function () {
                    imageMgr["delete"]($scope.model.current, function (ret) {
                        $scope.oImageGrid.deleteCurrent();
                    });
                }
            };
            $scope.optionsExpungeImage = {
                title: 'EXPUNGE IMAGE',
                width: '350px',
                btnType: 'btn-danger',
                description: function () {
                    return $scope.model.current.name;
                },
                confirm: function () {
                    imageMgr.expunge($scope.model.current, function (ret) {
                        $scope.oImageGrid.deleteCurrent();
                    });
                }
            };
            $scope.funcRefresh = function () {
                $scope.oImageGrid.refresh();
            };
            $scope.funcIsActionShow = function () {
                return !Utils.isEmptyObject($scope.model.current);
            };
            $scope.funcIsActionDisabled = function () {
                return Utils.notNullnotUndefined($scope.model.current) && $scope.model.current.isInProgress();
            };
            $scope.optionsCreateImage = {
                done: function (info) {
                    var img = new Image();
                    info.uuid = Utils.uuid();
                    info.status = 'Downloading';
                    angular.extend(img, info);
                    $scope.oImageGrid.add(img);
                    imageMgr.create(info, function (ret) {
                        $scope.oImageGrid.refresh();
                    });
                }
            };
        }
        return Controller;
    }());
    Controller.$inject = ['$scope', 'ImageManager', 'hypervisorTypes', '$location'];
    MImage.Controller = Controller;
    var CreateImageOptions = (function () {
        function CreateImageOptions() {
        }
        return CreateImageOptions;
    }());
    MImage.CreateImageOptions = CreateImageOptions;
    var CreateImageModel = (function () {
        function CreateImageModel() {
        }
        CreateImageModel.prototype.canCreate = function () {
            return angular.isDefined(this.name) && angular.isDefined(this.hypervisorType) &&
                angular.isDefined(this.format) && Utils.notNullnotUndefined(this.backupStorageUuid);
        };
        return CreateImageModel;
    }());
    MImage.CreateImageModel = CreateImageModel;
    var CreateImage = (function () {
        function CreateImage(api, bsMgr, imageMgr) {
            var _this = this;
            this.api = api;
            this.bsMgr = bsMgr;
            this.imageMgr = imageMgr;
            this.scope = true;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zCreateImage;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                _this.options = new CreateImageOptions();
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
                    dataSource: new kendo.data.DataSource({ data: [] }),
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
    MImage.CreateImage = CreateImage;
})(MImage || (MImage = {}));
angular.module('root').factory('ImageManager', ['Api', '$rootScope', function (api, $rootScope) {
    return new MImage.ImageManager(api, $rootScope);
}]).directive('zCreateImage', ['Api', 'BackupStorageManager', 'ImageManager', function (api, bsMgr, imageMgr) {
    return new MImage.CreateImage(api, bsMgr, imageMgr);
}]).config(['$routeProvider', function (route) {
    route.when('/image', {
        templateUrl: '/static/templates/image/image.html',
        controller: 'MImage.Controller',
        resolve: {
            hypervisorTypes: function ($q, Api) {
                var defer = $q.defer();
                Api.getHypervisorTypes(function (hypervisorTypes) {
                    defer.resolve(hypervisorTypes);
                });
                return defer.promise;
            }
        }
    }).when('/image/:uuid', {
        templateUrl: '/static/templates/image/details.html',
        controller: 'MImage.DetailsController',
        resolve: {
            current: function ($q, $route, ImageManager) {
                var defer = $q.defer();
                var qobj = new ApiHeader.QueryObject();
                var uuid = $route.current.params.uuid;
                qobj.addCondition({ name: 'uuid', op: '=', value: uuid });
                ImageManager.query(qobj, function (images) {
                    var image = images[0];
                    defer.resolve(image);
                });
                return defer.promise;
            }
        }
    });
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />