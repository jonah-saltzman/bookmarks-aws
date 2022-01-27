import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import * as https from 'https'

const REGION = 'us-east-2'

const s3Client = new S3Client({ region: REGION })

const response = {
	statusCode: null,
	headers: {
		'Content-Type': 'application/json',
	},
	isBase64Encoded: false,
	body: {},
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
	console.log(event)
	const request = JSON.parse(event).body
	console.log(request)
  const data = await downloadImage(request.url)
	const params = {
		Bucket: 'bookmarks-media',
		Key: request.media_key + '.' + request.type,
		Body: data
	}
	try {
		const results = await s3Client.send(new PutObjectCommand(params))
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
			key: params.Key
		}
		return JSON.stringify(response) // For unit tests.
	} catch (err) {
		console.log('Error', err)
		response.statusCode = 500
		response.body = {err}
		return JSON.stringify(response)
	}
}

// media_key: media.key,
// url: media.url,
// type: media.url.match(extRE)[1],