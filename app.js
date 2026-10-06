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

let currentAlbumTracks = [];
let currentAlbum = null;

/* =========================================================
   UTILIDADES
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
   NORMALIZAR DADOS DO SUPABASE
========================================================= */

function normalizeTrack(track) {
  return {
    id: track.id,

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
   ESCAPAR TEXTO
========================================================= */

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   CATÁLOGO PRINCIPAL
========================================================= */

function renderCatalog(list) {
  filteredTracks = list;

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
                alt="${escapeHtml(track.title)}"
                onerror="this.src='logo-play.png'"
              >

            </div>

            <div class="info">

              <strong>
                ${escapeHtml(track.title)}
              </strong>

              <span>
                ${escapeHtml(track.artist)}
                •
                ${escapeHtml(track.album || track.category)}
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

  bindTrackButtons(
    catalog
  );
}

/* =========================================================
   LIGAR BOTÕES DAS FAIXAS
========================================================= */

function bindTrackButtons(container) {
  container
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
          (event) => {
            event.stopPropagation();

            playById(id);
          };
      }

      const info =
        element.querySelector(
          ".info"
        );

      if (info) {
        info.onclick = () => {
          playById(id);
        };
      }
    });
}

/* =========================================================
   PLAYER
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

  /* Se estamos dentro de um álbum,
     mantém a fila daquele álbum */
  if (
    currentAlbumTracks.length &&
    currentAlbumTracks.some(
      (track) =>
        String(track.id) ===
        String(id)
    )
  ) {
    queue =
      [...currentAlbumTracks];

  } else if (
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

  if ($("#kind")) {
    $("#kind").textContent =
      currentTrack.type ===
      "podcast"
        ? "PODCAST"
        : "LOUVOR";
  }

  if ($("#title")) {
    $("#title").textContent =
      currentTrack.title;
  }

  if ($("#artist")) {
    $("#artist").textContent =
      `${currentTrack.artist} • ${currentTrack.album || ""}`;
  }

  if ($("#cover")) {
    $("#cover").src =
      currentTrack.cover ||
      "logo-play.png";
  }

  if (!currentTrack.audioUrl) {
    if ($("#artist")) {
      $("#artist").textContent =
        `${currentTrack.artist} • áudio indisponível`;
    }

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
   PRÓXIMA / ANTERIOR
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
   PRIMEIRA / ALEATÓRIO
========================================================= */

function firstMusic() {
  return tracks.find(
    (track) =>
      track.type !==
      "podcast"
  );
}

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
        playById(
          first.id
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
   DURAÇÃO E PROGRESSO
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
          ) * 100
        );
    }
  };

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

      closeAlbumView();

      renderCatalog(
        filtered
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

      closeAlbumView();

      if (
        category === "Todos"
      ) {
        renderArtists();

        renderAlbums();

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

      renderAlbumsByTracks(
        filtered
      );
    };
  });

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

      currentAlbumTracks = [];

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
        currentAlbumTracks = [];

        playById(
          first.id
        );
      }
    };
}

if ($("#heroShuffle")) {
  $("#heroShuffle").onclick =
    () => {
      const random =
        randomMusic();

      if (random) {
        currentAlbumTracks = [];

        playById(
          random.id
        );
      }
    };
}

/* =========================================================
   ARTISTAS
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
            data-artist="${escapeHtml(artist)}"
          >

            <div
              class="artist-cover"
            >

              <img
                src="${getArtistCover(artist)}"
                alt="${escapeHtml(artist)}"
                onerror="this.src='logo-play.png'"
              >

            </div>

            <div
              class="artist-info"
            >

              <strong>
                ${escapeHtml(artist)}
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

        renderAlbums(
          artist
        );

        renderCatalog(
          tracks.filter(
            (track) =>
              track.artist ===
              artist
          )
        );

        const albums =
          $("#albumsSection");

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

function makeAlbumMap(
  sourceTracks
) {
  const albumMap =
    new Map();

  sourceTracks
    .filter(
      (track) =>
        track.type !==
        "podcast"
    )
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

  return Array.from(
    albumMap.values()
  );
}

function renderAlbums(
  selectedArtist = ""
) {
  let sourceTracks =
    tracks;

  if (selectedArtist) {
    sourceTracks =
      tracks.filter(
        (track) =>
          track.artist ===
          selectedArtist
      );
  }

  renderAlbumsByTracks(
    sourceTracks
  );
}

function renderAlbumsByTracks(
  sourceTracks
) {
  const container =
    $("#albumsGrid");

  if (!container) {
    return;
  }

  const albums =
    makeAlbumMap(
      sourceTracks
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
            data-artist="${escapeHtml(album.artist)}"
            data-album="${escapeHtml(album.album)}"
          >

            <div
              class="album-cover"
            >

              <img
                src="${album.cover}"
                alt="${escapeHtml(album.album)}"
                onerror="this.src='logo-play.png'"
              >

            </div>

            <div
              class="album-info"
            >

              <strong>
                ${escapeHtml(album.album)}
              </strong>

              <span>
                ${escapeHtml(album.artist)}
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
        openAlbumView(
          card.dataset.artist,
          card.dataset.album
        );
      };
    });
}

/* =========================================================
   ABRIR TELA DO ÁLBUM
========================================================= */

