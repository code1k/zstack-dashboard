var MNav;
(function (MNav) {
    var Controller = (function () {
        function Controller($scope, api) {
            var _this = this;
            this.$scope = $scope;
            this.api = api;
            this.pendingRequestNum = 0;
            this.zstackVersion = '';
            api.installListener(function (msg) {
                _this.pendingRequestNum++;
            }, function (msg, ret) {
                _this.decrease();
            }, function (msg, reason) {
                _this.decrease();
            });
            $scope.funcIsProcessing = function () {
                return _this.pendingRequestNum > 0;
            };
            $scope.funcPendingRequestNum = function () {
                return _this.pendingRequestNum;
            };
            $scope.getZStackVersion = function () {
                return _this.zstackVersion;
            };
            $scope.$watch(function () {
                return _this.zstackVersion;
            }, function () {
                if (_this.zstackVersion == '') {
                    var msgVerSion = new ApiHeader.APIGetVersionMsg();
                    _this.api.syncApi(msgVerSion, function (ret) {
                        _this.zstackVersion = ret.version;
                    });
                }
            });
        }
        Controller.prototype.decrease = function () {
            this.pendingRequestNum--;
            if (this.pendingRequestNum <= 0) {
                this.pendingRequestNum = 0;
            }
        };
        return Controller;
    }());
    Controller.$inject = ['$scope', 'Api'];
    MNav.Controller = Controller;
})(MNav || (MNav = {}));
/// <reference path="d.ts/angularjs/angular.d.ts" />
/// <reference path="d.ts/kendo.all.d.ts" />