import { test, expect, Page } from '@playwright/test';

/**
 * Setup common network intercepts for Supabase Auth and REST API.
 * This guarantees deterministic, lightning-fast E2E tests without
 * relying on an active internet connection or live database state.
 */
interface MockUserOptions {
  id: string;
  email: string;
  fullName: string;
  role: 'patient' | 'asha_worker';
}

async function setupSupabaseMocks(page: Page, user: MockUserOptions) {
  // 1. Mock Supabase Auth password login
  await page.route('**/auth/v1/token?grant_type=password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-jwt-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: user.id,
          aud: 'authenticated',
          role: 'authenticated',
          email: user.email,
          user_metadata: {
            full_name: user.fullName,
            role: user.role,
          },
        },
      }),
    });
  });

  // 2. Mock Supabase Profiles query for logged in user (single profile)
  await page.route(`**/rest/v1/profiles?*user_id=eq.${user.id}*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: `profile-${user.id}`,
        user_id: user.id,
        email: user.email,
        full_name: user.fullName,
        phone: '9876543210',
        role: user.role,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }),
    });
  });

  // 3. Mock ASHA profile if user is an ASHA worker
  if (user.role === 'asha_worker') {
    await page.route(`**/rest/v1/asha_profiles?*user_id=eq.${user.id}*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: `asha-${user.id}`,
          user_id: user.id,
          worker_id: 'ASHA-DEL-001',
          experience_years: 5,
          specialization: 'Maternal & Chronic Care',
          location: 'District 4 Primary Health Subcentre',
          qualification: 'Certified ANM / ASHA Lead',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        }),
      });
    });
  }
}

