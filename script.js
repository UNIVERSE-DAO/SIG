const messagesPath = 'messages/';
const sigPath = 'signers/';

function extractField(lines, key) {
  const line = lines.find(l => l.startsWith(`${key}:`));
  return line ? line.split(':').slice(1).join(':').trim() : null;
}

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

  // Load SIG1
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

  // Load SIG2
  try {
    const sig2Res = await fetch(`${sigPath}SIG2/SIG2-${filename}.sig?t=${Date.now()}`);
    if (!sig2Res.ok) throw new Error('SIG2 not found');
    const sig2 = await sig2Res.text();
    info.sig2 = sig2.trim();
    info.sig2Valid = !!info.sig2;
  } catch {
    info.sig2 = null;
    info.sig2Valid = false;
  }

  // Load SIG3
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

async function updateUI(filename) {
  const info = await loadMessage(filename);

  const lines = info.fullText.split('\n');
  const msgIndex = lines.findIndex(line => line.trim() === 'Message:');
  const messageBody = msgIndex !== -1 ? lines.slice(msgIndex + 1).join('\n') : '(Message not found)';

  const footerLine = lines.find(line => line.includes(`ChM-${info.id.split('-')[1]}:`));
  const version = footerLine?.split(':')[1] || 'v?';

  const isMessageValid = info.vCheck.includes('✅');
  const validSignatures = [info.sig1Valid, info.sig2Valid, info.sig3Valid].filter(Boolean).length;
  const quorumMet = validSignatures >= 2;

  document.getElementById('version-label').textContent = version;
  document.getElementById('status-icon').textContent = quorumMet ? '✅' : '❌';

  document.getElementById('quorum-title').textContent = `Quorum ${version} verification`;
  document.getElementById('quorum-info').innerHTML = `
    <pre>
SIG1: ${info.sig1 ? `${info.sig1} ${info.sig1Valid ? '🆗' : '❌'}` : '❌'}
SIG2: ${info.sig2 ? `${info.sig2} ${info.sig2Valid ? '🆗' : '❌'}` : '❌'}
SIG3: ${info.sig3 ? `${info.sig3} ${info.sig3Valid ? '🆗' : '❌'}` : '❌'}
    </pre>
  `;

  document.getElementById('message-title').textContent = `Sovern Message Signature ${isMessageValid ? '🆗' : '❌'}`;
  document.getElementById('message-info').innerHTML = `
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

async function listMessages() {
  const select = document.getElementById('message-select');

  try {
    const res = await fetch(`${messagesPath}index.json?t=${Date.now()}`);
    const files = await res.json();

    files.forEach(file => {
      const option = document.createElement('option');
      option.value = file;
      option.textContent = file;
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      if (select.value) {
        updateUI(select.value);
      }
    });
  } catch (err) {
    console.error('⚠️ Failed to load messages/index.json:', err);
    const option = document.createElement('option');
    option.disabled = true;
    option.textContent = '⚠️ Failed to load index.json';
    select.appendChild(option);
  }
}

listMessages();
