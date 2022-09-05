# Transfer to Ladok Frontend

This is a Web application developed with React. It uses Parcel to build it.

# Getting started

<details>
<summary>It is highly recommended that you start Transfer to Ladok from the repository root instead of here, that way you will have frontend and backend all tied together.</summary>

> **⚠️ Warning**. Do the steps below only if you want to start the frontend isolated

- Install dependencies with `npm install`
- Run the app in development mode with `npm run dev`

Now you can go to:

- https://localdev.kth.se:4443/transfer-to-ladok/index.html for the Transfer to Ladok app
- https://localdev.kth.se:4443/transfer-to-ladok/docs/index.html to read the API documentation of Transfer to Ladok

</details>

---

# Concepts

## How `npm run dev` works

The `dev` script will spin up a Parcel server that does two things:

- **Serve** (handle) the files [`src/index.html`](./src/index.html) and [`src/docs/index.html`](./src/docs/index.html)
- **Proxy** some of the routes as specified in [.proxyrc.js](./.proxyrc.js)
