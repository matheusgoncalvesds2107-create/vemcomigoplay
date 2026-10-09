const SUPABASE_URL =
  "https://rtlkifpsoviwxgwbbuet.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_p95BIFIlAQ02aZYVdDKaNQ_mjtXSBYK";

const BUCKET = "musicas";

let accessToken = "";
let refreshToken = "";

let publishedTracks = [];

const $ = (selector) =>
  document.querySelector(selector);


/* =========================================================
   SINCRONIZADOR
========================================================= */

let syncTrack = null;
let syncLyricsLines = [];
let syncData = [];
let syncLineIndex = 0;

const syncAudio =
  $("#syncAudio");


/* =========================================================
   STATUS
========================================================= */

function setStatus(
  message,
  type = ""
) {

  const box =
    $("#status");

  if (!box) return;

  box.textContent =
    message;

  box.className =
    "status" +
    (
      type
        ? ` ${type}`
        : ""
    );
}


function setLyricsStatus(
  message,
  type = ""
) {

  const box =
    $("#lyricsStatus");

  if (!box) return;

  box.textContent =
    message;

  box.className =
    "status" +
    (
      type
        ? ` ${type}`
        : ""
    );
}


function setSyncStatus(
  message,
  type = ""
) {

  const box =
    $("#syncStatus");

  if (!box) return;

  box.textContent =
    message;

  box.className =
    "status" +
    (
      type
        ? ` ${type}`
        : ""
    );
}


/* =========================================================
   PROGRESSO UPLOAD
========================================================= */

function showProgress(
  percent,
  message = "Enviando..."
) {

  const area =
    $("#progressArea");

  if (!area) return;

  area.classList.remove(
    "hidden"
  );

  $("#progressPercent")
    .textContent =
    `${percent}%`;

  $("#progressText")
    .textContent =
    message;

  $("#progressFill")
    .style.width =
    `${percent}%`;
}


function hideProgress() {

  setTimeout(() => {

    const area =
      $("#progressArea");

    if (!area) return;

    area.classList.add(
      "hidden"
    );

    $("#progressFill")
      .style.width =
      "0%";

  }, 1200);
}


/* =========================================================
   UTILIDADES
========================================================= */

function slug(text) {

  return String(text || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}


function randomItem(array) {

  return array[
    Math.floor(
      Math.random() *
      array.length
    )
  ];
}


function escapeHtml(
  text = ""
) {

  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatSyncTime(
  seconds
) {

  if (
    !Number.isFinite(seconds)
  ) {
    return "0:00.0";
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  const secs =
    seconds % 60;

  return (
    `${minutes}:` +
    secs
      .toFixed(1)
      .padStart(4, "0")
  );
}


/* =========================================================
   LOGIN
========================================================= */

async function login() {

  sessionStorage.removeItem(
    "vcplay-token"
  );

  sessionStorage.removeItem(
    "vcplay-refresh-token"
  );

  accessToken = "";
  refreshToken = "";

  const email =
    prompt(
      "E-mail do administrador:"
    );

  if (!email) {

    setStatus(
      "Login cancelado.",
      "error"
    );

    return false;
  }

  const password =
    prompt(
      "Senha do administrador:"
    );

  if (!password) {

    setStatus(
      "Senha não informada.",
      "error"
    );

    return false;
  }

  try {

    setStatus(
      "Entrando no painel..."
    );

    const response =
      await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "apikey":
              SUPABASE_ANON_KEY
          },

          body:
            JSON.stringify({
              email,
              password
            })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.error_description ||
        data.message ||
        data.msg ||
        data.error ||
        `Erro ${response.status}`
      );
    }

    accessToken =
      data.access_token;

    refreshToken =
      data.refresh_token || "";

    sessionStorage.setItem(
      "vcplay-token",
      accessToken
    );

    if (refreshToken) {

      sessionStorage.setItem(
        "vcplay-refresh-token",
        refreshToken
      );
    }

    setStatus(
      "Painel conectado.",
      "ok"
    );

    return true;

  } catch (error) {

    console.error(error);

    setStatus(
      error.message ||
      "Não foi possível entrar.",
      "error"
    );

    alert(
      error.message ||
      "Não foi possível entrar."
    );

    return false;
  }
}


