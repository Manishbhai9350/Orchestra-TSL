import "./ui.css";
import { bridge } from "./ui-bridge";

const mutateBtn = document.querySelector<HTMLElement>("#mutate-trigger");
const fpsReadout = document.querySelector<HTMLElement>("#hud-fps");

mutateBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  bridge.emit("mutate");

  mutateBtn.classList.add("is-active");
  window.setTimeout(() => mutateBtn.classList.remove("is-active"), 400);
});

bridge.on("tick", ({ fps }) => {
  if (fpsReadout) fpsReadout.textContent = String(fps);
});