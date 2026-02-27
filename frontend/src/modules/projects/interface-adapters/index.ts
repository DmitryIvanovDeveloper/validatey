/** Widgets — UI components that use presenter or project context; can be imported by other modules */
export { default as ProjectSettingsWidget } from './ui/widgets/ProjectSettingsWidget.vue';
export { default as SurveyPlatformsWidget } from './ui/widgets/SurveyPlatformsWidget.vue';

/** Atoms — minimal presentational building blocks */
export { default as AssumptionStatusBadge } from './ui/atoms/AssumptionStatusBadge.vue';

/** Molecules — compositions of atoms (no presenter) */
export { default as AssumptionCard } from './ui/molecules/AssumptionCard.vue';
export { default as DecisionPathwayStep } from './ui/molecules/DecisionPathwayStep.vue';
export { default as DecisionPathwayList } from './ui/molecules/DecisionPathwayList.vue';
export { default as KeyAssumptionsList } from './ui/molecules/KeyAssumptionsList.vue';
export { default as GuestPlaceholderCard } from './ui/molecules/GuestPlaceholderCard.vue';
export { default as JourneyRoundCard } from './ui/molecules/JourneyRoundCard.vue';
