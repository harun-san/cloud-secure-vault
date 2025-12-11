const SUPABASE_CONFIG = {
  url: 'https://gdcunyctbofxewtxokrg.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY3VueWN0Ym9meGV3dHhva3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODk4NjYsImV4cCI6MjA3ODM2NTg2Nn0.9SfCpJxx8HByLSJ3BsJ1FjwkzY3jnOxhIcLuUm_IkPI'
};

function initSupabase() {
  return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePasswordStrength(password) {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password)
  };
  
  const strength = Object.values(requirements).filter(Boolean).length;
  let level = 'weak';
  
  if (strength >= 4) level = 'strong';
  else if (strength >= 3) level = 'medium';
  
  return {
    level,
    requirements,
    strength
  };
}

function showAlert(message, type = 'info', duration = 5000) {
  const existingAlerts = document.querySelectorAll('.custom-alert');
  existingAlerts.forEach(alert => alert.remove());
  
  const alertEl = document.createElement('div');
  alertEl.className = `custom-alert alert-${type}`;
  alertEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 400px;
    min-width: 300px;
  `;
  
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  
  alertEl.innerHTML = `
    <span style="font-size: 20px;">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;
  
  document.body.appendChild(alertEl);
  
  if (!document.querySelector('#alert-styles')) {
    const style = document.createElement('style');
    style.id = 'alert-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  setTimeout(() => {
    alertEl.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (alertEl.parentNode) {
        alertEl.parentNode.removeChild(alertEl);
      }
    }, 300);
  }, duration);
  
  return alertEl;
}

function showLoading(button, text = 'Memproses...') {
  if (!button) return;
  
  const originalHTML = button.innerHTML;
  button.setAttribute('data-original-html', originalHTML);
  button.innerHTML = `
    <i class="fas fa-spinner fa-spin"></i>
    <span>${text}</span>
  `;
  button.disabled = true;
  button.classList.add('loading');
}

function hideLoading(button) {
  if (!button) return;
  
  const originalHTML = button.getAttribute('data-original-html');
  if (originalHTML) {
    button.innerHTML = originalHTML;
  }
  button.disabled = false;
  button.classList.remove('loading');
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return otp;
}

function getFileType(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  const types = {
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image',
    pdf: 'pdf', doc: 'document', docx: 'document', txt: 'document',
    xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet',
    ppt: 'presentation', pptx: 'presentation',
    zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive',
    mp3: 'audio', wav: 'audio', mp4: 'video', avi: 'video', mov: 'video'
  };
  
  return types[extension] || 'file';
}

function getFileIcon(filename) {
  const type = getFileType(filename);
  const icons = {
    image: 'far fa-file-image',
    pdf: 'far fa-file-pdf',
    document: 'far fa-file-alt',
    spreadsheet: 'far fa-file-excel',
    presentation: 'far fa-file-powerpoint',
    archive: 'far fa-file-archive',
    audio: 'far fa-file-audio',
    video: 'far fa-file-video',
    file: 'far fa-file'
  };
  
  return icons[type] || icons.file;
}

function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

window.utils = {
  initSupabase,
  formatFileSize,
  formatDate,
  validateEmail,
  validatePasswordStrength,
  showAlert,
  showLoading,
  hideLoading,
  debounce,
  generateOTP,
  getFileType,
  getFileIcon,
  sanitizeFilename
};
