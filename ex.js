"use strict";
define('ex', ['knockout'], function (ko) {
    var popupManager, fogContainer;

    function makeId(pCount)
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var count = !!pCount ? pCount : 5;

        for(var i = 0; i < count; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    //var generateBackgroundButton = function(title, id, classes, css, onclickCallback) {
    var generateTextButton = function (text, title, id, classes, css, onclickCallback) {
        var fixedClasses = '';
        classes ? fixedClasses = classes : '';
        var $button = $('<div/>', {
            id: id,
            'class': 'dx-button ex-control-pager-text-button ' + fixedClasses,
            title: title
        });
        if (!!css) {
            $button.css(css);
        }
        $button.append("<div><table><tbody><tr><td><span>" + text + "</span></td></tr></tbody></table></div>");
        $button.on('click', onclickCallback);

        return $button;
    };

    fogContainer = {
        Principal: 0,
        Body: 1
    };

    var exHtmlTemplate = {}
    var contentManager = {
        templates: new Array(),
        _addTemplate: function (pName, element) {
            var temp = Object.create(exHtmlTemplate);
            temp.name = pName;
            temp.content = element.outerHTML;
            var prevCandidate = $(element);
            while (true) {
                prevCandidate = prevCandidate.prev();
                if(!prevCandidate.hasClass('ex-initial-control-template') && !prevCandidate.hasClass('ex-initial-control-content')) break;
            }
            
            temp.previousSibling = prevCandidate.get(0);

            this.templates.push(temp);
            $(element).remove();
        },
        addTemplate: function (pName, pElement) {
            this._addTemplate(pName, pElement);
        },
        addTemplates: function () {
            var self = this;
            var temps = $('.ex-initial-control-template');
            temps.forEach(function (el) {
                self._addTemplate(el.tagName + '_' + el.prop('id'), el.get(0));
            });
        },
        getTemplate: function (templateName) {
            var result = undefined;
            this.templates.forEach(function (element) {
                if (element.name === templateName) {
                    result = element;
                }
            });

            return result;
        }
    }

    var exObject = function() {
        var self = this;
    };

    var exjQHybridElement = function() {
        var self = this;
        exObject.apply(self, arguments);

        self.selector = '';
    };
    exjQHybridElement.prototype = Object.create(exObject.prototype);
    exjQHybridElement.prototype.constructor = exjQHybridElement;
    exjQHybridElement.prototype.$get = function() {
        return $(this.selector);
    };

    var exControl = function (params) {//exControls, htmlControls, data) {
        var self = this;

        self.id = makeId(5);
        if (!!params.id) {
            self.id = params.id;
        }

        exObject.apply(self, arguments);

        self.hControls = {};
        self.hControls._panel = new exjQHybridElement();
        Object.defineProperties(self, {
            "panel": {
                "get": function() {
                    return self.hControls._panel;
                },
                "set": function(value) {
                    self.hControls._panel = value;
                }
            },
            "$panel": {
                "get": function() {
                    return self.panel.$get();
                }
            },
            "visible": {
                "get": function() {
                    return self.$panel.is(':visible');
                }
            }
        });

        self.registerContentFromParams(params);
    };
    exControl.prototype = Object.create(exObject.prototype);
    exControl.prototype.constructor = exControl;
    exControl.prototype.registerContentFromParams = function(params) {
        var self = this;

        self.exControls = {};
        if (!!params.exControls) {
            self.addExControls(params.exControls);
        }

        self.htmlControls = {};
        if (!!params.htmlControls) {
            self.addHtmlControls(params.htmlControls);
        }

        self.data = {};
        if (!!params.data) {
            self.addData(params.data);
        }

        self.controlDataRegistered = true;
    }
    exControl.prototype.extendEasyAccessObjectGroup = function (objGroup, obj) {
        var self = this;
        $.extend(true, objGroup, obj);
        var keys = Object.keys(objGroup);

        function bubbleObject(key, objectGroup) {
            Object.defineProperty(self, key, {
                get: function () {
                    return objectGroup[key];
                },
                set: function (value) {
                    objectGroup[key] = value;
                }
            });
        }

        for (var i = 0; i < keys.length; i++) {
            bubbleObject(keys[i], objGroup);
        }
    };
    exControl.prototype.addExControls = function (exControls) {
        var self = this;
        self.extendEasyAccessObjectGroup(self.exControls, exControls);        
    };
    exControl.prototype.addHtmlControls = function (htmlElements) {
        var self = this;
        self.extendEasyAccessObjectGroup(self.htmlControls, htmlElements);
    };
    exControl.prototype.addData = function (data) {
        var self = this;
        self.extendEasyAccessObjectGroup(self.data, data);
    }

    var exPopup = function (params) {//id, content, principal) {
        var self = this;

        exControl.apply(self, arguments);

        if (!params.content) {
            var id = makeId(10);
            self.initialContent = document.createElement('div');
            self.initialContent.setAttribute('id', id);
            document.body.appendChild(self.initialContent);
            self.initialContent = document.getElementById('id');
        } else {
            self.initialContent = params.content;
        }

        self.Settings = {
            Interface: {
                Fog: {
                    hasFog: false,
                    container: fogContainer.Principal
                },
                hasRefreshButton: false,
                hasExportButton: false,
                hasPrintButton: false,
                hasCloseButton: true
            },
            Behaviour: {
                Appearance: 0, //0 - centerScreen; 1 - centerParent
                closeWithChildren: false,
                closeChildrenOnRefresh: false, //TODO: This feature isnt implemented.
                dragOptions: {}
            }
        };
        if (!!params.settings) {
            $.extend(true, self.Settings, params.settings);
        }

        self.EventHandlers = {
            refresh: function (sender, eventArgs) { },
            exportTo: function (sender, eventArgs) { },
            print: function (sender, eventArgs) { },
            beforeShow: function (sender, eventArgs) { },
            afterShow: function (sender, eventArgs) { },
            beforeHide: function (sender, eventArgs) { },
            afterHide: function (sender, eventArgs) { },
            beforeResize: function (sender, eventArgs) { },
            afterResize: function (sender, eventArgs) { },
            afterCreate: function (sender, eventArgs) { }
    };
        if (!!params.eventHandlers) {
            $.extend(true, self.EventHandlers, params.eventHandlers);
        }

        self.Principal = null;
        if (!!params.principal && params.principal instanceof exPopup) {
            self.Principal = params.principal;
        }

        self.__fromTemplate__ = exHtmlTemplate.isPrototypeOf(self.initialContent);
        self.__contentHtml__ = self.__fromTemplate__ ? $(self.initialContent.content).html() : $(self.initialContent).html();
        self.__previousSibling__ = self.__fromTemplate__ ? $(self.initialContent.content).prev() : $(self.initialContent).prev();
        self.__parent__ = self.__fromTemplate__ ? $(self.initialContent.content).parent() : $(self.initialContent).parent();
        self.__caption__ = !!params.caption ? params.caption : '';
        self.__defaultBodyMargin__ = 5;
        self.__raiseChildren__ = function() {
            if (!!self.Manager) {
                self.Manager.hoist(self);
                self.Manager.hoistChildren(self);
            }
        };

        self.hControls._fog = new exjQHybridElement();
        self.hControls._panel._window = new exjQHybridElement();
        self.hControls._panel._window._head = new exjQHybridElement();
        self.hControls._panel._window._head._title = new exjQHybridElement();
        self.hControls._panel._window._head._closeBtn = new exjQHybridElement();
        self.hControls._panel._window._head._refreshBtn = new exjQHybridElement();
        self.hControls._panel._window._head._raiseChildrenBtn = new exjQHybridElement();
        self.hControls._panel._window._body = new exjQHybridElement();
        self.hControls._panel._window._body._content = new exjQHybridElement();        

        self.Children = new Array();
        self.Manager = popupManager;

        Object.defineProperties(self, {
            "fog": {
                "get": function() {
                    return self.hControls._fog;
                },
                "set": function(value) {
                    self.hControls._fog = value;
                }
            },
            "$fog": {
                "get": function() {
                    return self.fog.$get();
                }
            },
            "window": {
                "get": function() {
                    return self.panel._window;
                },
                "set": function(value) {
                    self.panel._window = value;
                }
            },
            "$window": {
                "get": function() {
                    return self.window.$get();
                }
            },
            "head": {
                "get": function() {
                    return self.window._head;
                },
                "set": function(value) {
                    self.window._head = value;
                }
            },
            "$head": {
                "get": function() {
                    return self.head.$get();
                }
            },
            "title": {
                "get": function() {
                    return self.head._title;
                },
                "set": function(value) {
                    self.head._title = value;
                }
            },
            "$title": {
                "get": function() {
                    return self.title.$get();
                }
            },
            "closeBtn": {
                "get": function() {
                    return self.head._closeBtn;
                },
                "set": function(value) {
                    self.head._closeBtn = value;
                }
            },
            "$closeBtn": {
                "get": function() {
                    return self.closeBtn.$get();
                }
            },
            "refreshBtn": {
                "get": function() {
                    return self.head._refreshBtn;
                },
                "set": function(value) {
                    self.head._refreshBtn = value;
                }
            },
            "$refreshBtn": {
                "get": function() {
                    return self.refreshBtn.$get();
                }
            },
            "raiseChildrenBtn": {
                "get": function() {
                    return self.head._raiseChildrenBtn;
                },
                "set": function(value) {
                    self.head._raiseChildrenBtn = value;
                }
            },
            "$raiseChildrenBtn": {
                "get": function() {
                    return self.raiseChildrenBtn.$get();
                }
            },
            "caption": {
                "get": function() {
                    if (self.$title.length) {
                        return self.$title.text();
                    } else {
                        return self.__caption__;
                    }
                },
                "set": function(value) {
                    if (self.$title.length) {
                        self.$title.text(value);
                    }
                    self.__caption__ = value;
                }
            },
            "body": {
                "get": function() {
                    return this.window._body;
                },
                "set": function(value) {
                    this.window._body = value;
                }
            },
            "$body": {
                "get": function() {
                    return this.body.$get();
                }
            },
            "content": {
                "get": function() {
                    return this.body._content;
                },
                "set": function(value) {
                    this.body._content = value;
                }
            },
            "$content": {
                "get": function() {
                    return this.content.$get();
                }
            }
        });
    };
    exPopup.prototype = Object.create(exControl.prototype);
    exPopup.prototype.constructor = exPopup;
    exPopup.prototype.__adjustContentWrappersSize__ = function() {
        var self = this;
        self.$panel.width(self.$content.width() + self.__defaultBodyMargin__ * 2);
        self.$panel.height(self.$head.height() + self.$content.height() + self.__defaultBodyMargin__ * 2);
        self.$window.width(self.$panel.width());
        self.$window.height(self.$panel.height());
        self.$body.width(self.$content.width());
        self.$body.height(self.$content.height());
    };
    exPopup.prototype.resetPosition = function () {
        var self = this;
        if (this.Settings.Behaviour.Appearance === 0 || !this.Principal) {
            centratePosition(self.$panel); //This function should be placed here.
        } else {
            centratePosition(self.$panel); //, this.Principal.$panel);
        }
    };
    exPopup.prototype.show = function (successCallback, failureCallback) {
        var self = this;
        if (this.$panel.css('display') == 'none') {
            this.EventHandlers.beforeShow(self);

            this.__adjustContentWrappersSize__();
            this.resetPosition();

            if (this.Settings.Interface.Fog.hasFog) {
                if (!!this.Principal && this.Settings.Interface.Fog.container == fogContainer.Principal) {
                    this.$fog.css('zIndex', +this.Principal.$panel.css('zIndex') + 1);
                    if (this.Principal.$panel.get(0) !== this.$fog.parent().get(0)) {
                        this.$fog.appendTo(this.Principal.$panel);
                    }
                } else {
                    this.$fog.css('zIndex', '');
                    if ($('body').get(0) !== this.$fog.parent().get(0)) {
                        this.$fog.appendTo($('body'));
                    }
                }
                if (this.$fog.parent().children('.dx-fog:visible').length === 0) {
                    this.$fog.fadeIn('fast');
                }
            }
            if (this.Manager != undefined) {
                this.Manager.hoist(this);
            }
            this.$panel.fadeIn('fast', function() {
                self.EventHandlers.afterShow(self);

                if (!!successCallback && typeof (successCallback) === 'function') {
                    successCallback(self);
                }
            });

            return true;
        }

        if (!!failureCallback && typeof (failureCallback) === 'function') {
            failureCallback(self);
        }
        return false;
    };
    exPopup.prototype.hide = function (successCallback, failureCallback) {
        var self = this;
        if (self.$panel.css('display') != 'none') {
            self.EventHandlers.beforeHide(self);

            if (self.Settings.Interface.Fog.hasFog) {
                self.$fog.fadeOut('fast');
            }
            if (self.Settings.Behaviour.closeWithChildren) {
                for (var i = 0; i < self.Children.length; i++) {
                    self.Children[i].hide();
                }
            }
            self.$panel.css('zIndex', '');
            self.$panel.fadeOut('fast', function () {
                self.EventHandlers.afterHide(self);

                if (!!successCallback && typeof (successCallback) === 'function') {
                    successCallback(self);
                }
            });

            return true;
        }

        if (!!failureCallback && typeof (failureCallback) === 'function') {
            failureCallback(self);
        }
        return false;
    };
    exPopup.prototype.resize = function (params) {
        var self = this;

        self.EventHandlers.beforeResize();

        if (!!params && 'width' in params) {
            self.$content.width(params.width);
        }
        if (!!params && 'height' in params) {
            self.$content.height(params.height);
        }

        self.__adjustContentWrappersSize__();
    };
    exPopup.prototype.animate = function(params) {
        //this.$panel.animate({ //TODO: Implement
        //    width: contentWidth,
        //    height: contentHeight
        //}, 1000, function() {
        //    this.$panel.animate({
        //        top: '50%',
        //        left: '50%',
        //        marginTop: $(this).height() / 2 * (-1),
        //        marginLeft: $(this).width() / 2 * (-1)
        //    }, 1000, function() {
        //        this.EventHandlers.afterResize();
        //    });
        //});
    };
    exPopup.prototype.refresh = function () {
        var self = this;
        self.EventHandlers.refresh(self);
    };
    exPopup.prototype.UnassignFrom = function() {
        if (!!this.Principal) {
            for (var i = 0; i < this.Principal.Children.length; i++) {
                if (this.Principal.Children[i].$panel.attr('id') == this.$panel.attr('id')) {
                    this.Principal.Children.splice(i, 1);
                }
            }
            this.Principal = undefined;
        }
    };
    exPopup.prototype.Unassign = function(child) {
        for (var i = 0; i < this.Children.length; i++) {
            if (this.Children[i].$panel.attr('id') == child.$panel.attr('id')) {
                child.UnassignFrom();
                break;
            }
        }
    };
    exPopup.prototype.AssignTo = function(parent) {
        if ('Children' in parent && (typeof parent.Children === 'object') && parent.Children.push !== undefined) {
            var exists = false;

            for (var i = 0; i < parent.Children.length; i++) {
                if (parent.Children[i].$panel.attr('id') == this.$panel.attr('id')) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                this.UnassignFrom();
                parent.Children.push(this);
                this.Principal = parent;
            }
        }
    };
    exPopup.prototype.Assign = function(child) {
        var exists = false;
        for (var i = 0; i < this.Children.length; i++) {
            if (this.Children[i].$panel.attr('id') == child.$panel.attr('id')) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            child.AssignTo(this);
        }
    };

    var exKoPopup = function(params) { //uniqueId, exControls, $ui, data, contentOrTemplate, viewModel, params, principal) {
        var self = this;

        exPopup.apply(self, arguments);

        if (!!params.viewModel) {
            self.viewModel = params.viewModel;
        }
    };
    exKoPopup.prototype = Object.create(exPopup.prototype);
    exKoPopup.prototype.constructor = exKoPopup;
    exKoPopup.prototype.postInitKoModelBinding = function (viewModel, element) {
        //In layout use 'ex-ko-bind' instead of 'data-bind' and 'ex-ko' instead 'ko' in KnockoutJs bindings if you create popup from template.
        if (!!ko && !!viewModel && !!element) {
            var modelToBind = !!viewModel.model ? viewModel.model : viewModel;
            var formatObj = !!viewModel.format ? viewModel.format : undefined;
            var elements = $(element).find('*');
            elements.push(element);
            elements.each(function (index, elem) {
                var dataBind = $(elem).attr('ex-ko-bind');
                if (!!$(elem).attr('ex-ko-bind')) {
                    $(elem).removeAttr('ex-ko-bind');
                    if (!!formatObj) {
                        var keys = Object.keys(formatObj);
                        for (var i = 0; i < keys.length; i++) {
                            dataBind = dataBind.replace(new RegExp('{' + keys[i] + '}', 'g'), formatObj[keys[i]]);
                        }
                    }
                    $(elem).attr('data-bind', dataBind);
                }
                $(elem).contents().each(function (index, elem) {
                    if (elem.nodeType === 8) {
                        var keys = Object.keys(formatObj);
                        for (var i = 0; i < keys.length; i++) {
                            elem.data = elem.data.replace(new RegExp('ex-ko', 'g'), 'ko');
                            elem.data = elem.data.replace(new RegExp('{' + keys[i] + '}', 'g'), formatObj[keys[i]]);
                        }
                    }
                });
            });
            ko.applyBindings(modelToBind, element);
        }
    };

    var dxKindPopup = function (params) {//id, exControls, $ui, data, contentOrTemplate, viewModel, params, principal) {
        var self = this;

        exKoPopup.apply(self, arguments);
        
        var init = function () {
            var $content = null;
            if (self.__fromTemplate__) {
                $content = $(self.initialContent.content);
            } else {
                $content = $(self.initialContent);
            }

            var fixedId = self.__fromTemplate__ ? '-' + self.id : '';
            var initialId = $content.attr('id');
            var panelId = initialId + '-panel' + fixedId;
            var fogId = initialId + '-panel-fog' + fixedId;
            var windowId = initialId + '-panel-window' + fixedId;
            var headId = initialId + '-panel-window-head' + fixedId;
            var titleId = initialId + '-panel-window-head-title' + fixedId;
            var closeBtnId = initialId + '-panel-window-head-closeBtn' + fixedId;
            var raiseChildrenBtnId = initialId + '-panel-window-head-raiseChildrenBtn' + fixedId;
            var refreshBtnId = initialId + '-panel-window-head-refreshBtn' + fixedId;
            var printBtnId = initialId + '-panel-window-head-printBtn' + fixedId;
            var exportBtnId = initialId + '-panel-window-head-exportBtn' + fixedId;
            var bodyId = initialId + '-panel-window-body' + fixedId;
            var contentId = initialId + '-panel-window-body-content' + fixedId;

            //region Popup parts building.
            var panelClass = 'dx-popup-panel';
            var windowClass = 'dx-popup dx-border';
            var $panel = $('<div/>', {
                id: panelId,
                'class': panelClass
            });
            var $window = $('<div/>', {
                id: windowId,
                'class': windowClass
            });
            var $head = $('<div/>', {
                id: headId,
                'class': 'dx-popup-head'
            });
            var caption = self.__caption__;
            var $title = $('<span />', {
                id: titleId,
                text: caption
            });
            var $closeBtn = $('<div />', {
                id: closeBtnId,
                'class': 'dx-popup-head-button dx-popup-head-close-button dx-popup-head-close-button-image-16px'
            });
            $closeBtn.on('click', function() {
                self.hide();
            });
            var $refreshBtn = $('<div />', {
                id: refreshBtnId,
                'class': 'dx-popup-head-button dx-popup-head-refresh dx-popup-head-refresh-button-image-16px'
            });
            $refreshBtn.on('click', function() {
                self.EventHandlers.refresh(self);
            });
            var $exportBtn = $('<div />', {
                id: exportBtnId,
                'class': 'dx-popup-head-button dx-popup-head-export dx-popup-head-export-button-image-16px'
            });
            $exportBtn.on('click', function () {
                self.EventHandlers.exportTo(self);
            });
            var $printBtn = $('<div />', {
                id: printBtnId,
                'class': 'dx-popup-head-button dx-popup-head-print dx-popup-head-print-button-image-16px'
            });
            $printBtn.on('click', function () {
                self.EventHandlers.print(self);
            });
            var $raiseChildrenBtn = $('<div />', {
                id: raiseChildrenBtnId,
                style: 'display: none',
                'class': 'dx-popup-head-button dx-popup-head-raiseChildren-button dx-popup-head-raiseChildren-button-image-16px'
            });
            $raiseChildrenBtn.on('click', function() {
                self.__raiseChildren__();
            });
            var $body = $('<div/>', {
                id: bodyId,
                'class': 'dx-popup-body'
            });
            //endregion

            //region jSelectors initializing.
            self.panel.selector = 'div#' + panelId;
            self.window.selector = 'div#' + windowId;
            self.head.selector = 'div#' + headId;
            self.title.selector = 'span#' + titleId;
            self.closeBtn.selector = 'div#' + closeBtnId;
            self.refreshBtn.selector = 'div#' + refreshBtnId;
            self.raiseChildrenBtn.selector = 'div#' + raiseChildrenBtnId;
            self.body.selector = 'div#' + bodyId;
            self.content.selector = $content.prop('tagName') + '#' + contentId;
            self.fog.selector = 'div#' + fogId;
            //endregion

            //region Window rendering and event processing.
            if (self.__fromTemplate__) {
                $content.find('*').each(function(index) {
                    var elId = $(this).prop('id');
                    if (elId !== '') {
                        $(this).prop('id', elId + fixedId);
                    }
                });
            }
            $content.attr('id', contentId);

            var elementPasterAfter = $content.prev().get(0);
            if (self.__fromTemplate__) {
                elementPasterAfter = $(self.initialContent.previousSibling).get(0);
            }

            $content.appendTo($body);
            $title.appendTo($head);
            if (self.Settings.Interface.hasCloseButton) {
                $closeBtn.appendTo($head);
            }
            if (self.Settings.Interface.hasRefreshButton) {
                $refreshBtn.appendTo($head);
            }
            if (self.Settings.Interface.hasExportButton) {
                $exportBtn.appendTo($head);
            }
            if (self.Settings.Interface.hasPrintButton) {
                $printBtn.appendTo($head);
            }
            $raiseChildrenBtn.appendTo($head);
            $head.appendTo($window);
            $body.appendTo($window);
            $window.appendTo($panel);
            if (self.__fromTemplate__) {           
                $content.removeClass('ex-initial-control-template');
            } else {
                $content.removeClass('ex-initial-control-content');
            }
            $(elementPasterAfter).after($panel);

            if (Object.keys(self.Settings.Behaviour.dragOptions).length === 0) {
                self.Settings.Behaviour.dragOptions = {
                    handle: '.' + self.$head.attr('class'),
                    //containment: this.$panel.parent(),
                    containment: "document", //"body"
                    cursor: "move"
                };
            }
            self.$panel.draggable(self.Settings.Behaviour.dragOptions);
            //endregion

            //region Fog initialization.
            var fogClass = 'dx-fog';
            var $fog = $('<div/>', {
                id: fogId,
                'class': fogClass
            });
            if (self.Settings.Interface.Fog.hasFog) {
                self.$panel.before($fog);
            }
            //endregion

            //region Principal processing.
            if (!!self.Principal) {
                self.AssignTo(self.Principal);
            }
            //endregion

            //region Manager-connected events initialization.
            if (!!self.Manager) {
                self.Manager.add(self);
                self.$window.on('mousedown', function(e) {
                    var parents = $(e.srcElement).parents();
                    parents = $.grep(parents, function(e, i) {
                        return $(e).hasClass('dx-button');
                    });
                    if (parents.length === 0) {
                        self.Manager.hoist(self);
                    }
                });
            }
            //endregion

            if (self.__fromTemplate__) {
                self.postInitKoModelBinding(self.viewModel, self.$content.get(0));
            }

            delete self.initialContent;
        };

        init();
        self.EventHandlers.afterCreate(self);
    };
    dxKindPopup.prototype = Object.create(exKoPopup.prototype);
    dxKindPopup.prototype.constructor = dxKindPopup;

    popupManager = {
        windows: new Array(),
        __validateRaisePopupsBtn: function(targetWindow) {
            var btnVisible = false;
            for (var i = 0; i < targetWindow.Children.length; i++) {
                var child = targetWindow.Children[i];
                if (child.visible && parseInt(child.$panel.css('zIndex'), 10) <= parseInt(targetWindow.$panel.css('zIndex'))) {
                    btnVisible = true;
                    break;
                }
            }
            if (btnVisible) {
                targetWindow.$raiseChildrenBtn.show();
                return;
            }
            targetWindow.$raiseChildrenBtn.hide();
        },
        add: function(window) {
            if (window instanceof dxKindPopup) {
                this.windows.push(window);
            }
        },
        remove: function(window) {
            for (var i = 0; i < this.windows.length; i++) {
                if (this.windows[i].$panel.attr('id') === window.$panel.attr('id')) {
                    this.windows.splice(i, 1);
                    break;
                }
            }
        },
        hoist: function(window) {
            var initialIndex = window.$panel.css('zIndex');
            var maxIndex = initialIndex;

            for (var i = 0; i < this.windows.length; i++) {
                if (this.windows[i].$panel.css('display') != 'none') {
                    if (this.windows[i].$panel.attr('id') !== window.$panel.attr('id')) {
                        var zIndex = parseInt(this.windows[i].$panel.css('zIndex'), 10);
                        if (maxIndex <= zIndex) {
                            maxIndex = zIndex + 1;
                        }
                    }
                }
            }

            if (maxIndex > initialIndex) {
                window.$panel.css('zIndex', maxIndex);

                this.__validateRaisePopupsBtn(window);
                if (!!window.Principal) {
                    this.__validateRaisePopupsBtn(window.Principal)
                }
            }
        },
        hoistChildren: function(window) {
            if (window.Children.length > 0) {
                var minZIndex = parseInt(window.Children[0].$panel.css('zIndex'), 10);
                for (var i = 0; i < window.Children.length; i++) {
                    var child = window.Children[i];
                    var childPanel = child.$panel;
                    if (childPanel.css('zIndex') < minZIndex) {
                        minZIndex = parseInt(childPanel.css('zIndex'), 10);
                    }
                }

                for (i = 0; i < window.Children.length; i++) {
                    child = window.Children[i];
                    childPanel = child.$panel;
                    childPanel.css('zIndex', parseInt(window.$panel.css('zIndex'), 10) + parseInt(childPanel.css('zIndex'), 10) - minZIndex + 2 - 1);
                    this.__validateRaisePopupsBtn(child);
                }

                this.__validateRaisePopupsBtn(window);
            }
        }
    };

    var exPager = function(params) {
        var self = this;

        exControl.apply(self, arguments);

        self.id = makeId(5);
        if (!!params.id) {
            self.id = params.id;
        }

        if (!!params.parent) {
            self.parent = params.parent;
        } else {
            throw new Error("Pager cannot be instantiated without parent.");
        }

        if (!!params.pageSizes) {
            self.pageSizes = params.pageSizes;
        } else {
            throw new Error("Pager cannot be instantiated without page-size option.");
        }

        if (!!params.defaultValue) {
            self.defaultValue = params.defaultValue;
        } else {
            self.defaultValue = self.pageSizes[0];
        }

        self.Settings = {
            Interface: {
                FirstPageBtnText: '|<',
                NextPageBtnText: '>',
                PreviousPageBtnText: '<',
                LastPageBtnText: '>|',
                FirstPageBtnTitle: '',
                NextPageBtnTitle: '',
                PreviousPageBtnTitle: '',
                LastPageBtnTitle: '',
                PrePagesCountText: '',
                PreTotalResultsText: '',
                PostTotalResultsText: '',
                RecordsPerPageText: ''
            }
        };
        if (!!params.settings) {
            $.extend(true, self.Settings, params.settings);
        }

        self._currentPage = 1;
        self._pagesCount = 1;
        self._totalResults = 0;
        self._lastPageSize = self.defaultValue;
        self._source = new Array();
        self.workingSet = new Array();

        self.hControls._panel = new exjQHybridElement();
        self.hControls._panel._leftPart = new exjQHybridElement();
        self.hControls._panel._leftPart._firstPageBtn = new exjQHybridElement();
        self.hControls._panel._leftPart._previousPageBtn = new exjQHybridElement();
        self.hControls._panel._leftPart._currentPage = new exjQHybridElement();
        self.hControls._panel._leftPart._pagesCount = new exjQHybridElement();
        self.hControls._panel._leftPart._nextPageBtn = new exjQHybridElement();
        self.hControls._panel._leftPart._lastPageBtn = new exjQHybridElement();
        self.hControls._panel._leftPart._totalResults = new exjQHybridElement();
        self.hControls._panel._rightPart = new exjQHybridElement();
        self.hControls._panel._rightPart._pageSizePicker = new exjQHybridElement();

        Object.defineProperties(self, {
            "leftPart": {
                "get": function() {
                    return self.panel._leftPart;
                },
                "set": function(value) {
                    self.panel._leftPart = value;
                }
            },
            "$leftPart": {
                "get": function() {
                    return self.leftPart.$get();
                }
            },
            "firstPageBtn": {
                "get": function() {
                    return self.leftPart._firstPageBtn;
                },
                "set": function(value) {
                    self.leftPart._firstPageBtn = value;
                }
            },
            "$firstPageBtn": {
                "get": function() {
                    return self.firstPageBtn.$get();
                }
            },
            "previousPageBtn": {
                "get": function() {
                    return self.leftPart._previousPageBtn;
                },
                "set": function(value) {
                    self.leftPart._previousPageBtn = value;
                }
            },
            "$previousPageBtn": {
                "get": function() {
                    return self.previousPageBtn.$get();
                }
            },
            "currentPage": {
                "get": function() {
                    return self.leftPart._currentPage;
                },
                "set": function(value) {
                    self.leftPart._currentPage = value;
                }
            },
            "$currentPage": {
                "get": function() {
                    return self.currentPage.$get();
                }
            },
            "CurrentPage": {
                "get": function() {
                    var currentValue = self._currentPage;
                    if (self.$currentPage.length) {
                        if (isNumeric(self.$currentPage.val())) {
                            currentValue = parseInt(self.$currentPage.val(), 10);
                        }
                    }

                    return currentValue;
                },
                "set": function(value) {
                    if (isNumeric(value)) {
                        if (self.$currentPage.length) {
                            self.$currentPage.val(value);
                        }
                        self._currentPage = value;
                    }
                }
            },
            "pagesCount": {
                "get": function() {
                    return self.leftPart._pagesCount;
                },
                "set": function(value) {
                    self.leftPart._pagesCount = value;
                }
            },
            "$pagesCount": {
                "get": function() {
                    return self.pagesCount.$get();
                }
            },
            "PagesCount": {
                "get": function() {
                    if (self.$pagesCount.length) {
                        return parseInt(self.$pagesCount.text(), 10);
                    } else {
                        return self._pagesCount;
                    }
                },
                "set": function(value) {
                    if (self.$pagesCount.length) {
                        self.$pagesCount.text(value);
                    }
                    self._pagesCount = value;
                }
            },
            "nextPageBtn": {
                "get": function() {
                    return self.leftPart._nextPageBtn;
                },
                "set": function(value) {
                    self.leftPart._nextPageBtn = value;
                }
            },
            "$nextPageBtn": {
                "get": function() {
                    return self.nextPageBtn.$get();
                }
            },
            "lastPageBtn": {
                "get": function() {
                    return self.leftPart._lastPageBtn;
                },
                "set": function(value) {
                    self.leftPart._lastPageBtn = value;
                }
            },
            "$lastPageBtn": {
                "get": function() {
                    return self.lastPageBtn.$get();
                }
            },
            "totalResults": {
                "get": function() {
                    return self.leftPart._totalResults;
                },
                "set": function(value) {
                    self.leftPart._totalResults = value;
                }
            },
            "$totalResults": {
                "get": function() {
                    return self.totalResults.$get();
                }
            },
            "TotalResults": {
                "get": function() {
                    if (self.$totalResults.length) {
                        return self.$totalResults.text();
                    } else {
                        return self._totalResults;
                    }
                },
                "set": function(value) {
                    if (self.$totalResults.length) {
                        self.$totalResults.text(value);
                    }
                    self._totalResults = value;
                }
            },
            "rightPart": {
                "get": function() {
                    return self.panel._rightPart;
                },
                "set": function(value) {
                    self.panel._rightPart = value;
                }
            },
            "$rightPart": {
                "get": function() {
                    return self.rightPart.$get();
                }
            },
            "pageSizePicker": {
                "get": function() {
                    return self.rightPart._pageSizePicker;
                },
                "set": function(value) {
                    self.rightPart._pageSizePicker = value;
                }
            },
            "$pageSizePicker": {
                "get": function() {
                    return self.pageSizePicker.$get();
                }
            },
            "PageSize": {
                "get": function() {
                    return parseInt(self.$pageSizePicker.val(), 10);
                },
                "set": function(value) {
                    self._lastPageSize = self.PageSize;
                    self.$pageSizePicker.val(value);
                }
            }
        });

        $.extend(true, self, params);
    };
    exPager.prototype = Object.create(exControl.prototype);
    exPager.prototype.constructor = exPager;
    exPager.prototype.page = function(index) {
        var numIndex = parseInt(index, 10);
        if (numIndex <= this.PagesCount) {
            this.CurrentPage = numIndex;
            this.workingSet = this._source.slice(this.PageSize * (this.CurrentPage - 1), this.PageSize * this.CurrentPage);
        }
    };

    var exKoPager = function(params) {
        var self = this;

        exPager.apply(self, arguments);
    };
    exKoPager.prototype = Object.create(exPager.prototype);
    exKoPager.prototype.constructor = exKoPager;
    exKoPager.prototype.load = function (source, destination) {
        this._source = new Array();
        for (var i = 0; i < source.length; i++) {
            var obj = source[i];
            this._source.push(obj);
        }
        this.workingSet = destination;

        this.CurrentPage = 1;
        this.TotalResults = source.length;
        this.PageSize = this.defaultValue;
        this.PagesCount = Math.ceil(this.TotalResults / this.PageSize);

        this.page(this.CurrentPage);
    };
    exKoPager.prototype.page = function(index) {
        var numIndex = parseInt(index, 10);
        var act = true;
        if (isNumeric(numIndex)) {
            if (index > 0 && index <= this.PagesCount) {
                this.CurrentPage = index;
            } else {
                act = false;
            }
        } else {
            this.CurrentPage += 1;
        }

        if (act) {
            this.workingSet(this._source.slice(this.PageSize * (this.CurrentPage - 1), this.PageSize * this.CurrentPage));
        }
    };

    var dxKindPager = function (params) {//pParent, pPageSizes, pDefaultValue, params) {
        var self = this;

        exKoPager.apply(self, arguments);

        var init = function () {//parent, pageSizes, defaultValue) {
            var $parent = $(self.parent);

            var panelId = self.id + '-panel';
            var leftPartId = self.id + '-panel-leftPart';
            var firstPageBtnId = self.id + '-panel-leftPart-firstPageBtn';
            var previousPageBtnId = self.id + '-panel-leftPart-previousPageBtn';
            var currentPageId = self.id + '-panel-leftPart-currentPage';
            var pagesCountId = self.id + '-panel-leftPart-pagesCount';
            var nextPageBtnId = self.id + '-panel-leftPart-nextPageBtn';
            var lastPageBtnId = self.id + '-panel-leftPart-lastPageBtn';
            var totalResultsId = self.id + '-panel-leftPart-totalResults';
            var rightPartId = self.id + '-panel-rightPart';
            var pageSizePickerId = self.id + '-panel-rightPart-pageSizePicker';

            var $panel = $('<div/>', {
                id: panelId,
                'class': 'ex-control-pager'
            });
            var $leftPart = $('<div/>', {
                id: leftPartId,
                'class': 'ex-control-pager-left-part'
            });
            var $firstPageBtn = generateTextButton(self.Settings.Interface.FirstPageBtnText, self.Settings.Interface.FirstPageBtnTitle, firstPageBtnId, null,
            {}, function(s, e) {
                self.page(1);
            });
            var $previousPageBtn = generateTextButton(self.Settings.Interface.PreviousPageBtnText, self.Settings.Interface.PreviousPageBtnTitle, previousPageBtnId, null,
            { margin: "0px 10px 0px 5px" }, function(s, e) {
                self.page(self.CurrentPage - 1);
            });
            var $currentPage = $('<input/>', {
                id: currentPageId,
                type: 'text',
                'class': 'dx-font ex-control-pager-input digits-only',
                value: self._currentPage
            });
            $currentPage.on('keyup paste', function (s, e) {
                if (this.value.match(RegExps['digits-single-line'])) {
                    self.page(this.value);
                }
            });
            var $prePagesCount = $('<span/>', {
                'class': 'dx-font',
                text: self.Settings.Interface.PrePagesCountText,
                style: 'margin-right: 3px'
            });
            var $pagesCount = $('<span/>', {
                id: pagesCountId,
                'class': 'dx-font',
                text: self.PagesCount
            });
            var $nextPageBtn = generateTextButton(self.Settings.Interface.NextPageBtnText, self.Settings.Interface.NextPageBtnTitle, nextPageBtnId, null,
            { margin: "0px 0px 0px 10px" }, function(s, e) {
                self.page(parseInt(self.CurrentPage, 10) + 1);
            });
            var $lastPageBtn = generateTextButton(self.Settings.Interface.LastPageBtnText, self.Settings.Interface.LastPageBtnTitle, lastPageBtnId, null,
            { margin: "0px 10px 0px 5px" }, function(s, e) {
                self.page(self.PagesCount);
            });
            var $preTotalResults = $('<span/>', {
                'class': 'dx-font',
                text: self.Settings.Interface.PreTotalResultsText,
                style: 'margin-right: 3px'
            });
            var $totalResults = $('<span/>', {
                id: totalResultsId,
                'class': 'dx-font',
                text: self.TotalResults,
                style: 'margin-right: 3px'
            });
            var $postTotalResults = $('<span/>', {
                'class': 'dx-font',
                text: self.Settings.Interface.PostTotalResultsText,
                style: 'margin-right: 5px'
            });
            var $rightPart = $('<div/>', {
                id: rightPartId,
                'class': 'ex-control-pager-right-part'
            });
            var $recordsPerPage = $('<span/>', {
                'class': 'dx-font ex-control-pager-select-label',
                text: self.Settings.Interface.RecordsPerPageText
            });
            var $pageSizePicker = $('<select/>', {
                id: pageSizePickerId,
                'class': 'ex-control-pager-select'
            });
            for (var i = 0; i < self.pageSizes.length; i++) {
                var pageSize = self.pageSizes[i];
                $('<option/>', {
                    value: pageSize,
                    text: pageSize
                }).appendTo($pageSizePicker);
            }
            $pageSizePicker.val(self.defaultValue);
            $pageSizePicker.on('change', function(s, e) {
                if (isNumeric(this.value)) {
                    var newPage = parseInt(self._lastPageSize * (self.CurrentPage - 1) / this.value, 10) + 1;
                    self.PageSize = this.value;
                    self.PagesCount = Math.ceil(self.TotalResults / self.PageSize);
                    self.page(newPage);
                }
            });

            //region jSelectors initializing.
            self.panel.selector = 'div#' + panelId;
            self.leftPart.selector = 'div#' + leftPartId;
            self.firstPageBtn.selector = 'div#' + firstPageBtnId;
            self.previousPageBtn.selector = 'div#' + previousPageBtnId;
            self.currentPage.selector = 'input#' + currentPageId;
            self.pagesCount.selector = 'span#' + pagesCountId;
            self.nextPageBtn.selector = 'div#' + nextPageBtnId;
            self.lastPageBtn.selector = 'div#' + lastPageBtnId;
            self.totalResults.selector = 'span#' + totalResultsId;
            self.rightPart.selector = 'div#' + rightPartId;
            self.pageSizePicker.selector = 'select#' + pageSizePickerId;
            //endregion

            $leftPart.append($firstPageBtn);
            $leftPart.append($previousPageBtn);
            $leftPart.append($currentPage);
            $leftPart.append($prePagesCount);
            $leftPart.append($pagesCount);
            $leftPart.append($nextPageBtn);
            $leftPart.append($lastPageBtn);
            $leftPart.append($preTotalResults);
            $leftPart.append($totalResults);
            $leftPart.append($postTotalResults);
            $panel.append($leftPart);
            $rightPart.append($pageSizePicker);
            $rightPart.append($recordsPerPage);
            $panel.append($rightPart);
            $parent.append($panel);
        };

        init();
    };
    dxKindPager.prototype = Object.create(exKoPager.prototype);
    dxKindPager.prototype.constructor = dxKindPager;

    return {
        FogContainer: fogContainer,
        DxKindPager: dxKindPager,
        DxKindPopup: dxKindPopup,
        PopupManager: popupManager,
        ContentManager: contentManager
    }
});