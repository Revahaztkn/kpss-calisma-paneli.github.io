(function() {
  // Override localStorage methods to isolate data between users
  const originalGetItem = localStorage.getItem;
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;

  function getPrefixedKey(key) {
    if (typeof key !== 'string') return key;
    const excludedKeys = [
      'kpss_users',
      'kpss_auth_role',
      'kpss_auth_user',
      'kpss_clean_slate_v1'
    ];
    if (excludedKeys.includes(key)) {
      return key;
    }
    if (key.startsWith('kpss_')) {
      const user = originalGetItem.call(localStorage, 'kpss_auth_user') || 'guest';
      return user + '_' + key;
    }
    return key;
  }

  localStorage.getItem = function(key) {
    return originalGetItem.call(localStorage, getPrefixedKey(key));
  };

  localStorage.setItem = function(key, value) {
    originalSetItem.call(localStorage, getPrefixedKey(key), value);
  };

  localStorage.removeItem = function(key) {
    originalRemoveItem.call(localStorage, getPrefixedKey(key));
  };

  // Clean slate: clear old mock data once on first visit
  if (!localStorage.getItem('kpss_clean_slate_v1')) {
    localStorage.removeItem('kpss_weekly_schedule_v1');
    localStorage.removeItem('kpss_weekly_study_tracker_v2');
    localStorage.removeItem('kpss_archived_tasks');
    localStorage.removeItem('kpss_weekly_archives_v1');
    localStorage.setItem('kpss_clean_slate_v1', 'true');
  }

  // First-time visit: default role is guest
  if (!localStorage.getItem('kpss_auth_role')) {
    localStorage.setItem('kpss_auth_role', 'guest');
    localStorage.setItem('kpss_auth_user', 'guest');
  }

  // On first load of this tab/session, force the theme to dark
  if (!sessionStorage.getItem('kpss_session_theme_loaded')) {
    localStorage.setItem('kpss_user_theme', 'dark');
    sessionStorage.setItem('kpss_session_theme_loaded', 'true');
  }

  // Read saved theme safely after DOM is loaded
  window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('kpss_user_theme') || 'dark';
    if (savedTheme !== 'dark') {
      document.body.classList.add('theme-' + savedTheme);
    }
  });

  // Setup permissions block listener if role is not admin
  const role = localStorage.getItem('kpss_auth_role');
  setupPermissions(role);

  // Global redirection function
  window.openAuthModal = function() {
    location.href = 'login.html';
  };







  // Add the header buttons
  addLogoutButton();

  function setupPermissions(role) {
    if (role !== 'admin') {
      window.addEventListener('DOMContentLoaded', () => {
        const selectors = [
          'input', 'select', 'textarea', 'button', '.preset-chip', '.task-check', 
          '.task-del', '.log-del-btn', '.remove-x', '.schedule-check'
        ];
        
        document.body.addEventListener('click', e => {
          const target = e.target;
          
          // Allow clicking anchors / links
          if (target.tagName === 'A' || target.closest('a')) return;
          
          // Allow clicking logoutBtn or login modal trigger
          if (target.id === 'logoutBtn') return;
          
          // Allow theme dot selector
          if (target.closest('.theme-selector')) return;
          
          // Allow clicking inside Section 02 (Pomodoro) and Section 06 (Çıkmış Soru Dağılımları)
          if (target.closest('#sec-02') || target.closest('#sec-06')) return;
          
          // Allow actions on dedicated pomodoro.html page
          if (location.pathname.includes('pomodoro.html')) return;
          
          // Allow PiP and test sound buttons explicitly
          if (target.id === 'pipBtn' || target.id === 'testSoundBtn') return;
          
          const matchesSelector = selectors.some(s => target.matches(s) || target.closest(s));
          if (matchesSelector) {
            e.preventDefault();
            e.stopPropagation();
            window.openAuthModal();
          }
        }, true);
      });
    }
  }

  function addLogoutButton() {
    window.addEventListener('DOMContentLoaded', () => {
      const role = localStorage.getItem('kpss_auth_role');
      const header = document.querySelector('header');
      if (header) {
        const logoutDiv = document.createElement('div');
        logoutDiv.style.cssText = 'display:flex; align-items:center; gap:10px; margin-top:10px;';
        
        const btn = document.createElement('button');
        btn.id = 'logoutBtn';
        
        if (role === 'admin') {
          const roleBadge = document.createElement('span');
          roleBadge.style.cssText = `font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; background:rgba(34,197,94,0.1); color:#22c55e; text-transform:uppercase;`;
          roleBadge.textContent = 'Yönetici';
          logoutDiv.appendChild(roleBadge);

          btn.textContent = 'Çıkış Yap';
          btn.className = 'btn-ghost';
          btn.style.cssText = 'padding:6px 12px; font-size:12px; cursor:pointer; border-radius:8px;';
          btn.addEventListener('click', () => {
            localStorage.setItem('kpss_auth_role', 'guest');
            localStorage.setItem('kpss_auth_user', 'guest');
            location.reload();
          });
        } else {
          btn.textContent = 'Giriş Yap / Kayıt Ol';
          btn.style.cssText = `
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            border-radius: 20px;
            background: linear-gradient(135deg, #a855f7, #6366f1);
            color: #fff;
            border: none;
            box-shadow: 0 4px 12px rgba(168, 85, 247, 0.25);
            transition: all 0.2s ease;
            font-family: 'DM Sans', sans-serif;
            outline: none;
          `;
          btn.addEventListener('mouseover', () => {
            btn.style.transform = 'translateY(-1px)';
            btn.style.boxShadow = '0 6px 15px rgba(168, 85, 247, 0.4)';
          });
          btn.addEventListener('mouseout', () => {
            btn.style.transform = 'none';
            btn.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.25)';
          });
          btn.addEventListener('click', () => {
            window.openAuthModal();
          });
        }
        
        logoutDiv.appendChild(btn);
        
        const ctrlPanel = header.querySelector('#headerControlPanel');
        if (ctrlPanel) {
          ctrlPanel.appendChild(logoutDiv);
        } else {
          const themeSel = header.querySelector('.theme-selector');
          if (themeSel) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex; flex-direction:column; align-items:flex-end; gap:8px;';
            themeSel.parentNode.insertBefore(wrap, themeSel);
            wrap.appendChild(themeSel);
            wrap.appendChild(logoutDiv);
          } else {
            header.appendChild(logoutDiv);
          }
        }
      }
    });
  }
})();