/* =========================================================
   RENOVAR LOGIN
========================================================= */

async function refreshSession() {

  if (!refreshToken) {
    return false;
  }

  try {

    const response =
      await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "apikey":
              SUPABASE_ANON_KEY
          },

          body:
            JSON.stringify({
              refresh_token:
                refreshToken
            })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      return false;
    }

    accessToken =
      data.access_token;

    refreshToken =
      data.refresh_token ||
      refreshToken;

    sessionStorage.setItem(
      "vcplay-token",
      accessToken
    );

    sessionStorage.setItem(
      "vcplay-refresh-token",
      refreshToken
    );

    return true;

  } catch {

    return false;
  }
}


/* =========================================================
   FETCH AUTENTICADO
========================================================= */

async function authenticatedFetch(
  url,
  options = {}
) {

  options.headers = {

    ...(options.headers || {}),

    "apikey":
      SUPABASE_ANON_KEY,

    "Authorization":
      `Bearer ${accessToken}`
  };


  let response =
    await fetch(
      url,
      options
    );


  if (
    response.status === 401
  ) {

    const renewed =
      await refreshSession();

    if (renewed) {

      options.headers[
        "Authorization"
      ] =
        `Bearer ${accessToken}`;

      response =
        await fetch(
          url,
          options
        );
    }
  }

  return response;
}


/* =========================================================
   GERADOR DE LETRAS
========================================================= */

function createVerse(
  theme
) {

  const openings = [

    "Quando a noite chega e eu penso em parar",
    "Quando o medo tenta a minha fé calar",
    "Mesmo quando eu não consigo entender",
    "Quando o caminho parece se fechar",
    "Se o meu coração começa a duvidar",
    "Quando as respostas demoram pra chegar"
  ];

  const middle = [

    "Eu lembro que Tua mão ainda está aqui",
    "Eu sei que a Tua voz não desistiu de mim",
    "Eu olho para o céu e volto a confiar",
    "A Tua presença vem me sustentar",
    "Eu entrego os meus passos outra vez",
    "Eu sei que Tu conheces o meu amanhã"
  ];

  const endings = [

    "E encontro forças para prosseguir",
    "E mesmo sem enxergar eu vou seguir",
    "Porque comigo sempre vais estar",
    "E a esperança volta a respirar",
    "Pois Tua promessa não vai terminar",
    "E o impossível pode se transformar"
  ];

  return (
`${randomItem(openings)}
${randomItem(middle)}
${theme
  ? `Eu coloco diante de Ti ${theme}`
  : "Eu coloco os meus sonhos diante de Ti"}
${randomItem(endings)}`
  );
}


function createChorus(
  title,
  theme
) {

  const lines = [

    "Eu vou confiar em Ti",
    "Eu não vou desistir",
    "Minha esperança está em Ti",
    "Eu sei que vais cuidar de mim",
    "Mesmo sem ver eu vou crer",
    "Contigo eu vou permanecer"
  ];

  return (
`${title},
essa é a canção do meu coração
${randomItem(lines)}
Segura firme a minha mão

${theme
  ? `Em ${theme}, eu escolho acreditar`
  : "Na Tua promessa eu escolho acreditar"}
${randomItem(lines)}
Com Jesus eu vou continuar`
  );
}


function createBridge(
  theme
) {

  const parts = [

`Se a porta ainda não abriu
Eu vou esperar
Se a resposta ainda não chegou
Eu vou confiar`,

`Pode o vento soprar
Pode a noite chegar
A Tua presença comigo
Vai me fazer continuar`,

`Eu não vivo pelo que vejo
Eu caminho pela fé
Meu futuro está seguro
Nas mãos de quem Deus é`,

`O impossível não é maior
Que o poder do meu Senhor
Eu descanso na promessa
Eu descanso no Teu amor`
  ];

  let bridge =
    randomItem(parts);

  if (theme) {

    bridge +=
`\n\nMeu coração entrega a Ti
${theme}`;
  }

  return bridge;
}


