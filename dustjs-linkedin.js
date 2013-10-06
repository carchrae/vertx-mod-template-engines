function DustHandler(options) {
	var logger = options.logger, eb = options.eb, version = options.version, dustPath = options.dustPath, helperVersion = options.helperVersion, dustHelpersPath = options.dustHelpersPath;
	if (!logger || !eb)
		throw Error("You must pass a logger and eb (eventBus)");

	if (!dustPath)
		dustPath = "node_modules/dustjs-linkedin/";
	if (!dustHelpersPath)
		dustHelpersPath = "node_modules/dustjs-helpers/";
	if (!helperVersion)
		helperVersion = "1.1.1";

	this.getVersion = function() {
		return version ? version : "using dust lib files";
	};

	if (version)
		dust = loadFromClientDistribution(version);
	else
		dust = loadNodeFiles();

	logger.debug("dust keys " + JSON.stringify(Object.keys(dust)));
	function logError(method, msg, e) {
		logger.error(method + " failed processing " + JSON.stringify(msg));
		if (e && e.stack)
			logger.error("with error: " + e + "\n" + e.stack);
	}

	function logDebug(msg) {
		logger.debug(msg);
	}

	function makeContext(context) {
		var contextType = Object.prototype.toString.call(context);
		if (contextType === "[object Array]") {
			var len = context.length, array = context;
			logDebug("context is array " + len + ". making context ");
			if (len == 0)
				context = {};
			else
				context = dust.makeBase(array[0]);
			for ( var i = 0; i < len; i++){
				context = context.push(array[i]);
				logDebug("context push " +JSON.stringify(array[i]));
			}
		} else {
			logDebug("context was " + contextType);
		}
		return context;
	}

	function loadNodeFiles() {
		logDebug("loading from node source files in " + dustPath + "lib");
		var dust = require(dustPath + "lib/dust");
		var compiler = require(dustPath + "lib/compiler");
		compiler = compiler(dust);
		dust.compile = compiler.compile;
		var parser = require(dustPath + "lib/parser");
		compiler.parse = parser.parse;
		require(dustHelpersPath + "lib/dust-helpers");
		return dust;
	}

	function loadFromClientDistribution(version) {
		var file = require("vertx/file_system");
		var Buffer = require("vertx/buffer");
		logDebug("loading client distribution file in " + dustPath + "lib"
				+ version);
		var patchFile = dustPath + "dist/dust-full-" + version + ".patched.js";

		var patch = file.readFileSync("dustjs-linkedin/patch.js");
		var src = file.readFileSync(dustPath + "dist/dust-full-" + version
				+ ".js");
		var srcNew = new Buffer(src.toString().replace("function getGlobal",
				patch + "function getGlobalOld"));

		if (file.existsSync(patchFile)
				&& srcNew.equals(file.readFileSync(patchFile))) {
			logDebug("it appears this version already has patched file.");
		} else {
			file.writeFileSync(patchFile, srcNew);
		}
		load(patchFile);
		load(dustHelpersPath + "dist/dust-helpers-" + helperVersion + ".js");
		return dust;
	}

	function compileHandler(m, reply) {
		try {
			logDebug("compileHandler: " + JSON.stringify(m));
			var compiled = dust.compile(m.source, m.name);
			dust.loadSource(compiled);
			logDebug("compileHandler finished");
			reply({
				success : true,
				name : m.name
			});
		} catch (e) {
			logError("compileHandler", m, e);
			reply({
				error : "failed to compile " + m.name + ".  "  + e
			});
		}
	}

	function loadHandler(m, reply) {
		try {
			dust.loadSource(m.compiled, m.name);
			reply(m);
		} catch (e) {
			logError("loadHandler", m, e);
			reply({
				error : e.stack
			});
		}
	}
	;

	function renderHandler(m, reply) {
		try {
			var context = makeContext(m.context);
			logDebug("rendering " + m.name);
			dust.render(m.name, context, function(err, out) {
				if (err) {
					logError("" + err);
					logError("caused by : " + JSON.stringify(m));
					reply({
						error : "" + err
					});
				} else {
					reply({
						output : out
					});
				}
			});
		} catch (e) {
			logDebug("error rendering " + m.name); 
			logError("render", m, e);
			reply({
				error : "exception while rendering " + m.name + ".  " + e
			});
		}
	}

	eb.registerHandler("dust.compile", compileHandler);
	eb.registerHandler("dust.load", loadHandler);
	eb.registerHandler("dust.render", renderHandler);
};

module.exports = DustHandler;