/* global module */

var url = require('url')

function getRandomElement (array) {
  return array[Math.floor(Math.random() * array.length)]
}

function parseAddress (address) {
  // If address has a protocol in it, we don't need to add a fake one
  if ((/^\w+:\/\//).test(address)) return url.parse(address)
  return url.parse('x://' + address)
}

function assertParams (params) {
  if (!params
		  || params.magic == null
		  || !params.defaultPort) {
    throw new Error('Invalid parameters')
  }
}

module.exports = {
	getRandomElement: getRandomElement,
	parseAddress: parseAddress,
	assertParams: assertParams
}
