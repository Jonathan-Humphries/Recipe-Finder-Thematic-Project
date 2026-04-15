// ── API Helper ───────────────────────────────────────────────

const API = {
  base: '/api',

  token() {
    return localStorage.getItem('freshly_token');
  },

  headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const t = this.token();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },

  async get(path) {
    const res = await fetch(this.base + path, { headers: this.headers() });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(this.base + path, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async put(path, body) {
    const res = await fetch(this.base + path, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async delete(path) {
    const res = await fetch(this.base + path, {
      method: 'DELETE',
      headers: this.headers()
    });
    if (!res.ok) throw await res.json();
    return res.json();
  }
};

// ── Session helpers ──────────────────────────────────────────

function getUser() {
  try { return JSON.parse(localStorage.getItem('freshly_user') || 'null'); }
  catch { return null; }
}

function setUser(token, user) {
  localStorage.setItem('freshly_token', token);
  localStorage.setItem('freshly_user', JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem('freshly_token');
  localStorage.removeItem('freshly_user');
}

function isLoggedIn() {
  return !!getUser() && !!API.token();
}

// ── Toast ────────────────────────────────────────────────────

function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent  = message;
  toast.className    = `toast ${type}`;
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Nav Auth UI (shared across pages) ────────────────────────

function updateNavAuth() {
  const user       = getUser();
  const authBtns   = document.getElementById('nav-auth-btns');
  const userMenu   = document.getElementById('nav-user-menu');
  const avatarEl   = document.getElementById('user-avatar');
  const nameEl     = document.getElementById('user-name-display');

  if (user) {
    if (authBtns) authBtns.style.display = 'none';
    if (userMenu) userMenu.style.display  = 'flex';
    if (avatarEl) avatarEl.textContent    = initials(user.name || user.email);
    if (nameEl)   nameEl.textContent      = user.name || user.email.split('@')[0];
  } else {
    if (authBtns) authBtns.style.display = 'flex';
    if (userMenu) userMenu.style.display  = 'none';
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.onclick = async () => {
      try { await API.post('/auth/logout', {}); } catch (_) {}
      clearUser();
      window.location.href = 'index.html';
    };
  }
}

function initials(str = '') {
  return str.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';
}


//  PAGE: LOGIN

function initLoginPage() {
  const form       = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passInput  = document.getElementById('password');
  const submitBtn  = document.getElementById('btn-submit');
  const togglePass = document.getElementById('toggle-password');

  if (!form) return;

  // Redirect if already logged in
  if (isLoggedIn()) { window.location.href = 'index.html'; return; }

  if (togglePass) {
    togglePass.addEventListener('click', () => {
      const isText = passInput.type === 'text';
      passInput.type = isText ? 'password' : 'text';
      togglePass.textContent = isText ? '👁' : '🙈';
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearFormErrors();

    const email    = emailInput.value.trim();
    const password = passInput.value;

    if (!email || !isValidEmail(email)) {
      return showFieldError('email-error', emailInput, 'Please enter a valid email address');
    }
    if (!password) {
      return showFieldError('pass-error', passInput, 'Please enter your password');
    }

    submitBtn.textContent = 'Signing in…';
    submitBtn.disabled    = true;

    try {
      const data = await API.post('/auth/login', { email, password });
      setUser(data.token, data.user);
      submitBtn.textContent = '✓ Signed in!';
      submitBtn.style.background = '#2d5a3d';
      const redirect = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
      setTimeout(() => window.location.href = redirect, 700);
    } catch (err) {
      submitBtn.textContent = 'Sign in →';
      submitBtn.disabled    = false;
      const msg = err.error || 'Login failed';
      if (msg.toLowerCase().includes('email')) showFieldError('email-error', emailInput, msg);
      else showFieldError('pass-error', passInput, msg);
    }
  });
}

//  PAGE: SIGN UP
function initSignupPage() {
  const form          = document.getElementById('signup-form');
  const nameInput     = document.getElementById('name');
  const emailInput    = document.getElementById('email');
  const passInput     = document.getElementById('password');
  const confirmInput  = document.getElementById('confirm');
  const submitBtn     = document.getElementById('btn-submit');
  const togglePass    = document.getElementById('toggle-password');

  if (!form) return;

  if (isLoggedIn()) { window.location.href = 'index.html'; return; }

  if (togglePass && passInput) {
    togglePass.addEventListener('click', () => {
      const isText = passInput.type === 'text';
      passInput.type = isText ? 'password' : 'text';
      togglePass.textContent = isText ? '👁' : '🙈';
    });
  }


  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearFormErrors();

    const name     = nameInput  ? nameInput.value.trim()  : '';
    const email    = emailInput.value.trim();
    const password = passInput.value;
    const confirm  = confirmInput ? confirmInput.value : '';

    if (!name) return showFieldError('name-error', nameInput, 'Please enter your name');
    if (!email || !isValidEmail(email)) return showFieldError('email-error', emailInput, 'Please enter a valid email');
    if (password.length < 6) return showFieldError('pass-error', passInput, 'Password must be at least 6 characters');
    if (password !== confirm) return showFieldError('confirm-error', confirmInput, 'Passwords do not match');

    submitBtn.textContent = 'Creating account…';
    submitBtn.disabled    = true;

    try {
      const data = await API.post('/auth/signup', { username: name, email, password });
      setUser(data.token, data.user);
      submitBtn.textContent = '✓ Account created!';
      submitBtn.style.background = '#2d5a3d';
      setTimeout(() => window.location.href = 'index.html', 700);
    } catch (err) {
      submitBtn.textContent = 'Create my account →';
      submitBtn.disabled    = false;
      const msg = err.error || 'Signup failed';
      if (msg.toLowerCase().includes('email')) showFieldError('email-error', emailInput, msg);
      else showFieldError('pass-error', passInput, msg);
    }
  });
}

//  PAGE: INDEX (recipe search + grid)

function initIndexPage() {
  const ingredientInput  = document.getElementById('ingredient-input');
  const selectedTagsWrap = document.querySelector('.selected-ingredients');
  const countBubble      = document.querySelector('.count-bubble');
  const recipeGrid       = document.getElementById('recipe-display');
  const resultsTitle     = document.querySelector('.results-title');
  const resultsCount     = document.querySelector('.results-count');
  const sortSelect       = document.getElementById('sort-select');
  const filterChips      = document.querySelectorAll('.filter-chip');
  const btnFind          = document.querySelector('.btn-find-recipes');
  const quickTags        = document.querySelectorAll('.quick-tag');
  const autocompleteList = document.getElementById('autocomplete-list');

  if (!recipeGrid) return;

  updateNavAuth();

  let selectedIngredients = [];
  let activeFilters       = [];
  let allIngredients      = [];
  let allRecipes          = [];
  let savedIds            = [];

  // Load ingredients for autocomplete
  API.get('/ingredients').then(data => {
    allIngredients = data;
  }).catch(() => {});

  // Load saved recipe IDs if logged in
  async function loadSavedIds() {
    if (!isLoggedIn()) { savedIds = []; return; }
    try { savedIds = await API.get('/saved/ids'); }
    catch { savedIds = []; }
  }

  // Initial load
  (async () => {
    await loadSavedIds();
    allRecipes = await API.get('/recipes').catch(() => []);
    renderCards(allRecipes);
  })();

  // ── Autocomplete ───────────────────────────────────────────
  if (ingredientInput) {
    ingredientInput.addEventListener('input', () => {
      const val = ingredientInput.value.trim().toLowerCase();
      if (!val || !autocompleteList) { closeAutocomplete(); return; }
      const matches = allIngredients
        .filter(n => n.toLowerCase().includes(val) && !selectedIngredients.includes(n.toLowerCase()))
        .slice(0, 8);
      if (matches.length === 0) { closeAutocomplete(); return; }
      autocompleteList.innerHTML = matches.map(m =>
        `<div class="autocomplete-item" data-value="${m}">${m}</div>`
      ).join('');
      autocompleteList.classList.add('visible');
    });

    ingredientInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const v = ingredientInput.value.trim();
        if (v) addIngredient(v);
      }
      if (e.key === 'Escape') closeAutocomplete();
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.ingredient-input-wrap')) closeAutocomplete();
    });
  }

  if (autocompleteList) {
    autocompleteList.addEventListener('click', e => {
      const item = e.target.closest('.autocomplete-item');
      if (item) addIngredient(item.dataset.value);
    });
  }

  function closeAutocomplete() {
    if (!autocompleteList) return;
    autocompleteList.classList.remove('visible');
    autocompleteList.innerHTML = '';
  }

  function addIngredient(name) {
    const clean = name.toLowerCase().trim();
    if (!clean || selectedIngredients.includes(clean)) {
      if (ingredientInput) ingredientInput.value = '';
      closeAutocomplete();
      return;
    }
    selectedIngredients.push(clean);
    if (ingredientInput) ingredientInput.value = '';
    closeAutocomplete();
    renderTags();
  }

  function removeIngredient(name) {
    selectedIngredients = selectedIngredients.filter(i => i !== name);
    renderTags();
  }

  function renderTags() {
    if (!selectedTagsWrap) return;
    selectedTagsWrap.innerHTML = selectedIngredients.map(ing => `
      <span class="ingredient-tag">
        ${ing}
        <button class="tag-remove" data-ing="${ing}">×</button>
      </span>
    `).join('');
    if (countBubble) countBubble.textContent = selectedIngredients.length;
    selectedTagsWrap.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', () => removeIngredient(btn.dataset.ing));
    });
  }

  // ── Quick tags ──────────────────────────────────────────────
  quickTags.forEach(tag => {
    tag.addEventListener('click', () => {
      addIngredient(tag.textContent.replace(/[^\w\s]/g, '').trim());
    });
  });

  // ── Filters ────────────────────────────────────────────────
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.filter || chip.textContent.trim().toLowerCase();
      chip.classList.toggle('active');
      if (activeFilters.includes(val)) activeFilters = activeFilters.filter(f => f !== val);
      else activeFilters.push(val);
    });
  });

  // ── Find button ────────────────────────────────────────────
  if (btnFind) {
    btnFind.addEventListener('click', async () => {
      const data = await API.post('/recipes/search', {
        ingredients: selectedIngredients,
        dietary:     activeFilters
      }).catch(() => allRecipes);

      let results = data;

      // Client-side sort if select present
      if (sortSelect) {
        const sort = sortSelect.value;
        if (sort === 'time')       results.sort((a, b) => a.time_mins - b.time_mins);
        else if (sort === 'az')    results.sort((a, b) => a.title.localeCompare(b.title));
        else if (sort === 'difficulty') {
          const d = { Easy: 1, Medium: 2, Hard: 3 };
          results.sort((a, b) => d[a.difficulty] - d[b.difficulty]);
        }
      }

      await loadSavedIds();
      renderCards(results);

      document.querySelector('.results-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ── Sort ───────────────────────────────────────────────────
  if (sortSelect) {
    sortSelect.addEventListener('change', () => btnFind?.click());
  }

  // ── Render recipe grid ──────────────────────────────────────
  function renderCards(recipes) {
    if (!recipeGrid) return;

    const title = selectedIngredients.length > 0
      ? `Recipes using ${selectedIngredients.slice(0, 2).join(', ')}${selectedIngredients.length > 2 ? ' & more' : ''}`
      : 'All Recipes';

    if (resultsTitle) resultsTitle.textContent = title;
    if (resultsCount) resultsCount.textContent = `${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}`;

    if (recipes.length === 0) {
      recipeGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"></div>
          <h3 class="empty-state-title">No recipes found</h3>
          <p class="empty-state-text">Try removing a filter or adding different ingredients.</p>
        </div>`;
      return;
    }

    recipeGrid.innerHTML = recipes.map(recipe => buildCard(recipe)).join('');

    // Wire save buttons
    recipeGrid.querySelectorAll('.btn-save-card').forEach(btn => {
      const id = parseInt(btn.dataset.id);
      const saved = savedIds.includes(id);
      btn.innerHTML = saved ? '❤️' : '🤍';

      btn.addEventListener('click', async e => {
        e.preventDefault();
        if (!isLoggedIn()) { showToast('Sign in to save recipes', 'error'); return; }
        try {
          if (savedIds.includes(id)) {
            await API.delete(`/saved/${id}`);
            savedIds = savedIds.filter(s => s !== id);
            btn.innerHTML = '🤍';
            showToast('💔 Removed from saved', 'success');
          } else {
            await API.post(`/saved/${id}`, {});
            savedIds.push(id);
            btn.innerHTML = '❤️';
            showToast('❤️ Recipe saved!', 'success');
          }
        } catch { showToast('Something went wrong', 'error'); }
      });
    });

    // Wire view buttons
    recipeGrid.querySelectorAll('.btn-view-recipe').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = `recipe.html?id=${btn.dataset.id}`;
      });
    });
  }

  function buildCard(recipe) {
    const score = recipe.matchScore ?? 100;
    const scoreLabel = selectedIngredients.length > 0
      ? `${score}% match`
      : `${recipe.ingredients.length} ingredients`;
    const saved = savedIds.includes(recipe.id);

    const dietaryTags = (recipe.dietary || []).slice(0, 2).map(d =>
      `<span class="card-tag dietary">${d}</span>`).join('');
    const catTags = (recipe.tags || []).slice(0, 2).map(t =>
      `<span class="card-tag">${t}</span>`).join('');

    const badgeText = selectedIngredients.length > 0
      ? (score >= 80 ? '✦ Great match' : score >= 50 ? 'Partial match' : 'Low match')
      : recipe.difficulty;

    return `
      <article class="recipe-card">
        <div class="card-image-wrap">
          <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
          <span class="card-badge">${badgeText}</span>
          <button class="btn-save-card" data-id="${recipe.id}">${saved ? '❤️' : '🤍'}</button>
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span class="meta-item"><span class="icon"></span><b>${recipe.time}</b></span>
            <span class="meta-item"><span class="icon"></span><b>Serves ${recipe.servings}</b></span>
            <span class="meta-item"><span class="icon"></span><b>${recipe.difficulty}</b></span>
          </div>
          <h3 class="card-title">${recipe.title}</h3>
          <p class="card-desc">${recipe.description}</p>
          <div class="card-tags">${catTags}${dietaryTags}</div>
        </div>
        <div class="card-footer">
          ${selectedIngredients.length > 0 ? `
            <div class="card-match-bar-wrap">
              <div class="card-match-label">${scoreLabel}</div>
              <div class="card-match-bar">
                <div class="card-match-fill" style="width:${score}%"></div>
              </div>
            </div>` : '<span></span>'}
          <button class="btn-view-recipe" data-id="${recipe.id}">View →</button>
        </div>
      </article>`;
  }
}


//  PAGE: RECIPE DETAIL

function initRecipePage() {
  const params   = new URLSearchParams(window.location.search);
  const recipeId = parseInt(params.get('id'));

  if (!document.getElementById('hero-title')) return; // not recipe page
  if (isNaN(recipeId)) {
    showNotFound(); return;
  }

  updateNavAuth();

  API.get(`/recipes/${recipeId}`)
    .then(recipe => renderRecipePage(recipe))
    .catch(() => showNotFound());

  function showNotFound() {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:1rem;font-family:sans-serif;">
        <h2 style="color:#1a3a2a;">Recipe not found</h2>
        <a href="index.html" style="color:#c4622d;text-decoration:underline;">← Back to recipes</a>
      </div>`;
  }

  function renderRecipePage(recipe) {
    // Hero
    document.getElementById('hero-img').src = recipe.image;
    document.getElementById('hero-img').alt = recipe.name || recipe.title;

    document.getElementById('hero-title').textContent = recipe.name || recipe.title;

    document.getElementById('meta-time').textContent = `${recipe.time_mins} min`;
    document.getElementById('meta-servings').textContent = `Serves ${recipe.servings}`;
    document.getElementById('meta-difficulty').textContent = recipe.difficulty;

    document.getElementById('hero-title-breadcrumb').textContent = recipe.name || recipe.title;

    document.title = `${recipe.name || recipe.title} — Recipe Finders`;

    const diffPill = document.getElementById('difficulty-pill');
    if (diffPill) diffPill.className = `recipe-meta-pill difficulty-${recipe.difficulty.toLowerCase()}`;

    // Description & tags
    const descEl = document.getElementById('recipe-description');
    if (descEl) descEl.textContent = recipe.description;

    const tagsWrap = document.getElementById('recipe-tags');
    if (tagsWrap) {
      tagsWrap.innerHTML = [
        ...(recipe.dietary || []).map(d => `<span class="recipe-tag dietary">${d}</span>`),
        ...(recipe.tags    || []).map(t => `<span class="recipe-tag category">${t}</span>`)
      ].join('');
    }

    // Notes
    const notesEl      = document.getElementById('recipe-notes');
    const notesSection = document.getElementById('notes-section');
    if (recipe.notes && notesEl) {
      notesEl.textContent = recipe.notes;
    } else if (notesSection) {
      notesSection.style.display = 'none';
    }

    // Steps
    const stepsList = document.getElementById('steps-list');
    if (stepsList) {
      stepsList.innerHTML = (recipe.steps || []).map((step, i) => `
        <div class="step-item" title="Click to mark as done">
          <div class="step-number">${i + 1}</div>
          <p class="step-text">${step}</p>
        </div>`).join('');

      stepsList.querySelectorAll('.step-item').forEach(item => {
        item.addEventListener('click', () => item.classList.toggle('completed'));
      });
    }

    // ── Ingredients + Servings scaler ─────────────────────────
    let currentServings = recipe.servings;
    const baseServings  = recipe.servings;

    const servingsCountEl = document.getElementById('servings-count');
    const btnPlus         = document.getElementById('btn-servings-plus') || document.getElementById('btn-plus');
    const btnMinus        = document.getElementById('btn-servings-minus') || document.getElementById('btn-minus');
    const ingredientsList = document.getElementById('ingredients-list');

    function renderIngredients() {
      if (!ingredientsList) return;
      const ratio = currentServings / baseServings;
      ingredientsList.innerHTML = (recipe.ingredients || []).map((ing, i) => {
        const scaled = scaleAmount(ing.quantity, ing.unit, ratio);
        return `
          <div class="ingredient-item" id="ing-item-${i}">
            <div class="ingredient-check" data-check="${i}"></div>
            <span class="ingredient-name">${ing.name}</span>
            <span class="ingredient-amount">${scaled}</span>
          </div>`;
      }).join('');

      ingredientsList.querySelectorAll('.ingredient-check').forEach(chk => {
        chk.addEventListener('click', () => {
          chk.classList.toggle('checked');
          document.getElementById(`ing-item-${chk.dataset.check}`)?.classList.toggle('checked-item');
        });
      });
    }

    function scaleAmount(quantity, unit, ratio) {
      if (!quantity) return unit || '';
      const scaled = Math.round(quantity * ratio * 4) / 4;
      const num    = scaled % 1 === 0 ? scaled : scaled.toFixed(1);
      return unit ? `${num} ${unit}` : `${num}`;
    }

    if (servingsCountEl) servingsCountEl.textContent = currentServings;
    renderIngredients();
    renderNutrition(recipe, currentServings);

    if (btnPlus) {
      btnPlus.addEventListener('click', () => {
        if (currentServings >= 20) return;
        currentServings++;
        if (servingsCountEl) servingsCountEl.textContent = currentServings;
        renderIngredients();
        renderNutrition();
      });
    }
    if (btnMinus) {
      btnMinus.addEventListener('click', () => {
        if (currentServings <= 1) return;
        currentServings--;
        if (servingsCountEl) servingsCountEl.textContent = currentServings;
        renderIngredients();
        renderNutrition(); 
      });
    }

    // ── Nutrition (calculate from ingredient data) ────────────
  function renderNutrition() {
  const nutritionValues = document.querySelectorAll('.nutrition-value');
  if (!nutritionValues.length) return;

  let totals = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    sugar: 0,
    salt: 0
  };

  const ratio = currentServings / baseServings;

  (recipe.ingredients || []).forEach(ing => {
    const qty = Number(ing.quantity || 0) * ratio;
    const unitRatio = Number(ing.ratio || 0);

    totals.calories      += Number(ing.calories || 0) * unitRatio * qty;
    totals.protein       += Number(ing.protein || 0) * unitRatio * qty;
    totals.carbohydrates += Number(ing.carbohydrates || 0) * unitRatio * qty;
    totals.fat           += Number(ing.fat || 0) * unitRatio * qty;
    totals.sugar         += Number(ing.sugar || 0) * unitRatio * qty;
    totals.salt          += Number(ing.salt || 0) * unitRatio * qty;
  });

  const values = [
    Math.round(totals.calories),
    `${(Math.round(totals.protein * 10) / 10)}g`,
    `${(Math.round(totals.carbohydrates * 10) / 10)}g`,
    `${(Math.round(totals.fat * 10) / 10)}g`,
    `${(Math.round(totals.sugar * 10) / 10)}g`,
    `${(Math.round(totals.salt * 10) / 10)}g`
  ];

  nutritionValues.forEach((el, i) => {
    el.textContent = values[i] ?? '0';
  });
}


    // ── Save button ───────────────────────────────────────────
    const btnSave = document.getElementById('btn-save-recipe');
    let isSaved = false;

    async function loadSaveState() {
      if (!isLoggedIn() || !btnSave) return;
      try {
        const ids = await API.get('/saved/ids');
        isSaved = ids.includes(recipe.id);
        updateSaveBtn();
      } catch {}
    }

    function updateSaveBtn() {
      if (!btnSave) return;
      btnSave.innerHTML = isSaved ? '❤️ Saved to collection' : '🤍 Save this recipe';
      btnSave.classList.toggle('saved', isSaved);
    }

    loadSaveState();

    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        if (!isLoggedIn()) {
          showToast('🔒 Sign in to save recipes', 'error');
          setTimeout(() => window.location.href = 'login.html', 800);
          return;
        }
        try {
          if (isSaved) {
            await API.delete(`/saved/${recipe.id}`);
            isSaved = false;
            showToast('💔 Removed from saved', 'success');
          } else {
            await API.post(`/saved/${recipe.id}`, {});
            isSaved = true;
            showToast('❤️ Saved to your collection!', 'success');
          }
          updateSaveBtn();
        } catch { showToast('Something went wrong', 'error'); }
      });
    }

    // ── Share button ──────────────────────────────────────────
    const btnShare = document.getElementById('btn-share-recipe');
    if (btnShare) {
      btnShare.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({ title: recipe.title, url: window.location.href });
        } else {
          navigator.clipboard.writeText(window.location.href)
            .then(() => showToast('🔗 Link copied!', 'success'))
            .catch(() => showToast('Could not copy link', 'error'));
        }
      });
    }
  }
}

