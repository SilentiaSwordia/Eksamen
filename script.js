const detectSystemTheme = () => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// Lytt etter endringer i systemtemaet (f.eks. hvis brukeren bytter fra lyst til mørkt tema i OS)
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (e.matches) {
      console.log("System switched to dark mode");
      // Her kan man legge til kode for å oppdatere applikasjonens tema dynamisk hvis nødvendig
    } else {
      console.log("System switched to light mode");
    }
  });

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** 1) Koble til Supabase (BYTT til dine nøkler) */
const supabase = createClient(
  "https://bmwbifrpkpashrjzcema.supabase.co",
  "sb_publishable_EM33u0jJkprVPboYPC5gOg_TtqORU6m",
);

const panel = document.getElementById("authPanel");
const openBtn = document.getElementById("authOpenBtn");
const closeBtn = document.getElementById("authCloseBtn");
const userBadge = document.getElementById("authUserBadge");
const loggedOut = document.getElementById("authLoggedOut");
const loggedIn = document.getElementById("authLoggedIn");
const whoami = document.getElementById("whoami");
const roleBadge = document.getElementById("roleBadge");
const tabButtons = document.querySelectorAll("[data-tab]");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginMsg = document.getElementById("loginMsg");
const signupMsg = document.getElementById("signupMsg");

openBtn.addEventListener("click", () => panel.classList.add("open"));
closeBtn.addEventListener("click", () => panel.classList.remove("open"));

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    loginForm.style.display = tab === "login" ? "" : "none";
    signupForm.style.display = tab === "signup" ? "" : "none";
  });
});

async function refreshAuthUI() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    loggedOut.style.display = "";
    loggedIn.style.display = "none";
    userBadge.textContent = "";
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "user";
  loggedOut.style.display = "none";
  loggedIn.style.display = "";
  whoami.textContent = `Innlogget som \${user.email}`;
  roleBadge.textContent = `Rolle: \${role}\``;
  userBadge.textContent = role === "admin" ? "Admin" : "Innlogget";
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMsg.textContent = "Logger inn...";
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  loginMsg.textContent = error ? "Feil: " + error.message : "Innlogget ✅";
  await refreshAuthUI();
  if (!error) setTimeout(() => panel.classList.remove("open"), 400);
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  signupMsg.textContent = "Oppretter...";
  const name = document.getElementById("signupName").value.trim();
  const email = document
    .getElementById("signupEmail")
    .value.trim()
    .toLowerCase();
  const pass = document.getElementById("signupPass").value;

  const { error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: { data: { display_name: name } },
  });

  signupMsg.textContent = error
    ? "Feil: " + error.message
    : "Konto opprettet ✅ Sjekk e-posten din for bekreftelse!.";
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  await refreshAuthUI();
});

supabase.auth.onAuthStateChange(() => refreshAuthUI());

refreshAuthUI();
