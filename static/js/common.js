document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');
    
    if (!hamburger || !navMenu) {
        console.error('Required elements not found');
        return;
    }

    function toggleMenu() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    }

    // Toggle menu on hamburger click
    hamburger.addEventListener('click', toggleMenu);

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
});

// Navbar scroll effect
window.addEventListener("scroll", function () {
  let navbar = document.querySelector("nav");
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

window.addEventListener("load", function () {
    // Remove Preloader after all resources are loaded
    const preloader = document.getElementById("preloader");
    preloader.style.opacity = "0";
    setTimeout(() => {
      preloader.style.display = "none";
    }, 500); // Delay to allow fading effect
  
    /* // Show Hero Section
    const hero = document.getElementById("hero");
    hero.style.opacity = "1"; */
  
    // Function to apply animation to multiple elements
    function applyAnimation(selector, animation) {
      document.querySelectorAll(selector).forEach((element) => {
        element.style.animation = animation;
      });
    }
    // Fade in nav and footer separately after preloader is removed
    document.querySelector("nav").style.opacity = "1";
    document.querySelector("footer").style.opacity = "1";
    // Apply animations correctly
    /* applyAnimation(".hero-content", "showContent 1s 0s ease-in-out forwards");
    applyAnimation(
      "#hero-content-h1",
      "showContent 1s 0.4s ease-in-out forwards"
    );
    applyAnimation(
      "#home-h1-humanity",
      "showContent 1.2s 0.7s ease-in-out forwards"
    ); */
  });

  document.getElementById("hamburger").addEventListener("click", function () {
    document.getElementById("nav-links").classList.toggle("active");
  });
  