function createLyrics({
  title,
  artist,
  category,
  theme
}) {

  const verse1 =
    createVerse(theme);

  const verse2 =
    createVerse(theme);

  const chorus =
    createChorus(
      title,
      theme
    );

  const bridge =
    createBridge(theme);

  let intro = "";

  if (
    artist
      .toLowerCase()
      .includes(
        "mathias fernandes"
      )
  ) {

    intro =
`[Introdução]
Oh, oh… Mathias Fernandes!

`;
  }

  return (
`${intro}[Verso 1]
${verse1}

[Pré-Refrão]
Mesmo quando eu não vejo
Eu sei que estás aqui
A Tua graça me sustenta
E me ensina a prosseguir

[Refrão]
${chorus}

[Verso 2]
${verse2}

[Pré-Refrão]
Se a tempestade levantar
Eu não vou retroceder
A Tua mão está comigo
E eu escolho permanecer

[Refrão]
${chorus}

[Ponte]
${bridge}

[Refrão Final]
${chorus}

[Final]
Eu descanso em Ti
Eu confio em Ti
Minha história está
Nas Tuas mãos`
  );
}


/* =========================================================
   GERAR LETRA
========================================================= */

window.generateAutomaticLyrics =
  function () {

    const artist =
      $("#artist")
        ?.value
        ?.trim() || "";

    const album =
      $("#album")
        ?.value
        ?.trim() || "";

    const title =
      $("#title")
        ?.value
        ?.trim() || "";

    const category =
      $("#category")
        ?.value || "";

    const theme =
      $("#lyricsTheme")
        ?.value
        ?.trim() || "";


    if (!artist) {

      setLyricsStatus(
        "Digite o artista primeiro.",
        "error"
      );

      return;
    }


    if (!title) {

      setLyricsStatus(
        "Digite o nome da música primeiro.",
        "error"
      );

      return;
    }


    if (!category) {

      setLyricsStatus(
        "Escolha a categoria.",
        "error"
      );

      return;
    }


    const lyrics =
      createLyrics({
        title,
        artist,
        album,
        category,
        theme
      });


    $("#lyrics").value =
      lyrics;

    $("#lyrics")
      .dataset.generated =
      "true";


    setLyricsStatus(
      "Letra original criada. Revise antes de publicar.",
      "ok"
    );
  };


/* =========================================================
   UPLOAD STORAGE
========================================================= */

async function uploadFile(
  file,
  path
) {

  const response =
    await authenticatedFetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            file.type ||
            "application/octet-stream",

          "x-upsert":
            "true"
        },

        body:
          file
      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (!response.ok) {

    throw new Error(
      data.message ||
      data.error ||
      "Erro ao enviar arquivo."
    );
  }

  return data;
}


function publicUrl(path) {

  return (
    `${SUPABASE_URL}` +
    `/storage/v1/object/public/` +
    `${BUCKET}/${path}`
  );
}


/* =========================================================
   SALVAR FAIXA
========================================================= */

async function saveTrack(
  track
) {

  const response =
    await authenticatedFetch(
      `${SUPABASE_URL}/rest/v1/tracks`,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

          "Prefer":
            "return=representation"
        },

        body:
          JSON.stringify(
            track
          )
      }
    );


  const data =
    await response
      .json()
      .catch(
        () => []
      );


  if (!response.ok) {

    throw new Error(
      data.message ||
      data.hint ||
      data.details ||
      "Erro ao publicar música."
    );
  }

  return data[0];
}


/* =========================================================
   CARREGAR BIBLIOTECA
========================================================= */

async function loadTracks() {

  try {

    const response =
      await authenticatedFetch(
        `${SUPABASE_URL}/rest/v1/tracks?select=*&order=created_at.desc`
      );


    if (!response.ok) {

      throw new Error(
        "Erro ao carregar biblioteca."
      );
    }


    publishedTracks =
      await response.json();


    updateArtistSuggestions();

    renderTracks();

    populateSyncTrackSelect();


  } catch (error) {

    console.error(error);

    setStatus(
      error.message,
      "error"
    );
  }
}


/* =========================================================
   SUGESTÕES ARTISTAS
========================================================= */

