const puppeteer = require('puppeteer');

// Script di debug per analizzare la struttura HTML di Vinted
const debugVintedScraping = async () => {
  const browser = await puppeteer.launch({
    headless: false, // Mostra il browser per debug
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7' });

    // Test con la ricerca "Nintendo 3ds" sotto 26€
    const searchUrl = 'https://www.vinted.it/catalog?search_text=Nintendo%203ds&price_to=26&order=newest_first';
    console.log('Navigando a:', searchUrl);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // Accetta cookie
    try {
      await page.waitForTimeout(1000);
      await page.evaluate(() => {
        const btn = document.querySelector('#onetrust-accept-btn-handler');
        if (btn) btn.click();
      });
      await page.waitForTimeout(1000);
    } catch (_) {}

    // Scroll per caricare contenuti
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000);
    }

    // Analizza la struttura HTML
    const pageInfo = await page.evaluate(() => {
      // Cerca tutti i possibili contenitori di annunci
      const containers = [];
      
      // Selettori comuni per annunci
      const selectors = [
        'article',
        '[data-testid*="item"]',
        '.item-box',
        '.ItemBox',
        '.catalog-item',
        '.feed-grid-item',
        'a[href*="/items/"]'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          containers.push({
            selector,
            count: elements.length,
            sample: elements[0] ? {
              outerHTML: elements[0].outerHTML.substring(0, 500),
              textContent: elements[0].textContent.substring(0, 200)
            } : null
          });
        }
      });

      // Cerca specificamente link agli annunci
      const itemLinks = Array.from(document.querySelectorAll('a'))
        .filter(a => a.href && a.href.includes('/items/'))
        .slice(0, 5);

      const linkInfo = itemLinks.map(link => ({
        href: link.href,
        textContent: link.textContent.trim().substring(0, 100),
        outerHTML: link.outerHTML.substring(0, 300),
        parentHTML: link.parentElement ? link.parentElement.outerHTML.substring(0, 400) : null
      }));

      return {
        title: document.title,
        url: window.location.href,
        containers,
        itemLinks: linkInfo,
        totalLinks: document.querySelectorAll('a[href*="/items/"]').length
      };
    });

    console.log('=== ANALISI PAGINA VINTED ===');
    console.log('Titolo:', pageInfo.title);
    console.log('URL:', pageInfo.url);
    console.log('Link totali agli annunci:', pageInfo.totalLinks);
    
    console.log('\n=== CONTENITORI TROVATI ===');
    pageInfo.containers.forEach(container => {
      console.log(`\nSelettore: ${container.selector}`);
      console.log(`Elementi trovati: ${container.count}`);
      if (container.sample) {
        console.log('Esempio HTML:', container.sample.outerHTML);
        console.log('Testo:', container.sample.textContent);
      }
    });

    console.log('\n=== LINK AGLI ANNUNCI ===');
    pageInfo.itemLinks.forEach((link, i) => {
      console.log(`\nAnnuncio ${i + 1}:`);
      console.log('URL:', link.href);
      console.log('Testo:', link.textContent);
      console.log('HTML:', link.outerHTML);
      console.log('Parent HTML:', link.parentHTML);
    });

    // Aspetta 10 secondi per permettere l'ispezione manuale
    console.log('\n=== ASPETTO 10 SECONDI PER ISPEZIONE MANUALE ===');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('Errore durante il debug:', error);
  } finally {
    await browser.close();
  }
};

debugVintedScraping();