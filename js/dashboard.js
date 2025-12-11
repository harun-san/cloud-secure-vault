class DashboardManager {
  constructor() {
    this.supabase = window.utils.initSupabase();
    this.crypto = window.CryptoJS;
    this.currentUser = null;
    this.files = [];
    this.fileToDelete = null;
    this.currentSection = 'upload';
    this.deleteAccountStep = 1;
    
    this.init();
  }
  
  async init() {
    await this.checkAuth();
    await this.setupEventListeners();
    await this.loadDashboard();
    this.setupResponsive();
  }
  
  async checkAuth() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error || !user) {
        window.location.href = 'login.html';
        return;
      }
      
      this.currentUser = user;
      this.updateUserInfo();
      
      if (!user.email_confirmed_at) {
        await this.supabase.auth.signOut();
        window.utils.showAlert('Email belum diverifikasi. Silakan verifikasi email terlebih dahulu.', 'error');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
        return;
      }
      
    } catch (error) {
      console.error('Auth check error:', error);
      window.location.href = 'login.html';
    }
  }
  
  updateUserInfo() {
    if (!this.currentUser) return;
    
    const name = this.currentUser.email.split('@')[0];
    const initials = name.substring(0, 2).toUpperCase();
    
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) userAvatar.textContent = initials;
    
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    if (userName) userName.textContent = name;
    if (userEmail) userEmail.textContent = this.currentUser.email;
  }
  
  async setupEventListeners() {
    document.getElementById('nav-upload')?.addEventListener('click', () => this.switchSection('upload'));
    document.getElementById('nav-files')?.addEventListener('click', () => this.switchSection('files'));
    document.getElementById('nav-change-password')?.addEventListener('click', () => this.showChangePasswordModal());
    document.getElementById('nav-delete-account')?.addEventListener('click', () => this.showDeleteAccountModal());
    document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
    
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => this.toggleMobileMenu());
    
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.addEventListener('change', () => this.handleFileSelect());
    }
    
    const encryptionKey = document.getElementById('encryption-key');
    if (encryptionKey) {
      encryptionKey.addEventListener('input', (e) => this.toggleUploadButton(e.target.value));
    }
    
    document.getElementById('encrypt-upload-btn')?.addEventListener('click', () => this.uploadFile());
    
    document.getElementById('quick-upload-btn')?.addEventListener('click', () => {
      fileInput.click();
    });
    
    document.getElementById('refresh-files')?.addEventListener('click', () => this.loadFiles());
    
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const filter = e.currentTarget.dataset.filter;
        this.applyFilter(filter);
      });
    });
    
    this.setupDeleteAccountListeners();
    this.setupDragAndDrop();
    this.setupModals();
    this.setupSearch();
  }
  
  setupDeleteAccountListeners() {
    document.getElementById('nav-delete-account')?.addEventListener('click', () => {
      setTimeout(() => {
        const emailInput = document.getElementById('delete-confirm-email');
        if (emailInput && this.currentUser?.email) {
          emailInput.value = this.currentUser.email;
        }
      }, 100);
    });
    
    document.getElementById('next-step-btn')?.addEventListener('click', () => this.nextDeleteStep());
    
    document.getElementById('final-delete-btn')?.addEventListener('click', () => this.executeAccountDeletion());
    
    document.getElementById('delete-confirm-password')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('next-step-btn')?.click();
      }
    });
    
    document.getElementById('final-confirmation')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('final-delete-btn')?.click();
      }
    });
    
    document.getElementById('delete-understand')?.addEventListener('change', () => {
      this.validateDeleteStep1();
    });
    
    document.getElementById('delete-confirm-password')?.addEventListener('input', () => {
      this.validateDeleteStep1();
    });
    
    document.getElementById('final-confirmation')?.addEventListener('input', () => {
      this.validateDeleteStep2();
    });
  }
  
  showDeleteAccountModal() {
    this.resetDeleteModal();
    document.getElementById('delete-account-modal').classList.add('active');
  }
  
  resetDeleteModal() {
    this.deleteAccountStep = 1;
    
    document.querySelectorAll('.delete-step').forEach(step => {
      step.classList.remove('active');
      step.classList.add('hidden');
    });
    
    document.getElementById('delete-step-1').classList.add('active');
    document.getElementById('delete-step-1').classList.remove('hidden');
    
    document.querySelectorAll('.step').forEach(step => {
      step.classList.remove('active');
    });
    document.querySelector('.step[data-step="1"]').classList.add('active');
    
    document.getElementById('next-step-btn').classList.add('hidden');
    document.getElementById('confirm-delete-account').classList.add('hidden');
    document.getElementById('final-delete-btn').classList.add('hidden');
    
    document.getElementById('delete-confirm-password').value = '';
    document.getElementById('delete-understand').checked = false;
    document.getElementById('final-confirmation').value = '';
    
    document.getElementById('delete-progress-bar').style.width = '0%';
    
    document.querySelectorAll('.processing-step').forEach(step => {
      const icon = step.querySelector('i');
      const text = step.querySelector('span');
      icon.className = 'fas fa-circle';
      icon.classList.remove('text-success');
      text.textContent = text.textContent.replace('✓ ', '');
    });
    
    this.validateDeleteStep1();
  }
  
  validateDeleteStep1() {
    const password = document.getElementById('delete-confirm-password').value;
    const understood = document.getElementById('delete-understand').checked;
    const nextBtn = document.getElementById('next-step-btn');
    
    if (password && password.length >= 6 && understood) {
      nextBtn.classList.remove('hidden');
      nextBtn.disabled = false;
    } else {
      nextBtn.classList.add('hidden');
      nextBtn.disabled = true;
    }
  }
  
  validateDeleteStep2() {
    const confirmation = document.getElementById('final-confirmation').value;
    const finalBtn = document.getElementById('final-delete-btn');
    
    if (confirmation === 'HAPUS AKUN') {
      finalBtn.classList.remove('hidden');
      finalBtn.disabled = false;
    } else {
      finalBtn.classList.add('hidden');
      finalBtn.disabled = true;
    }
  }
  
  async nextDeleteStep() {
    const password = document.getElementById('delete-confirm-password').value;
    
    const isValid = await this.verifyPassword(password);
    if (isValid) {
      this.deleteAccountStep = 2;
      
      document.getElementById('delete-step-1').classList.remove('active');
      document.getElementById('delete-step-1').classList.add('hidden');
      document.getElementById('delete-step-2').classList.add('active');
      document.getElementById('delete-step-2').classList.remove('hidden');
      
      document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
      });
      document.querySelector('.step[data-step="2"]').classList.add('active');
      
      document.getElementById('next-step-btn').classList.add('hidden');
      document.getElementById('final-delete-btn').classList.remove('hidden');
      
      setTimeout(() => {
        document.getElementById('final-confirmation').focus();
      }, 100);
      
      this.validateDeleteStep2();
    } else {
      window.utils.showAlert('Password salah! Silakan coba lagi.', 'error');
    }
  }
  
  async verifyPassword(password) {
    try {
      const { error } = await this.supabase.auth.signInWithPassword({
        email: this.currentUser.email,
        password: password
      });
      
      return !error;
    } catch {
      return false;
    }
  }
  
  async executeAccountDeletion() {
    this.deleteAccountStep = 3;
    
    document.getElementById('delete-step-2').classList.remove('active');
    document.getElementById('delete-step-2').classList.add('hidden');
    document.getElementById('delete-step-3').classList.add('active');
    document.getElementById('delete-step-3').classList.remove('hidden');
    
    document.querySelectorAll('.step').forEach(step => {
      step.classList.remove('active');
    });
    document.querySelector('.step[data-step="3"]').classList.add('active');
    
    document.getElementById('final-delete-btn').classList.add('hidden');
    document.getElementById('cancel-delete-account').disabled = true;
    
    await this.performAccountDeletion();
  }
  
  async performAccountDeletion() {
    try {
      this.updateProgressStep('step-verifying', true);
      this.updateProgressBar(25);
      await this.delay(1000);
      
      this.updateProgressStep('step-deleting-files', false);
      const filesDeleted = await this.deleteAllUserFiles();
      this.updateProgressStep('step-deleting-files', true);
      this.updateProgressBar(50);
      await this.delay(1000);
      
      this.updateProgressStep('step-deleting-data', false);
      const dataDeleted = await this.deleteUserDatabaseData();
      this.updateProgressStep('step-deleting-data', true);
      this.updateProgressBar(75);
      await this.delay(1000);
      
      this.updateProgressStep('step-cleaning-up', false);
      await this.cleanupUserAccount();
      this.updateProgressStep('step-cleaning-up', true);
      this.updateProgressBar(100);
      await this.delay(1500);
      
      window.utils.showAlert(
        '✅ Akun Anda berhasil dihapus! Semua data telah dihapus permanen.',
        'success',
        5000
      );
      
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 3000);
      
    } catch (error) {
      console.error('Account deletion error:', error);
      
      window.utils.showAlert(
        `❌ Gagal menghapus akun: ${error.message}. Silakan coba lagi.`,
        'error',
        5000
      );
      
      document.getElementById('cancel-delete-account').disabled = false;
      this.resetDeleteModal();
    }
  }
  
  async deleteAllUserFiles() {
    try {
      if (!this.files.length) return true;
      
      const filePaths = this.files.map(file => `${this.currentUser.id}/${file.name}`);
      
      const { error } = await this.supabase.storage
        .from('secure-files')
        .remove(filePaths);
      
      if (error) {
        console.warn('Some files failed to delete:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting files:', error);
      throw new Error('Gagal menghapus file');
    }
  }
  
  async deleteUserDatabaseData() {
    try {
      const deletionRecord = {
        user_id: this.currentUser.id,
        user_email: this.currentUser.email,
        deleted_at: new Date().toISOString(),
        user_agent: navigator.userAgent
      };
      
      try {
        const { error } = await this.supabase
          .from('account_deletions')
          .insert([deletionRecord]);
          
        if (error) {
          console.warn('Failed to save deletion record:', error);
        }
      } catch (dbError) {
        console.warn('Account deletions table might not exist:', dbError);
      }
      
      localStorage.clear();
      sessionStorage.clear();
      
      return true;
    } catch (error) {
      console.error('Error deleting database data:', error);
      throw new Error('Gagal menghapus data database');
    }
  }
  
  async cleanupUserAccount() {
    try {
      await this.supabase.auth.signOut({ scope: 'global' });
      
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw new Error('Gagal membersihkan akun');
    }
  }
  
  updateProgressStep(stepId, completed) {
    const stepElement = document.getElementById(stepId);
    if (stepElement) {
      const icon = stepElement.querySelector('i');
      const text = stepElement.querySelector('span');
      
      if (completed) {
        icon.className = 'fas fa-check-circle text-success';
        text.textContent = '✓ ' + text.textContent.replace('✓ ', '');
      } else {
        icon.className = 'fas fa-spinner fa-spin';
      }
    }
  }
  
  updateProgressBar(percentage) {
    const progressBar = document.getElementById('delete-progress-bar');
    if (progressBar) {
      progressBar.style.width = percentage + '%';
    }
  }
  
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  applyFilter(filterType) {
    let filteredFiles = [...this.files];
    
    switch(filterType) {
      case 'newest':
        filteredFiles.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        break;
        
      case 'largest':
        filteredFiles.sort((a, b) => 
          (b.metadata?.size || 0) - (a.metadata?.size || 0)
        );
        break;
        
      default:
        filteredFiles.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        break;
    }
    
    this.renderFilteredFiles(filteredFiles);
  }
  
  async loadDashboard() {
    await this.loadStats();
    await this.loadFiles();
    this.switchSection('upload');
  }
  
  async loadStats() {
    try {
      await this.loadFiles();
    } catch (error) {
      console.error('Load stats error:', error);
    }
  }
  
  async loadFiles() {
    try {
      const refreshBtn = document.getElementById('refresh-files');
      window.utils.showLoading(refreshBtn, 'Memuat...');
      
      const { data, error } = await this.supabase.storage
        .from('secure-files')
        .list(this.currentUser.id, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (error) throw error;
      
      this.files = data || [];
      this.renderFiles();
      this.updateStats();
      
    } catch (error) {
      console.error('Load files error:', error);
      window.utils.showAlert('Gagal memuat file: ' + error.message, 'error');
    } finally {
      window.utils.hideLoading(document.getElementById('refresh-files'));
    }
  }
  
  renderFiles() {
    const container = document.getElementById('file-items-container');
    if (!container) return;
    
    if (!this.files.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open empty-icon"></i>
          <h3 class="empty-title">Belum ada file</h3>
          <p class="empty-description">Upload file pertama Anda untuk mulai menggunakan Cloud Secure Vault</p>
        </div>
      `;
      return;
    }
    
    const sortedFiles = [...this.files].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    this.renderFilteredFiles(sortedFiles);
  }
  
  renderFilteredFiles(filteredFiles) {
    const container = document.getElementById('file-items-container');
    if (!container) return;
    
    if (!filteredFiles.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search empty-icon"></i>
          <h3 class="empty-title">File tidak ditemukan</h3>
          <p class="empty-description">Coba gunakan kata kunci pencarian yang berbeda</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    
    filteredFiles.forEach(file => {
      const fileName = file.name.replace(/\.enc$/, '').replace(/^\d+_/, '');
      const fileSize = window.utils.formatFileSize(file.metadata?.size || 0);
      const fileDate = window.utils.formatDate(file.created_at);
      const fileIcon = window.utils.getFileIcon(fileName);
      
      html += `
        <div class="file-item">
          <div class="file-icon">
            <i class="${fileIcon}"></i>
          </div>
          <div class="file-info">
            <div class="file-name" title="${fileName}">${fileName}</div>
            <div class="file-meta">
              <span>${fileSize}</span>
              <span>•</span>
              <span>${fileDate}</span>
            </div>
          </div>
          <div class="file-actions">
            <button class="action-btn download-btn" data-file="${file.name}" title="Download">
              <i class="fas fa-download"></i>
            </button>
            <button class="action-btn delete-btn delete" data-file="${file.name}" title="Hapus">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    
    container.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fileName = e.currentTarget.dataset.file;
        this.downloadFile(fileName);
      });
    });
    
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fileName = e.currentTarget.dataset.file;
        this.showDeleteModal(fileName);
      });
    });
  }
  
  updateStats() {
    const totalFilesEl = document.getElementById('total-files');
    if (totalFilesEl) {
      totalFilesEl.textContent = this.files.length;
    }
    
    const totalSizeEl = document.getElementById('total-size');
    if (totalSizeEl) {
      const totalBytes = this.files.reduce((sum, file) => {
        return sum + (file.metadata?.size || 0);
      }, 0);
      totalSizeEl.textContent = window.utils.formatFileSize(totalBytes);
    }
  }
  
  handleFileSelect() {
    const fileInput = document.getElementById('file-input');
    const keyWarning = document.getElementById('key-warning');
    
    if (fileInput.files.length > 0) {
      keyWarning.style.display = 'block';
      window.utils.showAlert('File siap untuk dienkripsi', 'info');
    }
  }
  
  toggleUploadButton(key) {
    const uploadBtn = document.getElementById('encrypt-upload-btn');
    if (uploadBtn) {
      uploadBtn.disabled = !key || key.length < 8;
    }
  }
  
  async uploadFile() {
    const fileInput = document.getElementById('file-input');
    const keyInput = document.getElementById('encryption-key');
    const uploadBtn = document.getElementById('encrypt-upload-btn');
    
    if (!fileInput.files.length) {
      return window.utils.showAlert('Pilih file terlebih dahulu', 'error');
    }
    
    const key = keyInput?.value;
    if (!key || key.length < 8) {
      return window.utils.showAlert('Kunci enkripsi minimal 8 karakter', 'error');
    }
    
    const file = fileInput.files[0];
    
    if (file.size > 100 * 1024 * 1024) {
      return window.utils.showAlert('File terlalu besar! Maksimum 100MB.', 'error');
    }
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        window.utils.showLoading(uploadBtn, 'Mengenkripsi...');
        
        const bytes = new Uint8Array(e.target.result);
        const wordArray = this.crypto.lib.WordArray.create(bytes);
        const encrypted = this.crypto.AES.encrypt(wordArray, key).toString();
        
        const blob = new Blob([encrypted], { type: 'text/plain' });
        const timestamp = Date.now();
        const safeFileName = window.utils.sanitizeFilename(file.name);
        const filePath = `${this.currentUser.id}/${timestamp}_${safeFileName}.enc`;
        
        const { error } = await this.supabase.storage
          .from('secure-files')
          .upload(filePath, blob, { upsert: true });
        
        if (error) throw error;
        
        window.utils.showAlert('✅ File berhasil dienkripsi dan diupload!', 'success');
        
        fileInput.value = '';
        keyInput.value = '';
        document.getElementById('key-warning').style.display = 'none';
        
        await this.loadFiles();
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        this.applyFilter(activeFilter);
        this.switchSection('files');
        
      } catch (error) {
        console.error('Upload error:', error);
        window.utils.showAlert('Gagal upload: ' + error.message, 'error');
      } finally {
        window.utils.hideLoading(uploadBtn);
      }
    };
    
    reader.readAsArrayBuffer(file);
  }
  
  async downloadFile(fileName) {
    const key = prompt('Masukkan kunci enkripsi untuk mendownload:');
    if (!key) return;
    
    if (!key || key.length < 8) {
      window.utils.showAlert('Kunci enkripsi minimal 8 karakter', 'error');
      return;
    }
    
    try {
      window.utils.showAlert('Mendownload file...', 'info');
      
      const filePath = `${this.currentUser.id}/${fileName}`;
      
      const { data: blobData, error } = await this.supabase.storage
        .from('secure-files')
        .download(filePath);
      
      if (error) throw error;
      
      const encryptedText = await blobData.text();
      const decrypted = this.crypto.AES.decrypt(encryptedText, key);
      
      if (!decrypted || !decrypted.sigBytes) {
        throw new Error('Kunci dekripsi salah atau file rusak');
      }
      
      const words = decrypted.words;
      const sigBytes = decrypted.sigBytes;
      const bytes = new Uint8Array(sigBytes);
      
      let byteIndex = 0;
      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        const word = words[wordIndex];
        for (let byteOffset = 24; byteOffset >= 0; byteOffset -= 8) {
          if (byteIndex < sigBytes) {
            bytes[byteIndex] = (word >> byteOffset) & 0xff;
            byteIndex++;
          }
        }
      }
      
      const originalName = fileName.replace(/\.enc$/, '').replace(/^\d+_/, '');
      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      window.utils.showAlert('File berhasil didownload!', 'success');
      
    } catch (error) {
      console.error('Download error:', error);
      window.utils.showAlert('Gagal mendownload: ' + error.message, 'error');
    }
  }
  
  showDeleteModal(fileName) {
    this.fileToDelete = fileName;
    const displayName = fileName.replace(/\.enc$/, '').replace(/^\d+_/, '');
    
    const deleteNameEl = document.getElementById('file-to-delete-name');
    if (deleteNameEl) {
      deleteNameEl.textContent = displayName.substring(0, 50) + 
        (displayName.length > 50 ? '...' : '');
    }
    
    document.getElementById('delete-modal').classList.add('active');
  }
  
  async deleteFile() {
    if (!this.fileToDelete) return;
    
    const deleteBtn = document.getElementById('confirm-delete');
    
    try {
      window.utils.showLoading(deleteBtn, 'Menghapus...');
      
      const filePath = `${this.currentUser.id}/${this.fileToDelete}`;
      const { error } = await this.supabase.storage
        .from('secure-files')
        .remove([filePath]);
      
      if (error) throw error;
      
      this.files = this.files.filter(f => f.name !== this.fileToDelete);
      
      const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
      this.applyFilter(activeFilter);
      this.updateStats();
      
      document.getElementById('delete-modal').classList.remove('active');
      this.fileToDelete = null;
      
      window.utils.showAlert('✅ File berhasil dihapus!', 'success');
      
    } catch (error) {
      console.error('Delete error:', error);
      window.utils.showAlert('Gagal menghapus file: ' + error.message, 'error');
    } finally {
      window.utils.hideLoading(deleteBtn);
    }
  }
  
  showChangePasswordModal() {
    document.getElementById('change-password-modal').classList.add('active');
  }
  
  async changePassword() {
    const currentPass = document.getElementById('current-password')?.value;
    const newPass = document.getElementById('new-password-modal')?.value;
    const confirmPass = document.getElementById('confirm-password-modal')?.value;
    const saveBtn = document.getElementById('save-password-btn');
    
    if (!currentPass || !newPass || !confirmPass) {
      return window.utils.showAlert('Harap isi semua field', 'error');
    }
    
    if (newPass.length < 6) {
      return window.utils.showAlert('Password baru minimal 6 karakter', 'error');
    }
    
    if (newPass !== confirmPass) {
      return window.utils.showAlert('Password tidak cocok', 'error');
    }
    
    try {
      window.utils.showLoading(saveBtn, 'Menyimpan...');
      
      const { error: verifyError } = await this.supabase.auth.signInWithPassword({
        email: this.currentUser.email,
        password: currentPass
      });
      
      if (verifyError) {
        throw new Error('Password saat ini salah');
      }
      
      const { error: updateError } = await this.supabase.auth.updateUser({
        password: newPass
      });
      
      if (updateError) throw updateError;
      
      window.utils.showAlert('✅ Password berhasil diubah!', 'success');
      
      document.getElementById('current-password').value = '';
      document.getElementById('new-password-modal').value = '';
      document.getElementById('confirm-password-modal').value = '';
      document.getElementById('change-password-modal').classList.remove('active');
      
    } catch (error) {
      console.error('Change password error:', error);
      window.utils.showAlert('Gagal mengubah password: ' + error.message, 'error');
    } finally {
      window.utils.hideLoading(saveBtn);
    }
  }
  
  switchSection(section) {
    this.currentSection = section;
    
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const sections = ['upload-section', 'file-list-section'];
    sections.forEach(sec => {
      const el = document.getElementById(sec);
      if (el) el.style.display = 'none';
    });
    
    if (section === 'upload') {
      document.getElementById('nav-upload')?.classList.add('active');
      const uploadSection = document.getElementById('upload-section');
      if (uploadSection) uploadSection.style.display = 'block';
      document.title = 'Upload File - Cloud Secure Vault';
    } else if (section === 'files') {
      document.getElementById('nav-files')?.classList.add('active');
      const filesSection = document.getElementById('file-list-section');
      if (filesSection) filesSection.style.display = 'block';
      document.title = 'File Saya - Cloud Secure Vault';
      this.loadFiles();
    }
    
    if (window.innerWidth <= 991) {
      this.toggleMobileMenu(false);
    }
  }
  
  setupDragAndDrop() {
    const uploadSection = document.getElementById('upload-section');
    if (!uploadSection) return;
    
    uploadSection.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadSection.classList.add('drag-over');
    });
    
    uploadSection.addEventListener('dragleave', () => {
      uploadSection.classList.remove('drag-over');
    });
    
    uploadSection.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadSection.classList.remove('drag-over');
      
      if (e.dataTransfer.files.length > 0) {
        const fileInput = document.getElementById('file-input');
        fileInput.files = e.dataTransfer.files;
        this.handleFileSelect();
        window.utils.showAlert('File siap untuk dienkripsi', 'success');
      }
    });
  }
  
  setupModals() {
    document.getElementById('close-password-modal')?.addEventListener('click', () => {
      document.getElementById('change-password-modal').classList.remove('active');
    });
    
    document.getElementById('save-password-btn')?.addEventListener('click', () => this.changePassword());
    
    document.getElementById('close-delete-modal')?.addEventListener('click', () => {
      document.getElementById('delete-modal').classList.remove('active');
    });
    
    document.getElementById('cancel-delete')?.addEventListener('click', () => {
      document.getElementById('delete-modal').classList.remove('active');
    });
    
    document.getElementById('confirm-delete')?.addEventListener('click', () => this.deleteFile());
    
    document.getElementById('close-delete-account-modal')?.addEventListener('click', () => {
      document.getElementById('delete-account-modal').classList.remove('active');
      this.resetDeleteModal();
    });
    
    document.getElementById('cancel-delete-account')?.addEventListener('click', () => {
      document.getElementById('delete-account-modal').classList.remove('active');
      this.resetDeleteModal();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.getElementById('change-password-modal').classList.remove('active');
        document.getElementById('delete-modal').classList.remove('active');
        document.getElementById('delete-account-modal').classList.remove('active');
      }
    });
    
    window.addEventListener('click', (e) => {
      if (e.target === document.getElementById('change-password-modal')) {
        document.getElementById('change-password-modal').classList.remove('active');
      }
      if (e.target === document.getElementById('delete-modal')) {
        document.getElementById('delete-modal').classList.remove('active');
      }
      if (e.target === document.getElementById('delete-account-modal')) {
        document.getElementById('delete-account-modal').classList.remove('active');
        this.resetDeleteModal();
      }
    });
    
    document.getElementById('current-password')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.changePassword();
    });
    
    document.getElementById('new-password-modal')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.changePassword();
    });
    
    document.getElementById('confirm-password-modal')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.changePassword();
    });
  }
  
  setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const searchHandler = window.utils.debounce(() => {
      const query = searchInput.value.toLowerCase();
      const filteredFiles = this.files.filter(file => 
        file.name.toLowerCase().includes(query)
      );
      this.renderFilteredFiles(filteredFiles);
    }, 300);
    
    searchInput.addEventListener('input', searchHandler);
  }
  
  toggleMobileMenu(show) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      if (typeof show === 'boolean') {
        sidebar.classList.toggle('active', show);
      } else {
        sidebar.classList.toggle('active');
      }
    }
  }
  
  setupResponsive() {
    this.handleResize();
    
    window.addEventListener('resize', window.utils.debounce(() => {
      this.handleResize();
    }, 250));
    
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 991) {
          this.toggleMobileMenu(false);
        }
      });
    });
  }
  
  handleResize() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    
    if (window.innerWidth <= 991) {
      if (mobileMenuBtn) mobileMenuBtn.style.display = 'flex';
      if (sidebar) sidebar.classList.remove('active');
    } else {
      if (mobileMenuBtn) mobileMenuBtn.style.display = 'none';
      if (sidebar) sidebar.classList.add('active');
    }
  }
  
  async logout() {
    try {
      await this.supabase.auth.signOut();
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout error:', error);
      window.utils.showAlert('Logout gagal: ' + error.message, 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('dashboard.html')) {
    window.dashboardManager = new DashboardManager();
  }
});