function updateArtistSuggestions() {

  const list =
    $("#artistSuggestions");

  if (!list) return;


  const defaults = [

    "Lucas & Ana Paula",
    "Letícia Lima",
    "Breno Silva",
    "Léo Lima & Fernandes",
    "Lucas Henrique",
    "Mathias Fernandes",
    "Henrique Santana",
    "Noah James",
    "Luke Carter",
    "Ethan Grace"
  ];


  const artists =
    publishedTracks
      .map(
        track =>
          track.artist
      )
      .filter(Boolean);


  const all =
    [
      ...new Set([
        ...defaults,
        ...artists
      ])
    ]
      .sort(
        (a, b) =>
          a.localeCompare(
            b,
            "pt-BR"
          )
      );


  list.innerHTML =
    all
      .map(
        artist =>
          `<option value="${escapeHtml(artist)}"></option>`
      )
      .join("");
}


/* =========================================================
   LISTA DO SINCRONIZADOR
========================================================= */

function populateSyncTrackSelect() {

  const select =
    $("#syncTrackSelect");

  if (!select) return;


  const withLyrics =
    publishedTracks
      .filter(
        track =>
          track.lyrics &&
          track.lyrics.trim() &&
          track.audio_url
      );


  select.innerHTML =
    `
      <option value="">
        Selecione uma música publicada
      </option>
    ` +
    withLyrics
      .map(
        track =>
`
<option value="${track.id}">
${escapeHtml(track.artist)} — ${escapeHtml(track.title)}
</option>
`
      )
      .join("");
}


/* =========================================================
   PREPARAR LINHAS
========================================================= */

function extractSyncLines(
  lyrics
) {

  return String(
    lyrics || ""
  )
    .split("\n")
    .map(
      line =>
        line.trim()
    )
    .filter(
      line =>
        line &&
        !(
          line.startsWith("[") &&
          line.endsWith("]")
        )
    );
}


/* =========================================================
   ESCOLHER MÚSICA PARA SINCRONIZAR
========================================================= */

if ($("#syncTrackSelect")) {

  $("#syncTrackSelect")
    .addEventListener(
      "change",
      () => {

        const id =
          $("#syncTrackSelect")
            .value;


        if (!id) {

          resetSyncArea();

          return;
        }


        const track =
          publishedTracks.find(
            item =>
              String(item.id) ===
              String(id)
          );


        if (!track) {

          resetSyncArea();

          return;
        }


        syncTrack =
          track;


        syncLyricsLines =
          extractSyncLines(
            track.lyrics
          );


        syncData =
          [];


        syncLineIndex =
          0;


        $("#syncTrackInfo")
          .style.display =
          "block";


        $("#syncTrackTitle")
          .textContent =
          track.title;


        $("#syncTrackArtist")
          .textContent =
          `${track.artist} • ${track.album}`;


        syncAudio.src =
          track.audio_url;


        syncAudio.currentTime =
          0;


        /*
          Se já existe letra sincronizada,
          carrega automaticamente.
        */

        if (
          Array.isArray(
            track.lyrics_synced
          ) &&
          track.lyrics_synced.length
        ) {

          syncData =
            track.lyrics_synced
              .map(
                item => ({
                  time:
                    Number(
                      item.time
                    ),
                  text:
                    item.text
                })
              );


          syncLineIndex =
            Math.min(
              syncData.length,
              syncLyricsLines.length
            );


          setSyncStatus(
            "Essa música já possui sincronização. Você pode continuar ou recomeçar.",
            "ok"
          );

        }

        else {

          setSyncStatus(
            "Dê play e marque cada linha quando ela começar."
          );
        }


        $("#markSyncButton")
          .disabled =
          false;


        $("#restartSyncButton")
          .disabled =
          false;


        updateSyncScreen();
      }
    );
}


/* =========================================================
   RESET SINCRONIZADOR
========================================================= */

function resetSyncArea() {

  syncTrack =
    null;

  syncLyricsLines =
    [];

  syncData =
    [];

  syncLineIndex =
    0;


  if (syncAudio) {

    syncAudio.pause();

    syncAudio.removeAttribute(
      "src"
    );
  }


  if ($("#syncTrackInfo")) {

    $("#syncTrackInfo")
      .style.display =
      "none";
  }


  if ($("#currentSyncLine")) {

    $("#currentSyncLine")
      .textContent =
      "Escolha uma música.";
  }


  if ($("#syncLines")) {

    $("#syncLines")
      .innerHTML =
`
<div class="empty">
Escolha uma música com letra.
</div>
`;
  }


  if ($("#syncProgressText")) {

    $("#syncProgressText")
      .textContent =
      "0 / 0";
  }


  if ($("#syncProgressFill")) {

    $("#syncProgressFill")
      .style.width =
      "0%";
  }


  if ($("#markSyncButton")) {

    $("#markSyncButton")
      .disabled =
      true;
  }


  if ($("#undoSyncButton")) {

    $("#undoSyncButton")
      .disabled =
      true;
  }


  if ($("#restartSyncButton")) {

    $("#restartSyncButton")
      .disabled =
      true;
  }


  if ($("#saveSyncButton")) {

    $("#saveSyncButton")
      .disabled =
      true;
  }


  setSyncStatus("");
}


