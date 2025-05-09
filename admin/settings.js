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

  document.getElementById('toggle-group').innerHTML = '';
  document.getElementById('list-group').innerHTML = '';
  document.getElementById('textarea-group').innerHTML = '';

  renderToggles(configData, document.getElementById('toggle-group'));
  renderLists(configData, document.getElementById('list-group'));
  renderTextareas(configData, document.getElementById('textarea-group'));
}

function renderToggles(data, container) {
  for (const key in data) {
    const setting = data[key];
    if (setting.type === 'toggle') {
      const wrapper = document.createElement('div');
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = setting.enabled;
      input.id = key;
      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + setting.label));
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    }
  }
}

function renderLists(data, container) {
  for (const key in data) {
    const setting = data[key];
    if (setting.type === 'list') {
      const wrapper = document.createElement('div');
      const label = document.createElement('label');
      label.innerText = setting.label;
      const list = document.createElement('ul');
      list.id = `${key}-list`;

      (setting.value || []).forEach(item => {
        const li = document.createElement('li');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = item;
        input.className = 'list-input';
        li.appendChild(input);
        list.appendChild(li);
      });

      const addBtn = document.createElement('button');
      addBtn.innerText = '+ Add';
      addBtn.type = 'button';
      addBtn.onclick = () => {
        const li = document.createElement('li');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'list-input';
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
      const label = document.createElement('label');
      label.innerText = setting.label;
      const textarea = document.createElement('textarea');
      textarea.id = key;
      textarea.value = setting.value || '';
      container.appendChild(label);
      container.appendChild(textarea);
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
