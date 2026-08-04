import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function showSlide(block, index) {
  const slides = block.querySelectorAll('.carousel-slide');
  const dots = block.querySelectorAll('.carousel-dot');
  const total = slides.length;
  const newIndex = (index + total) % total;

  slides.forEach((slide, i) => {
    slide.setAttribute('aria-hidden', i !== newIndex);
    slide.style.display = i === newIndex ? '' : 'none';
  });
  dots.forEach((dot, i) => {
    dot.setAttribute('aria-selected', i === newIndex);
  });
  block.dataset.activeSlide = newIndex;
}

export default function decorate(block) {
  const slides = [...block.children];

  slides.forEach((row, i) => {
    row.classList.add('carousel-slide');
    row.setAttribute('role', 'group');
    row.setAttribute('aria-roledescription', 'slide');
    row.setAttribute('aria-label', `${i + 1} / ${slides.length}`);

    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture')) cell.className = 'carousel-slide-image';
      else cell.className = 'carousel-slide-content';
    });
  });

  block.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  const nav = document.createElement('div');
  nav.className = 'carousel-nav';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'carousel-prev';
  prevBtn.setAttribute('aria-label', 'Previous slide');
  prevBtn.addEventListener('click', () => {
    showSlide(block, Number(block.dataset.activeSlide || 0) - 1);
  });

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'carousel-next';
  nextBtn.setAttribute('aria-label', 'Next slide');
  nextBtn.addEventListener('click', () => {
    showSlide(block, Number(block.dataset.activeSlide || 0) + 1);
  });

  nav.append(prevBtn, nextBtn);

  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => showSlide(block, i));
    dots.append(dot);
  });

  block.append(nav, dots);
  showSlide(block, 0);
}
