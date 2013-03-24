/// <reference path="jsMVC.js"/>
/// <reference path="jsMVC._.js"/>
/// <reference path="jsMVC.routing.js"/>
/// <reference path="jsMVC.routing.browser.js"/>
/// <reference path="jsMVC.routing.node.js"/>

(function(browser, node, jsMVC, undefined) {
    "use strict";

    // Imports.
    var nativeHasOwn = Object.prototype.hasOwnProperty,
        routeTable = jsMVC.routeTable,
        Route = routeTable.Route,
        _ = jsMVC._,
        error = _.error,
        isString = _.isString,
        isFunction = _.isFunction,
        isInteger = _.isInteger,
        forEachItem = _.forEachArrayItem,
        forEachKey = _.forEachObjectKey,
        copyProps = _.copyProperties,
        some = _.some,
        reduceRight = _.reduceRight,
        map = _.map,
        Event = _.Event,
        // Local variables.
        separator = "/",
        emptyString = "",
        status = {
            notFound: 404,
            internalError: 500,
            badRequest: 400,
            ok: 200
        },
        errorFilter = "error",
        beforeActionFilter = "beforeAction",
        afterActionFilter = "afterAction",
        authorizeFilter = "authorize",
        parseIntRadix = 10,
        defaultOrder = 0,
        idKey = "id",
        // Routing
        isValidRouteParameter = function(value, canBeEmpty) {
            return (canBeEmpty && (value === undefined || value === emptyString)) || (isString(value) && value.indexOf(separator) === -1 && value !== emptyString);
        },
        validateRouteParameter = function(value, canBeEmpty) {
            if (!isValidRouteParameter(value, canBeEmpty)) {
                error(canBeEmpty ? "Route value must be valid." : "Route value must be valid and not empty.");
            }
            return value ? value.toLowerCase() : value;
        },
        combinePaths = function(child, parent) {
            return (parent ? parent + separator : emptyString) + validateRouteParameter(child);
        },
        // /Routing

        // Cache
        Dictionary = (function() { // Case-insensitive dictionary
            var constructor = function() {
                this.items = {};
            };

            constructor.prototype = {
                constructor: constructor,

                push: function(key, item) {
                    var lowerCaseKey = key.toLowerCase();
                    if (nativeHasOwn.call(this.items, lowerCaseKey)) {
                        error("Key '" + key + "' must be unique.");
                    }
                    this.items[lowerCaseKey] = item;
                    return item;
                },

                get: function(key) {
                    return this.items[key.toLowerCase()];
                },

                has: function(key, item) {
                    key = key.toLowerCase();
                    if (arguments.length > 1) {
                        return this.items[key] === item;
                    }
                    return nativeHasOwn.call(this.items, key);
                }
            };

            return constructor;
        }()),
        List = (function() {
            var constructor = function(isOrderRequired, array) {
                // TODO: Check array.
                this.isOrderRequired = isOrderRequired;
                this.items = array || [];
                if (isOrderRequired && this.items.length > 1) {
                    this.sort();
                }
            };
            constructor.prototype = {
                constructor: constructor,
                sort: function() {
                    this.items.sort(function(a, b) {
                        return a.order - b.order;
                    });
                },

                push: function(item) {
                    if (this.isOrderRequired && !isInteger(item.order)) {
                        error("'order' must be integer.");
                    }

                    this.items.push(item);
                    if (this.isOrderRequired) {
                        this.sort();
                    }
                    return item;
                },

                get: function(index) {
                    return this.items[index];
                },

                has: function(item) {
                    for (var index = 0; index < this.items.length; index++) {
                        if (item === this.items[index]) {
                            return true;
                        }
                    }
                    return false;
                },

                toArray: function() {
                    return this.items.slice();
                },

                forEach: function(callback, context) {
                    forEachItem(this.items, callback, context);
                },

                map: function(callback, initial) {
                    return new List(this.isOrderRequired, map(this.items, callback, initial));
                },

                reduceRight: function(callback, initial) {
                    return reduceRight(this.items, callback, initial);
                },

                some: function(callback, context) {
                    return some(this.items, callback, context);
                },

                length: function() {
                    return this.items.length;
                }
            };

            return constructor;
        }()),
        allAreas = new Dictionary(),
        allControllers = new Dictionary(),
        allActions = new Dictionary(),
        globalFilters = new List(true),
        // /Cache

        // Filter

        Filter = function(authorize, beforeAction, afterAction, fail, order) {
            if (authorize && !isFunction(authorize)) {
                error("'authorize' must be empty or function.");
            }
            if (beforeAction && !isFunction(beforeAction)) {
                error("'beforeAction' must be empty or function.");
            }
            if (afterAction && !isFunction(afterAction)) {
                error("'afterAction' must be empty or function.");
            }
            if (fail && !isFunction(fail)) {
                error("'fail' must be empty or function.");
            }
            this[authorizeFilter] = authorize;
            this[beforeActionFilter] = beforeAction;
            this[afterActionFilter] = afterAction;
            this[errorFilter] = fail;
            this.order = parseInt(order, parseIntRadix) || defaultOrder;
            if (!isInteger(this.order)) {
                error("'order' must be integer or undefined.");
            }
        },
        getFilterList = function(optionsArray) {
            var filters = new List(true),
                filter;
            forEachItem(optionsArray, function(options) {
                filter = new Filter(options[authorizeFilter], options[beforeActionFilter], options[afterActionFilter], options[errorFilter], options.order);
                filters.push(filter);
            });
            return filters;
        },
        executeFilters = function(event, levels, filterType) {
            var result,
                execute;
            forEachItem(levels, function(filters) {
                if (filters) {
                    filters.forEach(function(filter) {
                        execute = filter[filterType];
                        if (execute) {
                            result = execute(event); // TODO
                            if (result) {
                                return true;
                            }
                        }
                        return false;
                    });
                    if (result) {
                        return true;
                    }
                }
                return false;
            });
            return result;
        },
        pushFilter = function(options) {
            var filter = new Filter(options[authorizeFilter], options[beforeActionFilter], options[afterActionFilter], options[errorFilter], options.order),
                target = options.target;
            if (!target) {
                globalFilters.push(filter);
            } else {
                if (target.filters) {
                    target.filters.push(filter);
                } else {
                    error("'target' must be valid area, controller, or action.");
                }
            }
        },
        getGlobalFilters = function() {
            return globalFilters.toArray();
        },
        // /Filter

        // Action

        Action = (function() {
            var constructor = function(controller, id, execute, filters) {
                if (!controller || !allControllers.has(controller.virtualPath, controller)) {
                    error("'controller' must be valid.");
                }
                id = validateRouteParameter(id);
                if (!isFunction(execute)) {
                    error("'execute' must be function.");
                }
                this.controller = controller;
                this[idKey] = id;
                this.execute = execute;
                this.filters = filters;
                this.virtualPath = combinePaths(id, controller.virtualPath);
            };

            constructor.prototype = {
                constructor: constructor,
                Filter: function(options) {
                    options.target = this;
                    return pushFilter(options);
                },

                getFilters: function() {
                    return this.filters.toArray();
                }
            };
            return constructor;
        }()),
        pushAction = function(options) {
            var filters = getFilterList(options.filters),
                action;
            if (isFunction(options)) {
                options = {
                    controller: options.controller,
                    execute: options // TODO: Refactor.
                };
                options[idKey] = options.actionId;
            }
            action = new Action(options.controller, options[idKey], options.execute, filters);
            return allActions.push(action.virtualPath, action);
        },
        // /Action

        // Controller

        Controller = (function() {
            var constructor = function(id, area, filters) {
                id = validateRouteParameter(id);
                if (area && !allAreas.has(area.virtualPath, area)) {
                    error("'area' must be valid or empty.");
                }
                this[idKey] = id;
                this.area = area;
                this.virtualPath = combinePaths(id, area ? area.virtualPath : undefined);
                this.filters = filters;
            };

            constructor.prototype = {
                constructor: constructor,
                Action: function(options) {
                    options.controller = this;
                    return pushAction(options);
                },

                Filter: function(options) {
                    options.target = this;
                    return pushFilter(options);
                },

                getAction: function(id) {
                    return allActions.get(combinePaths(id, this.virtualPath));
                },

                getFilters: function() {
                    return this.filters.toArray();
                }
            };
            return constructor;
        }()),
        getActionOptions = function(options, id) {
            if (isFunction(options)) {
                options = {
                    execute: options
                };
            }
            if (!(nativeHasOwn.call(options, idKey))) {
                options[idKey] = id;
            }
            return options;
        },
        pushController = function(options) {
            var filters,
                controller;
            if (!options.area && options.areaId) {
                options.area = allAreas.get(options.areaId);
            }
            filters = getFilterList(options.filters);
            controller = new Controller(options[idKey], options.area, filters);
            allControllers.push(controller.virtualPath, controller);
            forEachKey(options.actions, function(actionId, actionOptions) {
                actionOptions = getActionOptions(actionOptions, actionId);
                controller.Action(actionOptions);
            });
            return controller;
        },
        getController = function(id) {
            return allControllers.get(id);
        },
        // /Controller

        // Area

        Area = (function() {
            var constructor = function(id, filters) {
                this.virtualPath = this[idKey] = validateRouteParameter(id);
                this.filters = filters;
            };

            constructor.prototype = {
                constructor: constructor,
                Route: function(options) {
                    options.areaId = this[idKey];
                    return pushRoute(options);
                },

                Controller: function(options) {
                    options.area = this;
                    return pushController(options);
                },

                Filter: function(options) {
                    options.target = this;
                    return pushFilter(options);
                },

                getController: function(id) {
                    return allControllers.get(combinePaths(id, this.virtualPath));
                },

                getFilters: function() {
                    return this.filters.toArray();
                }
            };
            return constructor;
        }()),
        pushArea = function(options) {
            var filters = getFilterList(options.filters),
                area = new Area(options[idKey], filters);
            allAreas.push(area.virtualPath, area);
            forEachKey(options.controllers, function(controllerId, controllerOptions) {
                if (!nativeHasOwn.call(controllerOptions, idKey)) {
                    controllerOptions[idKey] = controllerId;
                }
                area.Controller(controllerOptions);
            });
            forEachKey(options.routes, function(routeId, routeOptions) {
                if (!nativeHasOwn.call(routeOptions, idKey)) {
                    routeOptions[idKey] = routeId;
                }
                area.Route(routeOptions);
            });
            return area;
        },
        getArea = function(id) {
            return allAreas.get(id);
        },
        // /Area

        // Execute
        executeResult = function(event, result) {
            if (result) {
                result.execute(event);
            }
        },
        handleError = function(event, errorObject, errorStatus, filterLevels) {
            copyProps(event, {
                status: errorStatus,
                error: errorObject
            }, true);
            var result = executeFilters(event, filterLevels, errorFilter);
            if (!result) {
                throw errorObject;
            }
            return executeResult(event, result);
        },
        executeWithFilter = function(event, before, execute, after) {
            var result,
                hasError = false;

            if (before) {
                result = before(event);
            }
            if (result) {
                return result;
            }
            try {
                result = execute(event);
            } catch (e) {
                hasError = true;
                copyProps(event, {
                    status: status.internalError,
                    error: e
                }, true);
                if (after) {
                    result = after(event);
                }
                if (!result) {
                    throw e;
                }
            }
            if (!hasError && after) {
                event.result = result;
                result = after(event);
            }
            return result;
        },
        executeAction = function(routeData, virtualPath, actionId, controllerId, areaId /* optional */) {
            var result,
                event = routeData.dataTokens.event || new Event(),
                action,
                filterLevels,
                execute;

            delete routeData.dataTokens.event;

            // 1. Validate segments.
            try {
                copyProps(event, {
                    actionId: validateRouteParameter(actionId),
                    controllerId: validateRouteParameter(controllerId),
                    areaId: validateRouteParameter(areaId, true)
                });
            } catch (e) {
                return handleError(event, e, status.badRequest, [globalFilters]);
            }

            // 2. Find action.
            action = allActions.get(combinePaths(actionId, combinePaths(controllerId, areaId)));
            if (!action) {
                // Action is not found.
                return handleError(event, new Error("Action cannot be found."), status.notFound, [globalFilters]);
            }

            // Action is found.
            copyProps(event, {
                actionVirtualPath: action.virtualPath,
                action: action,
                controller: action.controller,
                area: action.controller.area
            });
            filterLevels = [globalFilters, event.area ? event.area.filters : null, event.controller.filters, event.action.filters];
            try {
                // 3. Execute authorize filters
                result = executeFilters(event, filterLevels, authorizeFilter);
                if (result) {
                    return executeResult(event, result);
                }

                // 4. Execute action with beforeAction and after Action filters
                execute = event.action.filters.reduceRight(function(continuation, filter) {
                    return function() {
                        return executeWithFilter(event, filter[beforeActionFilter], continuation, filter[afterActionFilter]);
                    };
                }, action.execute);
                result = execute(event);
            } catch (e2) {
                return handleError(event, e2, status.internalError, filterLevels);
            }

            return executeResult(event, result);
        },
        // /Execute

        // MvcRouteHandler

        mvcRouteHandler = function(routeData, virtualPath) {
            executeAction(routeData, virtualPath, routeData.values.action, routeData.values.controller, routeData.dataTokens.area);
        },
        pushRoute = function(options) {
            if (options.areaId) {
                options.dataTokens = options.dataTokens || {};
                options.dataTokens.area = validateRouteParameter(options.areaId);
            }
            var route = new Route(options.url, options.defaults, options.constraints, options.dataTokens, mvcRouteHandler, options[idKey]);

            return routeTable.push(route);
        },
        // /MvcRoutHandler

        // Config
        configKeys = {
            areas: pushArea,
            controllers: pushController,
            routes: pushRoute
        },
        push = function(configs) {
            if (isString(configs) && node) { // configs is a path.
                configs = node(configs);
            }
            // Filters.
            forEachItem(configs.filters, function(options) {
                pushFilter(options);
            });
            // Areas, controllers, routes.
            forEachKey(configKeys, function(configKey, pushMethod) {
                forEachKey(configs[configKey], function(optionsKey, options) {
                    if (!nativeHasOwn.call(options, idKey)) {
                        options[idKey] = optionsKey;
                    }
                    pushMethod(options);
                });
            });

            return jsMVC;
        };
    // /Config

    // Exports.
    copyProps(jsMVC, {
        Route: pushRoute,
        Area: pushArea,
        Controller: pushController,
        Filter: pushFilter,
        getArea: getArea,
        getController: getController,
        getFilters: getGlobalFilters,
        config: push,
        status: status
    });
    
    _.executeGlobalErrorFilters = function(event) {
        executeFilters(event, [globalFilters], errorFilter);
    };
    // /Exports.
    
}(this.window, !this.window && require, this.jsMVC || exports));
