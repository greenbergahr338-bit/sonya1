/* =========================================================
   LuckyBear Site JS (stable)
   - Mobile drawer (burger)
   - FAQ accordion
   - Copy promo code
   This file is designed to NEVER crash if some elements
   are missing on a page.
========================================================= */
(function () {
  'use strict';

  function ready(fn){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }

  // -------------------------
  // Mobile drawer (burger)
  // -------------------------
  function initDrawer(){
    const burger = qs('.burger') || document.getElementById('burger');
    const drawer = document.getElementById('drawer') || qs('.drawer');
    const overlay = document.getElementById('drawerOverlay') || qs('.drawer-overlay');
    const closeBtn = document.getElementById('drawerClose') || qs('.drawer-close', drawer);

    if (!burger || !drawer) return;

    let _scrollY = 0;

function lockScroll(){
  // iOS Safari-friendly scroll lock:
  _scrollY = window.scrollY || window.pageYOffset || 0;
  document.body.dataset.scrollY = String(_scrollY);
  document.body.classList.add('drawer-lock');
  document.body.style.top = `-${_scrollY}px`;
}

function unlockScroll(){
  const y = parseInt(document.body.dataset.scrollY || '0', 10) || 0;
  document.body.classList.remove('drawer-lock');
  document.body.style.top = '';
  delete document.body.dataset.scrollY;
  window.scrollTo(0, y);
}

function open(){
  burger.setAttribute('aria-expanded', 'true');
  drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
  lockScroll();
}
function close(){
  burger.setAttribute('aria-expanded', 'false');
  drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  unlockScroll();
}
function toggle(){
      if (drawer.classList.contains('open')) close();
      else open();
    }

    burger.addEventListener('click', function(e){
      e.preventDefault();
      toggle();
    });

    if (overlay) overlay.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);

    // Close on ESC
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') close();
    });

    // Close when clicking any link inside drawer
    qsa('a', drawer).forEach(a => a.addEventListener('click', close));
  }

  // -------------------------
  // FAQ accordion
  // -------------------------
  function initFAQ(){
    const questions = qsa('.faq-q');
    if (!questions.length) return;

    questions.forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const answer = item ? qs('.faq-a', item) : null;
        const isOpen = item ? item.classList.contains('open') : (answer && answer.classList.contains('open'));

        // close others in same grid (optional)
        const grid = item ? item.parentElement : null;
        if (grid && grid.classList.contains('faq-grid')) {
          qsa('.faq-item.open', grid).forEach(openItem => {
            if (openItem !== item) {
              openItem.classList.remove('open');
              const a = qs('.faq-a', openItem);
              if (a) a.style.maxHeight = null;
            }
          });
        }

        if (!item || !answer) return;

        if (isOpen) {
          item.classList.remove('open');
          answer.style.maxHeight = null;
        } else {
          item.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });

    // Expand answers that are pre-opened (if any)
    qsa('.faq-item.open .faq-a').forEach(a => {
      a.style.maxHeight = a.scrollHeight + 'px';
    });
  }

  // -------------------------
  // Copy promo code
  // -------------------------
  async function copyText(text){
    try{
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    }catch(e){}
    // Fallback
    try{
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }catch(e){ return false; }
  }

  function initPromoCopy(){
    const buttons = qsa('[data-copy-promo]');
    if (!buttons.length) return;

    buttons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const code = btn.getAttribute('data-copy-promo') || '';
        const ok = await copyText(code);
        const card = btn.closest('.promo-card') || btn.parentElement;
        const status = card ? qs('.promo-copied', card) : null;
        if (status) {
          status.textContent = ok ? 'Скопировано!' : 'Не удалось скопировать';
          setTimeout(() => { status.textContent = ''; }, 1800);
        }
      });
    });
  }

// -------------------------
// Slots "Show more" button
// -------------------------
function initSlotsShowMore(){
  const btn = document.getElementById('showMoreSlots');
  if (!btn) return;
  // Cards layout used on /slots/
  const allCards = qsa('.cards4 .game');
  if (!allCards.length) return;

  const hiddenSel = '.cards4 .game.is-hidden';
  function setExpanded(expanded){
    qsa(hiddenSel).forEach(el => {
      if (expanded) el.classList.remove('is-hidden');
      else el.classList.add('is-hidden');
    });
    btn.textContent = expanded ? 'Скрыть' : 'Еще';
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  // Ensure initial state: show first 12, hide rest
  allCards.forEach((el, i) => {
    if (i >= 12) el.classList.add('is-hidden');
    else el.classList.remove('is-hidden');
  });
  btn.textContent = 'Еще';
  btn.setAttribute('aria-expanded', 'false');

  btn.addEventListener('click', function(){
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    setExpanded(!expanded);
  });
}

// -------------------------
// Simple reveal animations
// -------------------------
function initReveal(){
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = qsa('.card, .soft, .hero, .game, .slot-banner, .faq-item, .review-card');
  if (!targets.length) return;

  targets.forEach(el => el.classList.add('reveal'));

  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => io.observe(el));
}

  // -------------------------
  // Init all
  // -------------------------
  ready(function(){
    initDrawer();
    initFAQ();
    initPromoCopy();
    initSlotsShowMore();
    initReveal();
  });

})();
