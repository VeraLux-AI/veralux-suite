
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

      const sourceMap = configData.sourceMap || {}; // <— Used to label AI/manual origin

      (setting.value || []).forEach(item => {
        const li = document.createElement('li');
        li.className = 'flex gap-2 items-center';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = item;
        input.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none';

        const delBtn = document.createElement('button');
        delBtn.innerText = '❌';
        delBtn.type = 'button';
        delBtn.className = 'text-red-600 text-sm';
        delBtn.onclick = () => li.remove();

        const tag = document.createElement('span');
        tag.className = 'text-xs px-2 py-1 rounded font-medium';
        const source = sourceMap[item] || 'Manual';
        if (source === 'AI') {
          tag.innerText = '🧠 AI';
          tag.classList.add('bg-blue-100', 'text-blue-600');
        } else {
          tag.innerText = '✍️ Manual';
          tag.classList.add('bg-yellow-100', 'text-yellow-700');
        }

        li.appendChild(input);
        li.appendChild(tag);
        li.appendChild(delBtn);
        list.appendChild(li);
      });

      const addBtn = document.createElement('button');
      addBtn.innerText = '+ Add';
      addBtn.type = 'button';
      addBtn.className = 'mt-2 text-sm text-red-600 hover:underline';
      addBtn.onclick = () => {
        const li = document.createElement('li');
        li.className = 'flex gap-2 items-center';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none';

        const tag = document.createElement('span');
        tag.innerText = '✍️ Manual';
        tag.className = 'text-xs px-2 py-1 rounded font-medium bg-yellow-100 text-yellow-700';

        const delBtn = document.createElement('button');
        delBtn.innerText = '❌';
        delBtn.type = 'button';
        delBtn.className = 'text-red-600 text-sm';
        delBtn.onclick = () => li.remove();

        li.appendChild(input);
        li.appendChild(tag);
        li.appendChild(delBtn);
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
  let updatedFieldList = [];

  for (const key in configData) {
    const setting = configData[key];

    if (setting.type === 'toggle') {
      newConfig[key] = { ...setting, enabled: document.getElementById(key).checked };

    } else if (setting.type === 'textarea') {
      newConfig[key] = { ...setting, value: document.getElementById(key).value };

    } else if (setting.type === 'list') {
      const listEls = document.querySelectorAll(`#${key}-list input`);
      const cleaned = Array.from(listEls).map(el => el.value.trim()).filter(Boolean);
      newConfig[key] = { ...setting, value: cleaned };
      if (key === 'requiredFields') updatedFieldList = cleaned;
    }
  }

  // ✨ Auto-sync required fields to intakeExtractorPrompt
  if (updatedFieldList.length > 0 && newConfig.intakeExtractorPrompt) {
    const fieldLine = updatedFieldList.join(', ');
    newConfig.intakeExtractorPrompt.value = `Extract the following fields from the user conversation: ${fieldLine}. Return them as structured JSON.`;
  }

  const res = await fetch(`/admin/${selectedCompany}/save-settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newConfig)
  });

  showToast(res.ok ? "✅ Settings saved!" : "❌ Failed to save settings.", res.ok);
// Show synced message
const syncStatus = document.getElementById('sync-status');
if (syncStatus) {
  syncStatus.classList.remove('hidden');
  syncStatus.style.opacity = '1';

  setTimeout(() => {
    syncStatus.style.opacity = '0';
    setTimeout(() => syncStatus.classList.add('hidden'), 400);
  }, 3000);
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
  body: JSON.stringify({ company: selectedCompany, purpose, business, tone })
});


    const result = await res.json();
    toggleLoading(false);

    if (res.ok && result.success && result.prompts) {
      const chatPrompt = result.prompts.chatResponderPrompt || '';
      const extractPrompt = result.prompts.intakeExtractorPrompt || '';

      document.getElementById('prompt-output-chat').value = chatPrompt;
      document.getElementById('prompt-output-extract').value = extractPrompt;

      showToast("✅ Prompts generated!");

      // ✅ Reload settings to refresh requiredFields UI
      await loadSettings();

    } else {
      showToast("❌ Failed to generate prompts", false);
    }
  } catch (err) {
    toggleLoading(false);
    showToast("❌ Error generating prompts", false);
    console.error(err);
  }
}

function saveGeneratedPrompt() {
  const chatPrompt = document.getElementById('prompt-output-chat')?.value.trim();
  const extractPrompt = document.getElementById('prompt-output-extract')?.value.trim();

  if (!chatPrompt || !extractPrompt) {
    showToast("❌ Both prompts must be filled in", false);
    return;
  }

  if (configData.chatResponderPrompt) {
    configData.chatResponderPrompt.value = chatPrompt;
    document.getElementById('chatResponderPrompt').value = chatPrompt;
  }

  if (configData.intakeExtractorPrompt) {
    configData.intakeExtractorPrompt.value = extractPrompt;
    document.getElementById('intakeExtractorPrompt').value = extractPrompt;
  }

  showToast("✅ Prompts saved to settings!");
}

async function extractColorsFromLogo(file) {
  const formData = new FormData();
  formData.append("logo", file);

  try {
    const res = await fetch("/admin/extract-logo-colors", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (res.ok && (result.colors || result.success)) {
      return result.colors || [];
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (err) {
    console.error("❌ Color extraction failed:", err.message);
    showToast("❌ Failed to extract colors from logo", false);
    return [];
  }
}

function renderBrandColorsSection(colors = []) {
  const container = document.getElementById("branding-group");
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "space-y-2";

  const label = document.createElement("label");
  label.innerText = "Brand Colors";
  label.className = "text-sm text-gray-700 font-medium block";
  wrapper.appendChild(label);

  colors.forEach((color, index) => {
    const input = document.createElement("input");
    input.type = "color";
    input.value = color;
    input.className = "w-16 h-10 rounded border";
    input.dataset.index = index;

    // Optional: Add corresponding hex input field
    const hex = document.createElement("input");
    hex.type = "text";
    hex.value = color;
    hex.className = "ml-2 px-2 py-1 border rounded text-sm w-24 align-middle";

    const row = document.createElement("div");
    row.className = "flex items-center gap-2";
    row.appendChild(input);
    row.appendChild(hex);

    wrapper.appendChild(row);
  });

  container.appendChild(wrapper);
}

document.getElementById("logo-upload")?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  toggleLoading(true);
  const colors = await extractColorsFromLogo(file);
  toggleLoading(false);

  if (colors.length > 0) {
    renderBrandColorsSection(colors);
    showToast("🎨 Colors extracted from logo!");
  }
});

