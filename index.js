const { S3 } = require('aws-sdk')
const https = require('https')

const response = {
	statusCode: null,
	headers: {
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Origin': 'https://api.bookmarks.jonahsaltzman.dev',
		'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
	},
	isBase64Encoded: false,
}

const downloadImage = (url) => {
	console.log('img url:')
	console.log(url)
	const reqURL = new URL(url)
	return new Promise((resolve, reject) => {
		https
			.get(reqURL, (response) => {
				const bufferArray = []
				response.on('data', (data) => bufferArray.push(data))
				response.on('end', () => resolve(Buffer.concat(bufferArray)))
			})
			.on('error', () => reject(false))
	})
}

const save = (params, done) => {
	const s3 = new S3()
	const upload = s3.upload(params)
	const promise = upload.promise()
	promise.then(
		(data) => {
			console.log('data')
			console.log(data)
			done(null, data)
		},
		(err) => {
			console.log('err')
			console.log(err)
			done(err, null)
		}
	)
}

exports.handler = async function (event) {
	console.log(event)
	const request = JSON.parse(event.body)
	console.log('request')
	console.log(request)
	const data = await downloadImage(request.url)
	const params = {
		Bucket: 'bookmarks-media',
		Key: request.media_key + '.' + request.type,
		Body: data,
	}
	console.log('PARAMS:')
	console.log(params)
	const prom = new Promise((resolve, reject) => {
		save(params, (err, data) => {
			if (err) {
				response.statusCode = 500
				response.body = JSON.stringify(err)
				reject(response)
			}
			response.statusCode = 200
			response.body = JSON.stringify(data)
			resolve(response)
		})
	})
	const res = await prom
	return res
}