test.describe('Aarogya Sahayak Core Workflows', () => {

  // =========================================================================
  // WORKFLOW 1: Authentication Flow
  // =========================================================================
  test('1. Authentication Flow: User can view login form, enter credentials, and authenticate successfully', async ({ page }) => {
    const mockPatient: MockUserOptions = {
      id: 'patient-test-001',
      email: 'patient@aarogya.in',
      fullName: 'Aarav Patel',
      role: 'patient',
    };

    // Setup network mock
    await setupSupabaseMocks(page, mockPatient);

    // Mock initial vitals query for patient
    await page.route('**/rest/v1/vitals*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Mock reminders query for patient
    await page.route('**/rest/v1/reminders*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Navigate to root (unauthenticated state)
    await page.goto('/');

    // Verify application title and Auth card elements
    await expect(page.getByRole('heading', { name: /aarogya sahayak/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Sign Up' })).toBeVisible();

    // Fill in credentials
    await page.locator('#login-email').fill(mockPatient.email);
    await page.locator('#login-password').fill('TestSecurePassword123!');

    // Submit login form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify successful login transition to patient Home page
    await expect(
      page.getByRole('heading', { name: /your digital health companion/i })
    ).toBeVisible({ timeout: 10000 });
  });

  // =========================================================================
  // WORKFLOW 2: Patient Vitals Logging & Risk Assessment
  // =========================================================================
  test('2. Patient Vitals Logging: Log glucose & blood pressure, calculate AI risk score, and save vitals', async ({ page }) => {
    const mockPatient: MockUserOptions = {
      id: 'patient-test-002',
      email: 'aarav.vitals@aarogya.in',
      fullName: 'Aarav Patel',
      role: 'patient',
    };

    // Intercept Supabase Auth & profile
    await setupSupabaseMocks(page, mockPatient);

    // Mock initial empty vitals GET
    let vitalsDb: any[] = [];
    await page.route('**/rest/v1/vitals*', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        const createdVital = {
          id: `vital-mock-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...postData,
        };
        vitalsDb.push(createdVital);
        await route.fulfill({
          status: 201,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
          body: JSON.stringify(createdVital),
        });
      } else {
        await route.fulfill({
          status: 200,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
          body: JSON.stringify(vitalsDb),
        });
      }
    });

    // Mock reminders GET
    await page.route('**/rest/v1/reminders*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify([]),
      });
    });

    // Mock the ML Risk microservice endpoint
    await page.route('**/predict_risk*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({
          risk_level: 'high',
          risk_score: 85,
          clinical_flags: ['Hypertension Stage 2', 'Hyperglycemia'],
        }),
      });
    });

    // 1. Log in through UI
    await page.goto('/');
    await page.locator('#login-email').fill(mockPatient.email);
    await page.locator('#login-password').fill('TestSecurePassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for authentication and Home page layout
    await expect(
      page.getByRole('heading', { name: /your digital health companion/i })
    ).toBeVisible({ timeout: 10000 });

    // 2. Navigate to Vitals page via client-side routing
    await page.getByRole('link', { name: /vitals/i }).first().click();

    // Verify Vitals page header
    await expect(
      page.getByRole('heading', { name: /vitals & risk tracking|daily vitals tracking/i })
    ).toBeVisible({ timeout: 10000 });

    // Verify the "Log Daily Measurements" card is present
    await expect(page.getByText('Log Daily Measurements')).toBeVisible();

    // 3. Fill out vitals measurement form
    // High blood sugar & blood pressure to trigger High Risk
    await page.locator('#glucose').fill('185');
    await page.getByPlaceholder('Systolic (120)').fill('145');
    await page.getByPlaceholder('Diastolic (80)').fill('95');
    await page.locator('#weight').fill('70');

    // Verify estimated BMI is dynamically calculated and displayed
    await expect(page.getByText(/estimated bmi/i)).toBeVisible();

    // 4. Click "Save Vitals"
    const saveButton = page.getByRole('button', { name: 'Save Vitals' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // 5. Verify success toast notifications (Risk Analysis & Vitals Saved)
    await expect(
      page.getByText(/vitals logged successfully|vitals recorded|risk analysis complete|health risk estimated/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  // =========================================================================
  // WORKFLOW 3: ASHA Worker Dashboard & Clinical Triage
  // =========================================================================
  test('3. ASHA Worker Dashboard: View pending requests, active patients, and clinical triage badges', async ({ page }) => {
    const mockAshaWorker: MockUserOptions = {
      id: 'asha-worker-999',
      email: 'sunita.asha@health.gov.in',
      fullName: 'Sunita Sharma',
      role: 'asha_worker',
    };

    // Setup ASHA auth & profile mocks
    await setupSupabaseMocks(page, mockAshaWorker);

    // Mock patient requests (1 pending, 1 accepted)
    const mockRequests = [
      {
        id: 'req-pending-101',
        patient_id: 'patient-ramesh-01',
        asha_worker_id: mockAshaWorker.id,
        request_type: 'General Checkup',
        description: 'Feeling dizzy and weak lately',
        status: 'pending',
        created_at: '2026-10-15T10:00:00Z',
      },
      {
        id: 'req-accepted-202',
        patient_id: 'patient-sita-02',
        asha_worker_id: mockAshaWorker.id,
        request_type: 'Hypertension Follow-up',
        description: 'Routine blood pressure review',
        status: 'accepted',
        created_at: '2026-10-14T08:00:00Z',
      },
    ];

    await page.route(`**/rest/v1/patient_requests?*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRequests),
      });
    });

    // Mock patient profiles query for joined request patient info
    await page.route(`**/rest/v1/profiles?*user_id=in.*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            user_id: 'patient-ramesh-01',
            full_name: 'Ramesh Kumar',
            phone: '9876543210',
            email: 'ramesh@example.com',
          },
          {
            user_id: 'patient-sita-02',
            full_name: 'Sita Devi',
            phone: '9123456780',
            email: 'sita@example.com',
          },
        ]),
      });
    });

    // Mock latest vitals query for the accepted patient (Sita Devi: High Risk)
    await page.route(`**/rest/v1/vitals?*patient_id=in.*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'vital-sita-latest',
            patient_id: 'patient-sita-02',
            glucose: 195,
            systolic_bp: 152,
            diastolic_bp: 96,
            weight: 64,
            bmi: 25.1,
            risk_level: 'high',
            created_at: '2026-10-16T08:00:00Z',
          },
        ]),
      });
    });

    // 1. Log in as ASHA worker through UI
    await page.goto('/');
    await page.locator('#login-email').fill(mockAshaWorker.email);
    await page.locator('#login-password').fill('AshaSecure2026!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 2. Verify ASHA Dashboard header & verified badge
    await expect(
      page.getByRole('heading', { name: /asha patient monitoring dashboard/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Verified Worker')).toBeVisible();
    await expect(page.getByText('Sunita Sharma').first()).toBeVisible();

    // 3. Verify Operational StatCards counts
    // StatCard for Pending Requests (1)
    const pendingStatCard = page.locator('div').filter({ hasText: /^Pending Requests1/ }).first();
    await expect(pendingStatCard).toBeVisible();

    // StatCard for Active Patients (1)
    const activeStatCard = page.locator('div').filter({ hasText: /^Active Patients1/ }).first();
    await expect(activeStatCard).toBeVisible();

    // StatCard for High Risk Alerts (1)
    const highRiskStatCard = page.locator('div').filter({ hasText: /^High Risk Alerts1/ }).first();
    await expect(highRiskStatCard).toBeVisible();

    // 4. Verify Active Patients section displays Sita Devi with High Risk Alert
    await expect(page.getByText('Live Remote Vitals Monitoring')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sita Devi' })).toBeVisible();
    await expect(page.getByText('High Risk Alert', { exact: true })).toBeVisible();
    await expect(page.getByText(/195 mg\/dL/i)).toBeVisible();
    await expect(page.getByText(/152\/96/i)).toBeVisible();

    // 5. Verify Pending Requests tab and action buttons
    const pendingTabTrigger = page.getByRole('tab', { name: /pending/i });
    await pendingTabTrigger.click();

    await expect(page.getByRole('heading', { name: 'Pending Consultation Requests' })).toBeVisible();
    await expect(page.getByText('Ramesh Kumar')).toBeVisible();
    await expect(page.getByText('General Checkup')).toBeVisible();
    await expect(page.getByRole('button', { name: /accept/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /decline/i })).toBeVisible();
  });
});
