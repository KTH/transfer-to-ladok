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

## Main Application and "Documentation"

The frontend includes two "sub-applications"

- One "main" application which is Transfer to Ladok itself
- One "subapplication" that contains the API docs

(we might consider moving the "docs" subapplication somewhere else to avoid confusion)

## `src` structure

The `src` directory contains all source files for the app, i.e., TypeScript files (`.ts(x)`), html files (`.html`) and SCSS files (`.scss`).

- `index.html`, `index.scss`, `index.tsx`. Entry point of the frontend applicaction.
- `/components` and `/screens`. React components. Note: the difference between "screen" and "components" is very vague and arbitrary at this moment. See discussion below
- `/hooks`. React hooks.
- `/utils`. Utility files.
- `/docs`. Entry point and all files for the "documentation" sub-app. We might consider moving this to somewhere else, perhaps to its own package inside this repo.

## Components and Screens

The components in this project are divided into two directories `src/components` and `src/screens`. It is quite vague the difference between the two but more or less the differences are:

- Screens are not meant to be reusable, they are tipically rendered once. Components are meant to be reusable
- Screens hold business logic, even as part of their state. State in components should be limited to UI changes
- Screens don't need to be flexible nor allow customization. Components should favour it
- Screens are never children of Components

## Conventions

### Files with one Component (or Screen)

- Should be called `Component.tsx` (in PascalCase)
- Should `export default` the component
- It can include components as named exports to ease testability

### Files with multiple components (or screens)

- Should be called `components.tsx` (in camelCase)
- Each component should be one named export

## React App structure

```
<App>
  <Unauthenticated />    Renders the "Welcome page" before user has logged in
  <Authenticated>        The application when the user has logged in
    <AppWithSelector>    For courserooms, users need to select a module
      <ModuleSelector />   - Select a module
      <Preview />          - Select assignment and preview
    </AppWithSelector>
    <AppWithoutSelector> In examrooms, users do not select any module.
      <Preview />          - Select assignment and preview
    </AppWithSelector>
    <Loading />          Shown when grades are being transferred to Ladok
    <Done />             Shown after transferring grades to Ladok
  </Authenticated>
</App>
```
