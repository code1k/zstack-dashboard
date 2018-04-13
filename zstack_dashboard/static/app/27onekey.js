var MOneKey;
(function (MOneKey) {
    var Controller = (function ($scope, zoneMgr, api, $location) {
        var _this = this;
        this.$scope = $scope;
        this.zoneMgr = zoneMgr;
        this.api = api;
        this.$location = $location;
        $scope.funcCreateZone = function (win) {
            $scope.modelCreateZone = new MZone.CreateZoneModel();
            win.center();
            win.open();
        };
        $scope.funcCreateZoneDone = function (win) {
            zoneMgr.create($scope.modelCreateZone, function (ret) {
                $scope.model.resetCurrent();
                $scope.optionsZoneGrid.dataSource.insert(0, ret);
            });
            win.close();
        };
        $scope.funcCreateZoneCancel = function (win) {
            win.close();
        };
    }());
    Controller.$inject = ['$scope', 'ZoneManager', 'Api', '$location'];
    MOneKey.Controller = Controller;
})(MOneKey || (MOneKey = {}));

angular.module('root').config(['$routeProvider', function (route) {
    route.when('/onekey', {
        templateUrl: '/static/templates/onekey/onekey.html',
        controller: 'MOneKey.Controller'
    });
}]);