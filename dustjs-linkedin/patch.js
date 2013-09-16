/* this patch makes the distributed dust.js file return a working instance of dust when run from vertx.io */
var exports = undefined;
function getGlobal() {
	return this.dust;
}

