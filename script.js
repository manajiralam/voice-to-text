// 1. Grab HTML elements
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const statusText = document.getElementById("status");
const output = document.getElementById("output");

const dropdown = document.getElementById("dropdown");
const langToggle = document.getElementById("langToggle");
const langLabel = document.getElementById("langLabel");
const langMenu = document.getElementById("langMenu");
const langSearch = document.getElementById("langSearch");
const langList = document.getElementById("langList");

// Small helper to show an icon + message in the status line
function setStatus(iconClass, message) {
  statusText.innerHTML = `<i class="${iconClass}"></i> ${message}`;
}

// 2. Check browser support
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  setStatus(
    "fa-solid fa-triangle-exclamation",
    "Your browser is not supported. Please use Chrome."
  );
  startBtn.disabled = true;
  stopBtn.disabled = true;
  langToggle.disabled = true;
} else {
  // 3. Create the recognition object
  let currentCode = "bn-BD"; // starting language: Bangla

  const recognition = new SpeechRecognition();
  recognition.lang = currentCode;
  recognition.continuous = true;
  recognition.interimResults = true;

  let finalText = "";
  let isListening = false;
  let restartPending = false;
  let currentMatches = []; // search results

  // 4. Show the language list (filtered by search)
  function renderLanguages(query = "") {
    const q = query.trim().toLowerCase();

    currentMatches = languages.filter(([name, native, code]) =>
      (name + " " + native + " " + code).toLowerCase().includes(q)
    );

    langList.innerHTML = "";

    if (currentMatches.length === 0) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No language found";
      langList.appendChild(li);
      return;
    }

    currentMatches.forEach(([name, , code]) => {
      const li = document.createElement("li");
      li.textContent = name; // show only the English name

      if (code === currentCode) {
        li.classList.add("active");
      }

      li.addEventListener("click", () => selectLanguage(name, code));
      langList.appendChild(li);
    });
  }

  // 5. Open and close the menu
  function openMenu() {
    langMenu.classList.add("open");
    langSearch.value = "";
    renderLanguages();
    langSearch.focus();
  }

  function closeMenu() {
    langMenu.classList.remove("open");
  }

  langToggle.addEventListener("click", () => {
    if (langMenu.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close the menu when clicking outside
  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) {
      closeMenu();
    }
  });

  // Filter the list while typing
  langSearch.addEventListener("input", () => {
    renderLanguages(langSearch.value);
  });

  // Enter selects the first result, Escape closes the menu
  langSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && currentMatches.length > 0) {
      const [name, , code] = currentMatches[0];
      selectLanguage(name, code);
    }
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  // 6. Select a language
  function selectLanguage(name, code) {
    currentCode = code;
    recognition.lang = code;
    langLabel.textContent = name;
    closeMenu();

    if (isListening) {
      restartPending = true; // restart automatically in the new language
      recognition.stop();
    } else {
      setStatus("fa-solid fa-globe", "Language: " + name);
    }
  }

  // 7. Start button
  startBtn.addEventListener("click", () => {
    if (isListening) return;
    recognition.start();
  });

  // 8. Stop button
  stopBtn.addEventListener("click", () => {
    restartPending = false;
    recognition.stop();
  });

  // 9. Copy button
  copyBtn.addEventListener("click", async () => {
    if (output.value.trim() === "") {
      setStatus("fa-solid fa-circle-exclamation", "Nothing to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(output.value);
      setStatus("fa-solid fa-circle-check", "Copied to clipboard!");
    } catch (error) {
      setStatus("fa-solid fa-circle-xmark", "Could not copy");
    }
  });

  // 10. Clear button
  clearBtn.addEventListener("click", () => {
    finalText = "";
    output.value = "";
    setStatus("fa-solid fa-broom", "Everything cleared");
  });

  // 11. When recording starts
  recognition.onstart = () => {
    isListening = true;
    startBtn.classList.add("recording");
    setStatus("fa-solid fa-microphone-lines", "Listening... speak now");
  };

  // 12. When recording ends
  recognition.onend = () => {
    isListening = false;
    startBtn.classList.remove("recording");

    if (restartPending) {
      restartPending = false;
      recognition.start();
      return;
    }

    setStatus("fa-solid fa-circle-pause", "Stopped");
  };

  // 13. When speech is converted to text
  recognition.onresult = (event) => {
    let interimText = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalText += transcript + " ";
      } else {
        interimText += transcript;
      }
    }

    output.value = finalText + interimText;
  };

  // 14. When an error happens
  recognition.onerror = (event) => {
    restartPending = false;
    setStatus("fa-solid fa-circle-xmark", "Error: " + event.error);
  };
}