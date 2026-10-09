const SUPABASE_URL =
  "https://rtlkifpsoviwxgwbbuet.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_p95BIFIlAQ02aZYVdDKaNQ_mjtXSBYK";

const BUCKET =
  "musicas";

const $ =
  selector =>
    document.querySelector(
      selector
    );

let accessToken =
  "";

let refreshToken =
  "";

let publishedTracks =
  [];


/* =========================================================
   SINCRONIZAÇÃO
========================================================= */

let syncTrack =
  null;

let syncLyricsLines =
  [];

let syncData =
  [];

let syncLineIndex =
  0;

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

  if (!box) {
    return;
  }

  box.textContent =
    message;

  box.className =
    `status ${type}`;
}


function setLyricsStatus(
  message,
  type = ""
) {

  const box =
    $("#lyricsStatus");

  if (!box) {
    return;
  }

  box.textContent =
    message;

  box.className =
    `status ${type}`;
}


function setSyncStatus(
  message,
  type = ""
) {

  const box =
    $("#syncStatus");

  if (!box) {
    return;
  }

  box.textContent =
    message;

  box.className =
    `status ${type}`;
}


/* =========================================================
   UTILIDADES
========================================================= */

function escapeHtml(
  text = ""
) {

  return String(text)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


function slug(
  text
) {

  return String(
    text || ""
  )

    .normalize(
      "NFD"
    )

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


function randomItem(
  array
) {

  return array[
    Math.floor(
      Math.random() *
      array.length
    )
  ];
}


function formatSyncTime(
  seconds
) {

  if (
    !Number.isFinite(
      seconds
    )
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
      .padStart(
        4,
        "0"
      )
  );
}


/* =========================================================
   LOGIN
========================================================= */

async function login() {

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
      "Entrando..."
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
        data.message ||
        data.error_description ||
        "Erro no login."
      );
    }


    accessToken =
      data.access_token;


    refreshToken =
      data.refresh_token ||
      "";


    setStatus(
      "Painel conectado.",
      "ok"
    );


    return true;


  } catch (error) {

    console.error(
      error
    );


    setStatus(
      error.message,
      "error"
    );


    return false;
  }
}


/* =========================================================
   REFRESH TOKEN
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

    apikey:
      SUPABASE_ANON_KEY,

    Authorization:
      `Bearer ${accessToken}`
  };


  let response =
    await fetch(
      url,
      options
    );


  if (
    response.status ===
    401
  ) {

    const renewed =
      await refreshSession();


    if (renewed) {

      options.headers.Authorization =
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

  const a = [

    "Quando a noite chega e eu penso em parar",
    "Quando o medo tenta a minha fé calar",
    "Mesmo quando eu não consigo entender",
    "Quando o caminho parece se fechar",
    "Se o meu coração começa a duvidar",
    "Quando a resposta demora pra chegar"
  ];


  const b = [

    "Eu lembro que Tua mão ainda está aqui",
    "Eu sei que a Tua voz não desistiu de mim",
    "Eu olho para o céu e volto a confiar",
    "A Tua presença vem me sustentar",
    "Eu entrego os meus passos outra vez",
    "Eu sei que Tu conheces o meu amanhã"
  ];


  const c = [

    "E encontro forças para prosseguir",
    "E mesmo sem enxergar eu vou seguir",
    "Porque comigo sempre vais estar",
    "E a esperança volta a respirar",
    "Pois Tua promessa não vai terminar",
    "E o impossível pode se transformar"
  ];


  return (
`${randomItem(a)}
${randomItem(b)}
${theme
  ? `Eu entrego a Ti ${theme}`
  : "Eu entrego os meus sonhos diante de Ti"}
${randomItem(c)}`
  );
}


function createChorus(
  title,
  theme
) {

  return (
`${title}
Eu escolho confiar em Ti
Mesmo sem conseguir enxergar
Eu sei que estás cuidando de mim

${theme
  ? `Em ${theme} eu vou permanecer`
  : "Na Tua promessa eu vou permanecer"}
Segura firme a minha mão
Com Jesus eu vou continuar`
  );
}


function createBridge(
  theme
) {

  return (
`Pode o vento soprar
Pode a noite chegar
A Tua presença comigo
Vai me fazer continuar

Eu não caminho pelo que vejo
Eu escolho caminhar pela fé
${theme
  ? `Eu entrego a Ti ${theme}`
  : "Meu futuro está em Tuas mãos"}
E descanso em quem Tu és`
  );
}


function createLyrics({
  title,
  artist,
  category,
  theme
}) {

  let intro =
    "";


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


  if (
    category ===
    "Gospel Vaqueiro"
  ) {

    intro +=
`[Introdução Instrumental]
Sanfona, violão e fé na estrada.

`;
  }


  return (
`${intro}[Verso 1]
${createVerse(theme)}

[Pré-Refrão]
Mesmo quando eu não vejo
Eu sei que estás aqui
A Tua graça me sustenta
E me ensina a prosseguir

[Refrão]
${createChorus(
  title,
  theme
)}

[Verso 2]
${createVerse(theme)}

[Pré-Refrão]
Se a tempestade levantar
Eu não vou retroceder
A Tua mão está comigo
E eu escolho permanecer

[Refrão]
${createChorus(
  title,
  theme
)}

[Ponte]
${createBridge(
  theme
)}

[Refrão Final]
${createChorus(
  title,
  theme
)}

[Final]
Eu descanso em Ti
Eu confio em Ti
Minha história está
Nas Tuas mãos`
  );
}


/* =========================================================
   BOTÃO GERAR LETRA
========================================================= */

