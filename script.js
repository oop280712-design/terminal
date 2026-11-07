let tabs = [];
let activeTabId = null;
let tabCounter = 1;

const tabsContainer = document.getElementById('tabs-container');
const fileManagerPanel = document.getElementById('file-manager');
const fileListContainer = document.getElementById('file-list-container');

// รายการไฟล์จำลองในเครื่อง (เก็บใน LocalStorage หรือค่าเริ่มต้น)
let userFiles = JSON.parse(localStorage.getItem('termux_files') || JSON.stringify([
  { name: 'index.html', type: 'file', size: '1.2 KB' },
  { name: 'style.css', type: 'file', size: '840 B' },
  { name: 'script.js', type: 'file', size: '3.4 KB' },
  { name: 'my-cloud-phone', type: 'folder', size: '4 items' }
]));

// สร้าง Tab ใหม่
function createNewTab(customName = null) {
  const tabId = 'tab_' + Date.now();
  const tabName = customName || `session ~ ${tabCounter++}`;

  const termDiv = document.createElement('div');
  termDiv.style.width = '100%';
  termDiv.style.height = '100%';
  document.getElementById('terminal').appendChild(termDiv);

  const term = new Terminal({
    cursorBlink: true,
    theme: {
      background: '#000000',
      foreground: '#00ff66',
      cursor: '#00ff66'
    },
    fontSize: 14,
    fontFamily: 'monospace'
  });

  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  term.open(termDiv);
  fitAddon.fit();

  term.writeln('\x1b[1;32mWelcome to Termux Web Environment (Linux 6.1)\x1b[0m');
  term.writeln("Type 'help', 'ls', or click the folder icon above to view files.\r\n");
  const promptText = '\x1b[1;34m~ $\x1b[0m ';
  term.write(promptText);

  let currentInput = '';
  let history = JSON.parse(localStorage.getItem('termux_history') || '[]');
  let historyIndex = history.length;

  term.onData(e => {
    switch (e) {
      case '\r':
        term.writeln('');
        const cmd = currentInput.trim();
        if (cmd) {
          history.push(cmd);
          localStorage.setItem('termux_history', JSON.stringify(history));
          historyIndex = history.length;
        }
        handleCommand(term, cmd);
        currentInput = '';
        term.write(promptText);
        break;
      case '\u007F':
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          term.write('\b \b');
        }
        break;
      case '\x1b[A': // ลูกศรขึ้น
        if (history.length > 0 && historyIndex > 0) {
          historyIndex--;
          clearLine(term, currentInput);
          currentInput = history[historyIndex];
          term.write(currentInput);
        }
        break;
      case '\x1b[B': // ลูกศรลง
        if (historyIndex < history.length - 1) {
          historyIndex++;
          clearLine(term, currentInput);
          currentInput = history[historyIndex];
          term.write(currentInput);
        } else if (historyIndex === history.length - 1) {
          historyIndex++;
          clearLine(term, currentInput);
        }
        break;
      default:
        if (e >= ' ' && e <= '~') {
          currentInput += e;
          term.write(e);
        }
    }
  });

  function clearLine(t, str) {
    while (str.length > 0) {
      t.write('\b \b');
      str = str.slice(0, -1);
    }
    currentInput = '';
  }

  tabs.push({ id: tabId, name: tabName, term, fitAddon, div: termDiv });
  renderTabs();
  switchTab(tabId);
}

function switchTab(tabId) {
  activeTabId = tabId;
  tabs.forEach(t => {
    if (t.id === tabId) {
      t.div.style.display = 'block';
      t.fitAddon.fit();
    } else {
      t.div.style.display = 'none';
    }
  });
  renderTabs();
}

function closeActiveTab() {
  if (tabs.length <= 1) return;
  const index = tabs.findIndex(t => t.id === activeTabId);
  if (index !== -1) {
    tabs[index].div.remove();
    tabs.splice(index, 1);
    switchTab(tabs[tabs.length - 1].id);
  }
}

