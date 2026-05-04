(function() {
    // Inject the CSS for the particles
    const style = document.createElement('style');
    style.innerHTML = `
        .cursor-particle {
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 9999;
            will-change: transform, opacity;
        }
    `;
    document.head.appendChild(style);

    // Qnario colors for the particles (matching the theme)
    const colors = ['#667eea', '#764ba2', '#4facfe', '#f5576c', '#00f2fe', '#a18cd1'];
    const particles = [];
    
    function createParticle(x, y) {
        const el = document.createElement('div');
        el.className = 'cursor-particle';
        
        el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Random dimensions to look like little dashes and dots
        const isDash = Math.random() > 0.4;
        const width = isDash ? (Math.random() * 8 + 4) : Math.random() * 4 + 2;
        const height = isDash ? Math.random() * 2 + 1 : width;
        wefwefwe
        el.style.width = width + 'px';
        el.style.height = height + 'px';
        
        // Center the element precisely
        el.style.marginLeft = -(width/2) + 'px';
        el.style.marginTop = -(height/2) + 'px';
        
        el.style.borderRadius = isDash ? '2px' : '50%';
        
        document.body.appendChild(el);
        
        // Random direction for burst
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 4 + 1; // burst speed
        
        particles.push({
            el: el,
            x: x,
            y: y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 15,
            life: 1, 
            decay: Math.random() * 0.015 + 0.01 // fade speed
        });
    }

    let lastX = -999;
    let lastY = -999;

    document.addEventListener('mousemove', function(e) {
        if (lastX === -999) {
            lastX = e.clientX;
            lastY = e.clientY;
            return;
        }

        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Burst particles based on how far the mouse moved
        if (dist > 2) {
            // Amount of particles scales with movement speed
            const count = Math.min(Math.floor(dist / 8), 5) + 1; 
            for(let i=0; i<count; i++) {
                // Add slight randomness to spawn location along the movement vector
                const spawnX = lastX + (dx * Math.random());
                const spawnY = lastY + (dy * Math.random());
                createParticle(spawnX, spawnY);
            }
        }
        
        lastX = e.clientX;
        lastY = e.clientY;
    });

    function animateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            
            // Friction (slow down over time)
            p.vx *= 0.92;
            p.vy *= 0.92;
            
            // Antigravity drift (slow float upward)
            p.vy -= 0.04; 
            
            p.rotation += p.rotSpeed;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                p.el.remove();
                particles.splice(i, 1);
            } else {
                p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${p.life})`;
                p.el.style.opacity = p.life;
            }
        }
        requestAnimationFrame(animateParticles);
    }
    
    // Start the animation frame loop
    animateParticles();
})();
