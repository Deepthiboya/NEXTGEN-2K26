// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initAnimations();
    
    // Initialize smooth scrolling
    initSmoothScroll();
    
    // Initialize department card hover effects
    initDepartmentCards();
    
    // Initialize contact form
    initContactForm();
    
    // Initialize sticky header
    initStickyHeader();
});

// Function to initialize animations
function initAnimations() {
    const animatedElements = document.querySelectorAll('.highlight-card, .department-card, .timeline-item, .sponsor-placeholder');
    
    // Create intersection observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    
    // Observe each element
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Function to initialize smooth scrolling
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('nav a, .cta-button, .footer-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Check if the link is an anchor
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// Function to initialize department cards
function initDepartmentCards() {
    const departmentCards = document.querySelectorAll('.department-card');
    
    departmentCards.forEach(card => {
        card.addEventListener('click', function() {
            const link = this.querySelector('.department-link');
            if (link) {
                window.location.href = link.getAttribute('href');
            }
        });
    });
}

// Function to initialize contact form
function initContactForm() {
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const formDataObj = {};
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            // Simulate form submission with a loading state
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;
            
            // Simulate an API call with a timeout
            setTimeout(() => {
                // Reset the form
                contactForm.reset();
                
                // Show success message
                showNotification('Message sent successfully! We will get back to you soon.', 'success');
                
                // Reset button
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 1500);
        });
    }
}

// Function to initialize sticky header
function initStickyHeader() {
    const header = document.querySelector('header');
    const hero = document.querySelector('.hero');
    let lastScrollPosition = 0;
    
    window.addEventListener('scroll', () => {
        const currentScrollPosition = window.pageYOffset;
        
        // Add/remove sticky class based on scroll position
        if (currentScrollPosition > hero.offsetHeight) {
            header.classList.add('header-sticky');
        } else {
            header.classList.remove('header-sticky');
        }
        
        // Hide/show header based on scroll direction
        if (currentScrollPosition > lastScrollPosition && currentScrollPosition > header.offsetHeight) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollPosition = currentScrollPosition;
    });
}

// Function to show notifications
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add notification to DOM
    document.body.appendChild(notification);
    
    // Add active class to trigger animation
    setTimeout(() => {
        notification.classList.add('active');
    }, 10);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Function to handle countdown timer
function initCountdownTimer() {
    const countdownElement = document.querySelector('.countdown');
    
    if (countdownElement) {
        // Set event date (March 25, 2025)
        const eventDate = new Date('2025-03-25T09:00:00').getTime();
        
        // Update countdown every second
        const countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = eventDate - now;
            
            // Calculate days, hours, minutes, seconds
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            // Update HTML
            countdownElement.innerHTML = `
                <div class="countdown-item">
                    <span class="countdown-number">${days}</span>
                    <span class="countdown-label">Days</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-number">${hours}</span>
                    <span class="countdown-label">Hours</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-number">${minutes}</span>
                    <span class="countdown-label">Minutes</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-number">${seconds}</span>
                    <span class="countdown-label">Seconds</span>
                </div>
            `;
            
            // If countdown is over
            if (distance < 0) {
                clearInterval(countdownInterval);
                countdownElement.innerHTML = '<div class="event-live">Event Live Now!</div>';
            }
        }, 1000);
    }
}

// Function to handle image gallery
function initImageGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (galleryItems.length > 0) {
        galleryItems.forEach(item => {
            item.addEventListener('click', function() {
                const imgSrc = this.querySelector('img').getAttribute('src');
                const imgAlt = this.querySelector('img').getAttribute('alt');
                
                // Create modal
                const modal = document.createElement('div');
                modal.className = 'gallery-modal';
                modal.innerHTML = `
                    <div class="gallery-modal-content">
                        <span class="gallery-modal-close">&times;</span>
                        <img src="${imgSrc}" alt="${imgAlt}">
                        <p>${imgAlt}</p>
                    </div>
                `;
                
                // Add modal to DOM
                document.body.appendChild(modal);
                
                // Prevent scrolling when modal is open
                document.body.style.overflow = 'hidden';
                
                // Close modal when clicking on close button
                modal.querySelector('.gallery-modal-close').addEventListener('click', () => {
                    document.body.removeChild(modal);
                    document.body.style.overflow = '';
                });
                
                // Close modal when clicking outside the image
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        document.body.removeChild(modal);
                        document.body.style.overflow = '';
                    }
                });
            });
        });
    }
}


// Event listener for window resize
window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
        if (!document.querySelector('.nav-toggle')) {
            initMobileMenu();
        }
    }
});
 // Countdown Timer
 function updateCountdown() {
    const eventDate = new Date('April 3, 2025 09:00:00').getTime();
    const now = new Date().getTime();
    const timeLeft = eventDate - now;

    if (timeLeft > 0) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = days;
        document.getElementById('hours').textContent = hours;
        document.getElementById('minutes').textContent = minutes;
        document.getElementById('seconds').textContent = seconds;
    } else {
        document.querySelector('.countdown').innerHTML = '<h3>Event Has Started!</h3>';
    }
}

// Update countdown every second
setInterval(updateCountdown, 1000);
updateCountdown();
