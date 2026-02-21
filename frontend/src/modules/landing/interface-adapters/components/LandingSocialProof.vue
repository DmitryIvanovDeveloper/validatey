<template>
  <section class="social-proof-section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Trusted by founders worldwide</h2>
        <p class="section-subtitle">
          Join hundreds of entrepreneurs validating their ideas
        </p>
      </div>

      <div v-if="testimonials.length > 0" class="testimonials-grid">
        <div
          v-for="(testimonial, index) in testimonials"
          :key="index"
          class="testimonial-card"
        >
          <div class="testimonial-stars">
            <svg v-for="i in 5" :key="i" class="star" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <p class="testimonial-quote">"{{ testimonial.quote }}"</p>
          <div class="testimonial-author">
            <div class="author-avatar">
              {{ testimonial.name.charAt(0) }}
            </div>
            <div class="author-info">
              <div class="author-name">{{ testimonial.name }}</div>
              <div class="author-role">{{ testimonial.role }}</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="testimonials-empty">
        <p class="empty-text">Testimonials will appear here as users share their experiences</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const testimonials: Array<{ quote: string; name: string; role: string }> = [];
</script>

<style scoped>
.social-proof-section {
  padding-top: 5rem;
  padding-bottom: 5rem;
  background-color: white;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 2rem;
  }
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text, #0f172a);
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .section-title {
    font-size: 3rem;
  }
}

.section-subtitle {
  font-size: 1.25rem;
  color: var(--color-text-muted, #475569);
  max-width: 42rem;
  margin: 0 auto;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .testimonials-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.testimonial-card {
  background: #f9fafb;
  border-radius: 1rem;
  padding: 2rem;
  border: 1px solid #e5e7eb;
}

.testimonial-stars {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.star {
  width: 1.25rem;
  height: 1.25rem;
  color: #fbbf24;
}

.testimonial-quote {
  color: var(--color-text-muted, #475569);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background-color: var(--color-bg-subtle, #e2e8f0);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted, #475569);
  font-size: 1rem;
  font-weight: 600;
}

.author-name {
  font-weight: 600;
  color: var(--color-text, #0f172a);
}

.author-role {
  font-size: 0.875rem;
  color: var(--color-text-muted, #475569);
}

.testimonials-empty {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-text {
  color: #6b7280;
  font-size: 1rem;
}
</style>