/* =========================================================
   TEMPO DO PLAYER
========================================================= */

if (syncAudio) {

  syncAudio.addEventListener(
    "timeupdate",
    () => {

      if ($("#syncCurrentTime")) {

        $("#syncCurrentTime")
          .textContent =
          formatSyncTime(
            syncAudio.currentTime
          );
      }
    }
  );
}


/* =========================================================
   MARCAR LINHA
========================================================= */

if ($("#markSyncButton")) {

  $("#markSyncButton")
    .onclick =
    () => {

      if (
        !syncTrack ||
        !syncLyricsLines.length
      ) {
        return;
      }


      if (
        syncLineIndex >=
        syncLyricsLines.length
      ) {

        setSyncStatus(
          "Todas as linhas já foram marcadas.",
          "ok"
        );

        return;
      }


      const time =
        Number(
          syncAudio.currentTime
            .toFixed(1)
        );


      const text =
        syncLyricsLines[
          syncLineIndex
        ];


      syncData[
        syncLineIndex
      ] = {

        time,
        text
      };


      syncLineIndex++;


      setSyncStatus(
        `Linha marcada em ${formatSyncTime(time)}.`,
        "ok"
      );


      updateSyncScreen();
    };
}


/* =========================================================
   VOLTAR UMA LINHA
========================================================= */

if ($("#undoSyncButton")) {

  $("#undoSyncButton")
    .onclick =
    () => {

      if (
        syncLineIndex <= 0
      ) {
        return;
      }


      syncLineIndex--;


      syncData.splice(
        syncLineIndex,
        1
      );


      const previous =
        syncData[
          syncLineIndex - 1
        ];


      if (
        previous &&
        syncAudio
      ) {

        syncAudio.currentTime =
          Math.max(
            0,
            previous.time
          );
      }


      setSyncStatus(
        "Última marca removida."
      );


      updateSyncScreen();
    };
}


/* =========================================================
   RECOMEÇAR SINCRONIZAÇÃO
========================================================= */

if ($("#restartSyncButton")) {

  $("#restartSyncButton")
    .onclick =
    () => {

      if (!syncTrack) {
        return;
      }


      const ok =
        confirm(
          "Apagar as marcações e começar novamente?"
        );


      if (!ok) {
        return;
      }


      syncData =
        [];

      syncLineIndex =
        0;


      syncAudio.pause();

      syncAudio.currentTime =
        0;


      setSyncStatus(
        "Sincronização reiniciada."
      );


      updateSyncScreen();
    };
}


/* =========================================================
   ATUALIZAR TELA SINCRONIZADOR
========================================================= */

function updateSyncScreen() {

  const total =
    syncLyricsLines.length;


  const done =
    syncData.length;


  if ($("#syncProgressText")) {

    $("#syncProgressText")
      .textContent =
      `${done} / ${total}`;
  }


  if ($("#syncProgressFill")) {

    const percent =
      total
        ? (
          done /
          total
        ) * 100
        : 0;


    $("#syncProgressFill")
      .style.width =
      `${percent}%`;
  }


  if ($("#currentSyncLine")) {

    if (
      syncLineIndex <
      total
    ) {

      $("#currentSyncLine")
        .textContent =
        syncLyricsLines[
          syncLineIndex
        ];

    }

    else if (total) {

      $("#currentSyncLine")
        .textContent =
        "✅ Todas as linhas foram marcadas.";

    }

    else {

      $("#currentSyncLine")
        .textContent =
        "Essa música não possui linhas para sincronizar.";
    }
  }


  if ($("#undoSyncButton")) {

    $("#undoSyncButton")
      .disabled =
      syncLineIndex === 0;
  }


  if ($("#saveSyncButton")) {

    $("#saveSyncButton")
      .disabled =
      !(
        total &&
        done === total
      );
  }


  renderSyncLines();
}


