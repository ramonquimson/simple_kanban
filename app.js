(() => {
  const STAGES = [
    "Oxygen",
    "Flash",
    "Qualify",
    "Monetization Check",
    "Research",
    "Design",
    "Build",
    "Ship",
    "Archive"
  ];

  const DOMAINS = ["QO", "NQ", "Personal", "Family", "Oxygen"];
  const ENERGIES = ["Low", "Med", "Deep"];
  const WIP_LIMITS = { Oxygen: 2, Build: 3 };
  const STORAGE_KEY = "simple-kanban-v1_2";

  const domainColors = {
    QO: "#166b62",
    NQ: "#704f1f",
    Personal: "#255d99",
    Family: "#8a4f8f",
    Oxygen: "#a1362d"
  };

  const energyColors = {
    Low: "#4f8a63",
    Med: "#c18d1f",
    Deep: "#8f2e2e"
  };

  const $ = (id) => document.getElementById(id);

  const state = {
    cards: [],
    activeColumn: 0,
    selectedCardId: null,
    touchX: null
  };

  const columnsTrack = $("columnsTrack");
  const boardViewport = $("boardViewport");
  const columnLabel = $("columnLabel");
  const cardModal = $("cardModal");
  const cardEditor = $("cardEditor");
  const modalTitle = $("modalTitle");

  function nowIso() {
    return new Date().toISOString();
  }

  function logLine(msg) {
    return `${new Date().toLocaleString()} - ${msg}`;
  }

  function withTrimmedLog(log) {
    return log.slice(-10);
  }

  function stageIndex(stage) {
    return STAGES.indexOf(stage);
  }

  function createCard(input) {
    const id = `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return {
      id,
      title: input.title.trim(),
      domain: input.domain,
      energy: input.energy,
      stage: input.stage,
      primaryLink: input.primaryLink.trim(),
      repoLink: input.repoLink?.trim() || null,
      caption: input.caption.trim(),
      log: [logLine(`Created in ${input.stage}`)],
      createdAt: nowIso(),
      nonMonetary: Boolean(input.nonMonetary),
      monetizationPassed: Boolean(input.monetizationPassed)
    };
  }

  function normalizeCard(card) {
    const normalizedStage = STAGES.includes(card.stage) ? card.stage : "Flash";
    const repoAllowed = stageIndex(normalizedStage) >= stageIndex("Design");
    return {
      id: String(card.id || `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
      title: String(card.title || "Untitled"),
      domain: DOMAINS.includes(card.domain) ? card.domain : "QO",
      energy: ENERGIES.includes(card.energy) ? card.energy : "Med",
      stage: normalizedStage,
      primaryLink: String(card.primaryLink || ""),
      repoLink: repoAllowed && card.repoLink ? String(card.repoLink) : null,
      caption: String(card.caption || ""),
      log: withTrimmedLog(Array.isArray(card.log) ? card.log.map(String) : []),
      createdAt: String(card.createdAt || nowIso()),
      nonMonetary: Boolean(card.nonMonetary),
      monetizationPassed: Boolean(card.monetizationPassed)
    };
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: "1.2", cards: state.cards }));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.cards)) return;
      state.cards = parsed.cards.map(normalizeCard).filter((c) => c.primaryLink);
    } catch {
      state.cards = [];
    }
  }

  function countStage(stage) {
    return state.cards.filter((c) => c.stage === stage).length;
  }

  function canEnterStage(card, targetStage) {
    if (WIP_LIMITS[targetStage] && countStage(targetStage) >= WIP_LIMITS[targetStage] && card.stage !== targetStage) {
      return { ok: false, reason: `${targetStage} WIP limit reached` };
    }

    if (targetStage === "Build" && !card.nonMonetary && !card.monetizationPassed) {
      return { ok: false, reason: "Build blocked: pass Monetization Check or tag Non-Monetary" };
    }

    return { ok: true };
  }

  function appendCardLog(card, message) {
    card.log = withTrimmedLog([...(card.log || []), logLine(message)]);
  }

  function render() {
    columnsTrack.innerHTML = "";

    STAGES.forEach((stage) => {
      const col = document.createElement("section");
      col.className = "column";

      const header = document.createElement("div");
      header.className = "column-head";

      const title = document.createElement("h2");
      title.textContent = stage;

      const limit = document.createElement("span");
      limit.className = "limit";
      limit.textContent = WIP_LIMITS[stage] ? `${countStage(stage)} / ${WIP_LIMITS[stage]}` : `${countStage(stage)} cards`;

      header.append(title, limit);
      col.appendChild(header);

      const helper = document.createElement("div");
      helper.className = "limit";
      helper.textContent = stage === "Build" ? "No redesign here." : stage === "Monetization Check" ? "Presell and demand validation." : "";
      col.appendChild(helper);

      const list = document.createElement("div");
      list.className = "card-list";
      const cards = state.cards.filter((c) => c.stage === stage);

      if (!cards.length) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "No cards";
        list.appendChild(empty);
      }

      cards.forEach((card) => {
        const node = $("cardTemplate").content.firstElementChild.cloneNode(true);
        node.querySelector(".card-title").textContent = card.title;
        node.querySelector(".domain-strip").style.background = domainColors[card.domain] || "#666";
        node.querySelector(".energy-dot").style.background = energyColors[card.energy] || "#666";

        node.addEventListener("click", () => openCardModal(card.id));
        node.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openCardModal(card.id);
          }
        });

        list.appendChild(node);
      });

      col.appendChild(list);
      columnsTrack.appendChild(col);
    });

    syncColumnPosition();
  }

  function syncColumnPosition() {
    const maxIndex = STAGES.length - 1;
    state.activeColumn = Math.max(0, Math.min(maxIndex, state.activeColumn));
    columnsTrack.style.transform = `translateX(-${state.activeColumn * 100}%)`;
    columnLabel.textContent = `Column: ${STAGES[state.activeColumn]} (${state.activeColumn + 1}/${STAGES.length})`;
  }

  function chooseDefaultColumn() {
    if (window.innerWidth < 768) {
      state.activeColumn = countStage("Oxygen") > 0 ? stageIndex("Oxygen") : stageIndex("Flash");
    } else {
      state.activeColumn = stageIndex("Build");
    }
    syncColumnPosition();
  }

  function moveCard(card, targetStage) {
    const result = canEnterStage(card, targetStage);
    if (!result.ok) {
      alert(result.reason);
      return false;
    }

    if (card.stage !== targetStage) {
      card.stage = targetStage;
      if (stageIndex(targetStage) < stageIndex("Design")) {
        card.repoLink = null;
      }
      appendCardLog(card, `Moved to ${targetStage}`);
      save();
      render();
    }
    return true;
  }

  function makeField(labelText, inputEl, full = false) {
    const wrapper = document.createElement("div");
    wrapper.className = `field${full ? " full" : ""}`;
    const label = document.createElement("label");
    label.textContent = labelText;
    wrapper.append(label, inputEl);
    return wrapper;
  }

  function linkButton(url, text) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text;
    btn.addEventListener("click", () => window.open(url, "_blank", "noopener"));
    return btn;
  }

  function openCardModal(cardId) {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;

    state.selectedCardId = cardId;
    modalTitle.textContent = card.title;
    cardEditor.innerHTML = "";

    const titleInput = document.createElement("input");
    titleInput.value = card.title;

    const domainSel = document.createElement("select");
    DOMAINS.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      opt.selected = card.domain === d;
      domainSel.appendChild(opt);
    });

    const energySel = document.createElement("select");
    ENERGIES.forEach((e) => {
      const opt = document.createElement("option");
      opt.value = e;
      opt.textContent = e;
      opt.selected = card.energy === e;
      energySel.appendChild(opt);
    });

    const captionInput = document.createElement("textarea");
    captionInput.value = card.caption;

    const primaryInput = document.createElement("input");
    primaryInput.value = card.primaryLink;
    primaryInput.type = "url";

    const repoInput = document.createElement("input");
    repoInput.value = card.repoLink || "";
    repoInput.type = "url";
    repoInput.placeholder = "https://repo...";
    repoInput.disabled = stageIndex(card.stage) < stageIndex("Design");

    const nonMonetaryWrap = document.createElement("div");
    nonMonetaryWrap.className = "field";
    const nonMonetaryLabel = document.createElement("label");
    nonMonetaryLabel.textContent = "Non-Monetary tag";
    const nonMonetaryCheck = document.createElement("input");
    nonMonetaryCheck.type = "checkbox";
    nonMonetaryCheck.checked = card.nonMonetary;
    nonMonetaryWrap.append(nonMonetaryLabel, nonMonetaryCheck);

    const actions = document.createElement("div");
    actions.className = "field full";

    const actionRow = document.createElement("div");
    actionRow.className = "inline-actions";
    actionRow.appendChild(linkButton(card.primaryLink, "Open Primary"));
    if (card.repoLink && stageIndex(card.stage) >= stageIndex("Design")) {
      actionRow.appendChild(linkButton(card.repoLink, "Open Repo"));
    }

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.textContent = "Save Card";
    saveBtn.addEventListener("click", () => {
      const nextTitle = titleInput.value.trim();
      const nextPrimary = primaryInput.value.trim();
      if (!nextTitle || !nextPrimary) {
        alert("Title and Primary link are required");
        return;
      }

      const oldCaption = card.caption;
      card.title = nextTitle;
      card.domain = domainSel.value;
      card.energy = energySel.value;
      card.primaryLink = nextPrimary;
      card.nonMonetary = nonMonetaryCheck.checked;
      card.caption = captionInput.value.trim();

      if (stageIndex(card.stage) >= stageIndex("Design")) {
        card.repoLink = repoInput.value.trim() || null;
      } else {
        card.repoLink = null;
      }

      if (oldCaption !== card.caption) {
        appendCardLog(card, "Caption updated");
      }

      save();
      render();
      modalTitle.textContent = card.title;
      alert("Saved");
    });

    actionRow.appendChild(saveBtn);
    actions.appendChild(actionRow);

    const moveWrap = document.createElement("div");
    moveWrap.className = "field full";
    const moveLabel = document.createElement("label");
    moveLabel.textContent = "Move Stage";

    const moveRow = document.createElement("div");
    moveRow.className = "inline-actions";

    const moveSel = document.createElement("select");
    STAGES.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      opt.selected = card.stage === s;
      moveSel.appendChild(opt);
    });

    const moveBtn = document.createElement("button");
    moveBtn.type = "button";
    moveBtn.textContent = "Move";
    moveBtn.addEventListener("click", () => {
      if (moveCard(card, moveSel.value)) {
        openCardModal(card.id);
      }
    });

    moveRow.append(moveSel, moveBtn);

    if (card.stage === "Monetization Check") {
      const noSignal = document.createElement("button");
      noSignal.type = "button";
      noSignal.textContent = "No Signal -> Archive";
      noSignal.addEventListener("click", () => {
        moveCard(card, "Archive");
        openCardModal(card.id);
      });

      const soft = document.createElement("button");
      soft.type = "button";
      soft.textContent = "Soft Signal -> Design";
      soft.addEventListener("click", () => {
        card.monetizationPassed = true;
        appendCardLog(card, "Monetization: Soft Signal");
        moveCard(card, "Design");
        openCardModal(card.id);
      });

      const hard = document.createElement("button");
      hard.type = "button";
      hard.textContent = "Hard Signal -> Build";
      hard.addEventListener("click", () => {
        card.monetizationPassed = true;
        appendCardLog(card, "Monetization: Hard Signal");
        moveCard(card, "Build");
        openCardModal(card.id);
      });

      moveRow.append(noSignal, soft, hard);
    }

    moveWrap.append(moveLabel, moveRow);

    const historyWrap = document.createElement("details");
    historyWrap.className = "field full";
    const summary = document.createElement("summary");
    summary.textContent = "History";
    const history = document.createElement("div");
    history.className = "history";
    history.textContent = (card.log || []).slice().reverse().join("\n");
    historyWrap.append(summary, history);

    cardEditor.append(
      makeField("Title", titleInput),
      makeField("Domain", domainSel),
      makeField("Energy", energySel),
      nonMonetaryWrap,
      makeField("Primary Link", primaryInput, true),
      makeField("Repo Link", repoInput, true),
      makeField("Caption", captionInput, true),
      actions,
      moveWrap,
      historyWrap
    );

    $("deleteCardBtn").onclick = () => {
      if (!confirm("Delete this card?")) return;
      state.cards = state.cards.filter((c) => c.id !== card.id);
      save();
      render();
      cardModal.close();
    };

    if (!cardModal.open) {
      cardModal.showModal();
    }
  }

  function openAddCardModal() {
    state.selectedCardId = null;
    modalTitle.textContent = "Add Card";
    cardEditor.innerHTML = "";

    const titleInput = document.createElement("input");
    const domainSel = document.createElement("select");
    DOMAINS.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      domainSel.appendChild(opt);
    });

    const energySel = document.createElement("select");
    ENERGIES.forEach((e) => {
      const opt = document.createElement("option");
      opt.value = e;
      opt.textContent = e;
      energySel.appendChild(opt);
    });

    const stageSel = document.createElement("select");
    STAGES.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      opt.selected = s === STAGES[state.activeColumn];
      stageSel.appendChild(opt);
    });

    const primaryInput = document.createElement("input");
    primaryInput.type = "url";

    const repoInput = document.createElement("input");
    repoInput.type = "url";
    repoInput.disabled = stageIndex(stageSel.value) < stageIndex("Design");

    stageSel.addEventListener("change", () => {
      repoInput.disabled = stageIndex(stageSel.value) < stageIndex("Design");
      if (repoInput.disabled) repoInput.value = "";
    });

    const captionInput = document.createElement("textarea");
    const nonMonetaryCheck = document.createElement("input");
    nonMonetaryCheck.type = "checkbox";

    const createRow = document.createElement("div");
    createRow.className = "field full";
    const createBtn = document.createElement("button");
    createBtn.type = "button";
    createBtn.textContent = "Create Card";
    createBtn.addEventListener("click", () => {
      const draft = createCard({
        title: titleInput.value,
        domain: domainSel.value,
        energy: energySel.value,
        stage: stageSel.value,
        primaryLink: primaryInput.value,
        repoLink: repoInput.value,
        caption: captionInput.value,
        nonMonetary: nonMonetaryCheck.checked
      });

      if (!draft.title || !draft.primaryLink) {
        alert("Title and Primary link are required");
        return;
      }

      const stageCheck = canEnterStage(draft, draft.stage);
      if (!stageCheck.ok) {
        alert(stageCheck.reason);
        return;
      }

      if (draft.stage === "Build" && !draft.nonMonetary && !draft.monetizationPassed) {
        alert("Build blocked: pass Monetization Check or tag Non-Monetary");
        return;
      }

      state.cards.push(draft);
      save();
      render();
      cardModal.close();
    });
    createRow.appendChild(createBtn);

    const nonMonWrap = document.createElement("div");
    nonMonWrap.className = "field";
    const nonMonLabel = document.createElement("label");
    nonMonLabel.textContent = "Non-Monetary tag";
    nonMonWrap.append(nonMonLabel, nonMonetaryCheck);

    cardEditor.append(
      makeField("Title", titleInput),
      makeField("Domain", domainSel),
      makeField("Energy", energySel),
      nonMonWrap,
      makeField("Stage", stageSel),
      makeField("Primary Link", primaryInput, true),
      makeField("Repo Link", repoInput, true),
      makeField("Caption", captionInput, true),
      createRow
    );

    $("deleteCardBtn").onclick = null;

    if (!cardModal.open) {
      cardModal.showModal();
    }
  }

  function exportJson() {
    const payload = {
      version: "1.2",
      exportedAt: nowIso(),
      cards: state.cards
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simple-kanban-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.cards)) {
      throw new Error("Invalid JSON: expected { cards: [...] }");
    }
    const imported = parsed.cards.map(normalizeCard).filter((c) => c.primaryLink);
    state.cards = imported;
    save();
    render();
  }

  function bindEvents() {
    $("prevColBtn").addEventListener("click", () => {
      state.activeColumn -= 1;
      syncColumnPosition();
    });

    $("nextColBtn").addEventListener("click", () => {
      state.activeColumn += 1;
      syncColumnPosition();
    });

    boardViewport.addEventListener("touchstart", (e) => {
      state.touchX = e.changedTouches[0]?.clientX ?? null;
    });

    boardViewport.addEventListener("touchend", (e) => {
      if (state.touchX == null) return;
      const endX = e.changedTouches[0]?.clientX ?? state.touchX;
      const dx = endX - state.touchX;
      if (Math.abs(dx) > 50) {
        state.activeColumn += dx < 0 ? 1 : -1;
        syncColumnPosition();
      }
      state.touchX = null;
    });

    window.addEventListener("resize", () => syncColumnPosition());

    $("addCardBtn").addEventListener("click", openAddCardModal);
    $("closeModalBtn").addEventListener("click", () => cardModal.close());

    $("exportBtn").addEventListener("click", exportJson);

    $("importBtn").addEventListener("click", () => $("importInput").click());

    $("importInput").addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await importJson(file);
        alert("Import complete");
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      } finally {
        e.target.value = "";
      }
    });
  }

  function init() {
    load();
    render();
    chooseDefaultColumn();
    bindEvents();
  }

  init();
})();
