/* =========================================================
   VEM COMIGO PLAY
   SITE PÚBLICO
   Catálogo automático via Supabase
========================================================= */

const SUPABASE_URL =
  "https://rtlkifpsoviwxgwbbuet.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_p95BIFIlAQ02aZYVdDKaNQ_mjtXSBYK";

const $ = (selector) =>
  document.querySelector(selector);

const audio =
  $("#audio");

let tracks = [];
let filteredTracks = [];
let queue = [];
let currentIndex = 0;
let currentTrack = null;

/* =========================================================
   TEMPO
========================================================= */

function formatTime(seconds) {

  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes =
    Math.floor(seconds / 60);

  const secs =
    Math.floor(seconds % 60);

  return (
    `${minutes}:` +
    String(secs).padStart(2, "0")
  );
}

/* =========================================================
   CONVERTER DADOS DO SUPABASE
========================================================= */

function normalizeTrack(track) {

  return {
    id:
      track.id,

    title:
      track.title,

    artist:
      track.artist,

    album:
      track.album,

    category:
      track.category,

    type:
      track.type || "music",

    audioUrl:
      track.audio_url,

    downloadUrl:
      track.audio_url,

    cover:
      track.cover_url ||
      "logo-play.png",

    createdAt:
      track.created_at
  };
}

/* =========================================================
   MOSTRAR CATÁLOGO
========================================================= */

function renderCatalog(list) {

  filteredTracks =
    list;

  const catalog =
    $("#catalog");

  if (!list.length) {

    catalog.innerHTML = `
      <div class="empty">
        Nenhuma música publicada ainda.
      </div>
    `;

    return;
  }

  catalog.innerHTML =
    list
      .map((track) => {

        return `
          <article
            class="track"
            data-id="${track.id}"
          >

            <div class="art">

              <img
                src="${track.cover}"
                alt="${track.title}"
                onerror="this.src='logo-play.png'"
              >

            </div>

            <div class="info">

              <strong>
                ${track.title}
              </strong>

              <span>
                ${track.artist}
                •
                ${track.album || track.category}
              </span>

            </div>

            <div class="actions">

              <button
                class="playOne"
                aria-label="Tocar"
              >
                ▶
              </button>

              ${
                track.downloadUrl
                  ? `
                    <a
                      href="${track.downloadUrl}"
                      download
                      target="_blank"
                      title="Baixar"
                      onclick="event.stopPropagation()"
                    >
                      ⇩
                    </a>
                  `
                  : ""
              }

            </div>

          </article>
        `;
      })
      .join("");

  document
    .querySelectorAll(".track")
    .forEach((element) => {

      const id =
        element.dataset.id;

      const button =
        element.querySelector(
          ".playOne"
        );

      button.onclick = () => {
        playById(id);
      };

      element
        .querySelector(".info")
        .onclick = () => {
          playById(id);
        };
    });
}

/* =========================================================
   TOCAR MÚSICA
========================================================= */

function playById(id) {

  currentTrack =
    tracks.find(
      (track) =>
        String(track.id) ===
        String(id)
    );

  if (!currentTrack) {
    return;
  }

  if (
    currentTrack.type ===
    "podcast"
  ) {

    queue =
      tracks.filter(
        (track) =>
          track.type ===
          "podcast"
      );

  } else {

    queue =
      tracks.filter(
        (track) =>
          track.type !==
          "podcast"
      );
  }

  currentIndex =
    queue.findIndex(
      (track) =>
        String(track.id) ===
        String(id)
    );

  $("#kind").textContent =
    currentTrack.type ===
    "podcast"
      ? "PODCAST"
      : "LOUVOR";

  $("#title").textContent =
    currentTrack.title;

  $("#artist").textContent =
    `${currentTrack.artist} • ${currentTrack.album || ""}`;

  $("#cover").src =
    currentTrack.cover ||
    "logo-play.png";

  if (!currentTrack.audioUrl) {

    $("#artist").textContent =
      `${currentTrack.artist} • áudio indisponível`;

    return;
  }

  audio.src =
    currentTrack.audioUrl;

  audio
    .play()
    .catch((error) => {

      console.log(
        "Reprodução aguardando interação:",
        error
      );
    });

  updateMediaSession();
}

/* =========================================================
   PRÓXIMA
========================================================= */

function nextTrack() {

  if (!queue.length) {
    return;
  }

  currentIndex =
    (currentIndex + 1) %
    queue.length;

  playById(
    queue[currentIndex].id
  );
}

/* =========================================================
   ANTERIOR
========================================================= */

function previousTrack() {

  if (!queue.length) {
    return;
  }

  currentIndex =
    (
      currentIndex -
      1 +
      queue.length
    ) %
    queue.length;

  playById(
    queue[currentIndex].id
  );
}

/* =========================================================
   PRIMEIRA MÚSICA
========================================================= */

function firstMusic() {

  return tracks.find(
    (track) =>
      track.type !==
      "podcast"
  );
}

/* =========================================================
   ALEATÓRIO
========================================================= */

function randomMusic() {

  const musics =
    tracks.filter(
      (track) =>
        track.type !==
        "podcast"
    );

  if (!musics.length) {
    return null;
  }

  const index =
    Math.floor(
      Math.random() *
      musics.length
    );

  return musics[index];
}

/* =========================================================
   PLAY PRINCIPAL
========================================================= */

