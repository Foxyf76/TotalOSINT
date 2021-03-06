const searchIPVoid = async (page, value) => {
  const defaultTimeout = { timeout: 6000 };

  try {
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto('https://www.ipvoid.com/ip-blacklist-check/');
    await page.waitForSelector('.col-md-8 #ipAddr', defaultTimeout);

    await page.evaluate(() => {
      window.scrollBy(0, 200);
    });

    await page.click('.col-md-8 #ipAddr', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('.col-md-8 #ipAddr', value, { delay: 50 });

    await page.waitForSelector(
      '.row > .col-md-8 > .articles-col > .form > .btn',
      defaultTimeout
    );

    await page.click('.row > .col-md-8 > .articles-col > .form > .btn');

    await page.waitForSelector('.table-responsive', 8000);

    const tableData = await page.evaluate(() => {
      const tds = Array.from(document.querySelectorAll('table tr td'));
      return tds.map((td) => td.innerText);
    });

    let results = {
      detections: tableData[5]
        .replace(/[A-Za-z]/g, '')
        .split('/')[0]
        .trim(),
      engines: tableData[5]
        .replace(/[A-Za-z]/g, '')
        .split('/')[1]
        .trim(),
      details: {
        url: page.url(),
        reverse_DNS: tableData[9],
        ASN_ownser: tableData[13],
        ISP: tableData[15],
        country: tableData[19],
      },
    };

    return results;
  } catch (err) {
    console.error(err);
    return { error: 'Error Scraping IPVoid' };
  }
};

module.exports = {
  searchIPVoid,
};
