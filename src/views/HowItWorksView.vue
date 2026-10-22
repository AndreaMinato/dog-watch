<template>
  <main>
    <h1>Come funziona e cosa salviamo</h1>

    <h2>Il video</h2>
    <p>
      Video e audio vanno direttamente dalla Camera allo Spettatore. Quando i due dispositivi non riescono a collegarsi
      direttamente, passano da un ponte di Cloudflare, sempre cifrati: il ponte non può vederli né ascoltarli.
      Il video non viene registrato da nessuna parte.
    </p>

    <h2>Cosa salviamo</h2>
    <ul>
      <li>
        Della Stanza: il Nome della Stanza, la data di creazione e quella dell'ultimo ingresso. La Chiave è salvata
        solo come hash: possiamo riconoscerla quando la inserisci, ma non leggerla.
      </li>
      <li>Di chi è nella Stanza: il Ruolo e il nome della Camera o il soprannome dello Spettatore.</li>
      <li>Dei tentativi di ingresso con una Chiave sbagliata: un hash dell'indirizzo IP, cancellato dopo 24 ore.</li>
    </ul>
    <p>
      Una Stanza in cui nessuno entra viene cancellata da sola dopo 30 giorni, con tutti i suoi dati.
      Una Camera può anche chiuderla prima.
    </p>

    <h2>Sul tuo dispositivo</h2>
    <p>
      Non serve un account: questo browser conserva una sessione anonima e le Stanze in cui sei entrato.
      Nessun cookie di tracciamento, nessuna analytics.
    </p>

    <RouterLink :to="{ name: 'home' }">
      Torna alla Home
    </RouterLink>
  </main>
</template>
