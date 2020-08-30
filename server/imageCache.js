const ImgModel = require('./models/img.model');
const Discord = require('discord.js');
const request = require('request');
const fs = require('fs');
const { URL } = require('url');
const axios = require('axios');
const { nc_endpoint } = require('../config.json');

module.exports = {
  getOrGenImg: function (nurl, message, dry = false) {
    return new Promise(function (resolve, reject) {
      if (!nurl.pathname) {
        nurl = new URL(nurl);
      }
      nurl.protocol = 'http:';
      let { napChartId, imgurl } = makeNapChartImageUrl(nurl);
      console.log(napChartId, '----', imgurl);
      let is_cached = fs.existsSync('/napcharts/cdn/' + napChartId + '.png');
      let cacheurl = 'http://cache.polyphasic.net/cdn/' + napChartId + '.png';
      console.log('INFO  : ', 'Image search res', is_cached);
      let msgImg = null;
      if (!is_cached) {
        console.log(
          'INFO  : ',
          'Downloading napchart: ' + napChartId,
          ' -- IMGURL:',
          imgurl
        );
        request.get({ url: imgurl, encoding: 'binary' }, (err, _, res) => {
          fs.writeFile(
            '/napcharts/cdn/' + napChartId + '.png',
            res,
            'binary',
            (err) => {
              setTimeout(function () {
                console.log('MSG   : ', 'RichEmbed[' + nurl.href + ']');
                msgImg = new Discord.RichEmbed()
                  .setDescription(nurl.href)
                  .setImage(cacheurl)
                  .setURL(nurl.href);
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
          .setURL(nurl.href);
        resolve(msgImg);
      }

      //})
      //.catch(err => {
      //console.warn("WARN>>: ", "Could not get napchart from db: ", err);
      //reject(err)
      //});
    });
  },
  makeNapChartImageUrl: makeNapChartImageUrl,
  createChart: function (data) {
    let url = `${nc_endpoint}/create`;
    console.log('url', url);
    return new Promise(function (resolve, reject) {
      axios
        .post(url, data)
        .then((res) => {
          console.log('INFO  : ', 'Chart created', res);
          let nurl = 'http://napchart.com/' + res.data.chartid;
          resolve(nurl);
        })
        .catch((error) => {
          console.error('ERR   : ', 'Chart could not be created', error);
          reject(error);
        });
    });
  },
};

function makeNapChartImageUrl(nurl) {
  let napChartId = nurl.pathname.substring(1);
  let imgurl = `${nc_endpoint}/getImage/?width=600&shape=circle&height=600&chartid=${napChartId}`;
  return { napChartId, imgurl };
}

async function sleepBlock(ms) {
  await sleep(ms);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
