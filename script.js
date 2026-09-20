// 1. สร้าง Instance ของ Xterm.js พร้อมตั้งค่าธีมและฟอนต์
const term = new Terminal({
  cursorBlink: true,
  theme: {
    background: '#161b22',
    foreground: '#f0f6fc',
    cursor: '#58a6ff',
    selectionBackground: '#388bfd4d'
  },
  fontSize: 14,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace'
});

// 2. เชื่อมต่อ Xterm เข้ากับ HTML Element (<div id="terminal"></div>)
term.open(document.getElementById('terminal'));

// 3. กำหนดค่าสี ANSI Escape Codes สำหรับตกแต่งข้อความ
const COLOR = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  GREEN: '\x1b[1;32m',
  BLUE: '\x1b[1;34m',
  YELLOW: '\x1b[1;33m',
  CYAN: '\x1b[1;36m',
  RED: '\x1b[1;31m'
};

// ข้อความเริ่มต้นหน้าบรรทัด (Prompt)
const promptText = `${COLOR.GREEN}guest@github${COLOR.RESET}:${COLOR.BLUE}~${COLOR.RESET}$ `;
let currentInput = '';

// 4. แสดงข้อความต้อนรับเมื่อโหลดหน้าเว็บ
term.writeln(`${COLOR.BRIGHT}${COLOR.CYAN}============================================${COLOR.RESET}`);
term.writeln(`${COLOR.YELLOW} Welcome to Xterm.js Web Terminal on GitHub!${COLOR.RESET}`);
term.writeln(` Type ${COLOR.GREEN}'help'${COLOR.RESET} to see available commands.`);
term.writeln(`${COLOR.BRIGHT}${COLOR.CYAN}============================================${COLOR.RESET}\r\n`);
term.write(promptText);

// 5. ดักจับการกดแป้นพิมพ์ของผู้ใช้
term.onData(e => {
  switch (e) {
    case '\r': // ปุ่ม Enter
      term.writeln('');
      handleCommand(currentInput.trim());
      currentInput = '';
      term.write(promptText);
      break;

    case '\u007F': // ปุ่ม Backspace
      if (currentInput.length > 0) {
        currentInput = currentInput.slice(0, -1);
        term.write('\b \b'); // ลบตัวอักษรออกจากหน้าจอ
      }
      break;

    case '\u0003': // Ctrl+C (ยกเลิกคำสั่ง)
      term.writeln('^C');
      currentInput = '';
      term.write(promptText);
      break;

    default: // ตัวอักษรทั่วไป
      if (e >= ' ' && e <= '~') {
        currentInput += e;
        term.write(e);
      }
  }
});

// 6. ฟังก์ชันจัดการคำสั่งต่างๆ
function handleCommand(cmd) {
  if (!cmd) return;

  const args = cmd.split(' ');
  const mainCommand = args[0].toLowerCase();

  switch (mainCommand) {
    case 'help':
      term.writeln(`${COLOR.BRIGHT}Available Commands:${COLOR.RESET}`);
      term.writeln(`  ${COLOR.YELLOW}about${COLOR.RESET}     - Show information about this terminal`);
      term.writeln(`  ${COLOR.YELLOW}skills${COLOR.RESET}    - List technical skills`);
      term.writeln(`  ${COLOR.YELLOW}echo${COLOR.RESET}      - Print text (e.g. echo hello)`);
      term.writeln(`  ${COLOR.YELLOW}clear${COLOR.RESET}     - Clear the terminal screen`);
      term.writeln(`  ${COLOR.YELLOW}date${COLOR.RESET}      - Display current date and time`);
      break;

    case 'about':
      term.writeln('Web Terminal built with Xterm.js and hosted on GitHub Pages.');
      break;

    case 'skills':
      term.writeln(`${COLOR.GREEN}•${COLOR.RESET} JavaScript / Node.js`);
      term.writeln(`${COLOR.GREEN}•${COLOR.RESET} HTML5 / CSS3`);
      term.writeln(`${COLOR.GREEN}•${COLOR.RESET} Git / GitHub`);
      break;

    case 'echo':
      const message = args.slice(1).join(' ');
      term.writeln(message);
      break;

    case 'date':
      term.writeln(new Date().toString());
      break;

    case 'clear':
      term.clear();
      break;

    default:
      term.writeln(`${COLOR.RED}command not found:${COLOR.RESET} ${mainCommand}. Type ${COLOR.GREEN}'help'${COLOR.RESET} for options.`);
  }
}
