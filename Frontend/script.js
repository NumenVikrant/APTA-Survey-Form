// Replace with your actual server URL
const SERVER_URL = "https://apta-survey-form.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("surveyForm");
  const statusEl = document.getElementById("formStatus");
  const errorEl = document.getElementById("formError");
  const successEl = document.getElementById("successMessage");
  const downloadBtn = document.getElementById("downloadBtn");

  if (!form) return;

  // ✅ Form submission handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    hide(statusEl);
    hide(errorEl);

    const formData = {
      name: getValue("name"),
      role: getValue("role"),
      support: getValue("support"),
      response: getValue("response"),
      clarity: getValue("clarity"),
      overall: getValue("overall"),
      comments: getValue("comments"),
    };

    console.log(formData);

    // ✅ Validation
    if (
      !formData.name ||
      !formData.role ||
      !formData.support ||
      !formData.response ||
      !formData.clarity ||
      !formData.overall
    ) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form ⚠️",
        html: `<p style="font-size:16px;">Please fill in all <b>required fields</b> before continuing.</p>`,
        confirmButtonText: "Got it!",
        confirmButtonColor: "#E1251B",
      });
      return;
    }

    // 🎉 Clean Badge Popup
    // 🎉 Clean Badge Popup
    Swal.fire({
      title: "You did it! 🎉",
      html: `
    <p style="font-size:18px; margin-bottom: 20px; font-weight:500;">
      Thanks for leveling up the APTA Ops experience 🚀
    </p>
     <img 
      src="./Badge_Image.png" 
      alt="Badge" 
      style="width: 550px; max-width: 90%; margin: 20px auto; display:block;"
    />
  `,
      showConfirmButton: false,
      timer: 5000,
      backdrop: `rgba(0,0,0,0.45)`,
    });

    // 🎊 Confetti
    setTimeout(() => {
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.6 },
      });
    }, 400);

     // ✅ Hide form and show success
      form.classList.add("hidden");
      successEl.classList.remove("hidden");
      form.reset();

    try {
      const resp = await fetch(`${SERVER_URL}/api/submit-survey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.message || "Server error");
      }

    } catch (err) {
      console.error(err);
      show(errorEl, "Unable to submit. " + (err?.message || "Unknown error"));
    }
  });

  // ✅ Download Excel (Admin)
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const token = prompt("Verify Admin");
      if (!token) return;
      window.open(`${SERVER_URL}/api/download-survey?token=${token}`, "_blank");
    });
  }

  // ✅ Clear messages
  form.addEventListener("input", () => {
    hide(statusEl);
    hide(errorEl);
  });

  // 🔧 Helpers
  function getValue(name) {
    const els = document.getElementsByName(name);
    if (!els.length) return "";
    if (els[0].type === "radio") {
      const checked = Array.from(els).find((el) => el.checked);
      return checked ? checked.value : "";
    }
    return els[0].value.trim();
  }

  function show(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }
  function hide(el) {
    if (!el) return;
    el.hidden = true;
    el.textContent = "";
  }
});
