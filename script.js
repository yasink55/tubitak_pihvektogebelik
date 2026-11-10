/* =========================================================
   PİH ve Dış Gebelik — Etkileşimler
   ========================================================= */

// Formu gerçek bir servise bağlamak için (ör. Formspree: https://formspree.io)
// aldığınız adresi buraya yazın. Boş bırakılırsa gönderim simüle edilir.
const FORM_ENDPOINT = "";

document.addEventListener("DOMContentLoaded", () => {
  const navbar    = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const navLinks  = document.getElementById("nav-links");
  const links     = navLinks.querySelectorAll("a");
  const container = document.getElementById("snap-container");

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Navbar: scroll durumu ---------- */
  container.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", container.scrollTop > 20);
  }, { passive: true });

  /* ---------- Hamburger menü ---------- */
  const setMenu = (open) => {
    hamburger.classList.toggle("open", open);
    navLinks.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
  };
  hamburger.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
  links.forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
  window.addEventListener("resize", () => window.innerWidth > 860 && setMenu(false));

  /* ---------- Smooth anchor scroll (aynı sayfa, snap-container içinde) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---------- Aktif menü bağlantısı ---------- */
  const sections = ["anasayfa", "bilgi", "vizyonumuz", "biz-kimiz", "iletisim"];
  const sectionNavMap = {
    anasayfa: "#anasayfa", bilgi: "#anasayfa",
    vizyonumuz: "#vizyonumuz", "biz-kimiz": "#biz-kimiz", iletisim: "#iletisim",
  };
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const href = sectionNavMap[entry.target.id];
        links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === href));
      });
    },
    { root: container, threshold: 0.5 }
  );
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });

  /* ---------- Scroll reveal ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { root: container, threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* ---------- Sayaç animasyonu ---------- */
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { root: container, threshold: 0.6 }
  );
  document.querySelectorAll("[data-count]").forEach((el) => countObserver.observe(el));

  /* ---------- İletişim formu ---------- */
  const form      = document.getElementById("contact-form");
  const submitBtn = document.getElementById("contact-submit");
  const success   = document.getElementById("form-success");

  const rules = {
    name:    (v) => (v.trim().length >= 2 ? "" : "Lütfen isminizi girin."),
    email:   (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Geçerli bir e-posta adresi girin."),
    message: (v) => (v.trim().length >= 5 ? "" : "Mesajınız en az 5 karakter olmalı."),
  };

  const validateField = (field) => {
    const msg = rules[field.name](field.value);
    field.parentElement.classList.toggle("invalid", Boolean(msg));
    form.querySelector(`.error[data-for="${field.name}"]`).textContent = msg;
    return !msg;
  };

  form.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.parentElement.classList.contains("invalid")) validateField(field);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    success.classList.remove("show");
    const fields = [...form.querySelectorAll("input, textarea")];
    const valid  = fields.map(validateField).every(Boolean);
    if (!valid) return;

    submitBtn.classList.add("loading");
    submitBtn.querySelector(".btn-label").textContent = "Gönderiliyor";

    try {
      const data = Object.fromEntries(new FormData(form));
      if (FORM_ENDPOINT) {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Gönderim başarısız");
      } else {
        await new Promise((r) => setTimeout(r, 900));
      }
      form.reset();
      success.textContent = "Teşekkürler! Mesajınız bize ulaştı 💗";
    } catch {
      success.textContent = "Bir sorun oluştu, lütfen daha sonra tekrar deneyin.";
    } finally {
      submitBtn.classList.remove("loading");
      submitBtn.querySelector(".btn-label").textContent = "Gönder";
      success.classList.add("show");
    }
  });
});
