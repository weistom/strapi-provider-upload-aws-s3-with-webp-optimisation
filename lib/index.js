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
        return new Promise((resolve, reject) => {
          const uploadToS3 = (key, buffer, mime, callback) => {
            S3.upload(
              {
                Key: key,
                Body: Buffer.from(buffer, 'binary'),
                ACL: 'public-read',
                ContentType: mime,
                ...customParams,
              },
              (err) => {
                if (err) {
                  return reject(err);
                }
                strapi.log.info(`Uploaded ${key}`);
                callback();
              }
            );
          };

          const key = getUploadKey(file.hash, file.ext);
          const outputName = getOutputName(file.ext);
          // upload original file except image and unsupported mime
          if (!file.mime.startsWith('image/') || !outputName) {
            return uploadToS3(key, file.buffer, file.mime, () => {
              file.url = `${baseUrl}/${key}`;
              resolve();
            });
          }

          Sharp(file.buffer)
            .toFormat(outputName, sharpOptions?.[outputName] || {})
            .rotate()
            .toBuffer({ resolveWithObject: true })
            .then(({ data, info }) => {
              file.size = parseFloat((info.size / 1024).toFixed(2));
              // upload optimised image
              uploadToS3(key, data, file.mime, () => {
                file.url = `${baseUrl}/${key}`;
                Sharp(file.buffer)
                  .webp(sharpOptions?.webp || {})
                  .rotate()
                  .toBuffer({ resolveWithObject: true })
                  .then(({ data, info }) => {
                    const key = getUploadKey(file.hash, '.webp');
                    // upload webp file
                    uploadToS3(key, data, 'image/webp', () => {
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
                      resolve();
                    });
                  });
              });
            });
        });
      },
      delete(file) {
        return new Promise((resolve, reject) => {
          S3.deleteObjects(
            {
              Delete: {
                Objects: [
                  { Key: getUploadKey(file.hash, file.ext) },
                  file.mime.startsWith('image/') && { Key: getUploadKey(file.hash, '.webp') }
                ].filter(Boolean)
              }
            },
            (err, { Deleted }) => {
              if (err) {
                reject(err);
              } else {
                Deleted.forEach(({ Key }) => strapi.log.info(`Deleted ${Key}`));
                resolve();
              }
            }
          );
        });
      },
    };
  }
};