/* =========================================================
   MOSTRAR LINHAS SINCRONIZADAS
========================================================= */

function renderSyncLines() {

  const container =
    $("#syncLines");

  if (!container) return;


  if (
    !syncLyricsLines.length
  ) {

    container.innerHTML =
`
<div class="empty">
Nenhuma linha disponível.
</div>
`;

    return;
  }


  container.innerHTML =
    syncLyricsLines
      .map(
        (line, index) => {

          const marked =
            syncData[index];


          const current =
            index ===
            syncLineIndex;


          return `
<div
  style="
    padding:11px 12px;
    border-radius:11px;
    border:1px solid ${
      current
        ? "#f0ad2f66"
        : "#ffffff10"
    };
    background:${
      current
        ? "#f0ad2f12"
        : "#ffffff04"
    };
  "
>

  <div
    style="
      display:flex;
      gap:10px;
      align-items:flex-start;
    "
  >

    <strong
      style="
        min-width:52px;
        color:${
          marked
            ? "#ffd36b"
            : "#6f7e8e"
        };
        font-size:11px;
      "
    >
      ${
        marked
          ? formatSyncTime(
              marked.time
            )
          : "--:--"
      }
    </strong>

    <span
      style="
        color:${
          current
            ? "#ffffff"
            : "#c6d0da"
        };
        font-size:13px;
        line-height:1.4;
      "
    >
      ${escapeHtml(line)}
    </span>

  </div>

</div>
`;
        }
      )
      .join("");


  /*
    Faz a linha atual
    aparecer automaticamente.
  */

  const items =
    container.children;


  if (
    items[
      syncLineIndex
    ]
  ) {

    items[
      syncLineIndex
    ]
      .scrollIntoView({
        behavior:
          "smooth",

        block:
          "center"
      });
  }
}


/* =========================================================
   SALVAR LETRA SINCRONIZADA
========================================================= */

if ($("#saveSyncButton")) {

  $("#saveSyncButton")
    .onclick =
    async () => {

      if (
        !syncTrack ||
        !syncData.length
      ) {

        return;
      }


      if (
        syncData.length !==
        syncLyricsLines.length
      ) {

        setSyncStatus(
          "Marque todas as linhas antes de salvar.",
          "error"
        );

        return;
      }


      const button =
        $("#saveSyncButton");


      button.disabled =
        true;


      try {

        setSyncStatus(
          "Salvando sincronização..."
        );


        const response =
          await authenticatedFetch(

            `${SUPABASE_URL}/rest/v1/tracks?id=eq.${encodeURIComponent(syncTrack.id)}`,

            {

              method:
                "PATCH",

              headers: {

                "Content-Type":
                  "application/json",

                "Prefer":
                  "return=representation"
              },

              body:
                JSON.stringify({

                  lyrics_synced:
                    syncData

                })
            }
          );


        const data =
          await response
            .json()
            .catch(
              () => []
            );


        if (!response.ok) {

          throw new Error(
            data.message ||
            data.hint ||
            "Não foi possível salvar a sincronização."
          );
        }


        syncTrack.lyrics_synced =
          [
            ...syncData
          ];


        const local =
          publishedTracks.find(
            item =>
              String(item.id) ===
              String(syncTrack.id)
          );


        if (local) {

          local.lyrics_synced =
            [
              ...syncData
            ];
        }


        setSyncStatus(
          "✅ Letra sincronizada e salva no Vem Comigo PLAY.",
          "ok"
        );


      } catch (error) {

        console.error(error);


        setSyncStatus(
          error.message,
          "error"
        );

      } finally {

        button.disabled =
          false;
      }
    };
}


/* =========================================================
   MOSTRAR MÚSICAS PUBLICADAS
========================================================= */

