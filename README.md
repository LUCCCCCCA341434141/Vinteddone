# Vinted Sniper Alert Tool

Un tool che monitora gli oggetti preferiti su Vinted e invia notifiche Telegram quando un annuncio soddisfa i criteri impostati (prezzo massimo + parola chiave nel titolo).

## Caratteristiche

- Monitoraggio automatico dei preferiti su Vinted
- Filtro per parola chiave e prezzo massimo
- Notifiche Telegram in tempo reale
- Pannello di amministrazione per gestire gli utenti
- Registrazione semplice tramite form web

## Requisiti

- Node.js (v14 o superiore)
- Account Telegram e Bot Token
- Accesso a Vinted

## Configurazione

1. Clona il repository
2. Installa le dipendenze:
   ```
   npm install
   ```
3. Configura il file `.env` con i tuoi parametri:
   ```
   PORT=3000
   NODE_ENV=development
   DB_PATH=./database.sqlite
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ADMIN_API_KEY=your_admin_api_key
   MONITOR_INTERVAL=300000
   ```

## Utilizzo

### Avvio del server

```
npm start
```

### Registrazione utenti

1. Accedi a `http://localhost:3000`
2. Compila il form di registrazione con:
   - Nome utente
   - ID Telegram (ottenibile contattando @userinfobot su Telegram)
   - Parola chiave da cercare nei titoli
   - Prezzo massimo

### Pannello amministrativo

1. Accedi a `http://localhost:3000/admin.html`
2. Inserisci l'API key amministrativa
3. Gestisci gli utenti (attiva/disattiva)
4. Visualizza lo storico degli alert inviati

## Funzionamento

1. Gli utenti si registrano tramite il form web
2. L'amministratore attiva gli account degli utenti
3. Il sistema monitora periodicamente i preferiti degli utenti attivi su Vinted
4. Quando viene trovato un annuncio che corrisponde ai criteri (parola chiave + prezzo minimo/massimo), viene inviata una notifica Telegram all'utente

## Note di sicurezza

- Il pannello di amministrazione è protetto da API key
- Nessuna azione automatica di acquisto viene eseguita
- Solo gli utenti attivi ricevono notifiche
- I dati sensibili sono memorizzati in modo minimo

## Limitazioni

- Il monitoraggio richiede che gli articoli siano aggiunti ai preferiti su Vinted
- Il sistema non effettua acquisti automatici
- L'attivazione degli utenti è manuale

## Deploy su Raspberry Pi (ARM)

Questa app può girare su Raspberry Pi. Segui questi passi (Raspberry Pi OS/Debian):

1) Dipendenze di sistema

- Installa Node.js recente (consigliato 18/20):
  - `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -`
  - `sudo apt-get install -y nodejs`
- Installa Chromium e SQLite:
  - `sudo apt-get update`
  - `sudo apt-get install -y chromium sqlite3 libsqlite3-dev build-essential`
  - Nota: su alcune versioni il pacchetto può chiamarsi `chromium-browser`.

2) Clona e installa il progetto

- Copia o clona la repo sul Pi: `git clone <repo> && cd Vinted`
- Evita il download del Chromium di Puppeteer e usa quello di sistema:
  - `export PUPPETEER_SKIP_DOWNLOAD=1`
- Installa le dipendenze: `npm install`

3) Configura `.env`

- Crea un file `.env` nella radice con, ad esempio:
  - `PORT=3000`
  - `VINTED_BASE_URL=https://www.vinted.it`
  - `ADMIN_API_KEY=metti-una-chiave-lunga`
  - `TELEGRAM_BOT_TOKEN=xxxxxxxxxxxxxxxx`
  - `MONITOR_INTERVAL=5000` (aumenta per ridurre CPU su Pi)
  - `MAX_ITEM_AGE_MINUTES=20`
  - `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` (o `/usr/bin/chromium-browser`)

4) Avvio

- Avvia il backend: `npm start` (equivale a `node src/backend/index.js`)
- Apri `http://<ip-del-pi>:3000/` per la pagina di registrazione
- Apri `http://<ip-del-pi>:3000/admin` per il pannello admin (serve `ADMIN_API_KEY`)

5) Esecuzione come servizio (opzione)

- PM2:
  - `npm i -g pm2`
  - `pm2 start src/backend/index.js --name vinted-monitor`
  - `pm2 save && pm2 startup` (segui le istruzioni)
- Oppure systemd (esempio unit):
  - `/etc/systemd/system/vinted.service`:
    - `[Unit] Description=Vinted Monitor After=network.target`
    - `[Service] WorkingDirectory=/home/pi/Vinted ExecStart=/usr/bin/node src/backend/index.js Environment=PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium Environment=PORT=3000 Environment=ADMIN_API_KEY=... Restart=always`
    - `[Install] WantedBy=multi-user.target`
  - `sudo systemctl daemon-reload && sudo systemctl enable --now vinted`

Suggerimenti per performance su Pi:

- Mantieni `MONITOR_INTERVAL` ≥ 5000ms se usi il fallback HTML (Puppeteer)
- Riduci il numero di keyword o imposta `match_mode=any` se vuoi risultati più frequenti
- Usa `min_price=0` se vuoi massimizzare i risultati; aumenta solo se necessario
- Se vuoi massima velocità, valuta una modalità “API-only” (senza fallback), da abilitare per utente nel pannello admin (feature opzionale)

Modalità sorgente ricerca (configurazione)
- Imposta in `.env` la variabile `SEARCH_SOURCE_MODE` per scegliere la sorgente di ricerca:
  - `html_only`: usa solo la ricerca pubblica HTML (`/catalog?search_text=...&price_from=...&price_to=...&order=newest_first`), con fallback Puppeteer se necessario. Evita completamente l’API v2.
  - `html_first`: prova HTML pubblico; se non trova risultati, tenta l’API v2; infine fallback Puppeteer.
  - `api_first` (default precedente): tenta l’API v2; se non disponibile o vuota, prova HTML; infine fallback Puppeteer.
- Esempio `.env` per massima compatibilità/rapidità: `SEARCH_SOURCE_MODE=html_only`.
- Su Raspberry Pi, puoi velocizzare Puppeteer indicando il Chromium di sistema: `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`.

Comandi Telegram (utente)
- Il bot ora accetta comandi dagli utenti attivi per aggiornare le preferenze senza passare dal sito:
  - `/setkeywords <keyword1, keyword2>` aggiorna la lista di keyword (separate da virgole o punto e virgola).
  - `/setprices <min> <max>` aggiorna il prezzo minimo e massimo (numeri, `min <= max`).
  - `/banwords <parola1, parola2>` aggiunge parole da escludere dal titolo (case-insensitive).
  - `/banlist` mostra l’elenco corrente di parole bannate.
  - `/banclear` svuota l’elenco di parole bannate.
- Esempi:
  - `/setkeywords nike, dunk` → imposta le keyword a "nike, dunk".
  - `/setprices 10 50` → imposta minimo 10€, massimo 50€.
- Requisiti:
  - Devi essere registrato e attivo. Il bot identifica l’utente dal `telegram_id` (chat ID).
- Notifiche con immagine:
  - Quando disponibile, il bot allega la foto del prodotto alla notifica Telegram.