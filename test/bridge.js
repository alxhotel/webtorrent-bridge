/* global require */

var bridge = require('../')

/**
 * Received a connect of a webtorrent peers
 * @param {Object} peer
 */
bridge.on('connection', function (peer) {
	var uri = peer.socket.transport + ':' + peer.remoteAddress
	console.log('Incoming connection: ' + uri)
	peer.on('disconnect', function () {
		console.log('Disconnected from peer: ' + uri)
	})
	peer.on('error', function (err) {
		console.error('Error (' + uri + '):', err)
	})
})

/**
 * Succesfully bridged a connection (WEBRTC <-> TCP)
 * @param {Object} webPeer
 * @param {Object} tcpPeer
 */
bridge.on('bridge', function (webPeer, tcpPeer) {
	console.log('Bridging connection'
		+ ' from ' + webPeer.socket.transport + '://' + webPeer.remoteAddress +
		+ ' to tcp://' + tcpPeer.remoteAddress + ':' + tcpPeer.remotePort)
})

/**
 * Bridging connection error ?
 * @param {Object} err
 */
bridge.on('connectError', function (err) {
	console.log('Connect error: ' + err.stack)
})
