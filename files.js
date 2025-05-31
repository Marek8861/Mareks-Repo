const owner = 'Marek8861';        
const repo = 'Mareks-Repo';       
const branch = 'main';            

const fileTreeContainer = document.getElementById('file-tree');
const breadcrumbContainer = document.getElementById('breadcrumb');

// Pobierz parametr ?path z URL
function getPathFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('path') || '';
}

// Ustaw parametr ?path w URL bez przeładowania
function setPathToURL(path) {
  const newURL = `${window.location.pathname}?path=${encodeURIComponent(path)}`;
  history.pushState(null, '', newURL);
}

// Zbuduj breadcrumb (ścieżkę folderów)
function buildBreadcrumb(path) {
  breadcrumbContainer.innerHTML = '';
  const parts = path.split('/').filter(Boolean);
  const fragment = document.createDocumentFragment();

  // Root (główna strona)
  const rootLink = document.createElement('a');
  rootLink.href = '?path=';
  rootLink.textContent = 'root';
  rootLink.addEventListener('click', e => {
    e.preventDefault();
    loadPath('');
    setPathToURL('');
  });
  fragment.appendChild(rootLink);

  if (parts.length > 0) {
    // Dodaj separator po root
    fragment.appendChild(document.createTextNode(' / '));
    
    // Dodaj '...' link do katalogu nadrzędnego
    const upLink = document.createElement('a');
    upLink.href = '#';
    upLink.textContent = '...';
    upLink.title = 'Folder nadrzędny';
    upLink.style.fontWeight = 'bold';
    upLink.addEventListener('click', e => {
      e.preventDefault();
      const parentPath = parts.slice(0, -1).join('/');
      loadPath(parentPath);
      setPathToURL(parentPath);
    });
    fragment.appendChild(upLink);

    // Kolejny separator
    fragment.appendChild(document.createTextNode(' / '));
  }

  let accumulatedPath = '';
  parts.forEach((part, index) => {
    if (index > 0) {
      fragment.appendChild(document.createTextNode(' / '));
    }
    accumulatedPath += (accumulatedPath ? '/' : '') + part;
    const link = document.createElement('a');
    link.href = `?path=${encodeURIComponent(accumulatedPath)}`;
    link.textContent = part;
    link.addEventListener('click', e => {
      e.preventDefault();
      loadPath(accumulatedPath);
      setPathToURL(accumulatedPath);
    });
    fragment.appendChild(link);
  });

  breadcrumbContainer.appendChild(fragment);
}

async function fetchContents(path = '') {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const res = await fetch(url);
  if (!res.ok) {
    fileTreeContainer.innerHTML = `<p>Błąd pobierania zawartości repozytorium: ${res.status}</p>`;
    return [];
  }
  const data = await res.json();
  return data;
}

function createFileNode(file) {
  const div = document.createElement('div');
  div.className = 'node file';
  const a = document.createElement('a');
  a.href = file.download_url || file.html_url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = file.name;
  div.appendChild(a);
  return div;
}

function createFolderNode(folder) {
  const div = document.createElement('div');
  div.className = 'node folder';
  div.textContent = folder.name;
  div.addEventListener('click', () => {
    loadPath(folder.path);
    setPathToURL(folder.path);
  });
  return div;
}

async function loadPath(path) {
  buildBreadcrumb(path);
  fileTreeContainer.innerHTML = 'Ładowanie...';
  const contents = await fetchContents(path);
  fileTreeContainer.innerHTML = '';

  if (!contents.length) {
    fileTreeContainer.textContent = 'Folder jest pusty.';
    return;
  }

  // Jeśli nie root, dodaj element '...' do folderu nadrzędnego
  if (path !== '') {
    const backFolder = document.createElement('div');
    backFolder.className = 'node folder back';
    backFolder.textContent = '...';
    backFolder.title = 'Folder nadrzędny';
    backFolder.addEventListener('click', () => {
      const parentPath = path.split('/').slice(0, -1).join('/');
      loadPath(parentPath);
      setPathToURL(parentPath);
    });
    fileTreeContainer.appendChild(backFolder);
  }

  contents.sort((a, b) => {
    // Foldery na górze
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'dir' ? -1 : 1;
  });

  contents.forEach(item => {
    if (item.type === 'dir') {
      fileTreeContainer.appendChild(createFolderNode(item));
    } else if (item.type === 'file') {
      fileTreeContainer.appendChild(createFileNode(item));
    }
  });
}

// Obsługa nawigacji wstecz/przód w przeglądarce
window.addEventListener('popstate', () => {
  const path = getPathFromURL();
  loadPath(path);
});

// Start
loadPath(getPathFromURL());
