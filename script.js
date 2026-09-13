// Mobile menu toggle logic
function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    if (window.innerWidth <= 768) {
        navLinks.classList.toggle('active');
    }
}

// Scroll Reveal Animation Logic
document.addEventListener("DOMContentLoaded", function () {
    const reveals = document.querySelectorAll(".reveal");

    const revealOptions = {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                // Optional: Stop observing once revealed so it doesn't animate out and back in
                // observer.unobserve(entry.target); 
            }
        });
    }, revealOptions);

    reveals.forEach(reveal => {
        revealOnScroll.observe(reveal);
    });
    
    // Theme Toggle Logic setup inside DOMContentLoaded to ensure elements exist
    const themeToggleBtn = document.getElementById('theme-toggle');
    if(themeToggleBtn) {
        const themeIcon = themeToggleBtn.querySelector('i');

        // Check local storage for previously saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }

        // Toggle Event Listener
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            
            // Check if dark mode is active and save/update icon appropriately
            if (document.body.classList.contains('dark-mode')) {
                themeIcon.classList.replace('fa-moon', 'fa-sun');
                localStorage.setItem('theme', 'dark');
            } else {
                themeIcon.classList.replace('fa-sun', 'fa-moon');
                localStorage.setItem('theme', 'light');
            }
        });
    }
});

// Chat Widget Embed
fetch('chat.html')
    .then(response => response.text())
    .then(data => {
        const container = document.getElementById('chat-widget-container');
        if (container) {
            container.innerHTML = data;

            // Re-evaluate scripts found inside the fetched HTML
            const scripts = container.getElementsByTagName("script");
            for (let i = 0; i < scripts.length; i++) {
                const newScript = document.createElement("script");
                newScript.text = scripts[i].text;
                document.body.appendChild(newScript);
            }
        }
    })
    .catch(error => console.error('Error loading chat widget:', error));