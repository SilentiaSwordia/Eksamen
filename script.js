// Funksjon for å sjekke om systemet bruker mørkt eller lyst tema
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
const adminLink = document.getElementById("adminLink");
const adminOnlyElements = document.querySelectorAll(".admin-only");
const kundeLink = document.getElementById("kundeLink");
const kundeOnlyElements = document.querySelectorAll(".kunde-only");

openBtn.addEventListener("click", async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.auth.signOut();
    await refreshAuthUI();
  } else {
    panel.classList.add("open");
    // Clear old messages when opening panel
    loginMsg.textContent = "";
    signupMsg.textContent = "";
  }
});
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
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      loggedOut.style.display = "";
      loggedIn.style.display = "none";
      userBadge.textContent = "";
      openBtn.textContent = "Logg inn";
      adminLink.style.display = "none";
      adminOnlyElements.forEach((el) => (el.style.display = "none"));
      kundeLink.style.display = "none";
      kundeOnlyElements.forEach((el) => (el.style.display = "none"));
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role ?? "user";
    const isAdmin = role === "admin";
    const isKunde = role === "user";
    const isPriveleged = role === "admin" || role === "ansatt";
    loggedOut.style.display = "none";
    loggedIn.style.display = "";
    whoami.textContent = `Innlogget som ${user.email}`;
    roleBadge.textContent = `Rolle: ${role}`;
    userBadge.textContent = role === "admin" ? "Admin" : "Innlogget";
    adminLink.style.display = isPriveleged ? "" : "none";
    adminOnlyElements.forEach((el) => {
      el.style.display = isAdmin ? "" : "none";
    });
    kundeLink.style.display = isKunde ? "" : "none";
    kundeOnlyElements.forEach((el) => {
      el.style.display = isKunde ? "" : "none";
    });
    openBtn.textContent = "Logg ut";
  } catch (err) {
    console.error("Error refreshing auth UI:", err);
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMsg.textContent = "Logger inn...";
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      loginMsg.textContent = "Feil: " + error.message;
      console.error("Login error:", error);
      return;
    }

    loginMsg.textContent = "Innlogget ✅";
    await refreshAuthUI();
    // Close panel after a short delay to show success message
    setTimeout(() => panel.classList.remove("open"), 800);
  } catch (err) {
    loginMsg.textContent = "Feil: " + (err?.message || "Ukjent feil");
    console.error("Login exception:", err);
  }
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

supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth state changed:", event);
  refreshAuthUI();
});

// Initial check on page load
refreshAuthUI();
