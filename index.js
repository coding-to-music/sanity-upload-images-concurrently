import sanityClient from '@sanity/client'
import path from 'path'
import pMap from 'p-map'

// const sanityClient = require('@sanity/client')
// const path = require('path')
// const pMap = require('p-map')
const {
  createReadStream,
  promises: {readdir, stat}
} = require('fs')

const client = sanityClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion: process.env.SANITY_API_VERSION,
    token: process.env.SANITY_TOKEN,
    useCdn: false
  })
  
const IMAGES_FOLDER = `${__dirname}/images`
const CONCURRENCY = 10

function round(num) {
  return Number(num.toFixed(2))
}

async function uploadImage(filename, i) {
  const filepath = path.join(IMAGES_FOLDER, filename)
  const size = (await stat(filepath)).size
  const start = new Date()

  await client.assets
    .upload('image', createReadStream(filepath), {
      filename
    })
    .catch(err => console.log('unable to upload ', filename, err.message))

  const elapsed = new Date().getTime() - start.getTime()

  console.log(
    `Upload file #${i} ${filename} [SIZE: ${round(size / 1000)} KB --- TIME: ${round(
      elapsed / 1000
    )} s --- SPEED: ${round(size / elapsed)} KB/s]`
  )
}

async function run() {
  const files = (await readdir(IMAGES_FOLDER)).filter(f => path.extname(f).toLowerCase() === '.jpg')
  const globalStart = new Date()

  await pMap(files, uploadImage, {concurrency: CONCURRENCY})

  const elapsed = new Date().getTime() - globalStart.getTime()
  console.log(`All done in ${round(elapsed / 1000)} seconds`)
}

run()