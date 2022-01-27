const { S3 } = require('aws-sdk')
const https = require('https')

const REGION = 'us-east-2'

const response = {
	statusCode: null,
}

const downloadImage = (url) => {
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

exports.handler = async function (event) {
	const request = event
	const s3 = new S3()
	const data = await downloadImage(request.url)
	const params = {
		Bucket: 'bookmarks-media',
		Key: request.media_key + '.' + request.type,
		Body: data,
	}
	try {
		const results = await s3.putObject(params)
		console.log('results: ')
		console.log(results)
		console.log(
			'Successfully created ' +
				params.Key +
				' and uploaded it to ' +
				params.Bucket +
				'/' +
				params.Key
		)
		response.statusCode = 200
		response.body = {
			type: request.type,
			key: params.Key,
		}
		return response // For unit tests.
	} catch (err) {
		console.log('Error', err)
		response.statusCode = 500
		response.body = { err }
		return response
	}
}
