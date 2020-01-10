let request = require('request');

request = request.defaults({ jar: true });
const pRequest = require('promisified-request').create(request);
const fScraper = require('form-scraper');
const cheerio = require('cheerio');

async function scrape(fiscalNum, avis, data) {
  const formStructure = fScraper.fetchForm('#j_id_7', 'https://cfsmsp.impots.gouv.fr/secavis/faces/avis/notfound_error.jsf', pRequest);

  const loginDetails = { 'j_id_7:spi': fiscalNum, 'j_id_7:num_facture': avis };

  return fScraper.submitForm(loginDetails, fScraper.provideForm(formStructure), pRequest)
    .then((response) => {
      const $ = cheerio.load(response.body);
      const pageData = [];
      const tempData = [];
      $('#principal  table tbody td', '#conteneur').each(function parse(i) {
        tempData[i] = $(this).text();
      });
      Object.keys(data).forEach((k) => {
        pageData[k] = tempData[data[k]].replace(/\t/g, '').replace('\n', '');
      });
      return pageData;
    });
}
exports.handler = (event, context, callback) => {
    scrape(event.fiscalNum, event.avis, {
        // Get the website title (from the top header)
        firstName: 10,
        lastName: 4,
        grossRevenue: 32,
        numPeople: 30,
    }).then((res) => {
        console.log(res);
        const response = {
            statusCode: 200,
            body: {lastName:res.lastName, grossRevenue: res.grossRevenue, numPeople: res.numPeople, firstName: res.firstName},
        };
        callback(null, response);
    });
}