function generateAutomaticLyrics() {

  const artist =
    $("#artist")
      ?.value
      ?.trim() ||
    "";


  const title =
    $("#title")
      ?.value
      ?.trim() ||
    "";


  const category =
    $("#category")
      ?.value ||
    "";


  const theme =
    $("#lyricsTheme")
      ?.value
      ?.trim() ||
    "";


  if (!artist) {

    setLyricsStatus(
      "Digite o artista primeiro.",
      "error"
    );

    return;
  }


  if (!title) {

    setLyricsStatus(
      "Digite o nome da música.",
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


  setLyricsStatus(
    "Gerando letra..."
  );


  const result =
    createLyrics({

      title,
      artist,
      category,
      theme

    });


  const box =
    $("#lyrics");


  box.value =
    result;


  box.dataset.generated =
    "true";


  setLyricsStatus(
    "✅ Letra gerada. Revise antes de publicar.",
    "ok"
  );
}


/* =========================================================
   LIGAR BOTÃO GERAR
========================================================= */

const generateButton =
  $("#generateLyricsButton");


if (generateButton) {

  generateButton.onclick =
    generateAutomaticLyrics;
}


/* =========================================================
   LIMPAR LETRA
========================================================= */

const clearButton =
  $("#clearLyricsButton");


if (clearButton) {

  clearButton.onclick =
    () => {

      const box =
        $("#lyrics");


      box.value =
        "";


      box.dataset.generated =
        "false";


      setLyricsStatus(
        "Letra limpa."
      );
    };
}


/* =========================================================
   UPLOAD
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
      "Erro no upload."
    );
  }


  return data;
}


function publicUrl(
  path
) {

  return (
    `${SUPABASE_URL}` +
    `/storage/v1/object/public/` +
    `${BUCKET}/${path}`
  );
}


/* =========================================================
   SALVAR TRACK
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

          Prefer:
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
      "Erro ao salvar música."
    );
  }


  return data[0];
}


/* =========================================================
   CARREGAR TRACKS
========================================================= */

async function loadTracks() {

  const response =
    await authenticatedFetch(

      `${SUPABASE_URL}/rest/v1/tracks?select=*&order=created_at.desc`

    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      "Erro ao carregar músicas."
    );
  }


  publishedTracks =
    data;


  renderArtistSuggestions();

  renderTracks();

  renderSyncSelect();
}


/* =========================================================
   ARTISTAS
========================================================= */

function renderArtistSuggestions() {

  const list =
    $("#artistSuggestions");


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


  const fromTracks =
    publishedTracks
      .map(
        t =>
          t.artist
      )
      .filter(Boolean);


  const artists =
    [
      ...new Set([
        ...defaults,
        ...fromTracks
      ])
    ];


  list.innerHTML =
    artists
      .sort()
      .map(
        artist =>
          `<option value="${escapeHtml(artist)}"></option>`
      )
      .join("");
}


/* =========================================================
   BIBLIOTECA
========================================================= */

function renderTracks() {

  const list =
    $("#musicList");


  if (!publishedTracks.length) {

    list.innerHTML =
      `
      <div class="empty">
        Nenhuma música publicada.
      </div>
      `;

    return;
  }


  list.innerHTML =
    publishedTracks
      .map(
        track => {

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


          return (
`
<div class="music-item">

  <img
    src="${escapeHtml(
      track.cover_url ||
      "logo-play.png"
    )}"
    alt=""
  >

  <div class="music-info">

    <strong>
      ${escapeHtml(
        track.title
      )}
    </strong>

    <span>
      ${escapeHtml(
        track.artist
      )}
      •
      ${escapeHtml(
        track.album
      )}
    </span>

    <span>
      ${escapeHtml(
        track.category
      )}

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
      data-url="${escapeHtml(
        track.audio_url
      )}"
    >
      ▶
    </button>

    <button
      class="delete"
      data-id="${track.id}"
      data-audio="${escapeHtml(
        track.audio_path ||
        ""
      )}"
      data-cover="${escapeHtml(
        track.cover_path ||
        ""
      )}"
    >
      🗑
    </button>

  </div>

</div>
`
          );
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
   DELETE
========================================================= */

async function deleteTrack(
  id,
  audioPath,
  coverPath
) {

  if (
    !confirm(
      "Excluir esta música?"
    )
  ) {

    return;
  }


  const response =
    await authenticatedFetch(

      `${SUPABASE_URL}/rest/v1/tracks?id=eq.${encodeURIComponent(id)}`,

      {
        method:
          "DELETE"
      }
    );


  if (!response.ok) {

    alert(
      "Erro ao excluir."
    );

    return;
  }


  if (audioPath) {

    await authenticatedFetch(

      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${audioPath}`,

      {
        method:
          "DELETE"
      }
    );
  }


  if (coverPath) {

    await authenticatedFetch(

      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${coverPath}`,

      {
        method:
          "DELETE"
      }
    );
  }


  await loadTracks();
}


/* =========================================================
   FILE INPUT
========================================================= */

$("#audioFile")
  ?.addEventListener(

    "change",

    () => {

      const file =
        $("#audioFile")
          .files[0];


      $("#audioName")
        .textContent =
        file
          ? file.name
          : "Escolher música";
    }
  );


$("#coverFile")
  ?.addEventListener(

    "change",

    () => {

      const file =
        $("#coverFile")
          .files[0];


      $("#coverName")
        .textContent =
        file
          ? file.name
          : "Escolher capa";
    }
  );


/* =========================================================
   PUBLICAR
========================================================= */

$("#musicForm")
  ?.addEventListener(

    "submit",

    async event => {

      event.preventDefault();


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
          .value
          .trim();


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
          "Preencha os campos obrigatórios.",
          "error"
        );

        return;
      }


      const button =
        $("#uploadButton");


      button.disabled =
        true;


      try {

        const artistFolder =
          slug(
            artist
          );


        const albumFolder =
          slug(
            album
          );


        const songName =
          slug(
            title
          );


        const audioPath =
          `${artistFolder}/${albumFolder}/${songName}.mp3`;


        await uploadFile(
          audioFile,
          audioPath
        );


        let coverPath =
          "";


        let coverURL =
          "logo-play.png";


        if (coverFile) {

          const ext =
            coverFile.name
              .split(".")
              .pop();


          coverPath =
            `${artistFolder}/${albumFolder}/capa.${ext}`;


          await uploadFile(
            coverFile,
            coverPath
          );


          coverURL =
            publicUrl(
              coverPath
            );
        }


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
            publicUrl(
              audioPath
            ),

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
            $("#lyrics")
              .dataset
              .generated ===
              "true",

          lyrics_synced:
            null
        });


        setStatus(
          "✅ Música publicada.",
          "ok"
        );


        $("#musicForm")
          .reset();


        $("#lyrics")
          .dataset.generated =
          "false";


        $("#audioName")
          .textContent =
          "Escolher música";


        $("#coverName")
          .textContent =
          "Escolher capa";


        await loadTracks();


      } catch (error) {

        console.error(
          error
        );


        setStatus(
          error.message,
          "error"
        );


      } finally {

        button.disabled =
          false;
      }
    }
  );


