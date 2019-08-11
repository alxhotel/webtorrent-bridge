/* global module, require */

module.exports = Server

var debug = require('debug')('webtorrent-bridge')
var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')

inherits(Server, EventEmitter)

/**
 * Webtorrent bridge server.
 *
 * HTTP service which responds to GET requests from torrent clients. Requests include
 * metrics from clients that help the tracker keep overall statistics about the torrent.
 * Responses include a peer list that helps the client participate in the torrent.
 *
 * @param {Object}  opts            options object
 * @param {Number}  opts.interval   tell clients to announce on this interval (ms)
 * @param {Number}  opts.trustProxy trust 'x-forwarded-for' header from reverse proxy
 * @param {boolean} opts.http       start an http server? (default: true)
 * @param {boolean} opts.udp        start a udp server? (default: true)
 * @param {boolean} opts.ws         start a websocket server? (default: true)
 * @param {boolean} opts.stats      enable web-based statistics? (default: true)
 * @param {function} opts.filter    black/whitelist fn for disallowing/allowing torrents
 */
function Server(opts) {
	var self = this
	if (!(self instanceof Server)) {
		return new Server(opts)
	}
	EventEmitter.call(self)
	if (!opts) {
		opts = {}
	}

	debug('new server %s', JSON.stringify(opts))
}

Server.prototype._onError = function (err) {
	var self = this
	self.emit('error', err)
}

Server.prototype.close = function (cb) {
	//var self = this
	if (!cb) {
		cb = noop
	}
	debug('close')
}

function noop () {}