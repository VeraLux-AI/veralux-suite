# 🧠 VeraLux Suite

This repository is the control center for managing and provisioning multi-tenant AI instances of **Solomon**, the intelligent client intake system.

---

## 📦 Repo Structure

```
/admin/                       → Admin portal for company settings
/solomon-template/           → Base Solomon template with dynamic placeholders
/provisioned/                → Auto-generated client-specific Solomon builds (ignored)
/provision-client.js         → Script to generate new client deployments
/solomon-template-variables.json → All dynamic fields supported in provisioning
```

---

## 🚀 Provision a New Solomon Client

Use this command to generate a ready-to-push Solomon instance for a new client:

```bash
node provision-client.js \
  --name brightbuild \
  --color "#1A73E8" \
  --accent "#174EA6" \
  --drive 1AbCdEfGhXYZ
```

This will:
- Clone the template
- Replace placeholders with client info
- Create a folder at `/provisioned/solomon-brightbuild/`

You then:
1. `cd provisioned/solomon-brightbuild`
2. `git init && git remote add origin git@github.com:VeraLux-AI/solomon-brightbuild.git`
3. `git push -u origin main`
4. Deploy to Render

---

## 🛠 Template Fields

See [`solomon-template-variables.json`](./solomon-template-variables.json) for a full list of fields.

You can build a UI or automate this flow using that file as your contract.

---
