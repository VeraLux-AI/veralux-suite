
function showToast(message, success = true) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 text-sm rounded shadow transition-opacity ${
    success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2000);
}

function toggleLoading(show = true) {
  let loader = document.getElementById('page-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.className = 'fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-40';
    loader.innerHTML = '<div class="animate-spin rounded-full h-10 w-10 border-t-4 border-red-600"></div>';
    document.body.appendChild(loader);
  }
  loader.style.display = show ? 'flex' : 'none';
}
let selectedCompany = '';

document.getElementById('company-select').addEventListener('change', async (e) => {
  selectedCompany = e.target.value;
  toggleLoading(true);
  await loadSettings();
  toggleLoading(false);
});

async function createCompany() {
  const input = document.getElementById('new-company-name');
  const name = input.value.trim().toLowerCase().replace(/\s+/g, '-');
  if (!name) return alert("Enter a valid name");

  const res = await fetch('/admin/create-company', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company: name })
  });

  if (res.ok) {
    showToast(`✅ ${name} created!`);
    const option = new Option(name, name);
    document.getElementById('company-select').add(option);
    document.getElementById('company-select').value = name;
    selectedCompany = name;
    toggleLoading(true);
  await loadSettings();
  toggleLoading(false);
    input.value = '';
  } else {
    const { error } = await res.json();
    showToast(`❌ ${error}`, false);
  }
}

let configData = {};

async function loadSettings() {
  if (!selectedCompany) return;
  const res = await fetch(`/admin/${selectedCompany}/settings.json`);
  configData = await res.json();

  renderSection('toggle-group', '🔧 Toggles', renderToggles);
  renderSection('list-group', '📋 Required Fields', renderLists);
  renderSection('textarea-group', '🤖 AI Prompts', renderTextareas);
}

function renderSection(containerId, title, renderFn) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4';

  const header = document.createElement('h3');
  header.className = 'text-lg font-semibold text-red-700';
  header.textContent = title;
  card.appendChild(header);

  renderFn(configData, card);
  container.appendChild(card);
}

function renderToggles(data, container) {
  for (const key in data) {
    const setting = data[key];
    if (setting.type === 'toggle') {
      const wrapper = document.createElement('div');
      wrapper.className = 'flex items-center justify-between';

      const label = document.createElement('span');
      label.textContent = setting.label;
      label.className = 'text-sm text-gray-700';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = setting.enabled;
      input.id = key;
      input.className = 'w-5 h-5 text-red-600 focus:ring-red-500 border-gray-300 rounded';

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      container.appendChild(wrapper);
    }
  }
}

function renderLists(data, container) {
  for (const key in data) {
    const setting = data[key];
    if (setting.type === 'list') {
      const wrapper = document.createElement('div');
      wrapper.className = 'space-y-2';

      const label = document.createElement('label');
      label.innerText = setting.label;
      label.className = 'text-sm text-gray-700 font-medium block';

      const list = document.createElement('ul');
      list.id = `${key}-list`;
      list.className = 'space-y-2';

      (setting.value || []).forEach(item => {
        const li = document.createElement('li');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = item;
        input.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none';
        li.appendChild(input);
        list.appendChild(li);
      });

      const addBtn = document.createElement('button');
      addBtn.innerText = '+ Add';
      addBtn.type = 'button';
      addBtn.className = 'mt-2 text-sm text-red-600 hover:underline';
      addBtn.onclick = () => {
        const li = document.createElement('li');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none';
        li.appendChild(input);
        list.appendChild(li);
      };

      wrapper.appendChild(label);
      wrapper.appendChild(list);
      wrapper.appendChild(addBtn);
      container.appendChild(wrapper);
    }
  }
}

function renderTextareas(data, container) {
  for (const key in data) {
    const setting = data[key];
    if (setting.type === 'textarea') {
      const wrapper = document.createElement('div');
      wrapper.className = 'space-y-1';

      const label = document.createElement('label');
      label.innerText = setting.label;
      label.className = 'text-sm text-gray-700 font-medium block';

      const textarea = document.createElement('textarea');
      textarea.id = key;
      textarea.value = setting.value || '';
      textarea.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none';
      
      wrapper.appendChild(label);
      wrapper.appendChild(textarea);
      container.appendChild(wrapper);
    }
  }
}

async function saveSettings() {
  const newConfig = {};
  for (const key in configData) {
    const setting = configData[key];
    if (setting.type === 'toggle') {
      newConfig[key] = { ...setting, enabled: document.getElementById(key).checked };
    } else if (setting.type === 'textarea') {
      newConfig[key] = { ...setting, value: document.getElementById(key).value };
    } else if (setting.type === 'list') {
      const listEls = document.querySelectorAll(`#${key}-list input`);
      newConfig[key] = {
        ...setting,
        value: Array.from(listEls).map(el => el.value.trim()).filter(Boolean)
      };
    }
  }

  const res = await fetch(`/admin/${selectedCompany}/save-settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newConfig)
  });

  showToast(res.ok ? "✅ Settings saved!" : "❌ Failed to save settings.", res.ok);
}

window.onload = async () => {
  selectedCompany = "elevated-garage";
  const option = new Option(selectedCompany, selectedCompany);
  document.getElementById('company-select').add(option);
  document.getElementById('company-select').value = selectedCompany;
  toggleLoading(true);
  await loadSettings();
  toggleLoading(false);
};

async function provisionCompany() {
  if (!selectedCompany) return showToast("❌ No company selected", false);

  try {
    toggleLoading(true);
    const res = await fetch('/admin/provision-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: selectedCompany })
    });

    const result = await res.json();
    toggleLoading(false);

    if (result.success) {
      showToast("✅ Provisioned Solomon for " + selectedCompany);
      console.log(result.output);
    } else {
      showToast("❌ Provisioning failed", false);
      console.error(result.error);
    }
  } catch (err) {
    toggleLoading(false);
    showToast("❌ Provisioning error", false);
    console.error(err);
  }
}

async function generatePrompt() {
  const purpose = document.getElementById('prompt-purpose').value.trim();
  const business = document.getElementById('prompt-business').value.trim();
  const tone = document.getElementById('prompt-tone').value.trim();

  if (!purpose || !business) {
    showToast("❌ Please enter both purpose and business.", false);
    return;
  }

  toggleLoading(true);
  try {
    const res = await fetch('/admin/generate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose, business, tone })
    });

    const result = await res.json();
    toggleLoading(false);

    if (res.ok && result.prompt) {
      document.getElementById('prompt-output').value = result.prompt;
      showToast("✅ Prompt generated!");
    } else {
      showToast("❌ Failed to generate prompt", false);
    }
  } catch (err) {
    toggleLoading(false);
    showToast("❌ Error generating prompt", false);
    console.error(err);
  }
}

function saveGeneratedPrompt() {
  const prompt = document.getElementById('prompt-output').value.trim();
  if (!prompt) {
    showToast("❌ No prompt to save", false);
    return;
  }

  const key = "chatResponderPrompt";
  configData[key].value = prompt;
  document.getElementById(key).value = prompt;
  showToast("✅ Prompt saved to Chat Responder!");
}
