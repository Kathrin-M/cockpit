// JULA 2027 — Basisskript (Mobile-Nav, Formulare)

document.addEventListener('DOMContentLoaded', function () {
  // Mobile-Nav Toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // Foto-Loop: schnellerer Auto-Scroll, per Maus/Touch manuell durchswipbar
  var track = document.querySelector('.photo-loop-track');
  if (track) {
    var isDown = false, startX = 0, scrollStart = 0, autoScroll = true, resumeTimer = null;
    var speed = 1.4; // px pro Frame

    function tick() {
      if (autoScroll && !isDown) {
        track.scrollLeft += speed;
        var half = track.scrollWidth / 2;
        if (track.scrollLeft >= half) track.scrollLeft -= half;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    function pauseThenResume() {
      autoScroll = false;
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () { autoScroll = true; }, 1800);
    }

    track.addEventListener('mousedown', function (e) {
      isDown = true;
      pauseThenResume();
      track.classList.add('dragging');
      startX = e.pageX;
      scrollStart = track.scrollLeft;
    });
    window.addEventListener('mouseup', function () {
      if (isDown) {
        isDown = false;
        track.classList.remove('dragging');
        pauseThenResume();
      }
    });
    window.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      e.preventDefault();
      track.scrollLeft = scrollStart - (e.pageX - startX);
    });
    track.addEventListener('touchstart', function () { pauseThenResume(); }, { passive: true });
    track.addEventListener('touchmove', function () { pauseThenResume(); }, { passive: true });

    track.addEventListener('scroll', function () {
      var half = track.scrollWidth / 2;
      if (track.scrollLeft >= half) track.scrollLeft -= half;
      else if (track.scrollLeft < 0) track.scrollLeft += half;
    });
  }

  // Formular-Versand an Google Apps Script (Voranmeldung + Kontakt)
  // Body wird als reiner JSON-String ohne eigenen Content-Type-Header gesendet
  // (fetch setzt dann automatisch "text/plain", das ist CORS-safelisted und
  // löst KEIN Preflight aus -> funktioniert mit JSON.parse(e.postData.contents)
  // im Apps Script ohne CORS-Probleme).
  var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxEPKwb8DD20GmzEbmpvNJrpZTauUe5Cu3ScPJP-WXivC11qoEB9_i9C5fmq1aIhPr3Zg/exec';

  // Anmeldung-Seite
  var googleForm = document.getElementById('anmeldung-form');
  if (googleForm) {
    var defaultBtnText = 'Jetzt eintragen';

    googleForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var msgBox = googleForm.querySelector('.form-success-msg');
      var errBox = googleForm.querySelector('.form-error-msg');
      var submitBtn = document.getElementById('anmeldung-submit');

      if (msgBox) msgBox.style.display = 'none';
      if (errBox) errBox.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Wird gesendet...';
      }

      var geschlechtField = googleForm.elements['geschlecht'];
      var geschlechtValue = geschlechtField ? geschlechtField.value : '';

      var payload = {
        sheet: 'Voranmeldungen',
        vorname: googleForm.elements['vorname'].value,
        nachname: googleForm.elements['nachname'].value,
        geburtsdatum: googleForm.elements['geburtsdatum'].value,
        klasse: googleForm.elements['klasse'].value,
        geschlecht: geschlechtValue,
        tshirt: googleForm.elements['tshirt'].value,
        erziehungsberechtigte: googleForm.elements['erziehungsberechtigte'].value,
        telefon: googleForm.elements['telefon'].value,
        email: googleForm.elements['email'].value,
        anmerkungen: googleForm.elements['nachricht'].value
      };

      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Submit failed: ' + res.status);
          if (msgBox) {
            msgBox.style.display = 'block';
            googleForm.reset();
            msgBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        })
        .catch(function () {
          if (errBox) {
            errBox.style.display = 'block';
            errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = defaultBtnText;
          }
        });
    });
  }

  // Kontaktformular (Kontakt-Seite)
  var kontaktForm = document.querySelector('form[data-placeholder-form]');
  if (kontaktForm) {
    kontaktForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var msgBox = kontaktForm.querySelector('.form-success-msg');
      var errBox = kontaktForm.querySelector('.form-error-msg');
      var submitBtn = kontaktForm.querySelector('button[type="submit"]');

      if (msgBox) msgBox.style.display = 'none';
      if (errBox) errBox.style.display = 'none';
      if (submitBtn) submitBtn.disabled = true;

      var payload = {
        sheet: 'Kontaktformular',
        name: kontaktForm.elements['name'].value,
        email: kontaktForm.elements['email'].value,
        nachricht: kontaktForm.elements['message'].value
      };

      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Submit failed: ' + res.status);
          if (msgBox) {
            msgBox.style.display = 'block';
            kontaktForm.reset();
            msgBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        })
        .catch(function () {
          if (errBox) {
            errBox.style.display = 'block';
            errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            alert('Da ist leider etwas schiefgelaufen. Bitte versucht es später erneut.');
          }
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }
});
