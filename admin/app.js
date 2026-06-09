const ACCESS_KEY_HASH = "efedbff7f2d6c18b6ccf13eebfbe3d611de7b812be82a136b99befe12b29ec70";
const ACCESS_SESSION_KEY = "xiaoten-links-admin-authorized";
const THEME_STORAGE_KEY = "xiaoten-links-admin-theme";

const CATEGORY_META = {
    friends: { label: "朋友", hint: "互相关注的博主朋友" },
    experts: { label: "大佬", hint: "技术大牛、行业专家" },
    groups: { label: "联盟组织", hint: "博客联盟和聚合组织" }
};

const state = {
    data: { friends: [], experts: [], groups: [] },
    category: "friends",
    editing: null,
    dirty: false,
    query: ""
};

const $ = (selector) => document.querySelector(selector);

const els = {
    authGate: $("#authGate"),
    authForm: $("#authForm"),
    appShell: $("#appShell"),
    accessKeyField: $("#accessKeyField"),
    categoryList: $("#categoryList"),
    linksTable: $("#linksTable"),
    totalCount: $("#totalCount"),
    categoryCount: $("#categoryCount"),
    srcCount: $("#srcCount"),
    md5Count: $("#md5Count"),
    tableTitle: $("#tableTitle"),
    tableHint: $("#tableHint"),
    dirtyBadge: $("#dirtyBadge"),
    searchInput: $("#searchInput"),
    importFile: $("#importFile"),
    resetButton: $("#resetButton"),
    themeButton: $("#themeButton"),
    logoutButton: $("#logoutButton"),
    copyButton: $("#copyButton"),
    downloadButton: $("#downloadButton"),
    addButton: $("#addButton"),
    validateButton: $("#validateButton"),
    form: $("#linkForm"),
    formTitle: $("#formTitle"),
    categoryField: $("#categoryField"),
    nameField: $("#nameField"),
    urlField: $("#urlField"),
    srcField: $("#srcField"),
    md5Field: $("#md5Field"),
    desField: $("#desField"),
    previewName: $("#previewName"),
    previewDescription: $("#previewDescription"),
    avatarPreview: $("#avatarPreview"),
    clearButton: $("#clearButton"),
    toast: $("#toast")
};

function normalizeData(input) {
    return Object.keys(CATEGORY_META).reduce((next, key) => {
        next[key] = Array.isArray(input?.[key])
            ? input[key].map((item) => ({
                name: String(item.name || "").trim(),
                url: String(item.url || "").trim(),
                ...(item.src ? { src: String(item.src).trim() } : {}),
                ...(item.md5 ? { md5: String(item.md5).trim() } : {}),
                des: String(item.des || "")
            }))
            : [];
        return next;
    }, {});
}

function serializeData() {
    return JSON.stringify(state.data, null, 4) + "\n";
}

function allLinks() {
    return Object.values(state.data).flat();
}

function currentLinks() {
    const query = state.query.trim().toLowerCase();
    const links = state.data[state.category] || [];
    if (!query) return links;

    return links.filter((link) => {
        return [link.name, link.url, link.des, link.src, link.md5]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query));
    });
}

function setDirty(value) {
    state.dirty = value;
    els.dirtyBadge.hidden = !value;
}

function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
        els.toast.classList.remove("is-visible");
    }, 2400);
}

function preferredTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    els.themeButton.textContent = theme === "dark" ? "浅色模式" : "深色模式";
}

function toggleTheme() {
    const current = document.documentElement.dataset.theme || preferredTheme();
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
}

