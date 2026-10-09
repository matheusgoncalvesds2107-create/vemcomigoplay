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
            coverPath
        });


        setStatus(
          "✅ Música publicada.",
          "ok"
        );


        $("#musicForm")
          .reset();


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
