const express = require('express');
const { searchIPVoid } = require('../../scrapers/ipVoid');
const { searchVT } = require('../../scrapers/virusTotal');
const { searchAbuseIP } = require('../../scrapers/abuseIP');
const { searchMetadefender } = require('../../scrapers/metaDefender');
const { searchXForce } = require('../../scrapers/xForce.js');
const { getWhoIs } = require('../../scrapers/whoIs');
const { Cluster } = require('puppeteer-cluster');
const router = express.Router();

// TEST VALUES //

// malicious hash: 36F9CA40B3CE96FCEE1CF1D4A7222935536FD25B
// clean hash: e75717a75f2a35130bf7f7aee09dcb7d

// clean IP: 43.250.192.22
// malicious IP: 118.193.41.84

// clean domain: google.com
// malicious domain: halifax-fraud-alert.com

router.post('/vt', async (req, res) => {
  let results = await searchVT(req.body.type, req.body.value);
  res.send(results);
});

router.post('/ipvoid', async (req, res) => {
  let results = await searchIPVoid(req.body.value);
  res.send(results);
});

router.post('/abuse', async (req, res) => {
  let results = await searchAbuseIP(req.body.value);
  res.send(results);
});

router.post('/metadefender', async (req, res) => {
  let results = await searchMetadefender(req.body.type, req.body.value);
  res.send(results);
});

router.post('/xforce', async (req, res) => {
  let results = await searchXForce(req.body.type, req.body.value);
  res.send(results);
});

// link for running sessions in parallel
// https://github.com/puppeteer/puppeteer/issues/1873

router.post('/scrape-all', async (req, res) => {
  let results = {};

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 5,
    puppeteerOptions: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--no-zygote',
        '--disable-dev-shm-usage',
        // '--single-process',
      ],
    },
  });

  switch (req.body.type) {
    case 'hash': {
      cluster.queue(async ({ page }) => {
        results['metadefender'] = await searchMetadefender(
          page,
          req.body.type,
          req.body.value
        );
      });

      cluster.queue(async ({ page }) => {
        results['virustotal'] = await searchVT(
          page,
          req.body.type,
          req.body.value
        );
      });

      cluster.queue(async ({ page }) => {
        results['xforce'] = await searchXForce(
          page,
          req.body.type,
          req.body.value
        );
      });

      await cluster.idle();
      await cluster.close();
      break;
    }

    case 'domain':
      cluster.queue(async ({ page }) => {
        results['metadefender'] = await searchMetadefender(
          page,
          req.body.type,
          req.body.value
        );
      });

      cluster.queue(async ({ page }) => {
        results['virustotal'] = await searchVT(
          page,
          req.body.type,
          req.body.value
        );
      });

      cluster.queue(async ({ page }) => {
        results['xforce'] = await searchXForce(
          page,
          req.body.type,
          req.body.value
        );
      });

      results['whois'] = await getWhoIs(req.body.type, req.body.value);

      await cluster.idle();
      await cluster.close();
      break;

    case 'ip':
      cluster.queue(async ({ page }) => {
        results['metadefender'] = await searchMetadefender(
          page,
          req.body.type,
          req.body.value
        );
      });

      cluster.queue(async ({ page }) => {
        results['virustotal'] = await searchVT(
          page,
          req.body.type,
          req.body.value
        );
      });

      cluster.queue(async ({ page }) => {
        results['xforce'] = await searchXForce(
          page,
          req.body.type,
          req.body.value
        );
      });

      cluster.queue(async ({ page }) => {
        results['ipvoid'] = await searchIPVoid(page, req.body.value);
      });

      cluster.queue(async ({ page }) => {
        results['abuseip'] = await searchAbuseIP(page, req.body.value);
      });

      results['whois'] = await getWhoIs(req.body.type, req.body.value);

      await cluster.idle();
      await cluster.close();
      break;

    default:
      break;
  }

  results['searchDate'] = new Date().toLocaleDateString();
  results['searchValue'] = req.body.value;
  results['searchType'] = req.body.type;

  res.send(results);
});

module.exports = router;
