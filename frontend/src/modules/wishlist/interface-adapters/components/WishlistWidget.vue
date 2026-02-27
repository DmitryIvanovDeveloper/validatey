<template>
  <div class="wishlist-widget">
    <form @submit.prevent="handleSubmit" class="wishlist-form">
      <input
        v-model="email"
        type="email"
        :placeholder="placeholder"
        class="wishlist-input"
        required
        :disabled="submitting"
        :class="{ 'error': hasError }"
      />
      <button
        type="submit"
        class="wishlist-button"
        :disabled="submitting || !email || !isValidEmail"
        :class="{ 'loading': submitting }"
      >
        <span v-if="!submitting" class="button-text">
          <svg class="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          {{ buttonText }}
        </span>
        <span v-else class="button-text">
          <svg class="button-icon spinning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ submittingText }}
        </span>
      </button>
      
      <transition name="message-fade">
        <div v-if="message" :class="['wishlist-message', success ? 'success' : 'error']">
          <svg v-if="success" class="message-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="message-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <span>{{ message }}</span>
        </div>
      </transition>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '@/modules/wishlist/infrastructure/bootstrap/types';
import type { WishlistPresenter } from '../presenters/wishlist.presenter';

interface Props {
  placeholder?: string;
  buttonText?: string;
  submittingText?: string;
  variant?: 'default' | 'compact' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Enter your email to join the waitlist',
  buttonText: 'Join waitlist',
  submittingText: 'Joining...',
  variant: 'default'
});

const wishlistPresenter = container.get<WishlistPresenter>(TYPES.WishlistPresenter);

const email = ref('');
const submitting = ref(false);
const message = ref('');
const success = ref(false);
const hasError = ref(false);

const isValidEmail = computed(() => {
  if (!email.value) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.value);
});

async function handleSubmit() {
  if (!email.value || submitting.value || !isValidEmail.value) return;

  submitting.value = true;
  message.value = '';
  hasError.value = false;

  const result = await wishlistPresenter.addToWishlist(email.value);

  if (result.success) {
    success.value = true;
    message.value = 'Thanks! We\'ll notify you when Validatey is ready.';
    email.value = '';
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      message.value = '';
      success.value = false;
    }, 5000);
  } else {
    success.value = false;
    hasError.value = true;
    message.value = result.error || 'Something went wrong. Please try again.';
  }

  submitting.value = false;
}
</script>

<style scoped>
.wishlist-widget {
  width: 100%;
}

.wishlist-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.wishlist-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: var(--border-width) var(--border-style) #d1d5db;
  border-radius: 0.5rem;
  background-color: white;
  color: #111827;
  font-size: 1rem;
  transition: all 0.2s ease;
  outline: none;
}

.wishlist-input::placeholder {
  color: #9ca3af;
}

.wishlist-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.wishlist-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f3f4f6;
}

.wishlist-input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.wishlist-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: #0d9488;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.wishlist-button:hover:not(:disabled) {
  background: #0f766e;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.wishlist-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.wishlist-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.wishlist-button.loading {
  background: #0f766e;
}

.button-text {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.button-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.button-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.wishlist-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  animation: slideDown 0.3s ease;
}

.wishlist-message.success {
  background-color: #d1fae5;
  color: #065f46;
  border: var(--border-width) var(--border-style) #86efac;
}

.wishlist-message.error {
  background-color: #fee2e2;
  color: #991b1b;
  border: var(--border-width) var(--border-style) #fca5a5;
}

.message-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s ease;
}

.message-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.message-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Variant styles */
.wishlist-widget[data-variant="compact"] .wishlist-input {
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
}

.wishlist-widget[data-variant="compact"] .wishlist-button {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  min-width: 120px;
}

.wishlist-widget[data-variant="large"] .wishlist-input {
  padding: 1rem 1.25rem;
  font-size: 1.125rem;
}

.wishlist-widget[data-variant="large"] .wishlist-button {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  min-width: 160px;
}

</style>
