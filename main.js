var vertx = require("vertx.js");
var console = require('vertx/console');
var container = require('vertx/container');

var logger = container.logger;
var config = container.config;

var eb = vertx.eventBus;

var engines = [ "dustjs-linkedin" ];

var main = function() {
	var handler = undefined;
	try {
		if (config.engine == "dustjs-linkedin") {
			var DustHandler = require('dustjs-linkedin');
			handler = new DustHandler({
				logger : logger,
				eb : eb,
			// version : config.version ? config.version : "2.0.3"
			});
		}
	} catch (e) {
		logger.error(e + "\n" + e.stack);
		logger.info('template module crashed during startup');
		throw (e);
	}

	if (handler) {
		logger.info('template module started ' + handler.getVersion());
	} else {
		throw (new Error("could not find template engine '" + config.engine
				+ "'.  set config.engine to one of these: "
				+ JSON.stringify(engines)));
	}

}();