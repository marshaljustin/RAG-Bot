document.addEventListener('DOMContentLoaded', () => {
    const showError = (message) => {
      const errorEl = document.getElementById('errorMessage');
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      setTimeout(() => errorEl.style.display = 'none', 5000);
    };
  
    // Registration Handler
    
    hideLoader();
   // Registration Handler
    if (document.getElementById('registerForm')) {
      document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        showLoader();
        try {
          btn.disabled = true;
          btn.textContent = 'Registering...';
          
          await new Promise(resolve => setTimeout(resolve, 500));

          const formData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
          };

          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.message);

         
          hideLoader();
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
          window.location.href = '/index.html';
          
        } catch (err) {
          showError(err.message);
        } finally {
          btn.disabled = false;
          btn.textContent = 'Sign up';
          hideLoader(); 
        }
      });
    }
    // Login Handler
    hideLoader();
    if (document.getElementById('loginForm')) {
      document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        showLoader();
        try {
          btn.disabled = true;
          btn.textContent = 'Signing in...';
          await new Promise(resolve => setTimeout(resolve, 500));
  
          const formData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
          };
  
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
  
          const data = await response.json();
          if (!response.ok) throw new Error(data.message);
  
          localStorage.setItem('token', data.token);
          window.location.href = '/index.html';
          
        } catch (err) {
          showError(err.message);
        } finally {
          btn.disabled = false;
          btn.textContent = 'Sign in';
        }
      });
    }
  });
  
  async function checkLoginStatus() {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        window.location.href = '/login.html';
        return;
      }
      
      const { email } = await response.json();
      document.getElementById('userEmail').textContent = email;
      
      // Clear browser cache
      window.history.replaceState({}, document.title, window.location.href);
      
    } catch (err) {
      window.location.href = '/login.html';
    }
  }
  
  // Add this to handle browser back/forward cache
  window.onpageshow = function(event) {
    if (event.persisted) {
      checkLoginStatus();
    }
  };
  function showLoader() {
    document.getElementById("loader").style.display = "flex";
    document.body.classList.add('modal-open');
}

function hideLoader() {
    document.getElementById("loader").style.display = "none";
    document.body.classList.remove('modal-open');
}

