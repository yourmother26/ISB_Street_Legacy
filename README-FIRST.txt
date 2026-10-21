ISB: STREET LEGACY — WAVE 1 FOUNDATION

WHAT THIS ZIP CONTAINS
- Starter HTML shell with a visible startup timeout and full ISB: STREET LEGACY branding
- Cinematic-style logo assembly intro and skip button
- Main menu, settings panel and project notes panel
- Three.js scene initialization (requires the official local Three.js files)
- Lightweight placeholder road, ground and buildings
- Drag-to-look camera
- FPS/frame-time display
- Mobile responsive layout and local module import map
- Basic error screen and local setup instructions

IMPORTANT DEPENDENCY STEP
The Three.js files are not bundled into this starter archive because the official release needs to be downloaded and pinned as one matching release. The vendor folders are placeholders.

1. Download an official release ZIP from:
   https://github.com/mrdoob/three.js/releases
2. Extract it.
3. Copy the release's `build` folder into:
   `vendor/three/build/`
4. Copy the release's `examples/jsm` folder into:
   `vendor/three/examples/jsm/`
5. Keep the build and addons from the SAME release.
6. Confirm this file exists:
   `vendor/three/build/three.module.js`
7. Run `index.html` through TrebEdit's local server, not file://.
8. Open the local URL and inspect the browser console if it fails.

FIRST TEST
- Boot screen should disappear.
- Logo intro should appear and then main menu.
- Tap ENTER TEST WORLD.
- A basic 3D road/ground/building test scene should appear.
- Drag across the scene to rotate the view.
- FPS and frame-time data should update.

IF IT DOES NOT LOAD
- Confirm the local server is running.
- Check the import-map paths in index.html.
- Confirm the module file and examples/jsm folder were copied correctly.
- Check the console for the exact error before changing code.

SCOPE
This is a foundation prototype, not the complete game. There is no real character, driving, missions, NPC AI, save system, or final city yet. Those come in later waves after this build is verified on the target phone.

SAFETY
This project is separate from the existing ISB Store. Do not copy these files into the production store or deploy them without explicit approval.


WAVE 1.1 FIXES
- Boot screen branding now reads ISB: STREET LEGACY.
- Intro uses one combined ISB: STREET LEGACY lockup.
- A 10-second startup watchdog displays a visible troubleshooting message if module loading fails before main.js starts.
- Startup status text is now a status message, not a competing game title.