//  PAGE: ACCOUNT

function initAccountPage() {
  if (!document.getElementById('panel-profile')) return;

  // Redirect if not logged in
  if (!isLoggedIn()) {
    window.location.href = 'login.html?redirect=account.html';
    return;
  }

  const user = getUser();
  updateNavAuth();

  // Populate header
  const avatarEls    = document.querySelectorAll('.user-avatar, .account-avatar-large');
  const nameEls      = document.querySelectorAll('.user-name-display, .account-header-name');
  const emailEl      = document.getElementById('account-header-email');
  const savedCountEl = document.getElementById('saved-count');

  avatarEls.forEach(el => el.textContent = initials(user.name || user.email));
  nameEls.forEach(el   => el.textContent = user.name || user.email.split('@')[0]);
  if (emailEl) emailEl.textContent = user.email;

  // ── Tab navigation ─────────────────────────────────────────
  const navItems = document.querySelectorAll('.account-nav-item');
  const panels   = document.querySelectorAll('.account-panel');

  function showPanel(panelId) {
    panels.forEach(p   => p.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));
    document.getElementById(`panel-${panelId}`)?.classList.add('active');
    document.querySelector(`[data-panel="${panelId}"]`)?.classList.add('active');
    if (panelId === 'saved') renderSavedRecipes();
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => showPanel(item.dataset.panel));
  });

  const hashPanel = window.location.hash.replace('#', '') || 'profile';
  showPanel(hashPanel);

  // ── Profile form ───────────────────────────────────────────
  const profileForm = document.getElementById('profile-form');
  const nameInput   = document.getElementById('profile-name');
  const emailInput  = document.getElementById('profile-email');

  if (nameInput)  nameInput.value  = user.name  || '';
  if (emailInput) emailInput.value = user.email || '';

  if (profileForm) {
    profileForm.addEventListener('submit', async e => {
      e.preventDefault();
      const newName = nameInput?.value.trim();
      if (!newName) return showToast('❌ Name cannot be empty', 'error');
      try {
        const updated = await API.put('/auth/profile', { name: newName });
        const stored  = getUser();
        stored.name   = updated.name;
        localStorage.setItem('freshly_user', JSON.stringify(stored));
        nameEls.forEach(el => el.textContent = updated.name);
        avatarEls.forEach(el => el.textContent = initials(updated.name));
        showToast('✓ Profile updated', 'success');
      } catch (err) {
        showToast(`❌ ${err.error || 'Update failed'}`, 'error');
      }
    });
  }

  // ── Password form ──────────────────────────────────────────
  const passwordForm     = document.getElementById('password-form');
  const currentPassInput = document.getElementById('current-password');
  const newPassInput     = document.getElementById('new-password');
  const confirmPassInput = document.getElementById('confirm-new-password');

  if (passwordForm) {
    passwordForm.addEventListener('submit', async e => {
      e.preventDefault();
      const currentPassword = currentPassInput?.value || '';
      const newPassword     = newPassInput?.value     || '';
      const confirmPassword = confirmPassInput?.value  || '';

      if (!currentPassword) return showToast('❌ Enter your current password', 'error');
      if (newPassword.length < 6) return showToast('❌ New password must be at least 6 characters', 'error');
      if (newPassword !== confirmPassword) return showToast('❌ New passwords do not match', 'error');

      try {
        await API.put('/auth/password', { currentPassword, newPassword });
        currentPassInput.value = '';
        newPassInput.value     = '';
        confirmPassInput.value = '';
        showToast('✓ Password changed successfully', 'success');
      } catch (err) {
        showToast(`❌ ${err.error || 'Password change failed'}`, 'error');
      }
    });
  }

  // ── Saved Recipes ──────────────────────────────────────────
  async function renderSavedRecipes() {
    const container = document.getElementById('saved-recipes-container');
    if (!container) return;

    container.innerHTML = '<p style="color:#8a8a7a;padding:2rem">Loading saved recipes…</p>';

    try {
      const savedRecipes = await API.get('/saved');
      if (savedCountEl) savedCountEl.textContent = savedRecipes.length;

      if (savedRecipes.length === 0) {
        container.innerHTML = `
          <div class="saved-empty">
            <div class="saved-empty-icon">🥗</div>
            <h3 class="saved-empty-title">No saved recipes yet</h3>
            <p class="saved-empty-text">Find recipes you love and save them here for quick access.</p>
            <a href="index.html" class="btn-explore">Explore recipes →</a>
          </div>`;
        return;
      }

      container.innerHTML = `
        <div class="saved-recipe-grid">
          ${savedRecipes.map(recipe => `
            <article class="saved-recipe-card">
              <div class="saved-card-img-wrap">
                <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
                <button class="btn-unsave" data-id="${recipe.id}" title="Remove">💔</button>
              </div>
              <div class="saved-card-body">
                <h4 class="saved-card-title">${recipe.title}</h4>
                <div class="saved-card-meta">
                  <span>⏱ ${recipe.time}</span>
                  <span>👤 Serves ${recipe.servings}</span>
                </div>
                <a href="recipe.html?id=${recipe.id}" class="btn-view-saved">View recipe →</a>
              </div>
            </article>`).join('')}
        </div>`;

      container.querySelectorAll('.btn-unsave').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = parseInt(btn.dataset.id);
          try {
            await API.delete(`/saved/${id}`);
            showToast('💔 Removed from saved', 'success');
            renderSavedRecipes();
          } catch { showToast('Something went wrong', 'error'); }
        });
      });
    } catch {
      container.innerHTML = '<p style="color:#c4622d;padding:2rem">Could not load saved recipes.</p>';
    }
  }

  // ── Delete Account ─────────────────────────────────────────
  const btnDelete = document.getElementById('btn-delete-account');
  if (btnDelete) {
    btnDelete.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
      try {
        await API.delete('/auth/account');
        clearUser();
        window.location.href = 'index.html';
      } catch (err) {
        showToast(`❌ ${err.error || 'Delete failed'}`, 'error');
      }
    });
  }
}

//  SHARED FORM HELPERS

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(errorId, inputEl, message) {
  if (inputEl) inputEl.classList.add('error');
  const errorEl = document.getElementById(errorId);
  if (errorEl) { errorEl.textContent = message; errorEl.classList.add('visible'); }
}

function clearFormErrors() {
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
}

//  BOOT — detect current page and initialise

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  if (page === 'login')   initLoginPage();
  else if (page === 'signup')  initSignupPage();
  else if (page === 'account') initAccountPage();
  else if (page === 'recipe')  initRecipePage();
  else if (page === 'index')   initIndexPage();
  else {
    // fallback: run all inits, each checks for its key DOM element
    updateNavAuth();
    initLoginPage();
    initSignupPage();
    initIndexPage();
    initRecipePage();
    initAccountPage();
  }
});