function renderTracks() {

  const list =
    $("#musicList");

  if (!list) return;


  if (!publishedTracks.length) {

    list.innerHTML =
`
<div class="empty">
Nenhuma música publicada ainda.
</div>
`;

    return;
  }


  list.innerHTML =
    publishedTracks
      .map(
        track => {

          const cover =
            track.cover_url ||
            "logo-play.png";


          const hasLyrics =
            Boolean(
              track.lyrics &&
              track.lyrics.trim()
            );


          const synced =
            Array.isArray(
              track.lyrics_synced
            ) &&
            track.lyrics_synced.length;


          return `
<div
  class="music-item"
  data-id="${track.id}"
>

  <img
    src="${escapeHtml(cover)}"
    alt="${escapeHtml(track.title)}"
  >

  <div class="music-info">

    <strong>
      ${escapeHtml(track.title)}
    </strong>

    <span>
      ${escapeHtml(track.artist)}
      •
      ${escapeHtml(track.album)}
    </span>

    <span>
      ${escapeHtml(track.category)}
      ${
        hasLyrics
          ? " • 🎤 Letra"
          : ""
      }
      ${
        synced
          ? " • ✨ Sincronizada"
          : ""
      }
    </span>

  </div>


  <div class="music-actions">

    <button
      class="preview"
      data-url="${escapeHtml(track.audio_url)}"
      title="Ouvir"
    >
      ▶
    </button>


    ${
      hasLyrics
        ? `
<button
  class="view-lyrics"
  data-id="${track.id}"
  title="Ver letra"
>
  🎤
</button>
`
        : ""
    }


    <button
      class="delete"
      data-id="${track.id}"
      data-audio="${escapeHtml(track.audio_path || "")}"
      data-cover="${escapeHtml(track.cover_path || "")}"
      title="Excluir"
    >
      🗑
    </button>

  </div>

</div>
`;
        }
      )
      .join("");


  document
    .querySelectorAll(
      ".preview"
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            const player =
              new Audio(
                button.dataset.url
              );

            player.play();
          };
      }
    );


  document
    .querySelectorAll(
      ".view-lyrics"
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            const track =
              publishedTracks.find(
                item =>
                  String(item.id) ===
                  String(
                    button.dataset.id
                  )
              );


            if (!track) return;


            alert(
              `${track.title}\n` +
              `${track.artist}\n\n` +
              `${track.lyrics}`
            );
          };
      }
    );


  document
    .querySelectorAll(
      ".delete"
    )
    .forEach(
      button => {

        button.onclick =
          () =>
            deleteTrack(
              button.dataset.id,
              button.dataset.audio,
              button.dataset.cover
            );
      }
    );
}


/* =========================================================
   EXCLUIR STORAGE
========================================================= */

async function deleteStorageFile(
  path
) {

  if (!path) return;


  await authenticatedFetch(

    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,

    {
      method:
        "DELETE"
    }
  );
}


/* =========================================================
   EXCLUIR MÚSICA
========================================================= */

async function deleteTrack(
  id,
  audioPath,
  coverPath
) {

  const confirmation =
    confirm(
      "Excluir esta música do Vem Comigo PLAY?"
    );


  if (!confirmation) {
    return;
  }


  try {

    setStatus(
      "Excluindo..."
    );


    const response =
      await authenticatedFetch(

        `${SUPABASE_URL}/rest/v1/tracks?id=eq.${encodeURIComponent(id)}`,

        {
          method:
            "DELETE"
        }
      );


    if (!response.ok) {

      throw new Error(
        "Não foi possível excluir."
      );
    }


    await deleteStorageFile(
      audioPath
    );


    await deleteStorageFile(
      coverPath
    );


    setStatus(
      "Música excluída.",
      "ok"
    );


    await loadTracks();


  } catch (error) {

    console.error(error);

    setStatus(
      error.message,
      "error"
    );
  }
}


/* =========================================================
   ARQUIVOS
========================================================= */

const audioInput =
  $("#audioFile");


if (audioInput) {

  audioInput.addEventListener(
    "change",
    () => {

      const file =
        audioInput.files[0];


      $("#audioName")
        .textContent =
        file
          ? file.name
          : "Escolher música";
    }
  );
}


const coverInput =
  $("#coverFile");


if (coverInput) {

  coverInput.addEventListener(
    "change",
    () => {

      const file =
        coverInput.files[0];


      $("#coverName")
        .textContent =
        file
          ? file.name
          : "Escolher capa";
    }
  );
}