$("#play").onclick = () => {

  if (!currentTrack) {

    const first =
      firstMusic();

    if (first) {
      playById(first.id);
    }

    return;
  }

  if (audio.paused) {

    audio.play();

  } else {

    audio.pause();
  }
};

/* =========================================================
   CONTROLES
========================================================= */

$("#next").onclick =
  nextTrack;

$("#prev").onclick =
  previousTrack;

audio.onended =
  nextTrack;

/* =========================================================
   PLAY / PAUSE
========================================================= */

audio.onplay = () => {

  $("#play").textContent =
    "⏸";
};

audio.onpause = () => {

  $("#play").textContent =
    "▶";
};

/* =========================================================
   DURAÇÃO
========================================================= */

audio.onloadedmetadata =
  () => {

    $("#dur").textContent =
      formatTime(
        audio.duration
      );
  };

/* =========================================================
   PROGRESSO
========================================================= */

audio.ontimeupdate =
  () => {

    $("#cur").textContent =
      formatTime(
        audio.currentTime
      );

    if (audio.duration) {

      $("#seek").value =
        String(
          (
            audio.currentTime /
            audio.duration
          ) *
          100
        );
    }
  };

/* =========================================================
   BARRA DE PROGRESSO
========================================================= */

$("#seek").oninput =
  (event) => {

    if (!audio.duration) {
      return;
    }

    audio.currentTime =
      (
        Number(
          event.target.value
        ) /
        100
      ) *
      audio.duration;
  };

/* =========================================================
   VOLUME
========================================================= */

audio.volume =
  0.85;

$("#volume").oninput =
  (event) => {

    audio.volume =
      Number(
        event.target.value
      );
  };

/* =========================================================
   CATEGORIAS
========================================================= */

document
  .querySelectorAll(
    ".chips button"
  )
  .forEach((button) => {

    button.onclick = () => {

      document
        .querySelectorAll(
          ".chips button"
        )
        .forEach(
          (other) => {

            other
              .classList
              .remove("active");
          }
        );

      button
        .classList
        .add("active");

      const category =
        button.dataset.cat;

      if (
        category === "Todos"
      ) {

        renderCatalog(
          tracks
        );

        return;
      }

      const filtered =
        tracks.filter(
          (track) =>
            track.category ===
            category
        );

      renderCatalog(
        filtered
      );
    };
  });

/* =========================================================
   BUSCA
========================================================= */

$("#searchToggle").onclick =
  () => {

    $("#searchBox")
      .classList
      .toggle("hidden");

    if (
      !$("#searchBox")
        .classList
        .contains("hidden")
    ) {

      $("#searchInput")
        .focus();
    }
  };

$("#searchInput").oninput =
  (event) => {

    const query =
      event.target.value
        .toLowerCase()
        .trim();

    const filtered =
      tracks.filter(
        (track) => {

          const text =
            `
            ${track.title}
            ${track.artist}
            ${track.album || ""}
            ${track.category}
            `
            .toLowerCase();

          return text.includes(
            query
          );
        }
      );

    renderCatalog(
      filtered
    );
  };

/* =========================================================
   TOCAR TUDO
========================================================= */

$("#playAll").onclick =
  () => {

    const musics =
      filteredTracks.filter(
        (track) =>
          track.type !==
          "podcast"
      );

    if (!musics.length) {
      return;
    }

    queue =
      musics;

    currentIndex =
      0;

    playById(
      musics[0].id
    );
  };

/* =========================================================
   HERO
========================================================= */

$("#heroPlay").onclick =
  () => {

    const first =
      firstMusic();

    if (first) {
      playById(first.id);
    }
  };

$("#heroShuffle").onclick =
  () => {

    const random =
      randomMusic();

    if (random) {
      playById(random.id);
    }
  };

/* =========================================================
   MEDIA SESSION
========================================================= */

function updateMediaSession() {

  if (
    !currentTrack ||
    !("mediaSession" in navigator)
  ) {
    return;
  }

  navigator.mediaSession.metadata =
    new MediaMetadata({

      title:
        currentTrack.title,

      artist:
        currentTrack.artist,

      album:
        currentTrack.album ||
        "Vem Comigo Records",

      artwork: [
        {
          src:
            currentTrack.cover ||
            "logo-play.png"
        }
      ]
    });
}

if (
  "mediaSession" in navigator
) {

  navigator.mediaSession
    .setActionHandler(
      "play",
      () => audio.play()
    );

  navigator.mediaSession
    .setActionHandler(
      "pause",
      () => audio.pause()
    );

  navigator.mediaSession
    .setActionHandler(
      "nexttrack",
      nextTrack
    );

  navigator.mediaSession
    .setActionHandler(
      "previoustrack",
      previousTrack
    );
}

/* =========================================================
   CARREGAR SUPABASE
========================================================= */

async function loadCatalog() {

  const catalog =
    $("#catalog");

  catalog.innerHTML = `
    <div class="empty">
      Carregando músicas...
    </div>
  `;

  try {

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/tracks?select=*&order=created_at.desc`,
        {
          headers: {

            "apikey":
              SUPABASE_ANON_KEY
          }
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.message ||
        "Não foi possível carregar as músicas."
      );
    }

    tracks =
      data.map(
        normalizeTrack
      );

    renderCatalog(
      tracks
    );

  } catch (error) {

    console.error(
      error
    );

    catalog.innerHTML = `
      <div class="empty">
        Não foi possível carregar o catálogo.
      </div>
    `;
  }
}

/* =========================================================
   INICIAR
========================================================= */

loadCatalog();
