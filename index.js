const cheerio = require('cheerio');
const axios = require('axios');
const psl = require('psl');

const input = process.stdin;

input.setEncoding('utf-8');

// Output message to user
console.log('Please input website you would like to scrape');

input.on('data', data => {
  Promise.all([
    getDomains(data, 'script', 'src'),
    getDomains(data, 'img', 'src'),
    getDomains(data, 'link[rel=stylesheet]', 'href')
  ]).then(results => {
    const scripts = results[0];
    const imgs = results[1];
    const stylesheets = results[2];

    console.log(`\nAsset sources for ${data}`);
    console.log('\nScripts:');
    createStrings(scripts);
    console.log('\nStyles:');
    createStrings(stylesheets);
    console.log('\nImages');
    createStrings(imgs);

    process.exit();
  });
});

function getDomains(data, type, attr) {
  return new Promise((resolve, reject) => {
    const results = [];

    axios
      .get(data)
      .then(res => {
        const $ = cheerio.load(res.data);

        $(type).each((i, result) => {
          if ($(result).attr(attr) !== undefined) {
              results.push(getDomainName($(result).attr(attr)));
            
          }
        });
        resolve(countOcc(results));
      })
      .catch(err =>
        console.log('Something went wrong: Possibly an invalid address')
      );
  });
}

// Count the number of occurences in an array
function countOcc(arr) {
  return arr.reduce((obj, item) => {
    obj[item] = (obj[item] || 0) + 1;
    return obj;
  }, {});
}

// Get domain name from url
function getDomainName(hostName) {
  const url = hostName.split('/')[2];
  const parsed = psl.parse(url);

  if(parsed.listed) {
    return parsed.domain;
  }
}

// Create a template literal for each item in object
function createStrings(obj) {
  for (const domain in obj) {
    console.log(`- ${domain} (${obj[domain]})`);
  }
}