function renderTabs() {
  tabsContainer.innerHTML = '';
  tabs.forEach(t => {
    const btn = document.createElement('div');
    btn.className = `tab-item ${t.id === activeTabId ? 'active' : ''}`;
    btn.innerText = t.name;
    btn.onclick = () => switchTab(t.id);
    tabsContainer.appendChild(btn);
  });
}

// ฟังก์ชันเปิดดูไฟล์ในเครื่อง (File Manager)
function openFileManager() {
  fileListContainer.innerHTML = '';
  userFiles.forEach(file => {
    const item = document.createElement('div');
    item.className = 'fm-item';
    item.innerHTML = `
      <span>${file.type === 'folder' ? '📁' : '📄'}</span>
      <div style="flex: 1;">
        <div style="color: #fff; font-weight: bold;">${file.name}</div>
        <div style="color: #888; font-size: 11px;">${file.size}</div>
      </div>
    `;
    item.onclick = () => {
      const activeT = tabs.find(t => t.id === activeTabId);
      if (activeT) {
        fileManagerPanel.style.display = 'none';
        activeT.term.writeln(`\nOpening ${file.name}...`);
        activeT.term.write('\x1b[1;34m~ $\x1b[0m ');
      }
    };
    fileListContainer.appendChild(item);
  });
  fileManagerPanel.style.display = 'flex';
}

// จัดการคำสั่ง Linux
function handleCommand(term, cmd) {
  if (!cmd) return;
  const parts = cmd.split(' ');
  switch (parts[0].toLowerCase()) {
    case 'help':
      term.writeln('Commands: ls, mkdir <dir>, touch <file>, clear, exit');
      break;
    case 'ls':
      userFiles.forEach(f => {
        term.writeln(f.type === 'folder' ? `\x1b[1;34m${f.name}/\x1b[0m` : f.name);
      });
      break;
    case 'mkdir':
      if (parts[1]) {
        userFiles.push({ name: parts[1], type: 'folder', size: '0 items' });
        localStorage.setItem('termux_files', JSON.stringify(userFiles));
        term.writeln(`Created directory: ${parts[1]}`);
      } else {
        term.writeln('mkdir: missing operand');
      }
      break;
    case 'touch':
      if (parts[1]) {
        userFiles.push({ name: parts[1], type: 'file', size: '0 B' });
        localStorage.setItem('termux_files', JSON.stringify(userFiles));
        term.writeln(`Created file: ${parts[1]}`);
      } else {
        term.writeln('touch: missing operand');
      }
      break;
    case 'clear':
      term.clear();
      break;
    default:
      term.writeln(`bash: ${cmd}: command not found`);
  }
}

// Event Listeners สำหรับปุ่มด้านบน
document.getElementById('add-tab-btn').onclick = () => createNewTab();
document.getElementById('close-tab-btn').onclick = () => closeActiveTab();
document.getElementById('files-btn').onclick = () => openFileManager();
document.getElementById('close-fm').onclick = () => { fileManagerPanel.style.display = 'none'; };

document.getElementById('menu-btn').onclick = () => {
  const activeT = tabs.find(t => t.id === activeTabId);
  if (activeT) {
    activeT.term.writeln('\n[Termux Menu]: 1. New Session  2. File Manager  3. Settings');
  }
};

// เชื่อมปุ่ม Extra Keys ด้านล่าง
document.querySelectorAll('.key-btn').forEach(button => {
  button.onclick = () => {
    const activeT = tabs.find(t => t.id === activeTabId);
    if (!activeT) return;
    const key = button.getAttribute('data-key');
    
    if (key === 'UP') activeT.term.onData('\x1b[A');
    else if (key === 'DOWN') activeT.term.onData('\x1b[B');
    else if (key === 'LEFT') activeT.term.onData('\x1b[D');
    else if (key === 'RIGHT') activeT.term.onData('\x1b[C');
    else if (key === 'ESC') activeT.term.onData('\x1b');
    else if (key === '/') activeT.term.onData('/');
    else if (key === '-') activeT.term.onData('-');
    else {
      activeT.term.writeln(`[Key: ${key}]`);
    }
  };
});

createNewTab();
