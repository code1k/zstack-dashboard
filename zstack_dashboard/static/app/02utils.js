var Utils;
(function (Utils) {
    var Receipt = (function () {
        function Receipt() {
        }
        return Receipt;
    }());
    var Tag = (function () {
        function Tag(api) {
            this.api = api;
        }
        Tag.prototype.createTag = function (tag, resourceUuid, resourceType, done) {
            var msg = new ApiHeader.APICreateUserTagMsg();
            msg.resourceType = resourceType;
            msg.resourceUuid = resourceUuid;
            msg.tag = tag;
            this.api.asyncApi(msg, function (ret) {
                if (Utils.notNullnotUndefined(done)) {
                    done(ret.inventory);
                }
            });
        };
        Tag.prototype.deleteTag = function (uuid, done) {
            if (done === void 0) { done = null; }
            var msg = new ApiHeader.APIDeleteTagMsg();
            msg.uuid = uuid;
            this.api.asyncApi(msg, function (ret) {
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
            });
        };
        Tag.prototype.queryTag = function (resourceUuid, done) {
            var msg = new ApiHeader.APIQueryUserTagMsg();
            msg.conditions = [{ name: 'resourceUuid', op: '=', value: resourceUuid }];
            this.api.syncApi(msg, function (ret) {
                done(ret.inventories);
            });
        };
        return Tag;
    }());
    Utils.Tag = Tag;
    var Api = (function () {
        function Api($http, $rootScope, $location) {
            //this.debugLogIn();
            var _this = this;
            this.$http = $http;
            this.$rootScope = $rootScope;
            this.$location = $location;
            this.$inject = ['$http', '$rootScope', '$location'];
            this.beforeCallListeners = [];
            this.afterCallListeners = [];
            this.errorCallListeners = [];
            $rootScope.$watch(function () {
                return $rootScope.user;
            }, function () {
                if (Utils.notNullnotUndefined($rootScope.user)) {
                    _this.session = new ApiHeader.SessionInventory();
                    _this.session.uuid = $rootScope.user.sessionUuid;
                }
            });
        }
        Api.prototype.debugLogIn = function (done) {
            var _this = this;
            if (done === void 0) { done = null; }
            var msg = new ApiHeader.APILogInByAccountMsg();
            msg.accountName = 'admin';
            msg.password = 'b109f3bbbc244eb82441917ed06d618b9008dd09b3befd1b5e07394c706a8bb980b1d7785e5976ec049b46df5f1326af5a2ea6d103fd07c95385ffab0cacbc86';
            this.syncCall(msg, function (ret) {
                _this.session = new ApiHeader.SessionInventory();
                _this.session.uuid = ret.inventory.uuid;
                console.log(JSON.stringify(_this.session));
                if (Utils.notNullnotUndefined(done)) {
                    done();
                }
            });
        };
        Api.prototype.getHypervisorTypes = function (done) {
            var msg = new ApiHeader.APIGetHypervisorTypesMsg();
            this.syncApi(msg, function (ret) {
                done(ret.hypervisorTypes);
            });
        };
        Api.prototype.getVolumeFormats = function (done) {
            var msg = new ApiHeader.APIGetVolumeFormatMsg();
            this.syncApi(msg, function (ret) {
                done(ret.formats);
            });
        };
        Api.prototype.getPrimaryStorageTypes = function (done) {
            var msg = new ApiHeader.APIGetPrimaryStorageTypesMsg();
            this.syncApi(msg, function (ret) {
                done(ret.primaryStorageTypes);
            });
        };
        Api.prototype.getL2NetworkTypes = function (done) {
            var msg = new ApiHeader.APIGetL2NetworkTypesMsg();
            this.syncApi(msg, function (ret) {
                done(ret.l2NetworkTypes);
            });
        };
        Api.prototype.getL3NetworkTypes = function (done) {
            var msg = new ApiHeader.APIGetL3NetworkTypesMsg();
            this.syncApi(msg, function (ret) {
                done(ret.l3NetworkTypes);
            });
        };
        Api.prototype.getBackupStorageTypes = function (done) {
            var msg = new ApiHeader.APIGetBackupStorageTypesMsg();
            this.syncApi(msg, function (ret) {
                done(ret.backupStorageTypes);
            });
        };
        Api.prototype.getInstanceOfferingAllocatorStrategies = function (done) {
            var msg = new ApiHeader.APIGetHostAllocatorStrategiesMsg();
            this.syncApi(msg, function (ret) {
                done(ret.hostAllocatorStrategies);
            });
        };
        Api.prototype.getDiskOfferingAllocatorStrategies = function (done) {
            var msg = new ApiHeader.APIGetPrimaryStorageAllocatorStrategiesMsg();
            this.syncApi(msg, function (ret) {
                done(ret.primaryStorageAllocatorStrategies);
            });
        };
        Api.prototype.getVmMigrationCandidateHosts = function (vmUuid, done) {
            var msg = new ApiHeader.APIGetVmMigrationCandidateHostsMsg();
            msg.vmInstanceUuid = vmUuid;
            this.syncApi(msg, function (ret) {
                done(ret.inventories);
            });
        };
        Api.prototype.getDataVolumeAttachableVm = function (volUuid, done) {
            var msg = new ApiHeader.APIGetDataVolumeAttachableVmMsg();
            msg.volumeUuid = volUuid;
            this.syncApi(msg, function (ret) {
                done(ret.inventories);
            });
        };
        Api.prototype.getVmAttachableL3Networks = function (vmUuid, done) {
            var msg = new ApiHeader.APIGetVmAttachableL3NetworkMsg();
            msg.vmInstanceUuid = vmUuid;
            this.syncApi(msg, function (ret) {
                done(ret.inventories);
            });
        };
        Api.prototype.getVmAttachableVolume = function (vmUuid, done) {
            var msg = new ApiHeader.APIGetVmAttachableDataVolumeMsg();
            msg.vmInstanceUuid = vmUuid;
            this.syncApi(msg, function (ret) {
                done(ret.inventories);
            });
        };
        Api.prototype.getMemoryCpuCapacity = function (zoneUuids, clusterUuids, hostUuids, done) {
            var msg = new ApiHeader.APIGetCpuMemoryCapacityMsg();
            msg.zoneUuids = zoneUuids;
            msg.clusterUuids = clusterUuids;
            msg.hostUuids = hostUuids;
            this.syncApi(msg, function (ret) {
                done(ret);
            });
        };
        Api.prototype.getMemoryCpuCapacityByAll = function (done) {
            var msg = new ApiHeader.APIGetCpuMemoryCapacityMsg();
            msg.all = true;
            this.syncApi(msg, function (ret) {
                done(ret);
            });
        };
        Api.prototype.getPirmaryStorageCapacityByAll = function (done) {
            var msg = new ApiHeader.APIGetPrimaryStorageCapacityMsg();
            msg.all = true;
            this.syncApi(msg, function (ret) {
                done(ret);
            });
        };
        Api.prototype.getBackupStorageCapacityByAll = function (done) {
            var msg = new ApiHeader.APIGetBackupStorageCapacityMsg();
            msg.all = true;
            this.syncApi(msg, function (ret) {
                done(ret);
            });
        };
        Api.prototype.getIpAddressCapacityByAll = function (done) {
            var msg = new ApiHeader.APIGetIpAddressCapacityMsg();
            msg.all = true;
            this.syncApi(msg, function (ret) {
                done(ret);
            });
        };
        Api.prototype.getSystemTags = function (resourceType, resourceUuid, done) {
            var msg = new ApiHeader.APIQuerySystemTagMsg();
            msg.conditions = [{
                name: 'resourceType',
                op: '=',
                value: resourceType
            }, {
                name: 'resourceUuid',
                op: '=',
                value: resourceUuid
            }];
            this.syncApi(msg, function (ret) {
                done(ret.inventories);
            });
        };
        Api.prototype.fireAfterListener = function (recepit) {
            angular.forEach(this.afterCallListeners, function (item) {
                item(recepit.request, recepit.rsp);
            });
        };
        Api.prototype.poll = function (receipt, callback, error) {
            var _this = this;
            if (receipt.status == Api.STATUS_DONE) {
                console.log(JSON.stringify(receipt.rsp));
                this.fireAfterListener(receipt);
                var rsp = Utils.firstItem(receipt.rsp);
                if (rsp.success) {
                    callback(rsp);
                }
                else {
                    if (Utils.notNullnotUndefined(error)) {
                        error(rsp);
                    }
                }
                return;
            }
            this.$http.post(Api.QUERY_PATH, receipt.id)
                .success(function (re) {
                    re.request = receipt.request;
                    if (re.status == Api.STATUS_DONE) {
                        console.log(JSON.stringify(re.rsp));
                        _this.fireAfterListener(re);
                        var rsp = Utils.firstItem(re.rsp);
                        if (rsp.success) {
                            callback(rsp);
                        }
                        else {
                            if (Utils.notNullnotUndefined(error)) {
                                error(rsp);
                            }
                        }
                        return;
                    }
                    //TODO: configurable
                    setTimeout(function () {
                        Utils.safeApply(_this.$rootScope, function () {
                            _this.poll(re, callback, error);
                        });
                    }, 1000);
                }).error(function (reason, status) {
                if (error) {
                    error(reason, status);
                }
                _this.fireErrorListener({
                    request: receipt.request,
                    data: reason,
                    status: status
                });
            });
        };
        Api.prototype.fireErrorListener = function (reason) {
            angular.forEach(this.errorCallListeners, function (item) {
                item(reason);
            });
        };
        Api.prototype.asyncCall = function (msg, callback, error) {
            var _this = this;
            msg.session = this.session;
            angular.forEach(this.beforeCallListeners, function (item) {
                item(msg);
            });
            this.$http.post(Api.ASYNC_CALL_PATH, msg.toApiMap())
                .success(function (receipt) {
                    receipt.request = msg;
                    _this.poll(receipt, callback, error);
                }).error(function (reason, status) {
                if (error) {
                    error(reason, status);
                }
                _this.fireErrorListener({
                    request: msg,
                    data: reason,
                    status: status
                });
            });
        };
        Api.prototype.syncCall = function (msg, callback, error) {
            var _this = this;
            msg.session = this.session;
            console.log(JSON.stringify(msg));
            this.$http.post(Api.SYNC_CALL_PATH, msg.toApiMap()).success(function (rsp) {
                var ret = Utils.firstItem(rsp);
                if (!ret.success && notNullnotUndefined(ret.error) && ret.error.code == 'ID.1001') {
                    console.log('authentication error');
                    _this.$location.path('/login');
                    return;
                }
                callback(Utils.firstItem(rsp));
            }).error(function (reason, status) {
                if (error) {
                    error(reason, status);
                }
                _this.fireErrorListener({
                    request: msg,
                    data: reason,
                    status: status
                });
            });
        };
        Api.prototype.syncApi = function (data, callback, error) {
            if (error === void 0) { error = undefined; }
            /*
            if (Utils.notNullnotUndefined(this.session)) {
                this.syncCall(data, callback, error);
            } else {
                this.debugLogIn(()=> {
                    this.syncCall(data, callback, error);
                });
            }
            */
            if (Utils.notNullnotUndefined(this.$rootScope.sessionUuid)) {
                this.session = new ApiHeader.SessionInventory();
                this.session.uuid = this.$rootScope.sessionUuid;
            }
            this.syncCall(data, callback, error);
        };
        Api.prototype.asyncApi = function (data, callback, error) {
            if (error === void 0) { error = undefined; }
            /*
            if (Utils.notNullnotUndefined(this.session)) {
                this.asyncCall(data, callback, error);
            } else {
                this.debugLogIn(()=> {
                    this.asyncCall(data, callback, error);
                });
            }
            */
            if (Utils.notNullnotUndefined(this.$rootScope.sessionUuid)) {
                this.session = new ApiHeader.SessionInventory();
                this.session.uuid = this.$rootScope.sessionUuid;
            }
            this.asyncCall(data, callback, error);
        };
        Api.prototype.installListener = function (before, after, error) {
            if (before === void 0) { before = null; }
            if (after === void 0) { after = null; }
            if (error === void 0) { error = null; }
            if (notNullnotUndefined(before)) {
                this.beforeCallListeners.push(before);
            }
            if (notNullnotUndefined(after)) {
                this.afterCallListeners.push(after);
            }
            if (notNullnotUndefined(error)) {
                this.errorCallListeners.push(error);
            }
        };
        return Api;
    }());
    Api.ASYNC_CALL_PATH = "/api/async";
    Api.SYNC_CALL_PATH = "/api/sync";
    Api.QUERY_PATH = "/api/query";
    Api.STATUS_DONE = 2;
    Api.STATUS_PROCESSING = 1;
    Utils.Api = Api;
    var Chain = (function () {
        function Chain() {
            this.flows = [];
        }
        Chain.prototype.done = function (handler) {
            this.doneHandler = handler;
            return this;
        };
        Chain.prototype.error = function (handler) {
            this.errorHandler = handler;
            return this;
        };
        Chain.prototype.then = function (flow) {
            this.flows.push(flow);
            return this;
        };
        Chain.prototype.next = function () {
            var func = this.flows.shift();
            if (func) {
                func(this);
            }
            else {
                if (Utils.notNullnotUndefined(this.doneHandler)) {
                    this.doneHandler();
                }
            }
        };
        Chain.prototype.fail = function (reason) {
            if (this.errorHandler) {
                this.errorHandler(reason);
            }
        };
        Chain.prototype.start = function () {
            this.next();
        };
        return Chain;
    }());
    Utils.Chain = Chain;
    function periodicalRun(func, interval) {
        var cb = function () {
            if (func()) {
                return;
            }
            setTimeout(cb, interval);
        };
        cb();
    }
    Utils.periodicalRun = periodicalRun;
    function notNullnotUndefined(arg) {
        return angular.isDefined(arg) && arg != null;
    }
    Utils.notNullnotUndefined = notNullnotUndefined;
    function notNullnotUndefinedNotEmptyString(arg) {
        return notNullnotUndefined(arg) && arg != "";
    }
    Utils.notNullnotUndefinedNotEmptyString = notNullnotUndefinedNotEmptyString;
    function firstItem(obj) {
        return obj[Object.keys(obj)[0]];
    }
    Utils.firstItem = firstItem;
    function isEmptyObject(obj) {
        if (!notNullnotUndefined(obj)) {
            return true;
        }
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }
    Utils.isEmptyObject = isEmptyObject;
    function arrayRemoveIndex(arr, index) {
        if (index != -1) {
            arr.splice(index, 1);
        }
    }
    Utils.arrayRemoveIndex = arrayRemoveIndex;
    function safeApply(scope, func) {
        if (!scope.$$phase) {
            scope.$apply(function () {
                func();
            });
        }
        else {
            func();
        }
    }
    Utils.safeApply = safeApply;
    function addCommas(str) {
        return (str + "").replace(/\b(\d+)((\.\d+)*)\b/g, function (a, b, c) {
            return (b.charAt(0) > 0 && !(c || ".").lastIndexOf(".") ? b.replace(/(\d)(?=(\d{3})+$)/g, "$1,") : b) + c;
        });
    }
    Utils.addCommas = addCommas;
    function isValidSizeStr(str) {
        if (angular.isNumber(str)) {
            return true;
        }
        var cpattern = /^[PpTtGgMmKk]$/;
        var npattern = /^[0-9]$/;
        var last = str.slice(-1);
        if (cpattern.test(last)) {
            var size = str.substring(0, str.length - 1);
            return !isNaN(size);
        }
        else if (npattern.test(last)) {
            return !isNaN(str);
        }
        else {
            return false;
        }
    }
    Utils.isValidSizeStr = isValidSizeStr;
    function stringContains(str, tofind) {
        return str.indexOf(tofind) > -1;
    }
    Utils.stringContains = stringContains;
    function isIpv4Address(ip) {
        var pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return pattern.test(ip);
    }
    Utils.isIpv4Address = isIpv4Address;
    function isCharacter(c) {
        var pattern = /^[a-z]$/;
        return pattern.test(c);
    }
    Utils.isCharacter = isCharacter;
    function isValidPort(port) {
        if (isNaN(port)) {
            return false;
        }
        var sport = parseInt(port);
        return sport >= 0 && sport <= 65535;
    }
    Utils.isValidPort = isValidPort;
    function isValidCidr(cidr) {
        var pairs = cidr.split("/");
        if (pairs.length != 2) {
            return false;
        }
        var ip = pairs[0];
        if (!Utils.isIpv4Address(ip)) {
            return false;
        }
        var cidrStr = pairs[1];
        if (isNaN(cidrStr)) {
            return false;
        }
        cidr = parseInt(cidrStr);
        return cidr >= 0 && cidr <= 32;
    }
    Utils.isValidCidr = isValidCidr;
    function shortHashName(prefix) {
        return prefix + '-' + ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).substr(-4);
    }
    Utils.shortHashName = shortHashName;
    function uuid() {
        var dec2hex = [];
        for (var i = 0; i <= 15; i++) {
            dec2hex[i] = i.toString(16);
        }
        return function () {
            var uuid = '';
            for (var i = 1; i <= 36; i++) {
                if (i === 9 || i === 14 || i === 19 || i === 24) {
                    continue;
                }
                else if (i === 15) {
                    uuid += 4;
                }
                else if (i === 20) {
                    uuid += dec2hex[(Math.random() * 4 | 0 + 8)];
                }
                else {
                    uuid += dec2hex[(Math.random() * 15 | 0)];
                }
            }
            return uuid;
        }();
    }
    Utils.uuid = uuid;
    function sprintf(fmt) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return fmt.replace(/{(\d+)}/g, function (match, index) {
            return typeof args[index] != 'undefined'
                ? args[index]
                : "";
        });
    }
    Utils.sprintf = sprintf;
    var K = 1024;
    var M = K * K;
    var G = M * K;
    var T = G * K;
    var P = T * K;
    var sizeMap = {
        'K': K,
        'M': M,
        'G': G,
        'T': T,
        'P': P
    };
    function parseSize(sizeStr) {
        var quantity = sizeStr.substr(sizeStr.length - 1, 1);
        var size = parseInt(sizeStr);
        if (quantity == 'K' || quantity == 'k') {
            return size * K;
        }
        else if (quantity == 'M' || quantity == 'm') {
            return size * M;
        }
        else if (quantity == 'G' || quantity == 'g') {
            return size * G;
        }
        else if (quantity == 'T' || quantity == 't') {
            return size * T;
        }
        else if (quantity == 'P' || quantity == 'p') {
            return size * P;
        }
        else {
            return parseInt(sizeStr);
        }
    }
    Utils.parseSize = parseSize;
    function sizeRoundToString(size) {
        var suffixes = ['P', 'T', 'G', 'M', 'K'];
        function round() {
            var s = suffixes.shift();
            if (!notNullnotUndefined(size)) {
                return sprintf('{0} Bytes', size);
            }
            var q = sizeMap[s];
            var ret = size / q;
            if (ret >= 1) {
                return sprintf('{0} {1}', ret.toFixed(2), s);
            }
            else {
                return round();
            }
        }
        return round();
    }
    Utils.sizeRoundToString = sizeRoundToString;
    function toFixed(num, precision) {
        var multiplier = Math.pow(10, precision + 1), wholeNumber = Math.floor(num * multiplier);
        return Math.round(wholeNumber / 10) * 10 / multiplier;
    }
    Utils.toFixed = toFixed;
    function toSizeString(input) {
        try {
            return Utils.sizeRoundToString(parseInt(input));
        }
        catch (e) {
            return input;
        }
    }
    Utils.toSizeString = toSizeString;
    function toVCPUString(input) {
        return input + ' vCPUs';
    }
    Utils.toVCPUString = toVCPUString;
    function toPercentageString(input) {
        var per = parseFloat(input) * 100;
        var perStr = per.toString();
        if (perStr.length > 5) {
            perStr = perStr.slice(0, 5);
        }
        return Utils.sprintf('{0}%', perStr);
    }
    Utils.toPercentageString = toPercentageString;
    function commaString(input) {
        return Utils.addCommas(input.toString());
    }
    Utils.commaString = commaString;
    var Translator = (function () {
        function Translator($filter) {
            this.$filter = $filter;
        }
        Translator.prototype.addProperty = function (object, key, resourceId) {
            var _this = this;
            Object.defineProperty(object, key, {
                get: function () { return _this.$filter('translate')(resourceId); }
            });
        };
        return Translator;
    }());
    Utils.Translator = Translator;
    var Model = (function () {
        function Model() {
            this.multiSelection = false;
        }
        Model.prototype.resetCurrent = function () {
            this.current = null;
        };
        return Model;
    }());
    Utils.Model = Model;
    var OGrid = (function () {
        function OGrid() {
        }
        OGrid.prototype.setFilter = function (filter) {
            this.grid.dataSource.filter(filter);
        };
        OGrid.prototype.select = function (item) {
            var _this = this;
            var selected = null;
            if (Utils.notNullnotUndefined(item)) {
                selected = item;
            }
            else {
                selected = this.grid.dataSource.data()[0];
            }
            if (selected) {
                if (this.$scope.model.mutliSelection) {
                    selected.forEach(function (m) {
                        var row = _this.grid.table.find('tr[data-uid="' + m.uid + '"]');
                        _this.grid.select(row);
                    });
                }
                else {
                    var row = this.grid.table.find('tr[data-uid="' + selected.uid + '"]');
                    this.grid.select(row);
                }
            }
        };
        OGrid.prototype.refresh = function (data) {
            if (data === void 0) { data = null; }
            if (Utils.notNullnotUndefined(data)) {
                this.grid.dataSource.data(data);
            }
            else {
                this.grid.dataSource.read();
                this.$scope.model.resetCurrent();
            }
        };
        OGrid.prototype.add = function (ps) {
            this.grid.dataSource.insert(0, ps);
        };
        OGrid.prototype.deleteCurrent = function () {
            var _this = this;
            if (this.$scope.model.multiSelection) {
                this.$scope.model.current.forEach(function (m) {
                    var row = _this.grid.dataSource.getByUid(m.uid);
                    _this.grid.dataSource.remove(row);
                });
            }
            else {
                var row = this.grid.dataSource.getByUid(this.$scope.model.current.uid);
                this.grid.dataSource.remove(row);
            }
            this.$scope.model.resetCurrent();
        };
        OGrid.prototype.init = function ($scope, grid) {
            var _this = this;
            this.$scope = $scope;
            this.grid = grid;
            var model = this.$scope.model;
            this.options = {
                resizable: true,
                scrollable: true,
                selectable: true,
                pageable: true,
                dataBound: function (e) {
                    _this.grid = e.sender;
                    if (_this.grid.dataSource.totalPages() <= 1) {
                        _this.grid.pager.element.hide();
                    }
                    if (Utils.notNullnotUndefined(model.current)) {
                        _this.select(model.current);
                    }
                },
                change: function (e) {
                    var selected = _this.grid.select();
                    if (model.multiSelection) {
                        Utils.safeApply($scope, function () {
                            if (!model.current)
                                model.current = [];
                            var idx = model.current.indexOf(_this.grid.dataItem(selected));
                            if (idx < 0)
                                model.current.push(_this.grid.dataItem(selected));
                            else
                                model.current.splice(idx, 1);
                        });
                    }
                    else {
                        Utils.safeApply($scope, function () {
                            model.current = _this.grid.dataItem(selected);
                        });
                    }
                },
                dataSource: new kendo.data.DataSource({
                    serverPaging: true,
                    pageSize: 20,
                    schema: {
                        data: 'data',
                        total: 'total'
                    },
                    transport: {}
                })
            };
        };
        return OGrid;
    }());
    Utils.OGrid = OGrid;
    var WizardButton = (function () {
        function WizardButton(pages, mediator) {
            this.pages = pages;
            this.mediator = mediator;
            this.currentIndex = 0;
        }
        WizardButton.prototype.reset = function () {
            this.currentIndex = 0;
            var fpage = this.pages[0];
            angular.forEach(this.pages, function (page) {
                page.reset();
                if (page != fpage) {
                    var el = page.getAnchorElement();
                    el.removeAttr('data-toggle');
                }
            });
            this.showPage(fpage);
        };
        WizardButton.prototype.canPreviousProceed = function () {
            if (this.currentIndex == 0) {
                return false;
            }
            else {
                var page = this.pages[this.currentIndex];
                return page.canMoveToPrevious();
            }
        };
        WizardButton.prototype.canNextProceed = function () {
            var page = this.pages[this.currentIndex];
            return page.canMoveToNext();
        };
        WizardButton.prototype.isLastPage = function () {
            return this.currentIndex == this.pages.length - 1;
        };
        WizardButton.prototype.showPage = function (page) {
            page.active();
            page.show();
            var el = page.getAnchorElement();
            if (!Utils.notNullnotUndefined(el.attr('data-toggle'))) {
                el.attr('data-toggle', 'tab');
            }
        };
        WizardButton.prototype.previousClick = function () {
            this.currentIndex--;
            var page = this.pages[this.currentIndex];
            this.mediator.movedToPage(page);
            this.showPage(page);
        };
        WizardButton.prototype.nextClick = function () {
            var _this = this;
            if (this.isLastPage()) {
                this.mediator.finish();
                return;
            }
            this.currentIndex++;
            var page = this.pages[this.currentIndex];
            if (Utils.notNullnotUndefined(page.beforeMoveToNext)) {
                page.beforeMoveToNext(function () {
                    _this.mediator.movedToPage(page);
                    _this.showPage(page);
                });
            }
            else {
                this.mediator.movedToPage(page);
                this.showPage(page);
            }
        };
        WizardButton.prototype.nextButtonName = function () {
            if (this.isLastPage()) {
                return this.mediator.finishButtonName();
            }
            else {
                return 'Next';
            }
        };
        WizardButton.prototype.pageClick = function (pageName) {
            for (var i = 0; i < this.pages.length; i++) {
                var page = this.pages[i];
                if (pageName == page.getPageName() && page.isActive()) {
                    page.show();
                    this.currentIndex = i;
                }
            }
        };
        return WizardButton;
    }());
    Utils.WizardButton = WizardButton;
})(Utils || (Utils = {}));
angular.module("app.service", []).factory('Api', ['$http', '$rootScope', '$location', function ($http, $rootScope, $location) {
    return new Utils.Api($http, $rootScope, $location);
}]).factory('Tag', ['Api', function (api) {
    return new Utils.Tag(api);
}]).factory('Translator', ['$filter', function ($filter) {
    return new Utils.Translator($filter);
}]);
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />
/// <reference path="d.ts/zstack.d.ts" />