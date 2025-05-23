const messagesPath = 'messages/';
const sigPath = 'signers/';

function extractField(lines, key) {
  const line = lines.find(l => l.startsWith(`${key}:`));
  return line ? line.split(':').slice(1).join(':').trim() : null;
}

async function loadMessage(filename) {
  const messageText = await fetch(`${messagesPath}${filename}?t=${Date.now()}`).then(res => res.text());
  const lines = messageText.split('\\n');

  const info = {
    id: extractField(lines, 'ID'),
    utc: extractField(lines, 'UTC'),
    chmHash: extractField(lines, 'ChM-HASH'),
    cHash: extractField(lines, 'C-HASH'),
    vCheck: extractField(lines, 'V-CHECK'),
    fullText: messageText
  };

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(messageText));
  const computedHash = [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
  info.computedHash = computedHash;

  const sigs = ['SIG1', 'SIG2', 'SIG3'];

  for (const sig of sigs) {
    try {
      const res = await fetch(`${sigPath}${sig}/${sig}-${filename}.sig?t=${Date.now()}`);
      if (!res.ok) throw new Error(`${sig} not found`);
      const sigText = await res.text();
      info[sig.toLowerCase()] = sigText.trim();
      info[`${sig.toLowerCase()}Valid`] = sig === 'SIG3' ? (sigText.trim() === computedHash) : true;
    } catch {
      info[sig.toLowerCase()] = null;
      info[`${sig.toLowerCase()}Valid`] = false;
    }
  }

  return info;
}

async function updateUI(filename) {
  const info = await loadMessage(filename);

  const lines = info.fullText.split('\\n');
  const msgIndex = lines.findIndex(line => line.trim() === 'Message:');
  const messageBody = msgIndex !== -1 ? lines.slice(msgIndex + 1).join('\\n') : '(Message not found)';

  const footerLine = lines.find(line => line.includes(`ChM-${info.id.split('-')[1]}:`));
  const version = footerLine?.split(':')[1] || 'v?';

  const isMessageValid = info.vCheck.includes('✅');
  const quorumValidCount = [info.sig1Valid, info.sig2Valid, info.sig3Valid].filter(v => v).length;
  const quorumMet = quorumValidCount >= 2;

  document.getElementById('version-label').textContent = version;
  document.getElementById('status-icon').textContent = quorumMet && isMessageValid ? '✅' : '❌';

  document.getElementById('quorum-title').textContent = `Quorum (${quorumValidCount}/3 signatures valid)`;

  document.getElementById('quorum-info').innerHTML = `
    <pre>
SIG1: ${info.sig1Valid ? '🆗' : '❌'}
SIG2: ${info.sig2Valid ? '🆗' : '❌'}
SIG3: ${info.sig3Valid ? '🆗' : '❌'}
    </pre>
  `;

  document.getElementById('message-title').textContent = \`Sovern Message Signature \${isMessageValid ? '🆗' : '❌'}\`;

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
    const res = await fetch(\`messages/index.json?t=\${Date.now()}\`);
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
