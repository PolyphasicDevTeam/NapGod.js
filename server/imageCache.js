const ImgModel = require('./models/img.model');
const Discord = require('discord.js');
const request = require('request');
const fs = require('fs');
const { URL } = require('url');
const axios = require('axios');
const { nc_endpoint } = require('../config.json');
const { getNapchartId } = require('./commands/napchart');

module.exports = {
  getOrGenImg: function (nurl, message, dry = false) {
    return new Promise(function (resolve, reject) {
      if (!nurl.pathname) {
        nurl = new URL(nurl);
      }
      nurl.protocol = 'http:';
      let { napchartId, imgurl } = makeNapchartImageUrl(nurl);
      console.log(napchartId, '----', imgurl);
      let is_cached = fs.existsSync('/napcharts/cdn/' + napchartId + '.png');
      let cacheurl = 'http://cache.polyphasic.net/cdn/' + napchartId + '.png';
      console.log('INFO  : ', 'Image search res', is_cached);
      let msgImg = null;
      if (!is_cached) {
        console.log(
          'INFO  : ',
          'Downloading napchart: ' + napchartId,
          ' -- IMGURL:',
          imgurl
        );
        request.get({ url: imgurl, encoding: 'binary' }, (err, _, res) => {
          fs.writeFile(
            '/napcharts/cdn/' + napchartId + '.png',
            res,
            'binary',
            (err) => {
              setTimeout(function () {
                console.log('MSG   : ', 'RichEmbed[' + nurl.href + ']');
                msgImg = new Discord.RichEmbed()
                  .setImage(imgurl)
                  .setURL(imgurl);
                resolve(msgImg);
              }, 200);
            }
          );
        });
      } else {
        console.log('MSG   : ', 'RichEmbed[' + nurl.href + ']');
        msgImg = new Discord.RichEmbed()
          .setDescription(nurl.href)
          .setImage(cacheurl)
          .setURL(cacheurl);
        resolve(msgImg);
      }

      //})
      //.catch(err => {
      //console.warn("WARN>>: ", "Could not get napchart from db: ", err);
      //reject(err)
      //});
    });
  },
  makeNapchartImageUrl: makeNapchartImageUrl,
  createChart: function (data) {
    let url = `${nc_endpoint}createSnapshot`;
    console.log('url', url);
    return new Promise(function (resolve, reject) {
      axios
        .post(url, data)
        .then((res) => {
          console.log('INFO  : ', 'Chart created', res);
          let nurl = 'http://napchart.com/' + res.data.chartDocument.chartid;
          resolve(nurl);
        })
        .catch((error) => {
          console.error('ERR   : ', 'Chart could not be created', error);
          reject(error);
        });
    });
  },
};

function makeNapchartImageUrl(nurl) {
  let napchartId = getNapchartId(nurl.href);
  let imgurl = `${nc_endpoint}getImage/${napchartId}?hr=1`;
  return { napchartId, imgurl };
}

async function sleepBlock(ms) {
  await sleep(ms);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
