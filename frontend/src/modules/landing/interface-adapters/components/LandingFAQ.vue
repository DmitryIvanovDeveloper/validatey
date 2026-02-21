<template>
  <section id="faq" class="faq-section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Frequently asked questions</h2>
        <p class="section-subtitle">
          Everything you need to know about Validatey
        </p>
      </div>

      <div class="faq-list">
        <div
          v-for="(faq, index) in faqs"
          :key="index"
          class="faq-item"
        >
          <button
            @click="toggleFaq(index)"
            class="faq-button"
          >
            <h3 class="faq-question">{{ faq.question }}</h3>
            <svg
              :class="['faq-icon', { 'faq-icon-open': openFaqs.includes(index) }]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            v-show="openFaqs.includes(index)"
            class="faq-answer"
          >
            {{ faq.answer }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const openFaqs = ref<number[]>([]);

const toggleFaq = (index: number) => {
  const idx = openFaqs.value.indexOf(index);
  if (idx > -1) {
    openFaqs.value.splice(idx, 1);
  } else {
    openFaqs.value.push(index);
  }
};

const faqs = [
  {
    question: 'How long does it take?',
    answer: 'Creating your validation page takes just 5 minutes. Once published, you\'ll typically start receiving responses within a few hours, with most projects collecting all responses within 2-3 days.'
  },
  {
    question: 'Where do respondents come from?',
    answer: 'Responses come from our growing community of makers, entrepreneurs, and early adopters who are actively looking to discover and provide feedback on new products. You can also share your validation page link anywhere to get additional targeted responses.'
  },
  {
    question: 'What if I only have an idea?',
    answer: 'Perfect! Problem Validation was built specifically for the idea stage. You don\'t need a prototype, mockups, or even a fully formed solution. Just describe the problem you want to solve and our structured interview process will help you validate if it\'s worth pursuing.'
  },
  {
    question: 'Can I use this for investor meetings?',
    answer: 'Absolutely. Every validation project generates a comprehensive, investor-ready report with key metrics, response analysis, and clear recommendations. Many founders have successfully used these reports to secure funding by demonstrating real market validation instead of just assumptions.'
  },
  {
    question: 'Do I need a finished product?',
    answer: 'No. Validatey is designed for every stage: from initial idea (Problem Validation), to prototype (Solution Validation), to pricing testing (Pricing Validation), to post-launch feedback (Survey). Start wherever you are in your journey.'
  },
  {
    question: 'How much does it cost?',
    answer: 'We offer a free tier to get you started with basic validation. Premium plans unlock more responses, advanced analytics, and priority support. No credit card required to create your first project.'
  },
  {
    question: 'What makes this different from Reddit or Product Hunt?',
    answer: 'Reddit and Product Hunt are great for visibility, but they give you opinions and upvotes, not structured data. Validatey gives you specific metrics: problem confirmation percentage, willingness to pay, feature priorities, and more. Plus, responses don\'t disappear after a few hours—your validation page stays active.'
  },
  {
    question: 'Can I export the data?',
    answer: 'Yes! All validation data can be exported in multiple formats (PDF, CSV, JSON) so you can use it in presentations, share with co-founders, or include in investor decks.'
  }
];
</script>

<style scoped>
.faq-section {
  padding-top: 5rem;
  padding-bottom: 5rem;
  background-color: #f9fafb;
}

.container {
  max-width: 896px;
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
  color: #111827;
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .section-title {
    font-size: 3rem;
  }
}

.section-subtitle {
  font-size: 1.25rem;
  color: #4b5563;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.faq-item:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

.faq-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.faq-question {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  padding-right: 1rem;
}

.faq-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.faq-icon-open {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 0 1.5rem 1.5rem 1.5rem;
  color: #4b5563;
  line-height: 1.6;
}
</style>