/* =========================================================
   PUBLICAR MÚSICA
========================================================= */

const form =
  $("#musicForm");


if (form) {

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!accessToken) {

        const logged =
          await login();

        if (!logged) return;
      }


      const artist =
        $("#artist")
          .value
          .trim();


      const album =
        $("#album")
          .value
          .trim();


      const title =
        $("#title")
          .value
          .trim();


      const category =
        $("#category")
          .value;


      const lyrics =
        $("#lyrics")
          ?.value
          ?.trim() ||
        "";


      const lyricsGenerated =
        $("#lyrics")
          ?.dataset
          ?.generated ===
          "true";


      const audioFile =
        $("#audioFile")
          .files[0];


      const coverFile =
        $("#coverFile")
          .files[0];


      if (
        !artist ||
        !album ||
        !title ||
        !category ||
        !audioFile
      ) {

        setStatus(
          "Preencha artista, álbum, música, categoria e escolha o MP3.",
          "error"
        );

        return;
      }


      const button =
        $("#uploadButton");


      button.disabled =
        true;


      try {

        showProgress(
          10,
          "Preparando..."
        );


        const artistFolder =
          slug(artist);


        const albumFolder =
          slug(album);


        const songName =
          slug(title);


        const audioExt =
          (
            audioFile.name
              .split(".")
              .pop() ||
            "mp3"
          )
            .toLowerCase();


        const audioPath =
          `${artistFolder}/` +
          `${albumFolder}/` +
          `${songName}.${audioExt}`;


        showProgress(
          30,
          "Enviando música..."
        );


        await uploadFile(
          audioFile,
          audioPath
        );


        const audioURL =
          publicUrl(
            audioPath
          );


        let coverURL =
          "logo-play.png";


        let coverPath =
          "";


        if (coverFile) {

          showProgress(
            55,
            "Enviando capa..."
          );


          const coverExt =
            (
              coverFile.name
                .split(".")
                .pop() ||
              "jpg"
            )
              .toLowerCase();


          coverPath =
            `${artistFolder}/` +
            `${albumFolder}/` +
            `capa.${coverExt}`;


          await uploadFile(
            coverFile,
            coverPath
          );


          coverURL =
            publicUrl(
              coverPath
            );
        }


        showProgress(
          80,
          "Publicando..."
        );


        await saveTrack({

          title,
          artist,
          album,
          category,

          type:
            category ===
              "Podcasts"
              ? "podcast"
              : "music",

          audio_url:
            audioURL,

          audio_path:
            audioPath,

          cover_url:
            coverURL,

          cover_path:
            coverPath,

          lyrics:
            lyrics ||
            null,

          lyrics_generated:
            lyricsGenerated,

          lyrics_synced:
            null
        });


        showProgress(
          100,
          "Publicado!"
        );


        setStatus(
          lyrics
            ? "Música e letra publicadas com sucesso."
            : "Música publicada com sucesso.",
          "ok"
        );


        form.reset();


        $("#audioName")
          .textContent =
          "Escolher música";


        $("#coverName")
          .textContent =
          "Escolher capa";


        $("#lyrics")
          .dataset.generated =
          "false";


        setLyricsStatus("");


        await loadTracks();


        hideProgress();


      } catch (error) {

        console.error(error);


        setStatus(
          error.message ||
          "Erro ao publicar.",
          "error"
        );


        hideProgress();


      } finally {

        button.disabled =
          false;
      }
    }
  );
}


/* =========================================================
   ALTERAÇÃO MANUAL DA LETRA
========================================================= */

const lyricsBox =
  $("#lyrics");


if (lyricsBox) {

  lyricsBox.addEventListener(
    "input",
    () => {

      if (
        !lyricsBox
          .dataset.generated
      ) {

        lyricsBox
          .dataset.generated =
          "false";
      }
    }
  );
}


/* =========================================================
   INICIAR
========================================================= */

async function startAdmin() {

  sessionStorage.removeItem(
    "vcplay-token"
  );

  sessionStorage.removeItem(
    "vcplay-refresh-token"
  );


  accessToken =
    "";

  refreshToken =
    "";


  const logged =
    await login();


  if (logged) {

    await loadTracks();
  }
}


startAdmin();
