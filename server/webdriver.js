(function() {
	var clients = {};
	var accordion;
	function renderClients() {
		var target = $('#qunit-userAgent');
		target.empty();
		for (var i in clients) {
			var infoDiv = $('<h3 id="accordion-header-'+clients[i].clientId+'">' + clients[i].userAgent + '</h3>');
			var testOl = $('<div id="qunit-tests_'+clients[i].clientId+'"></div>')
			target.append(infoDiv);
			target.append(testOl);
		}
		accordion = $('#qunit-userAgent').accordion({autoheight: false,alwaysOpen: false });
	}

	$(document).ready(function() {
		$('#run').click(function() {
			socket.emit('request_tests', {scripts:['test.js']});
		});
	});

	var socket = io.connect();
	socket.on('connect', function() {
		console.log("Sending client info");
		socket.emit('client_info', {
			userAgent:navigator.userAgent
		});
	});
	/**
	 * Server is reporting test results from other client.
	 * */
	socket.on('test_data',function(data) {
		var html = [
					'Tests completed in ',
					data.runtime,
					' milliseconds.<br/>',
					'<span class="passed">',
					data.passed,
					'</span> tests of <span class="total">',
					data.total,
					'</span> passed, <span class="failed">',
					data.failed,
					'</span> failed.'
				].join('');

		$('#qunit-tests_'+data.clientId).empty();
		$('#qunit-tests_'+data.clientId).append($('<div></div>').html(html));
		if(data.failed > 0) {
			$('#accordion-header-'+data.clientId).addClass("ui-accordion-header-failed");
			var index = 0;
			$('#qunit-userAgent').find('h3').each(function(asd,index) {
				if($(this).hasClass('ui-accordion-header-failed')) {
					accordion.accordion("activate", index) ;
				}
			});

		}
	});

	socket.on('test', function(data) {
		QUnit.reload(data.scripts);
	});
	socket.on('clients', function(data) {
		console.dir(data);
		clients = data;
		renderClients();
		/*   console.log("Connected info");
		 var userAgent = data.userAgent;
		 var clientId = data.clientId;
		 var infoDiv = jQuery('<div/>',{
		 id:clientId
		 }).append('<p>'+userAgent+'</p>');
		 console.dir(infoDiv);
		 $('#qunit-userAgent').append(userAgent);*/
	});

	QUnit.extend(QUnit, {
		reload:function(scripts) {
			QUnit.reset();
			QUnit.init();
			/* load the tests */
			var loaded = 0, count = scripts.length;
			for (var i in scripts) {
				$.getScript(scripts[i], function(s, status) {
					loaded++;
					if (loaded >= count) {
						QUnit.start();
					}
					console.log("script " + status + " loaded")
				});
			}

		}
	});
	QUnit.done(function(data) {
		data.failed = 1;
		socket.emit('test_data',data);
	});
	console.dir(QUnit);
})();