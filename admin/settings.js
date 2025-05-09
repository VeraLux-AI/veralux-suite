let selectedCompany = '';

document.getElementById('company-select').addEventListener('change', async (e) => {
  selectedCompany = e.target.value;
  await loadSettings();
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
    alert(`✅ ${name} created!`);
    const option = new Option(name, name);
    document.getElementById('company-select').add(option);
    document.getElementById('company-select').value = name;
    selectedCompany = name;
    await loadSettings();
    input.value = '';
  } else {
    const { error } = await res.json();
    alert(`❌ ${error}`);
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

  alert(res.ok ? "✅ Settings saved!" : "❌ Failed to save settings.");
}

window.onload = async () => {
  selectedCompany = "elevated-garage";
  const option = new Option(selectedCompany, selectedCompany);
  document.getElementById('company-select').add(option);
  document.getElementById('company-select').value = selectedCompany;
  await loadSettings();
};
