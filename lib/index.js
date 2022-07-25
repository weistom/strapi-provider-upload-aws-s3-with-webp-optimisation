'use strict';

const AWS = require('aws-sdk');
const Sharp = require('sharp');

const getOutputName = (ext) => {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'jpeg';
    case '.png':
      return 'png';
    case '.tiff':
      return 'tiff';
    case '.gif':
      return 'gif';
  }
};

module.exports = {
  init({ cdn, prefix, sharpOptions, ...config }) {
    const S3 = new AWS.S3({
      apiVersion: '2006-03-01',
      ...config,
    });

    const baseUrl = cdn ? cdn : `https://${config.params.Bucket}.s3.${config.region}.amazonaws.com`;

    const getUploadKey = (hash, ext) => [prefix, `${hash}${ext}`].filter(Boolean).join('/');

    return {
      upload(file, customParams = {}) {
        return new Promise(async (resolve, reject) => {
          // upload original file
          const outputName = getOutputName(file.ext);

          let buffer;
          if (outputName) {
            // upload optimized file
            const { data, info } = await Sharp(file.buffer)
              .toFormat(outputName, sharpOptions?.[outputName] || {})
              .rotate()
              .toBuffer({ resolveWithObject: true });
            buffer = data;
            file.size = parseFloat((info.size / 1024).toFixed(2));
          } else {
            buffer = file.buffer;
          }
          const key = getUploadKey(file.hash, file.ext);
          await S3.upload(
            {
              Key: key,
              Body: Buffer.from(buffer, 'binary'),
              ACL: 'public-read',
              ContentType: file.mime,
              ...customParams,
            },
            (err) => {
              if (err) return reject(err);
              strapi.log.info(`Uploaded ${key}`);
            }
          );
          file.url = `${baseUrl}/${key}`;

          if (file.ext !== '.webp') {
            // upload webp file
            const { data, info } = await Sharp(file.buffer)
              .webp(sharpOptions?.webp || {})
              .rotate()
              .toBuffer({ resolveWithObject: true });
            const key = getUploadKey(file.hash, '.webp');
            await S3.upload(
              {
                Key: key,
                Body: Buffer.from(data, 'binary'),
                ACL: 'public-read',
                ContentType: 'image/webp',
                ...customParams,
              },
              (err) => {
                if (err) return reject(err);
                strapi.log.info(`Uploaded ${key}`);
              }
            );
            file.webp = {
              ext: '.webp',
              url: `${baseUrl}/${key}`,
              hash: file.hash,
              mime: 'image/webp',
              name: `${file.hash}.webp`,
              size: parseFloat((info.size / 1024).toFixed(2)),
              width: info.width,
              height: info.height
            };
          }

          return resolve();
        });
      },
      delete(file) {
        return new Promise(async (resolve, reject) => {
          await S3.deleteObjects(
            {
              Delete: {
                Objects: [
                  { Key: getUploadKey(file.hash, file.ext) },
                  { Key: getUploadKey(file.hash, '.webp') }
                ]
              }
            },
            (err, { Deleted }) => {
              if (err) {
                strapi.log.error(err);
                return reject(err);
              }
              Deleted.forEach(({ Key }) => strapi.log.info(`Deleted ${Key}`));
            }
          );
          resolve();
        });
      },
    };
  }
};
