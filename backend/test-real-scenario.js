const { ScenarioParserService } = require('./dist/modules/surveys/domain/services/scenario-parser.service');

const realScenarioContent = '{"questions":[{"id":"q_1","text":"\\"In the last 3 months, how many times have you actively tried to get feedback on a business idea or feature from someone outside your immediate team or close friends?\\" (1 = Never, 5 = 6+ times)","type":"scale","required":true,"options":{"min":1,"max":5}},{"id":"q_2","text":"\\"The last time you sought feedback, roughly how many total hours did you spend finding and coordinating people to talk to?\\" (1 = Less than 1 hour, 5 = 16+ hours)","type":"scale","required":false,"options":{"min":1,"max":5}},{"id":"q_3","text":"When you need to find 5 target users for a quick interview, how difficult is it typically?\\" (1 = Trivial/I already know them, 5 = Extremely difficult/I rarely succeed)","type":"scale","required":false}]}';

try {
  const questions = ScenarioParserService.parse(realScenarioContent);
  console.log('Parsed questions count:', questions.length);
  console.log('First 3 questions:');
  questions.slice(0, 3).forEach(q => {
    console.log(`ID: ${q.id}, Text: ${q.text.substring(0, 50)}...`);
  });

  // Создаем labels как в коде
  const labels = {};
  questions.forEach(q => {
    labels[q.id] = q.text;
    const alt = q.id.startsWith('q_') ? q.id.replace('q_', 'q') : `q_${q.id.replace(/^q/, '')}`;
    if (alt !== q.id) labels[alt] = q.text;
  });

  console.log('\nLabels for q_1, q_2, q_3:');
  console.log('q_1:', labels['q_1']?.substring(0, 50) + '...');
  console.log('q_2:', labels['q_2']?.substring(0, 50) + '...');
  console.log('q_3:', labels['q_3']?.substring(0, 50) + '...');

} catch (error) {
  console.error('Error:', error);
}