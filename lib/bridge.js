/* global require, process */

'use strict'

var debug = require('debug')('webtorrent-bridge')
var EventEmitter = require('events').EventEmitter
var PeerGroup = require('./peerGroup.js')
var assign = require('object-assign')
var proto = require('bitcoin-protocol')
var through = require('through2').obj
var pump = require('pump')
var pkg = require('../package.json')
var getBrowserRTC = require('get-browser-rtc')

var webtorrentClient = require('./webtorrent/client')
var bittorrentClient = require('./bittorrent/client')

// Default port for server bridge
var DEFAULT_BRIGE_PORT = 8124

inherits(Bridge, EventEmitter)

/**
 * Webtorrent bridge
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
function Bridge(opts) {
	var self = this
	if (!(self instanceof Bridge)) {
		return new Bridge(opts)
	}
	EventEmitter.call(self)
	opts = opts || {}
	
	// Listen on given port
	if(!opts.port) opts.port = DEFAULT_BRIGE_PORT
	
	opts = opts || {}
    this._numPeers = opts.numPeers || 8
    this.peers = []
    this._hardLimit = opts.hardLimit || false
	this.tcpPort = null
    this.websocketPort = null
    this._connectWeb = (opts.connectWeb != null)
      ? opts.connectWeb
	  : process.browser
    this.connectTimeout = (opts.connectTimeout != null)
      ? opts.connectTimeout
	  : 8 * 1000
    this.peerOpts = (opts.peerOpts != null)
      ? opts.peerOpts
	  : {}
    this.connecting = false
    this.closed = false
    this.accepting = false

    var wrtc = opts.wrtc || getBrowserRTC()

	debug('new bridge %s', JSON.stringify(opts))
}

Bridge.prototype._onConnection = function(err, client) {
	if (err) {
		this.emit('connectError', err, null)
		return
	}
	if (!client.incoming) return
	this.emit('connection', client)
	this._connectPeer(function (err, bridgePeer) {
		if (err) {
			this.emit('connectError', err)
			return setImmediate(function () {
				this._onConnection(null, client)
			})
		}
		debug('connected to TCP peer for bridging: ' + bridgePeer.remoteAddress)
		var onError = function (err) {
			if (!err) return
			client.destroy()
			bridgePeer.destroy()
			debug('error', err.message)
			this.emit('peerError', err, client, bridgePeer)
		}
		client.once('error', onError)
		bridgePeer.once('error', onError)
		client.once('close', function () {
			bridgePeer.destroy()
		})
		bridgePeer.once('close', function () {
			client.destroy()
		})
		
		client.pipe(bridgePeer)
		var transform = through(function (message, enc, cb) {
			if (message.command !== 'version') return cb(null, message)
			var version = message.payload
			if (!version.userAgent.endsWith('/')) {
				version.userAgent += '/ webtorrent - bridge:' + pkg.version + ' (proxy; '
					+ bridgePeer.remoteAddress + ':' + bridgePeer.remotePort + ') /'
			}
			cb(null, message)
			bridgePeer.unpipe()
			bridgePeer.pipe(client)
		})
		var protocolOpts = {
			magic: this._params.magic,
			messages: this._params.messages
		}
		pump(
			bridgePeer,
			proto.createDecodeStream(protocolOpts),
			transform,
			proto.createEncodeStream(protocolOpts),
			client,
			onError
		)
		this.emit('bridge', client, bridgePeer)
	})
}

Bridge.prototype._connectPeer = function(cb) {
	
	// TODO
	
}

Bridge.prototype._onError = function (err) {
	var self = this
	self.emit('error', err)
}

function noop () {}