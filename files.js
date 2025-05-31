const owner = 'Marek8861';        
const repo = 'Mareks-Repo';       
const branch = 'main';            

const fileTreeContainer = document.getElementById('file-tree');
const breadcrumbContainer = document.getElementById('breadcrumb');

// Pobierz parametr ?path z URL
function getPathFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('path') || 'repo';
}

// Ustaw parametr ?path w URL bez przeładowania
function setPathToURL(path) {
  const newURL = `${window.location.pathname}?path=${encodeURIComponent(path)}`;
  history.pushState(null, '', newURL);
}

// Buduje breadcrumb (ścieżkę folderów)
function buildBreadcrumb(path) {
  breadcrumbContainer.innerHTML = '';
  const parts = path.split('/').filter(Boolean);

  const fragment = document.createDocumentFragment();

  // Root
  const rootLink = document.createElement('a');
  rootLink.href = '?path=repo';
  rootLink.textContent = 'root';
  rootLink.addEventListener('click', e => {
    e.preventDefault();
    loadPath('repo');
    setPathToURL('repo');
  });
  fragment.appendChild(rootLink);

  let accumulatedPath = 'repo';
  parts.forEach((part, index) => {
    const separator = document.createTextNode(' / ');
    fragment.appendChild(separator);

    accumulatedPath += `/${part}`;
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

async function fetchContents(path = 'repo') {
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

  // Link do podglądu na GitHub
  const fileNameLink = document.createElement('a');
  fileNameLink.href = file.html_url;
  fileNameLink.target = '_blank';
  fileNameLink.rel = 'noopener noreferrer';
  fileNameLink.textContent = file.name;
  div.appendChild(fileNameLink);

  // Ikona "pokaż kod"
  const viewIcon = document.createElement('a');
  viewIcon.href = file.html_url;
  viewIcon.target = '_blank';
  viewIcon.rel = 'noopener noreferrer';
  viewIcon.className = 'icon view-icon';
  viewIcon.title = 'Pokaż kod';
  viewIcon.innerHTML = '<i class="fas fa-eye"></i>';
  div.appendChild(viewIcon);

  // Ikona "pobierz"
  const downloadIcon = document.createElement('a');
  downloadIcon.href = file.download_url;
  downloadIcon.download = file.name;
  downloadIcon.className = 'icon download-icon';
  downloadIcon.title = 'Pobierz plik';
  downloadIcon.innerHTML = '<i class="fas fa-download"></i>';
  div.appendChild(downloadIcon);

  return div;
}

function createFolderNode(folder) {
  const div = document.createElement('div');
  div.className = 'node folder';

  const folderLabel = document.createElement('span');
  folderLabel.textContent = folder.name;
  folderLabel.className = 'folder-label';

  div.appendChild(folderLabel);

  div.addEventListener('click', () => {
    loadPath(folder.path);
    setPathToURL(folder.path);
  });

  return div;
}

async function loadPath(path) {
  buildBreadcrumb(path);
  const parts = path.split('/').filter(Boolean);
  if (parts.length > 10) {
    fileTreeContainer.innerHTML = '<p>Za głęboka ścieżka, aby uniknąć zapętlenia.</p>';
    return;
  }
  fileTreeContainer.innerHTML = 'Ładowanie...';
  const contents = await fetchContents(path);
  fileTreeContainer.innerHTML = '';

  if (!contents.length) {
    fileTreeContainer.textContent = 'Folder jest pusty.';
    return;
  }

  contents.sort((a, b) => {
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

window.addEventListener('popstate', () => {
  const path = getPathFromURL();
  loadPath(path);
});

// Start
loadPath(getPathFromURL());
