const { nc_endpoint } = require('../../config.json');
const request = require('request');

module.exports = {
    getNapchart: getNapchart
}

function getNapchartPromise(napchartUrl) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: nc_endpoint + '/get?chartid=' + napchartUrl.split('/').pop(),
        json: true,
        headers: { 'User-Agent': 'request' },
      },
      (error, response, body) => {
        if (error) {
          reject(error);
        }
        if (response.statusCode != 200) {
          reject('Invalid status code <' + response.statusCode + '>');
        }
        resolve(body);
      }
    );
  });
}

async function getNapchart(username, napchartUrl) {
  let napchart = { url: napchartUrl, sleeps: '' };
  try {
    const data = await getNapchartPromise(napchartUrl);
    data.chartData.elements.forEach((element) => {
      if (element.color === 'red' && element.lane === 0) {
        if (napchart.sleeps) {
          napchart.sleeps += ',';
        }
        napchart.sleeps +=
            `${('00' + Math.floor(element.start / 60)).substr(-2)}${
            ('00' + (element.start % 60)).substr(-2)}-`;
        napchart.sleeps +=
            `${('00' + Math.floor(element.end / 60)).substr(-2)}${
             ('00' + (element.end % 60)).substr(-2)}`;
      }
    });
    return napchart;
  } catch (error) {
    console.error(`ERR\t: Fetching ${username}'s napchart: ${error}`);
    return null;
  }
}
