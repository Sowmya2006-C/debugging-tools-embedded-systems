# Debugging Tools for Embedded Systems

A static educational website (HTML, CSS, vanilla JavaScript). No build step, backend or dependencies. Only Google Fonts load online, with system-font fallbacks.

## Files
- `index.html` structure and content
- `style.css` "Engineer's Lab" design (ivory, forest green, burnt orange, brass)
- `script.js` tool bench, workflow, accordions, menu, footer year
- `README.md` this file

## Run locally
Open `index.html` in any browser.

## Edit your details
In the About section, click a field and type. Values save in your browser only. To make them permanent for everyone, replace the `data-ph` text in `index.html`.

## Deploy: GitHub + Vercel
1. Create a GitHub repository and upload all four files (or `git init`, `git add .`, `git commit`, `git push`).
2. Sign in at vercel.com with GitHub and choose **Add New > Project**.
3. Import the repository. Framework preset: **Other**. Leave build command and output directory empty.
4. Click **Deploy**. Your site is live at a `.vercel.app` address.

## Deploy: GitHub + Netlify
1. Push the files to a GitHub repository.
2. Sign in at netlify.com and choose **Add new site > Import an existing project**.
3. Connect GitHub and select the repository.
4. Leave build command empty and set publish directory to `/`. Click **Deploy**.

## Deploy: GitHub Pages
Repository **Settings > Pages**, source **Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
