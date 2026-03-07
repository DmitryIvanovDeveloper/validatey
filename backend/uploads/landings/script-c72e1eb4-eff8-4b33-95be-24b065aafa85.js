// Enhanced JavaScript functionality for the landing page

// Form handling with better UX
function handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Processing...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Simulate API call
    setTimeout(() => {
        console.log('Form submitted:', data);

        // Show success message
        const formContainer = document.getElementById('signup-form');
        const successMessage = document.getElementById('success-message');

        formContainer.style.display = 'none';
        successMessage.style.display = 'block';

        // Track conversion (if analytics is available)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'conversion', {
                'event_category': 'engagement',
                'event_label': 'beta_signup'
            });
        }

        // Reset form after 5 seconds
        setTimeout(() => {
            form.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            formContainer.style.display = 'block';
            successMessage.style.display = 'none';
        }, 5000);
    }, 1000);
}

// Smooth scrolling for anchor links
function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Enhanced CTA button behavior
document.addEventListener('DOMContentLoaded', function() {
    // CTA button smooth scroll
    const ctaButtons = document.querySelectorAll('.cta-button, .cta-btn');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#cta' || this.classList.contains('cta-button')) {
                e.preventDefault();
                scrollToElement('#cta');
            }
        });
    });

    // Add loading states to form buttons
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                submitBtn.disabled = true;
                submitBtn.dataset.originalText = submitBtn.textContent;
                submitBtn.textContent = 'Please wait...';
            }
        });
    });

    // Intersection Observer for animations
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.problem-card, .feature-card, .solution-content').forEach(el => {
            observer.observe(el);
        });
    }

    // Keyboard navigation improvements
    document.addEventListener('keydown', function(e) {
        // Close success message on Escape
        if (e.key === 'Escape') {
            const successMessage = document.getElementById('success-message');
            const signupForm = document.getElementById('signup-form');

            if (successMessage && successMessage.style.display === 'block') {
                successMessage.style.display = 'none';
                if (signupForm) signupForm.style.display = 'block';
            }
        }
    });

    // Form validation improvements
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

            if (email && !isValid) {
                this.setCustomValidity('Please enter a valid email address');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    // Auto-resize textarea
    const textarea = document.getElementById('project');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }
});

// Performance optimizations
(function() {
    // Preload critical resources
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = 'styles.css';
    link.as = 'style';
    document.head.appendChild(link);

    // Add resource hints
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = '//fonts.googleapis.com';
    document.head.appendChild(dnsPrefetch);
})();

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    // Could send to error tracking service
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    // Could send to error tracking service
});

// Service worker registration (if needed in the future)
if ('serviceWorker' in navigator) {
    // Could register service worker for offline functionality
    // navigator.serviceWorker.register('/sw.js');
}