export function createDashboardService(repository) {
  async function today() {
    return repository.getTodayStats();
  }

  return { today };
}
