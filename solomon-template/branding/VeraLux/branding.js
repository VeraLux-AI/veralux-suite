
fetch('/branding/VeraLux/branding.json')
  .then(res => res.json())
  .then(data => {
    document.documentElement.style.setProperty('--primary-color', data.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', data.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', data.accentColor);
    document.documentElement.style.setProperty('--text-color', data.textColor);

    const logo = document.getElementById('logo');
    if (logo) logo.src = data.logo;

    const brandName = document.getElementById('company-name');
    if (brandName) brandName.innerText = data.companyName;
  });
