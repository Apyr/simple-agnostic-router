'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Router = exports.MemoryHistory = exports.HashHistory = exports.Html5History = exports.BaseHistory = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _defineEvent = require('define-event');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//History

var BaseHistory = exports.BaseHistory = function () {
	function BaseHistory() {
		var _this = this;

		_classCallCheck(this, BaseHistory);

		(0, _defineEvent.defineEvent)(this, 'onPathChange');
		this._initialized = false;
		setTimeout(function () {
			if (!_this._initialized) _this.onPathChange();
		}, 1);
	}

	_createClass(BaseHistory, [{
		key: '_emitPathChange',
		value: function _emitPathChange() {
			this._initialized = true;
			this.onPathChange();
		}
	}, {
		key: '_normalizePath',
		value: function _normalizePath(path) {
			if (path.indexOf('/') != 0) path = '/' + path;
			return path;
		}
	}, {
		key: 'getPath',
		value: function getPath() {
			throw new Error('Not implemented');
		}
	}, {
		key: 'go',
		value: function go(path) {
			throw new Error('Not implemented');
		}
	}]);

	return BaseHistory;
}();

var Html5History = exports.Html5History = function (_BaseHistory) {
	_inherits(Html5History, _BaseHistory);

	function Html5History() {
		_classCallCheck(this, Html5History);

		var _this2 = _possibleConstructorReturn(this, (Html5History.__proto__ || Object.getPrototypeOf(Html5History)).call(this));

		window.addEventListener('popstate', function () {
			return _this2._emitPathChange();
		});
		return _this2;
	}

	_createClass(Html5History, [{
		key: 'getPath',
		value: function getPath() {
			return this._normalizePath(window.location.pathname);
		}
	}, {
		key: 'go',
		value: function go(path) {
			var _this3 = this;

			window.history.pushState(null, null, this._normalizePath(path));
			setTimeout(function () {
				return _this3._emitPathChange();
			}, 1);
		}
	}]);

	return Html5History;
}(BaseHistory);

var HashHistory = exports.HashHistory = function (_BaseHistory2) {
	_inherits(HashHistory, _BaseHistory2);

	function HashHistory() {
		_classCallCheck(this, HashHistory);

		var _this4 = _possibleConstructorReturn(this, (HashHistory.__proto__ || Object.getPrototypeOf(HashHistory)).call(this));

		window.addEventListener('hashchange', function () {
			return _this4._emitPathChange();
		});
		return _this4;
	}

	_createClass(HashHistory, [{
		key: '_normalizePath',
		value: function _normalizePath(path) {
			if (path.indexOf('#') == 0) path = path.substring(1);
			if (path.indexOf('!') == 0) path = path.substring(1);
			return _get(HashHistory.prototype.__proto__ || Object.getPrototypeOf(HashHistory.prototype), '_normalizePath', this).call(this, path);
		}
	}, {
		key: 'getPath',
		value: function getPath() {
			return this._normalizePath(window.location.hash);
		}
	}, {
		key: 'go',
		value: function go(path) {
			window.location.hash = '#' + path;
		}
	}]);

	return HashHistory;
}(BaseHistory);

var MemoryHistory = exports.MemoryHistory = function (_BaseHistory3) {
	_inherits(MemoryHistory, _BaseHistory3);

	function MemoryHistory() {
		var firstPath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';

		_classCallCheck(this, MemoryHistory);

		var _this5 = _possibleConstructorReturn(this, (MemoryHistory.__proto__ || Object.getPrototypeOf(MemoryHistory)).call(this));

		_this5._pathArray = [_this5._normalizePath(firstPath)];
		return _this5;
	}

	_createClass(MemoryHistory, [{
		key: 'getPath',
		value: function getPath() {
			return this._pathArray[this._pathArray.length - 1];
		}
	}, {
		key: 'go',
		value: function go(path) {
			var _this6 = this;

			this._pathArray.push(this._normalizePath(path));
			setTimeout(function () {
				return _this6._emitPathChange();
			}, 1);
		}
	}]);

	return MemoryHistory;
}(BaseHistory);

//Router

function parse(rule, path) {
	var r = path.match(rule.pattern);
	if (r) {
		var paramValues = r.slice(1);
		var params = {};
		for (var i = 0; i < paramValues.length; i++) {
			params[rule.paramNames[i]] = paramValues[i];
		}
		return params;
	} else {
		return null;
	}
}

function contains(classList, className) {
	for (var i = 0; i < classList.length; i++) {
		if (classList[i] == className) return true;
	}
	return false;
}

var Router = exports.Router = function () {
	function Router() {
		var _this7 = this;

		var history = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Html5History();

		_classCallCheck(this, Router);

		this.history = history;
		this.history.onPathChange.add(function () {
			return _this7._route(_this7.history.getPath());
		});
		this._rules = [];
		this._defaultValue = null;
		this._basePath = '';
		(0, _defineEvent.defineEvent)(this, 'onRoute');
	}

	_createClass(Router, [{
		key: '_route',
		value: function _route(path) {
			if (this._basePath) path = path.substring(this._basePath.length);

			for (var i = this._rules.length - 1; i >= 0; i--) {
				var r = parse(this._rules[i], path);
				if (r !== null) {
					this.onRoute({ path: path, rule: this._rules[i].rule, value: this._rules[i].value, params: r });
					return;
				}
			}

			this.onRoute({ path: path, rule: '*', params: {}, value: this._defaultValue });
		}
	}, {
		key: 'add',
		value: function add(rules) {
			var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

			if (rules == '*') {
				this._defaultValue = value;
			} else if (typeof rules == 'string') {
				var path = rules;
				var result = { value: value, paramNames: [], rule: path };
				var parts = path.split('/');
				for (var i = 0; i < parts.length; i++) {
					if (parts[i].indexOf(':') == 0) {
						result.paramNames.push(parts[i].substring(1));
					}
				}
				result.pattern = new RegExp('^' + path.replace(/:\w+/, '(\\w+)') + '$');
				this._rules.push(result);
			} else {
				for (var key in rules) {
					if (rules.hasOwnProperty(key)) {
						this.add(key, rules[key]);
					}
				}
			}
		}
	}, {
		key: 'go',
		value: function go(path) {
			if (this._basePath) path = this._basePath + history._normalizePath(path);
			this.history.go(path);
		}
	}, {
		key: 'setInterceptor',
		value: function setInterceptor() {
			var _this8 = this;

			var className = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'routing';

			window.document.body.addEventListener('click', function (event) {
				var target = event.target;
				if (target.tagName == 'a' || target.tagName == 'A') {
					var classList = target.classList || target.className.split(' ');
					if (contains(classList, className)) {
						event.preventDefault();
						_this8.go(target.pathname);
					}
				}
			});
		}
	}, {
		key: 'basePath',
		get: function get() {
			return this._basePath;
		},
		set: function set(path) {
			this._basePath = this.history._normalizePath(path);
			if (this._basePath.lastIndexOf('/') == this._basePath.length - 1) {
				this._basePath = this._basePath.substring(0, this._basePath.length - 1);
			}
		}
	}]);

	return Router;
}();