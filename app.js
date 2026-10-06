/* =========================================================
   VEM COMIGO PLAY
   SITE PÚBLICO
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
   NORMALIZAR DADOS
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
   CATÁLOGO
========================================================= */

function renderCatalog(list) {

  filteredTracks =
    list;

  const catalog =
    $("#catalog");

  if (!catalog) {
    return;
  }

  if (!list.length) {

    catalog.innerHTML = `
      <div class="empty">
        Nenhuma música encontrada.
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

      const playButton =
        element.querySelector(
          ".playOne"
        );

      if (playButton) {

        playButton.onclick =
          () => {
            playById(id);
          };
      }

      const info =
        element.querySelector(
          ".info"
        );

      if (info) {

        info.onclick =
          () => {
            playById(id);
          };
      }

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

if ($("#play")) {

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
}

/* =========================================================
   CONTROLES
========================================================= */

if ($("#next")) {
  $("#next").onclick =
    nextTrack;
}

if ($("#prev")) {
  $("#prev").onclick =
    previousTrack;
}

audio.onended =
  nextTrack;

/* =========================================================
   PLAY / PAUSE
========================================================= */

audio.onplay = () => {

  if ($("#play")) {
    $("#play").textContent =
      "⏸";
  }
};

audio.onpause = () => {

  if ($("#play")) {
    $("#play").textContent =
      "▶";
  }
};

/* =========================================================
   DURAÇÃO
========================================================= */

audio.onloadedmetadata =
  () => {

    if ($("#dur")) {

      $("#dur").textContent =
        formatTime(
          audio.duration
        );
    }
  };

/* =========================================================
   PROGRESSO
========================================================= */

audio.ontimeupdate =
  () => {

    if ($("#cur")) {

      $("#cur").textContent =
        formatTime(
          audio.currentTime
        );
    }

    if (
      audio.duration &&
      $("#seek")
    ) {

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

if ($("#seek")) {

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
}

/* =========================================================
   VOLUME
========================================================= */

audio.volume =
  0.85;

if ($("#volume")) {

  $("#volume").oninput =
    (event) => {

      audio.volume =
        Number(
          event.target.value
        );
    };
}

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

        renderAlbums();

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

if ($("#searchToggle")) {

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
}

if ($("#searchInput")) {

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
}

/* =========================================================
   TOCAR TUDO
========================================================= */

if ($("#playAll")) {

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
}

/* =========================================================
   HERO
========================================================= */

if ($("#heroPlay")) {

  $("#heroPlay").onclick =
    () => {

      const first =
        firstMusic();

      if (first) {
        playById(first.id);
      }
    };
}

if ($("#heroShuffle")) {

  $("#heroShuffle").onclick =
    () => {

      const random =
        randomMusic();

      if (random) {
        playById(random.id);
      }
    };
}

/* =========================================================
   CAPA DO ARTISTA
========================================================= */

function getArtistCover(
  artistName
) {

  const track =
    tracks.find(
      (track) =>
        track.artist ===
          artistName &&
        track.cover
    );

  return track
    ? track.cover
    : "logo-play.png";
}

/* =========================================================
   ARTISTAS
========================================================= */

function renderArtists() {

  const container =
    $("#artistsGrid");

  if (!container) {
    return;
  }

  const artists =
    [
      ...new Set(
        tracks
          .filter(
            (track) =>
              track.type !==
              "podcast"
          )
          .map(
            (track) =>
              track.artist
          )
      )
    ];

  if (!artists.length) {

    container.innerHTML = `
      <div class="empty">
        Nenhum artista publicado.
      </div>
    `;

    return;
  }

  container.innerHTML =
    artists
      .map((artist) => {

        const artistTracks =
          tracks.filter(
            (track) =>
              track.artist ===
                artist &&
              track.type !==
                "podcast"
          );

        const albums =
          new Set(
            artistTracks.map(
              (track) =>
                track.album
            )
          );

        return `
          <article
            class="artist-card"
            data-artist="${artist}"
          >

            <div
              class="artist-cover"
            >

              <img
                src="${getArtistCover(artist)}"
                alt="${artist}"
                onerror="this.src='logo-play.png'"
              >

            </div>

            <div
              class="artist-info"
            >

              <strong>
                ${artist}
              </strong>

              <span>
                ${albums.size}
                ${
                  albums.size === 1
                    ? "álbum"
                    : "álbuns"
                }
              </span>

            </div>

          </article>
        `;
      })
      .join("");

  document
    .querySelectorAll(
      ".artist-card"
    )
    .forEach((card) => {

      card.onclick = () => {

        const artist =
          card.dataset.artist;

        const artistTracks =
          tracks.filter(
            (track) =>
              track.artist ===
              artist
          );

        renderCatalog(
          artistTracks
        );

        renderAlbums(
          artist
        );

        const albums =
          $("#albumsGrid");

        if (albums) {

          albums.scrollIntoView({
            behavior:
              "smooth",

            block:
              "start"
          });
        }
      };
    });
}

/* =========================================================
   ÁLBUNS
========================================================= */

function renderAlbums(
  selectedArtist = ""
) {

  const container =
    $("#albumsGrid");

  if (!container) {
    return;
  }

  let sourceTracks =
    tracks.filter(
      (track) =>
        track.type !==
        "podcast"
    );

  if (selectedArtist) {

    sourceTracks =
      sourceTracks.filter(
        (track) =>
          track.artist ===
          selectedArtist
      );
  }

  const albumMap =
    new Map();

  sourceTracks
    .forEach((track) => {

      const key =
        `${track.artist}|||${track.album}`;

      if (
        !albumMap.has(key)
      ) {

        albumMap.set(
          key,
          {
            artist:
              track.artist,

            album:
              track.album,

            category:
              track.category,

            cover:
              track.cover ||
              "logo-play.png",

            tracks: []
          }
        );
      }

      albumMap
        .get(key)
        .tracks
        .push(track);
    });

  const albums =
    Array.from(
      albumMap.values()
    );

  if (!albums.length) {

    container.innerHTML = `
      <div class="empty">
        Nenhum álbum publicado.
      </div>
    `;

    return;
  }

  container.innerHTML =
    albums
      .map((album) => {

        return `
          <article
            class="album-card"
            data-artist="${album.artist}"
            data-album="${album.album}"
          >

            <div
              class="album-cover"
            >

              <img
                src="${album.cover}"
                alt="${album.album}"
                onerror="this.src='logo-play.png'"
              >

            </div>

            <div
              class="album-info"
            >

              <strong>
                ${album.album}
              </strong>

              <span>
                ${album.artist}
              </span>

              <span>
                ${album.tracks.length}
                ${
                  album.tracks.length === 1
                    ? "faixa"
                    : "faixas"
                }
              </span>

            </div>

          </article>
        `;
      })
      .join("");

  document
    .querySelectorAll(
      ".album-card"
    )
    .forEach((card) => {

      card.onclick = () => {

        document
          .querySelectorAll(
            ".album-card"
          )
          .forEach(
            (other) =>
              other
                .classList
                .remove("active")
          );

        card
          .classList
          .add("active");

        const artist =
          card.dataset.artist;

        const album =
          card.dataset.album;

        const albumTracks =
          tracks.filter(
            (track) =>
              track.artist ===
                artist &&
              track.album ===
                album
          );

        renderCatalog(
          albumTracks
        );

        const catalog =
          $("#catalog");

        if (catalog) {

          catalog.scrollIntoView({
            behavior:
              "smooth",

            block:
              "start"
          });
        }
      };
    });
}

/* =========================================================
   MEDIA SESSION
========================================================= */

function updateMediaSession() {

  if (
    !currentTrack ||
    !(
      "mediaSession"
      in navigator
    )
  ) {
    return;
  }

  navigator
    .mediaSession
    .metadata =
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
  "mediaSession"
  in navigator
) {

  navigator
    .mediaSession
    .setActionHandler(
      "play",
      () =>
        audio.play()
    );

  navigator
    .mediaSession
    .setActionHandler(
      "pause",
      () =>
        audio.pause()
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

/* =========================================================
   CARREGAR CATÁLOGO
========================================================= */

async function loadCatalog() {

  const catalog =
    $("#catalog");

  if (catalog) {

    catalog.innerHTML = `
      <div class="empty">
        Carregando músicas...
      </div>
    `;
  }

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

    renderArtists();

    renderAlbums();

    renderCatalog(
      tracks
    );

  } catch (error) {

    console.error(
      error
    );

    if (catalog) {

      catalog.innerHTML = `
        <div class="empty">
          Não foi possível carregar o catálogo.
        </div>
      `;
    }
  }
}

/* =========================================================
   INICIAR
========================================================= */

loadCatalog();
