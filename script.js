const messagesPath = 'messages/';
const sigPath = 'signers/';

// Extract line by key (e.g., ID: ChM-1)
function extractField(lines, key) {
  const line = lines.find(l => l.startsWith(`${key}:`));
  return line ? line.split(':').slice(1).join(':').trim() : null;
}

// Load message, compute hash, fetch SIG1 + SIG3
async function loadMessage(filename) {
  const messageText = await fetch(`${messagesPath}${filename}?t=${Date.now()}`).then(res => res.text());
  const lines = messageText.split('\n');

  const info = {
    id: extractField(lines, 'ID'),
    utc: extractField(lines, 'UTC'),
    chmHash: extractField(lines, 'ChM-HASH'),
    cHash: extractField(lines, 'C-HASH'),
    vCheck: extractField(lines, 'V-CHECK'),
    fullText: messageText
  };

  // Compute file hash
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(messageText));
  const computedHash = [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
  info.computedHash = computedHash;

  // Load SIG1 (ChM-HASH signature)
  try {
    const sig1Res = await fetch(`${sigPath}SIG1/SIG1-${filename}.sig?t=${Date.now()}`);
    if (!sig1Res.ok) throw new Error('SIG1 not found');
    const sig1 = await sig1Res.text();
    info.sig1 = sig1.trim();
    info.sig1Valid = !!info.sig1;
  } catch {
    info.sig1 = null;
    info.sig1Valid = false;
  }

  // Load SIG3 (file hash match)
  try {
    const sig3Res = await fetch(`${sigPath}SIG3/SIG3-${filename}.sig?t=${Date.now()}`);
    if (!sig3Res.ok) throw new Error('SIG3 not found');
    const sig3 = await sig3Res.text();
    info.sig3 = sig3.trim();
    info.sig3Valid = info.sig3 === computedHash;
  } catch {
    info.sig3 = null;
    info.sig3Valid = false;
  }

  return info;
}

// Update UI when a message is selected
async function updateUI(filename) {
  const info = await loadMessage(filename);

  const lines = info.fullText.split('\n');
  const msgIndex = lines.findIndex(line => line.trim() === 'Message:');
  const messageBody = msgIndex !== -1 ? lines.slice(msgIndex + 1).join('\n') : '(Message not found)';

  const footerLine = lines.find(line => line.includes(`ChM-${info.id.split('-')[1]}:`));
  const version = footerLine?.split(':')[1] || 'v?';

  const isMessageValid = info.vCheck.includes('✅');
  const allValid = isMessageValid && info.sig1Valid && info.sig3Valid;

  // Update header status
  document.getElementById('version-label').textContent = version;
  document.getElementById('status-icon').textContent = allValid ? '✅' : '❌';

  // Update quorum info
  const quorumTitle = document.getElementById('quorum-title');
  quorumTitle.textContent = `Quorum ${version} verification`;

  const quorumBox = document.getElementById('quorum-info');
  quorumBox.innerHTML = `
    <pre>
SIG1 signature: ${info.sig1 ? `${info.sig1} ${info.sig1Valid ? '🆗' : '❌'}` : '❌'}
SIG2 signature: –
SIG3 signature: ${info.sig3 ? `${info.sig3} ${info.sig3Valid ? '🆗' : '❌'}` : '❌'}
    </pre>
  `;

  // Update message info
  const messageTitle = document.getElementById('message-title');
  messageTitle.textContent = `Sovern Message Signature ${isMessageValid ? '🆗' : '❌'}`;

  const infoBox = document.getElementById('message-info');
  infoBox.innerHTML = `
    <pre>
ID: ${info.id}
UTC: ${info.utc}
ChM-HASH: ${info.chmHash}
C-HASH: ${info.cHash}
V-CHECK: ${info.vCheck}
FILE-HASH: ${info.computedHash}

——— Canonical Message ———
${messageBody}
    </pre>
  `;
}

// Populate dropdown
async function listMessages() {
  const select = document.getElementById('message-select');

  try {
    const res = await fetch(`messages/index.json?t=${Date.now()}`);
    const files = await res.json();

    files.forEach(file => {
      const option = document.createElement('option');
      option.value = file;
      option.textContent = file;
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      if (select.value) updateUI(select.value);
    });
  } catch (err) {
    console.error('Error loading messages index:', err);
    const option = document.createElement('option');
    option.disabled = true;
    option.textContent = '⚠️ Failed to load index.json';
    select.appendChild(option);
  }
}

listMessages();
