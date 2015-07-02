(function() {

	/* POLL CONTROLLER */

	function PollController() {
		var poll = new Poll(),
				view = new PollView(poll),
				render = view.render.bind(view);
		poll.addObserver(render);
		poll.getSurvey();
	}

	/* POLL VIEW */

	function PollView(poll) {
		this.poll = poll;
		this.dom = {
			poll : document.getElementById('poll')
		};
		this.dom.question = this.dom.poll.one('.question');
		this.dom.results = this.dom.poll.one('.results');
		this.dom.voteButton = this.dom.question.one('.buttons input[type=submit]');
		this.dom.viewButton = this.dom.question.one('.buttons .view-results');
		this.dom.questionButton = this.dom.results.one('.buttons .view-question');
		this.dom.questionContent = this.dom.question.one('.content');
		this.dom.resultsContent = this.dom.results.one('.content');
		this.bindEvents();
	}

	PollView.prototype.bindEvents = function() {
		var that = this;
		that.dom.voteButton.addEventListener("click", function(event) {
			event.preventDefault();
			if(typeof that.poll.vote !== 'undefined') {
				that.poll.vote.votes += 1;
				that.poll.sum += 1;
				that.poll.voted = true;
				that.dom.questionButton.style.display = 'none';
				that.poll.voteSurvey();
				that.renderResults();
				that.dom.question.removeClass('active');
				that.dom.results.addClass('active');
			}
		}, false);
		that.dom.viewButton.addEventListener("click", function(event) {
			event.preventDefault();
			that.dom.question.removeClass('active');
			that.dom.results.addClass('active');
		}, false);
		that.dom.questionButton.addEventListener("click", function(event) {
			event.preventDefault();
			that.dom.results.removeClass('active');
			that.dom.question.addClass('active');
		}, false);
	};

	PollView.prototype.render = function() {
		if(this.poll.active) {
			this.renderQuestion();
			this.renderResults();
		} else {
			this.dom.poll.remove();
		}
	};

	PollView.prototype.renderQuestion = function() {
		var poll = this.poll,
				i, option, radioChange, createLabel;
		this.dom.questionContent.innerHTML = "";
		this.dom.questionContent.appendElement("h3", this.poll.question);
		radioChange = function(event) {
			poll.vote = this.data.option;
		};
		createLabel = function(label) {
			label
				.prependElement('input', undefined, function(radio) {
					radio.type = 'radio';
					radio.name = 'question';
					radio.value = option.name;
					radio.on("change", radioChange);
					radio.data = {
						option : option
					};
				});
		};
		for(i in this.poll.options) {
			option = this.poll.options[i];
			this.dom.questionContent.appendElement('label', ' ' + option.name, createLabel);
		}
	};

	PollView.prototype.renderResults = function() {
		var header, i, createResult,
				result, name, bar, value, percent = 0;
		this.dom.resultsContent.innerHTML = "";
		this.dom.resultsContent.appendElement("h3", this.poll.question);
		createResult = function(result) {
			result.className = 'result';
			result
				.appendElement("span", option.name, function(name) {
					name.className = 'name';
				})
				.appendElement("span", "", function(bar) {
					bar.className = 'bar';
					bar.style.width = percent + '%';
					bar.appendElement("span", percent + '%', function(value) {
						value.className = 'value';
					});
				});
		};
		for(i in this.poll.options) {
			option = this.poll.options[i];
			percent = this.poll.sum === 0? 0 : Math.round(option.votes / this.poll.sum * 100);
			this.dom.resultsContent.appendElement("div", "", createResult);
		}
	};

	/* MODEL OBJECT */

	function Model() {
		this.observers = [];
	}

	Model.prototype.addObserver = function(fn) {
		this.observers.push(fn);
	};

	Model.prototype.ajax = function(url, data, callback, method) {
		var request = new XMLHttpRequest();
		data = typeof data !== 'undefined'? data : {};
		method = typeof method !== 'undefined'? method : 'POST';
		request.open(method, url, true);
		request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		request.onreadystatechange = function () {
		  if (request.readyState != 4 || request.status != 200) return;
		  callback(request.responseText);
		};
		request.send(JSON.stringify(data));
	};

	Model.prototype.makeParams = function(data) {
		var result = '',
				key, value;
		for(key in data) {
			value = data[key];
			result += (result.length? '&' : '') + key + '=' + value;
		}
		return result;
	};

	/* POLL MODEL */

	Poll.prototype = Object.create(Model.prototype);
	Poll.prototype.constructor = Poll;

	function Poll() {
		Model.call(this);
		this.id = 0;
		this.question = '';
		this.options = [];
		this.voted = false;
		this.vote = undefined;
		this.sum = 0;
		this.active = true;
	}

	Poll.prototype.getSurvey = function() {
		that = this;
		this.ajax("json/get.json", {}, function(data) {
			that.makePoll(data === ''? '' : JSON.parse(data));
		});
	};

	Poll.prototype.voteSurvey = function() {
		this.ajax("json/vote.json", {
			poll_id : this.id,
			option : this.vote.id
		}, function(data) {});
	};

	Poll.prototype.makePoll = function(data) {
		var i = 1,
				limit = 10,
				name,
				votes,
				j;
		if(data !== '') {
			this.id = data.id;
			this.question = data.question;
			while(i <= limit) {
				name = data['answer' + i];
				votes = data['answer' + i + 'count'];
				if(name !== '') {
					this.options.push(new Option(i, name, votes));
					this.sum += votes;
				}
				i += 1;
			}
		} else {
			this.active = false;
		}
		for(j in this.observers) {
			this.observers[j]();
		}
	};

	Poll.prototype.toString = function() {
		return '[Object Poll]';
	};

	/* OPTION MODEL */

	function Option(id, name, votes) {
		this.id = id;
		this.name = name;
		this.votes = votes;
	}

	Option.prototype.toString = function() {
		return '[Object Option]';
	};

	/* HELPERS */

	this.one = document.querySelector.bind(document);

	Node.prototype.one = function(selector) {
		return this.querySelector(selector);
	};

	Node.prototype.addClass = function(name) {
		var classes = this.className.split(' ');
		if(classes.indexOf(name) < 0) {
			classes.push(name);
		}
		this.className = classes.join(' ');
	};

	Node.prototype.removeClass = function(name) {
		var classes = this.className.split(' '),
				pos = classes.indexOf(name);
		if(pos >= 0) {
			classes.splice(pos, 1);
		}
		this.className = classes.join(' ');
	};

	Node.prototype.hasClass = function(name) {
		return this.className.split(" ").indexOf(name) >= 0;
	};

	Node.prototype.toggleClass = function(name) {
		if(this.hasClass(name)) {
			this.removeClass(name);
		} else {
			this.addClass(name);
		}
	};

	Node.prototype.createElement = function(tag, html, callback) {
		var element = document.createElement(tag),
				name;
		if(typeof html === 'string' && html !== '') {
			element.innerHTML = html;
		}
		if(typeof callback === 'function') {
			callback(element);
		}
		return this;
	};

	Node.prototype.prependElement = function(tag, html, callback) {
		var parent = this;
		this.createElement(tag, html, function(element) {
			parent.prependChild(element);
			if(typeof callback === 'function') {
				callback(element);
			}
		});
		return this;
	};

	Node.prototype.appendElement = function(tag, html, callback) {
		var parent = this;
		this.createElement(tag, html, function(element) {
			parent.appendChild(element);
			if(typeof callback === 'function') {
				callback(element);
			}
		});
		return this;
	};

	Node.prototype.appendTo = function(parent) {
		parent.appendChild(this);
		return this;
	};

	Node.prototype.prependChild = function(element) {
		if(this.childNodes.length > 0) {
			this.insertBefore(element, this.childNodes[0]);
		} else {
			this.appendChild(element);
		}
	};

	Node.prototype.on = window.on = function(name, fn) {
		this.addEventListener(name, fn);
		return this;
	};

	/* MAIN CODE */

	var pollNode = document.getElementById("poll");
	pollNode.one(".icon").on("click", function() {
		pollNode.toggleClass("opened");
	});

	return new PollController();

})();