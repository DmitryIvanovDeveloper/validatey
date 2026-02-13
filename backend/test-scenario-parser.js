const { ScenarioParserService } = require('./dist/modules/surveys/domain/services/scenario-parser.service');

const scenarioContent = '{"questions":[{"id":"q_1","text":"Test question 1","type":"open","required":true},{"id":"q_2","text":"Test question 2","type":"scale","required":false}]}';

try {
  const questions = ScenarioParserService.parse(scenarioContent);
  console.log('Parsed questions:', questions.map(q => ({id: q.id, text: q.text})));
} catch (error) {
  console.error('Error:', error);
}