const { nc_endpoint } = require('../../config.json');
const request = require('request');

module.exports = {
    getNapchart: getNapchart,
    getNapchartId: getNapchartId
}

function getNapchartPromise(napchartUrl) {
  return new Promise((resolve, reject) => {
    napChartId = getNapchartId(napchartUrl);
    request(
      {
        url: nc_endpoint + 'getChart/' + napChartId,
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
      data.chartDocument.chartData.elements.forEach((element) => {
      if (element.color === 'red' && element.lane === 0) {
        if (element.start >= 24 * 60 || element.end >= 24 * 60) {
          throw "Invalid napchart.";
        }
        if (napchart.sleeps) {
          napchart.sleeps += ',';
        }
        element.start = Math.floor(element.start);
        element.end = Math.floor(element.end);
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

function getNapchartId(nurl) {
    let napChartId = nurl.pathname.substring(1);
    if (napChartId.includes("/") && napChartId.includes("-")) napChartId = napChartId.split('-').pop();
    else if (napChartId.includes("/")) napChartId = napChartId.split('/').pop();
    return napChartId;
}
