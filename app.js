const meterForm = document.querySelector('#meter-form');
const meterInput = document.querySelector('#meter-number');
const meterError = document.querySelector('#meter-error');
const verifiedPanel = document.querySelector('#verified-panel');
const sharePanel = document.querySelector('#share-panel');
const consent = document.querySelector('#consent');
const emailInput = document.querySelector('#email');
const phoneInput = document.querySelector('#phone');
const toast = document.querySelector('#toast');
let toastTimer;
let countdownTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function cleanMeter(value) {
  return value.replace(/\D/g, '').slice(0, 11);
}

function maskMeter(value) {
  return `${value.slice(0, 3)}***${value.slice(-4)}`;
}

function formatPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('27')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  digits = digits.slice(0, 9);
  return `+27 ${digits.slice(0, 2)}${digits.length > 2 ? ` ${digits.slice(2, 5)}` : ''}${digits.length > 5 ? ` ${digits.slice(5)}` : ''}`.trim();
}

function normalizePhone(value) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('27') ? digits.slice(2) : digits.replace(/^0/, '');
}

meterInput.addEventListener('input', () => {
  meterInput.value = cleanMeter(meterInput.value);
  meterError.textContent = '';
  window.clearTimeout(meterInput.errorTimer);
  if (meterInput.value.length === 11) {
    meterInput.disabled = true;
    meterForm.hidden = true;
    verifiedPanel.hidden = false;
    emailInput.focus();
    return;
  }
  if (meterInput.value) {
    meterInput.errorTimer = window.setTimeout(() => {
      meterError.textContent = 'Invalid meter number, please make sure you enter 11 digits';
    }, 700);
  }
});

phoneInput.addEventListener('input', () => {
  phoneInput.value = formatPhone(phoneInput.value);
});

document.querySelector('#create-link').addEventListener('click', () => {
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
  const phoneValid = /^\d{9}$/.test(normalizePhone(phoneInput.value));
  if (!emailValid && !phoneValid) {
    showToast('Add an email address or a mobile number so we can deliver your link.');
    return;
  }
  if (!consent.checked) {
    showToast('Please accept the POPIA privacy terms to continue.');
    return;
  }
  document.querySelector('#share-meter').textContent = maskMeter(meterInput.value);
  document.querySelector('#share-url').textContent = `topmeup.io/e/${makeCode()}`;
  verifiedPanel.hidden = true;
  sharePanel.hidden = false;
  startCountdown();
});

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function startCountdown() {
  let seconds = 24 * 60 * 60;
  window.clearInterval(countdownTimer);
  const countdown = document.querySelector('#countdown');
  countdownTimer = window.setInterval(() => {
    seconds -= 1;
    const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const remaining = String(seconds % 60).padStart(2, '0');
    countdown.textContent = `${hours}:${minutes}:${remaining}`;
    if (seconds <= 0) window.clearInterval(countdownTimer);
  }, 1000);
}

document.querySelector('#copy-link').addEventListener('click', async () => {
  const url = document.querySelector('#share-url').textContent;
  try {
    await navigator.clipboard.writeText(`https://${url}`);
    showToast('Your topup link is copied.');
  } catch {
    showToast('Select the link to copy it manually.');
  }
});

document.querySelectorAll('[data-share]').forEach((button) => {
  button.addEventListener('click', async () => {
    const url = `https://${document.querySelector('#share-url').textContent}`;
    const message = 'I need a little electricity topup. You can help securely here: ';
    if (button.dataset.share === 'native' && navigator.share) {
      await navigator.share({ title: 'Help keep the lights on', text: message, url });
      return;
    }
    if (button.dataset.share === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(message + url)}`, '_blank', 'noopener');
    if (button.dataset.share === 'email') window.location.href = `mailto:?subject=${encodeURIComponent('Help keep the lights on')}&body=${encodeURIComponent(message + url)}`;
    if (button.dataset.share === 'native' && !navigator.share) showToast('Link sharing is available from your device share menu.');
  });
});

document.querySelector('#contact-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const subject = `Topmeup contact from ${formData.get('name') || 'a visitor'}`;
  const body = `Name: ${formData.get('name')}\nEmail: ${formData.get('email')}\n\n${formData.get('message')}`;
  window.location.href = `mailto:hello@topmeup.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

document.querySelector('#start-over').addEventListener('click', () => {
  sharePanel.hidden = true;
  meterForm.hidden = false;
  meterForm.reset();
  meterInput.disabled = false;
  meterInput.focus();
});

document.querySelectorAll('[data-toast]').forEach((element) => {
  element.addEventListener('click', () => showToast(element.dataset.toast));
});