/* =========================================================
   SINCRONIZADOR - LISTA
========================================================= */

function renderSyncSelect() {

  const select =
    $("#syncTrackSelect");


  const tracksWithLyrics =
    publishedTracks.filter(

      track =>
        track.audio_url &&
        track.lyrics &&
        track.lyrics.trim()

    );


  select.innerHTML =
    `
      <option value="">
        Selecione uma música
      </option>
    ` +
    tracksWithLyrics
      .map(

        track =>
`
<option value="${track.id}">
${escapeHtml(track.artist)}
—
${escapeHtml(track.title)}
</option>
`
      )
      .join("");
}


/* =========================================================
   PEGAR LINHAS
========================================================= */

function extractLyricsLines(
  lyrics
) {

  return String(
    lyrics ||
    ""
  )

    .split(
      "\n"
    )

    .map(
      line =>
        line.trim()
    )

    .filter(
      line =>
        line &&
        !(
          line.startsWith(
            "["
          ) &&
          line.endsWith(
            "]"
          )
        )
    );
}


/* =========================================================
   ESCOLHER FAIXA
========================================================= */

$("#syncTrackSelect")
  ?.addEventListener(

    "change",

    () => {

      const id =
        $("#syncTrackSelect")
          .value;


      syncTrack =
        publishedTracks.find(

          track =>
            String(track.id) ===
            String(id)

        );


      if (!syncTrack) {

        return;
      }


      syncLyricsLines =
        extractLyricsLines(
          syncTrack.lyrics
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
        syncTrack.title;


      $("#syncTrackArtist")
        .textContent =
        `${syncTrack.artist} • ${syncTrack.album}`;


      $("#syncCover")
        .src =
        syncTrack.cover_url ||
        "logo-play.png";


      syncAudio.src =
        syncTrack.audio_url;


      syncAudio.currentTime =
        0;


      if (
        Array.isArray(
          syncTrack.lyrics_synced
        )
      ) {

        syncData =
          [
            ...syncTrack
              .lyrics_synced
          ];


        syncLineIndex =
          syncData.length;
      }


      $("#markSyncButton")
        .disabled =
        false;


      $("#restartSyncButton")
        .disabled =
        false;


      updateSyncScreen();


      setSyncStatus(
        "Dê play e marque cada linha quando ela começar."
      );
    }
  );


/* =========================================================
   TEMPO
========================================================= */

syncAudio
  ?.addEventListener(

    "timeupdate",

    () => {

      $("#syncCurrentTime")
        .textContent =
        formatSyncTime(
          syncAudio.currentTime
        );
    }
  );


/* =========================================================
   MARCAR LINHA
========================================================= */

$("#markSyncButton")
  ?.addEventListener(

    "click",

    () => {

      if (
        syncLineIndex >=
        syncLyricsLines.length
      ) {

        return;
      }


      const time =
        Number(
          syncAudio
            .currentTime
            .toFixed(
              1
            )
        );


      syncData[
        syncLineIndex
      ] = {

        time,

        text:
          syncLyricsLines[
            syncLineIndex
          ]
      };


      syncLineIndex++;


      updateSyncScreen();
    }
  );


/* =========================================================
   VOLTAR LINHA
========================================================= */

$("#undoSyncButton")
  ?.addEventListener(

    "click",

    () => {

      if (
        syncLineIndex <=
        0
      ) {

        return;
      }


      syncLineIndex--;


      syncData.splice(
        syncLineIndex,
        1
      );


      updateSyncScreen();
    }
  );


/* =========================================================
   RECOMEÇAR
========================================================= */

$("#restartSyncButton")
  ?.addEventListener(

    "click",

    () => {

      syncData =
        [];


      syncLineIndex =
        0;


      syncAudio.pause();


      syncAudio.currentTime =
        0;


      updateSyncScreen();
    }
  );


/* =========================================================
   ATUALIZAR SINCRONIZADOR
========================================================= */

function updateSyncScreen() {

  const total =
    syncLyricsLines.length;


  $("#syncProgressText")
    .textContent =
    `${syncData.length} / ${total}`;


  const percent =
    total
      ? (
        syncData.length /
        total
      ) * 100
      : 0;


  $("#syncProgressFill")
    .style.width =
    `${percent}%`;


  if (
    syncLineIndex <
    total
  ) {

    $("#currentSyncLine")
      .textContent =
      syncLyricsLines[
        syncLineIndex
      ];

  } else {

    $("#currentSyncLine")
      .textContent =
      "✅ Todas as linhas marcadas.";
  }


  $("#undoSyncButton")
    .disabled =
    syncLineIndex ===
    0;


  $("#saveSyncButton")
    .disabled =
    !(
      total &&
      syncData.length ===
      total
    );


  renderSyncLines();
}


/* =========================================================
   MOSTRAR LETRA
========================================================= */

function renderSyncLines() {

  const container =
    $("#syncLines");


  container.innerHTML =
    syncLyricsLines
      .map(

        (line, index) => {

          const marked =
            syncData[index];


          const active =
            index ===
            syncLineIndex;


          return (
`
<div
  style="
    padding:11px;
    border-radius:11px;
    border:1px solid ${
      active
        ? "#f0ad2f66"
        : "#ffffff10"
    };
    background:${
      active
        ? "#f0ad2f12"
        : "#ffffff04"
    };
  "
>

  <strong
    style="
      color:#ffd36b;
      margin-right:8px;
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

  ${escapeHtml(
    line
  )}

</div>
`
          );
        }
      )
      .join("");
}


/* =========================================================
   SALVAR SINCRONIZAÇÃO
========================================================= */

$("#saveSyncButton")
  ?.addEventListener(

    "click",

    async () => {

      if (!syncTrack) {
        return;
      }


      const response =
        await authenticatedFetch(

          `${SUPABASE_URL}/rest/v1/tracks?id=eq.${encodeURIComponent(syncTrack.id)}`,

          {

            method:
              "PATCH",

            headers: {

              "Content-Type":
                "application/json",

              Prefer:
                "return=representation"
            },

            body:
              JSON.stringify({

                lyrics_synced:
                  syncData

              })
          }
        );


      if (!response.ok) {

        setSyncStatus(
          "Erro ao salvar sincronização.",
          "error"
        );

        return;
      }


      syncTrack.lyrics_synced =
        [
          ...syncData
        ];


      setSyncStatus(
        "✅ Letra sincronizada e salva.",
        "ok"
      );
    }
  );


/* =========================================================
   INICIAR
========================================================= */

async function startAdmin() {

  const logged =
    await login();


  if (!logged) {
    return;
  }


  try {

    await loadTracks();

  } catch (error) {

    console.error(
      error
    );


    setStatus(
      error.message,
      "error"
    );
  }
}


startAdmin();
