const $ = (selector) => document.querySelector(selector);

const audio = $("#audio");

let tracks = [];
let filteredTracks = [];
let queue = [];
let currentIndex = 0;
let currentTrack = null;

/* =========================
   UTILIDADES
========================= */

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

/* =========================
   CATÁLOGO
========================= */

function renderCatalog(list) {
  filteredTracks = list;

  const catalog = $("#catalog");

  if (!list.length) {
    catalog.innerHTML = `
      <div class="empty">
        Nenhum conteúdo encontrado.
      </div>
    `;

    return;
  }

  catalog.innerHTML = list
    .map((track) => {
      const downloadButton = track.downloadUrl
        ? `
          <a
            href="${track.downloadUrl}"
            download
            title="Baixar"
            onclick="event.stopPropagation()"
          >
            ⇩
          </a>
        `
        : "";

      return `
        <article
          class="track"
          data-id="${track.id}"
        >

          <div class="art">
            <img
              src="${track.cover || "logo-play.png"}"
              alt="${track.title}"
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
              aria-label="Tocar ${track.title}"
            >
              ▶
            </button>

            ${downloadButton}

          </div>

        </article>
      `;
    })
    .join("");

  document
    .querySelectorAll(".track")
    .forEach((element) => {
      const id = element.dataset.id;

      const playButton =
        element.querySelector(".playOne");

      playButton.onclick = () => {
        playById(id);
      };
    });
}

/* =========================
   TOCAR FAIXA
========================= */

function playById(id) {
  currentTrack =
    tracks.find(
      (track) => track.id === id
    );

  if (!currentTrack) {
    return;
  }

  if (currentTrack.type === "podcast") {
    queue =
      tracks.filter(
        (track) =>
          track.type === "podcast"
      );
  } else {
    queue =
      tracks.filter(
        (track) =>
          track.type === "music"
      );
  }

  currentIndex =
    queue.findIndex(
      (track) =>
        track.id === id
    );

  $("#kind").textContent =
    currentTrack.type === "podcast"
      ? "PODCAST"
      : "LOUVOR";

  $("#title").textContent =
    currentTrack.title;

  $("#artist").textContent =
    currentTrack.artist;

  $("#cover").src =
    currentTrack.cover ||
    "logo-play.svg";

  if (!currentTrack.audioUrl) {
    $("#artist").textContent =
      `${currentTrack.artist} • áudio ainda não configurado`;

    audio.pause();

    audio.removeAttribute("src");

    audio.load();

    $("#play").textContent = "▶";

    return;
  }

  audio.src =
    currentTrack.audioUrl;

  audio
    .play()
    .catch((error) => {
      console.log(
        "O navegador bloqueou a reprodução automática:",
        error
      );
    });
}

/* =========================
   PRÓXIMA
========================= */

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

/* =========================
   ANTERIOR
========================= */

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

/* =========================
   PRIMEIRO LOUVOR
========================= */

function getFirstMusic() {
  return tracks.find(
    (track) =>
      track.type === "music"
  );
}

/* =========================
   ALEATÓRIO
========================= */

function getRandomMusic() {
  const musicTracks =
    tracks.filter(
      (track) =>
        track.type === "music"
    );

  if (!musicTracks.length) {
    return null;
  }

  const randomIndex =
    Math.floor(
      Math.random() *
      musicTracks.length
    );

  return musicTracks[randomIndex];
}

/* =========================
   BOTÃO PLAY PRINCIPAL
========================= */

$("#play").onclick = () => {
  if (!currentTrack) {
    const firstTrack =
      getFirstMusic();

    if (firstTrack) {
      playById(
        firstTrack.id
      );
    }

    return;
  }

  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
};

/* =========================
   CONTROLES
========================= */

$("#next").onclick =
  nextTrack;

$("#prev").onclick =
  previousTrack;

/* =========================
   QUANDO TERMINAR
========================= */

audio.onended = () => {
  nextTrack();
};

/* =========================
   PLAY / PAUSE
========================= */

audio.onplay = () => {
  $("#play").textContent =
    "⏸";
};

audio.onpause = () => {
  $("#play").textContent =
    "▶";
};

/* =========================
   DURAÇÃO
========================= */

audio.onloadedmetadata =
  () => {
    $("#dur").textContent =
      formatTime(
        audio.duration
      );
  };

/* =========================
   PROGRESSO
========================= */

audio.ontimeupdate = () => {
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
        ) * 100
      );
  }
};

/* =========================
   MEXER NA BARRA
========================= */

$("#seek").oninput =
  (event) => {
    if (!audio.duration) {
      return;
    }

    const percentage =
      Number(
        event.target.value
      );

    audio.currentTime =
      (
        percentage /
        100
      ) *
      audio.duration;
  };

/* =========================
   VOLUME
========================= */

audio.volume = 0.85;

$("#volume").oninput =
  (event) => {
    audio.volume =
      Number(
        event.target.value
      );
  };

/* =========================
   CATEGORIAS
========================= */

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
          (otherButton) => {
            otherButton
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

/* =========================
   BUSCA
========================= */

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

          const text = `
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

/* =========================
   TOCAR TUDO
========================= */

$("#playAll").onclick =
  () => {

    const musicTracks =
      filteredTracks.filter(
        (track) =>
          track.type ===
          "music"
      );

    if (!musicTracks.length) {
      return;
    }

    queue =
      musicTracks;

    currentIndex = 0;

    playById(
      musicTracks[0].id
    );
  };

/* =========================
   BOTÃO HERO
========================= */

$("#heroPlay").onclick =
  () => {

    const firstTrack =
      getFirstMusic();

    if (firstTrack) {
      playById(
        firstTrack.id
      );
    }
  };

/* =========================
   ALEATÓRIO HERO
========================= */

$("#heroShuffle").onclick =
  () => {

    const randomTrack =
      getRandomMusic();

    if (randomTrack) {
      playById(
        randomTrack.id
      );
    }
  };

/* =========================
   MEDIA SESSION
========================= */

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
          "logo-play.png",

          sizes:
            "512x512"
        }
      ]
    });
}

audio.addEventListener(
  "play",
  updateMediaSession
);

if (
  "mediaSession" in navigator
) {

  navigator
    .mediaSession
    .setActionHandler(
      "play",
      () => {
        audio.play();
      }
    );

  navigator
    .mediaSession
    .setActionHandler(
      "pause",
      () => {
        audio.pause();
      }
    );

  navigator
    .mediaSession
    .setActionHandler(
      "nexttrack",
      nextTrack
    );

  navigator
    .mediaSession
    .setActionHandler(
      "previoustrack",
      previousTrack
    );
}

/* =========================
   CARREGAR CATÁLOGO
========================= */

async function loadCatalog() {
  try {

    const response =
      await fetch(
        `catalog.json?v=${Date.now()}`
      );

    if (!response.ok) {
      throw new Error(
        "Erro ao carregar catalog.json"
      );
    }

    const data =
      await response.json();

    tracks =
      data.tracks || [];

    renderCatalog(
      tracks
    );

  } catch (error) {

    console.error(
      error
    );

    $("#catalog").innerHTML =
      `
        <div class="empty">
          Não foi possível carregar o catálogo.
        </div>
      `;
  }
}

loadCatalog();
