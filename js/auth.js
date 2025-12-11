class AuthManager {
  constructor() {
    this.supabase = window.utils.initSupabase();
    this.currentOTP = null;
    this.resetEmail = null;
    this.initEventListeners();
    this.checkAuthState();
  }
  
  initEventListeners() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', (e) => this.handleLogin(e));
    }
    
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
      registerBtn.addEventListener('click', (e) => this.handleRegister(e));
    }
    
    const forgotPasswordBtn = document.getElementById('forgot-password-btn');
    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener('click', () => this.showForgotPassword());
    }
    
    const sendOtpBtn = document.getElementById('send-otp-btn');
    if (sendOtpBtn) {
      sendOtpBtn.addEventListener('click', () => this.sendOTP());
    }
    
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    if (verifyOtpBtn) {
      verifyOtpBtn.addEventListener('click', () => this.verifyOTP());
    }
    
    this.setupFormNavigation();
    
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.addEventListener('input', (e) => this.updatePasswordStrength(e.target.value));
    }
    
    this.setupOTPInputs();
    
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleEnterKey();
      }
    });
  }
  
  async checkAuthState() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (user && (window.location.pathname.includes('login.html') || 
                   window.location.pathname.includes('register.html'))) {
        window.location.href = 'dashboard.html';
      }
      
      if (!user && window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'login.html';
      }
      
    } catch (error) {
      console.error('Auth state check error:', error);
    }
  }
  
  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const loginBtn = document.getElementById('login-btn');
    
    if (!email || !password) {
      return window.utils.showAlert('Harap isi semua field yang diperlukan', 'error');
    }
    
    if (!window.utils.validateEmail(email)) {
      return window.utils.showAlert('Format email tidak valid', 'error');
    }
    
    try {
      window.utils.showLoading(loginBtn, 'Memproses login...');
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        const errorMessage = this.getLoginErrorMessage(error);
        throw new Error(errorMessage);
      }
      
      if (!data.user.email_confirmed_at) {
        await this.supabase.auth.signOut();
        throw new Error('Email belum diverifikasi. Silakan cek inbox email Anda untuk verifikasi.');
      }
      
      window.utils.showAlert('Login berhasil! Mengarahkan ke dashboard...', 'success');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
      
    } catch (error) {
      window.utils.showAlert(error.message, 'error');
    } finally {
      window.utils.hideLoading(loginBtn);
    }
  }
  
  async handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;
    const termsCheckbox = document.getElementById('terms');
    const registerBtn = document.getElementById('register-btn');
    
    if (!email || !password || !confirmPassword) {
      return window.utils.showAlert('Harap isi semua field yang diperlukan', 'error');
    }
    
    if (!window.utils.validateEmail(email)) {
      return window.utils.showAlert('Format email tidak valid', 'error');
    }
    
    if (password.length < 6) {
      return window.utils.showAlert('Password minimal 6 karakter', 'error');
    }
    
    if (password !== confirmPassword) {
      return window.utils.showAlert('Password tidak cocok', 'error');
    }
    
    if (!termsCheckbox?.checked) {
      return window.utils.showAlert('Anda harus menyetujui Syarat dan Ketentuan', 'error');
    }
    
    try {
      window.utils.showLoading(registerBtn, 'Mendaftarkan akun...');
      
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login.html`
        }
      });
      
      if (error) {
        const errorMessage = this.getRegisterErrorMessage(error);
        throw new Error(errorMessage);
      }
      
      window.utils.showAlert(
        '✅ Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.',
        'success',
        8000
      );
      
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
      document.getElementById('confirm-password').value = '';
      if (termsCheckbox) termsCheckbox.checked = false;
      
      const strengthBar = document.getElementById('strength-bar');
      const strengthText = document.getElementById('strength-text');
      if (strengthBar) strengthBar.style.width = '0%';
      if (strengthText) strengthText.textContent = 'Lemah';
      
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 5000);
      
    } catch (error) {
      window.utils.showAlert(error.message, 'error');
    } finally {
      window.utils.hideLoading(registerBtn);
    }
  }
  
  showForgotPassword() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('forgot-password-form').classList.remove('hidden');
  }
  
  async sendOTP() {
    const email = document.getElementById('reset-email')?.value.trim();
    const sendOtpBtn = document.getElementById('send-otp-btn');
    
    if (!email) {
      return window.utils.showAlert('Harap masukkan email terdaftar', 'error');
    }
    
    if (!window.utils.validateEmail(email)) {
      return window.utils.showAlert('Format email tidak valid', 'error');
    }
    
    try {
      window.utils.showLoading(sendOtpBtn, 'Mengirim OTP...');
      
      const otp = window.utils.generateOTP();
      this.currentOTP = otp;
      this.resetEmail = email;
      
      window.utils.showAlert(
        `Kode OTP: ${otp} (Untuk demo - dalam produksi akan dikirim via email)`,
        'info',
        10000
      );
      
      document.getElementById('forgot-password-form').classList.add('hidden');
      document.getElementById('otp-section').classList.remove('hidden');
      
      const firstOtpInput = document.querySelector('.otp-input');
      if (firstOtpInput) firstOtpInput.focus();
      
    } catch (error) {
      window.utils.showAlert('Gagal mengirim OTP: ' + error.message, 'error');
    } finally {
      window.utils.hideLoading(sendOtpBtn);
    }
  }
  
  async verifyOTP() {
    const otpInputs = document.querySelectorAll('.otp-input');
    let enteredOTP = '';
    otpInputs.forEach(input => {
      enteredOTP += input.value;
    });
    
    const newPassword = document.getElementById('new-password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    
    if (enteredOTP.length !== 6) {
      return window.utils.showAlert('Harap masukkan 6 digit kode OTP', 'error');
    }
    
    if (enteredOTP !== this.currentOTP) {
      return window.utils.showAlert('Kode OTP salah', 'error');
    }
    
    if (!newPassword || newPassword.length < 6) {
      return window.utils.showAlert('Password baru minimal 6 karakter', 'error');
    }
    
    if (newPassword !== confirmPassword) {
      return window.utils.showAlert('Password tidak cocok', 'error');
    }
    
    try {
      window.utils.showLoading(verifyOtpBtn, 'Mereset password...');
      
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (user && user.email === this.resetEmail) {
        const { error } = await this.supabase.auth.updateUser({
          password: newPassword
        });
        
        if (error) throw error;
      }
      
      window.utils.showAlert('✅ Password berhasil direset! Silakan login dengan password baru.', 'success');
      
      setTimeout(() => {
        document.getElementById('otp-section').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
        
        otpInputs.forEach(input => input.value = '');
        document.getElementById('reset-email').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        document.getElementById('email').value = this.resetEmail;
        
        this.currentOTP = null;
        this.resetEmail = null;
      }, 2000);
      
    } catch (error) {
      window.utils.showAlert('Gagal reset password: ' + error.message, 'error');
    } finally {
      window.utils.hideLoading(verifyOtpBtn);
    }
  }
  
  setupFormNavigation() {
    const backToLogin = document.getElementById('back-to-login');
    if (backToLogin) {
      backToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('forgot-password-form').classList.add('hidden');
        document.getElementById('otp-section').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
      });
    }
    
    const backToReset = document.getElementById('back-to-reset');
    if (backToReset) {
      backToReset.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('otp-section').classList.add('hidden');
        document.getElementById('forgot-password-form').classList.remove('hidden');
      });
    }
    
    const resendOtpBtn = document.getElementById('resend-otp');
    if (resendOtpBtn) {
      resendOtpBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (this.resetEmail) {
          await this.sendOTP();
        } else {
          window.utils.showAlert('Silakan masukkan email terlebih dahulu', 'error');
        }
      });
    }
  }
  
  setupOTPInputs() {
    const otpInputs = document.querySelectorAll('.otp-input');
    
    otpInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        
        if (e.target.value.length === 1 && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
        
        const allFilled = Array.from(otpInputs).every(input => input.value.length === 1);
        if (allFilled) {
          document.getElementById('verify-otp-btn')?.focus();
        }
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          otpInputs[index - 1].focus();
        }
      });
    });
  }
  
  updatePasswordStrength(password) {
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    const { level } = window.utils.validatePasswordStrength(password);
    
    let width = 0;
    let text = 'Lemah';
    let className = '';
    
    if (password.length === 0) {
      width = 0;
      text = 'Lemah';
    } else if (level === 'weak') {
      width = 33;
      text = 'Lemah';
    } else if (level === 'medium') {
      width = 66;
      text = 'Sedang';
      className = 'medium';
    } else if (level === 'strong') {
      width = 100;
      text = 'Kuat';
      className = 'strong';
    }
    
    strengthBar.style.width = width + '%';
    strengthBar.className = 'strength-fill ' + className;
    strengthText.textContent = text;
  }
  
  handleEnterKey() {
    const activeForm = this.getActiveForm();
    
    if (activeForm === 'login') {
      document.getElementById('login-btn')?.click();
    } else if (activeForm === 'forgot-password') {
      document.getElementById('send-otp-btn')?.click();
    } else if (activeForm === 'otp') {
      document.getElementById('verify-otp-btn')?.click();
    }
  }
  
  getActiveForm() {
    if (!document.getElementById('login-form').classList.contains('hidden')) {
      return 'login';
    } else if (!document.getElementById('forgot-password-form').classList.contains('hidden')) {
      return 'forgot-password';
    } else if (!document.getElementById('otp-section').classList.contains('hidden')) {
      return 'otp';
    }
    return 'login';
  }
  
  getLoginErrorMessage(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid login credentials')) {
      return 'Email atau password salah. Silakan coba lagi.';
    }
    
    if (message.includes('email not confirmed')) {
      return 'Email belum diverifikasi. Silakan cek inbox email Anda.';
    }
    
    if (message.includes('user not found')) {
      return 'Email tidak terdaftar. Silakan daftar terlebih dahulu.';
    }
    
    return 'Login gagal: ' + error.message;
  }
  
  getRegisterErrorMessage(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('already registered') || 
        message.includes('already exists') ||
        message.includes('user already')) {
      return 'Email sudah terdaftar. Silakan login atau gunakan email lain.';
    }
    
    if (message.includes('weak password')) {
      return 'Password terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol.';
    }
    
    return 'Pendaftaran gagal: ' + error.message;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.authManager = new AuthManager();
});
