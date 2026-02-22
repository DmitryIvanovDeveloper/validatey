import { test, expect } from '@playwright/test';

/**
 * Тест для новичка в валидации продукта
 * Симулирует полный путь пользователя от регистрации до завершения валидации
 */
test.describe('New User Validation Journey - UX Analysis', () => {
  test.setTimeout(600000); // 10 minutes timeout

  // Генерируем уникальный email для теста
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test('полный путь новичка через процесс валидации', async ({ page }) => {
    const observations: string[] = [];
    const issues: string[] = [];
    const positives: string[] = [];

    console.log('=== НАЧАЛО ПУТИ НОВИЧКА ===');
    console.log(`Email: ${testEmail}`);

    // ШАГ 1: Открытие приложения и поиск регистрации
    console.log('\n--- ШАГ 1: Открытие приложения ---');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`Текущий URL: ${currentUrl}`);

    // Проверяем, что мы на странице логина/регистрации
    if (currentUrl.includes('/login') || currentUrl === 'http://localhost:5173/') {
      positives.push('✓ Приложение сразу перенаправляет на страницу входа');
    } else {
      issues.push('✗ Неожиданная страница при первом открытии');
    }

    // Ищем переключатель регистрации
    const registerLink = page.locator('a, button').filter({ hasText: /Create account|Sign up|Register|Don't have/i });
    const registerLinkCount = await registerLink.count();
    
    if (registerLinkCount > 0) {
      console.log('Найден переключатель регистрации');
      await registerLink.first().click();
      await page.waitForTimeout(1000);
      positives.push('✓ Есть переключатель между входом и регистрацией');
    } else {
      // Проверяем, может быть уже в режиме регистрации
      const submitButton = page.locator('button[type="submit"]');
      const buttonText = await submitButton.textContent();
      if (buttonText?.includes('Create account')) {
        positives.push('✓ Уже в режиме регистрации');
      } else {
        issues.push('✗ Не найдена кнопка/ссылка для регистрации');
        console.log('⚠ Переключатель регистрации не найден, пробуем заполнить форму');
      }
    }

    // ШАГ 2: Регистрация
    console.log('\n--- ШАГ 2: Регистрация ---');
    
    // Заполняем форму регистрации
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);
    
    // Проверяем требования к паролю
    const passwordHint = page.locator('text=/at least|minimum|8 characters/i');
    if (await passwordHint.count() > 0) {
      positives.push('✓ Есть подсказка о требованиях к паролю');
    } else {
      issues.push('✗ Нет подсказки о требованиях к паролю (минимум 8 символов)');
    }

    // Ищем кнопку регистрации
    const submitButton = page.locator('button[type="submit"]');
    const buttonText = await submitButton.textContent();
    console.log(`Текст кнопки: ${buttonText}`);
    
    if (buttonText?.includes('Create account') || buttonText?.includes('Sign up')) {
      positives.push('✓ Кнопка регистрации понятно названа');
    } else {
      issues.push('✗ Непонятно, что кнопка для регистрации');
    }

    await submitButton.click();
    console.log('Кнопка регистрации нажата');

    // Ждем результат регистрации
    await page.waitForTimeout(3000);

    // Проверяем успешность регистрации
    const successMessage = page.locator('text=/check your email|email confirmation|success/i');
    const errorMessage = page.locator('.login-error, [role="alert"]');
    
    if (await successMessage.count() > 0) {
      const message = await successMessage.first().textContent();
      console.log(`Сообщение: ${message}`);
      positives.push('✓ Есть сообщение о необходимости подтверждения email');
      observations.push('⚠ Требуется подтверждение email перед входом');
    } else if (await errorMessage.count() > 0) {
      const error = await errorMessage.first().textContent();
      console.log(`Ошибка: ${error}`);
      issues.push(`✗ Ошибка при регистрации: ${error}`);
    } else {
      // Возможно, регистрация прошла успешно и произошел редирект
      await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 10000 });
      const newUrl = page.url();
      console.log(`Редирект после регистрации: ${newUrl}`);
      
      if (newUrl.includes('/workspaces')) {
        positives.push('✓ После регистрации автоматический вход и редирект в workspace');
      }
    }

    // Если требуется подтверждение email, симулируем вход после подтверждения
    // (в реальном сценарии пользователь подтверждает email и возвращается)
    if (page.url().includes('/login')) {
      console.log('\n--- Симуляция входа после подтверждения email ---');
      
      // Пробуем войти (предполагая, что email уже подтвержден)
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      
      const signInButton = page.locator('button[type="submit"]');
      await signInButton.click();
      await page.waitForTimeout(3000);
    }

    // ШАГ 3: Первый вход и создание workspace
    console.log('\n--- ШАГ 3: Первый вход ---');
    await page.waitForURL((url) => url.toString().includes('/workspaces') || url.toString().includes('/projects'), { timeout: 15000 });
    
    const workspaceUrl = page.url();
    console.log(`URL после входа: ${workspaceUrl}`);

    if (workspaceUrl.includes('/workspaces')) {
      positives.push('✓ После входа попадаем в список workspace');
      
      // Проверяем, есть ли подсказка о создании workspace
      const createWorkspaceButton = page.locator('button, a').filter({ hasText: /Create|New|Add/i });
      const createWorkspaceCount = await createWorkspaceButton.count();
      
      if (createWorkspaceCount > 0) {
        positives.push('✓ Есть кнопка для создания workspace');
        console.log('Найдена кнопка создания workspace');
      } else {
        issues.push('✗ Не найдена кнопка создания workspace');
      }

      // Если workspace пустой, создаем новый
      const emptyState = page.locator('text=/no workspaces|create your first|get started/i');
      if (await emptyState.count() > 0) {
        positives.push('✓ Есть понятное сообщение для пустого состояния');
        observations.push('ℹ Пользователь видит пустое состояние - нужно создать workspace');
      }
    } else {
      issues.push('✗ Неожиданный редирект после входа');
    }

    // ШАГ 4: Создание проекта (Project Wizard)
    console.log('\n--- ШАГ 4: Создание проекта ---');
    
    // Ищем кнопку создания проекта
    const createProjectButton = page.locator('button, a').filter({ hasText: /Create project|New project|Add project/i });
    
    if (await createProjectButton.count() === 0) {
      // Может быть, нужно сначала создать workspace
      const createWorkspaceBtn = page.locator('button, a').filter({ hasText: /Create workspace|New workspace/i });
      if (await createWorkspaceBtn.count() > 0) {
        console.log('Создаем workspace сначала...');
        await createWorkspaceBtn.first().click();
        await page.waitForTimeout(2000);
        
        const workspaceNameInput = page.locator('input[placeholder*="workspace"], input[placeholder*="name"]').first();
        if (await workspaceNameInput.count() > 0) {
          await workspaceNameInput.fill('Test Workspace');
          const saveWorkspaceBtn = page.locator('button').filter({ hasText: /Create|Save|Submit/i }).first();
          await saveWorkspaceBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // Теперь ищем кнопку создания проекта
    await page.waitForTimeout(2000);
    const createProjectBtn = page.locator('button, a').filter({ hasText: /Create project|New project|Add project/i });
    
    if (await createProjectBtn.count() > 0) {
      positives.push('✓ Найдена кнопка создания проекта');
      console.log('Нажимаем "Create project"');
      await createProjectBtn.first().click();
      await page.waitForTimeout(2000);
    } else {
      issues.push('✗ Не найдена кнопка создания проекта');
      // Пробуем прямой переход
      await page.goto('http://localhost:5173/workspaces/test-workspace/projects/new');
      await page.waitForTimeout(2000);
    }

    // ШАГ 5: Прохождение Project Wizard
    console.log('\n--- ШАГ 5: Project Wizard ---');
    
    const wizardUrl = page.url();
    console.log(`URL Wizard: ${wizardUrl}`);

    if (wizardUrl.includes('/projects/new') || wizardUrl.includes('/wizard')) {
      positives.push('✓ Открылся Project Wizard');
      
      // Шаг 1: Who & What?
      console.log('Шаг 1: Who & What?');
      const step1Title = page.locator('h1, h2, h3').filter({ hasText: /Who|What|Project name/i });
      if (await step1Title.count() > 0) {
        positives.push('✓ Первый шаг понятно назван');
      }

      // Заполняем название проекта
      const projectNameInput = page.locator('input[placeholder*="project"], input[placeholder*="name"], input[type="text"]').first();
      if (await projectNameInput.count() > 0) {
        await projectNameInput.fill('My Test Product');
        positives.push('✓ Поле названия проекта найдено и заполнено');
      } else {
        issues.push('✗ Не найдено поле названия проекта');
      }

      // Ищем кнопку "Next" или "Continue"
      const nextButton = page.locator('button').filter({ hasText: /Next|Continue|Далее/i });
      if (await nextButton.count() > 0) {
        await nextButton.first().click();
        await page.waitForTimeout(2000);
        positives.push('✓ Есть кнопка перехода к следующему шагу');
      } else {
        issues.push('✗ Не найдена кнопка "Next" в wizard');
      }

      // Шаг 2: Scenarios for Survey
      console.log('Шаг 2: Scenarios for Survey');
      const step2Title = page.locator('h1, h2, h3').filter({ hasText: /Scenario|Survey|Question/i });
      if (await step2Title.count() > 0) {
        positives.push('✓ Второй шаг понятно назван');
      }

      // Заполняем сценарий (если есть поле)
      const scenarioInput = page.locator('textarea, input').filter({ hasText: /scenario|question|description/i }).first();
      if (await scenarioInput.count() > 0) {
        await scenarioInput.fill('I want to validate if people need this product');
        positives.push('✓ Поле сценария найдено');
      }

      // Переходим дальше
      const nextButton2 = page.locator('button').filter({ hasText: /Next|Continue|Create|Finish/i });
      if (await nextButton2.count() > 0) {
        await nextButton2.first().click();
        await page.waitForTimeout(3000);
      }

      // Шаг 3: Проверяем, что проект создан
      const projectUrl = page.url();
      console.log(`URL после создания проекта: ${projectUrl}`);
      
      if (projectUrl.includes('/projects/') && !projectUrl.includes('/new')) {
        positives.push('✓ Проект успешно создан, редирект на страницу проекта');
      }
    } else {
      issues.push('✗ Project Wizard не открылся');
    }

    // ШАГ 6: Обзор проекта и понимание следующих шагов
    console.log('\n--- ШАГ 6: Обзор проекта ---');
    
    if (page.url().includes('/projects/')) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Проверяем наличие подсказок и гайдов
      const guideWidget = page.locator('text=/How to|Guide|Overview|Getting started/i');
      if (await guideWidget.count() > 0) {
        positives.push('✓ Есть гайд/подсказки для новичков');
      } else {
        issues.push('✗ Нет гайда для новичков на странице проекта');
      }

      // Проверяем наличие кнопки "Start Research"
      const startResearchButton = page.locator('button').filter({ hasText: /Start Research|Research/i });
      if (await startResearchButton.count() > 0) {
        positives.push('✓ Есть кнопка "Start Research"');
        observations.push('ℹ Пользователь видит возможность начать исследование');
      } else {
        issues.push('✗ Не найдена кнопка "Start Research"');
      }

      // Проверяем наличие секций
      const sections = [
        'Executive Summary',
        'Key Assumptions',
        'Research Context',
        'Comment Pattern Analysis',
        'Decision Pathway'
      ];

      for (const section of sections) {
        const sectionElement = page.locator(`text=/${section}/i`);
        if (await sectionElement.count() > 0) {
          positives.push(`✓ Секция "${section}" присутствует`);
        } else {
          observations.push(`ℹ Секция "${section}" не видна (может быть скрыта или загружается)`);
        }
      }
    }

    // ШАГ 7: Проверяем вкладку Comments
    console.log('\n--- ШАГ 7: Вкладка Comments ---');
    
    const commentsTab = page.locator('button, a').filter({ hasText: /Comments|Комментарии/i });
    if (await commentsTab.count() > 0) {
      positives.push('✓ Есть вкладка Comments');
      await commentsTab.first().click();
      await page.waitForTimeout(2000);

      // Проверяем интерфейс сбора комментариев
      const redditInput = page.locator('input[placeholder*="Reddit"]');
      if (await redditInput.count() > 0) {
        positives.push('✓ Есть поле для добавления Reddit URL');
      }

      const fetchButton = page.locator('button').filter({ hasText: /Fetch|Collect|Get comments/i });
      if (await fetchButton.count() > 0) {
        positives.push('✓ Есть кнопка для сбора комментариев');
      } else {
        issues.push('✗ Не найдена кнопка сбора комментариев');
      }
    } else {
      issues.push('✗ Не найдена вкладка Comments');
    }

    // ФИНАЛЬНЫЙ ОТЧЕТ
    console.log('\n=== ФИНАЛЬНЫЙ ОТЧЕТ ===');
    console.log('\n✅ ЧТО УДОБНО И ПОНЯТНО:');
    positives.forEach(p => console.log(`  ${p}`));
    
    console.log('\n❌ ЧТО НЕ УДОБНО ИЛИ НЕПОНЯТНО:');
    issues.forEach(i => console.log(`  ${i}`));
    
    console.log('\n📝 НАБЛЮДЕНИЯ:');
    observations.forEach(o => console.log(`  ${o}`));

    // Сохраняем отчет в файл
    const report = {
      positives,
      issues,
      observations,
      timestamp: new Date().toISOString()
    };

    console.log('\n=== КОНЕЦ ОТЧЕТА ===');
  });
});
