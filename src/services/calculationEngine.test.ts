import { 
  calculateGapD0, 
  calculateAttainment, 
  calculateAttendanceRate, 
  calculateAvailableCapacityMinutes, 
  calculateCapacityUtilization, 
  calculatePaceRequired 
} from './calculationEngine';

export function runTests(): { total: number; passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      passed++;
    } else {
      errors.push(`Test failed: ${testName}`);
    }
  }

  // 1. GAP D0 Tests
  assert(calculateGapD0(4, 1) === 3, 'GAP D0 should be 3 when goal is 4 and booked is 1');
  assert(calculateGapD0(4, 4) === 0, 'GAP D0 should be 0 when goal is reached');
  assert(calculateGapD0(4, 6) === 0, 'GAP D0 should not be negative when exceeded');
  assert(calculateGapD0(0, 0) === 0, 'GAP D0 handles 0 goal gracefully');

  // 2. Attainment % Tests
  assert(calculateAttainment(2, 4) === 50, 'Attainment of 2 in 4 is 50%');
  assert(calculateAttainment(4, 4) === 100, 'Attainment of 4 in 4 is 100%');
  assert(calculateAttainment(0, 0) === 0, 'Attainment protects against divide by zero when goal is 0');

  // 3. Attendance Rate Tests
  assert(calculateAttendanceRate(3, 1, 0) === 75, 'Attendance 3 held out of 4 eligible is 75%');
  assert(calculateAttendanceRate(0, 0, 0) === 0, 'Attendance protects against divide by zero when no eligible meetings');

  // 4. Capacity & Utilization
  const capacity = calculateAvailableCapacityMinutes([], 9, 19, 60, 10);
  // (600 - 60) = 540. 540 - 10% (54) = 486 min
  assert(capacity === 486, `Capacity with 60m lunch and 10% safety margin should be 486min, got ${capacity}`);

  const utilNormal = calculateCapacityUtilization(200, 486);
  assert(utilNormal.status === 'CONFORTAVEL', '41% utilization should be CONFORTAVEL');

  const utilOverload = calculateCapacityUtilization(550, 486);
  assert(utilOverload.status === 'SOBRECARGA', '113% utilization should be SOBRECARGA');

  // 5. Pace Required
  const pace = calculatePaceRequired(3, 10, 19);
  // remaining hours = 9h. 3 / 9 = 0.3/h
  assert(pace === 0.3, `Pace required should be 0.3, got ${pace}`);

  return { total, passed, failed: errors.length, errors };
}

// Run immediately in node or test environment
const results = runTests();
console.log(`[Welucci Calculation Engine Tests] Passed: ${results.passed}/${results.total}`);
if (results.errors.length > 0) {
  console.error('Errors:', results.errors);
}
