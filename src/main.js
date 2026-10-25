import "./styles.css";

import { CurveClimbGame } from "./game.js";

import { fetchCurveState } from "./curveLive.js";

import {

  DEMO_TOKEN,

  parseTokenFromLocation,

  tokenPageUrl,

} from "./config.js";



const canvas = document.getElementById("game");

const statusEl = document.getElementById("status");

const tokenInput = document.getElementById("token-input");

const btnPlay = document.getElementById("btn-play");

const btnShare = document.getElementById("btn-share");

const btnTrade = document.getElementById("btn-trade");

const overlay = document.getElementById("overlay");

const overlayTitle = document.getElementById("overlay-title");

const overlayBody = document.getElementById("overlay-body");



let game = null;

let raf = 0;

let last = 0;

let loopActive = false;

let endOverlayShown = false;

let tokenAddress = parseTokenFromLocation() || DEMO_TOKEN;

let curveState = { progress: 42, graduated: false, baseTaxBps: 200 };



tokenInput.value = tokenAddress;



function setGameUiActive(active) {

  document.body.classList.toggle("game-active", active);

}



function setStatus(text, tone = "neutral") {

  statusEl.textContent = text;

  statusEl.dataset.tone = tone;

}



async function refreshCurve(showSpinner = true) {

  tokenAddress = tokenInput.value.trim() || DEMO_TOKEN;

  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {

    setStatus("Invalid token address — using demo.", "warn");

    tokenAddress = DEMO_TOKEN;

    tokenInput.value = tokenAddress;

  }



  if (showSpinner) setStatus("Reading bonding curve on Robinhood testnet…", "neutral");



  try {

    curveState = await fetchCurveState(tokenAddress);

    const tag = curveState.graduated ? "Graduated 🎓" : `${curveState.progress.toFixed(1)}% to graduation`;

    setStatus(`Live curve · ${tag} · VIBEVIBE pair`, "ok");

    btnTrade.href = tokenPageUrl(tokenAddress);

    game?.updateCurve(curveState);

  } catch (err) {

    setStatus(err.message || "Could not read curve.", "warn");

  }

}



function showOverlay(title, body) {

  overlayTitle.textContent = title;

  overlayBody.textContent = body;

  overlay.hidden = false;

  setGameUiActive(true);

}



function hideOverlay() {

  overlay.hidden = true;

  setGameUiActive(false);

}



function stopLoop() {

  loopActive = false;

  cancelAnimationFrame(raf);

  raf = 0;

}



function showEndOverlay(outcome) {

  if (outcome === "won") {

    const pct = curveState.graduated

      ? "This token already graduated on vibe/vibe."

      : `On-chain bonding is still ${curveState.progress.toFixed(1)}% — this run did not graduate the token.`;

    showOverlay(

      "Run cleared — game gate only",

      `${pct} You reached the in-game GRADUATE platform. Share your run or trade on the launchpad (wallet + testnet ETH).`,

    );

  } else {

    showOverlay(

      "Rekt by the curve",

      "Sells drained momentum or you fell off. Green platforms = buys, red = sells, dodge 99% snipe ghosts in the first 20 seconds.",

    );

  }

}



function loop(now) {

  if (!game || !loopActive) return;



  const dt = Math.min(0.032, (now - last) / 1000 || 0);

  last = now;

  const end = game.tick(dt);

  game.draw();



  if ((end === "won" || end === "lost") && !endOverlayShown) {

    endOverlayShown = true;

    stopLoop();

    showEndOverlay(end);

    return;

  }



  if (loopActive) {

    raf = requestAnimationFrame(loop);

  }

}



function startRun() {

  hideOverlay();

  endOverlayShown = false;

  stopLoop();

  game = new CurveClimbGame(canvas, curveState);

  game.start();

  last = performance.now();

  loopActive = true;

  raf = requestAnimationFrame(loop);

}



function goHome() {

  stopLoop();

  endOverlayShown = false;

  game = null;

  hideOverlay();

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0c0a14";

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  document.querySelector(".hero")?.scrollIntoView({ behavior: "smooth", block: "start" });

}



btnPlay.addEventListener("click", () => {

  refreshCurve(false).then(startRun);

});



btnShare.addEventListener("click", () => {

  const text = game?.getShareText(tokenAddress, "GRUN") ?? "Curve Climb · $GRUN on vibe/vibe testnet";

  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

  window.open(url, "_blank", "noopener,noreferrer");

});



tokenInput.addEventListener("change", () => refreshCurve());

document.getElementById("btn-sync").addEventListener("click", () => refreshCurve());



document.getElementById("overlay-again").addEventListener("click", (e) => {

  e.stopPropagation();

  refreshCurve(false).then(startRun);

});



document.getElementById("overlay-home").addEventListener("click", (e) => {

  e.stopPropagation();

  goHome();

});



overlay.addEventListener("click", (e) => {

  if (e.target === overlay) goHome();

});



document.querySelector(".overlay .card")?.addEventListener("click", (e) => {

  e.stopPropagation();

});



window.addEventListener("keydown", (e) => {

  if (e.code === "Escape" && !overlay.hidden) {

    e.preventDefault();

    goHome();

    return;

  }



  if (e.code === "Space" || e.code === "ArrowUp") {

    e.preventDefault();

    if (!overlay.hidden) return;

    if (!game || game.state !== "playing") {

      refreshCurve(false).then(startRun);

    } else {

      game.jump();

    }

  }

});



canvas.addEventListener("pointerdown", () => {

  if (!overlay.hidden) return;

  game?.jump();

});



refreshCurve();

setInterval(() => {

  if (loopActive) return;

  refreshCurve(false);

}, 45_000);


