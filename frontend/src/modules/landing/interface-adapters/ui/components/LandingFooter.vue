<template>
  <footer class="landing-footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <div class="logo">
            <div class="logo-icon">V</div>
            <span class="logo-text">{{ labels.logoText }}</span>
          </div>
          <p class="footer-description">
            {{ labels.description }}
          </p>
        </div>

        <div class="footer-links">
          <div class="link-column">
            <h3 class="link-title">{{ labels.product }}</h3>
            <ul class="link-list">
              <li><a href="#how-it-works">{{ labels.howItWorks }}</a></li>
              <li><a href="#validation-types">{{ labels.validationTypes }}</a></li>
              <li><a href="#pricing">{{ labels.pricing }}</a></li>
              <li><a href="#case-studies">{{ labels.caseStudies }}</a></li>
            </ul>
          </div>

          <div class="link-column">
            <h3 class="link-title">{{ labels.resources }}</h3>
            <ul class="link-list">
              <li><a href="#blog">{{ labels.blog }}</a></li>
              <li><a href="#help">{{ labels.helpCenter }}</a></li>
              <li><a href="#community">{{ labels.community }}</a></li>
              <li><a href="#api">{{ labels.apiDocs }}</a></li>
            </ul>
          </div>

          <div class="link-column">
            <h3 class="link-title">{{ labels.company }}</h3>
            <ul class="link-list">
              <li><a href="#about">{{ labels.about }}</a></li>
              <li><a href="#careers">{{ labels.careers }}</a></li>
              <li><a href="#contact">{{ labels.contact }}</a></li>
              <li><a href="#partners">{{ labels.partners }}</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="copyright">{{ labels.copyright }}</div>
        <div class="social-links">
          <a href="#twitter" class="social-link" aria-label="Twitter">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>
          <a href="#linkedin" class="social-link" aria-label="LinkedIn">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a href="#github" class="social-link" aria-label="GitHub">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
            </svg>
          </a>
          <a href="#email" class="social-link" aria-label="Email">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DEFAULT_LANDING_LABELS } from '../landing-default-labels';

const props = withDefaults(
  defineProps<{ labels?: Partial<typeof DEFAULT_LANDING_LABELS.footer> }>(),
  () => ({})
);

const labels = computed(() => ({ ...DEFAULT_LANDING_LABELS.footer, ...props.labels }));
</script>

<style scoped>
.landing-footer {
  background-color: #111827;
  color: #9ca3af;
  padding-top: 4rem;
  padding-bottom: 2rem;
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

.footer-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

@media (min-width: 768px) {
  .footer-content {
    grid-template-columns: 2fr 3fr;
  }
}

.footer-brand {
  max-width: 20rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.logo-icon {
  width: 2rem;
  height: 2rem;
  background: var(--color-accent, #0d9488);
  border-radius: var(--radius-md, 0.625rem);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.footer-description {
  font-size: 0.875rem;
  color: #9ca3af;
  line-height: 1.5;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

@media (min-width: 1024px) {
  .footer-links {
    grid-template-columns: repeat(3, 1fr);
  }
}

.link-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  margin-bottom: 1rem;
}

.link-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.link-list a {
  font-size: 0.875rem;
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.2s;
}

.link-list a:hover {
  color: white;
}

.footer-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid #374151;
}

@media (min-width: 640px) {
  .footer-bottom {
    flex-direction: row;
  }
}

.copyright {
  font-size: 0.875rem;
  color: #6b7280;
}

.social-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.social-link {
  width: 2.5rem;
  height: 2.5rem;
  background-color: #1f2937;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: background-color 0.2s, color 0.2s;
}

.social-link:hover {
  background-color: #374151;
  color: white;
}

.social-link svg {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
