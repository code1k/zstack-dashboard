var Directive;
(function (Directive) {
    var PanelHeaderIn = (function () {
        function PanelHeaderIn() {
            this.scope = false;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var collapse = $element.find('.collapse');
                var i = $element.find('i.z-collapse');
                collapse.on('show.bs.collapse', function () {
                    $scope.$apply(function () {
                        i.removeClass('fa fa-chevron-right');
                        i.addClass('fa fa-chevron-down');
                    });
                });
                collapse.on('hide.bs.collapse', function () {
                    i.removeClass('fa fa-chevron-down');
                    i.addClass('fa fa-chevron-right');
                });
            };
            this.restrict = 'EA';
            this.replace = false;
        }
        return PanelHeaderIn;
    }());
    Directive.PanelHeaderIn = PanelHeaderIn;
    var PopoverImpl = (function () {
        function PopoverImpl($scope, $attrs, $element) {
            this.$scope = $scope;
            this.$attrs = $attrs;
            this.$element = $element;
            this.isOpen = false;
            this.id = '#' + $attrs.id;
            if (Utils.notNullnotUndefined($attrs.zOptions)) {
                this.options = $scope[$attrs.zOptions];
            }
            else {
                this.options = {
                    html: true,
                    trigger: 'click',
                    placement: 'bottom',
                    container: 'body'
                };
            }
            var contentId = $attrs.zContentId;
            var content = $element.parent().find('#' + contentId);
            content.hide();
            this.options.content = function () {
                content.show();
                return content;
            };
            this.popover = $(this.id);
            this.popover.popover(this.options);
        }
        PopoverImpl.prototype.toggle = function () {
            if (!this.isOpen) {
                this.popover.popover('show');
            }
            else {
                this.popover.popover('hide');
            }
            this.isOpen = !this.isOpen;
        };
        return PopoverImpl;
    }());
    var Popover = (function () {
        function Popover() {
            this.scope = true;
            this.restrict = 'EA';
            this.replace = false;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var parent = $scope.$parent;
                parent[$attrs.zPopover] = new PopoverImpl($scope, $attrs, $element);
            };
        }
        return Popover;
    }());
    Directive.Popover = Popover;
    var SearchBoxSchema = (function () {
        function SearchBoxSchema() {
        }
        return SearchBoxSchema;
    }());
    SearchBoxSchema.VALUE_TYPE_TEXT = "text";
    SearchBoxSchema.VALUE_TYPE_LIST = "list";
    SearchBoxSchema.VALUE_TYPE_TIMESTAMP = "timeStamp";
    Directive.SearchBoxSchema = SearchBoxSchema;
    var SearchCondition = (function () {
        function SearchCondition() {
        }
        SearchCondition.prototype.equals = function (obj) {
            return obj.name === this.name && obj.op === this.op && obj.value === this.value;
        };
        SearchCondition.prototype.setListValue = function (val) {
            this.type = SearchBoxSchema.VALUE_TYPE_LIST;
            this.listValue = val;
        };
        SearchCondition.prototype.setTextValue = function (val) {
            this.type = SearchBoxSchema.VALUE_TYPE_TEXT;
            this.value = val;
        };
        SearchCondition.prototype.setDateTimeValue = function (val) {
            this.type = SearchBoxSchema.VALUE_TYPE_TIMESTAMP;
            this.value = val;
        };
        SearchCondition.prototype.toQueryCondition = function () {
            var ret = new ApiHeader.QueryCondition();
            ret.name = this.name;
            ret.op = this.op;
            if (this.type == SearchBoxSchema.VALUE_TYPE_TEXT) {
                ret.value = this.value;
            }
            else if (this.type == SearchBoxSchema.VALUE_TYPE_LIST) {
                ret.value = this.listValue;
            }
            else if (this.type == SearchBoxSchema.VALUE_TYPE_TIMESTAMP) {
                ret.value = this.dateTimeValue;
            }
            return ret;
        };
        SearchCondition.prototype.hasValue = function () {
            if (this.type == SearchBoxSchema.VALUE_TYPE_TEXT) {
                return Utils.notNullnotUndefined(this.value);
            }
            else if (this.type == SearchBoxSchema.VALUE_TYPE_LIST) {
                return Utils.notNullnotUndefined(this.listValue);
            }
            else if (this.type == SearchBoxSchema.VALUE_TYPE_TIMESTAMP) {
                return Utils.notNullnotUndefined(this.dateTimeValue);
            }
        };
        return SearchCondition;
    }());
    var SearchBox = (function () {
        function SearchBox($compile) {
            var _this = this;
            this.$compile = $compile;
            this.conditions = {};
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/directives/search.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var instanceName = $attrs.zSearch;
                var parentScope = $scope.$parent;
                parentScope[instanceName] = _this;
                var options = parentScope[$attrs.zOptions];
                _this.$scope = $scope;
                _this.options = options;
                $scope.currentCondition = new SearchCondition();
                $scope.funcValueShow = function (type) {
                    var schema = _this.getSchema();
                    if (!Utils.notNullnotUndefined(schema)) {
                        return type == SearchBoxSchema.VALUE_TYPE_TEXT;
                    }
                    return schema.type == type;
                };
                $scope.valueListOptions__ = {};
                $scope.name = options.name;
                $scope.funcCancel = function () {
                    $scope.winSearch__.close();
                };
                $scope.funcSearch = function () {
                    var ret = [];
                    var tmp = {};
                    angular.forEach(_this.conditions, function (cond) {
                        if (cond.op != 'in' && cond.op != 'not in') {
                            if (cond.op == 'like' || cond.op == 'not like') {
                                cond.value = '%' + cond.value + '%';
                            }
                            ret.push(cond);
                        }
                        else {
                            var queue = tmp[cond.name];
                            if (!Utils.notNullnotUndefined(queue)) {
                                queue = {};
                                tmp[cond.name] = queue;
                            }
                            if (cond.op == 'in') {
                                var inq = queue['in'];
                                if (!Utils.notNullnotUndefined(inq)) {
                                    inq = [];
                                    queue['in'] = inq;
                                }
                                inq.push(cond.value);
                            }
                            else {
                                var notinq = queue['not in'];
                                if (!Utils.notNullnotUndefined(notinq)) {
                                    notinq = [];
                                    queue['not in'] = notinq;
                                }
                                notinq.push(cond.value);
                            }
                        }
                    });
                    for (var k in tmp) {
                        var queue = tmp[k];
                        var inq = queue['in'];
                        if (Utils.notNullnotUndefined(inq)) {
                            ret.push({
                                name: k,
                                op: 'in',
                                value: inq.join()
                            });
                        }
                        var notinq = queue['not in'];
                        if (Utils.notNullnotUndefined(notinq)) {
                            ret.push({
                                name: k,
                                op: 'not in',
                                value: notinq.join()
                            });
                        }
                    }
                    if (Utils.notNullnotUndefined(_this.options.done)) {
                        _this.options.done(ret);
                    }
                    $scope.winSearch__.close();
                };
                $scope.funcCanAdd = function () {
                    if ($scope.currentCondition.op != 'is null' && $scope.currentCondition.op != 'is not null') {
                        return Utils.notNullnotUndefined($scope.currentCondition.name) && Utils.notNullnotUndefined($scope.currentCondition.op)
                            && $scope.currentCondition.hasValue();
                    }
                    else {
                        return Utils.notNullnotUndefined($scope.currentCondition.name) && Utils.notNullnotUndefined($scope.currentCondition.op);
                    }
                };
                $scope.funcCanConditionsShow = function () {
                    return !Utils.isEmptyObject(_this.conditions);
                };
                $scope.duplicateCondition = false;
                $scope.funcAddCondition = function () {
                    $scope.duplicateCondition = false;
                    var cur = $scope.currentCondition;
                    for (var k in _this.conditions) {
                        var c = _this.conditions[k];
                        if (c.name == cur.name && c.op == cur.op && c.value == cur.value) {
                            $scope.duplicateCondition = true;
                            return;
                        }
                    }
                    _this.conditions[Utils.uuid()] = $scope.currentCondition.toQueryCondition();
                    _this.newCurrentCondition();
                };
                $scope.optionsSearch__ = {
                    width: "680px",
                    animation: false,
                    resizable: false
                };
                $scope.valueTimestampOptions__ = {
                    value: null,
                    format: 'yyyy-MM-dd HH:mm:ss',
                    timeFormat: "HH:mm"
                };
                $scope.valueListOptions__ = {
                    dataSource: {
                        data: []
                    }
                };
                var fieldNames = [];
                fieldNames = fieldNames.concat(options.fields);
                fieldNames.push(SearchBox.USER_TAG_CONDITION_NAME);
                _this.fieldNames = fieldNames;
                $scope.optionsField = {
                    dataSource: new kendo.data.DataSource({
                        data: fieldNames
                    }),
                    change: function (e) {
                        var list = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.currentCondition.name = list.value();
                            if ($scope.currentCondition.name === SearchBox.USER_TAG_CONDITION_NAME) {
                                $scope.optionsOp.setData(SearchBox.TAG_OPS);
                            }
                            else {
                                $scope.optionsOp.setData(SearchBox.OPS);
                            }
                            var schema = _this.getSchema();
                            if (!Utils.notNullnotUndefined(schema) || schema.type == SearchBoxSchema.VALUE_TYPE_TEXT) {
                                $scope.currentCondition.setTextValue($scope.currentCondition.value);
                            }
                            else if (schema.type == SearchBoxSchema.VALUE_TYPE_LIST) {
                                $scope.valueList__.dataSource.data(schema.list);
                                $scope.currentCondition.setListValue(schema.list[0]);
                            }
                            else if (schema.type == SearchBoxSchema.VALUE_TYPE_TIMESTAMP) {
                                $scope.currentCondition.setDateTimeValue($scope.currentCondition.dateTimeValue);
                            }
                        });
                    }
                };
                $scope.optionsOp = {
                    dataSource: new kendo.data.DataSource({
                        data: SearchBox.OPS
                    }),
                    setData: function (data) {
                        $scope.optionsOp.dataSource.data(data);
                        $scope.currentCondition.op = data[0];
                    },
                    change: function (e) {
                        var list = e.sender;
                        Utils.safeApply($scope, function () {
                            $scope.currentCondition.op = list.value();
                        });
                    }
                };
                $scope.$watch(function () {
                    return _this.conditions;
                }, function () {
                    for (var k in _this.conditions) {
                        var c = _this.conditions[k];
                        if (c.op != '=') {
                            continue;
                        }
                        var schema = _this.options.schema[c.name];
                        if (!Utils.notNullnotUndefined(schema)) {
                            continue;
                        }
                        if (!Utils.notNullnotUndefined(schema.getQueryableFields)) {
                            continue;
                        }
                        var newFieldNames = [];
                        newFieldNames = newFieldNames.concat(schema.getQueryableFields(c.value));
                        newFieldNames.push(SearchBox.USER_TAG_CONDITION_NAME);
                        $scope.optionsField.dataSource.data(newFieldNames);
                        return;
                    }
                    $scope.optionsField.dataSource.data(fieldNames);
                    if (Utils.notNullnotUndefined($scope.fieldCombo__)) {
                        $scope.fieldCombo__.value(fieldNames[0]);
                    }
                }, true);
                $scope.funcRemoveCondition = function (uuid) {
                    var cond = _this.conditions[uuid];
                    var schema = _this.options.schema[cond.name];
                    if (!Utils.notNullnotUndefined(schema) || !Utils.notNullnotUndefined(schema.removeCascade)) {
                        delete _this.conditions[uuid];
                        return;
                    }
                    for (var k in schema.removeCascade) {
                        if (k != cond.name) {
                            continue;
                        }
                        angular.forEach(schema.removeCascade[k], function (cascadeField) {
                            for (var ck in _this.conditions) {
                                var cv = _this.conditions[ck];
                                if (cv.name == cascadeField) {
                                    delete _this.conditions[ck];
                                }
                            }
                        });
                    }
                    delete _this.conditions[uuid];
                };
                var conditionTable = $element.find('#conditionTable');
                $scope.$watch(function () {
                    return _this.conditions;
                }, function () {
                    angular.forEach(conditionTable.children(), function (child) {
                        child.remove();
                    });
                    if (Utils.isEmptyObject(_this.conditions)) {
                        return;
                    }
                    var header = '<tr><th class="z-label">CONDITIONS</th><th></th></tr>';
                    header = $compile(header)($scope);
                    conditionTable.append(header);
                    angular.forEach(_this.conditions, function (cond, uuid) {
                        var tr = '<tr>'
                            + '<td>'
                            + '<span class="z-search-condition">' + cond.name + '</span>'
                            + '<span class="z-search-condition">' + cond.op + '</span>'
                            + '<span class="z-search-condition">' + cond.value + '</span>'
                            + '</td>'
                            + '<td><button type="button" class="btn btn-xs btn-danger pull-right" ng-click="funcRemoveCondition(\'' + uuid + '\')"><i class="fa fa-minus"></i></button></td>'
                            + '</tr>';
                        tr = $compile(tr)($scope);
                        conditionTable.append(tr);
                    });
                }, true);
            };
        }
        SearchBox.prototype.newCurrentCondition = function () {
            this.$scope.currentCondition = new SearchCondition();
            this.$scope.currentCondition.name = this.$scope.fieldCombo__.value();
            this.$scope.currentCondition.op = this.$scope.opDropdown__.value();
            var schema = this.getSchema();
            if (Utils.notNullnotUndefined(schema)) {
                if (schema.type == SearchBoxSchema.VALUE_TYPE_LIST) {
                    this.$scope.currentCondition.setListValue(this.$scope.valueList__.value());
                }
                else if (schema.type == SearchBoxSchema.VALUE_TYPE_TIMESTAMP) {
                    this.$scope.valueDateTime__.value(null);
                    this.$scope.currentCondition.setDateTimeValue(null);
                }
                else {
                    this.$scope.currentCondition.setTextValue(null);
                }
            }
            else {
                this.$scope.currentCondition.setTextValue(null);
            }
        };
        SearchBox.prototype.open = function () {
            this.conditions = {};
            this.newCurrentCondition();
            this.$scope.optionsField.dataSource.data(this.fieldNames);
            this.$scope.fieldCombo__.value(this.fieldNames[0]);
            this.$scope.winSearch__.center();
            this.$scope.winSearch__.open();
        };
        SearchBox.prototype.getSchema = function () {
            return this.options.schema[this.$scope.currentCondition.name];
        };
        return SearchBox;
    }());
    SearchBox.OPS = ["=", "!=", ">", "<", ">=", "<=", "in", "not in", "is null", "is not null", "like", "not like"];
    SearchBox.TAG_OPS = ['in', 'not in'];
    SearchBox.USER_TAG_CONDITION_NAME = '__userTag__';
    Directive.SearchBox = SearchBox;
    var GridDoubleClick = (function () {
        function GridDoubleClick() {
            this.scope = false;
            this.restrict = 'EA';
            this.replace = false;
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                var method = $scope[$attrs.zGridDoubleClick];
                var grid = $($element);
                grid.delegate("tbody>tr", "dblclick", function (e) {
                    Utils.safeApply($scope, function () {
                        if (Utils.notNullnotUndefined(method)) {
                            method(e);
                        }
                    });
                });
            };
        }
        return GridDoubleClick;
    }());
    Directive.GridDoubleClick = GridDoubleClick;
    var SortByData = (function () {
        function SortByData() {
        }
        SortByData.prototype.isValid = function () {
            return Utils.notNullnotUndefined(this.field);
        };
        SortByData.prototype.toString = function () {
            if (!this.isValid()) {
                return 'Sort By';
            }
            return Utils.sprintf('{0}:{1}', this.field, this.direction);
        };
        return SortByData;
    }());
    Directive.SortByData = SortByData;
    var SortBy = (function () {
        function SortBy() {
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = "/static/templates/directives/sort.html";
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                $scope.funcShow = function (popover) {
                    popover.toggle();
                };
                var parent = $scope.$parent;
                var options = parent[$attrs.zOptions];
                var fields = [
                    {
                        name: SortBy.NO_SORT_BY_NAME,
                        value: '__null__'
                    }
                ];
                fields = fields.concat(options.fields);
                $scope.optionsSortBy__ = {
                    dataSource: new kendo.data.DataSource({
                        data: fields
                    }),
                    dataTextField: 'name',
                    dataValueField: 'value'
                };
                $scope.field = fields[0].value;
                $scope.direction = "desc";
                $scope.buttonName = "Sort By";
                $scope.funcSortByConfirm = function (popover) {
                    popover.toggle();
                    var ret = new SortByData();
                    ret.direction = $scope.direction;
                    ret.field = $scope.field == '__null__' ? null : $scope.field;
                    $scope.buttonName = ret.toString();
                    options.done(ret);
                };
            };
        }
        return SortBy;
    }());
    SortBy.NO_SORT_BY_NAME = '-- No Sort --';
    Directive.SortBy = SortBy;
    var DeleteConfirmOptions = (function () {
        function DeleteConfirmOptions() {
        }
        return DeleteConfirmOptions;
    }());
    Directive.DeleteConfirmOptions = DeleteConfirmOptions;
    var DeleteConfirmImpl = (function () {
        function DeleteConfirmImpl($scope, $attrs, $element) {
            this.$scope = $scope;
            var options = $scope.$parent[$attrs.zOptions];
            $scope.optionsDelete__ = {
                animation: false,
                modal: true,
                draggable: false,
                resizable: false,
                width: "500px"
            };
            $scope.title = options.title;
            $scope.description = options.description;
            if (Utils.notNullnotUndefined(options.html)) {
                var desc = $element.find('#description');
                var el = $(options.html);
                desc.append(el);
            }
            $scope.confirm = function () {
                options.confirm();
                $scope.winDelete__.close();
            };
            $scope.cancel = function () {
                var c = options.cancel;
                if (Utils.notNullnotUndefined(c)) {
                    c();
                }
                $scope.winDelete__.close();
            };
        }
        DeleteConfirmImpl.prototype.open = function () {
            this.$scope.ok = null;
            this.$scope.winDelete__.center();
            this.$scope.winDelete__.open();
        };
        return DeleteConfirmImpl;
    }());
    var DeleteConfirm = (function () {
        function DeleteConfirm() {
            this.scope = true;
            this.replace = true;
            this.restrict = 'EA';
            this.templateUrl = '/static/templates/directives/deleteConfirm.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                $scope.$parent[$attrs.zDeleteConfirm] = new DeleteConfirmImpl($scope, $attrs, $element);
            };
        }
        return DeleteConfirm;
    }());
    Directive.DeleteConfirm = DeleteConfirm;
    var ConfirmBoxImpl = (function () {
        function ConfirmBoxImpl($scope, $attrs, $element) {
            this.$scope = $scope;
            var options = this.options = $scope.$parent[$attrs.zOptions];
            $scope.optionsConfirmBox__ = {
                animation: false,
                modal: true,
                draggable: false,
                resizable: false,
                width: Utils.notNullnotUndefined(options.width) ? options.width : '500px'
            };
            $scope.btnType = Utils.notNullnotUndefined(options.btnType) ? options.btnType : 'btn-primary';
            $scope.title = options.title;
            if (Utils.notNullnotUndefined(options.html)) {
                var desc = $element.find('#description');
                var el = $(options.html);
                desc.append(el);
            }
            $scope.confirm = function () {
                options.confirm();
                $scope.confirmBox__.close();
            };
            $scope.canProceed = function () {
                if (Utils.notNullnotUndefined(options.canProceed)) {
                    return options.canProceed();
                }
                return true;
            };
            $scope.cancel = function () {
                var c = options.cancel;
                if (Utils.notNullnotUndefined(c)) {
                    c();
                }
                $scope.confirmBox__.close();
            };
        }
        ConfirmBoxImpl.prototype.open = function () {
            if (Utils.notNullnotUndefined(this.options.description)) {
                this.$scope.description = this.options.description();
            }
            this.$scope.confirmBox__.center();
            this.$scope.confirmBox__.open();
        };
        return ConfirmBoxImpl;
    }());
    var ConfirmBox = (function () {
        function ConfirmBox() {
            this.scope = true;
            this.restrict = 'EA';
            this.replace = true;
            this.templateUrl = '/static/templates/directives/confirmBox.html';
            this.link = function ($scope, $element, $attrs, $ctrl, $transclude) {
                $scope.$parent[$attrs.zConfirm] = new ConfirmBoxImpl($scope, $attrs, $element);
            };
        }
        return ConfirmBox;
    }());
    Directive.ConfirmBox = ConfirmBox;
})(Directive || (Directive = {}));
angular.module('root')
    .directive("zPanelHeaderIn", function () {
        return new Directive.PanelHeaderIn();
    }).directive('zPopover', function () {
    return new Directive.Popover();
}).directive('zSearch', ['$compile', function ($compile) {
    return new Directive.SearchBox($compile);
}]).directive('zGridDoubleClick', function () {
    return new Directive.GridDoubleClick();
}).directive('zSortBy', function () {
    return new Directive.SortBy();
}).directive('zDeleteConfirm', function () {
    return new Directive.DeleteConfirm();
}).directive('zConfirm', function () {
    return new Directive.ConfirmBox();
}).filter('size', [function () {
    return Utils.toSizeString;
}]).filter('VCPU', [function () {
    return Utils.toVCPUString;
}]).filter('percent', [function () {
    return Utils.toPercentageString;
}]).filter('commas', [function () {
    return Utils.commaString;
}]);
