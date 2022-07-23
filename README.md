# strapi-provider-upload-aws-s3-with-webp-optimisation

Optimizes images by using [sharp](https://sharp.pixelplumbing.com/).
Also outputs WebP image on upload.
This plugin is tested on strapi with strapi >= 4.0.0.

## Installation

`npm install strapi-provider-upload-aws-s3-with-webp-optimisation`
or
`yarn add strapi-provider-upload-aws-s3-with-webp-optimisation`

## Configurations

Your configuration is passed down to the provider. (e.g: `new AWS.S3(config)`).
You can see the complete list of
options [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property).

**Example**
`./config/plugins.js`

```js
module.exports = ({ env }) => ({
  upload: {
    config: {
      // Strapi uses the full package name as provider name with strapi >= 4.0.0.
      provider: 'strapi-provider-upload-aws-s3-with-webp-optimisation',
      providerOptions: {
        accessKeyId: env('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env('AWS_ACCESS_SECRET'),
        region: env('AWS_REGION'),
        // Optional: Use CDN URL (e.g: https://xxxxxx.cloudfront.net)
        cdn: env('AWS_CLOUDFRONT'),
        // Optional: File uploaded in images folder (e.g: images/sample.png)
        prefix: 'images',
        params: {
          Bucket: env('AWS_BUCKET'),
        },
        // Optional: Options for output image
        // Images optimised by using sharp.
        // See https://sharp.pixelplumbing.com/api-output
        sharpOptions: {
          jpeg: {
            quality: 90,
            progressive: true,
          },
          png: {
            quality: 90,
            progressive: true,
          },
          webp: {
            alphaQuality: 90,
          },
          tiff: {},
          gif: {}
        }
      }
    },
  },
});
```
 
Upload WebP URLs are saved into `formats` in `files` table.
You need to `Enable responsive friendly upload` setting is enabled in the settings panel to generate responsive image sizes.
See `webp` object in each size object.
```json
{
  "large": {
    "ext": ".png",
    "url": "https://xxxxxx.cloudfront.net/images/large_2000x1000_47fb084046.png",
    "hash": "large_2000x1000_47fb084046",
    "mime": "image/png",
    "name": "large_2000x1000.png",
    "path": null,
    "size": 170.82,
    "webp": {
      "ext": ".webp",
      "url": "https://xxxxxx.cloudfront.net/images/large_2000x1000_47fb084046.webp",
      "hash": "large_2000x1000_47fb084046",
      "mime": "image/webp",
      "name": "large_2000x1000_47fb084046.webp",
      "size": 39.78,
      "width": 1000,
      "height": 500
    },
    "width": 1000,
    "height": 500
  },
  "small": {
    "ext": ".png",
    "url": "https://xxxxxx.cloudfront.net/images/small_2000x1000_47fb084046.png",
    "hash": "small_2000x1000_47fb084046",
    "mime": "image/png",
    "name": "small_2778x1284.png",
    "path": null,
    "size": 55.6,
    "webp": {
      "ext": ".webp",
      "url": "https://xxxxxx.cloudfront.net/images/small_2000x1000_47fb084046.webp",
      "hash": "small_2000x1000_47fb084046",
      "mime": "image/webp",
      "name": "small_2000x1000_47fb084046.webp",
      "size": 17.34,
      "width": 500,
      "height": 250
    },
    "width": 500,
    "height": 250
  },
  "medium": {
    "ext": ".png",
    "url": "https://xxxxxx.cloudfront.net/images/medium_2000x1000_47fb084046.png",
    "hash": "medium_2000x1000_47fb084046",
    "mime": "image/png",
    "name": "medium_2778x1284.png",
    "path": null,
    "size": 107.93,
    "webp": {
      "ext": ".webp",
      "url": "https://xxxxxx.cloudfront.net/images/medium_2000x1000_47fb084046.webp",
      "hash": "medium_2000x1000_47fb084046",
      "mime": "image/webp",
      "name": "medium_2000x1000_47fb084046.webp",
      "size": 28.44,
      "width": 750,
      "height": 375
    },
    "width": 750,
    "height": 375
  },
  "thumbnail": {
    "ext": ".png",
    "url": "https://xxxxxx.cloudfront.net/images/thumbnail_2000x1000_47fb084046.png",
    "hash": "thumbnail_2000x1000_47fb084046",
    "mime": "image/png",
    "name": "thumbnail_2778x1284.png",
    "path": null,
    "size": 17.19,
    "webp": {
      "ext": ".webp",
      "url": "https://xxxxxx.cloudfront.net/images/thumbnail_2000x1000_47fb084046.webp",
      "hash": "thumbnail_2000x1000_47fb084046",
      "mime": "image/webp",
      "name": "thumbnail_2000x1000_47fb084046.webp",
      "size": 6.35,
      "width": 245,
      "height": 122
    },
    "width": 245,
    "height": 122
  }
}
```