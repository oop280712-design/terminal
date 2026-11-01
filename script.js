// เก็บข้อมูลหลายๆ Tab
let tabs = [];
let activeTabId = null;
let tabCounter = 1;

const tabsContainer = document.getElementById('tabs-container');

// สร้าง Tab ใหม่
function createNewTab(customName = null) {
  const tabId = 'tab_' + Date.now();
  const tabName = customName || `session ~ ${tabCounter++}`;

  // สร้าง Element Terminal Div ซ่อนไว้ก่อน
  const termDiv = document.createElement('div');
  termDiv.style.width = '100%';
  termDiv.style.height = '100%';
  document.getElementById('terminal').appendChild(termDiv);

  // สร้าง Xterm Instance
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

  // ข้อความต้อนรับจำลอง Linux Environment
  term.writeln('\x1b[1;32mWelcome to Termux Web Environment (Linux 6.1)\x1b[0m');
  term.writeln("Type 'help' for available commands.\r\n");
  const promptText = '\x1b[1;34m~ $\x1b[0m ';
  term.write(promptText);

  let currentInput = '';
  let history = JSON.parse(localStorage.getItem('termux_history') || '[]');
  let historyIndex = history.length;

  // ดักจับปุ่มพิมพ์
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

  // บันทึก Tab ลง Array
  tabs.push({ id: tabId, name: tabName, term, fitAddon, div: termDiv });
  renderTabs();
  switchTab(tabId);
}

// สลับ Tab
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

// ปิด Tab ปัจจุบัน
function closeActiveTab() {
  if (tabs.length <= 1) return; // อย่าปิดหมด ให้เหลืออย่างน้อย 1 Tab
  const index = tabs.findIndex(t => t.id === activeTabId);
  if (index !== -1) {
    tabs[index].div.remove();
    tabs.splice(index, 1);
    switchTab(tabs[tabs.length - 1].id);
  }
}

// วาด UI แถบ Tab ด้านบน
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

// จัดการคำสั่ง Linux จำลอง
function handleCommand(term, cmd) {
  if (!cmd) return;
  const parts = cmd.split(' ');
  switch (parts[0].toLowerCase()) {
    case 'help':
      term.writeln('Commands: uname, pkg update, python, clear, exit');
      break;
    case 'uname':
      term.writeln('Linux termux-web 6.1.0-armv7l Android Terminal');
      break;
    case 'pkg':
      term.writeln('Reading package lists... Done');
      term.writeln('Building dependency tree... Done');
      term.writeln('All packages are up to date.');
      break;
    case 'python':
      term.writeln('Python 3.11.2 (main, Jan 2026)');
      term.writeln('Type "exit()" to leave.');
      break;
    case 'clear':
      term.clear();
      break;
    default:
      term.writeln(`bash: ${cmd}: command not found`);
  }
}

// ปุ่มกดเพิ่ม/ลบ Tab ด้านบน
document.getElementById('add-tab-btn').onclick = () => createNewTab();
document.getElementById('close-tab-btn').onclick = () => closeActiveTab();

// ปุ่ม 3 ขีด (Menu) จำลองเปิดเมนู
document.getElementById('menu-btn').onclick = () => {
  const activeT = tabs.find(t => t.id === activeTabId);
  if (activeT) {
    activeT.term.writeln('\n[Termux Menu]: 1. New Session  2. Kill Process  3. Settings');
  }
};

// เชื่อมการทำงานของแถบปุ่มลัดด้านล่าง (Extra Keys) ให้ส่งค่าเข้า Terminal Active
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
    else if (key === 'CTRL') activeT.term.writeln('^[Ctrl mode toggled]');
    else if (key === 'ALT') activeT.term.writeln('^[Alt mode toggled]');
    else {
      activeT.term.writeln(`[Key: ${key}]`);
    }
  };
});

// เริ่มต้นเปิดเว็บมาให้มี 1 Tab แรกทันที
createNewTab();
