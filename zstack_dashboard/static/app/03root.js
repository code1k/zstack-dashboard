var MRoot;
(function (MRoot) {
    var Events = (function () {
        function Events() {
        }
        return Events;
    }());
    Events.NOTIFICATION = "root.notification";
    MRoot.Events = Events;
    var ChangePasswordModel = (function () {
        function ChangePasswordModel() {
        }
        ChangePasswordModel.prototype.canChange = function () {
            return angular.equals(this.password, this.repeatPassword) && angular.isDefined(this.password);
        };
        return ChangePasswordModel;
    }());
    MRoot.ChangePasswordModel = ChangePasswordModel;
    var main = (function () {
        function main($scope, $rootScope, api, apiDetails, $location, $cookies, $translate) {
            var _this = this;
            this.$scope = $scope;
            this.$rootScope = $rootScope;
            this.api = api;
            this.apiDetails = apiDetails;
            this.$location = $location;
            this.$cookies = $cookies;
            this.$translate = $translate;
            if (Utils.notNullnotUndefined($cookies.sessionUuid)) {
                var msg = new ApiHeader.APIValidateSessionMsg();
                msg.sessionUuid = $cookies.sessionUuid;
                this.api.syncApi(msg, function (ret) {
                    if (ret.success && ret.validSession) {
                        $rootScope.sessionUuid = $cookies.sessionUuid;
                        $rootScope.loginFlag = true;
                        $location.path("/dashboard");
                    }
                    else {
                        $rootScope.loginFlag = false;
                    }
                });
            }
            $rootScope.instanceConsoles = {};
            $scope.optionsNotification = {
                position: {
                    pinned: true,
                    top: null,
                    left: 20,
                    bottom: 20,
                    right: null
                },
                width: 300,
                templates: [
                    {
                        type: 'success',
                        template: $('#successNotification').html()
                    },
                    {
                        type: 'error',
                        template: $('#errorNotification').html()
                    }
                ]
            };
            $scope.$on(Events.NOTIFICATION, function (e, msg) {
                var type = msg.type;
                if (!Utils.notNullnotUndefined(type)) {
                    type = "success";
                }
                $scope.apiNotification.show(msg, type);
            });
            $rootScope.loginFlag = false;
            $scope.isLogin = function () {
                return $rootScope.loginFlag;
            };
            $scope.$watch(function () {
                return $rootScope.loginFlag;
            }, function () {
                if (!$rootScope.loginFlag) {
                    $location.path("/login");
                }
            });
            $scope.canLogin = function () {
                return Utils.notNullnotUndefined($scope.username) && Utils.notNullnotUndefined($scope.password);
            };
            $scope.getAccountName = function () {
                return $cookies.accountName;
            };
            $scope.getAccountUuid = function () {
                return $cookies.accountUuid;
            };
            $scope.getUserUuid = function () {
                return $cookies.userUuid;
            };
            $scope.changePassword = function (win) {
                $scope.modelChangePassword = new ChangePasswordModel();
                win.center();
                win.open();
            };
            $scope.funcChangePasswordDone = function (win) {
                var msg = new ApiHeader.APIUpdateAccountMsg();
                msg.uuid = $cookies.accountUuid;
                msg.password = CryptoJS.SHA512($scope.modelChangePassword.password).toString();
                _this.api.syncApi(msg, function (ret) {
                    $rootScope.$broadcast(MRoot.Events.NOTIFICATION, {
                        msg: Utils.sprintf('Changed password: {0}', $cookies.accountName)
                    });
                });
                win.close();
            };
            $scope.funcChangePasswordCancel = function (win) {
                win.close();
            };
            $scope.logout = function () {
                var msg = new ApiHeader.APILogOutMsg();
                msg.sessionUuid = $cookies.sessionUuid;
                _this.api.syncApi(msg, function (ret) {
                    $rootScope.loginFlag = false;
                    $rootScope.sessionUuid = null;
                    $cookies.sessionUuid = null;
                    $scope.username = null;
                    $scope.password = null;
                    $location.path("/login");
                    $scope.logInError = false;
                });
            };
            $scope.logInError = false;
            $scope.login = function () {
                var msg = new ApiHeader.APILogInByAccountMsg();
                msg.accountName = $scope.username;
                msg.password = CryptoJS.SHA512($scope.password).toString();
                _this.api.syncApi(msg, function (ret) {
                    if (ret.success) {
                        $rootScope.loginFlag = true;
                        $rootScope.sessionUuid = ret.inventory.uuid;
                        $cookies.sessionUuid = ret.inventory.uuid;
                        $cookies.accountName = $scope.username;
                        $cookies.accountUuid = ret.inventory.accountUuid;
                        $cookies.userUuid = ret.inventory.userUuid;
                        $scope.username = null;
                        $scope.password = null;
                        $location.path("/dashboard");
                        $scope.logInError = false;
                    }
                    else {
                        $scope.logInError = true;
                    }
                });
            };
            $scope.changeLanguage = function (language) {
                switch (language) {
                    case 'English':
                        $translate.use('en_US');
                        break;
                    case 'Chinese (Simplified)':
                        $translate.use('zh_CN');
                        break;
                    case 'Chinese (Traditional)':
                        $translate.use('zh_TW');
                        break;
                }
            };
        }
        return main;
    }());
    main.$inject = ['$scope', '$rootScope', 'Api', 'ApiDetails', '$location', '$cookies', '$translate'];
    MRoot.main = main;
})(MRoot || (MRoot = {}));
