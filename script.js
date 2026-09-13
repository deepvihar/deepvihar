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