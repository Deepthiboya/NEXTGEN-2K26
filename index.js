    const scriptURL = 'https://script.google.com/macros/s/AKfycbxaLnMrJsOt1ehE3jCOrlq-CqDB7JLkpGWrzpB5TEsI55pjBLZZXGSieUgwgpAM3L2lKA/exec';
    const form = document.forms['submit-to-google-sheet'];
    const msg = document.getElementById('msg');
    if(form){
      form.addEventListener('submit', e => {
        e.preventDefault();
        fetch(scriptURL, { method:'POST', body: new FormData(form) })
          .then(() => { msg.textContent = 'Message Sent Successfully'; setTimeout(()=> msg.textContent='', 4000); form.reset(); })
          .catch(() => { msg.textContent = 'Error sending message. Try again.'; });
      });
        const glow = document.getElementById('nxGlow');
  document.querySelector('.nx-header').addEventListener('mousemove', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    glow.style.left = `${e.clientX - rect.left}px`;
    glow.style.top  = `${e.clientY - rect.top}px`;
  });
    
    // Set the date for the event countdown
    const countdownDate = new Date("October 15, 2025 00:00:00").getTime();

    // Update the timer every second
    const timerInterval = setInterval(function() {
      // Get today's date and time
      const now = new Date().getTime();
      
      // Find the distance between now and the countdown date
      const distance = countdownDate - now;
      
      // Time calculations for days, hours, minutes and seconds
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      // Display the results in the elements with corresponding IDs
      document.getElementById("days").innerText = days;
      document.getElementById("hours").innerText = hours;
      document.getElementById("minutes").innerText = minutes;
      document.getElementById("seconds").innerText = seconds;
      
      // If the countdown is finished, display a message
      if (distance < 0) {
        clearInterval(timerInterval);
        document.querySelector(".timer").innerHTML = "<div class='tick'><div class='value'>Event is Live!</div></div>";
      }
    }, 1000);
    }
 
  // 1) Header smart hide on scroll
  (function(){
    const header = document.querySelector('.nx-header');
    if(!header) return;
    let lastY = window.scrollY;
    function onScroll(){
      const y = window.scrollY;
      if (y < 10) { header.classList.remove('scrolled-down'); header.classList.add('scrolled-up'); return; }
      if (y > lastY + 6) {
        header.classList.add('scrolled-down');
        header.classList.remove('scrolled-up');
      } else if (y < lastY - 6) {
        header.classList.add('scrolled-up');
        header.classList.remove('scrolled-down');
      }
      lastY = y;
    }
    header.classList.add('scrolled-up');
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  // 2) Timeline: mark items when they enter the viewport
  (function(){
    const items = document.querySelectorAll('.tl-item');
    if (!items.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('in-view');
      });
    }, { threshold: 0.35 });
    items.forEach(el => io.observe(el));
  })();

  // 3) Contact message reveal (ties into #msg.show)
  (function(){
    const msg = document.getElementById('msg');
    if (!msg) return;
    const observer = new MutationObserver(() => {
      msg.classList.toggle('show', !!msg.textContent.trim());
    });
    observer.observe(msg, { childList: true, subtree: true, characterData: true });
  })();