async function sha256(value) {
    if (!window.crypto?.subtle) {
        throw new Error("crypto.subtle unavailable");
    }
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

function unlockApp() {
    els.authGate.hidden = true;
    els.appShell.inert = false;
    loadRepositoryData();
}

function lockApp() {
    sessionStorage.removeItem(ACCESS_SESSION_KEY);
    els.appShell.inert = true;
    els.authGate.hidden = false;
    els.accessKeyField.value = "";
    els.accessKeyField.focus();
}

async function verifyAccess(event) {
    event.preventDefault();
    try {
        const hash = await sha256(els.accessKeyField.value);
        if (hash !== ACCESS_KEY_HASH) {
            showToast("访问口令不正确。");
            return;
        }
        sessionStorage.setItem(ACCESS_SESSION_KEY, "1");
        unlockApp();
    } catch (error) {
        showToast("当前打开方式不支持口令校验，请使用 HTTPS 或 localhost。");
    }
}

function avatarUrl(link) {
    if (link.src) return link.src;
    if (link.md5) return `https://www.gravatar.com/avatar/${link.md5}?s=96&d=identicon`;
    return "";
}

function createAvatar(link) {
    const box = document.createElement("div");
    box.className = "site-avatar";
    const url = avatarUrl(link);
    if (url) {
        const img = document.createElement("img");
        img.src = url;
        img.alt = "";
        img.loading = "lazy";
        img.referrerPolicy = "no-referrer";
        img.onerror = () => {
            box.textContent = (link.name || "十").slice(0, 1);
        };
        box.append(img);
    } else {
        box.textContent = (link.name || "十").slice(0, 1);
    }
    return box;
}

function renderCategories() {
    els.categoryList.replaceChildren();
    Object.entries(CATEGORY_META).forEach(([key, meta]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "category-button";
        button.setAttribute("aria-current", String(state.category === key));
        button.innerHTML = `
            <span><strong>${meta.label}</strong><span>${meta.hint}</span></span>
            <strong>${state.data[key]?.length || 0}</strong>
        `;
        button.addEventListener("click", () => {
            state.category = key;
            state.editing = null;
            els.categoryField.value = key;
            render();
        });
        els.categoryList.append(button);
    });
}

function renderMetrics() {
    const links = allLinks();
    els.totalCount.textContent = links.length;
    els.categoryCount.textContent = state.data[state.category]?.length || 0;
    els.srcCount.textContent = links.filter((link) => link.src).length;
    els.md5Count.textContent = links.filter((link) => link.md5).length;
}

function renderTable() {
    const meta = CATEGORY_META[state.category];
    els.tableTitle.textContent = meta.label;
    els.tableHint.textContent = `${meta.hint}，支持编辑、删除和上下移动。`;
    els.linksTable.replaceChildren();

    const links = currentLinks();
    if (!links.length) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="4" class="empty-state">当前筛选下没有友链。</td>`;
        els.linksTable.append(row);
        return;
    }

    links.forEach((link) => {
        const index = state.data[state.category].indexOf(link);
        const row = document.createElement("tr");
        const siteCell = document.createElement("td");
        const site = document.createElement("div");
        site.className = "site-cell";
        site.append(createAvatar(link));
        const siteText = document.createElement("div");
        siteText.innerHTML = `
            <span class="site-name"></span>
            <span class="description"></span>
        `;
        siteText.querySelector(".site-name").textContent = link.name || "未命名";
        siteText.querySelector(".description").textContent = link.des || "无描述";
        site.append(siteText);
        siteCell.append(site);

        const urlCell = document.createElement("td");
        const linkEl = document.createElement("a");
        linkEl.className = "table-link";
        linkEl.href = link.url;
        linkEl.target = "_blank";
        linkEl.rel = "noreferrer";
        linkEl.textContent = link.url;
        urlCell.append(linkEl);

        const assetCell = document.createElement("td");
        const asset = document.createElement("span");
        asset.className = "asset-pill";
        asset.textContent = link.src ? "src" : link.md5 ? "md5" : "missing";
        assetCell.append(asset);

        const actionCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "row-actions";
        actions.append(
            rowButton("↑", () => moveLink(index, -1), index === 0),
            rowButton("↓", () => moveLink(index, 1), index === state.data[state.category].length - 1),
            rowButton("编辑", () => editLink(state.category, index)),
            rowButton("删除", () => deleteLink(index), false, "danger")
        );
        actionCell.append(actions);

        row.append(siteCell, urlCell, assetCell, actionCell);
        els.linksTable.append(row);
    });
}

function rowButton(text, onClick, disabled = false, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.disabled = disabled;
    if (className) button.classList.add(className);
    button.addEventListener("click", onClick);
    return button;
}

function renderPreview() {
    const link = formValue();
    els.previewName.textContent = link.name || "尚未选择站点";
    els.previewDescription.textContent = link.des || link.url || "填写表单后可预览公开侧卡片内容。";
    els.avatarPreview.replaceChildren();
    const url = avatarUrl(link);
    if (url) {
        const img = document.createElement("img");
        img.src = url;
        img.alt = "";
        img.referrerPolicy = "no-referrer";
        img.onerror = () => {
            els.avatarPreview.textContent = (link.name || "十").slice(0, 1);
        };
        els.avatarPreview.append(img);
    } else {
        els.avatarPreview.textContent = (link.name || "十").slice(0, 1);
    }
}

function renderFormTitle() {
    els.formTitle.textContent = state.editing ? "编辑友链" : "新增友链";
}

function render() {
    renderCategories();
    renderMetrics();
    renderTable();
    renderFormTitle();
}

function formValue() {
    const link = {
        name: els.nameField.value.trim(),
        url: els.urlField.value.trim(),
        des: els.desField.value.trim()
    };
    const src = els.srcField.value.trim();
    const md5 = els.md5Field.value.trim();
    if (src) link.src = src;
    if (md5) link.md5 = md5;
    return link;
}

function fillForm(category, link) {
    els.categoryField.value = category;
    els.nameField.value = link?.name || "";
    els.urlField.value = link?.url || "";
    els.srcField.value = link?.src || "";
    els.md5Field.value = link?.md5 || "";
    els.desField.value = link?.des || "";
    renderPreview();
}

function clearForm() {
    state.editing = null;
    fillForm(state.category, {});
    renderFormTitle();
}

function editLink(category, index) {
    state.editing = { category, index };
    fillForm(category, state.data[category][index]);
    renderFormTitle();
}

function saveLink(event) {
    event.preventDefault();
    const category = els.categoryField.value;
    const link = formValue();

    if (!link.name || !link.url) {
        showToast("博客名称和地址为必填项。");
        return;
    }

    if (!link.src && !link.md5) {
        showToast("头像地址和 Gravatar MD5 至少填写一个。");
        return;
    }

    const duplicate = allLinks().find((item) => {
        const isEditingTarget = state.editing
            && state.data[state.editing.category][state.editing.index] === item;
        return !isEditingTarget && item.url === link.url;
    });
    if (duplicate) {
        showToast(`已存在相同地址：${duplicate.name}`);
        return;
    }

    if (state.editing) {
        const old = state.editing;
        state.data[old.category].splice(old.index, 1);
        state.data[category].push(link);
        state.category = category;
        showToast("友链已更新。");
    } else {
        state.data[category].push(link);
        state.category = category;
        showToast("友链已新增。");
    }

    setDirty(true);
    clearForm();
    render();
}

function moveLink(index, direction) {
    const links = state.data[state.category];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= links.length) return;
    const [item] = links.splice(index, 1);
    links.splice(nextIndex, 0, item);
    setDirty(true);
    render();
}

function deleteLink(index) {
    const [removed] = state.data[state.category].splice(index, 1);
    if (state.editing?.category === state.category && state.editing.index === index) {
        clearForm();
    }
    setDirty(true);
    render();
    showToast(`已删除：${removed.name}`);
}

function validateDuplicates() {
    const seen = new Map();
    const duplicates = [];
    Object.entries(state.data).forEach(([category, links]) => {
        links.forEach((link) => {
            if (!link.url) return;
            if (seen.has(link.url)) {
                duplicates.push(`${link.name} / ${seen.get(link.url)}`);
            } else {
                seen.set(link.url, `${CATEGORY_META[category].label}:${link.name}`);
            }
        });
    });
    showToast(duplicates.length ? `发现重复：${duplicates.join("；")}` : "未发现重复地址。");
}

async function loadRepositoryData() {
    try {
        const response = await fetch("../links.json", { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        state.data = normalizeData(await response.json());
        setDirty(false);
        clearForm();
        render();
        showToast("已载入仓库 links.json。");
    } catch (error) {
        render();
        showToast("无法自动读取 links.json，可使用导入 JSON。");
    }
}

function importJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            state.data = normalizeData(JSON.parse(reader.result));
            state.category = "friends";
            setDirty(true);
            clearForm();
            render();
            showToast("JSON 已导入。");
        } catch (error) {
            showToast("JSON 解析失败。");
        }
    };
    reader.readAsText(file);
}

async function copyJson() {
    const json = serializeData();
    try {
        await navigator.clipboard.writeText(json);
        setDirty(false);
        showToast("JSON 已复制。");
    } catch (error) {
        showToast("浏览器不允许复制，请下载 JSON。");
    }
}

function downloadJson() {
    const blob = new Blob([serializeData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "links.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setDirty(false);
    showToast("links.json 已下载。");
}

els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderTable();
});
els.importFile.addEventListener("change", (event) => importJson(event.target.files[0]));
els.resetButton.addEventListener("click", loadRepositoryData);
els.themeButton.addEventListener("click", toggleTheme);
els.logoutButton.addEventListener("click", lockApp);
els.copyButton.addEventListener("click", copyJson);
els.downloadButton.addEventListener("click", downloadJson);
els.addButton.addEventListener("click", clearForm);
els.validateButton.addEventListener("click", validateDuplicates);
els.form.addEventListener("submit", saveLink);
els.authForm.addEventListener("submit", verifyAccess);
els.clearButton.addEventListener("click", clearForm);
[els.nameField, els.urlField, els.srcField, els.md5Field, els.desField].forEach((field) => {
    field.addEventListener("input", renderPreview);
});
els.categoryField.addEventListener("change", () => {
    state.category = els.categoryField.value;
    render();
});

applyTheme(preferredTheme());

if (sessionStorage.getItem(ACCESS_SESSION_KEY) === "1") {
    unlockApp();
} else {
    lockApp();
}