function openAlbumView(
  artistName,
  albumName
) {
  const albumTracks =
    tracks.filter(
      (track) =>
        track.artist ===
          artistName &&
        track.album ===
          albumName
    );

  if (!albumTracks.length) {
    return;
  }

  currentAlbumTracks =
    [...albumTracks];

  currentAlbum = {
    artist:
      artistName,

    album:
      albumName,

    cover:
      albumTracks[0].cover ||
      "logo-play.png",

    category:
      albumTracks[0].category,

    tracks:
      albumTracks
  };

  if ($("#albumViewCover")) {
    $("#albumViewCover").src =
      currentAlbum.cover;
  }

  if ($("#albumViewTitle")) {
    $("#albumViewTitle").textContent =
      currentAlbum.album;
  }

  if ($("#albumViewArtist")) {
    $("#albumViewArtist").textContent =
      currentAlbum.artist;
  }

  if ($("#albumViewMeta")) {
    $("#albumViewMeta").textContent =
      `${currentAlbum.category} • ${currentAlbumTracks.length} ${
        currentAlbumTracks.length === 1
          ? "faixa"
          : "faixas"
      }`;
  }

  renderAlbumTracks(
    currentAlbumTracks
  );

  hideHomeSections();

  $("#albumView")
    .classList
    .remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================================================
   FAIXAS DA TELA DO ÁLBUM
========================================================= */

function renderAlbumTracks(list) {
  const container =
    $("#albumTracks");

  if (!container) {
    return;
  }

  container.innerHTML =
    list
      .map((track, index) => {
        return `
          <article
            class="track"
            data-id="${track.id}"
          >

            <div class="art">

              <img
                src="${track.cover}"
                alt="${escapeHtml(track.title)}"
                onerror="this.src='logo-play.png'"
              >

            </div>

            <div class="info">

              <strong>
                ${index + 1}. ${escapeHtml(track.title)}
              </strong>

              <span>
                ${escapeHtml(track.artist)}
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
                      target="_blank"
                      download
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

  bindTrackButtons(
    container
  );
}

/* =========================================================
   ESCONDER / MOSTRAR HOME
========================================================= */

function hideHomeSections() {
  [
    "#homeHero",
    "#artistsSection",
    "#albumsSection",
    "#featuredSection"
  ]
    .forEach((selector) => {
      const element =
        $(selector);

      if (element) {
        element
          .classList
          .add("hidden");
      }
    });
}

function showHomeSections() {
  [
    "#homeHero",
    "#artistsSection",
    "#albumsSection",
    "#featuredSection"
  ]
    .forEach((selector) => {
      const element =
        $(selector);

      if (element) {
        element
          .classList
          .remove("hidden");
      }
    });
}

/* =========================================================
   FECHAR ÁLBUM
========================================================= */

function closeAlbumView() {
  if ($("#albumView")) {
    $("#albumView")
      .classList
      .add("hidden");
  }

  showHomeSections();

  currentAlbumTracks =
    [];

  currentAlbum =
    null;
}

if ($("#backAlbum")) {
  $("#backAlbum").onclick =
    () => {
      closeAlbumView();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    };
}

/* =========================================================
   TOCAR ÁLBUM
========================================================= */

if ($("#albumPlay")) {
  $("#albumPlay").onclick =
    () => {
      if (
        !currentAlbumTracks.length
      ) {
        return;
      }

      queue =
        [...currentAlbumTracks];

      currentIndex =
        0;

      playById(
        queue[0].id
      );
    };
}

/* =========================================================
   ÁLBUM ALEATÓRIO
========================================================= */

if ($("#albumShuffle")) {
  $("#albumShuffle").onclick =
    () => {
      if (
        !currentAlbumTracks.length
      ) {
        return;
      }

      const randomIndex =
        Math.floor(
          Math.random() *
          currentAlbumTracks.length
        );

      queue =
        [...currentAlbumTracks];

      currentIndex =
        randomIndex;

      playById(
        queue[randomIndex].id
      );
    };
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
  navigator.mediaSession
    .setActionHandler(
      "play",
      () =>
        audio.play()
    );

  navigator.mediaSession
    .setActionHandler(
      "pause",
      () =>
        audio.pause()
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
   CARREGAR MÚSICAS DO SUPABASE
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
        `${SUPABASE_URL}/rest/v1/tracks?select=*&order=created_at.asc`,
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
