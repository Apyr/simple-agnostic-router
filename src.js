import {defineEvent} from 'define-event';

//History

export class BaseHistory {

	constructor() {
		defineEvent(this, 'onPathChange');
		this._initialized = false;
		setTimeout(() => {
			if (!this._initialized) this.onPathChange();
		}, 1);
	}

	_emitPathChange() {
		this._initialized = true;
		this.onPathChange();
	}

	_normalizePath(path) {
		if (path.indexOf('/') != 0) path = '/' + path;
		return path;
	}

	getPath() {
		throw new Error('Not implemented');
	}

	go(path) {
		throw new Error('Not implemented');
	}
}

export class Html5History extends BaseHistory {
	
	constructor() {
		super();
		window.addEventListener('popstate', () => this._emitPathChange());
	}
	
	getPath() {
		return this._normalizePath(window.location.pathname);
	}
	
	go(path) {
		window.history.pushState(null, null, this._normalizePath(path));
		setTimeout(() => this._emitPathChange(), 1);
	}
}

export class HashHistory extends BaseHistory {
	
	constructor() {
		super();
		window.addEventListener('hashchange', () => this._emitPathChange());
	}
	
	_normalizePath(path) {
		if (path.indexOf('#') == 0) path = path.substring(1);
		if (path.indexOf('!') == 0) path = path.substring(1);
		return super._normalizePath(path);
	}
	
	getPath() {
		return this._normalizePath(window.location.hash);
	}
	
	go(path) {
		window.location.hash = '#' + path;
	}
}

export class MemoryHistory extends BaseHistory {
	
	constructor(firstPath = '/') {
		super();
		this._pathArray = [this._normalizePath(firstPath)];
	}
	
	getPath() {
		return this._pathArray[this._pathArray.length - 1];
	}
	
	go(path) {
		this._pathArray.push(this._normalizePath(path));
		setTimeout(() => this._emitPathChange(), 1);
	}
}

//Router

function parse(rule, path) {
	const r = path.match(rule.pattern);
	if (r) {
		const paramValues = r.slice(1);
		const params = {};
		for (let i = 0; i < paramValues.length; i++) {
			params[rule.paramNames[i]] = paramValues[i];
		}
		return params;
	} else {
		return null;
	}
}

function contains(classList, className) {
	for (let i = 0; i < classList.length; i++) {
		if (classList[i] == className) return true;
	}
	return false;
}

export class Router {
	
	constructor(history = new Html5History()) {
		this.history = history;
		this.history.onPathChange.add(() => this._route(this.history.getPath()));
		this._rules = [];
		this._defaultValue = null;
		this._basePath = '';
		defineEvent(this, 'onRoute');
	}
	
	get basePath() {
		return this._basePath;
	}
	
	set basePath(path) {
		this._basePath = this.history._normalizePath(path);
		if (this._basePath.lastIndexOf('/') == this._basePath.length - 1) {
			this._basePath = this._basePath.substring(0, this._basePath.length - 1);
		}
	}
	
	_route(path) {
		if (this._basePath) path = path.substring(this._basePath.length);
		
		for (let i = this._rules.length - 1; i >= 0; i--) {
			const r = parse(this._rules[i], path);
			if (r !== null) {
				this.onRoute({path, rule: this._rules[i].rule, value: this._rules[i].value, params: r});
				return;
			}
		}
		
		this.onRoute({path, rule: '*', params: {}, value: this._defaultValue});
	}
	
	add(rules, value = undefined) {
		if (rules == '*') {
			this._defaultValue = value;
		} else if (typeof (rules) == 'string') {
			let path = rules;
			const result = {value, paramNames: [], rule: path};
			const parts = path.split('/');
			for (let i = 0; i < parts.length; i++) {
				if (parts[i].indexOf(':') == 0) {
					result.paramNames.push(parts[i].substring(1));
				}
			}
			result.pattern = new RegExp('^' + path.replace(/:\w+/, '(\\w+)') + '$');
			this._rules.push(result);
		} else {
			for (let key in rules) {
				if (rules.hasOwnProperty(key)) {
					this.add(key, rules[key]);
				}
			}
		}
	}
	
	go(path) {
		if (this._basePath) path = this._basePath + history._normalizePath(path);
		this.history.go(path);
	}
	
	setInterceptor(className = 'routing') {
		window.document.body.addEventListener('click', event => {
			const target = event.target;
			if (target.tagName == 'a' || target.tagName == 'A') {
				const classList = target.classList || target.className.split(' ');
				if (contains(classList, className)) {
					event.preventDefault();
					this.go(target.pathname);
				}
			}
		});
	}
}